# Requirement 31 — Core Authentication: Accounts, Sessions & Passkeys

Status: Done. See [ADR 0033](../../adr/0033-passkey-based-authentication-via-better-auth.md) (and [ADR 0034](../../adr/0034-account-recovery-token-and-session-invalidation.md) for the assurance-tier tracking REQ-31.6 scoped as scaffolding here).
Priority: High — root of the authentication sequence. [Requirement 24](../24-due-date-and-review-notifications.md), [Requirement 27](../27-multi-tenant-unit-isolation.md), and Requirements 32-35 all depend on this directly or transitively; nothing in that chain can start before this lands.
Depends on: nothing — this is the first requirement in the authentication sequence.

## Goal

Replace [ADR 0010](../../adr/0010-cookie-based-role-identity.md)'s cookie-based role identity — "I declare myself the ASPL" with no account behind it — with real, individually-held user accounts and server-side sessions, authenticated primarily via passkeys (WebAuthn). This is the foundation every later piece of the authentication system builds on. It does **not** itself add units/multi-tenancy, youth-specific account creation, self-service recovery flows, or account disabling/deletion — those are Requirements 33, 34, 35, 32, and 27, each reviewable on its own once this lands.

## Source

[Requirement 27](../27-multi-tenant-unit-isolation.md)'s original text (2026-10-18) identified "a not-yet-written user authentication requirement" as a hard prerequisite. User request, 2026-10-23, asked for a firm recommendation covering signup, unit membership, enrollment, removal, disabling/deletion, and account recovery; that recommendation was then checked against NIST SP 800-63B-4 and OWASP ASVS 5.0 / the Cheat Sheet Series (same day), which surfaced one material correction — email-delivered magic links do not satisfy NIST's AAL2 out-of-band authenticator requirement and must not be treated as equivalent to a passkey. User request, 2026-10-23 (same day), then asked for the whole recommendation to be split into independently reviewable, dependency-ordered requirements — this is the first of that series.

## Why a dedicated requirement, not a line item under Requirement 27

Requirement 27's own text already separated "data model & isolation" from "accounts, membership & switching" into different sections — they were always different kinds of work bundled under one prerequisite note. Splitting them lets each be reviewed, estimated, and built as its own unit, per the user's explicit ask to take this "one bite at a time."

## Requirements

### Accounts & credentials

