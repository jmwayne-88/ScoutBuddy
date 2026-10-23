import { headers } from "next/headers";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hashInvitationToken, INVITATION_STATE_MESSAGES, invitationState } from "@/lib/invitations";
import { UNIT_HIERARCHY_INCLUDE, councilDisplayName, unitDisplayName } from "@/lib/units";
import { AcceptInvitationForm } from "@/components/AcceptInvitationForm";
import { InviteSignupForm } from "@/components/InviteSignupForm";
import { LinkButton } from "@/components/LinkButton";

// REQ-34.5/34.13: where an emailed invitation lands. Outside the (app)
// group on purpose -- most visitors here don't have an account yet. The
// unit is always shown with its district and council, since type and
// number alone are ambiguous.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await db.unitInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { unit: { include: UNIT_HIERARCHY_INCLUDE }, invitedBy: { select: { name: true } } },
  });

  if (!invitation) {
    return (
      <InviteShell>
        <Alert severity="error">That invitation link isn&apos;t valid. Check that you copied the whole link.</Alert>
      </InviteShell>
    );
  }

  const state = invitationState(invitation, new Date());
  if (state !== "pending") {
    return (
      <InviteShell>
        <Alert severity="warning">{INVITATION_STATE_MESSAGES[state]}</Alert>
      </InviteShell>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const { unit } = invitation;

  return (
    <InviteShell>
      <Stack spacing={1}>
        <Typography variant="h5">You&apos;re invited to join</Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="p">
            {unitDisplayName(unit)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unit.district.name} · {councilDisplayName(unit.district.council)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            as <strong>{invitation.role === "ASPL" ? "ASPL of Camping" : "Patrol Leader"}</strong>
            {invitation.invitedBy ? `, invited by ${invitation.invitedBy.name}` : ""}
          </Typography>
        </Paper>
      </Stack>

      {session?.user ? (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Signed in as {session.user.name}.
          </Typography>
          <AcceptInvitationForm token={token} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Create your account. You&apos;ll register a passkey on this device to sign in from now on — no password to
            remember.
          </Typography>
          <InviteSignupForm token={token} email={invitation.email} />
          <Stack direction="row" spacing={1} sx={{ justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" color="text.secondary">
              Already have a ScoutBuddy account?
            </Typography>
            <LinkButton href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} variant="text" size="small">
              Sign in to accept
            </LinkButton>
          </Stack>
        </Stack>
      )}
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <Stack spacing={3} sx={{ maxWidth: 480, mx: "auto", mt: { xs: 4, sm: 8 }, px: 2 }}>
      {children}
    </Stack>
  );
}
