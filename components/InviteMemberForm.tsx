"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { inviteMember, type InviteFormState } from "@/app/(app)/unit/actions";

const initialState: InviteFormState = { error: null, sentTo: null };

// REQ-34.5: same useActionState pattern as components/CreatePatrolForm.tsx
// (ADR 0025), so a bad address or a step-up prompt comes back to the still-
// mounted form instead of a page navigation.
export function InviteMemberForm() {
  const [state, formAction] = useActionState(inviteMember, initialState);

  return (
    <Stack component="form" action={formAction} spacing={2}>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.sentTo && <Alert severity="success">Invitation sent to {state.sentTo}.</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "flex-start" } }}>
        {/* Keyed by the last address sent to, so a successful send clears the field. */}
        <TextField
          key={state.sentTo ?? "empty"}
          name="email"
          type="email"
          label="Email address"
          autoComplete="off"
          required
          fullWidth
          helperText="They'll get a link that works once and expires in 7 days."
        />
        <SubmitButton variant="contained" sx={{ flexShrink: 0, mt: { sm: 1 } }}>
          Send invitation
        </SubmitButton>
      </Stack>
    </Stack>
  );
}
