# Requirement 34 — Unit Membership, Invitations & Switching

Status: Not started
Depends on: [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md). Integrates with [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](33-youth-account-creation-coppa.md) whenever an invitation's recipient is a youth.

## Goal

Let a signed-in person belong to one or more Units, join a new one only through an explicit, auditable action, and switch their active unit without re-authenticating — the account-side half of multi-tenancy, built and reviewed independently of the unitId-propagation/RLS/data-isolation work in [Requirement 27](27-multi-tenant-unit-isolation.md).

## Source

[Requirement 27](27-multi-tenant-unit-isolation.md)'s original "Accounts, membership & switching" section (REQ-27.7 through REQ-27.10, 2026-10-18), moved here unchanged in substance as part of the 2026-10-23 restructuring that split the authentication prerequisite into independently reviewable requirements.

## Requirements

### The membership data model

- **REQ-34.1** A minimal `Unit` entity exists — just enough for membership to attach to (id, name, createdAt). [Requirement 27](27-multi-tenant-unit-isolation.md) owns propagating this id onto every other business table and enforcing isolation around it; this requirement only needs `Unit` to exist, not to be fully wired through the rest of the schema.
- **REQ-34.2** A `UnitMembership` join table associates a `User` with a `Unit` and a role (`PATROL_LEADER` or `ASPL`), plus, for a Patrol Leader, which `Patrol` they lead. A single user can hold memberships in more than one unit at once, and role is scoped per-membership, not global — the same person can be the ASPL in one unit and a Patrol Leader in another.

### Active unit & switching

- **REQ-34.3** The signed-in person's active unit is tracked server-side (e.g. `activeUnitId` on their session) and revalidated against their actual `UnitMembership` rows on every request — never inferred from a request parameter, and never trusted from a client-supplied value alone. A tampered or stale `activeUnitId` must never grant access to a unit the person isn't a member of.
- **REQ-34.4** A unit switcher is reachable from anywhere in the app (e.g. the header, alongside or replacing today's role picker), lists only units the signed-in person actually belongs to, and switching is a single action that returns them to an equivalent page scoped to the new unit — never leaving a page still showing the previous unit's data mid-navigation.

### Joining & leaving

- **REQ-34.5** Joining a unit happens only through an explicit, auditable action: an invite (email-bound, single-use, expiring) sent by that unit's ASPL, or a shareable invite code (short-lived, capped-use) — never inferred from matching email domains, names, or any other heuristic. A person is never silently added to a unit they didn't take an action to join.
- **REQ-34.6** An invite targeting a youth follows [Requirement 33](33-youth-account-creation-coppa.md)'s adult-mediated creation path — the inviting adult (or the youth's parent/guardian) completes account creation on the youth's behalf, rather than the youth accepting the invite directly with a personal email.
- **REQ-34.7** Invitation endpoints require email verification before an invite can be accepted. This is a named, real vulnerability class — CVE-2026-53514 affects an invitation flow in exactly this way, letting an unverified session accept an invite if it obtains the invitation ID — so whichever invitation mechanism/library is chosen at build time is checked against its own current security advisories before launch, not assumed safe by reputation.
- **REQ-34.8** Removing a person from a unit deletes (or deactivates) only their `UnitMembership` row for that unit — never their global `User` account, and never any membership they hold in a different unit. If their active session's `activeUnitId` pointed at the removed unit, it's forced to re-resolve on their next request rather than left dangling. The removal is logged (who removed whom, when).

## Acceptance Criteria

- [ ] A person with memberships in two units can switch their active unit from a reachable control, with no page showing the previous unit's data after the switch.
- [ ] No `UnitMembership` is ever created without a traceable invite or invite-code acceptance.
- [ ] A tampered or stale `activeUnitId` is tested, not just coded, to never grant access to a unit the person isn't a member of.
- [ ] Removing a person from Unit A leaves their Unit B membership, and their account as a whole, completely intact.
- [ ] The invitation mechanism in use is confirmed patched against known invitation-acceptance vulnerabilities (e.g. CVE-2026-53514-class issues) before launch.

## Out of Scope for This Requirement

- Propagating `unitId` to every other business table, Row-Level Security, and the cross-tenant isolation test suite — [Requirement 27](27-multi-tenant-unit-isolation.md).
- Export or deletion of an entire unit's data — [Requirement 27](27-multi-tenant-unit-isolation.md)'s REQ-27.15.
- Disabling or deleting a person's account entirely (as opposed to removing one membership) — [Requirement 35](35-user-account-disabling-deletion.md).

## Related

- [Requirement 27 - Multi-Tenant Unit Isolation & Switching](27-multi-tenant-unit-isolation.md) — depends on this requirement for `Unit`/`UnitMembership` to already exist; REQ-27.7-27.10 were moved here.
- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — this requirement's prerequisite.
- [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](33-youth-account-creation-coppa.md) — the path REQ-34.6 routes youth invitations through.
- [Requirement 35 - User Account Disabling & Deletion](35-user-account-disabling-deletion.md) — depends on this requirement for membership to exist as a concept before lifecycle actions on it make sense.
- CVE-2026-53514 — the invitation-acceptance vulnerability class REQ-34.7 guards against.
