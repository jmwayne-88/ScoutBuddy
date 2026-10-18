import { notFound } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/db";
import { EditPatrolForm } from "@/components/EditPatrolForm";
import { DeletePatrolDialog } from "@/components/DeletePatrolDialog";
import { AssignFutureCampoutsPrompt } from "@/components/AssignFutureCampoutsPrompt";
import { ReactivateCampoutsDialog } from "@/components/ReactivateCampoutsDialog";
import { assignPatrolToCampouts, assignToFutureCampouts, deletePatrol } from "../actions";

export default async function EditPatrolPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { id } = await params;
  const { prompt } = await searchParams;

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

      <EditPatrolForm patrol={patrol} />

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
