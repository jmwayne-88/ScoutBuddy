import { cache } from "react";
import { headers as nextHeaders } from "next/headers";
import type { UnitRole } from "@prisma/client";
import { auth } from "./auth";
import { db } from "./db";
import { unitDb, type UnitDb } from "./unit-db";
import { UNIT_HIERARCHY_INCLUDE, councilDisplayName, unitDisplayName, unitFullLabel } from "./units";

// REQ-27.11: an Actor is always someone acting *in a unit*, so it carries
// that unit -- lib/permissions.ts checks a resource's unitId against it.
export type Actor =
  | { role: "ASPL"; unitId: string }
  | { role: "PATROL_LEADER"; patrolId: string; unitId: string };

// REQ-34.2: a role now comes from the active unit's UnitMembership rather
// than the account itself (ADR 0035, superseding ADR 0033's interim
// User.role/patrolId). Actor's shape is unchanged on purpose, same as when
// ADR 0033 replaced ADR 0010's cookie -- lib/permissions.ts and every
// Server Action that calls getActor() need no changes.
//
// Pure and exported separately so the part that's actually regression-
// prone -- narrowing a membership into Actor -- is unit-testable without a
// database or request context.
export function mapMembershipToActor(
  membership: { role: UnitRole | string; patrolId: string | null; unitId: string } | null | undefined
): Actor | null {
  if (!membership) return null;
  const { unitId } = membership;
  if (membership.role === "ASPL") return { role: "ASPL", unitId };
  // A Patrol Leader membership whose patrol was deleted has patrolId=null
  // (onDelete: SetNull) -- no access in that unit, same outcome REQ-8.14's
  // deleted-patrol check produced before. Deactivation alone doesn't
  // remove access.
  if (membership.role === "PATROL_LEADER" && typeof membership.patrolId === "string") {
    return { role: "PATROL_LEADER", patrolId: membership.patrolId, unitId };
  }
  return null;
}

// REQ-34.3: the session's activeUnitId is only a preference, never proof
// of access. It counts only if it names a unit the person actually belongs
// to; otherwise (missing, tampered, or a unit they were removed from --
// REQ-34.8) it re-resolves to their earliest membership, or to nothing at
// all if they have none.
export function resolveActiveMembership<M extends { unitId: string; createdAt: Date }>(
  memberships: M[],
  activeUnitId: string | null | undefined
): M | null {
  if (activeUnitId) {
    const match = memberships.find((m) => m.unitId === activeUnitId);
    if (match) return match;
  }
  if (memberships.length === 0) return null;
  return memberships.reduce((earliest, m) => (m.createdAt < earliest.createdAt ? m : earliest));
}

async function loadActiveContext(headers: Headers) {
  const result = await auth.api.getSession({ headers });
  if (!result?.session || !result.user) return null;

  const memberships = await db.unitMembership.findMany({
    where: { userId: result.user.id },
    include: { unit: { include: UNIT_HIERARCHY_INCLUDE } },
    orderBy: { createdAt: "asc" },
  });

  const storedActiveUnitId = (result.session as { activeUnitId?: string | null }).activeUnitId ?? null;
  const active = resolveActiveMembership(memberships, storedActiveUnitId);
  const resolvedUnitId = active?.unitId ?? null;

  // Write the re-resolved unit back so the session stops pointing at a unit
  // the person no longer belongs to. updateMany, not update: the session
  // row may have been revoked between the read above and this write.
  if (resolvedUnitId !== storedActiveUnitId) {
    await db.session.updateMany({ where: { id: result.session.id }, data: { activeUnitId: resolvedUnitId } });
  }

  return {
    userId: result.user.id,
    sessionId: result.session.id,
    name: result.user.name,
    memberships,
    active,
    actor: mapMembershipToActor(active),
  };
}

// Deduplicated per request -- the layout, the page, and getCurrentUser all
// ask for the same thing. Only the real-request path is cached; an
// injected `requestHeaders` (tests) always loads fresh.
const loadActiveContextForRequest = cache(async () => loadActiveContext(await nextHeaders()));

function getActiveContext(requestHeaders?: Headers) {
  return requestHeaders ? loadActiveContext(requestHeaders) : loadActiveContextForRequest();
}

// `requestHeaders` is injectable (matching lib/db-environment-guard.ts's
// existing pattern of an optional parameter defaulting to the real runtime
// value) so tests can call this without needing next/headers' request
// context, which only exists inside an actual request.
export async function getActor(requestHeaders?: Headers): Promise<Actor | null> {
  return (await getActiveContext(requestHeaders))?.actor ?? null;
}

export type UnitScope = {
  actor: Actor;
  unitId: string;
  db: UnitDb;
};

