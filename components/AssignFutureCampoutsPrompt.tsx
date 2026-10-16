"use client";

import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-8.10: shown once, right after a new patrol is created.
export function AssignFutureCampoutsPrompt({
  open,
  patrolId,
  patrolName,
  assignAction,
}: {
  open: boolean;
  patrolId: string;
  patrolName: string;
  assignAction: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const close = () => router.push(`/patrols/${patrolId}`);

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Assign {patrolName} to upcoming campouts?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Create a Not Started menu for {patrolName} on every campout that hasn&apos;t happened yet. Campouts that
          have already happened are left alone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>No, not yet</Button>
        <form action={assignAction}>
          <input type="hidden" name="patrolId" value={patrolId} />
          <SubmitButton variant="contained">
            Yes, assign
          </SubmitButton>
        </form>
      </DialogActions>
    </Dialog>
  );
}
