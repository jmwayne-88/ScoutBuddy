import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LoginForm } from "@/components/LoginForm";
import { LinkButton } from "@/components/LinkButton";
import { safeNextPath } from "@/lib/redirects";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Typography variant="h5">Sign in to ScoutBuddy</Typography>
      <LoginForm next={safeNextPath(next)} />
      <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
        <LinkButton href="/login/magic-link" variant="text" size="small">
          Can&apos;t use a passkey? Email me a sign-in link
        </LinkButton>
      </Stack>
      {/* REQ-34.5: invite-only -- there's no open signup to link to. */}
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        New here? Ask your unit&apos;s ASPL of Camping to send you an invitation.
      </Typography>
    </Stack>
  );
}
