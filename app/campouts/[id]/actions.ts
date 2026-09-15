"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MealOccasion, Patrol } from "@prisma/client";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canAssignMenu, canManageMealFramework } from "@/lib/permissions";
import { MEAL_OCCASIONS } from "@/lib/constants";
import { requireString } from "@/lib/form-data";

export async function assignMenu(formData: FormData) {
  const actor = await getActor();
  if (!canAssignMenu(actor)) {
    throw new Error("Only the ASPL of Camping can assign a menu.");
  }

  const campoutId = requireString(formData, "campoutId");
  const patrol = requireString(formData, "patrol") as Patrol;
  const dueDate = requireString(formData, "dueDate");

  const exceptions = await db.mealFrameworkException.findMany({
    where: { campoutId, OR: [{ patrol: null }, { patrol }] },
  });
  const excludedOccasions = new Set(exceptions.map((e) => e.occasion));
  const activeOccasions = MEAL_OCCASIONS.filter((o) => !excludedOccasions.has(o.value));

  const menu = await db.menu.create({
    data: {
      campoutId,
      patrol,
      dueDate: new Date(dueDate),
      meals: {
        create: activeOccasions.map((o) => ({ occasion: o.value })),
      },
    },
  });

  revalidatePath(`/campouts/${campoutId}`);
  redirect(`/menus/${menu.id}`);
}

export async function removeOccasion(formData: FormData) {
  const actor = await getActor();
  if (!canManageMealFramework(actor)) {
    throw new Error("Only the ASPL of Camping can manage the meal framework.");
  }

  const campoutId = requireString(formData, "campoutId");
  const occasion = requireString(formData, "occasion") as MealOccasion;
  const scope = requireString(formData, "scope");
  const patrol = scope === "ALL" ? null : (scope as Patrol);

  await db.mealFrameworkException.deleteMany({ where: { campoutId, occasion, patrol } });
  await db.mealFrameworkException.create({ data: { campoutId, occasion, patrol } });

  const affectedMenus = await db.menu.findMany({
    where: { campoutId, ...(patrol ? { patrol } : {}) },
    include: { meals: { where: { occasion }, include: { dishes: true } } },
  });

  for (const menu of affectedMenus) {
    for (const meal of menu.meals) {
      const dishIds = meal.dishes.map((d) => d.id);
      if (dishIds.length > 0) {
        await db.ingredient.deleteMany({ where: { dishId: { in: dishIds } } });
        await db.dish.deleteMany({ where: { mealId: meal.id } });
      }
      await db.meal.delete({ where: { id: meal.id } });
    }
  }

  revalidatePath(`/campouts/${campoutId}`);
}

export async function restoreOccasion(formData: FormData) {
  const actor = await getActor();
  if (!canManageMealFramework(actor)) {
    throw new Error("Only the ASPL of Camping can manage the meal framework.");
  }

  const exceptionId = requireString(formData, "exceptionId");
  const exception = await db.mealFrameworkException.findUniqueOrThrow({ where: { id: exceptionId } });
  await db.mealFrameworkException.delete({ where: { id: exceptionId } });

  const candidateMenus = await db.menu.findMany({
    where: { campoutId: exception.campoutId, ...(exception.patrol ? { patrol: exception.patrol } : {}) },
    include: { meals: { where: { occasion: exception.occasion } } },
  });

  const remainingExceptions = await db.mealFrameworkException.findMany({
    where: { campoutId: exception.campoutId, occasion: exception.occasion },
  });

  for (const menu of candidateMenus) {
    const stillExcluded = remainingExceptions.some(
      (e) => e.patrol === null || e.patrol === menu.patrol
    );
    if (stillExcluded) continue;
    if (menu.meals.length === 0) {
      await db.meal.create({ data: { menuId: menu.id, occasion: exception.occasion } });
    }
  }

  revalidatePath(`/campouts/${exception.campoutId}`);
}
