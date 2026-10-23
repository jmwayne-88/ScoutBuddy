# Requirement 32 — Account Recovery & Credential Reset

Status: Done, except REQ-32.6 (youth guardian-contact routing — genuinely blocked on [Requirement 33](../33-youth-account-creation-coppa.md)'s guardian-contact field, which doesn't exist yet; everything else below is built and verified). See [ADR 0034](../../adr/0034-account-recovery-token-and-session-invalidation.md).
Depends on: [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](31-core-authentication-accounts-sessions-passkeys.md) — accounts, sessions, and the passkey/magic-link assurance-tier split must already exist.

## Goal

Give a person who's lost access to their passkey device, or can't recall which email/username they registered with, a safe way back into their account — self-service for adults, adult/guardian-mediated for youth — without ever weakening the assurance [Requirement 31](31-core-authentication-accounts-sessions-passkeys.md) established.

## Source

User request, 2026-10-23: "common security needs like forgot my user name, forgot my password, etc." The specific mechanics below follow the OWASP Forgot Password Cheat Sheet, cross-checked the same day.

## Requirements

- **REQ-32.1** A single "forgot credential" entry point sends a single-use, expiring, cryptographically random recovery link to the account's registered email (adults) or registered guardian/leader contact (youth, per [Requirement 33](../33-youth-account-creation-coppa.md)). It never confirms or denies whether an account exists for the submitted address — the same response, in the same amount of time, either way (anti-enumeration, per the OWASP Forgot Password Cheat Sheet).
- **REQ-32.2** A successful recovery re-establishes only a bootstrap/recovery-tier session — the same tier [Requirement 31](31-core-authentication-accounts-sessions-passkeys.md)'s REQ-31.3 assigns to a magic link. It does not itself grant sensitive-action capability; the person must register a new passkey (or otherwise complete REQ-31.6's step-up) before doing anything a later requirement marks sensitive.
- **REQ-32.3** Issuing a new recovery token invalidates any previously issued, still-outstanding token for that account — only the most recently issued token is ever valid.
- **REQ-32.4** A successful recovery (new passkey registered, or any credential changed) invalidates every other active session for that account, not just the one completing recovery.
- **REQ-32.5** "Forgot username" is handled by the same entry point as REQ-32.1, not a separate lookup. For the adult flow, the username *is* the registered email, so this is really "which email did I register with" — there is no separate endpoint that could independently leak whether an account exists for a given address.
- **REQ-32.6** For a youth account (no personal email of their own, per [Requirement 33](../33-youth-account-creation-coppa.md)), the recovery request reaches the registered adult/guardian contact on file, never the youth directly — the same mediation principle Requirement 33 establishes for account creation, applied symmetrically here. **Not yet built** — Requirement 33's distinct guardian-contact field doesn't exist yet (today's schema has one generic optional `email` on `User`, not a youth/guardian distinction); this item is blocked on Requirement 33 landing, not skipped.
- **REQ-32.7** Recovery endpoints share [Requirement 31](31-core-authentication-accounts-sessions-passkeys.md)'s REQ-31.7 per-account and per-IP rate limiting — a recovery flow is as attractive a target as login itself.

## Acceptance Criteria

- [ ] Submitting a recovery request for an existing account vs. a non-existent one produces an identical response and response time.
- [ ] A recovery-tier session cannot perform any action a later requirement marks sensitive until a new passkey is registered or step-up is completed.
- [ ] Issuing a second recovery token for the same account invalidates the first.
- [ ] Completing recovery invalidates every other active session for that account.
- [ ] A youth account's recovery request reaches the registered adult/guardian contact, never the youth's own inbox directly. **Blocked on [Requirement 33](../33-youth-account-creation-coppa.md)** — not yet built.

## Out of Scope for This Requirement

- Initial account creation — [Requirement 31](31-core-authentication-accounts-sessions-passkeys.md) (adults), [Requirement 33](../33-youth-account-creation-coppa.md) (youth).
- Ongoing MFA/step-up policy beyond what REQ-31.6 already defines.
- Disabling or deleting an account — [Requirement 35](../35-user-account-disabling-deletion.md).

## Related

- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](31-core-authentication-accounts-sessions-passkeys.md) — this requirement's prerequisite.
- [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](../33-youth-account-creation-coppa.md) — the youth-specific routing REQ-32.6 relies on.
- OWASP Forgot Password Cheat Sheet — the standard this requirement's mechanics follow.
