import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { getActor } from "@/lib/session";
import { getAllPatrols } from "@/lib/patrols";
import { db } from "@/lib/db";
import { LinkButton } from "@/components/LinkButton";
import { NavLink } from "@/components/NavLink";
import { RoleMismatchNotice } from "@/components/RoleMismatchNotice";
import { SubmitButton } from "@/components/SubmitButton";
import { movePatrol, setPatrolActive } from "./actions";

export default async function PatrolsPage() {
  const actor = await getActor();

  if (actor?.role !== "ASPL") {
    return <RoleMismatchNotice actor={actor} requiredRoleLabel="the ASPL of Camping" />;
  }

  const patrols = await getAllPatrols();
  const menuCounts = await db.menu.groupBy({ by: ["patrolId"], _count: { _all: true } });
  const countByPatrol = new Map(menuCounts.map((m) => [m.patrolId, m._count._all]));

  return (
    <Stack spacing={3} sx={{ maxWidth: 800 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5">Manage Patrols</Typography>
        <LinkButton href="/patrols/new" variant="contained" startIcon={<AddIcon />}>
          New patrol
        </LinkButton>
      </Stack>

      <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {patrols.map((p, index) => (
          <Paper key={p.id} component="li" variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Stack spacing={0.5}>
                <Box component="form" action={movePatrol}>
                  <input type="hidden" name="patrolId" value={p.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton iconOnly size="small" disabled={index === 0} sx={{ minWidth: 44, p: 0.5 }}>
                    <ArrowUpwardIcon fontSize="small" />
                  </SubmitButton>
                </Box>
                <Box component="form" action={movePatrol}>
                  <input type="hidden" name="patrolId" value={p.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton
                    iconOnly
                    size="small"
                    disabled={index === patrols.length - 1}
                    sx={{ minWidth: 44, p: 0.5 }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </SubmitButton>
                </Box>
              </Stack>

              <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: p.color, flexShrink: 0 }} aria-hidden="true" />

              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600 }}>{p.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.type === "YOUTH" ? "Youth" : "Adult"} · {countByPatrol.get(p.id) ?? 0} menu
                  {(countByPatrol.get(p.id) ?? 0) === 1 ? "" : "s"}
                </Typography>
              </Stack>

              {!p.isActive && <Chip label="Inactive" size="small" />}

              <NavLink href={`/patrols/${p.id}`}>Edit</NavLink>

              <Box component="form" action={setPatrolActive}>
                <input type="hidden" name="patrolId" value={p.id} />
                <input type="hidden" name="isActive" value={(!p.isActive).toString()} />
                <SubmitButton size="small" variant="outlined">
                  {p.isActive ? "Deactivate" : "Activate"}
                </SubmitButton>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}
