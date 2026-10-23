"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { authClient } from "@/lib/auth-client";

// REQ-31: replaces components/RoleSwitcher.tsx. Role is no longer
// re-chosen per visit (it's set once at /signup, per Requirement 31's
// account model) -- this just shows who's signed in and offers sign-out,
// matching CLAUDE.md's "build the whole composition inside a dedicated
// use client wrapper" pattern (the same reason RoleSwitcher needed to be a
// client module).
export function AccountStatus({ name, roleLabel }: { name: string; roleLabel: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}>
        {name} · {roleLabel}
      </Typography>
      <Button color="inherit" size="small" onClick={handleSignOut} disabled={isPending}>
        Sign out
      </Button>
    </Stack>
  );
}
