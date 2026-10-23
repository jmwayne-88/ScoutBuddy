import { describe, expect, it } from "vitest";
import { mapSessionToAssuranceTier, mapSessionUserToActor } from "./session";

describe("mapSessionUserToActor", () => {
  it("returns null for no user", () => {
    expect(mapSessionUserToActor(null)).toBeNull();
    expect(mapSessionUserToActor(undefined)).toBeNull();
  });

  it("maps an ASPL account", () => {
    expect(mapSessionUserToActor({ role: "ASPL", patrolId: null })).toEqual({ role: "ASPL" });
  });

  it("maps a Patrol Leader account", () => {
    expect(mapSessionUserToActor({ role: "PATROL_LEADER", patrolId: "eagle" })).toEqual({
      role: "PATROL_LEADER",
      patrolId: "eagle",
    });
  });

  it("treats a Patrol Leader account with no patrolId as signed-out", () => {
    expect(mapSessionUserToActor({ role: "PATROL_LEADER", patrolId: null })).toBeNull();
  });

  it("treats an account with no role (incomplete signup) as signed-out", () => {
    expect(mapSessionUserToActor({ role: null, patrolId: null })).toBeNull();
  });

  it("treats an unrecognized role value as signed-out", () => {
    expect(mapSessionUserToActor({ role: "SOMETHING_ELSE", patrolId: null })).toBeNull();
  });
});

describe("mapSessionToAssuranceTier", () => {
  it("treats a magic-link session as recovery tier", () => {
    expect(mapSessionToAssuranceTier({ createdVia: "magic-link" })).toBe("recovery");
  });

  it("treats a passkey session as passkey tier", () => {
    expect(mapSessionToAssuranceTier({ createdVia: "passkey" })).toBe("passkey");
  });

  it("fails closed to recovery tier for a missing or unrecognized value", () => {
    // Every session-creating path in this app sets createdVia explicitly
    // (lib/auth.ts's databaseHooks.session.create.before); null/undefined
    // only happens for a row that predates this field, or a future
    // credential type that doesn't set it -- treating that as the *lower*
    // bar is the fail-safe direction, since requireStepUp() then still
    // demands a fresh passkey challenge rather than silently trusting a
    // session of unknown strength.
    expect(mapSessionToAssuranceTier({ createdVia: null })).toBe("recovery");
    expect(mapSessionToAssuranceTier({ createdVia: "something-unrecognized" })).toBe("recovery");
    expect(mapSessionToAssuranceTier(null)).toBe("recovery");
  });
});
