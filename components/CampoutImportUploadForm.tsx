"use client";

import { useActionState } from "react";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { SubmitButton } from "@/components/SubmitButton";
import { uploadCampoutFile, type ImportUploadFormState } from "@/app/(app)/campouts/import/actions";

const initialState: ImportUploadFormState = { error: null };

// REQ-30.18/30.1: the upload itself has no fields to re-render on error
// (a <input type="file"> can't be given a defaultValue), but useActionState
// still carries the one thing that matters here -- a clean, specific error
// message -- back into the still-mounted form rather than a generic crash
// page or a lost file selection with no explanation.
export function CampoutImportUploadForm() {
  const [state, formAction] = useActionState(uploadCampoutFile, initialState);

  return (
    <Stack component="form" action={formAction} spacing={2} sx={{ maxWidth: 480 }}>
      {state.error && <Alert severity="error">{state.error}</Alert>}
      <Box>
        <Typography component="label" htmlFor="campout-import-file" variant="body2" sx={{ display: "block", mb: 1 }}>
          PDF or Excel file
        </Typography>
        <input id="campout-import-file" name="file" type="file" accept=".pdf,.xlsx,.xls" required />
      </Box>
      <SubmitButton variant="contained" color="primary" sx={{ alignSelf: "flex-start" }}>
        Upload &amp; extract
      </SubmitButton>
    </Stack>
  );
}
