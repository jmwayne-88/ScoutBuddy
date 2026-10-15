"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canCreateCampout } from "@/lib/permissions";

function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

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

  const campout = await db.campout.create({
    data: {
      name: name.trim(),
      date: new Date(date),
      location: optionalString(formData, "location"),
      description: optionalString(formData, "description"),
      imageUrl: optionalString(formData, "imageUrl"),
    },
  });

  revalidatePath("/campouts");
  redirect(`/campouts/${campout.id}`);
}
