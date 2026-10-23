import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getActivePatrols } from "@/lib/patrols";
import { SignupForm } from "@/components/SignupForm";

// REQ-31 (2026-10-23 decision): self-service signup -- anyone with this
// link creates an account and declares their role, the same trust model
// ADR 0010 already accepted ("anyone with the app's URL can declare
// themselves the ASPL... an accepted tradeoff"), now backed by a real
// account + passkey instead of a bare cookie. Requirement 34's real invite
// system supersedes this later; this is the interim bootstrap path.
export default async function SignupPage() {
  const patrols = await getActivePatrols();

  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Create your ScoutBuddy account</Typography>
        <Typography variant="body2" color="text.secondary">
          You&apos;ll register a passkey on this device to sign in from now on — no password to remember.
        </Typography>
      </Stack>
      <SignupForm patrols={patrols} />
    </Stack>
  );
}
