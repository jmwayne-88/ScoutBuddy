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
        <Link href="/" className="link">
          Switch role
        </Link>
      </p>
    );
  }

  const campouts = await db.campout.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-xl">Campouts</h1>
        {campouts.length === 0 ? (
          <p className="text-sm text-scout-gray">No campouts yet — create the first one below.</p>
        ) : (
          <ul className="space-y-1">
            {campouts.map((campout) => (
              <li key={campout.id}>
                <Link href={`/campouts/${campout.id}`} className="link">
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
            <input name="name" required className="border border-scout-gray-pale rounded px-2 py-1 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input name="date" type="date" required className="border border-scout-gray-pale rounded px-2 py-1 w-full" />
          </div>
          <button type="submit" className="btn-primary">
            Create campout
          </button>
        </form>
      </div>
    </div>
  );
}
