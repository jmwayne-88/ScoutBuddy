import { createHash, randomBytes } from "node:crypto";

// REQ-34.5/34.7: pure rules for unit invitations -- token handling, state,
// and who may accept. Database reads/writes live in the callers
// (app/(app)/unit/actions.ts, app/invite/[token]/actions.ts, lib/auth.ts's
// passkey signup); everything that decides yes/no lives here so it's
// unit-testable without a database. See ADR 0035.

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Deliberately loose -- the real check is that the invitee receives the
// email at all. This only catches obvious typos before one is sent.
export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Only the hash is ever stored. The token itself exists only in the emailed
// link, so a database read (or an invitation's id) is never enough to
// accept one -- the CVE-2026-53514 class REQ-34.7 names is "accept an
// invitation by obtaining its ID".
export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export type InvitationState = "pending" | "accepted" | "revoked" | "expired";

export function invitationState(
  invitation: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now: Date
): InvitationState {
  if (invitation.acceptedAt) return "accepted";
  if (invitation.revokedAt) return "revoked";
  if (invitation.expiresAt.getTime() <= now.getTime()) return "expired";
  return "pending";
}

export const INVITATION_STATE_MESSAGES: Record<Exclude<InvitationState, "pending">, string> = {
  accepted: "This invitation has already been used.",
  revoked: "This invitation was cancelled. Ask your unit's ASPL of Camping for a new one.",
  expired: "This invitation has expired. Ask your unit's ASPL of Camping for a new one.",
};

export type AcceptanceCheck = { ok: true } | { ok: false; reason: string };

// REQ-34.7: holding the token proves access to the invited inbox -- that's
// the email verification. On top of that, the invitation is email-bound:
// an already signed-in account can accept only if it has that same email,
// or has no email yet and nobody else's account uses it (in which case
// accepting gives the account that now-verified address).
export function checkInvitationAcceptance(input: {
  state: InvitationState;
  invitationEmail: string;
  account: { email: string | null };
  emailBelongsToAnotherAccount: boolean;
  alreadyMember: boolean;
}): AcceptanceCheck {
  if (input.state !== "pending") {
    return { ok: false, reason: INVITATION_STATE_MESSAGES[input.state] };
  }
  if (input.alreadyMember) {
    return { ok: false, reason: "You're already a member of this unit." };
  }
  const invited = normalizeEmail(input.invitationEmail);
  if (input.account.email !== null) {
    if (normalizeEmail(input.account.email) !== invited) {
      return {
        ok: false,
        reason: `This invitation was sent to ${input.invitationEmail}. Sign in with that account to accept it.`,
      };
    }
    return { ok: true };
  }
  if (input.emailBelongsToAnotherAccount) {
    return {
      ok: false,
      reason: `Another account already uses ${input.invitationEmail}. Sign in with that account to accept this invitation.`,
    };
  }
  return { ok: true };
}
