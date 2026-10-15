import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { NavLink } from "@/components/NavLink";

export default async function PatrolLeaderPage() {
  const actor = await getActor();

  if (actor?.role !== "PATROL_LEADER") {
    return (
      <Typography>
        You&apos;re not currently acting as a Patrol Leader. Pick a role from the header above.
      </Typography>
    );
  }

  const menus = await db.menu.findMany({
    where: { patrolId: actor.patrolId },
    include: { campout: true },
    orderBy: { campout: { date: "asc" } },
  });

  if (menus.length === 0) {
    return <Typography>No menu has been assigned to your patrol yet.</Typography>;
  }

  if (menus.length === 1) {
    redirect(`/menus/${menus[0].id}`);
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Typography variant="h5">Your patrol&apos;s menus</Typography>
      <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {menus.map((menu) => (
          <Typography key={menu.id} component="li" variant="body2">
            <NavLink href={`/menus/${menu.id}`}>{menu.campout.name}</NavLink> — {menu.status.replace(/_/g, " ")} — due{" "}
            {menu.dueDate.toDateString()}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
