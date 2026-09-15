import Link from "next/link";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { createCampout } from "./actions";

export default async function CampoutsPage() {
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

  const campouts = await db.campout.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Campouts</h1>
        {campouts.length === 0 ? (
          <p className="text-sm text-slate-600">No campouts yet — create the first one below.</p>
        ) : (
          <ul className="space-y-1">
            {campouts.map((campout) => (
              <li key={campout.id}>
                <Link href={`/campouts/${campout.id}`} className="underline">
                  {campout.name}
                </Link>{" "}
                — {campout.date.toDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-medium">Create a campout</h2>
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
    </div>
  );
}
