# 0035. Units, the Council/District hierarchy, per-unit memberships, and email invitations

Date: 2026-10-23
Status: Accepted. Supersedes [ADR 0033](0033-passkey-based-authentication-via-better-auth.md)'s interim role-on-`User` placement and its self-service signup.

## Context

[ADR 0033](0033-passkey-based-authentication-via-better-auth.md) built real accounts but kept two interim shapes on purpose: role and patrol stored directly on `User` (the app was single-unit), and `/signup` letting anyone declare a role. Both were named as things [Requirement 34](../requirements/authentication-accounts/34-unit-membership-invitations-switching.md) would replace.

Requirement 34 needs a `Unit` that a person can belong to, a role held per unit, an active unit per session that can't be spoofed, and joining only through an explicit, auditable invitation. On 2026-10-23 the user also settled how a unit is identified: the way Scouting America identifies it (Unit Type, Unit Number, Gender Designation, District, and Council), unique per district, with councils keyed by their council number.

[Requirement 27](../requirements/27-multi-tenant-unit-isolation.md) (scoping campouts, patrols, and menus to a unit) is **not** built yet. That shapes what this ADR can safely turn on.

## Decision

**Our own tables, not Better Auth's organization plugin.** ADR 0033 noted the plugin as the expected base. On inspection it fits poorly: a unit's identity is several typed, constrained fields plus a Council → District hierarchy with its own uniqueness rules; shareable invite codes and our membership-source traceability aren't plugin concepts; and REQ-34.7 names an invitation-acceptance CVE class, which is easier to rule out in ~100 lines we own than to track in a plugin's release notes. The plugin isn't installed, so that CVE doesn't apply to this codebase directly. The design below closes the class itself (see Invitations).

**Data model** (`prisma/schema.prisma`, migration `20261023200000_units_memberships_invitations`):

- `Council` is keyed by `number` (unique). `name` is editable, and `isActive` retires a council emptied by a merger without deleting it.
- `District` is identified by id, with `name` editable. Uniqueness is `(councilId, normalizedName)`, where the normalized name is lowercased and whitespace-collapsed (`lib/units.ts`).
- `Unit` has `unitType` (`PACK|TROOP|CREW|SHIP|POST`), `unitNumber`, `genderDesignation` (`BOYS|GIRLS|FAMILY`), and `districtId`. Uniqueness is `(districtId, unitType, unitNumber, genderDesignation)`. Every column in that key is required, so there's no NULL-distinctness gap, and `unitNumber` is CHECK-constrained to 1–9999 in SQL. There's no stored name: "Troop 8 (Boys)" is always derived. A unit's council is only ever reached through its district.
- `UnitMembership` is `(userId, unitId)` unique, with `role` (`ASPL|PATROL_LEADER`), an optional `patrolId`, and a `source` (`INVITATION` with `invitationId` set, or `MIGRATION` for the backfill) so every membership is traceable to how it was created.
- `UnitInvitation` is email-bound, stores only a SHA-256 `tokenHash`, and has `expiresAt` (7 days) and `acceptedAt`/`revokedAt`.
- `UnitEvent` is an append-only log of membership actions. Its user ids are plain strings, not foreign keys, so the log outlives deleted accounts ([Requirement 35](../requirements/35-user-account-disabling-deletion.md)).
- `Session.activeUnitId` has no foreign key on purpose (see below). `User.role`/`User.patrolId` are dropped.

**Migration.** The migration is hand-ordered so the backfill runs before the old columns drop, the same style as [ADR 0018](0018-patrols-as-database-rows.md). It does the following:

1. Seeds 235 councils with their numbers from Wikipedia's "List of councils (Scouting America)" as of 2026-10-23. The four former region numbers and the National Council are left out; Direct Service (800) is included.
2. Creates the existing troop's unit: Troop 8 (Boys), Buckeye District, council #433. This is a **fictitious identity chosen by the user** for now, to be corrected through Platform Admin tools later. The user said "Great Trails Council"; the seeded name for #433 is "Great Trail Council".
3. Turns every existing account's role and patrol into a `MIGRATION` membership in that unit.
4. Points existing sessions at that unit.

Because seed rows live in the migration, every environment, including the test branch ([ADR 0014](0014-separate-dev-test-database-branch.md)), gets the same councils automatically (the [ADR 0019](0019-local-production-credentials-and-automated-migrations.md) deploy runs it on production).

**Active unit (REQ-34.3).** `lib/session.ts` loads the user's memberships on every request and treats `Session.activeUnitId` as a preference only. It counts if it names a unit they belong to. Otherwise it re-resolves to their earliest membership, or to none, and writes the corrected value back. That one rule covers a tampered value, a stale one, and removal from the active unit (REQ-34.8) without anything reaching into other people's sessions. `Actor`'s shape is unchanged, so `lib/permissions.ts` and its call sites need no edits, the same containment ADR 0033 achieved. The loader is wrapped in React `cache()` so the layout and page share one lookup per request. A signed-in person with no memberships goes to `/no-unit`, not `/login`.

