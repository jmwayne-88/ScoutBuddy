"use server";

import { revalidatePath } from "next/cache";
import type { MenuStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canEditMenu, canReview, canSubmitMenu } from "@/lib/permissions";
import { menuHasEmptyOccasion } from "@/lib/validation";
import { requireString } from "@/lib/form-data";
import { classifyIngredientWithClaude } from "@/lib/ingredient-categorization";
import { withToast } from "@/lib/toast";

async function requireEditableMenu(menuId: string) {
  const actor = await getActor();
  const menu = await db.menu.findUniqueOrThrow({ where: { id: menuId } });
  if (!canEditMenu(actor, menu)) {
    throw new Error("You don't have permission to edit this menu.");
  }
  return menu;
}

async function bumpNotStarted(menuId: string, currentStatus: MenuStatus) {
  if (currentStatus === "NOT_STARTED") {
    await db.menu.update({ where: { id: menuId }, data: { status: "IN_PROGRESS" } });
  }
}

// REQ-12.11: classify once per distinct ingredient name, not once per row --
// reuse whatever category a prior ingredient of the same name (any dish, any
// menu, any patrol) already has before paying for a fresh classification call.
async function resolveIngredientCategory(name: string) {
  const trimmedName = name.trim();
  const cached = await db.ingredient.findFirst({
    where: { name: { equals: trimmedName, mode: "insensitive" }, category: { not: null } },
    select: { category: true },
  });
  return cached?.category ?? (await classifyIngredientWithClaude(trimmedName));
}

export async function updateNotes(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const menu = await requireEditableMenu(menuId);

  const nutritionNote = String(formData.get("nutritionNote") ?? "");
  const allergyNote = String(formData.get("allergyNote") ?? "");

  await db.menu.update({
    where: { id: menuId },
    data: { nutritionNote, allergyNote },
  });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Notes saved"));
}

export async function addDish(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const mealId = requireString(formData, "mealId");
  const name = requireString(formData, "name");

  const menu = await requireEditableMenu(menuId);

  const meal = await db.meal.findFirst({ where: { id: mealId, menuId } });
  if (!meal) throw new Error("That meal occasion doesn't belong to this menu.");

  await db.dish.create({ data: { mealId, name } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Dish added"));
}

export async function renameDish(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const dishId = requireString(formData, "dishId");
  const name = requireString(formData, "name");

  const menu = await requireEditableMenu(menuId);

  const dish = await db.dish.findFirst({ where: { id: dishId, meal: { menuId } } });
  if (!dish) throw new Error("That dish doesn't belong to this menu.");

  await db.dish.update({ where: { id: dishId }, data: { name } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Dish renamed"));
}

export async function removeDish(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const dishId = requireString(formData, "dishId");

  const menu = await requireEditableMenu(menuId);

  const dish = await db.dish.findFirst({ where: { id: dishId, meal: { menuId } } });
  if (!dish) throw new Error("That dish doesn't belong to this menu.");

  await db.ingredient.deleteMany({ where: { dishId } });
  await db.dish.delete({ where: { id: dishId } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Dish removed"));
}

export async function addIngredient(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const dishId = requireString(formData, "dishId");
  const name = requireString(formData, "name");
  const quantity = requireString(formData, "quantity");

  const menu = await requireEditableMenu(menuId);

  const dish = await db.dish.findFirst({ where: { id: dishId, meal: { menuId } } });
  if (!dish) throw new Error("That dish doesn't belong to this menu.");

  const category = await resolveIngredientCategory(name);

  await db.ingredient.create({ data: { dishId, name, quantity, category } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Ingredient added"));
}

export async function editIngredient(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const ingredientId = requireString(formData, "ingredientId");
  const name = requireString(formData, "name");
  const quantity = requireString(formData, "quantity");

  const menu = await requireEditableMenu(menuId);

  const ingredient = await db.ingredient.findFirst({
    where: { id: ingredientId, dish: { meal: { menuId } } },
  });
  if (!ingredient) throw new Error("That ingredient doesn't belong to this menu.");

  // Only reclassify if the name actually changed -- a quantity-only edit
  // keeps the existing category rather than paying for a fresh lookup.
  const category =
    ingredient.name.trim().toLowerCase() === name.trim().toLowerCase()
      ? ingredient.category
      : await resolveIngredientCategory(name);

  await db.ingredient.update({ where: { id: ingredientId }, data: { name, quantity, category } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Ingredient updated"));
}

export async function removeIngredient(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const ingredientId = requireString(formData, "ingredientId");

  const menu = await requireEditableMenu(menuId);

  const ingredient = await db.ingredient.findFirst({
    where: { id: ingredientId, dish: { meal: { menuId } } },
  });
  if (!ingredient) throw new Error("That ingredient doesn't belong to this menu.");

  await db.ingredient.delete({ where: { id: ingredientId } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Ingredient removed"));
}

export async function submitMenu(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const actor = await getActor();
  const menu = await db.menu.findUniqueOrThrow({
    where: { id: menuId },
    include: { meals: { include: { dishes: true } } },
  });

  if (!canSubmitMenu(actor, menu)) {
    throw new Error("You don't have permission to submit this menu.");
  }

  if (menuHasEmptyOccasion(menu.meals)) {
    redirect(`/menus/${menuId}?error=empty-occasions`);
  }

  await db.menu.update({ where: { id: menuId }, data: { status: "SUBMITTED" } });
  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Menu submitted — nice work!"));
}

export async function approveMenu(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const actor = await getActor();
  const menu = await db.menu.findUniqueOrThrow({ where: { id: menuId } });

  if (!canReview(actor, menu)) {
    throw new Error("You don't have permission to review this menu.");
  }

  await db.$transaction([
    db.menu.update({ where: { id: menuId }, data: { status: "APPROVED" } }),
    db.review.create({ data: { menuId, decision: "APPROVED" } }),
  ]);

  revalidatePath(`/menus/${menuId}`);
  // REQ-13.4: approval is the end of the workflow, not a routine edit --
  // `celebrate` tells ToastListener to show a distinct, celebratory toast.
  redirect(withToast(`/menus/${menuId}`, "Menu approved!", { celebrate: true }));
}

export async function rejectMenu(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const comment = requireString(formData, "comment");
  const actor = await getActor();
  const menu = await db.menu.findUniqueOrThrow({ where: { id: menuId } });

  if (!canReview(actor, menu)) {
    throw new Error("You don't have permission to review this menu.");
  }

  await db.$transaction([
    db.menu.update({ where: { id: menuId }, data: { status: "CHANGES_REQUESTED" } }),
    db.review.create({ data: { menuId, decision: "CHANGES_REQUESTED", comment } }),
  ]);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Changes requested"));
}
