"use server";

import { revalidatePath } from "next/cache";
import type { IngredientCategory, MenuStatus } from "@prisma/client";
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

  const dish = await db.dish.findFirst({
    where: { id: dishId, meal: { menuId } },
    include: { ingredients: true },
  });
  if (!dish) throw new Error("That dish doesn't belong to this menu.");

  // REQ-15.1-15.3: removing a dish is a Tier 2 destructive action -- it
  // executes immediately (no confirm dialog) but captures a full snapshot
  // of what's being destroyed (the dish and all its ingredients) so the
  // toast's Undo button can re-create it exactly, not just an empty dish.
  const snapshot = {
    menuId,
    mealId: dish.mealId,
    name: dish.name,
    ingredients: dish.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, category: i.category ?? "" })),
  };

  await db.ingredient.deleteMany({ where: { dishId } });
  await db.dish.delete({ where: { id: dishId } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Dish removed", { undo: { action: "removeDish", payload: snapshot } }));
}

// REQ-15.3: reverses removeDish -- a real, server-verified re-insertion
// (re-checks edit permission; fails gracefully if the meal occasion itself
// is gone by the time Undo is pressed), not a client-only illusion.
export async function undoRemoveDish(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const mealId = requireString(formData, "mealId");
  const name = requireString(formData, "name");
  const ingredients = JSON.parse(requireString(formData, "ingredients")) as {
    name: string;
    quantity: string;
    category: string;
  }[];

  const menu = await requireEditableMenu(menuId);

  const meal = await db.meal.findFirst({ where: { id: mealId, menuId } });
  if (!meal) {
    redirect(withToast(`/menus/${menuId}`, "Couldn't undo — that meal occasion no longer exists."));
  }

  await db.dish.create({
    data: {
      mealId,
      name,
      ingredients: {
        create: ingredients.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          category: (i.category || null) as IngredientCategory | null,
        })),
      },
    },
  });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Dish restored"));
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

  // REQ-15.1-15.3: Tier 2 -- executes immediately, but snapshots what's
  // removed so Undo can restore it exactly.
  const snapshot = {
    menuId,
    dishId: ingredient.dishId,
    name: ingredient.name,
    quantity: ingredient.quantity,
    category: ingredient.category ?? "",
  };

  await db.ingredient.delete({ where: { id: ingredientId } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(
    withToast(`/menus/${menuId}`, "Ingredient removed", { undo: { action: "removeIngredient", payload: snapshot } })
  );
}

// REQ-15.3: reverses removeIngredient -- re-verifies edit permission and
// that the parent dish still exists before re-inserting, rather than
// trusting the client-supplied snapshot blindly.
export async function undoRemoveIngredient(formData: FormData) {
  const menuId = requireString(formData, "menuId");
  const dishId = requireString(formData, "dishId");
  const name = requireString(formData, "name");
  const quantity = requireString(formData, "quantity");
  const categoryRaw = String(formData.get("category") ?? "");
  const category = (categoryRaw || null) as IngredientCategory | null;

  const menu = await requireEditableMenu(menuId);

  const dish = await db.dish.findFirst({ where: { id: dishId, meal: { menuId } } });
  if (!dish) {
    redirect(withToast(`/menus/${menuId}`, "Couldn't undo — that dish no longer exists."));
  }

  await db.ingredient.create({ data: { dishId, name, quantity, category } });
  await bumpNotStarted(menuId, menu.status);

  revalidatePath(`/menus/${menuId}`);
  redirect(withToast(`/menus/${menuId}`, "Ingredient restored"));
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

  // REQ-20.1: the menu page itself shows an inline note on each empty
  // occasion's card and disables the Submit button from that same data --
  // no round trip needed to discover this. This is the server-side
  // backstop for a request that bypasses the disabled button; it no-ops
  // back to the same page rather than redirecting through a `?error=`
  // query string.
  if (menuHasEmptyOccasion(menu.meals)) {
    redirect(`/menus/${menuId}`);
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
