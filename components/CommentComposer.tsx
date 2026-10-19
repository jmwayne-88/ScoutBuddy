"use client";

import { useState, type KeyboardEvent } from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { SubmitButton } from "@/components/SubmitButton";

// REQ-28.4: the one composer for both a new thread and a reply -- only
// rendered once the person explicitly asks to write something ("New
// comment" / "Reply"), and always with an obvious way back out: a Cancel
// button, or Escape from inside the text field. Cancelling discards the
// draft; there's nothing to clean up server-side because nothing has been
// sent yet.
//
// `action` is a Server Action (comment-actions.ts) that redirects with a
// toast on success (ADR 0023) -- that redirect surfaces here as a thrown
// control-flow exception, so `finally` is what reliably collapses the
// composer afterward, the same pattern components/RenameDishDialog.tsx
// uses to close its dialog.
export function CommentComposer({
  action,
  hiddenFields,
  label,
  submitLabel,
  onDone,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  label: string;
  submitLabel: string;
  onDone: () => void;
}) {
  const [body, setBody] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      // Keep Escape from also closing the surrounding comment pane --
      // the first Escape cancels the draft, a second closes the pane.
      e.stopPropagation();
      onDone();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && body.trim()) {
      e.preventDefault();
      (e.currentTarget.closest("form") as HTMLFormElement | null)?.requestSubmit();
    }
  }

  return (
    <Stack
      component="form"
      action={async (formData: FormData) => {
        try {
          await action(formData);
        } finally {
          onDone();
        }
      }}
      spacing={1}
    >
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <TextField
        name="body"
        label={label}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        size="small"
        fullWidth
        multiline
        minRows={2}
        maxRows={8}
        required
        autoFocus
      />
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button size="small" onClick={onDone} sx={{ color: "text.secondary" }}>
          Cancel
        </Button>
        <SubmitButton variant="contained" size="small" disabled={!body.trim()}>
          {submitLabel}
        </SubmitButton>
      </Stack>
    </Stack>
  );
}
