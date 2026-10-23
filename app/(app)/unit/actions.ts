"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { baseURL } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { requireString } from "@/lib/form-data";
import {
  generateInvitationToken,
  INVITATION_TTL_MS,
  isPlausibleEmail,
  normalizeEmail,
} from "@/lib/invitations";
import { canManageUnitMembers } from "@/lib/permissions";
import { getActiveMembership, requireStepUp, StepUpRequiredError } from "@/lib/session";
import { withToast } from "@/lib/toast";
import { pathAfterUnitSwitch, UNIT_HIERARCHY_INCLUDE, unitFullLabel } from "@/lib/units";

const STEP_UP_MESSAGE = "For security, sign out and sign back in with your passkey to manage members.";

// REQ-31.6: invitations and removals are the first actions marked
// sensitive -- a magic-link (recovery-tier) session must step up first.
async function requireMemberManager() {
  const membership = await getActiveMembership();
  if (!membership || !canManageUnitMembers(membership.actor)) {
    throw new Error("Only the ASPL of Camping can manage unit members.");
  }
  return membership;
}

async function stepUpOrRedirect(): Promise<void> {
  try {
    await requireStepUp();
  } catch (error) {
    if (error instanceof StepUpRequiredError) redirect(withToast("/unit", STEP_UP_MESSAGE));
    throw error;
  }
}

export type InviteFormState = { error: string | null; sentTo: string | null };

// REQ-34.5: an email-bound, single-use, expiring invitation from the
// active unit's ASPL. Only ASPL invitations for now -- a Patrol Leader is a
// youth, and REQ-34.6 routes youth through Requirement 33's adult-mediated
// signup, which isn't built (new Patrol Leader sign-ups paused, user
// decision 2026-10-23).
export async function inviteMember(_prev: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const manager = await requireMemberManager();
  try {
    await requireStepUp();
  } catch (error) {
    if (error instanceof StepUpRequiredError) return { error: STEP_UP_MESSAGE, sentTo: null };
    throw error;
  }

  const raw = formData.get("email");
  const email = typeof raw === "string" ? normalizeEmail(raw) : "";
  if (!isPlausibleEmail(email)) {
    return { error: "Enter a valid email address.", sentTo: null };
  }

  const alreadyMember = await db.unitMembership.findFirst({
    where: { unitId: manager.unitId, user: { email: { equals: email, mode: "insensitive" } } },
    select: { id: true },
  });
  if (alreadyMember) {
    return { error: `${email} is already a member of this unit.`, sentTo: null };
  }

  const [unit, inviter] = await Promise.all([
    db.unit.findUniqueOrThrow({ where: { id: manager.unitId }, include: UNIT_HIERARCHY_INCLUDE }),
    db.user.findUniqueOrThrow({ where: { id: manager.userId }, select: { name: true } }),
  ]);

  const now = new Date();
  const { token, tokenHash } = generateInvitationToken();

  // Sending again to the same address replaces the earlier invitation, so
  // only the newest link works.
  const invitation = await db.$transaction(async (tx) => {
    await tx.unitInvitation.updateMany({
      where: { unitId: manager.unitId, email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    return tx.unitInvitation.create({
      data: {
        unitId: manager.unitId,
        email,
        role: "ASPL",
        tokenHash,
        expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        invitedById: manager.userId,
      },
    });
  });

  try {
    await sendInvitationEmail(email, `${baseURL}/invite/${token}`, {
      unitLabel: unitFullLabel(unit),
      roleLabel: "ASPL of Camping",
      inviterName: inviter.name,
    });
  } catch {
    await db.unitInvitation.delete({ where: { id: invitation.id } });
    return { error: "The invitation email couldn't be sent. Please try again.", sentTo: null };
  }

  await db.unitEvent.create({
    data: { unitId: manager.unitId, type: "INVITATION_SENT", actorUserId: manager.userId, detail: email },
  });

  revalidatePath("/unit");
  return { error: null, sentTo: email };
}

export async function revokeInvitation(formData: FormData) {
  const manager = await requireMemberManager();
  await stepUpOrRedirect();

  const invitationId = requireString(formData, "invitationId");
  // Scoped to the active unit -- an id from another unit matches nothing.
  const { count } = await db.unitInvitation.updateMany({
    where: { id: invitationId, unitId: manager.unitId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 1) {
    await db.unitEvent.create({
      data: { unitId: manager.unitId, type: "INVITATION_REVOKED", actorUserId: manager.userId, detail: invitationId },
    });
  }

  revalidatePath("/unit");
  redirect(withToast("/unit", "Invitation cancelled"));
}

// REQ-34.8: removes only this unit's membership -- never the account, and
// never a membership in another unit. Their sessions pointing at this unit
// re-resolve on their next request (lib/session.ts), so nothing has to
// reach into them here.
export async function removeMember(formData: FormData) {
  const manager = await requireMemberManager();
  await stepUpOrRedirect();

  const membershipId = requireString(formData, "membershipId");
  const membership = await db.unitMembership.findFirst({
    where: { id: membershipId, unitId: manager.unitId },
    include: { user: { select: { name: true } } },
  });
  if (!membership) {
    redirect(withToast("/unit", "That person isn't a member of this unit"));
  }

  if (membership.role === "ASPL") {
    const asplCount = await db.unitMembership.count({ where: { unitId: manager.unitId, role: "ASPL" } });
    if (asplCount <= 1) {
      redirect(withToast("/unit", "A unit needs at least one ASPL of Camping. Invite another before removing this one."));
    }
  }

  await db.$transaction([
    db.unitMembership.delete({ where: { id: membership.id } }),
    db.unitEvent.create({
      data: {
        unitId: manager.unitId,
        type: "MEMBER_REMOVED",
        actorUserId: manager.userId,
        subjectUserId: membership.userId,
        detail: membership.role,
      },
    }),
  ]);

  revalidatePath("/unit");
  // Removing yourself means this unit is no longer one you can act in.
  redirect(withToast(membership.userId === manager.userId ? "/" : "/unit", `${membership.user.name} removed from the unit`));
}

// REQ-34.3/34.4: the only writer of a session's activeUnitId besides
// lib/session.ts's own re-resolution -- and only to a unit the person is
// actually a member of.
export async function switchUnit(formData: FormData) {
  const unitId = requireString(formData, "unitId");
  const pathnameRaw = formData.get("pathname");
  const pathname = typeof pathnameRaw === "string" ? pathnameRaw : "/";

  const current = await getActiveMembership();
  if (!current) redirect("/");

  const membership = await db.unitMembership.findUnique({
    where: { userId_unitId: { userId: current.userId, unitId } },
    include: { unit: { include: UNIT_HIERARCHY_INCLUDE } },
  });
  if (!membership) {
    throw new Error("You aren't a member of that unit.");
  }

  await db.session.update({ where: { id: current.sessionId }, data: { activeUnitId: unitId } });

  revalidatePath("/", "layout");
  redirect(withToast(pathAfterUnitSwitch(pathname, membership.role), `Switched to ${unitFullLabel(membership.unit)}`));
}
