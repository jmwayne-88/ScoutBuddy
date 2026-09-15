import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";

export default async function PatrolLeaderPage() {
  const actor = await getActor();

  if (actor?.role !== "PATROL_LEADER") {
    return (
      <p>
        You&apos;re not currently acting as a Patrol Leader.{" "}
        <Link href="/" className="underline">
          Switch role
        </Link>
      </p>
    );
  }

  const menus = await db.menu.findMany({
    where: { patrol: actor.patrol },
    include: { campout: true },
    orderBy: { campout: { date: "asc" } },
  });

  if (menus.length === 0) {
    return <p>No menu has been assigned to your patrol yet.</p>;
  }

  if (menus.length === 1) {
    redirect(`/menus/${menus[0].id}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Your patrol&apos;s menus</h1>
      <ul className="space-y-1">
        {menus.map((menu) => (
          <li key={menu.id}>
            <Link href={`/menus/${menu.id}`} className="underline">
              {menu.campout.name}
            </Link>{" "}
            — {menu.status.replace(/_/g, " ")} — due {menu.dueDate.toDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
