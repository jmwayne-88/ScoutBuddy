import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { db } from "@/lib/db";
import { getActiveMembership, getActor } from "@/lib/session";
import { canManageUnitMembers } from "@/lib/permissions";
import { formatEventDate } from "@/lib/dates";
import { UNIT_HIERARCHY_INCLUDE, councilDisplayName, unitDisplayName } from "@/lib/units";
import { RoleMismatchNotice } from "@/components/RoleMismatchNotice";
import { InviteMemberForm } from "@/components/InviteMemberForm";
import { RelativeDate } from "@/components/RelativeDate";
import { SubmitButton } from "@/components/SubmitButton";
import { removeMember, revokeInvitation } from "./actions";

// CLAUDE.md: brand.olive carries the "secondary action" meaning (Remove,
// like Remove occasion) -- the same filled treatment as Request changes.
// White text explicitly: a contained Button otherwise takes primary's
// contrastText, which is dark in dark mode (lib/theme/contrast.test.ts
// checks white on brand.olive). The disabled override keeps the last
// ASPL's Remove from looking live.
const OLIVE_ACTION_SX = {
  bgcolor: "brand.olive",
  color: "common.white",
  "&:hover": { bgcolor: "brand.olive", filter: "brightness(0.9)" },
  "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
};

// REQ-34.5/34.8: who belongs to the active unit, who's been invited, and the
// controls to invite, cancel an invitation, or remove a member.
export default async function UnitPage() {
  const membership = await getActiveMembership();
  if (!membership || !canManageUnitMembers(membership.actor)) {
    return <RoleMismatchNotice actor={await getActor()} requiredRoleLabel="the ASPL of Camping" />;
  }

  const now = new Date();
  const [unit, members, invitations] = await Promise.all([
    db.unit.findUniqueOrThrow({ where: { id: membership.unitId }, include: UNIT_HIERARCHY_INCLUDE }),
    db.unitMembership.findMany({
      where: { unitId: membership.unitId },
      include: { user: { select: { name: true, email: true } }, patrol: { select: { name: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    // Pending only -- the same conditions lib/invitations.ts's
    // invitationState() calls "pending".
    db.unitInvitation.findMany({
      where: { unitId: membership.unitId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const asplCount = members.filter((m) => m.role === "ASPL").length;

  return (
    <Stack spacing={4} sx={{ maxWidth: 800 }}>
      <Stack spacing={0.5}>
        <Typography variant="h5">{unitDisplayName(unit)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {unit.district.name} · {councilDisplayName(unit.district.council)}
        </Typography>
      </Stack>

      <Stack spacing={2} component="section" aria-labelledby="members-heading">
        <Typography id="members-heading" variant="h6">
          Members
        </Typography>
        <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {members.map((m) => {
            const isLastAspl = m.role === "ASPL" && asplCount <= 1;
            return (
              <Paper key={m.id} component="li" variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {m.user.name}
                      {m.userId === membership.userId ? " (you)" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {m.role === "ASPL" ? "ASPL of Camping" : `Patrol Leader — ${m.patrol?.name ?? "no patrol"}`}
                      {m.user.email ? ` · ${m.user.email}` : ""}
                    </Typography>
                  </Stack>
                  <Box component="form" action={removeMember}>
                    <input type="hidden" name="membershipId" value={m.id} />
                    <SubmitButton
                      size="small"
                      variant="contained"
                      disabled={isLastAspl}
                      sx={OLIVE_ACTION_SX}
                    >
                      Remove
                    </SubmitButton>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Stack>

      <Stack spacing={2} component="section" aria-labelledby="invite-heading">
        <Typography id="invite-heading" variant="h6">
          Invite an ASPL of Camping
        </Typography>
        <Alert severity="info">
          Inviting Patrol Leaders isn&apos;t available yet. It&apos;s waiting on parent/guardian-approved accounts for
          youth.
        </Alert>
        <InviteMemberForm />
      </Stack>

      {invitations.length > 0 && (
        <Stack spacing={2} component="section" aria-labelledby="pending-heading">
          <Typography id="pending-heading" variant="h6">
            Pending invitations
          </Typography>
          <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {invitations.map((invitation) => {
              const expires = formatEventDate(invitation.expiresAt, now);
              return (
              <Paper key={invitation.id} component="li" variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{invitation.email}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ASPL of Camping · expires <RelativeDate {...expires} display={expires.display.toLowerCase()} />
                    </Typography>
                  </Stack>
                  <Box component="form" action={revokeInvitation}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <SubmitButton size="small" variant="contained" sx={OLIVE_ACTION_SX}>
                      Cancel
                    </SubmitButton>
                  </Box>
                </Stack>
              </Paper>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
