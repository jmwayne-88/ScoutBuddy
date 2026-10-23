"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignIn() {
    setError(null);
    startTransition(async () => {
      const { data, error: signInError } = await authClient.signIn.passkey();

      if (signInError || !data) {
        setError(signInError?.message ?? "Could not sign you in. Please try again.");
        return;
      }

      const role = (data.user as { role?: string | null }).role;
      router.push(role === "ASPL" ? "/campouts" : "/patrol-leader");
      router.refresh();
    });
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <SubmitButton
        type="button"
        onClick={handleSignIn}
        variant="contained"
        color="primary"
        pendingOverride={isPending}
      >
        {isPending ? "Signing in…" : "Sign in with passkey"}
      </SubmitButton>
    </Stack>
  );
}
