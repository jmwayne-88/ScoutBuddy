"use server";

import { redirect } from "next/navigation";
import type { Patrol } from "@prisma/client";
import { setActor } from "@/lib/session";

export async function chooseRole(formData: FormData) {
  const value = formData.get("role");
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Choose a role to continue.");
  }

  if (value === "ASPL") {
    await setActor({ role: "ASPL" });
    redirect("/aspl");
  }

  const [, patrol] = value.split(":");
  await setActor({ role: "PATROL_LEADER", patrol: patrol as Patrol });
  redirect("/patrol-leader");
}
