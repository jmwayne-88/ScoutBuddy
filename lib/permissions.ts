import type { MenuStatus } from "@prisma/client";
import type { Actor } from "./session";

export type MenuForPermissions = {
  patrolId: string;
  status: MenuStatus;
  unitId: string;
};

export function isASPL(actor: Actor | null): boolean {
  return actor?.role === "ASPL";
}

// REQ-27.11: the right role is necessary but not sufficient -- the
// resource must also belong to the unit the actor is acting in. Row-Level
// Security already keeps another unit's rows out of reach (ADR 0036); this
// is the application-level half of that defense in depth. The canX
// functions below without a resource (e.g. canCreateCampout) don't need it:
// what they create lands in the actor's own unit by construction.
export function inActorUnit(actor: Actor | null, resource: { unitId: string }): boolean {
  return !!actor && actor.unitId === resource.unitId;
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
  if (actor?.role !== "PATROL_LEADER" || !inActorUnit(actor, menu)) return false;
  if (actor.patrolId !== menu.patrolId) return false;
  return menu.status !== "APPROVED";
}

export function canSubmitMenu(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (!canEditMenu(actor, menu)) return false;
  return menu.status !== "SUBMITTED" && menu.status !== "APPROVED";
}

export function canReview(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (!isASPL(actor) || !inActorUnit(actor, menu)) return false;
  return menu.status === "SUBMITTED";
}

// REQ-26.1/26.10: the comment/annotation layer is available to the same
// two parties regardless of status -- unlike canEditMenu/canReview, no
// MenuStatus check here, since comment activity never drives the status
// lifecycle.
export function canCommentOnMenu(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (!inActorUnit(actor, menu)) return false;
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

// REQ-34.5/34.8: inviting people to the active unit, cancelling an
// invitation, and removing a member. ASPL for now -- the adult leader roles
// (Scoutmaster, Committee Chair, etc.) these will likely move to don't exist
// yet; that's the later permissions pass, not this requirement.
export function canManageUnitMembers(actor: Actor | null): boolean {
  return isASPL(actor);
}

// REQ-27.15: exporting or deleting the whole unit's data. The ASPL is the
// unit admin until a dedicated role exists (Requirement 27's Out of Scope).
export function canManageUnitData(actor: Actor | null): boolean {
  return isASPL(actor);
}
