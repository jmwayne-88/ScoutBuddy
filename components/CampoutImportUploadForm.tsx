"use client";

import { useActionState, useRef, useState, useTransition, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { SubmitButton } from "@/components/SubmitButton";
import { uploadCampoutFile, type ImportUploadFormState } from "@/app/(app)/campouts/import/actions";

const initialState: ImportUploadFormState = { error: null };

// ADR 0032: the file goes straight from this browser to Vercel Blob
// (bypassing the Server Action's own request body, which has a hard,
// unconfigurable 4.5MB limit on Vercel that has nothing to do with this
// app's own file-size cap) before uploadCampoutFile ever runs -- so this
// can't be a plain <form action={serverAction}> the way every other form
// in this app is. The upload-to-Blob step happens in a regular onSubmit
// handler; only once it resolves does this call the Server Action itself
// (via useActionState's own action function, wrapped in a transition so
// its pending/error state still works the normal way).
export function CampoutImportUploadForm() {
  const [state, formAction] = useActionState(uploadCampoutFile, initialState);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a PDF or Excel file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/campout-import-upload",
      });
      const formData = new FormData();
      formData.set("blobUrl", blob.url);
      formData.set("fileName", file.name);
      startTransition(() => {
        formAction(formData);
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  const error = uploadError ?? state.error;
  const pending = isUploading || isPending;

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2} sx={{ maxWidth: 480 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box>
        <Typography component="label" htmlFor="campout-import-file" variant="body2" sx={{ display: "block", mb: 1 }}>
          PDF or Excel file
        </Typography>
        <input id="campout-import-file" name="file" type="file" accept=".pdf,.xlsx,.xls" ref={fileInputRef} required />
      </Box>
      <SubmitButton type="submit" variant="contained" color="primary" pendingOverride={pending} sx={{ alignSelf: "flex-start" }}>
        {isUploading ? "Uploading…" : "Upload & extract"}
      </SubmitButton>
    </Stack>
  );
}
