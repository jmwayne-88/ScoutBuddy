import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { passkey } from "@better-auth/passkey";
import { magicLink } from "better-auth/plugins/magic-link";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { sendMagicLinkEmail } from "./email";
import { hashInvitationToken, invitationState, INVITATION_STATE_MESSAGES } from "./invitations";

// REQ-31.1: replaces ADR 0010's cookie-only Actor with real accounts and
// server-side sessions. See ADR 0033 for the full design rationale.
// REQ-32: the magic-link request/verify flow built for REQ-31.3's
// bootstrap tier is also this app's account-recovery mechanism -- the
// additions below (token invalidation on re-request, other-session
// revocation on successful verify) are Requirement 32's, layered onto the
// same plugin rather than a separate recovery flow.

const MAGIC_LINK_WINDOW_MS = 5 * 60 * 1000;
const MAGIC_LINK_MAX_PER_ACCOUNT = 3;

// REQ-32.3: Verification rows the magic-link plugin creates are keyed
// `magic-link:${token}` (the token itself is part of the identifier), so
// there's no stable "this email's current link" key to look up directly --
// match by the identifier prefix, then parse each row's JSON `value`
// ({type, email, name}) to find the ones for this specific email.
async function invalidateOutstandingMagicLinks(email: string): Promise<void> {
  const pending = await db.verification.findMany({
    where: { identifier: { startsWith: "magic-link:" } },
    select: { id: true, value: true },
  });
  const staleIds = pending
    .filter((row) => {
      try {
        return (JSON.parse(row.value) as { email?: string }).email === email;
      } catch {
        return false;
      }
    })
    .map((row) => row.id);
  if (staleIds.length > 0) {
    await db.verification.deleteMany({ where: { id: { in: staleIds } } });
  }
}

// REQ-34.5: signup is invite-only. The passkey form on /invite/[token]
// passes the person's name and the invitation token through as `context`;
// there's no longer any way to create an account by declaring a role.
type InviteSignupContext = {
  name: string;
  invitationToken: string;
};

function parseInviteSignupContext(raw: string | null | undefined): InviteSignupContext {
  if (!raw) {
    throw new APIError("BAD_REQUEST", { message: "ScoutBuddy is invite-only. Open the invitation link you were sent." });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new APIError("BAD_REQUEST", { message: "Could not read signup details." });
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new APIError("BAD_REQUEST", { message: "Could not read signup details." });
  }
  const { name, invitationToken } = parsed as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "") {
    throw new APIError("BAD_REQUEST", { message: "A name is required." });
  }
  if (typeof invitationToken !== "string" || invitationToken === "") {
    throw new APIError("BAD_REQUEST", { message: "ScoutBuddy is invite-only. Open the invitation link you were sent." });
  }
  return { name: name.trim(), invitationToken };
}

