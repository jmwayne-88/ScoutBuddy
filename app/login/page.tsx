import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LoginForm } from "@/components/LoginForm";
import { LinkButton } from "@/components/LinkButton";

export default function LoginPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Typography variant="h5">Sign in to ScoutBuddy</Typography>
      <LoginForm />
      <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
        <LinkButton href="/login/magic-link" variant="text" size="small">
          Can&apos;t use a passkey? Email me a sign-in link
        </LinkButton>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ justifyContent: "center" }}>
        <Typography variant="body2" color="text.secondary">
          New here?
        </Typography>
        <LinkButton href="/signup" variant="text" size="small">
          Create an account
        </LinkButton>
      </Stack>
    </Stack>
  );
}
