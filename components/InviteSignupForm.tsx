"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { authClient } from "@/lib/auth-client";

// REQ-34.5: replaces components/SignupForm.tsx -- there's no longer a role
// to pick, because the invitation already says which unit and role this
// account is for. The token rides along as passkey `context` to lib/auth.ts,
// which creates the account only once the passkey is verified.
export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim() === "") {
      setError("Enter your name to continue.");
      return;
    }

    const context = JSON.stringify({ name: name.trim(), invitationToken: token });

    startTransition(async () => {
      const { data, error: passkeyError } = await authClient.passkey.addPasskey({
        name: "ScoutBuddy",
        context,
        createSession: true,
      });

      if (passkeyError || !data) {
        setError(passkeyError?.message ?? "Could not create your passkey. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        fullWidth
        required
      />

      <TextField
        label="Email"
        value={email}
        fullWidth
        disabled
        helperText="Your invitation was sent here. It's also where a sign-in link goes if you ever lose your passkey."
      />

      <SubmitButton type="submit" variant="contained" color="primary" pendingOverride={isPending}>
        {isPending ? "Registering passkey…" : "Create account & add passkey"}
      </SubmitButton>
    </Stack>
  );
}
