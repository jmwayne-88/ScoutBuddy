import { describe, expect, it } from "vitest";
import {
  canAssignMenu,
  canCreateCampout,
  canEditMenu,
  canReview,
  canSubmitMenu,
  type MenuForPermissions,
} from "./permissions";
import type { Actor } from "./session";

const aspl: Actor = { role: "ASPL" };
const eagleLeader: Actor = { role: "PATROL_LEADER", patrol: "EAGLE" };
const pumaLeader: Actor = { role: "PATROL_LEADER", patrol: "PUMA" };

function menu(overrides: Partial<MenuForPermissions> = {}): MenuForPermissions {
  return { patrol: "EAGLE", status: "NOT_STARTED", ...overrides };
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

describe("canEditMenu", () => {
  it("allows only the matching patrol's Patrol Leader, and never once Approved", () => {
    expect(canEditMenu(eagleLeader, menu({ status: "NOT_STARTED" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "IN_PROGRESS" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "SUBMITTED" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "CHANGES_REQUESTED" }))).toBe(true);
    expect(canEditMenu(eagleLeader, menu({ status: "APPROVED" }))).toBe(false);
  });

  it("denies a Patrol Leader from a different patrol", () => {
    expect(canEditMenu(pumaLeader, menu({ patrol: "EAGLE" }))).toBe(false);
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
    expect(canReview(eagleLeader, menu({ patrol: "EAGLE", status: "SUBMITTED" }))).toBe(false);
    expect(canReview(pumaLeader, menu({ patrol: "EAGLE", status: "SUBMITTED" }))).toBe(false);
  });
});
