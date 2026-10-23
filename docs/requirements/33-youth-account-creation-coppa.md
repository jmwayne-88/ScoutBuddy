# Requirement 33 — Adult/Guardian-Mediated Youth Account Creation (COPPA)

Status: Not started
Priority: High — a hard gate, not a nice-to-have: no unit with real youth accounts may go live before this requirement's acceptance criteria, including the legal-review gate, are met.
Depends on: [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)

## Goal

Let Patrol Leaders and the ASPL of Camping — both youth, per [FEATURES.md](../../FEATURES.md) — get real accounts without the app ever requiring a child to self-register with their own personal email, consistent with data-privacy obligations around minors.

## Source

[Requirement 27](multi-tenancy/27-multi-tenant-unit-isolation.md)'s original REQ-27.16 (2026-10-18) flagged this as "a hard gate that must be explicitly addressed, not defaulted into, before any unit with real youth accounts goes live" but deferred the actual design to this requirement's prerequisite. The design below comes from the 2026-10-23 research into COPPA verifiable parental consent methods, folded into the 2026-10-23 request to split the authentication recommendation into independently reviewable requirements.

## Requirements

- **REQ-33.1** A youth account is never self-registered by the youth with their own personal email. It is created by an adult — the unit's adult leader or the youth's parent/guardian — through an explicit action (an invite; see [Requirement 34](authentication-accounts/34-unit-membership-invitations-switching.md)), never inferred.
- **REQ-33.2** Data collected for a youth account is minimized: first name + last initial (matching how BSA rosters already display youth) and a unit-assigned username. No personal email is required from the youth. A parent/guardian email or phone number is stored separately, explicitly labeled as a "guardian contact," never conflated with the youth's own identity. Age is handled per REQ-33.8 below, not as a raw date of birth.
- **REQ-33.3** An age/role gate at account-creation time — collected only to route the flow, not as a stored profile attribute — determines whether REQ-33.1's adult-mediated path applies. (The FTC's 2026 policy statement specifically de-risks age collection used solely for this kind of routing, as distinct from collecting it as general profile data.)
- **REQ-33.4** Where data collection goes beyond REQ-33.2's minimum, verifiable parental consent is obtained via an FTC-recognized method before the account is activated. This project's recommended default: a signed consent form folded into the troop's existing campout permission-slip/health-form paperwork process — reusing a channel parents already trust and the unit already operates, rather than building a new ID-check or payment-based verification flow.
- **REQ-33.5** A youth logs in via [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s passkey, registered on their own device at account-creation time with the inviting adult present, or — as a bootstrap/recovery fallback only — a magic link that goes to the registered guardian contact ([Requirement 32](authentication-accounts/32-account-recovery-credential-reset.md)'s REQ-32.6), never to a personal inbox the youth controls independently.
- **REQ-33.6** A parent/guardian can request export or deletion of their minor child's data at any time, through a path that's clearly discoverable — not buried in general settings — consistent with COPPA's standing parental-rights provisions (which apply as a legal floor to children under 13; this app offers the same path to every youth account regardless of exact age, matching REQ-33.8's own conservative framing). ([Requirement 35](35-user-account-disabling-deletion.md)'s REQ-35.5 implements the deletion mechanics this triggers.)
- **REQ-33.7** This requirement's design is a compliance-minimizing default, not a legal determination. Real legal counsel review is a hard gate before any unit with real youth accounts goes live — carried forward from Requirement 27's original REQ-27.16, which is retired there in favor of this requirement.
- **REQ-33.8** No raw date of birth is ever stored for a youth. At the point data enters the system (roster import, [Requirement 36](36-roster-import-user-creation.md), or any other intake), a date of birth is immediately converted to a coarse age bucket — **under 14 / 14-17 / 18+** — and the raw date is discarded, never persisted. This is a deliberate buffer above COPPA's own under-13 legal line, not a reading of where that line falls: 16 CFR 312.2 doesn't list age or date of birth as "personal information" at all (it's only implicated via the catch-all for data combined with an identifier, itself scoped to information collected online directly from the child — not a roster an adult leader uploads), but minimizing to a bucket costs nothing functionally and is strictly more protective than the minimum. The bucket is derived once at creation and recomputed on every [Requirement 37](37-roster-reconciliation-member-number-correction.md) reimport, since a person's true bucket changes as they age.

## Acceptance Criteria

- [ ] No code path allows a youth to create their own account using their own personal email.
- [ ] A youth account record holds no more personal data than REQ-33.2 specifies without documented parental consent on file.
- [ ] No raw date of birth is ever persisted for a youth account — only the under-14/14-17/18+ bucket, and the bucket is refreshed on each roster reimport.
- [ ] A parent/guardian can reach a deletion-request path for their child's data in two clicks or fewer from account-adjacent settings.
- [ ] Real legal counsel has reviewed this design — tracked explicitly as a launch gate — before any unit with real youth accounts is onboarded.

## Out of Scope for This Requirement

- The consent-form paperwork process itself (an operational/administrative process the unit runs, not application code).
- Adult account creation — [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md).
- General account-recovery mechanics beyond REQ-32.6's youth-specific routing — [Requirement 32](authentication-accounts/32-account-recovery-credential-reset.md).

## Related

- [Requirement 27 - Multi-Tenant Unit Isolation & Switching](multi-tenancy/27-multi-tenant-unit-isolation.md) — REQ-27.16, retired in favor of this requirement.
- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — this requirement's prerequisite.
- [Requirement 32 - Account Recovery & Credential Reset](authentication-accounts/32-account-recovery-credential-reset.md) — REQ-32.6's youth-specific recovery routing.
- [Requirement 34 - Unit Membership, Invitations & Switching](authentication-accounts/34-unit-membership-invitations-switching.md) — the invite mechanism REQ-33.1 uses.
- [Requirement 35 - User Account Disabling & Deletion](35-user-account-disabling-deletion.md) — REQ-35.5, the deletion mechanics REQ-33.6 triggers.
- [Requirement 39 - Federated Sign-In (OAuth/OIDC) with Google, Apple & Other Providers](39-federated-sign-in-oauth-providers.md) — REQ-39.2 deliberately departs from this requirement's REQ-33.1 for one sign-in path (youth self-registration via a personal Google/Apple account); REQ-39.11 names that as an explicit input to this requirement's REQ-33.7 legal-review gate, not an exception outside it.
- [Requirement 36 - Roster Import & Suggested Role Assignment](36-roster-import-user-creation.md), [Requirement 37 - Roster Reimport, Conflict Resolution & Member-Number Correction](37-roster-reconciliation-member-number-correction.md) — where a raw date of birth would otherwise enter the system; REQ-33.8's bucket conversion applies there.
- 16 CFR § 312.2 — the COPPA "personal information" definition REQ-33.8's reasoning is grounded in.
