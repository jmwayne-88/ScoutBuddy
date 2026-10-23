import { describe, expect, it } from "vitest";
import {
  canAssignMenu,
  canCommentOnMenu,
  canCreateCampout,
  canDeleteComment,
  canEditMenu,
  canManageCampoutRoster,
  canManageUnitMembers,
  canReview,
  canSubmitMenu,
  canUploadCampouts,
  inActorUnit,
  isCommentAuthor,
  type CommentForPermissions,
  type MenuForPermissions,
} from "./permissions";
import type { Actor } from "./session";

const aspl: Actor = { role: "ASPL", unitId: "unit-a" };
const eagleLeader: Actor = { role: "PATROL_LEADER", patrolId: "eagle", unitId: "unit-a" };
const pumaLeader: Actor = { role: "PATROL_LEADER", patrolId: "puma", unitId: "unit-a" };

// REQ-27.11: the same roles, acting in a different unit. A patrol id can't
// actually repeat across units (ids are global), but the checks must hold
// on the unit alone, not lean on that.
const otherUnitAspl: Actor = { role: "ASPL", unitId: "unit-b" };
const otherUnitEagleLeader: Actor = { role: "PATROL_LEADER", patrolId: "eagle", unitId: "unit-b" };

function menu(overrides: Partial<MenuForPermissions> = {}): MenuForPermissions {
  return { patrolId: "eagle", status: "NOT_STARTED", unitId: "unit-a", ...overrides };
}

describe("canCreateCampout / canAssignMenu", () => {
  it("only the ASPL can create a campout or assign a menu", () => {
    expect(canCreateCampout(aspl)).toBe(true);
    expect(canCreateCampout(eagleLeader)).toBe(false);
    expect(canCreateCampout(null)).toBe(false);

    expect(canAssignMenu(aspl)).toBe(true);
    expect(canAssignMenu(eagleLeader)).toBe(false);
  });
});

describe("canUploadCampouts", () => {
  it("only the ASPL can upload campouts from a file", () => {
    expect(canUploadCampouts(aspl)).toBe(true);
    expect(canUploadCampouts(eagleLeader)).toBe(false);
    expect(canUploadCampouts(null)).toBe(false);
  });
});

describe("canManageCampoutRoster", () => {
  it("only the ASPL can add or remove a patrol from a specific campout", () => {
    expect(canManageCampoutRoster(aspl)).toBe(true);
    expect(canManageCampoutRoster(eagleLeader)).toBe(false);
    expect(canManageCampoutRoster(null)).toBe(false);
  });
});

describe("canEditMenu", () => {
  it("allows only the matching patrol's Patrol Leader, and never once Approved", () => {
    expect(canEditMenu(eagleLeader, menu({ status: "NOT_STARTED" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "IN_PROGRESS" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "SUBMITTED" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "CHANGES_REQUESTED" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "APPROVED" }))).toBe(false);
  });

  it("denies a Patrol Leader from a different patrol", () => {
    expect(canEditMenu(pumaLeader, menu({ patrolId: "eagle" }))).toBe(false);
  });

  it("denies the ASPL from editing dishes/ingredients directly", () => {
    expect(canEditMenu(aspl, menu())).toBe(false);
  });
});

describe("canSubmitMenu", () => {
  it("allows the owning Patrol Leader except when already Submitted or Approved", () => {
    expect(canSubmitMenu(eagleLeader, menu({ status: "NOT_STARTED" }))).toBe(true);
    expect(canSubmitMenu(eagleLeader, menu({ status: "IN_PROGRESS" }))).toBe(true);
    expect(canSubmitMenu(eagleLeader, menu({ status: "CHANGES_REQUESTED" }))).toBe(true);
    expect(canSubmitMenu(eagleLeader, menu({ status: "SUBMITTED" }))).toBe(false);
    expect(canSubmitMenu(eagleLeader, menu({ status: "APPROVED" }))).toBe(false);
  });

  it("never allows the ASPL to submit", () => {
    expect(canSubmitMenu(aspl, menu({ status: "IN_PROGRESS" }))).toBe(false);
  });
});

