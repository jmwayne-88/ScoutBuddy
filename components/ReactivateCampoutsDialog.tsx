"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-8.15: shown when reactivating a previously-inactive patrol. Unlike the
// new-patrol prompt (all-future-campouts, yes/no), this is a deliberate
// per-campout pick, so it isn't limited to future-only campouts.
//
// The Checkbox/FormControlLabel tree is built here, inside this Client
// Component, rather than passed in as a prop — see RoleForm.tsx for why
// that distinction matters (a Server Component constructing this same JSX
// and passing it in as a prop would crash; building it here is safe).
export function ReactivateCampoutsDialog({
  open,
  patrolId,
  patrolName,
  campouts,
  assignAction,
}: {
  open: boolean;
  patrolId: string;
  patrolName: string;
  campouts: { id: string; name: string; date: string }[];
  assignAction: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const close = () => router.push(`/patrols/${patrolId}`);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Assign {patrolName} to campouts</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1 }}>
          Pick which campouts should get a new Not Started menu for {patrolName}.
        </DialogContentText>
        {campouts.length === 0 ? (
          <DialogContentText>Every campout already has a menu for this patrol.</DialogContentText>
        ) : (
          <form
            id="reactivate-form"
            action={(formData) => {
              // REQ-14.4: the "Assign to selected" button lives in
              // DialogActions, linked to this form only by the `form` HTML
              // attribute (not real JSX nesting), so useFormStatus can't
              // see it -- track pending with useTransition instead and
              // pass it to SubmitButton explicitly.
              startTransition(async () => {
                await assignAction(formData);
              });
            }}
          >
            <input type="hidden" name="patrolId" value={patrolId} />
            <FormGroup>
              {campouts.map((c) => (
                <FormControlLabel
                  key={c.id}
                  control={<Checkbox name="campoutId" value={c.id} />}
                  label={`${c.name} — ${c.date}`}
                />
              ))}
            </FormGroup>
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Close</Button>
        {campouts.length > 0 && (
          <SubmitButton form="reactivate-form" variant="contained" pendingOverride={isPending}>
            Assign to selected
          </SubmitButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
