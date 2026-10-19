import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { NavLink } from "@/components/NavLink";
import { RoleMismatchNotice } from "@/components/RoleMismatchNotice";
import { EMPTY_STATES } from "@/lib/empty-states";
import { EmptyState } from "@/components/EmptyState";
import { formatDueDate } from "@/lib/dates";
import { RelativeDate } from "@/components/RelativeDate";
import { onTimeStreak } from "@/lib/streaks";
import { StreakBadge } from "@/components/StreakBadge";

export default async function PatrolLeaderPage() {
  const actor = await getActor();

  if (actor?.role !== "PATROL_LEADER") {
    return <RoleMismatchNotice actor={actor} requiredRoleLabel="a Patrol Leader" />;
  }

  const menus = await db.menu.findMany({
    where: { patrolId: actor.patrolId },
    include: { campout: true },
    orderBy: { campout: { date: "asc" } },
  });

  if (menus.length === 0) {
    const { Icon, message } = EMPTY_STATES.noMenuAssigned();
    return <EmptyState icon={Icon}>{message}</EmptyState>;
  }

  if (menus.length === 1) {
    redirect(`/menus/${menus[0].id}`);
  }

  // REQ-25.2/25.4: shown only here, to the Patrol Leader it belongs to --
  // never on any ASPL-facing view.
  const streak = onTimeStreak(menus);

  return (
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
        <Typography variant="h5">Your patrol&apos;s menus</Typography>
        <StreakBadge streak={streak} />
      </Stack>
      <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {menus.map((menu) => (
          <Typography key={menu.id} component="li" variant="body2">
            <NavLink href={`/menus/${menu.id}`}>{menu.campout.name}</NavLink> — {menu.status.replace(/_/g, " ")} —{" "}
            <RelativeDate {...formatDueDate(menu.dueDate)} />
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
