import { describe, expect, it } from "vitest";
import { campoutProgress, menuDishCount, menuStatusColor } from "./progress";
import type { MenuStatus } from "@prisma/client";

describe("menuStatusColor", () => {
  it("returns a distinct color for each of the five statuses", () => {
    const statuses: MenuStatus[] = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "SUBMITTED",
      "CHANGES_REQUESTED",
      "APPROVED",
    ];
    const colors = new Set(statuses.map((s) => menuStatusColor(s).bg));
    expect(colors.size).toBe(5);
  });
});

describe("campoutProgress", () => {
  it("computes approved/total and percent as approved-out-of-4", () => {
    const p = campoutProgress(["APPROVED", "IN_PROGRESS", "NOT_STARTED", "NOT_STARTED"]);
    expect(p.approved).toBe(1);
    expect(p.total).toBe(4);
    expect(p.percent).toBe(25);
  });

  it("prioritizes Changes Requested in the label over other states", () => {
    const p = campoutProgress(["APPROVED", "SUBMITTED", "CHANGES_REQUESTED", "NOT_STARTED"]);
    expect(p.label).toBe("1 Needs Revision");
  });

  it("falls back to Awaiting Review when there's a Submitted menu but no Changes Requested", () => {
    const p = campoutProgress(["APPROVED", "SUBMITTED", "SUBMITTED", "NOT_STARTED"]);
    expect(p.label).toBe("2 Awaiting Review");
  });

  it("reports All Approved when every patrol is approved", () => {
    const p = campoutProgress(["APPROVED", "APPROVED", "APPROVED", "APPROVED"]);
    expect(p.label).toBe("All Approved");
    expect(p.percent).toBe(100);
  });

  it("reports Not Started when nothing has begun", () => {
    const p = campoutProgress(["NOT_STARTED", "NOT_STARTED", "NOT_STARTED", "NOT_STARTED"]);
    expect(p.label).toBe("Not Started");
    expect(p.percent).toBe(0);
  });

  it("reports In Progress once any menu has started but nothing needs attention", () => {
    const p = campoutProgress(["IN_PROGRESS", "NOT_STARTED", "NOT_STARTED", "NOT_STARTED"]);
    expect(p.label).toBe("In Progress");
  });
});

describe("menuDishCount", () => {
  it("sums dishes across all active occasions", () => {
    expect(menuDishCount([{ dishes: [{}, {}] }, { dishes: [{}] }, { dishes: [] }])).toBe(3);
  });

  it("is zero when there are no meals at all", () => {
    expect(menuDishCount([])).toBe(0);
  });
});
