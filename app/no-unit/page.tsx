import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getSessionStatus } from "@/lib/session";
import { SignOutButton } from "@/components/SignOutButton";

// REQ-34.8: where someone lands when they're signed in but no longer belong
// to any unit (e.g. removed from their only one). Their account is
// untouched -- an invitation to any unit brings them back in.
export default async function NoUnitPage() {
  const status = await getSessionStatus();
  if (status === "signed-out") redirect("/login");
  if (status === "active") redirect("/");

  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Stack spacing={1}>
        <Typography variant="h5">You&apos;re not in a unit right now</Typography>
        <Typography variant="body2" color="text.secondary">
          Your account still exists, but it isn&apos;t a member of any unit. Ask a unit&apos;s ASPL of Camping to
          send you an invitation, then open the link in that email.
        </Typography>
      </Stack>
      <SignOutButton variant="outlined" sx={{ alignSelf: "flex-start" }} />
    </Stack>
  );
}
