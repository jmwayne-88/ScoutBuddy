import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MEAL_OCCASIONS, PATROLS, mealOccasionLabel, patrolLabel } from "@/lib/constants";
import { patrolBackground, contrastText } from "@/lib/colors";
import { campoutProgress, menuDishCount, menuStatusColor } from "@/lib/progress";
import { assignMenu, removeOccasion, restoreOccasion } from "./actions";

export default async function CampoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const campout = await db.campout.findUnique({
    where: { id },
    include: {
      menus: { include: { meals: { include: { dishes: true } } } },
      mealFrameworkExceptions: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!campout) notFound();

  const menuByPatrol = new Map(campout.menus.map((menu) => [menu.patrol, menu]));
  const progress = campoutProgress(campout.menus.map((m) => m.status));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative rounded-lg overflow-hidden h-48 flex items-end p-4 text-white"
        style={
          campout.imageUrl
            ? { backgroundImage: `url(${campout.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { backgroundColor: "#243e2c" }
        }
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <span className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium">
          {progress.approved}/{progress.total} approved
        </span>
        <div className="relative space-y-1">
          <h1 className="text-2xl">{campout.name}</h1>
          <p className="text-sm text-white/90">
            {campout.date.toDateString()}
            {campout.location && <> · {campout.location}</>}
          </p>
        </div>
      </div>

      {/* Progress */}
      <section className="card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>MENU PROGRESS</span>
          <span style={{ color: progress.dotColor }}>{progress.label}</span>
        </div>
        <div className="h-2 rounded bg-scout-tan-light overflow-hidden">
          <div
            className="h-full rounded"
            style={{ width: `${progress.percent}%`, backgroundColor: progress.dotColor }}
          />
        </div>
        <div className="text-right text-sm text-scout-gray">{progress.percent}%</div>
      </section>

      {campout.description && (
        <p className="border-l-4 border-scout-gray-pale pl-3 italic text-scout-gray">{campout.description}</p>
      )}

      {/* Patrol cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PATROLS.map((p) => {
          const menu = menuByPatrol.get(p.value);
          const background = patrolBackground(p.value);
          return (
            <div key={p.value} className="card overflow-hidden">
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: background, color: contrastText(background) }}
              >
                <span className="font-heading font-bold">{patrolLabel(p.value)}</span>
                {menu && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: menuStatusColor(menu.status).bg,
                      color: menuStatusColor(menu.status).text,
                    }}
                  >
                    {menu.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {menu ? (
                  <>
                    <p className="text-sm text-scout-gray">
                      Due {menu.dueDate.toDateString()} · {menuDishCount(menu.meals)} dishes planned
                    </p>
                    <Link href={`/menus/${menu.id}`} className="link text-sm">
                      View menu
                    </Link>
                  </>
                ) : (
                  <form action={assignMenu} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="campoutId" value={campout.id} />
                    <input type="hidden" name="patrol" value={p.value} />
                    <div>
                      <label className="block text-xs font-medium">Due date</label>
                      <input
                        name="dueDate"
                        type="date"
                        required
                        className="border border-scout-gray-pale rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <button type="submit" className="btn-primary text-sm">
                      Assign menu
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Meal framework exceptions */}
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
