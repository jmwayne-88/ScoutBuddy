"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { setActor } from "@/lib/session";

export async function chooseRole(formData: FormData) {
  const value = formData.get("role");
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Choose a role to continue.");
  }

  if (value === "ASPL") {
    await setActor({ role: "ASPL" });
    redirect("/campouts");
  }

  const [, patrolId] = value.split(":");
  const patrol = await db.patrol.findFirst({ where: { id: patrolId, isActive: true } });
  if (!patrol) {
    throw new Error("That patrol isn't available to select.");
  }

  await setActor({ role: "PATROL_LEADER", patrolId: patrol.id });
  redirect("/patrol-leader");
}