**Invitations (REQ-34.5/34.7).**
- **Tokens.** Each token is 32 random bytes, sent only in the emailed link, and only its hash is stored, so neither an invitation's id nor a database read can accept one.
- **Verification.** Following the link is the email verification: it proves access to the invited inbox, so acceptance sets `emailVerified`.
- **Email binding.** A signed-in account can accept only if its email matches the invitation's, or if it has no email and no other account uses that one.
- **Single use.** Acceptance is a conditional `updateMany` (pending, unexpired, unrevoked), so only one of two racing acceptances can win.
- **Resending.** Sending to the same address again revokes the earlier pending invitation.

**Invite-only signup, created after the passkey verifies.** `/signup` now just explains that ScoutBuddy is invite-only. Accounts are created from `/invite/[token]`. The passkey plugin's `resolveUser` runs when the browser requests registration options, *before* the passkey prompt, so it only validates the invitation and reserves an id. The account, membership, and invitation consumption happen in `afterVerification`, after the passkey is verified. ADR 0033's version created the account in `resolveUser`, which left an orphan account whenever someone cancelled the prompt. This version leaves nothing behind and keeps the invitation usable.

**Step-up.** Sending or cancelling an invitation and removing a member are the first actions to call `requireStepUp()` (REQ-31.6). A magic-link session is asked to sign in with a passkey first.

**Switching (REQ-34.4).** `components/UnitSwitcher.tsx` sits in the AppBar and lists only the person's own units with district and council. The `switchUnit` action verifies membership, rewrites `activeUnitId`, and lands on an equivalent page (`lib/units.ts`'s `pathAfterUnitSwitch`): a section's list page, never a record id from the old unit, and `/` for a section the new role can't use.

**What's deliberately not on yet:**
- **Creating units.** Until Requirement 27 scopes data per unit, a second unit would see the first unit's campouts.
- **Patrol Leader invitations.** Patrol Leaders are youth, and REQ-34.6 routes youth through [Requirement 33](../requirements/33-youth-account-creation-coppa.md). New Patrol Leader sign-ups are paused by user decision; the invite form can't create one, and both acceptance paths reject one. Existing Patrol Leaders keep working.
- **District renames and cross-council moves.** These are Platform Admin actions ([Requirement 38](../requirements/38-platform-admin-cross-tenant-support.md)).
- **Within-council moves.** These belong to adult leader roles that don't exist yet.
- **Shareable invite codes.** REQ-34.5 is satisfied by email invitations alone.
- **Member management stays ASPL-only** until the permissions pass.

## Alternatives Considered

- **Better Auth organization plugin**: rejected above, for its poor fit with the hierarchy and identity rules, and because the invitation flow is safer owned than tracked.
- **Storing a council name on the unit / districts as free text**: rejected by the user's own rules. Names change, so councils are keyed by number and districts by id, with names editable.
- **Trusting `activeUnitId` once set at sign-in**: rejected. REQ-34.3 requires revalidation on every request, and re-resolving is also what makes removal take effect without touching other sessions.
- **Creating the account in `resolveUser`** (ADR 0033's approach): rejected because it consumes an invitation before the passkey prompt, so a cancel would burn it.
- **Keeping open signup for Patrol Leaders until Requirement 33**: offered to the user and declined in favor of pausing new Patrol Leader sign-ups.

## Consequences

- ADR 0033's interim role-on-`User` and self-service signup are gone. `components/SignupForm.tsx` is deleted, and `/login` no longer links to an open signup.
- New people can join only by email invitation from an ASPL. Until Requirement 33, that means only ASPLs can be added.
- Invitation emails go through `lib/email.ts` and Resend, with the same console fallback as magic links when `RESEND_API_KEY` is unset.
- Units exist, but their data isn't separated yet. That's Requirement 27, and unit creation stays off until it lands.
- The council list is a snapshot with no automatic sync. Corrections are hand edits.
- The existing unit's identity is fictitious until changed through Requirement 38's tools.

## Related

- [ADR 0033](0033-passkey-based-authentication-via-better-auth.md): superseded in part (role-on-`User`, self-service signup).
- [ADR 0034](0034-account-recovery-token-and-session-invalidation.md): the assurance tiers `requireStepUp()` reads.
- [ADR 0018](0018-patrols-as-database-rows.md): the hand-ordered backfill migration style.
- [ADR 0025](0025-useactionstate-for-patrol-color-validation.md): the `useActionState` pattern the invite and accept forms follow.
- [Requirement 34](../requirements/authentication-accounts/34-unit-membership-invitations-switching.md), [Requirement 27](../requirements/27-multi-tenant-unit-isolation.md), [Requirement 33](../requirements/33-youth-account-creation-coppa.md), [Requirement 38](../requirements/38-platform-admin-cross-tenant-support.md).
