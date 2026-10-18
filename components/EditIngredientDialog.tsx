"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import { SubmitButton } from "@/components/SubmitButton";

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
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {/* Smaller, muted relative to RenameDishDialog's icon -- mirrors how
          this ingredient's own text is already smaller/secondary-colored
          than its dish's, so icon weight alone signals which level this
          action acts on. */}
      <Tooltip title={`Edit ${name}`}>
        <IconButton
          size="small"
          aria-label={`Edit ${name}`}
          onClick={() => setOpen(true)}
          sx={{ width: 44, height: 44, color: "text.secondary" }}
        >
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Edit ingredient</DialogTitle>
        <DialogContent>
          <Stack
            component="form"
            id={`edit-ingredient-${ingredientId}`}
            action={(formData) => {
              // REQ-14.4: this Save button lives in DialogActions, linked
              // to this form only by the `form` HTML attribute (not real
              // JSX nesting), so useFormStatus can't see it -- track
              // pending with useTransition instead and pass it to
              // SubmitButton explicitly.
              startTransition(async () => {
                // The edit action now redirects (to deliver a toast per
                // REQ-13.1), which throws a control-flow exception on
                // success -- `finally` guarantees the dialog still closes
                // regardless of whether that throw happens.
                try {
                  await editAction(formData);
                } finally {
                  setOpen(false);
                }
              });
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
          <SubmitButton form={`edit-ingredient-${ingredientId}`} variant="contained" pendingOverride={isPending}>
            Save
          </SubmitButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
