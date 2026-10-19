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
import { unresolvedCountsByMenu } from "@/lib/comments";
import { CommentCountBadge } from "@/components/CommentCountBadge";

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

  // REQ-29.10: one patrol's own unresolved counts only -- this query is
  // already scoped to `menus`, which is already scoped to `actor.patrolId`
  // above, so no other patrol's threads can appear here.
  const unresolvedComments = await db.comment.findMany({
    where: { menuId: { in: menus.map((m) => m.id) }, parentId: null, status: "OPEN", deletedAt: null },
    select: { menuId: true, parentId: true, status: true },
  });
  const unresolvedCountsByMenuId = unresolvedCountsByMenu(unresolvedComments);

  return (
    <Stack spacing={2} sx={{ maxWidth: 600 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
        <Typography variant="h5">Your patrol&apos;s menus</Typography>
        <StreakBadge streak={streak} />
      </Stack>
      <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {menus.map((menu) => (
          <Stack key={menu.id} component="li" direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
            <Typography variant="body2">
              <NavLink href={`/menus/${menu.id}`}>{menu.campout.name}</NavLink> — {menu.status.replace(/_/g, " ")} —{" "}
              <RelativeDate {...formatDueDate(menu.dueDate)} />
            </Typography>
            <CommentCountBadge count={unresolvedCountsByMenuId.get(menu.id) ?? 0} />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
