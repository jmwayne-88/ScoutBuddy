import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getActor } from "@/lib/session";
import { PATROLS, patrolLabel } from "@/lib/constants";
import { RoleForm } from "@/components/RoleForm";
import { chooseRole } from "./role-actions";

export default async function HomePage() {
  const actor = await getActor();
  const currentValue = !actor ? "" : actor.role === "ASPL" ? "ASPL" : `PATROL_LEADER:${actor.patrol}`;

  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Typography variant="h5">Who&apos;s using ScoutBuddy?</Typography>
      {actor && (
        <Typography variant="body2" color="text.secondary">
          Currently acting as{" "}
          {actor.role === "ASPL" ? "the ASPL of Camping" : `the Patrol Leader for ${patrolLabel(actor.patrol)}`}.
        </Typography>
      )}
      <RoleForm action={chooseRole} defaultValue={currentValue} patrols={PATROLS} />
    </Stack>
  );
}
