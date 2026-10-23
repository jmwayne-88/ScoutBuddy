# Requirement 37 — Roster Reimport, Conflict Resolution & Member-Number Correction

Status: Not started
Depends on: [Requirement 36 - Roster Import & Suggested Role Assignment](36-roster-import-user-creation.md)

## Goal

Let a unit re-import its roster over time — as people join, leave, change patrols or positions, or as Scouting America corrects a longstanding duplicate/incorrect member-number problem across its own systems — without silently overwriting ScoutBuddy's own data, silently breaking anything that currently depends on it, or losing track of who's who when a person's member number itself changes. A conflict between what's already stored and what a new import says is surfaced as a flag or warning in an Action Center for a human to resolve — never auto-resolved.

## Source

User feedback, 2026-10-23: Scouting America is actively correcting duplicate/incorrect member IDs across its own systems, so this app needs the ability to update a person's member number over time rather than treating it as permanently fixed; a new import should update the roster information this app retains, but resolve any conflict through flags, warnings, and/or an action center in the UI rather than silently overwriting data or breaking existing functionality.

## Requirements

### Member-number correction

- **REQ-37.1** A person's registration/member number can be corrected after the fact. Correcting it never creates a new `User` or a new person record — the existing record, and everything attached to it (`UnitMembership` rows, account, retained roster history), is kept under its original identity; only the number itself is updated.
- **REQ-37.2** Every number change is recorded with a history: the prior number(s), the new number, when the change was recorded, and who confirmed it — an audit trail, consistent with how [Requirement 34](34-unit-membership-invitations-switching.md)'s REQ-34.8 already logs membership removal.
- **REQ-37.3** A re-import row with no matching member number in this unit, but whose other fields (name, age bucket, address, or guardian contact) closely match an existing person, is surfaced as a **likely renumbering** — never silently matched, and never silently treated as a brand-new person either. (Age bucket, not date of birth, is the comparable signal here — [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.8 means no stored DOB exists to compare the new row's raw date against in the first place.) A human confirms the match (or rejects it, creating a genuinely new person) before anything is linked, the same human-confirmation discipline [Requirement 36](36-roster-import-user-creation.md) already established for role suggestions.
- **REQ-37.4** A confirmed renumbering never duplicates `UnitMembership` rows or any retained informational data — it's the same person, continuously, before and after the correction.

### Reimport & conflict resolution

- **REQ-37.5** Re-running an import against a unit's roster compares the new data to what's currently stored, person by person and field by field, rather than blindly overwriting. A field that didn't change is left alone — no churn, no false "this was updated" noise.
- **REQ-37.6** A field that *did* change between the stored value and the new import is not silently applied. It's surfaced as a reviewable item — what changed, from what to what — for a human to accept, reject, or edit, the same review-before-write discipline [Requirement 36](36-roster-import-user-creation.md) established for the initial import.
- **REQ-37.7** A change that could affect ScoutBuddy's own functional data — most notably a roster `Positions`/`Patrol` change that contradicts an existing, ScoutBuddy-confirmed role or patrol assignment (e.g. the roster no longer lists someone as "Patrol Leader [ Eagle ]" but ScoutBuddy still has them set as the Eagle Patrol's Patrol Leader) — is flagged with higher visibility than an ordinary informational-field change, and is never auto-applied in a way that would silently remove or reassign a role. ScoutBuddy's own role/patrol assignment only ever changes through an explicit human action — the normal in-app flow, or a reviewed reimport flag — never as a side effect of a routine data refresh.
- **REQ-37.8** All outstanding reimport conflicts (field changes awaiting review, likely-renumbering matches awaiting confirmation) are collected in one reachable place in the UI — an Action Center — rather than scattered across individual record pages or silently dropped. An unresolved flag is a pending task, not an outage: nothing about it blocks the rest of the app from functioning normally in the meantime.
- **REQ-37.9** A conflict that goes unresolved doesn't expire or get silently superseded by a later reimport overwriting it — each new import's findings are reconciled against what's still pending, not layered blindly on top of it.
- **REQ-37.10** A youth's age bucket ([Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.8: under 14 / 14-17 / 18+) is recomputed from the roster's raw date-of-birth column on every reimport, then the raw date is discarded again, same as the first import. Advancing to the next bucket purely because time has passed is expected drift, not a conflict — it's applied automatically, without going through REQ-37.6's review queue, since there's nothing for a human to adjudicate about a person getting older on schedule.

## Acceptance Criteria

- [ ] Correcting a person's member number preserves their account, unit memberships, and all prior retained roster history under the same underlying identity.
- [ ] Every member-number correction is logged with its before/after values, timestamp, and who confirmed it.
- [ ] A re-import never silently links a roster row to an existing person based on name/age-bucket/address alone — it's always a human-confirmed match.
- [ ] A re-import never silently changes a stored field; every actual change is presented for review before being applied.
- [ ] A roster change that contradicts an existing ScoutBuddy role or patrol assignment is flagged distinctly from an ordinary informational-field change, and is never auto-applied.
- [ ] All pending reimport conflicts are visible from one Action Center location, and an unresolved conflict never blocks normal use of the app.
- [ ] A youth's age bucket is refreshed on every reimport and never reverts to storing a raw date of birth in the process; an ordinary bucket advance (e.g. 14-17 → 18+) never appears as an Action Center conflict.

## Out of Scope for This Requirement

- A general-purpose admin action center for concerns beyond roster reconciliation — this requirement's Action Center is scoped to roster import/reimport conflicts specifically; a broader admin-notifications surface, if one is ever needed, is a separate future requirement.
- Automatic conflict resolution of any kind, whether by confidence score or otherwise — every conflict in scope here is resolved by an explicit human action, matching this project's standing rule for AI- or bulk-derived data.
- Initial import mechanics (file upload, section parsing, first-time role suggestion) — [Requirement 36](36-roster-import-user-creation.md).

## Related

- [Requirement 36 - Roster Import & Suggested Role Assignment](36-roster-import-user-creation.md) — this requirement's prerequisite; the review-before-write pattern REQ-37.3/37.6 reuse.
- [Requirement 34 - Unit Membership, Invitations & Switching](34-unit-membership-invitations-switching.md) — REQ-34.8's logged-removal precedent REQ-37.2's audit trail follows.
- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — REQ-31.10's security/audit-logging foundation.
- [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](33-youth-account-creation-coppa.md) — REQ-33.8's age-bucket rule, which REQ-37.10 keeps current on every reimport.
