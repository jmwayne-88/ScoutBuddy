"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";

export function EditIngredientDialog({
  menuId,
  ingredientId,
  name,
  quantity,
  editAction,
}: {
  menuId: string;
  ingredientId: string;
  name: string;
  quantity: string;
  editAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="text" size="small" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit ingredient</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            id={`edit-ingredient-${ingredientId}`}
            action={async (formData) => {
              await editAction(formData);
              setOpen(false);
            }}
            spacing={2}
            sx={{ pt: 1 }}
          >
            <input type="hidden" name="menuId" value={menuId} />
            <input type="hidden" name="ingredientId" value={ingredientId} />
            <TextField name="name" label="Ingredient" defaultValue={name} required autoFocus size="small" />
            <TextField name="quantity" label="Quantity (per person)" defaultValue={quantity} required size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form={`edit-ingredient-${ingredientId}`} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
