import Link from "next/link";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { PATROLS, patrolLabel } from "@/lib/constants";
import { assignMenu, createCampout } from "./actions";

export default async function ASPLPage() {
  const actor = await getActor();

  if (actor?.role !== "ASPL") {
    return (
      <p>
        You&apos;re not currently acting as the ASPL of Camping.{" "}
        <Link href="/" className="underline">
          Switch role
        </Link>
      </p>
    );
  }

  const campout = await db.campout.findFirst({
    orderBy: { createdAt: "asc" },
    include: { menus: true },
  });

  if (!campout) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Create a campout</h1>
        <form action={createCampout} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Campout name</label>
            <input name="name" required className="border rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input name="date" type="date" required className="border rounded px-2 py-1 w-full" />
          </div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
            Create campout
          </button>
        </form>
      </div>
    );
  }

  const assignedPatrols = new Set(campout.menus.map((m) => m.patrol));
  const availablePatrols = PATROLS.filter((p) => !assignedPatrols.has(p.value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{campout.name}</h1>
        <p className="text-sm text-slate-600">{campout.date.toDateString()}</p>
      </div>

      <div className="space-y-2">
        <h2 className="font-medium">Patrol menus</h2>
        {campout.menus.length === 0 && (
          <p className="text-sm text-slate-600">No menus assigned yet.</p>
        )}
        <ul className="space-y-1">
          {campout.menus.map((menu) => (
            <li key={menu.id}>
              <Link href={`/menus/${menu.id}`} className="underline">
                {patrolLabel(menu.patrol)}
              </Link>{" "}
              — {menu.status.replace(/_/g, " ")} — due {menu.dueDate.toDateString()}
            </li>
          ))}
        </ul>
      </div>

      {availablePatrols.length > 0 && (
        <form action={assignMenu} className="space-y-3">
          <input type="hidden" name="campoutId" value={campout.id} />
          <div>
            <label className="block text-sm font-medium">Assign to patrol</label>
            <select name="patrol" required className="border rounded px-2 py-1 w-full">
              {availablePatrols.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Due date</label>
            <input name="dueDate" type="date" required className="border rounded px-2 py-1 w-full" />
          </div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
            Assign menu
          </button>
        </form>
      )}
    </div>
  );
}
