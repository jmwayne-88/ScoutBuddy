import { describe, expect, it } from "vitest";
import { actorLabel, activityLine, nestReplies, targetSummary } from "./comments";

describe("actorLabel", () => {
  it("labels the ASPL and a patrol's Leader", () => {
    expect(actorLabel("ASPL", null)).toBe("the ASPL");
    expect(actorLabel("PATROL_LEADER", "Eagle Patrol")).toBe("Eagle Patrol Leader");
  });
});

describe("targetSummary", () => {
  it("describes each of the three comment targets", () => {
    expect(targetSummary("MENU", null)).toBe("the menu");
    expect(targetSummary("DISH", "Trail Stew")).toBe("Trail Stew (dish)");
    expect(targetSummary("INGREDIENT", "eggs")).toBe("eggs (ingredient)");
  });
});

describe("activityLine", () => {
  it("builds a plain-language line per action", () => {
    expect(
      activityLine({
        actorRole: "ASPL",
        actorPatrolName: null,
        action: "RESOLVED",
        targetSummary: "Trail Stew (dish)",
        detail: null,
      })
    ).toBe("the ASPL resolved a comment on Trail Stew (dish)");

    expect(
      activityLine({
        actorRole: "PATROL_LEADER",
        actorPatrolName: "Eagle Patrol",
        action: "DELETED",
        targetSummary: "the menu",
        detail: null,
      })
    ).toBe("Eagle Patrol Leader deleted a comment on the menu");
  });

  it("appends the assignee for ASSIGNED/REASSIGNED when a detail is given", () => {
    expect(
      activityLine({
        actorRole: "ASPL",
        actorPatrolName: null,
        action: "ASSIGNED",
        targetSummary: "the menu",
        detail: "Eagle Patrol Leader",
      })
    ).toBe("the ASPL assigned a comment on the menu, assigned to Eagle Patrol Leader");
  });
});

describe("nestReplies", () => {
  const base = { authorRole: "ASPL" as const };

  it("groups replies under their root, both sorted oldest first", () => {
    const comments = [
      { id: "reply-2", parentId: "root-1", createdAt: new Date("2026-01-03"), ...base },
      { id: "root-2", parentId: null, createdAt: new Date("2026-01-02"), ...base },
      { id: "root-1", parentId: null, createdAt: new Date("2026-01-01"), ...base },
      { id: "reply-1", parentId: "root-1", createdAt: new Date("2026-01-02T12:00:00"), ...base },
    ];

    const nested = nestReplies(comments);

    expect(nested.map((r) => r.id)).toEqual(["root-1", "root-2"]);
    expect(nested[0].replies.map((r) => r.id)).toEqual(["reply-1", "reply-2"]);
    expect(nested[1].replies).toEqual([]);
  });

  it("drops an orphaned reply (its root already deleted/filtered out) instead of throwing", () => {
    const comments = [{ id: "reply-1", parentId: "missing-root", createdAt: new Date(), ...base }];
    expect(nestReplies(comments)).toEqual([]);
  });
});
