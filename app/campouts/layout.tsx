import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { db } from "@/lib/db";
import { getActor } from "@/lib/session";
import { campoutProgress } from "@/lib/progress";
import { LinkButton } from "@/components/LinkButton";
import { CampoutCard } from "@/components/CampoutCard";

export default async function CampoutsLayout({ children }: { children: ReactNode }) {
  const actor = await getActor();

  if (actor?.role !== "ASPL") {
    return (
      <Typography>
        You&apos;re not currently acting as the ASPL of Camping. Pick a role from the header above.
      </Typography>
    );
  }

  const campouts = await db.campout.findMany({
    orderBy: { date: "asc" },
    include: { menus: { select: { status: true } } },
  });

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
            <Typography variant="body2" color="text.secondary">
              No campouts yet — create the first one.
            </Typography>
          ) : (
            <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {campouts.map((c) => {
                const progress = campoutProgress(c.menus.map((m) => m.status));
                return (
                  <li key={c.id}>
                    <CampoutCard
                      href={`/campouts/${c.id}`}
                      name={c.name}
                      date={c.date.toDateString()}
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