- **REQ-31.1** A real `User` entity replaces [ADR 0010](../../adr/0010-cookie-based-role-identity.md)'s cookie-only `Actor` concept. A new ADR is written at build time (per CLAUDE.md's working conventions) documenting this supersession — the same ADR [Requirement 24](../24-due-date-and-review-notifications.md)'s REQ-24.1 already anticipated needing for its own, unrelated reason (push/email notifications need addressable identity too); that requirement is updated to point here rather than open a second, parallel identity decision.
- **REQ-31.2** Passkey (WebAuthn) is the primary, default credential for every account. Registration happens during account setup. The system always keeps at least one phishing-resistant credential path available per account — NIST SP 800-63B-4's AAL2 requires that a phishing-resistant authentication option be offered, not merely available as one choice among weaker ones.
- **REQ-31.3** Magic link (a single-use, short-lived, email-delivered link) exists **only** as a bootstrap/recovery-tier credential — never a standing, repeatedly-used login method for an account. This is a direct correction from the 2026-10-23 standards review: NIST SP 800-63B-4 excludes email from serving as an out-of-band authenticator at all (mailbox access is itself typically protected by a weak credential, intermediate-server interception and rerouting are real risks) — so a magic link cannot be presented as an equal alternative to a passkey, only as a lower-assurance fallback. A session established via magic link is flagged at that lower tier (see REQ-31.6).
- **REQ-31.4** If any password-shaped credential exists anywhere in the system (e.g. a future non-passkey device path), it follows the current OWASP Password Storage Cheat Sheet: Argon2id at a minimum of m=19456 KiB, t=2, p=1 (or scrypt at N=2^17, r=8, p=1 if Argon2id isn't available), an 8-character minimum with 15+ encouraged, no forced composition rules, no periodic rotation, and screening against a known-breach corpus at creation/change time. Whatever auth library is chosen, its *actual configured* hashing parameters are verified against this baseline rather than assumed compliant by reputation — e.g. Better Auth's documented default is scrypt, which is acceptable, but its specific parameters still need confirming or overriding.
- **REQ-31.5** Sessions are real server-side state (a session store/row, not a bare client-trusted value), delivered via an httpOnly, secure, SameSite cookie — the same cookie discipline ADR 0010 already established for the old actor cookie, now backed by something the server actually controls. A session is invalidated on logout, on credential change, and on administrative disable ([Requirement 35](../35-user-account-disabling-deletion.md)).

### Assurance tiers & defense in depth

- **REQ-31.6** Any action a later requirement marks "sensitive" (examples as they land: [Requirement 27](../27-multi-tenant-unit-isolation.md)'s ASPL approve/reject, [Requirement 34](34-unit-membership-invitations-switching.md)'s invite management, [Requirement 35](../35-user-account-disabling-deletion.md)'s account deletion) requires the active session to be at passkey-equivalent assurance. A session established only via magic link (REQ-31.3) is prompted to step up — a fresh passkey challenge — before being allowed to proceed. This gives the system a real AAL2-capable path for everything that matters, without forcing every low-stakes action through the same friction.
- **REQ-31.7** Rate limiting applies per-account **and** per-IP on every authentication endpoint (login, passkey challenge, magic-link request) — per-IP alone doesn't stop distributed credential stuffing. New or changed credentials are screened against a known-breach corpus before acceptance.
- **REQ-31.8** This requirement explicitly targets **OWASP ASVS Level 2** for its authentication and session-management chapters, and explicitly operates at **NIST IAL1** (self-asserted identity — no government-ID-grade, real-world identity proofing of any account). Both are stated here as deliberate, written-down choices appropriate to this app's non-commercial scope with no legal/financial stakes — the same way ADR 0010 explicitly accepted its own tradeoff rather than leaving it implicit. Revisit if that scope ever changes.
- **REQ-31.9** Any new secret this requirement introduces (session signing key, WebAuthn relying-party configuration, etc.) follows [ADR 0005](../../adr/0005-env-based-secrets-management.md)'s existing env-based secrets approach rather than inventing a new one. (Carries forward Requirement 27's original REQ-27.17, retired there in favor of this.)
- **REQ-31.10** Security-relevant auth events (failed logins past a threshold, lockouts, credential changes) are logged without ever logging credential or token values themselves. This log is the foundation later requirements build on — [Requirement 27](../27-multi-tenant-unit-isolation.md)'s REQ-27.13/27.18 extend it to guarantee no cross-unit data leaks into it once units exist.

## Acceptance Criteria

- [ ] A real `User` entity and server-side session replace ADR 0010's cookie-only `Actor`, documented in a new ADR.
- [ ] Every account can register and log in via a passkey.
- [ ] A magic-link-authenticated session cannot perform any action a later requirement marks sensitive without first stepping up to a passkey challenge.
- [ ] If any password credential exists, its actual storage parameters are verified — not assumed — against current OWASP Password Storage Cheat Sheet numbers.
- [ ] Rate limiting (per-account and per-IP) and breach-corpus screening are both active on every authentication endpoint.
- [ ] The ASVS Level 2 / NIST IAL1 scope decision is written down explicitly as part of this requirement's build-time ADR, not left implicit.

## Out of Scope for This Requirement

- Units, multi-tenancy, and unit-scoped data isolation — [Requirement 27](../27-multi-tenant-unit-isolation.md).
- Unit membership, invitations, and the active-unit switcher — [Requirement 34](34-unit-membership-invitations-switching.md).
- Youth-specific, adult-mediated account creation — [Requirement 33](../33-youth-account-creation-coppa.md).
- Self-service "forgot password"/"forgot username" flows beyond the bare bootstrap/recovery mechanics of REQ-31.3 — [Requirement 32](32-account-recovery-credential-reset.md).
- Disabling or deleting an account — [Requirement 35](../35-user-account-disabling-deletion.md).

## Related

- [ADR 0010 - Cookie-based role identity, no accounts or passwords](../../adr/0010-cookie-based-role-identity.md) — superseded by this requirement.
- [ADR 0005 - Env-based secrets management](../../adr/0005-env-based-secrets-management.md) — the approach REQ-31.9 follows.
- [Requirement 24 - Due-Date & Review Notifications](../24-due-date-and-review-notifications.md) — shares this exact ADR-0010 blocker; its REQ-24.1 is satisfied once this requirement ships.
- [Requirement 27 - Multi-Tenant Unit Isolation & Switching](../27-multi-tenant-unit-isolation.md) — depends on this requirement.
- [Requirement 32 - Account Recovery & Credential Reset](32-account-recovery-credential-reset.md), [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](../33-youth-account-creation-coppa.md), [Requirement 34 - Unit Membership, Invitations & Switching](34-unit-membership-invitations-switching.md), [Requirement 35 - User Account Disabling & Deletion](../35-user-account-disabling-deletion.md) — all depend on this requirement.
- [Requirement 39 - Federated Sign-In (OAuth/OIDC) with Google, Apple & Other Providers](../39-federated-sign-in-oauth-providers.md) — adds a Google/Apple/etc. sign-in method, open to any account regardless of age, on top of this requirement's assurance-tier model (REQ-31.6), without changing it.
