import type { MenuStatus, Patrol } from "@prisma/client";
import type { Actor } from "./session";

export type MenuForPermissions = {
  patrol: Patrol;
  status: MenuStatus;
};

export function isASPL(actor: Actor | null): boolean {
  return actor?.role === "ASPL";
}

export function canCreateCampout(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canAssignMenu(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canManageMealFramework(actor: Actor | null): boolean {
  return isASPL(actor);
}

export function canEditMenu(actor: Actor | null, menu: MenuForPermissions): boolean {
  if (actor?.role !== "PATROL_LEADER") return false;
  if (actor.patrol !== menu.patrol) return false;
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
