"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PatrolType } from "@prisma/client";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canManagePatrols } from "@/lib/permissions";
import { requireString } from "@/lib/form-data";
import { meetsContrast } from "@/lib/theme/contrast";
import { firstMondayOfMonthBefore } from "@/lib/dates";
import { MEAL_OCCASIONS } from "@/lib/constants";

function normalizeHex(value: string): string {
  const v = value.trim();
  return v.startsWith("#") ? v : `#${v}`;
}

// REQ-8.17 / Open Decision 6 (confirmed: block, don't just warn): a color
// that can't pass WCAG 4.5:1 text contrast against either black or white is
// rejected outright, using the same real contrast utility lib/theme/
// contrast.ts's own tests hold the rest of the theme to — not the rougher
// heuristic in lib/colors.ts, which only picks a text color, never validates one.
//
// Verified by hand while testing this: the "neither passes" branch is
// actually unreachable for the 4.5:1 ("text") threshold specifically — the
// luminance range where black text passes (L >= 0.175) and where white text
// passes (L <= 0.1833) overlap, so every possible background color satisfies
// at least one. That's a real, checked property of the threshold (not true
// for a stricter one), not a mistake — this still correctly rejects
// malformed input (the regex check below), and documents *why* a visibly
// "bad" color like #808080 is nonetheless accepted: some text color always
// works for it at this threshold. lib/colors.ts's contrastText() picks
// between black/white at a luminance cutoff of 0.179, which sits inside
// that overlap — so it always lands on a passing choice.
function validateColor(color: string): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return "Enter a 6-digit hex color, e.g. #336699.";
  }
  const passesBlack = meetsContrast(color, "#000000", "text");
  const passesWhite = meetsContrast(color, "#ffffff", "text");
  if (!passesBlack && !passesWhite) {
    return "This color is too close in brightness to both black and white text to stay readable. Pick a different shade.";
  }
  return null;
}

export async function createPatrol(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const name = requireString(formData, "name");
  const color = normalizeHex(requireString(formData, "color"));
  const type = requireString(formData, "type") as PatrolType;
  const orderRaw = formData.get("order");
  const orderInput = typeof orderRaw === "string" ? orderRaw.trim() : "";

  const colorError = validateColor(color);
  if (colorError) {
    const params = new URLSearchParams({ error: colorError, name, type, order: orderInput });
    redirect(`/patrols/new?${params.toString()}`);
  }

  const maxOrder = await db.patrol.aggregate({ _max: { order: true } });
  const order = orderInput !== "" ? Number(orderInput) : (maxOrder._max.order ?? -1) + 1;

  const patrol = await db.patrol.create({ data: { name, color, type, order } });

  revalidatePath("/patrols");
  revalidatePath("/");
  redirect(`/patrols/${patrol.id}?prompt=assign`);
}

export async function updatePatrol(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const patrolId = requireString(formData, "patrolId");
  const name = requireString(formData, "name");
  const color = normalizeHex(requireString(formData, "color"));
  const type = requireString(formData, "type") as PatrolType;
  const order = Number(requireString(formData, "order"));

  const colorError = validateColor(color);
  if (colorError) {
    redirect(`/patrols/${patrolId}?error=${encodeURIComponent(colorError)}`);
  }

  await db.patrol.update({ where: { id: patrolId }, data: { name, color, type, order } });

  revalidatePath("/patrols");
  revalidatePath("/");
  revalidatePath("/campouts");
  redirect("/patrols");
}

export async function setPatrolActive(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const patrolId = requireString(formData, "patrolId");
  const isActive = requireString(formData, "isActive") === "true";

  await db.patrol.update({ where: { id: patrolId }, data: { isActive } });

  revalidatePath("/patrols");
  revalidatePath("/");
  revalidatePath("/campouts");

  // REQ-8.15: reactivating prompts a campout picker, rather than silently
  // flipping the flag.
  if (isActive) {
    redirect(`/patrols/${patrolId}?prompt=reactivate`);
  }
}

