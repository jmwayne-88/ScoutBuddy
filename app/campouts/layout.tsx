import type { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { campoutProgress } from "@/lib/progress";

export default async function CampoutsLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();

  if (actor?.role !== "ASPL") {
    return (
      <p className="max-w-3xl mx-auto">
        You&apos;re not currently acting as the ASPL of Camping. Pick a role from the header above.
      </p>
    );
  }

  const campouts = await db.campout.findMany({
    orderBy: { date: "asc" },
    include: { menus: { select: { status: true } } },
  });

  return (
    <div className="flex gap-6 items-start">
      <aside className="w-72 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold">Campouts</h2>
          <Link href="/campouts/new" className="btn-primary text-sm px-3 py-1" aria-label="New campout">
            + New
          </Link>
        </div>
        {campouts.length === 0 ? (
          <p className="text-sm text-scout-gray">No campouts yet — create the first one.</p>
        ) : (
          <ul className="space-y-2">
            {campouts.map((c) => {
              const progress = campoutProgress(c.menus.map((m) => m.status));
              return (
                <li key={c.id}>
                  <Link href={`/campouts/${c.id}`} className="card block p-3 space-y-2 hover:border-scout-blue">
                    <div className="flex items-center gap-2">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary ASPL-supplied URL, not a build-known domain
                        <img src={c.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <span className="w-10 h-10 rounded bg-scout-tan-dark shrink-0" aria-hidden="true" />
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{c.name}</span>
                        <span className="block text-xs text-scout-gray">{c.date.toDateString()}</span>
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: progress.dotColor }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 rounded bg-scout-tan-light overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{ width: `${progress.percent}%`, backgroundColor: progress.dotColor }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: progress.dotColor }}>{progress.label}</span>
                        <span className="text-scout-gray">{progress.percent}%</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
