import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import { db } from "@/lib/db";
import { PatrolColorField } from "@/components/PatrolColorField";
import { SubmitButton } from "@/components/SubmitButton";
import { DeletePatrolDialog } from "@/components/DeletePatrolDialog";
import { AssignFutureCampoutsPrompt } from "@/components/AssignFutureCampoutsPrompt";
import { ReactivateCampoutsDialog } from "@/components/ReactivateCampoutsDialog";
import { assignPatrolToCampouts, assignToFutureCampouts, deletePatrol, updatePatrol } from "../actions";

export default async function EditPatrolPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; prompt?: string }>;
}) {
  const { id } = await params;
  const { error, prompt } = await searchParams;

  const patrol = await db.patrol.findUnique({ where: { id } });
  if (!patrol) notFound();

  const menus = await db.menu.findMany({ where: { patrolId: id }, select: { status: true } });
  const approvedCount = menus.filter((m) => m.status === "APPROVED").length;

  const reactivateCampouts =
    prompt === "reactivate"
      ? await db.campout.findMany({
          where: { menus: { none: { patrolId: id } } },
          orderBy: { date: "asc" },
        })
      : [];

  return (
    <Stack spacing={4} sx={{ maxWidth: 500 }}>
      <Typography variant="h5">Edit patrol</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack component="form" action={updatePatrol} spacing={2}>
        <input type="hidden" name="patrolId" value={patrol.id} />
        <TextField name="name" label="Patrol name" defaultValue={patrol.name} required fullWidth />
        <PatrolColorField name="color" defaultValue={patrol.color} previewLabel={patrol.name} />
        <TextField name="type" label="Type" select defaultValue={patrol.type} fullWidth>
          <MenuItem value="YOUTH">Youth</MenuItem>
          <MenuItem value="ADULT">Adult</MenuItem>
        </TextField>
        <TextField name="order" label="Order" type="number" defaultValue={patrol.order} required fullWidth />
        <SubmitButton variant="contained" sx={{ alignSelf: "flex-start" }}>
          Save changes
        </SubmitButton>
      </Stack>

      <Stack spacing={1.5} sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Danger zone
        </Typography>
        <DeletePatrolDialog
          patrolId={patrol.id}
          patrolName={patrol.name}
          menuCount={menus.length}
          approvedCount={approvedCount}
          deleteAction={deletePatrol}
        />
      </Stack>

      <AssignFutureCampoutsPrompt
        open={prompt === "assign"}
        patrolId={patrol.id}
        patrolName={patrol.name}
        assignAction={assignToFutureCampouts}
      />
      <ReactivateCampoutsDialog
        open={prompt === "reactivate"}
        patrolId={patrol.id}
        patrolName={patrol.name}
        campouts={reactivateCampouts.map((c) => ({ id: c.id, name: c.name, date: c.date.toDateString() }))}
        assignAction={assignPatrolToCampouts}
      />
    </Stack>
  );
}
