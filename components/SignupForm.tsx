"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { authClient } from "@/lib/auth-client";

type Patrol = { id: string; name: string; color: string; icon?: string | null };

type RoleChoice = "" | "ASPL" | `PATROL_LEADER:${string}`;

export function SignupForm({ patrols }: { patrols: Patrol[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (name.trim() === "") {
      setError("Enter your name to continue.");
      return;
    }
    if (roleChoice === "") {
      setError("Choose a role to continue.");
      return;
    }

    const role = roleChoice === "ASPL" ? "ASPL" : "PATROL_LEADER";
    const patrolId = roleChoice === "ASPL" ? undefined : roleChoice.split(":")[1];
    const context = JSON.stringify({ name: name.trim(), role, patrolId, email: email.trim() || undefined });

    startTransition(async () => {
      // `requireSession: false` is the server-side plugin config (lib/auth.ts)
      // that makes this call valid with no session yet -- not a per-call
      // client option.
      const { data, error: passkeyError } = await authClient.passkey.addPasskey({
        name: "ScoutBuddy",
        context,
        createSession: true,
      });

      if (passkeyError || !data) {
        setError(passkeyError?.message ?? "Could not create your passkey. Please try again.");
        return;
      }

      router.push(role === "ASPL" ? "/campouts" : "/patrol-leader");
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
        label="Email (optional — for account recovery)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        helperText="Only used to send you a sign-in link if you lose access to your passkey. Not required."
        fullWidth
      />

      <Stack spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Your role
        </Typography>
        <Grid container spacing={1}>
          <Grid size={12}>
            <RoleCard
              label="ASPL of Camping"
              selected={roleChoice === "ASPL"}
              onClick={() => setRoleChoice("ASPL")}
            />
          </Grid>
          {patrols.map((p) => (
            <Grid size={12} key={p.id}>
              <RoleCard
                label={`Patrol Leader — ${p.name}`}
                selected={roleChoice === `PATROL_LEADER:${p.id}`}
                onClick={() => setRoleChoice(`PATROL_LEADER:${p.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <SubmitButton type="submit" variant="contained" color="primary" pendingOverride={isPending}>
        {isPending ? "Registering passkey…" : "Create account & add passkey"}
      </SubmitButton>
    </Stack>
  );
}

function RoleCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      fullWidth
      variant="outlined"
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "transparent",
      }}
    >
      <Box component="span">{label}</Box>
    </Button>
  );
}
