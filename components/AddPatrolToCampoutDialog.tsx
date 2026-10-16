"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-10.5/10.6: a single "Add patrol" control, disabled once every active
// patrol already has a menu here — the normal state for most campouts most
// of the time, not an edge case. Submits straight to the existing
// assignMenu action (Requirement 1); no new server action is needed for
// adding, only this picker UI around it.
export function AddPatrolToCampoutDialog({
  campoutId,
  patrols,
  assignAction,
}: {
  campoutId: string;
  patrols: { id: string; name: string }[];
  assignAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button variant="outlined" size="small" disabled={patrols.length === 0} onClick={() => setOpen(true)}>
        Add patrol
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add a patrol to this campout</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Pick a patrol and a due date to create a new Not Started menu for it here.
          </DialogContentText>
          <Stack
            component="form"
            id="add-patrol-form"
            action={(formData) => {
              // REQ-14.4: this Add button lives in DialogActions, linked
              // to this form only by the `form` HTML attribute (not real
              // JSX nesting), so useFormStatus can't see it -- track
              // pending with useTransition instead and pass it to
              // SubmitButton explicitly.
              startTransition(async () => {
                await assignAction(formData);
              });
            }}
            spacing={2}
            sx={{ pt: 0.5 }}
          >
            <input type="hidden" name="campoutId" value={campoutId} />
            <TextField name="patrolId" label="Patrol" select required size="small" defaultValue={patrols[0]?.id ?? ""}>
              {patrols.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="dueDate"
              label="Due date"
              type="date"
              required
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <SubmitButton form="add-patrol-form" variant="contained" pendingOverride={isPending}>
            Add patrol
          </SubmitButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
