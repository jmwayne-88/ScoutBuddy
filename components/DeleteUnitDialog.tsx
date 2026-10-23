"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-27.15: deleting a whole unit is the largest data loss in the app --
// every campout, patrol, menu, and member at once -- so on top of
// DeletePatrolDialog's Tier 1 confirm (REQ-15.5), the ASPL types the unit's
// name before the button enables. deleteUnit re-checks the same name.
export function DeleteUnitDialog({
  unitName,
  deleteAction,
}: {
  unitName: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === unitName;

  function close() {
    setOpen(false);
    setTyped("");
  }

  return (
    <>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)} sx={{ alignSelf: "flex-start" }}>
        Delete unit
      </Button>
      <Dialog open={open} onClose={close}>
        <form action={deleteAction}>
          <DialogTitle>Delete {unitName}?</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              This permanently deletes {unitName} from ScoutBuddy: every campout, patrol, menu, comment, and review,
              and every member&apos;s place in the unit. Their accounts stay, but they lose access to this unit. This
              cannot be undone, so export the unit&apos;s data first if you might want it.
            </DialogContentText>
            <TextField
              name="confirmation"
              label={`Type "${unitName}" to confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close}>Cancel</Button>
            <SubmitButton color="error" variant="contained" disabled={!matches}>
              Delete unit
            </SubmitButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
