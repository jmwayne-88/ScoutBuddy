"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  checkInvitationAcceptance,
  hashInvitationToken,
  INVITATION_STATE_MESSAGES,
  invitationState,
} from "@/lib/invitations";
import { requireString } from "@/lib/form-data";
import { withToast } from "@/lib/toast";
import { UNIT_HIERARCHY_INCLUDE, unitFullLabel } from "@/lib/units";

export type AcceptInvitationState = { error: string | null };

// REQ-34.5/34.7: the signed-in half of accepting an invitation (someone who
// already has an account -- e.g. an adult joining a second unit). The
// signed-out half creates the account itself, in lib/auth.ts's passkey
// signup. Both consume the invitation the same way: a conditional update
// only one acceptance can win.
export async function acceptInvitation(
  _prev: AcceptInvitationState,
  formData: FormData
): Promise<AcceptInvitationState> {
  const token = requireString(formData, "token");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "Sign in first, then open your invitation link again." };
  }

  const invitation = await db.unitInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { unit: { include: UNIT_HIERARCHY_INCLUDE } },
  });
  if (!invitation) {
    return { error: "That invitation link isn't valid." };
  }

  const now = new Date();
  const account = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true },
  });
  const [existingMembership, emailOwner] = await Promise.all([
    db.unitMembership.findUnique({
      where: { userId_unitId: { userId: session.user.id, unitId: invitation.unitId } },
      select: { id: true },
    }),
    account.email === null
      ? db.user.findFirst({
          where: { email: { equals: invitation.email, mode: "insensitive" }, id: { not: session.user.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const check = checkInvitationAcceptance({
    state: invitationState(invitation, now),
    invitationEmail: invitation.email,
    account,
    emailBelongsToAnotherAccount: emailOwner !== null,
    alreadyMember: existingMembership !== null,
  });
  if (!check.ok) return { error: check.reason };

  // REQ-34.6: new Patrol Leader memberships are paused until Requirement
  // 33's adult-mediated youth path exists (user decision, 2026-10-23).
  if (invitation.role !== "ASPL") {
    return { error: "Patrol Leader invitations aren't available yet." };
  }

  try {
    await db.$transaction(async (tx) => {
      const claimed = await tx.unitInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now },
      });
      if (claimed.count !== 1) throw new Error("claimed");

      // Following the emailed link verified this address (REQ-34.7); an
      // account with no email yet takes it on.
      await tx.user.update({
        where: { id: session.user.id },
        data: { email: account.email ?? invitation.email, emailVerified: true },
      });
      await tx.unitMembership.create({
        data: {
          userId: session.user.id,
          unitId: invitation.unitId,
          role: invitation.role,
          patrolId: invitation.patrolId,
          source: "INVITATION",
          invitationId: invitation.id,
        },
      });
      await tx.unitEvent.create({
        data: {
          unitId: invitation.unitId,
          type: "INVITATION_ACCEPTED",
          actorUserId: session.user.id,
          subjectUserId: session.user.id,
        },
      });
      // They just joined -- act in the new unit straight away.
      await tx.session.update({ where: { id: session.session.id }, data: { activeUnitId: invitation.unitId } });
    });
  } catch {
    return { error: INVITATION_STATE_MESSAGES.accepted };
  }

  redirect(withToast("/", `Welcome to ${unitFullLabel(invitation.unit)}`));
}
