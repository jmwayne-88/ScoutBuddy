import { headers as nextHeaders } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";

export type Actor =
  | { role: "ASPL" }
  | { role: "PATROL_LEADER"; patrolId: string };

// Pure and exported separately from getActor so this -- the part that's
// actually regression-prone (validating/narrowing an untrusted session
// user shape into Actor) -- can be unit-tested without a database or
// request context, same split as lib/campout-upload/extract-with-claude.ts's
// parseExtractionReply vs. extractCampoutsWithClaude.
export function mapSessionUserToActor(
  user: { role?: string | null; patrolId?: string | null } | null | undefined
): Actor | null {
  if (!user) return null;
  if (user.role === "ASPL") return { role: "ASPL" };
  if (user.role === "PATROL_LEADER" && typeof user.patrolId === "string") {
    return { role: "PATROL_LEADER", patrolId: user.patrolId };
  }
  // An account that exists but hasn't completed role selection shouldn't
  // happen under REQ-31's signup flow (role is required to create the
  // account at all -- see lib/auth.ts's resolveUser), but treat it as
  // signed-out defensively rather than crash permission checks downstream.
  return null;
}

// REQ-31.1/ADR 0033: Actor's shape is unchanged from ADR 0010's cookie-based
// version on purpose -- lib/permissions.ts and every Server Action that
// calls getActor() needed zero changes for this migration. Only how it's
// derived changed: a real server-side session (Better Auth) instead of a
// client-trusted cookie.
//
// `requestHeaders` is injectable (matching lib/db-environment-guard.ts's
// existing pattern of an optional parameter defaulting to the real runtime
// value) so tests can call this without needing next/headers' request
// context, which only exists inside an actual request.
export async function getActor(requestHeaders?: Headers): Promise<Actor | null> {
  const headers = requestHeaders ?? (await nextHeaders());
  const session = await auth.api.getSession({ headers });
  const actor = mapSessionUserToActor(session?.user ?? null);
  if (!actor) return null;

  if (actor.role === "PATROL_LEADER") {
    // A Patrol Leader's patrol may have been deleted (not just deactivated)
    // since their account was created. Deactivation alone doesn't invalidate
    // an already-active session (REQ-8.14) -- only deletion does.
    const stillExists = await db.patrol.findUnique({ where: { id: actor.patrolId } });
    if (!stillExists) return null;
  }

  return actor;
}

// REQ-31.6/32.2: "passkey" is standing, full assurance; "recovery" is the
// bootstrap/recovery tier every magic-link session gets (REQ-31.3: magic
// link is never a standing credential). No action in this app currently
// requires step-up (REQ-31.6's scope note: that's REQ-27/34/35's job once
// built), so nothing calls requireStepUp() yet -- it exists so those
// requirements have a real mechanism to call into rather than inventing
// their own.
export type AssuranceTier = "passkey" | "recovery";

// Pure, same reasoning as mapSessionUserToActor above. Fail-closed by
// construction: only an explicit "passkey" marker counts as the higher
// tier. A missing/unrecognized value (a row from before this field
// existed, or a future credential type that doesn't set it) falls through
// to "recovery" -- requireStepUp() below would then correctly still demand
// a fresh passkey challenge, rather than silently waving through a session
// this function doesn't actually know the strength of.
export function mapSessionToAssuranceTier(session: { createdVia?: string | null } | null | undefined): AssuranceTier {
  return session?.createdVia === "passkey" ? "passkey" : "recovery";
}

export async function getSessionAssuranceTier(requestHeaders?: Headers): Promise<AssuranceTier | null> {
  const headers = requestHeaders ?? (await nextHeaders());
  const result = await auth.api.getSession({ headers });
  if (!result?.session) return null;
  return mapSessionToAssuranceTier(result.session as { createdVia?: string | null });
}

export class StepUpRequiredError extends Error {
  constructor() {
    super("This action requires signing in with a passkey.");
  }
}

// Not called anywhere yet -- see the AssuranceTier comment above. A later
// requirement that marks an action "sensitive" calls this at the start of
// that Server Action.
export async function requireStepUp(requestHeaders?: Headers): Promise<void> {
  const tier = await getSessionAssuranceTier(requestHeaders);
  if (tier !== "passkey") {
    throw new StepUpRequiredError();
  }
}

export type CurrentUser = {
  id: string;
  name: string;
  actor: Actor;
};

// For the account-identity UI (components/AccountStatus.tsx) -- richer
// than Actor, which lib/permissions.ts intentionally keeps minimal.
export async function getCurrentUser(requestHeaders?: Headers): Promise<CurrentUser | null> {
  const headers = requestHeaders ?? (await nextHeaders());
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;

  const actor = await getActor(headers);
  if (!actor) return null;

  return { id: session.user.id, name: session.user.name, actor };
}