describe("canReview", () => {
  it("only the ASPL can review, and only a Submitted menu", () => {
    expect(canReview(aspl, menu({ status: "SUBMITTED" }))).toBe(true);
    expect(canReview(aspl, menu({ status: "IN_PROGRESS" }))).toBe(false);
    expect(canReview(aspl, menu({ status: "APPROVED" }))).toBe(false);
  });

  it("a Patrol Leader can never review their own or another patrol's menu", () => {
    expect(canReview(eagleLeader, menu({ patrolId: "eagle", status: "SUBMITTED" }))).toBe(false);
    expect(canReview(pumaLeader, menu({ patrolId: "eagle", status: "SUBMITTED" }))).toBe(false);
  });
});

describe("canCommentOnMenu", () => {
  it("allows the ASPL and the owning Patrol Leader regardless of status", () => {
    for (const status of ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED"] as const) {
      expect(canCommentOnMenu(aspl, menu({ status }))).toBe(true);
      expect(canCommentOnMenu(eagleLeader, menu({ status, patrolId: "eagle" }))).toBe(true);
    }
  });

  it("denies a Patrol Leader from a different patrol, and a signed-out viewer", () => {
    expect(canCommentOnMenu(pumaLeader, menu({ patrolId: "eagle" }))).toBe(false);
    expect(canCommentOnMenu(null, menu())).toBe(false);
  });
});

describe("isCommentAuthor / canDeleteComment", () => {
  const aspl_comment: CommentForPermissions = { authorRole: "ASPL", authorPatrolId: null };
  const eagle_comment: CommentForPermissions = { authorRole: "PATROL_LEADER", authorPatrolId: "eagle" };

  it("matches only the actor who actually authored the comment", () => {
    expect(isCommentAuthor(aspl, aspl_comment)).toBe(true);
    expect(isCommentAuthor(eagleLeader, aspl_comment)).toBe(false);
    expect(isCommentAuthor(eagleLeader, eagle_comment)).toBe(true);
    expect(isCommentAuthor(pumaLeader, eagle_comment)).toBe(false);
    expect(isCommentAuthor(aspl, eagle_comment)).toBe(false);
    expect(isCommentAuthor(null, eagle_comment)).toBe(false);
  });

  it("lets only the author delete, never the other party or the ASPL overriding", () => {
    expect(canDeleteComment(eagleLeader, menu({ patrolId: "eagle" }), eagle_comment)).toBe(true);
    expect(canDeleteComment(aspl, menu({ patrolId: "eagle" }), eagle_comment)).toBe(false);
    expect(canDeleteComment(pumaLeader, menu({ patrolId: "eagle" }), eagle_comment)).toBe(false);
    expect(canDeleteComment(eagleLeader, menu({ patrolId: "eagle" }), aspl_comment)).toBe(false);
  });
});

describe("unit boundary (REQ-27.11)", () => {
  it("rejects the right role acting in the wrong unit, for every menu-level check", () => {
    expect(canEditMenu(otherUnitEagleLeader, menu())).toBe(false);
    expect(canSubmitMenu(otherUnitEagleLeader, menu({ status: "IN_PROGRESS" }))).toBe(false);
    expect(canReview(otherUnitAspl, menu({ status: "SUBMITTED" }))).toBe(false);
    expect(canCommentOnMenu(otherUnitAspl, menu())).toBe(false);
    expect(canCommentOnMenu(otherUnitEagleLeader, menu())).toBe(false);
    expect(
      canDeleteComment(otherUnitEagleLeader, menu(), { authorRole: "PATROL_LEADER", authorPatrolId: "eagle" })
    ).toBe(false);
    expect(canDeleteComment(otherUnitAspl, menu(), { authorRole: "ASPL", authorPatrolId: null })).toBe(false);
  });

  it("inActorUnit compares units, and a signed-out viewer is in none", () => {
    expect(inActorUnit(aspl, { unitId: "unit-a" })).toBe(true);
    expect(inActorUnit(otherUnitAspl, { unitId: "unit-a" })).toBe(false);
    expect(inActorUnit(null, { unitId: "unit-a" })).toBe(false);
  });
});

describe("canManageUnitMembers", () => {
  it("only the ASPL can invite or remove unit members", () => {
    expect(canManageUnitMembers(aspl)).toBe(true);
    expect(canManageUnitMembers(eagleLeader)).toBe(false);
    expect(canManageUnitMembers(null)).toBe(false);
  });
});
