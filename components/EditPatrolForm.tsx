"use client";

import { useActionState } from "react";
import type { Patrol } from "@prisma/client";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { PatrolColorField } from "@/components/PatrolColorField";
import { PatrolIdentityFields } from "@/components/PatrolIdentityFields";
import { SubmitButton } from "@/components/SubmitButton";
import { updatePatrol, type PatrolFormState } from "@/app/(app)/patrols/actions";

const initialState: PatrolFormState = { error: null };

// REQ-20.3/20.4 (see ADR 0025): same client-wrapper shape as
// components/CreatePatrolForm.tsx. The edit page passes the patrol row
// down as a plain data prop -- not a JSX element built server-side -- so
// this stays clear of the Server→Client serialization trap CLAUDE.md's
// MUI gotcha note describes.
export function EditPatrolForm({ patrol }: { patrol: Patrol }) {
  const [state, formAction] = useActionState(updatePatrol, initialState);

  return (
    <Stack component="form" action={formAction} spacing={2}>
      <input type="hidden" name="patrolId" value={patrol.id} />
      <PatrolIdentityFields defaultName={patrol.name} defaultIcon={patrol.icon} />
      <PatrolColorField name="color" defaultValue={patrol.color} previewLabel={patrol.name} error={state.error} />
      <TextField name="type" label="Type" select defaultValue={patrol.type} fullWidth>
        <MenuItem value="YOUTH">Youth</MenuItem>
        <MenuItem value="ADULT">Adult</MenuItem>
      </TextField>
      <TextField name="order" label="Order" type="number" defaultValue={patrol.order} required fullWidth />
      <SubmitButton variant="contained" sx={{ alignSelf: "flex-start" }}>
        Save changes
      </SubmitButton>
    </Stack>
  );
}