// Checked twice -- once before the browser's passkey prompt (resolveUser,
// so a dead link fails fast) and again after the passkey is verified
// (afterVerification, which is what actually consumes the invitation).
async function findAcceptableInvitation(token: string) {
  const invitation = await db.unitInvitation.findUnique({ where: { tokenHash: hashInvitationToken(token) } });
  if (!invitation) {
    throw new APIError("BAD_REQUEST", { message: "That invitation link isn't valid." });
  }
  const state = invitationState(invitation, new Date());
  if (state !== "pending") {
    throw new APIError("BAD_REQUEST", { message: INVITATION_STATE_MESSAGES[state] });
  }
  // REQ-34.6: a youth (Patrol Leader) invitation must go through
  // Requirement 33's adult-mediated path, which isn't built -- new Patrol
  // Leader sign-ups are paused (user decision, 2026-10-23). The invite form
  // can't create one; this is the defense-in-depth check.
  if (invitation.role !== "ASPL") {
    throw new APIError("BAD_REQUEST", { message: "Patrol Leader invitations aren't available yet." });
  }
  const existing = await db.user.findFirst({
    where: { email: { equals: invitation.email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) {
    throw new APIError("BAD_REQUEST", {
      message: `An account already uses ${invitation.email}. Sign in, then open your invitation link again.`,
    });
  }
  return invitation;
}

// Explicit, not left to request-origin inference -- Better Auth warns
// without it ("callbacks and redirects may not work correctly"). Vercel
// provides VERCEL_URL automatically in every deployed environment
// (production and preview alike); BETTER_AUTH_URL is only needed to
// override that (e.g. a custom production domain) or for local dev.
export const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(db, { provider: "postgresql" }),

  // REQ-31.8: ASVS Level 2 / NIST IAL1 stated explicitly -- no real-world
  // identity proofing, self-asserted name only. See ADR 0033.
  // REQ-31.6/32.2: lib/session.ts's getSessionAssuranceTier() reads
  // createdVia. REQ-34.3: activeUnitId is read (and revalidated against real
  // memberships) by lib/session.ts on every request; only this app's own
  // server code writes it, never client input.
  session: {
    additionalFields: {
      createdVia: { type: "string", required: false, input: false },
      activeUnitId: { type: "string", required: false, input: false },
    },
  },

  // REQ-31.7: per-IP, every environment (not just production) -- this app's
  // whole user base is small enough that "production only" would leave
  // local/preview testing uncovered for something security-relevant.
  // "database" storage, not the default "memory" -- Vercel's serverless
  // functions don't share memory across invocations, so an in-memory
  // counter would silently do nothing in production.
  rateLimit: {
    enabled: true,
    storage: "database",
  },

  hooks: {
    // REQ-31.7's per-account half of rate limiting (the built-in rateLimit
    // option above only covers per-IP) -- scoped to magic-link requests
    // specifically, since that's the guessable-identifier vector REQ-31.7
    // is actually worried about. Passkey authentication has no equivalent
    // "guess the credential" surface (it requires possessing the private
    // key), so it isn't rate-limited per-account here. Doubles as REQ-31.10's
    // audit log for this event type -- one table, two jobs.
    //
    // Also REQ-32.3: invalidates any still-outstanding magic-link token for
    // this email before the new one is created -- the plugin's own
    // `/sign-in/magic-link` handler (node_modules/better-auth/dist/plugins/
    // magic-link/index.mjs, read directly rather than assumed) always
    // creates a fresh Verification row without ever touching a prior one,
    // so two requests in a row would otherwise leave two valid links alive
    // at once. Deleting first, not after, means by construction at most one
    // outstanding token can ever exist per email.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/magic-link") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : null;
      if (!email) return;

      const since = new Date(Date.now() - MAGIC_LINK_WINDOW_MS);
      const recentRequests = await db.authEvent.count({
        where: { type: "MAGIC_LINK_REQUESTED", identifier: email, createdAt: { gt: since } },
      });
      if (recentRequests >= MAGIC_LINK_MAX_PER_ACCOUNT) {
        throw new APIError("TOO_MANY_REQUESTS", {
          message: "Too many sign-in requests for this address. Try again in a few minutes.",
        });
      }

      await invalidateOutstandingMagicLinks(email);
      await db.authEvent.create({ data: { type: "MAGIC_LINK_REQUESTED", identifier: email } });
    }),
  },

  plugins: [
    passkey({
      rpName: "ScoutBuddy",
      registration: {
        // REQ-34.5 (superseding ADR 0033's self-service signup): the first
        // passkey is still how an account gets created -- there's no session
        // yet to register against -- but only from an invitation.
        //
        // resolveUser runs when the browser asks for registration options,
        // *before* the passkey prompt, so it only validates and reserves an
        // id; nothing is written. The account, its membership, and consuming
        // the invitation all happen in afterVerification, once the passkey
        // has actually been verified -- so cancelling the prompt leaves the
        // invitation usable and no half-made account behind.
        requireSession: false,
        resolveUser: async ({ context }) => {
          const signup = parseInviteSignupContext(context);
          await findAcceptableInvitation(signup.invitationToken);
          return { id: randomUUID(), name: signup.name };
        },
        afterVerification: async ({ user, context }) => {
          const existing = await db.user.findUnique({ where: { id: user.id }, select: { id: true } });
          if (existing) {
            // A signed-in account adding another passkey -- not a signup.
            await db.authEvent.create({ data: { type: "PASSKEY_REGISTERED", userId: user.id } });
            return;
          }

          const signup = parseInviteSignupContext(context);
          const invitation = await findAcceptableInvitation(signup.invitationToken);
          const now = new Date();

          await db.$transaction(async (tx) => {
            // Single use, enforced by the database rather than the read
            // above: only one of two racing acceptances can claim it.
            const claimed = await tx.unitInvitation.updateMany({
              where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
              data: { acceptedAt: now },
            });
            if (claimed.count !== 1) {
              throw new APIError("BAD_REQUEST", { message: INVITATION_STATE_MESSAGES.accepted });
            }
            // REQ-34.7: following the emailed link is what verified this
            // address, so the account starts out with it verified.
            await tx.user.create({
              data: { id: user.id, name: signup.name, email: invitation.email, emailVerified: true },
            });
            await tx.unitMembership.create({
              data: {
                userId: user.id,
                unitId: invitation.unitId,
                role: invitation.role,
                patrolId: invitation.patrolId,
                source: "INVITATION",
                invitationId: invitation.id,
              },
            });
            await tx.unitEvent.create({
              data: { unitId: invitation.unitId, type: "INVITATION_ACCEPTED", actorUserId: user.id, subjectUserId: user.id },
            });
          });

          await db.authEvent.createMany({
            data: [
              { type: "ACCOUNT_CREATED", userId: user.id },
              { type: "PASSKEY_REGISTERED", userId: user.id },
            ],
          });
          return { userId: user.id, name: signup.name };
        },
      },
      // Sign-in success (via passkey or magic link) is logged generically
      // by `databaseHooks.session.create.after` below -- every successful
      // authentication creates a session, regardless of which credential
      // method it came through, so one hook covers both.
    }),

    // REQ-31.3: bootstrap/recovery tier only, never a standing credential --
    // enforced here by disabling the sign-up-on-magic-link default, so a
    // magic link can only ever authenticate an account that already went
    // through passkey-based signup above, never create one on its own.
    magicLink({
      disableSignUp: true,
      expiresIn: 5 * 60,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail(email, url);
      },
    }),

    // Must be last -- auto-sets cookies from Server Actions/Route Handlers.
    nextCookies(),
  ],

  databaseHooks: {
    session: {
      create: {
        // REQ-31.6/32.2: tags the session with how it was established, the
        // only point this is knowable -- read back later by
        // lib/session.ts's getSessionAssuranceTier(). Anything other than
        // magic-link-verify is passkey in this app today (the only two
        // session-creating paths that exist); a future credential (e.g.
        // Requirement 39's OAuth) adds its own branch here rather than
        // falling into either existing bucket by default.
        before: async (session, context) => {
          const createdVia = context?.path === "/magic-link/verify" ? "magic-link" : "passkey";
          return { data: { ...session, createdVia } };
        },
        after: async (session, context) => {
          await db.authEvent.create({ data: { type: "SIGN_IN", userId: session.userId } });

          // REQ-32.4: a successful recovery invalidates every other active
          // session for the account -- magic link is this app's only
          // recovery credential (REQ-31.3: never a standing login method),
          // so *every* session this specific endpoint creates counts as a
          // completed recovery, not just some special case of it.
          if (context?.path === "/magic-link/verify") {
            const { count } = await db.session.deleteMany({
              where: { userId: session.userId, id: { not: session.id } },
            });
            if (count > 0) {
              await db.authEvent.create({ data: { type: "OTHER_SESSIONS_REVOKED", userId: session.userId } });
            }
          }
        },
      },
    },
  },
});
