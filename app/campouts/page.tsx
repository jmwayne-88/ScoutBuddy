import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";

export default async function CampoutsIndexPage() {
  const actor = await getActor();
  if (actor?.role !== "ASPL") return null;

  const first = await db.campout.findFirst({ orderBy: { date: "asc" } });
  redirect(first ? `/campouts/${first.id}` : "/campouts/new");
}
