# Requirement 38 — Platform Administration: Cross-Tenant Support Access & Impersonation

Status: Not started
Depends on: [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) (accounts, sessions, step-up assurance), [Requirement 34 - Unit Membership, Invitations & Switching](authentication-accounts/34-unit-membership-invitations-switching.md) (the membership model this requirement reads across), [Requirement 35 - User Account Disabling & Deletion](35-user-account-disabling-deletion.md) (the disable mechanics this requirement exposes directly).

## Goal

Let a small number of trusted platform operators troubleshoot and support any account across any unit — including full session impersonation of any account, adult or youth — while keeping every such action logged, time-boxed, and gated behind the same step-up assurance every other sensitive action in this app requires. Operator-level access stays a documented, auditable exception, never an invisible standing capability.

## Source

User request, 2026-10-23, after reviewing [Requirement 27](multi-tenancy/27-multi-tenant-unit-isolation.md) and Requirements 31-37 and noting that none of them define a system-administrator or cross-tenant support capability — [Requirement 27](multi-tenancy/27-multi-tenant-unit-isolation.md)'s REQ-27.18 only anticipated "a future internal admin view for the ScoutBuddy operator, if one is ever built," without ever specifying what it is. Offered a choice between support-actions-only, impersonation-for-adults-only, and full impersonation of any account, the user explicitly chose full impersonation, including youth accounts.

## Requirements

### Who is a Platform Admin

- **REQ-38.1** A Platform Admin is a `User` flagged independently of any `UnitMembership` (e.g. `User.isPlatformAdmin`) — never derived from, or dependent on, any unit role. Given this project's actual scale, this is expected to be a small, explicitly maintained allowlist (the app's operator and any co-maintainers), not a general-purpose role tier or a hierarchy of admin levels.

### Support access short of impersonation

- **REQ-38.2** A Platform Admin can view any account's state across every unit — person-level profile data, every `UnitMembership` they hold, session/login history, and any pending [Requirement 37](37-roster-reconciliation-member-number-correction.md) Action Center items — without needing to belong to that unit themselves.
- **REQ-38.3** A Platform Admin can take specific, named support actions directly, without starting a full impersonation session, for the common cases that don't need one: force-disable an account ([Requirement 35](35-user-account-disabling-deletion.md)), force a credential reset (invalidate passkeys, issue a fresh recovery path per [Requirement 32](authentication-accounts/32-account-recovery-credential-reset.md)), resend or revoke a [Requirement 34](authentication-accounts/34-unit-membership-invitations-switching.md) invite, manually resolve a stuck Requirement 37 Action Center item on a unit's behalf, and maintain the Council/District hierarchy — rename a district, move a unit to a district in another council, move a whole district to another council, and mark an emptied council inactive after a merger ([Requirement 34](authentication-accounts/34-unit-membership-invitations-switching.md)'s REQ-34.10). Impersonation (below) is available for anything these don't cover, but is never the only path for these specific cases.
- **REQ-38.4** This requirement is the fallback path for an account genuinely stuck with no working self-service recovery ([Requirement 32](authentication-accounts/32-account-recovery-credential-reset.md)) and no reachable guardian ([Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.6) — reached through this same logged, step-up-gated access, never a silent workaround outside it.

### Impersonation

- **REQ-38.5** A Platform Admin can impersonate any account — adult or youth — starting a session that acts as that user for troubleshooting or support purposes. (Per the 2026-10-23 decision: scope explicitly includes youth accounts, not limited to adults.)
- **REQ-38.6** Every impersonation session is time-boxed and auto-expires (on the order of an hour, not indefinitely); ending it explicitly before expiry is always available too.
- **REQ-38.7** Starting an impersonation session requires the admin's own session to already be at step-up assurance ([Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s REQ-31.6) — impersonation is treated as a sensitive action in its own right, never a way to bypass that requirement for the account being impersonated.
- **REQ-38.8** Every impersonation session is logged in full: which admin, which account, which unit(s) touched, start and end time, and at minimum which kinds of actions were taken while impersonating — extending [Requirement 27](multi-tenancy/27-multi-tenant-unit-isolation.md)'s REQ-27.18 ("even legitimate operator-level access is auditable") from read-access to acted-as-a-user access.
- **REQ-38.9** Any action taken while impersonating is attributable in logs and history as "Platform Admin X, acting as User Y" — never recorded as if User Y performed it unassisted. A later read of, say, a menu-approval history must not be misreadable as the actual ASPL's own unaided action.

## Acceptance Criteria

- [ ] A Platform Admin can view any account's cross-unit state without holding membership in that unit.
- [ ] A Platform Admin can start a full impersonation session for any account, including youth accounts, gated behind their own step-up assurance.
- [ ] Every impersonation session auto-expires on a fixed time budget and is fully logged (admin, target account, units touched, start/end, actions taken).
- [ ] Every action taken during impersonation is attributable in logs/history as admin-acting-as-user, never indistinguishable from the user's own unassisted action.
- [ ] Force-disable, force-credential-reset, invite resend/revoke, and Action Center resolution are each available directly, without requiring a full impersonation session.
- [ ] An account with no working self-service or guardian-mediated recovery path can still be unblocked through this requirement's logged, step-up-gated access.

## Out of Scope for This Requirement

- A general-purpose RBAC/role-tier system for platform admins — this requirement assumes a small, explicitly maintained allowlist, not a hierarchy of admin levels.
- Any unit-level capability (e.g. an ASPL managing their own unit's members more directly) beyond what [Requirement 34](authentication-accounts/34-unit-membership-invitations-switching.md) already specifies — this requirement is about cross-unit, platform-level access specifically.
- Real-time or advance notice to a unit or guardian before an impersonation session starts — not built into this requirement as specified; a retrospective notice is a reasonable lighter-touch addition if wanted later, but isn't assumed here.

## Related

- [Requirement 27 - Multi-Tenant Unit Isolation & Switching](multi-tenancy/27-multi-tenant-unit-isolation.md) — REQ-27.18's operator-audit-logging principle, extended here from read-access to acted-as-a-user access.
- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — REQ-31.6's step-up assurance, required before any Platform Admin action.
- [Requirement 32 - Account Recovery & Credential Reset](authentication-accounts/32-account-recovery-credential-reset.md), [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](33-youth-account-creation-coppa.md) — the two recovery paths this requirement is the fallback for.
- [Requirement 34 - Unit Membership, Invitations & Switching](authentication-accounts/34-unit-membership-invitations-switching.md) — the membership model this requirement reads across, and the invite action it exposes directly.
- [Requirement 35 - User Account Disabling & Deletion](35-user-account-disabling-deletion.md) — the disable mechanics this requirement exposes directly without requiring impersonation.
- [Requirement 37 - Roster Reimport, Conflict Resolution & Member-Number Correction](37-roster-reconciliation-member-number-correction.md) — the Action Center items a Platform Admin can resolve directly.
- Better Auth's admin plugin (`impersonateUser`/`stopImpersonation`/`banUser`) — the concrete library primitive this requirement's capability maps onto, already in use for this project per Requirement 31.
