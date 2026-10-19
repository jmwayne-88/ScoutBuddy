import { describe, expect, it } from "vitest";
import {
  actorLabel,
  activityLine,
  groupNonMenuComments,
  nestReplies,
  targetSummary,
  unresolvedCountsByMenu,
  unresolvedThreadCount,
} from "./comments";

describe("actorLabel", () => {
  it("labels the ASPL and a patrol's Leader", () => {
    expect(actorLabel("ASPL", null)).toBe("the ASPL");
    expect(actorLabel("PATROL_LEADER", "Eagle Patrol")).toBe("Eagle Patrol Leader");
  });
});

describe("targetSummary", () => {
  it("describes each of the four comment targets", () => {
    expect(targetSummary("MENU", null)).toBe("the menu");
    expect(targetSummary("DISH", "Trail Stew")).toBe("Trail Stew (dish)");
    expect(targetSummary("INGREDIENT", "eggs")).toBe("eggs (ingredient)");
    expect(targetSummary("MEAL", "Saturday Dinner")).toBe("Saturday Dinner (meal)");
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

describe("unresolvedThreadCount", () => {
  it("counts only open root threads, never replies or resolved threads", () => {
    expect(
      unresolvedThreadCount([
        { parentId: null, status: "OPEN" },
        { parentId: "a", status: "OPEN" },
        { parentId: null, status: "OPEN" },
        { parentId: null, status: "RESOLVED" },
      ])
    ).toBe(2);
    expect(unresolvedThreadCount([])).toBe(0);
  });
});

describe("groupNonMenuComments", () => {
  const content = {
    body: "body",
    authorRole: "ASPL" as const,
    authorPatrolId: null as string | null,
    status: "OPEN" as const,
    assigneeRole: null as "ASPL" | "PATROL_LEADER" | null,
  };

  it("excludes MENU-targeted comments -- those stay in the pane's own composer/thread list", () => {
    const comments = [
      {
        id: "m1",
        parentId: null,
        createdAt: new Date("2026-01-01"),
        targetType: "MENU" as const,
        dishId: null,
        ingredientId: null,
        occasion: null,
        targetLabel: null,
        ...content,
      },
    ];
    expect(groupNonMenuComments(comments)).toEqual([]);
  });

  it("groups a dish's root and reply together, separately from another dish", () => {
    const comments = [
      { id: "d1-root", parentId: null, createdAt: new Date("2026-01-01"), targetType: "DISH" as const, dishId: "dish-1", ingredientId: null, occasion: null, targetLabel: "Trail Stew", ...content },
      { id: "d1-reply", parentId: "d1-root", createdAt: new Date("2026-01-02"), targetType: "DISH" as const, dishId: "dish-1", ingredientId: null, occasion: null, targetLabel: "Trail Stew", ...content },
      { id: "d2-root", parentId: null, createdAt: new Date("2026-01-03"), targetType: "DISH" as const, dishId: "dish-2", ingredientId: null, occasion: null, targetLabel: "Campfire Chili", ...content },
    ];
    const groups = groupNonMenuComments(comments);
    expect(groups).toHaveLength(2);
    const dish1 = groups.find((g) => g.targetLabel === "Trail Stew")!;
    expect(dish1.comments).toHaveLength(1);
    expect(dish1.comments[0].replies.map((r) => r.id)).toEqual(["d1-reply"]);
  });

  it("keeps a meal, a dish, and an ingredient of the same name in separate groups", () => {
    const comments = [
      { id: "meal-1", parentId: null, createdAt: new Date("2026-01-01"), targetType: "MEAL" as const, dishId: null, ingredientId: null, occasion: "SATURDAY_DINNER", targetLabel: "Saturday Dinner", ...content },
      { id: "dish-1", parentId: null, createdAt: new Date("2026-01-01"), targetType: "DISH" as const, dishId: "d1", ingredientId: null, occasion: null, targetLabel: "Trail Stew", ...content },
      { id: "ing-1", parentId: null, createdAt: new Date("2026-01-01"), targetType: "INGREDIENT" as const, dishId: null, ingredientId: "i1", occasion: null, targetLabel: "eggs", ...content },
    ];
    expect(groupNonMenuComments(comments)).toHaveLength(3);
  });

  it("orders groups by most recent activity (root or reply), newest first", () => {
    const comments = [
      { id: "old-root", parentId: null, createdAt: new Date("2026-01-01"), targetType: "DISH" as const, dishId: "old", ingredientId: null, occasion: null, targetLabel: "Old Dish", ...content },
      { id: "new-root", parentId: null, createdAt: new Date("2026-01-02"), targetType: "DISH" as const, dishId: "new", ingredientId: null, occasion: null, targetLabel: "New Dish", ...content },
      { id: "old-reply", parentId: "old-root", createdAt: new Date("2026-01-10"), targetType: "DISH" as const, dishId: "old", ingredientId: null, occasion: null, targetLabel: "Old Dish", ...content },
    ];
    // "Old Dish" was created first, but its reply is the most recent activity overall.
    expect(groupNonMenuComments(comments).map((g) => g.targetLabel)).toEqual(["Old Dish", "New Dish"]);
  });

  it("is empty for an empty list", () => {
    expect(groupNonMenuComments([])).toEqual([]);
  });
});

describe("unresolvedCountsByMenu", () => {
  it("groups the same open-root-thread count per menu", () => {
    const counts = unresolvedCountsByMenu([
      { menuId: "menu-1", parentId: null, status: "OPEN" },
      { menuId: "menu-1", parentId: "c1", status: "OPEN" }, // reply -- doesn't count
      { menuId: "menu-1", parentId: null, status: "RESOLVED" }, // resolved -- doesn't count
      { menuId: "menu-2", parentId: null, status: "OPEN" },
      { menuId: "menu-2", parentId: null, status: "OPEN" },
    ]);
    expect(counts.get("menu-1")).toBe(1);
    expect(counts.get("menu-2")).toBe(2);
  });

  it("omits a menu with no unresolved threads rather than storing zero", () => {
    const counts = unresolvedCountsByMenu([{ menuId: "menu-1", parentId: null, status: "RESOLVED" }]);
    expect(counts.has("menu-1")).toBe(false);
    expect(counts.get("menu-1") ?? 0).toBe(0);
  });

  it("is empty for an empty list", () => {
    expect(unresolvedCountsByMenu([]).size).toBe(0);
  });
});
