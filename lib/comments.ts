import type { CommentActivityAction, CommentActorRole, CommentStatus, CommentTargetType } from "@prisma/client";

// REQ-26.7: "ASPL" / "Eagle Patrol Leader" -- the same two parties
// `lib/permissions.ts`'s canCommentOnMenu scopes to. `patrolName` is the
// fixed troop name (e.g. "Eagle Patrol"), already including the word
// "Patrol", so this reads as "Eagle Patrol Leader" rather than doubling it.
export function actorLabel(role: CommentActorRole, patrolName: string | null): string {
  if (role === "ASPL") return "the ASPL";
  return `${patrolName ?? "the patrol's"} Leader`;
}

// REQ-26.7/29.6: "the menu" / "Trail Stew (dish)" / "eggs (ingredient)" /
// "Saturday Dinner (meal)" -- the same phrasing used for a live comment's
// target and for a frozen CommentActivity.targetSummary snapshot.
export function targetSummary(targetType: CommentTargetType, targetLabel: string | null): string {
  if (targetType === "MENU") return "the menu";
  if (targetType === "DISH") return `${targetLabel} (dish)`;
  if (targetType === "MEAL") return `${targetLabel} (meal)`;
  return `${targetLabel} (ingredient)`;
}

const ACTION_VERBS: Record<CommentActivityAction, string> = {
  CREATED: "started a comment",
  REPLIED: "replied to a comment",
  ASSIGNED: "assigned a comment",
  REASSIGNED: "reassigned a comment",
  RESOLVED: "resolved a comment",
  REOPENED: "reopened a comment",
  DELETED: "deleted a comment",
};

// REQ-26.7: one plain-language line per audit log row, e.g. "the ASPL
// resolved a comment on Trail Stew (dish)" or "Eagle Patrol Leader
// assigned a comment on the menu, assigned to the ASPL".
export function activityLine(entry: {
  actorRole: CommentActorRole;
  actorPatrolName: string | null;
  action: CommentActivityAction;
  targetSummary: string;
  detail: string | null;
}): string {
  const base = `${actorLabel(entry.actorRole, entry.actorPatrolName)} ${ACTION_VERBS[entry.action]} on ${entry.targetSummary}`;
  if ((entry.action === "ASSIGNED" || entry.action === "REASSIGNED") && entry.detail) {
    return `${base}, assigned to ${entry.detail}`;
  }
  return base;
}

export type CommentNode<T extends { id: string; parentId: string | null; createdAt: Date }> = T & {
  replies: T[];
};

// REQ-26.2: replies are flat under their root (one level, not reply-to-
// reply) -- this turns a flat, already-fetched list for one target into
// root comments each carrying their own oldest-first replies array.
export function nestReplies<T extends { id: string; parentId: string | null; createdAt: Date }>(
  comments: T[]
): CommentNode<T>[] {
  const roots: CommentNode<T>[] = [];
  const byId = new Map<string, CommentNode<T>>();

  for (const comment of comments) {
    if (comment.parentId) continue;
    const node: CommentNode<T> = { ...comment, replies: [] };
    byId.set(comment.id, node);
    roots.push(node);
  }

  for (const comment of comments) {
    if (!comment.parentId) continue;
    const parent = byId.get(comment.parentId);
    parent?.replies.push(comment);
  }

  for (const root of roots) {
    root.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  roots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return roots;
}

// REQ-28.2: the number on an area's comment badge -- open root threads
// only. Resolution is per-thread (resolveComment acts on a root), so a
// thread's replies never count separately, and a resolved thread no
// longer needs anyone's attention.
export function unresolvedThreadCount(comments: { parentId: string | null; status: "OPEN" | "RESOLVED" }[]): number {
  return comments.filter((c) => !c.parentId && c.status === "OPEN").length;
}

type TargetKeyed = {
  targetType: CommentTargetType;
  dishId: string | null;
  ingredientId: string | null;
  occasion: string | null;
  targetLabel: string | null;
};

// Structurally identical to components/CommentThread.tsx's CommentBase --
// duplicated here, not imported, so lib/ never depends on components/
// (the reverse of the app's usual import direction). Needed so a group's
// `.comments` come back typed richly enough for CommentPane to pass
// straight into <CommentThread root={...} />.
type CommentContent = {
  body: string;
  authorRole: CommentActorRole;
  authorPatrolId: string | null;
  status: CommentStatus;
  assigneeRole: CommentActorRole | null;
};

export type CommentGroup<T extends { id: string; parentId: string | null; createdAt: Date }> = {
  key: string;
  targetType: CommentTargetType;
  targetLabel: string | null;
  comments: CommentNode<T>[];
};

// The whole-menu "Menu comments" pane (components/CommentPane.tsx,
// variant="button") keeps its own composer/thread list for MENU-targeted
// comments, but also shows a read-through of every other thread on the
// menu -- every meal, dish, and ingredient comment -- so a reader doesn't
// have to open each one separately to see what's being discussed. Grouped
// by exact target (not just target type), since a reply inherits its
// root's target fields (comment-actions.ts's replyToComment) and needs to
// land in the same bucket as its root even though every target's comments
// arrive here as one flat, already-fetched list. A dish/ingredient/meal
// that's since been removed still has its comments grouped and shown here
// (same "still counts" rule unresolvedCountsByMenu follows) -- this is a
// read-through of the data, not a live join to the current menu layout.
export function groupNonMenuComments<
  T extends TargetKeyed & CommentContent & { id: string; parentId: string | null; createdAt: Date },
>(comments: T[]): CommentGroup<T>[] {
  const byKey = new Map<string, T[]>();
  for (const c of comments) {
    if (c.targetType === "MENU") continue;
    const key = `${c.targetType}:${c.dishId ?? c.ingredientId ?? c.occasion ?? ""}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.push(c);
    else byKey.set(key, [c]);
  }

  const groups = Array.from(byKey.entries()).map(([key, items]) => ({
    key,
    targetType: items[0].targetType,
    targetLabel: items[0].targetLabel,
    comments: nestReplies(items),
  }));

  // Most recently active thread first, so what's being talked about right
  // now surfaces above an old, quiet one.
  groups.sort((a, b) => {
    const latest = (g: typeof a) =>
      Math.max(0, ...g.comments.flatMap((c) => [c.createdAt.getTime(), ...c.replies.map((r) => r.createdAt.getTime())]));
    return latest(b) - latest(a);
  });

  return groups;
}

// REQ-29.9-29.11: the same "open root thread" definition as
// unresolvedThreadCount, grouped per menu -- shared by the ASPL's campout
// list (summed across a campout's menus, app/(app)/campouts/layout.tsx)
// and the Patrol Leader's own menu list (one menu per row,
// app/(app)/patrol-leader/page.tsx). A thread whose dish/ingredient/meal
// has since been removed still counts here, same as unresolvedThreadCount
// -- this only looks at menuId/parentId/status, never the target itself.
export function unresolvedCountsByMenu(
  comments: { menuId: string; parentId: string | null; status: "OPEN" | "RESOLVED" }[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of comments) {
    if (c.parentId !== null || c.status !== "OPEN") continue;
    counts.set(c.menuId, (counts.get(c.menuId) ?? 0) + 1);
  }
  return counts;
}
