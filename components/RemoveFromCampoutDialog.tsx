"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-10.1/10.3: removing a patrol's menu from one campout is scoped and
// permanent (dishes/ingredients/reviews included), so it gets the same
// explicit confirmation pattern as DeletePatrolDialog — just one menu
// instead of a whole patrol's worth.
export function RemoveFromCampoutDialog({
  campoutId,
  patrolId,
  patrolName,
  dishCount,
  isApproved,
  removeAction,
}: {
  campoutId: string;
  patrolId: string;
  patrolName: string;
  dishCount: number;
  isApproved: boolean;
  removeAction: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="text" size="small" color="error" onClick={() => setOpen(true)}>
        Remove from campout
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Remove {patrolName} from this campout?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes {patrolName}&apos;s menu for this campout
            {dishCount > 0 && ` — ${dishCount} planned dish${dishCount === 1 ? "" : "es"} included`}
            {isApproved && ", including its Approved status"}. {patrolName}&apos;s menus on other campouts, and the
            patrol itself, are not affected. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <form action={removeAction}>
            <input type="hidden" name="campoutId" value={campoutId} />
            <input type="hidden" name="patrolId" value={patrolId} />
            <SubmitButton color="error" variant="contained">
              Yes, remove
            </SubmitButton>
          </form>
        </DialogActions>
      </Dialog>
    </>
  );
}
