import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MagicLinkRequestForm } from "@/components/MagicLinkRequestForm";

export default async function MagicLinkRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Email me a sign-in link</Typography>
        <Typography variant="body2" color="text.secondary">
          This is a backup option, not your everyday sign-in — it only works if you already have an
          account, and it&apos;s good for one sign-in. Register a passkey from Settings once you&apos;re in
          so you don&apos;t need this next time.
        </Typography>
      </Stack>
      {error && <Typography color="error">That link didn&apos;t work — it may have expired. Try again.</Typography>}
      <MagicLinkRequestForm />
    </Stack>
  );
}
