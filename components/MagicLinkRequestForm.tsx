"use client";

import { useState, useTransition } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { authClient } from "@/lib/auth-client";

// REQ-31.3/32: bootstrap/recovery tier only -- the response is identical
// whether or not an account exists for the submitted address (REQ-32.1's
// anti-enumeration rule, applied here ahead of Requirement 32 proper since
// the same request/response shape is needed either way).
export function MagicLinkRequestForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: "/login/magic-link/complete",
        errorCallbackURL: "/login/magic-link?error=1",
      });
      setSent(true);
    });
  }

  if (sent) {
    return (
      <Alert severity="success">
        If an account exists for that address, a sign-in link is on its way. Check your email.
      </Alert>
    );
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        fullWidth
        required
      />
      <SubmitButton type="submit" variant="contained" color="primary" pendingOverride={isPending}>
        {isPending ? "Sending…" : "Send me a sign-in link"}
      </SubmitButton>
    </Stack>
  );
}
