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

  const menu = await db.menu.findFirst({
    where: { patrol: actor.patrol },
    orderBy: { createdAt: "desc" },
  });

  if (!menu) {
    return <p>No menu has been assigned to your patrol yet.</p>;
  }

  redirect(`/menus/${menu.id}`);
}
