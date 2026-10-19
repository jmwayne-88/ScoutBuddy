"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CommentActivityAction, CommentActorRole, CommentTargetType, MealOccasion } from "@prisma/client";
import { db } from "@/lib/db";
import { getActor, type Actor } from "@/lib/session";
import { canCommentOnMenu, canDeleteComment } from "@/lib/permissions";
import { requireString } from "@/lib/form-data";
import { actorLabel, targetSummary } from "@/lib/comments";
import { mealOccasionLabel } from "@/lib/constants";
import { withToast } from "@/lib/toast";

// REQ-29.13: posting, resolving, reopening, or deleting a thread changes
// an unresolved count shown outside the menu page itself -- the ASPL's
// campout list (its layout, shared across every /campouts/[id]) and the
// Patrol Leader's own menu list. Replying and assigning don't change any
// count, so they don't call this.
function revalidateCommentCountLists() {
  revalidatePath("/campouts", "layout");
  revalidatePath("/patrol-leader");
}

// REQ-26.1/26.10: available to the menu's owning Patrol Leader and the
// ASPL regardless of Menu.status -- see canCommentOnMenu.
async function requireCommentableMenu(menuId: string) {
  const actor = await getActor();
  const menu = await db.menu.findUniqueOrThrow({ where: { id: menuId }, include: { patrol: true } });
  if (!canCommentOnMenu(actor, menu)) {
    throw new Error("You don't have permission to comment on this menu.");
  }
  return { actor: actor as Actor, menu };
}

function actorFields(actor: Actor): { role: CommentActorRole; patrolId: string | null } {
  if (actor.role === "ASPL") return { role: "ASPL", patrolId: null };
  return { role: "PATROL_LEADER", patrolId: actor.patrolId };
}

// REQ-26.6: one append-only, immutable row per lifecycle event -- written
// alongside every mutation below, never edited or deleted afterward.
async function logActivity(params: {
  menuId: string;
  commentId: string;
  action: CommentActivityAction;
  actor: Actor;
  targetSummary: string;
  detail?: string | null;
}) {
  const { role, patrolId } = actorFields(params.actor);
  await db.commentActivity.create({
    data: {
      menuId: params.menuId,
      commentId: params.commentId,
      action: params.action,
      actorRole: role,
      actorPatrolId: patrolId,
      targetSummary: params.targetSummary,
      detail: params.detail ?? null,
    },
  });
}

// REQ-26.1: starts a new thread anchored to the menu, a dish, or an
// ingredient -- `target` is fixed per the composer's rendering context
// (see components/CommentThread.tsx), not a user choice on the form.
export async function addComment(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const target = requireString(formData, "target") as CommentTargetType;
  const body = requireString(formData, "body");
  const dishId = String(formData.get("dishId") ?? "") || null;
  const ingredientId = String(formData.get("ingredientId") ?? "") || null;
  const occasion = (String(formData.get("occasion") ?? "") || null) as MealOccasion | null;

  const { actor, menu } = await requireCommentableMenu(menuId);

  let resolvedDishId: string | null = null;
  let resolvedIngredientId: string | null = null;
  let resolvedOccasion: MealOccasion | null = null;
  let label: string | null = null;

  if (target === "DISH") {
    if (!dishId) throw new Error("Missing dish for this comment.");
    const dish = await db.dish.findFirst({ where: { id: dishId, meal: { menuId } } });
    if (!dish) throw new Error("That dish doesn't belong to this menu.");
    resolvedDishId = dish.id;
    label = dish.name;
  } else if (target === "INGREDIENT") {
    if (!ingredientId) throw new Error("Missing ingredient for this comment.");
    const ingredient = await db.ingredient.findFirst({ where: { id: ingredientId, dish: { meal: { menuId } } } });
    if (!ingredient) throw new Error("That ingredient doesn't belong to this menu.");
    resolvedIngredientId = ingredient.id;
    label = ingredient.name;
  } else if (target === "MEAL") {
    // REQ-29.3: the trigger only ever renders beside a currently-active
    // meal heading, so this requires the Meal row to exist right now --
    // unlike a reply (which inherits its root's occasion regardless of
    // whether the meal still exists, REQ-29.7).
    if (!occasion) throw new Error("Missing meal occasion for this comment.");
    const meal = await db.meal.findFirst({ where: { menuId, occasion } });
    if (!meal) throw new Error("That meal occasion isn't currently part of this menu.");
    resolvedOccasion = occasion;
    label = mealOccasionLabel(occasion);
  }

  const { role, patrolId } = actorFields(actor);

  const comment = await db.comment.create({
    data: {
      menuId,
      targetType: target,
      dishId: resolvedDishId,
      ingredientId: resolvedIngredientId,
      occasion: resolvedOccasion,
      targetLabel: label,
      body,
      authorRole: role,
      authorPatrolId: patrolId,
    },
  });

  await logActivity({
    menuId,
    commentId: comment.id,
    action: "CREATED",
    actor,
    targetSummary: targetSummary(target, label),
  });

  revalidatePath(`/menus/${menuId}`);
  revalidateCommentCountLists();
  redirect(withToast(`/menus/${menuId}`, "Comment added"));
}

