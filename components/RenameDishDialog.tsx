"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";

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

  return (
    <>
      <Button variant="text" size="small" onClick={() => setOpen(true)}>
        Rename
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Rename dish</DialogTitle>
        <DialogContent>
          <form id={`rename-dish-${dishId}`} action={renameAction}>
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
          <Button type="submit" form={`rename-dish-${dishId}`} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
