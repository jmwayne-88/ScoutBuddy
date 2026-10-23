import { redirect } from "next/navigation";
import { getUnitScope } from "@/lib/session";

export default async function CampoutsIndexPage() {
  const scope = await getUnitScope();
  if (scope?.actor.role !== "ASPL") return null;

  const first = await scope.db.campout.findFirst({ orderBy: { date: "asc" } });
  redirect(first ? `/campouts/${first.id}` : "/campouts/new");
}
