"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-8.12/8.13: deleting a patrol is a real, cascading data loss (its
// menus, dishes, ingredients, reviews). This requires an explicit,
// hard-to-misclick confirmation naming what will be destroyed before the
// server action (passed in as `deleteAction` — a Server Action reference is
// safe to pass as a Client Component prop, unlike a JSX element/component
// reference; see CLAUDE.md's Design System section) ever runs.
export function DeletePatrolDialog({
  patrolId,
  patrolName,
  menuCount,
  approvedCount,
  deleteAction,
}: {
  patrolId: string;
  patrolName: string;
  menuCount: number;
  approvedCount: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
        Delete patrol
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete {patrolName}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes {patrolName}
            {menuCount === 0
              ? " (it has no menus, so nothing else is lost)"
              : ` and all ${menuCount} of its menu${menuCount === 1 ? "" : "s"} — dishes, ingredients, and review history included`}
            {approvedCount > 0 && `, including ${approvedCount} already-Approved menu${approvedCount === 1 ? "" : "s"}`}
            . This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <form action={deleteAction}>
            <input type="hidden" name="patrolId" value={patrolId} />
            <SubmitButton color="error" variant="contained">
              Yes, delete
            </SubmitButton>
          </form>
        </DialogActions>
      </Dialog>
    </>
  );
}
