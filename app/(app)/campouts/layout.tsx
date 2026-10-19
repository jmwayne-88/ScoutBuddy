import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { canUploadCampouts } from "@/lib/permissions";
import { getActivePatrols } from "@/lib/patrols";
import { campoutProgress } from "@/lib/progress";
import { unresolvedCountsByMenu } from "@/lib/comments";
import { formatEventDate } from "@/lib/dates";
import { EMPTY_STATES } from "@/lib/empty-states";
import { EmptyState } from "@/components/EmptyState";
import { LinkButton } from "@/components/LinkButton";
import { CampoutCard } from "@/components/CampoutCard";
import { RoleMismatchNotice } from "@/components/RoleMismatchNotice";

export default async function CampoutsLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();

  if (actor?.role !== "ASPL") {
    return <RoleMismatchNotice actor={actor} requiredRoleLabel="the ASPL of Camping" />;
  }

  const campouts = await db.campout.findMany({
    orderBy: { date: "asc" },
    include: { menus: { select: { id: true, status: true } } },
  });
  const activePatrols = await getActivePatrols();

  // REQ-29.9/29.11: a campout's total is every unresolved top-level thread
  // across every patrol's menu for it (menu, meal, dish, and ingredient
  // targets alike) -- counted once here and summed per campout below,
  // rather than a separate query per card.
  const unresolvedComments = await db.comment.findMany({
    where: { menuId: { in: campouts.flatMap((c) => c.menus.map((m) => m.id)) }, parentId: null, status: "OPEN", deletedAt: null },
    select: { menuId: true, parentId: true, status: true },
  });
  const unresolvedCountsByMenuId = unresolvedCountsByMenu(unresolvedComments);

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
      <Box component="aside" sx={{ width: { xs: "100%", md: 288 }, flexShrink: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" component="h2">
              Campouts
            </Typography>
            <Stack direction="row" spacing={1}>
              {canUploadCampouts(actor) && (
                <LinkButton
                  href="/campouts/upload"
                  variant="outlined"
                  size="small"
                  startIcon={<UploadFileIcon />}
                  aria-label="Upload from file"
                >
                  Upload
                </LinkButton>
              )}
              <LinkButton
                href="/campouts/new"
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                aria-label="New campout"
              >
                New
              </LinkButton>
            </Stack>
          </Stack>
          {campouts.length === 0 ? (
            <EmptyState icon={EMPTY_STATES.noCampouts().Icon}>{EMPTY_STATES.noCampouts().message}</EmptyState>
          ) : (
            <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {campouts.map((c) => {
                const progress = campoutProgress(c.menus.map((m) => m.status), activePatrols.length);
                const eventDate = formatEventDate(c.date);
                const unresolvedTotal = c.menus.reduce(
                  (sum, m) => sum + (unresolvedCountsByMenuId.get(m.id) ?? 0),
                  0
                );
                return (
                  <li key={c.id}>
                    <CampoutCard
                      href={`/campouts/${c.id}`}
                      name={c.name}
                      date={eventDate.display}
                      dateTitle={eventDate.absolute}
                      imageUrl={c.imageUrl}
                      dotColor={progress.dotColor}
                      percent={progress.percent}
                      label={progress.label}
                      unresolvedComments={unresolvedTotal}
                    />
                  </li>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>{children}</Box>
    </Stack>
  );
}
