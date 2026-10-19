import type { CommentActivityAction, CommentActorRole, CommentTargetType } from "@prisma/client";

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
