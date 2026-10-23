"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SignOutButton } from "@/components/SignOutButton";

// REQ-31: replaces components/RoleSwitcher.tsx. Role is no longer
// re-chosen per visit (it comes from the active unit's membership, REQ-34)
// -- this just shows who's signed in and offers sign-out, matching
// CLAUDE.md's "build the whole composition inside a dedicated use client
// wrapper" pattern.
export function AccountStatus({ name, roleLabel }: { name: string; roleLabel: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}>
        {name} · {roleLabel}
      </Typography>
      <SignOutButton color="inherit" size="small" sx={{ whiteSpace: "nowrap", flexShrink: 0 }} />
    </Stack>
  );
}
