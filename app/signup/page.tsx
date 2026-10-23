import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LinkButton } from "@/components/LinkButton";

// REQ-34.5 (superseding ADR 0033's self-service signup): accounts are
// created only from an invitation, at /invite/[token]. This page stays so
// old links to it explain what changed instead of 404ing.
export default function SignupPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Stack spacing={1}>
        <Typography variant="h5">ScoutBuddy is invite-only</Typography>
        <Typography variant="body2" color="text.secondary">
          Ask your unit&apos;s ASPL of Camping to send you an invitation. The email they send has a link to create
          your account.
        </Typography>
      </Stack>
      <LinkButton href="/login" variant="outlined" sx={{ alignSelf: "flex-start" }}>
        I already have an account
      </LinkButton>
    </Stack>
  );
}
