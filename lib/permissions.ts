import type { MenuStatus } from "@prisma/client";
import type { Actor } from "./session";

export type MenuForPermissions = {
  patrolId: string;
  status: MenuStatus;
};

export function isASPL(actor: Actor | null): boolean {
  return actor?.role === "ASPL";
}

export function canCreateCampout(actor: Actor | null): boolean {
  return isASPL(actor);
}

// REQ-30.22: the bulk PDF/Excel upload flow is gated the same way as every
// other campout-authoring action -- ASPL only, never a Patrol Leader.
export function canUploadCampouts(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canAssignMenu(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canManageMealFramework(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canManagePatrols(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canManageCampoutRoster(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canEditMenu(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (actor?.role !== "PATROL_LEADER") return false;
  if (actor.patrolId !== menu.patrolId) return false;
  return menu.status !== "APPROVED";
}

export function canSubmitMenu(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (!canEditMenu(actor, menu)) return false;
  return menu.status !== "SUBMITTED" && menu.status !== "APPROVED";
}

export function canReview(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (!isASPL(actor)) return false;
  return menu.status === "SUBMITTED";
}

// REQ-26.1/26.10: the comment/annotation layer is available to the same
// two parties regardless of status -- unlike canEditMenu/canReview, no
// MenuStatus check here, since comment activity never drives the status
// lifecycle.
export function canCommentOnMenu(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (isASPL(actor)) return true;
  return actor?.role === "PATROL_LEADER" && actor.patrolId === menu.patrolId;
}

export type CommentForPermissions = {
  authorRole: "ASPL" | "PATROL_LEADER";
  authorPatrolId: string | null;
};

export function isCommentAuthor(actor: Actor | null, comment: CommentForPermissions): boolean {
  if (!actor) return false;
  if (actor.role === "ASPL") return comment.authorRole === "ASPL";
  return comment.authorRole === "PATROL_LEADER" && comment.authorPatrolId === actor.patrolId;
}

// REQ-26.5 (resolved Open Question): only the comment's own author may
// delete it -- not the other party, and not the ASPL overriding someone
// else's comment the way it can set Changes Requested/Approved.
export function canDeleteComment(
  actor: Actor | null,
  menu: MenuForPermissions,
  comment: CommentForPermissions
): boolean {
  return canCommentOnMenu(actor, menu) && isCommentAuthor(actor, comment);
}
