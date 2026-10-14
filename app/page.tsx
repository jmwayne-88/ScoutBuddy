import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getActor } from "@/lib/session";
import { getActivePatrols } from "@/lib/patrols";
import { RoleForm } from "@/components/RoleForm";
import { chooseRole } from "./role-actions";

export default async function HomePage() {
  const actor = await getActor();
  const patrols = await getActivePatrols();

  const currentPatrolName =
    actor?.role === "PATROL_LEADER" ? patrols.find((p) => p.id === actor.patrolId)?.name : undefined;
  const currentValue = !actor ? "" : actor.role === "ASPL" ? "ASPL" : `PATROL_LEADER:${actor.patrolId}`;

  return (
    <Stack spacing={3} sx={{ maxWidth: 600 }}>
      <Typography variant="h5">Who&apos;s using ScoutBuddy?</Typography>
      {actor && (
        <Typography variant="body2" color="text.secondary">
          Currently acting as{" "}
          {actor.role === "ASPL" ? "the ASPL of Camping" : `the Patrol Leader for ${currentPatrolName ?? "a patrol"}`}.
        </Typography>
      )}
      <RoleForm action={chooseRole} defaultValue={currentValue} patrols={patrols} />
    </Stack>
  );
}
