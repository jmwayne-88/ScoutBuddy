import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";

export default async function PatrolLeaderPage() {
  const actor = await getActor();

  if (actor?.role !== "PATROL_LEADER") {
    return (
      <p className="max-w-3xl mx-auto">
        You&apos;re not currently acting as a Patrol Leader. Pick a role from the header above.
      </p>
    );
  }

  const menus = await db.menu.findMany({
    where: { patrol: actor.patrol },
    include: { campout: true },
    orderBy: { campout: { date: "asc" } },
  });

  if (menus.length === 0) {
    return <p className="max-w-3xl mx-auto">No menu has been assigned to your patrol yet.</p>;
  }

  if (menus.length === 1) {
    redirect(`/menus/${menus[0].id}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl">Your patrol&apos;s menus</h1>
      <ul className="space-y-1">
        {menus.map((menu) => (
          <li key={menu.id}>
            <Link href={`/menus/${menu.id}`} className="link">
              {menu.campout.name}
            </Link>{" "}
            — {menu.status.replace(/_/g, " ")} — due {menu.dueDate.toDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