export async function deletePatrol(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const patrolId = requireString(formData, "patrolId");

  // REQ-8.12: a real cascade, not a DB-level ON DELETE CASCADE (consistent
  // with the manual-cascade style already used by removeOccasion/removeDish
  // — see ADR 0012). The confirmation that this is actually wanted already
  // happened client-side in DeletePatrolDialog before this action was ever
  // invoked (REQ-8.13).
  const menus = await db.menu.findMany({
    where: { patrolId },
    include: { meals: { include: { dishes: true } } },
  });

  for (const menu of menus) {
    const mealIds = menu.meals.map((m) => m.id);
    const dishIds = menu.meals.flatMap((m) => m.dishes.map((d) => d.id));
    if (dishIds.length > 0) {
      await db.ingredient.deleteMany({ where: { dishId: { in: dishIds } } });
      await db.dish.deleteMany({ where: { mealId: { in: mealIds } } });
    }
    await db.review.deleteMany({ where: { menuId: menu.id } });
    if (mealIds.length > 0) {
      await db.meal.deleteMany({ where: { id: { in: mealIds } } });
    }
  }
  await db.menu.deleteMany({ where: { patrolId } });
  await db.mealFrameworkException.deleteMany({ where: { patrolId } });
  await db.patrol.delete({ where: { id: patrolId } });

  revalidatePath("/patrols");
  revalidatePath("/");
  revalidatePath("/campouts");
  redirect("/patrols");
}

async function createMenusForPatrol(patrolId: string, campoutIds: string[]) {
  for (const campoutId of campoutIds) {
    const campout = await db.campout.findUnique({ where: { id: campoutId } });
    if (!campout) continue;

    const existing = await db.menu.findUnique({
      where: { campoutId_patrolId: { campoutId, patrolId } },
    });
    if (existing) continue;

    const exceptions = await db.mealFrameworkException.findMany({
      where: { campoutId, OR: [{ patrolId: null }, { patrolId }] },
    });
    const excludedOccasions = new Set(exceptions.map((e) => e.occasion));
    const activeOccasions = MEAL_OCCASIONS.filter((o) => !excludedOccasions.has(o.value));

    await db.menu.create({
      data: {
        campoutId,
        patrolId,
        dueDate: firstMondayOfMonthBefore(campout.date),
        meals: { create: activeOccasions.map((o) => ({ occasion: o.value })) },
      },
    });
  }
}

// REQ-8.10: the "yes" branch of the new-patrol prompt. Recomputes "future"
// at submit time, server-side — not from whatever the page happened to show
// when it was rendered.
export async function assignToFutureCampouts(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const patrolId = requireString(formData, "patrolId");
  const futureCampouts = await db.campout.findMany({
    where: { date: { gt: new Date() } },
    select: { id: true },
  });

  await createMenusForPatrol(patrolId, futureCampouts.map((c) => c.id));

  revalidatePath("/campouts");
  redirect(`/patrols/${patrolId}`);
}

// REQ-8.15: the reactivation campout picker's submit action.
export async function assignPatrolToCampouts(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const patrolId = requireString(formData, "patrolId");
  const campoutIds = formData.getAll("campoutId").map(String);

  await createMenusForPatrol(patrolId, campoutIds);

  revalidatePath("/campouts");
  redirect(`/patrols/${patrolId}`);
}

export async function movePatrol(formData: FormData) {
  const actor = await getActor();
  if (!canManagePatrols(actor)) {
    throw new Error("Only the ASPL of Camping can manage patrols.");
  }

  const patrolId = requireString(formData, "patrolId");
  const direction = requireString(formData, "direction");

  const all = await db.patrol.findMany({ orderBy: { order: "asc" } });
  const index = all.findIndex((p) => p.id === patrolId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return;

  const current = all[index];
  const swapWith = all[swapIndex];

  await db.$transaction([
    db.patrol.update({ where: { id: current.id }, data: { order: swapWith.order } }),
    db.patrol.update({ where: { id: swapWith.id }, data: { order: current.order } }),
  ]);

  revalidatePath("/patrols");
  revalidatePath("/");
  revalidatePath("/campouts");
}
