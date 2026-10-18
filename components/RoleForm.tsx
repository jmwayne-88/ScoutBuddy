"use client";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PatrolBadge } from "@/components/PatrolBadge";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-17.2/17.5: one card per role, the whole card itself the tap target and
// submit control -- no separate Continue button, no intermediate
// "selected but not confirmed" state. Each card is its own single-button
// <form>, so clicking it submits `action` (the existing chooseRole Server
// Action) immediately with that card's role value.
//
// This card grid doesn't build a Radio/FormControlLabel tree the way this
// file used to, so that specific MUI gotcha doesn't apply here. It's still
// built entirely in this "use client" module per CLAUDE.md's general
// Server->Client element-passing rule: `action` is a Server Action
// reference (safely serializable), and every other prop crossing in from
// the Server Component caller (`patrols`, `defaultValue`) is plain data,
// never a JSX element.
export function RoleForm({
  action,
  defaultValue,
  patrols,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultValue: string;
  patrols: { id: string; name: string; color: string }[];
}) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <RoleCard action={action} value="ASPL" label="the ASPL of Camping" selected={defaultValue === "ASPL"} />
      </Grid>
      {patrols.map((p) => (
        <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <RoleCard
            action={action}
            value={`PATROL_LEADER:${p.id}`}
            label="the Patrol Leader for"
            patrolName={p.name}
            patrolColor={p.color}
            selected={defaultValue === `PATROL_LEADER:${p.id}`}
          />
        </Grid>
      ))}
    </Grid>
  );
}

function RoleCard({
  action,
  value,
  label,
  patrolName,
  patrolColor,
  selected,
}: {
  action: (formData: FormData) => void | Promise<void>;
  value: string;
  label: string;
  patrolName?: string;
  patrolColor?: string;
  selected: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="role" value={value} />
      <SubmitButton
        variant="outlined"
        fullWidth
        aria-pressed={selected}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 1,
          p: 2,
          minHeight: 96,
          textAlign: "left",
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: selected ? "action.selected" : "background.paper",
          "&:hover": { borderColor: "primary.main" },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ width: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
          {selected && <CheckCircleIcon color="primary" fontSize="small" />}
        </Stack>
        {patrolName && patrolColor && <PatrolBadge name={patrolName} color={patrolColor} />}
      </SubmitButton>
    </form>
  );
}
