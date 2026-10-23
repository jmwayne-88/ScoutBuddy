import { describe, expect, it } from "vitest";
import { mapMembershipToActor, mapSessionToAssuranceTier, resolveActiveMembership } from "./session";

describe("mapMembershipToActor", () => {
  it("returns null for no membership", () => {
    expect(mapMembershipToActor(null)).toBeNull();
    expect(mapMembershipToActor(undefined)).toBeNull();
  });

  it("maps an ASPL membership", () => {
    expect(mapMembershipToActor({ role: "ASPL", patrolId: null, unitId: "unit-a" })).toEqual({ role: "ASPL", unitId: "unit-a" });
  });

  it("maps a Patrol Leader membership", () => {
    expect(mapMembershipToActor({ role: "PATROL_LEADER", patrolId: "eagle", unitId: "unit-a" })).toEqual({
      role: "PATROL_LEADER",
      patrolId: "eagle",
      unitId: "unit-a",
    });
  });

  it("gives no access to a Patrol Leader whose patrol was deleted", () => {
    expect(mapMembershipToActor({ role: "PATROL_LEADER", patrolId: null, unitId: "unit-a" })).toBeNull();
  });

  it("treats an unrecognized role value as no access", () => {
    expect(mapMembershipToActor({ role: "SOMETHING_ELSE", patrolId: null, unitId: "unit-a" })).toBeNull();
  });
});

describe("resolveActiveMembership", () => {
  const unitA = { unitId: "unit-a", createdAt: new Date("2026-01-01") };
  const unitB = { unitId: "unit-b", createdAt: new Date("2026-02-01") };

  it("honors an active unit the person actually belongs to", () => {
    expect(resolveActiveMembership([unitA, unitB], "unit-b")).toBe(unitB);
  });

  it("never grants a tampered or stale unit -- falls back to the earliest real membership", () => {
    expect(resolveActiveMembership([unitB, unitA], "unit-someone-elses")).toBe(unitA);
  });

  it("re-resolves when the active unit is the one they were just removed from", () => {
    // unit-a removed: only unit-b remains, but the session still says unit-a.
    expect(resolveActiveMembership([unitB], "unit-a")).toBe(unitB);
  });

  it("picks the earliest membership when no active unit is set", () => {
    expect(resolveActiveMembership([unitB, unitA], null)).toBe(unitA);
  });

  it("resolves to nothing for a person with no memberships, whatever the session says", () => {
    expect(resolveActiveMembership([], "unit-a")).toBeNull();
    expect(resolveActiveMembership([], null)).toBeNull();
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
