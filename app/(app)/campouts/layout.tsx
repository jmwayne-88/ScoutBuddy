import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { getActivePatrols } from "@/lib/patrols";
import { campoutProgress } from "@/lib/progress";
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
    include: { menus: { select: { status: true } } },
  });
  const activePatrols = await getActivePatrols();

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
      <Box component="aside" sx={{ width: { xs: "100%", md: 288 }, flexShrink: 0 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="h6" component="h2">
              Campouts
            </Typography>
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
          {campouts.length === 0 ? (
            <EmptyState icon={EMPTY_STATES.noCampouts().Icon}>{EMPTY_STATES.noCampouts().message}</EmptyState>
          ) : (
            <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {campouts.map((c) => {
                const progress = campoutProgress(c.menus.map((m) => m.status), activePatrols.length);
                const eventDate = formatEventDate(c.date);
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
