# Requirement 35 — User Account Disabling & Deletion

Status: Not started
Depends on: [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md), [Requirement 34 - Unit Membership, Invitations & Switching](authentication-accounts/34-unit-membership-invitations-switching.md) — a person's memberships need to exist as a concept before lifecycle actions on their account make sense.

## Goal

Give the app two clearly distinct, correctly scoped ways to stop a person's access — a reversible disable and a real, retention-bounded deletion — matching data-minimization and right-to-erasure expectations, without either one accidentally behaving like the other.

## Source

User request, 2026-10-23: "disabling and deleting users all together." The retention/export language below carries forward the user-level portions of [Requirement 27](multi-tenancy/27-multi-tenant-unit-isolation.md)'s original REQ-27.14/REQ-27.15 (2026-10-18); the unit-level portions of those stay in Requirement 27, since deleting a user's account is a different operation from a unit closing down entirely.

## Requirements

- **REQ-35.1** Disabling an account is reversible: it immediately invalidates every active session, blocks further login, and preserves all of that person's data and audit trail. Use for suspected compromise, a pending investigation, or someone stepping away without being ready for full deletion. Triggerable by the account holder themselves, or, for support cases beyond self-service, by a Platform Admin ([Requirement 38](38-platform-admin-cross-tenant-support.md)'s REQ-38.3) — logged there the same as any other platform-level action.
- **REQ-35.2** Deleting an account is a distinct, separately-triggered action — never an automatic side effect of disabling it.
- **REQ-35.3** Personal data about a person is retained only as long as they hold at least one active unit membership, plus a documented retention window after their last membership ends — not indefinitely by default. (The user-level portion of Requirement 27's original REQ-27.14, moved here.)
- **REQ-35.4** On deletion, personally identifying fields are erased or irreversibly anonymized. Non-identifying historical records a unit still needs (e.g. past review/comment history) are preserved in anonymized form rather than silently breaking — consistent with how comment attribution already works today (role-based, "the ASPL," not a named individual, per [ADR 0010](../adr/0010-cookie-based-role-identity.md)'s existing precedent).
- **REQ-35.5** A person can request deletion of their own account. For a youth account, their parent/guardian can request it on their behalf at any time — the same mechanism [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.6 points to.
- **REQ-35.6** Account deletion is itself a sensitive action under [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s REQ-31.6 — it requires a step-up-assurance session, not merely an authenticated one, so a hijacked low-assurance (magic-link-tier) session can't delete an account outright.
- **REQ-35.7** Disabling or deleting a person never deletes the `Unit` they belonged to, or affects any other member's access to it — this is strictly a single-account action, never a unit-wide one. (Unit-wide export/deletion is Requirement 27's REQ-27.15, a deliberately separate operation.)

## Acceptance Criteria

- [ ] Disabling a user immediately kills all of their active sessions and blocks login, while every row of data they touched remains intact.
- [ ] Deleting a user is a separate, explicitly confirmed action, gated behind step-up assurance (REQ-31.6).
- [ ] A deleted user's personal data is gone or irreversibly anonymized; historical records that reference them still render correctly.
- [ ] A parent/guardian can trigger deletion for their under-13 child's account through the path Requirement 33 establishes.
- [ ] Disabling or deleting one member of a unit never affects any other member, or the unit itself.

## Out of Scope for This Requirement

- Unit-wide data export/deletion (a whole unit closing down) — [Requirement 27](multi-tenancy/27-multi-tenant-unit-isolation.md)'s REQ-27.15.
- Removing a single unit membership while the account stays active elsewhere — [Requirement 34](authentication-accounts/34-unit-membership-invitations-switching.md)'s REQ-34.8.

## Related

- [Requirement 27 - Multi-Tenant Unit Isolation & Switching](multi-tenancy/27-multi-tenant-unit-isolation.md) — the unit-level counterpart to this account-level requirement; REQ-27.14's user-level portion moved here.
- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — REQ-31.6's step-up requirement, which REQ-35.6 relies on.
- [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](33-youth-account-creation-coppa.md) — REQ-33.6, the parental deletion-request right this requirement implements.
- [Requirement 34 - Unit Membership, Invitations & Switching](authentication-accounts/34-unit-membership-invitations-switching.md) — this requirement's prerequisite.
- [Requirement 38 - Platform Administration: Cross-Tenant Support Access & Impersonation](38-platform-admin-cross-tenant-support.md) — the platform-level path to REQ-35.1's disable action, for support cases beyond self-service.
