import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { MEAL_OCCASIONS, PATROLS, mealOccasionLabel, patrolLabel } from "@/lib/constants";
import { PatrolBadge } from "@/components/PatrolBadge";
import { assignMenu, removeOccasion, restoreOccasion } from "./actions";

export default async function CampoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();

  if (actor?.role !== "ASPL") {
    return (
      <p>
        You&apos;re not currently acting as the ASPL of Camping.{" "}
        <Link href="/" className="link">
          Switch role
        </Link>
      </p>
    );
  }

  const campout = await db.campout.findUnique({
    where: { id },
    include: { menus: true, mealFrameworkExceptions: { orderBy: { createdAt: "asc" } } },
  });

  if (!campout) notFound();

  const menuByPatrol = new Map(campout.menus.map((menu) => [menu.patrol, menu]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl">{campout.name}</h1>
        <p className="text-sm text-scout-gray">{campout.date.toDateString()}</p>
        <p className="text-sm">
          <Link href="/campouts" className="link">
            All campouts
          </Link>
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Patrol menus</h2>
        <ul className="space-y-2">
          {PATROLS.map((p) => {
            const menu = menuByPatrol.get(p.value);
            return (
              <li key={p.value} className="card p-3 flex items-center justify-between gap-3">
                <PatrolBadge patrol={p.value} />
                {menu ? (
                  <Link href={`/menus/${menu.id}`} className="text-sm link">
                    {menu.status.replace(/_/g, " ")} — due {menu.dueDate.toDateString()}
                  </Link>
                ) : (
                  <form action={assignMenu} className="flex items-end gap-2">
                    <input type="hidden" name="campoutId" value={campout.id} />
                    <input type="hidden" name="patrol" value={p.value} />
                    <input
                      name="dueDate"
                      type="date"
                      required
                      className="border border-scout-gray-pale rounded px-2 py-1 text-sm"
                    />
                    <button type="submit" className="text-sm link">
                      Assign menu
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3 border-t border-scout-gray-pale pt-4">
        <h2 className="font-medium">Meal framework for this campout</h2>
        {campout.mealFrameworkExceptions.length > 0 && (
          <ul className="space-y-1 text-sm">
            {campout.mealFrameworkExceptions.map((exception) => (
              <li key={exception.id} className="flex items-center gap-2">
                <span>
                  {mealOccasionLabel(exception.occasion)} removed for{" "}
                  {exception.patrol ? patrolLabel(exception.patrol) : "all patrols"}
                </span>
                <form action={restoreOccasion}>
                  <input type="hidden" name="exceptionId" value={exception.id} />
                  <button type="submit" className="link-muted">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={removeOccasion} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="campoutId" value={campout.id} />
          <div>
            <label className="block text-sm font-medium">Occasion</label>
            <select name="occasion" required className="border border-scout-gray-pale rounded px-2 py-1 text-sm">
              {MEAL_OCCASIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">For</label>
            <select name="scope" required className="border border-scout-gray-pale rounded px-2 py-1 text-sm">
              <option value="ALL">All patrols</option>
              {PATROLS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-secondary text-sm">
            Remove occasion
          </button>
        </form>
      </section>
    </div>
  );
}
