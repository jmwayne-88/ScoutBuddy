"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { PatrolColorField } from "@/components/PatrolColorField";
import { PatrolIdentityFields } from "@/components/PatrolIdentityFields";
import { SubmitButton } from "@/components/SubmitButton";
import { createPatrol, type PatrolFormState } from "@/app/(app)/patrols/actions";

const initialState: PatrolFormState = { error: null };

// REQ-20.2/20.4 (see ADR 0025): the whole form lives in this client wrapper
// so createPatrol's color-contrast validation result can flow back via
// useActionState without a page navigation -- the new-patrol page itself
// stays a Server Component with nothing to fetch.
export function CreatePatrolForm() {
  const [state, formAction] = useActionState(createPatrol, initialState);

  return (
    <Stack component="form" action={formAction} spacing={2}>
      <PatrolIdentityFields defaultName="" defaultIcon={null} />
      <PatrolColorField name="color" defaultValue="#1d4ed8" previewLabel="Preview" error={state.error} />
      <TextField name="type" label="Type" select defaultValue="YOUTH" fullWidth>
        <MenuItem value="YOUTH">Youth</MenuItem>
        <MenuItem value="ADULT">Adult</MenuItem>
      </TextField>
      <TextField name="order" label="Order (optional — defaults to last)" type="number" fullWidth />
      <SubmitButton variant="contained" sx={{ alignSelf: "flex-start" }}>
        Create patrol
      </SubmitButton>
    </Stack>
  );
}
