"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { acceptInvitation, type AcceptInvitationState } from "@/app/invite/[token]/actions";

const initialState: AcceptInvitationState = { error: null };

// REQ-34.5: for someone already signed in -- one action joins the unit.
export function AcceptInvitationForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInvitation, initialState);

  return (
    <Stack component="form" action={formAction} spacing={2}>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      <input type="hidden" name="token" value={token} />
      <SubmitButton variant="contained" color="primary" sx={{ alignSelf: "flex-start" }}>
        Accept invitation
      </SubmitButton>
    </Stack>
  );
}
