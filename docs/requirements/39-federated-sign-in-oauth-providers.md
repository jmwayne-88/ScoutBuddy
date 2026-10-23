# Requirement 39 — Federated Sign-In (OAuth/OIDC) with Google, Apple & Other Providers

Status: Not started
Depends on: [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — accounts, sessions, and the assurance-tier/step-up model this requirement plugs into rather than reinvents.

## Goal

Let anyone — regardless of role or age — sign up or sign in using an existing Google, Apple, or other popular identity provider account, as a lower-friction alternative to registering a passkey from scratch, without weakening the assurance model [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) established.

## Source

User request, 2026-10-23: "add a requirement to allow signin with common providers such as Google, Apple, and other popular options." An initial draft of this requirement restricted federated sign-in to adults, on the reasoning that it would otherwise let a youth self-register with their own personal provider account — exactly what [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.1 exists to prevent, and a pattern that, for a youth under COPPA's actual 13-year-old threshold, carries real legal exposure, not just a style preference. The user explicitly rejected that restriction after the distinction was laid out — including the option to carve out only the specific under-14 bucket ([Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.8) where COPPA's threshold actually sits — and chose to open federated sign-in to every age, no carve-out. That decision is recorded here, not silently absorbed: REQ-39.11 below makes it an explicit, named input to Requirement 33's existing legal-review gate rather than a quiet exception to it.

## Why this isn't just "turn on OAuth"

Federated sign-in sits in a different part of the NIST framework than the rest of this requirement series — NIST SP 800-63C governs *federation assurance* (how trustworthy an identity assertion from a third party is), distinct from SP 800-63B's *authenticator assurance* (how strongly the person proved who they are) that [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) is built on. A standard OAuth/OIDC sign-in is a bearer assertion from the provider — it doesn't by itself prove the ScoutBuddy session controls any specific authenticator the way a passkey challenge does. NIST explicitly allows a relying party to require different assurance for different actions (e.g. accept a lower federation level for routine use, require stronger proof for sensitive actions) — that's the shape this requirement takes, not a blanket "OAuth is as good as a passkey."

## Requirements

### Providers & scope

- **REQ-39.1** Google and Apple ("Sign in with Apple") are the minimum provider set; the mechanism is built so adding another popular provider (Microsoft, a realistic fit given how many troop parents have a work/school Microsoft account) is a configuration addition, not a new code path. The exact library/plugin mechanics are a build-time ADR per CLAUDE.md's working conventions, same pattern this project already follows for RLS policy syntax and migration SQL.
- **REQ-39.2** Federated sign-in is available to any account regardless of role or age — a youth (including one under 13) may create or sign into a ScoutBuddy account with their own Google/Apple identity, by explicit 2026-10-23 user decision (see Source). This is a deliberate departure from [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.1 ("never self-registered by the youth with their own personal email") for this one sign-in path specifically — REQ-39.11 below ties it into that requirement's existing compliance-review gate rather than leaving it as an unexamined exception.
- **REQ-39.3** Signing up via a provider for the first time still requires explicit role selection (ASPL, or Patrol Leader + patrol) before the account is usable — the same role-capture step [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s passkey-based signup requires, not an auto-created roleless account. A youth signing up this way is also offered (not required — there is no adult in the loop to enforce it) an optional parent/guardian contact field, the same concept [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.2 defines, so REQ-32.6's recovery routing and REQ-33.6's parental deletion right have something to act on if the youth chooses to provide it.

### Assurance & step-up

- **REQ-39.4** A session established purely via federated sign-in is treated at the same lower assurance tier as a magic-link session ([Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s REQ-31.6) — it can browse and perform non-sensitive actions, but is prompted to step up via a passkey challenge before anything a later requirement marks sensitive. ScoutBuddy has no way to know how strongly the person authenticated to Google/Apple itself (password-only vs. their own MFA), so it can't assume passkey-equivalent assurance just because the provider vouches for the identity.
- **REQ-39.5** A person who signs up via a provider is encouraged, but not forced, to also register a passkey on that device — doing so is what moves their account out of the permanently-lower tier, the same upgrade path a magic-link-only account already has under Requirement 31.

### Account linking & data handling

- **REQ-39.6** If a provider-asserted email matches an existing account's stored email, the sign-in links to that existing account rather than creating a duplicate — the same "don't create a second person for someone who already exists" principle [Requirement 37](37-roster-reconciliation-member-number-correction.md) applies to roster data, applied here to the identity layer. A mismatched or absent email never auto-links — it starts a new-account flow instead, same as any first-time provider sign-in.
- **REQ-39.7** Only the minimum profile data needed (name, email) is requested from the provider — no broader profile, photo, or contacts scope — consistent with this project's existing data-minimization principle ([Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.2), regardless of whether the account being created is an adult's or a youth's.
- **REQ-39.8** Apple's sign-in flow only returns the person's name on their *first* authorization with this app, never on subsequent sign-ins — the name is captured and stored at that first sign-in or it's lost entirely, not something to fetch again later. Apple's private email relay (a person can share a relay address instead of their real one) is accepted as a valid email the same as any other; this app doesn't require or assume a non-relay address.

### Operational

- **REQ-39.9** Each enabled provider's client ID/secret follows [ADR 0005](../adr/0005-env-based-secrets-management.md)'s existing env-based secrets pattern, same as every other external credential this app holds — no new secrets-handling mechanism invented for this.
- **REQ-39.10** [Requirement 31](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s REQ-31.10 audit logging covers federated sign-in the same way it covers passkey/magic-link sign-in — which provider, when, for which account — not a separate, uncovered path.

### Compliance

- **REQ-39.11** REQ-39.2's choice to allow a youth (including one under 13) to self-register via a personal provider account is a named, explicit input to [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.7 legal-review gate — not a quiet exception sitting outside it. That review covers this requirement's design specifically, including the consequence that a youth who self-registers via a provider and never adds the optional guardian contact (REQ-39.3) leaves [Requirement 32](authentication-accounts/32-account-recovery-credential-reset.md)'s REQ-32.6 recovery routing and [Requirement 33](33-youth-account-creation-coppa.md)'s REQ-33.6 parental deletion right with nothing to act on for that account. "Not yet decided" is not an acceptable launch state for this requirement, same as REQ-33.7 already establishes generally.

## Acceptance Criteria

- [ ] Anyone, any role or age, can create an account or sign in using Google or Apple, landing on the same role-selection step a first-time passkey signup requires.
- [ ] A federated-only session cannot perform any action a later requirement marks sensitive without stepping up via a passkey challenge.
- [ ] Signing in via a provider with an email matching an existing account links to that account; a non-matching or absent email starts a new-account flow instead of silently merging into an unrelated account.
- [ ] Only name and email are requested from any provider — verified against the actual OAuth scope configuration, not assumed.
- [ ] A name captured from Apple's first-authorization response is persisted, not re-fetched on later sign-ins.
- [ ] A youth signing up via a provider is offered the optional guardian-contact field; whether or not it's filled in is visible to whoever handles a later recovery or deletion request for that account, so an absent contact is a known gap, not a silent dead end.
- [ ] Real legal counsel has reviewed REQ-39.2's specific design — tracked as part of Requirement 33's same launch gate, not a separate or skippable one — before any unit with real youth accounts is onboarded.

## Out of Scope for This Requirement

- Any provider beyond "popular, OIDC-compliant, minimum Google + Apple" — a niche or enterprise-only provider (e.g. a specific school district's SSO) is a future, separate addition if ever needed.
- Elevating a federated session to passkey-equivalent assurance by any means other than actually registering a passkey (e.g. no "trust this provider's MFA" exception carved out) — kept simple and uniform per REQ-39.4.
- Building any additional verification of a youth's self-reported age or identity beyond what the provider itself asserts — this requirement takes the provider's account at face value, the same way REQ-33.3's age/role gate is self-reported rather than verified.

## Related

- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — this requirement's prerequisite; REQ-31.6's step-up model this requirement plugs into.
- [Requirement 32 - Account Recovery & Credential Reset](authentication-accounts/32-account-recovery-credential-reset.md) — REQ-32.6, the recovery routing REQ-39.11 notes as degraded when no guardian contact is on file.
- [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](33-youth-account-creation-coppa.md) — REQ-33.2/33.6/33.7, and the legal-review gate REQ-39.11 ties this requirement's youth-inclusive design into.
- [Requirement 37 - Roster Reimport, Conflict Resolution & Member-Number Correction](37-roster-reconciliation-member-number-correction.md) — the "don't create a duplicate person" principle REQ-39.6 applies to the identity layer.
- [ADR 0005 - Env-based secrets management](../adr/0005-env-based-secrets-management.md) — the approach REQ-39.9 follows.
- NIST SP 800-63C-4 — federation assurance levels (FAL1-3), the standard this requirement's assurance-tier treatment of federated sign-in is grounded in.