// REQ-27.5/27.12: how every page, Server Action, and route handler gets at
// troop data -- the actor plus a database client bound to the actor's
// active unit (lib/unit-db.ts). Null when no one is acting in a unit.
export async function getUnitScope(requestHeaders?: Headers): Promise<UnitScope | null> {
  const actor = await getActor(requestHeaders);
  if (!actor) return null;
  return { actor, unitId: actor.unitId, db: unitDb(actor.unitId) };
}

export class NoUnitScopeError extends Error {
  constructor() {
    super("Sign in to a unit to do that.");
  }
}

export async function requireUnitScope(requestHeaders?: Headers): Promise<UnitScope> {
  const scope = await getUnitScope(requestHeaders);
  if (!scope) throw new NoUnitScopeError();
  return scope;
}

export type ActiveMembershipContext = {
  userId: string;
  sessionId: string;
  unitId: string;
  actor: Actor;
};

// For Server Actions that act on the active unit itself (members,
// invitations, switching) -- they need the unit and user ids, not just the
// role Actor carries.
export async function getActiveMembership(requestHeaders?: Headers): Promise<ActiveMembershipContext | null> {
  const context = await getActiveContext(requestHeaders);
  if (!context?.active || !context.actor) return null;
  return { userId: context.userId, sessionId: context.sessionId, unitId: context.active.unitId, actor: context.actor };
}

// Distinguishes "signed out" from "signed in, but not acting in any unit"
// (e.g. just removed from their only unit) -- app/(app)/layout.tsx sends
// the first to /login and the second to /no-unit.
export async function getSessionStatus(requestHeaders?: Headers): Promise<"signed-out" | "no-unit" | "active"> {
  const context = await getActiveContext(requestHeaders);
  if (!context) return "signed-out";
  return context.actor ? "active" : "no-unit";
}

// REQ-31.6/32.2: "passkey" is standing, full assurance; "recovery" is the
// bootstrap/recovery tier every magic-link session gets (REQ-31.3: magic
// link is never a standing credential). REQ-34's invitation management and
// member removal are the first actions to call requireStepUp().
export type AssuranceTier = "passkey" | "recovery";

// Pure, same reasoning as mapMembershipToActor above. Fail-closed by
// construction: only an explicit "passkey" marker counts as the higher
// tier. A missing/unrecognized value (a row from before this field
// existed, or a future credential type that doesn't set it) falls through
// to "recovery" -- requireStepUp() below would then correctly still demand
// a fresh passkey challenge, rather than silently waving through a session
// this function doesn't actually know the strength of.
export function mapSessionToAssuranceTier(session: { createdVia?: string | null } | null | undefined): AssuranceTier {
  return session?.createdVia === "passkey" ? "passkey" : "recovery";
}

export async function getSessionAssuranceTier(requestHeaders?: Headers): Promise<AssuranceTier | null> {
  const headers = requestHeaders ?? (await nextHeaders());
  const result = await auth.api.getSession({ headers });
  if (!result?.session) return null;
  return mapSessionToAssuranceTier(result.session as { createdVia?: string | null });
}

export class StepUpRequiredError extends Error {
  constructor() {
    super("This action requires signing in with a passkey.");
  }
}

// A Server Action marked "sensitive" (REQ-31.6) calls this at its start.
export async function requireStepUp(requestHeaders?: Headers): Promise<void> {
  const tier = await getSessionAssuranceTier(requestHeaders);
  if (tier !== "passkey") {
    throw new StepUpRequiredError();
  }
}

export type UnitSummary = {
  id: string;
  shortName: string;
  hierarchyLabel: string;
  fullLabel: string;
};

export type CurrentUser = {
  id: string;
  name: string;
  actor: Actor;
  activeUnit: UnitSummary;
  units: UnitSummary[];
};

// For the account/unit identity UI in the AppBar -- richer than Actor,
// which lib/permissions.ts intentionally keeps minimal.
export async function getCurrentUser(requestHeaders?: Headers): Promise<CurrentUser | null> {
  const context = await getActiveContext(requestHeaders);
  if (!context?.active || !context.actor) return null;

  const units = context.memberships.map((m) => ({
    id: m.unitId,
    shortName: unitDisplayName(m.unit),
    hierarchyLabel: `${m.unit.district.name} · ${councilDisplayName(m.unit.district.council)}`,
    fullLabel: unitFullLabel(m.unit),
  }));

  const activeUnitId = context.active.unitId;
  const activeUnit = units.find((u) => u.id === activeUnitId);
  if (!activeUnit) return null;

  return { id: context.userId, name: context.name, actor: context.actor, activeUnit, units };
}
