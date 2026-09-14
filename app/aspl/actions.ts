"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Patrol } from "@prisma/client";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canAssignMenu, canCreateCampout } from "@/lib/permissions";
import { MEAL_OCCASIONS } from "@/lib/constants";

export async function createCampout(formData: FormData) {
  const actor = await getActor();
  if (!canCreateCampout(actor)) {
    throw new Error("Only the ASPL of Camping can create a campout.");
  }

  const name = formData.get("name");
  const date = formData.get("date");
  if (typeof name !== "string" || name.trim() === "" || typeof date !== "string" || date === "") {
    throw new Error("A campout needs a name and a date.");
  }

  await db.campout.create({
    data: { name: name.trim(), date: new Date(date) },
  });

  revalidatePath("/aspl");
}

export async function assignMenu(formData: FormData) {
  const actor = await getActor();
  if (!canAssignMenu(actor)) {
    throw new Error("Only the ASPL of Camping can assign a menu.");
  }

  const campoutId = formData.get("campoutId");
  const patrol = formData.get("patrol");
  const dueDate = formData.get("dueDate");

  if (
    typeof campoutId !== "string" ||
    typeof patrol !== "string" ||
    typeof dueDate !== "string" ||
    dueDate === ""
  ) {
    throw new Error("Pick a patrol and a due date.");
  }

  const menu = await db.menu.create({
    data: {
      campoutId,
      patrol: patrol as Patrol,
      dueDate: new Date(dueDate),
      meals: {
        create: MEAL_OCCASIONS.map((o) => ({ occasion: o.value })),
      },
    },
  });

  revalidatePath("/aspl");
  redirect(`/menus/${menu.id}`);
}