// REQ-26.2: a flat reply under an existing root -- always inherits the
// parent's target (menu/dish/ingredient), never a client-supplied one.
export async function replyToComment(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const parentId = requireString(formData, "parentId");
  const body = requireString(formData, "body");

  const { actor } = await requireCommentableMenu(menuId);

  const parent = await db.comment.findFirst({ where: { id: parentId, menuId, deletedAt: null } });
  if (!parent) throw new Error("That comment no longer exists.");

  const { role, patrolId } = actorFields(actor);

  const reply = await db.comment.create({
    data: {
      menuId,
      targetType: parent.targetType,
      dishId: parent.dishId,
      ingredientId: parent.ingredientId,
      occasion: parent.occasion,
      targetLabel: parent.targetLabel,
      parentId: parent.id,
      body,
      authorRole: role,
      authorPatrolId: patrolId,
    },
  });

  await logActivity({
    menuId,
    commentId: reply.id,
    action: "REPLIED",
    actor,
    targetSummary: targetSummary(parent.targetType, parent.targetLabel),
  });

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Reply added"));
}

// REQ-26.3 (resolved Open Question): role-level assignment only -- "the
// ASPL" or "this patrol's Leader" -- no named-individual identity exists.
export async function assignComment(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const commentId = requireString(formData, "commentId");
  const assigneeRole = requireString(formData, "assigneeRole") as CommentActorRole;

  const { actor, menu } = await requireCommentableMenu(menuId);

  const comment = await db.comment.findFirst({ where: { id: commentId, menuId, deletedAt: null } });
  if (!comment) throw new Error("That comment no longer exists.");

  const assigneePatrolId = assigneeRole === "PATROL_LEADER" ? menu.patrolId : null;
  const action: CommentActivityAction = comment.assigneeRole ? "REASSIGNED" : "ASSIGNED";

  await db.comment.update({
    where: { id: commentId },
    data: { assigneeRole, assigneePatrolId },
  });

  await logActivity({
    menuId,
    commentId,
    action,
    actor,
    targetSummary: targetSummary(comment.targetType, comment.targetLabel),
    detail: actorLabel(assigneeRole, menu.patrol.name),
  });

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Comment assigned"));
}

// REQ-26.4 (resolved Open Question): resolving/reopening never deletes
// content -- a Resolved thread just collapses behind the "Show resolved"
// toggle in components/CommentThread.tsx.
async function setCommentStatus(
  formData: FormData,
  status: "OPEN" | "RESOLVED",
  action: "RESOLVED" | "REOPENED",
  toastMessage: string
) {
  const menuId = requireString(formData, "menuId");
  const commentId = requireString(formData, "commentId");

  const { actor } = await requireCommentableMenu(menuId);

  const comment = await db.comment.findFirst({ where: { id: commentId, menuId, deletedAt: null } });
  if (!comment) throw new Error("That comment no longer exists.");

  const { role, patrolId } = actorFields(actor);

  await db.comment.update({
    where: { id: commentId },
    data:
      status === "RESOLVED"
        ? { status, resolvedAt: new Date(), resolvedByRole: role, resolvedByPatrolId: patrolId }
        : { status, resolvedAt: null, resolvedByRole: null, resolvedByPatrolId: null },
  });

  await logActivity({
    menuId,
    commentId,
    action,
    actor,
    targetSummary: targetSummary(comment.targetType, comment.targetLabel),
  });

  revalidatePath(`/menus/${menuId}`);
  revalidateCommentCountLists();
  redirect(withToast(`/menus/${menuId}`, toastMessage));
}

export async function resolveComment(formData: FormData) {
  await setCommentStatus(formData, "RESOLVED", "RESOLVED", "Comment resolved");
}

export async function reopenComment(formData: FormData) {
  await setCommentStatus(formData, "OPEN", "REOPENED", "Comment reopened");
}

// REQ-26.5 (resolved Open Question): author-only, soft delete -- content
// and metadata survive for REQ-26.6's audit log even once it's gone from
// the live thread.
export async function deleteComment(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const commentId = requireString(formData, "commentId");

  const actor = await getActor();
  const menu = await db.menu.findUniqueOrThrow({ where: { id: menuId }, include: { patrol: true } });
  const comment = await db.comment.findFirst({ where: { id: commentId, menuId, deletedAt: null } });
  if (!comment) throw new Error("That comment no longer exists.");

  if (!canDeleteComment(actor, menu, comment)) {
    throw new Error("You don't have permission to delete this comment.");
  }
  const author = actor as Actor;

  const { role, patrolId } = actorFields(author);

  await db.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date(), deletedByRole: role, deletedByPatrolId: patrolId },
  });

  await logActivity({
    menuId,
    commentId,
    action: "DELETED",
    actor: author,
    targetSummary: targetSummary(comment.targetType, comment.targetLabel),
  });

  revalidatePath(`/menus/${menuId}`);
  revalidateCommentCountLists();
  redirect(withToast(`/menus/${menuId}`, "Comment deleted"));
}
