import { describe, expect, it } from "vitest";
import {
  checkInvitationAcceptance,
  generateInvitationToken,
  hashInvitationToken,
  invitationState,
  isPlausibleEmail,
  normalizeEmail,
} from "./invitations";

const now = new Date("2026-10-23T12:00:00Z");
const later = new Date("2026-10-30T12:00:00Z");
const earlier = new Date("2026-10-20T12:00:00Z");

describe("invitation tokens", () => {
  it("stores only a hash that the token reproduces", () => {
    const { token, tokenHash } = generateInvitationToken();
    expect(tokenHash).not.toBe(token);
    expect(hashInvitationToken(token)).toBe(tokenHash);
  });

  it("generates a different token every time", () => {
    expect(generateInvitationToken().token).not.toBe(generateInvitationToken().token);
  });
});

describe("invitationState", () => {
  it("is pending until accepted, revoked, or expired", () => {
    expect(invitationState({ acceptedAt: null, revokedAt: null, expiresAt: later }, now)).toBe("pending");
    expect(invitationState({ acceptedAt: earlier, revokedAt: null, expiresAt: later }, now)).toBe("accepted");
    expect(invitationState({ acceptedAt: null, revokedAt: earlier, expiresAt: later }, now)).toBe("revoked");
    expect(invitationState({ acceptedAt: null, revokedAt: null, expiresAt: earlier }, now)).toBe("expired");
  });

  it("treats the exact expiry instant as expired", () => {
    expect(invitationState({ acceptedAt: null, revokedAt: null, expiresAt: now }, now)).toBe("expired");
  });
});

describe("checkInvitationAcceptance", () => {
  const base = {
    state: "pending" as const,
    invitationEmail: "Leader@Example.com",
    account: { email: null },
    emailBelongsToAnotherAccount: false,
    alreadyMember: false,
  };

  it("rejects an invitation that isn't pending", () => {
    for (const state of ["accepted", "revoked", "expired"] as const) {
      expect(checkInvitationAcceptance({ ...base, state }).ok).toBe(false);
    }
  });

  it("accepts for an account with the invited email, ignoring case", () => {
    expect(checkInvitationAcceptance({ ...base, account: { email: "leader@example.com" } })).toEqual({ ok: true });
  });

  it("rejects an account with a different email", () => {
    const result = checkInvitationAcceptance({ ...base, account: { email: "someone@else.org" } });
    expect(result.ok).toBe(false);
  });

  it("accepts for an account with no email when nobody else uses the invited one", () => {
    expect(checkInvitationAcceptance(base)).toEqual({ ok: true });
  });

  it("rejects an account with no email when another account already uses the invited one", () => {
    expect(checkInvitationAcceptance({ ...base, emailBelongsToAnotherAccount: true }).ok).toBe(false);
  });

  it("rejects someone who's already a member", () => {
    expect(
      checkInvitationAcceptance({ ...base, account: { email: "leader@example.com" }, alreadyMember: true }).ok
    ).toBe(false);
  });
});

describe("email helpers", () => {
  it("normalizes case and whitespace", () => {
    expect(normalizeEmail("  Leader@Example.COM ")).toBe("leader@example.com");
  });

  it("catches obvious typos only", () => {
    expect(isPlausibleEmail("leader@example.com")).toBe(true);
    expect(isPlausibleEmail("leader@example")).toBe(false);
    expect(isPlausibleEmail("leader example.com")).toBe(false);
  });
});
