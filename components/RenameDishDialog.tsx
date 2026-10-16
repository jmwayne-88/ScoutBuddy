"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { SubmitButton } from "@/components/SubmitButton";

export function RenameDishDialog({
  menuId,
  dishId,
  dishName,
  renameAction,
}: {
  menuId: string;
  dishId: string;
  dishName: string;
  renameAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button variant="text" size="small" onClick={() => setOpen(true)}>
        Rename
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Rename dish</DialogTitle>
        <DialogContent>
          <form
            id={`rename-dish-${dishId}`}
            action={(formData) => {
              // REQ-14.4: this Save button lives in DialogActions, linked
              // to this form only by the `form` HTML attribute (not real
              // JSX nesting), so useFormStatus can't see it -- track
              // pending with useTransition instead and pass it to
              // SubmitButton explicitly.
              startTransition(async () => {
                // The rename action now redirects (to deliver a toast per
                // REQ-13.1), which throws a control-flow exception on
                // success -- `finally` guarantees the dialog still closes
                // regardless of whether that throw happens.
                try {
                  await renameAction(formData);
                } finally {
                  setOpen(false);
                }
              });
            }}
          >
            <input type="hidden" name="menuId" value={menuId} />
            <input type="hidden" name="dishId" value={dishId} />
            <TextField
              name="name"
              label="Dish name"
              defaultValue={dishName}
              required
              autoFocus
              fullWidth
              size="small"
              sx={{ mt: 1 }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <SubmitButton form={`rename-dish-${dishId}`} variant="contained" pendingOverride={isPending}>
            Save
          </SubmitButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
