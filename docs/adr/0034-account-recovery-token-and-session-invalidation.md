# 0034. Account recovery: magic-link token invalidation, session revocation, and assurance-tier tracking

Date: 2026-10-23
Status: Accepted

## Context

[ADR 0033](0033-passkey-based-authentication-via-better-auth.md) built the magic-link plugin as [Requirement 31](../requirements/authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s bootstrap/recovery credential. [Requirement 32](../requirements/authentication-accounts/32-account-recovery-credential-reset.md) specifies three behaviors that credential needs as actual account recovery: a new recovery request invalidates any still-outstanding prior one (REQ-32.3), completing recovery kills every other active session for the account (REQ-32.4), and a magic-link session is genuinely distinguishable from a passkey one so REQ-31.6's eventual step-up enforcement has something real to check (REQ-32.2).

None of the three are Better Auth's default behavior, confirmed by reading `node_modules/better-auth/dist/plugins/magic-link/index.mjs` directly rather than assuming: `/sign-in/magic-link` always creates a fresh `Verification` row without touching any prior one for the same email, and `/magic-link/verify` creates a new session without revoking any other. Separately, building REQ-32.2 surfaced that [Requirement 31](../requirements/authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md)'s own planned assurance-tier helper (`getSessionAssuranceTier()`/`requireStepUp()`) had been scoped in the original plan but never actually implemented — a real gap caught while landing this requirement, not a deliberate deferral.

## Decision

**Token invalidation (REQ-32.3)**: `lib/auth.ts`'s existing `hooks.before` middleware (already matching `/sign-in/magic-link` for REQ-31.7's per-account rate limiting) now also deletes every outstanding `magic-link:`-prefixed `Verification` row for that email before the new one is created. Better Auth's `Verification.identifier` embeds the token itself (`magic-link:${token}`), so there's no stable per-email key to delete by directly — the deletion matches by `identifier` prefix, then parses each row's JSON `value` (`{type, email, name}`) to find the ones for this specific email. Deleting before creation (not after) means at most one outstanding token can ever exist per email by construction, not by a race-prone cleanup step.

**Session revocation (REQ-32.4)**: a `Session.createdVia` field (`"passkey" | "magic-link"`, a Better Auth `additionalFields` extension) is set in a new `databaseHooks.session.create.before` hook, from `context.path` — the only point in the request lifecycle that actually carries that information. `databaseHooks.session.create.after` then checks `context.path === "/magic-link/verify"` and, if so, deletes every other `Session` row for that `userId`. This is scoped to the verify path specifically, not every magic-link-adjacent request, and not generalized to "revoke on every sign-in" — a passkey sign-in from a new device is ordinary use, not a recovery event, and shouldn't kill someone's other sessions.

**Assurance-tier tracking (REQ-32.2, closing the REQ-31.6 gap)**: the same `Session.createdVia` field backs a new pair of functions in `lib/session.ts` — `getSessionAssuranceTier()` (reads the current session's `createdVia` and returns `"passkey" | "recovery"`) and `requireStepUp()` (throws `StepUpRequiredError` unless the tier is `"passkey"`). The mapping is deliberately fail-closed: only an explicit `"passkey"` value counts as the higher tier; anything else — including a missing or unrecognized value, which shouldn't occur given every session-creating path sets it explicitly, but might for a pre-migration row or a future credential type that forgets to — falls through to `"recovery"`, the direction that still demands a fresh passkey challenge rather than silently trusting a session of unknown strength. Nothing calls `requireStepUp()` yet; it exists as the real mechanism REQ-27/34/35 are expected to call once they define what's actually "sensitive," matching REQ-31.6's original scope note.

**Anti-enumeration (REQ-32.1) and the shared entry point (REQ-32.5) needed no new code.** Reading the plugin source confirmed `/sign-in/magic-link` already returns `{status: true}` unconditionally, before ever checking whether the email matches an account — REQ-32.1's constant-response requirement is the library's own default. `components/MagicLinkRequestForm.tsx` (built under ADR 0033) already shows the same "if an account exists..." message regardless of outcome, and was never given a second lookup path, so REQ-32.5 was already satisfied by that component's existing shape.

**REQ-32.6 (youth guardian-contact routing) is not built.** [Requirement 33](../requirements/33-youth-account-creation-coppa.md)'s distinct guardian-contact field doesn't exist yet — today's schema has one generic, optional `email` on `User`, set at signup regardless of role. Recovery for every account today, adult or youth, goes to that same field. This is a real, visible gap (marked in Requirement 32's own Status line), not something papered over — Requirement 33 is expected to add the actual guardian-contact field and the routing logic that reads it.

## Alternatives Considered

- **Revoke old tokens *after* creating the new one, not before**: rejected — the create-then-delete order leaves a window where two tokens are briefly valid, and failure partway through (the delete step erroring) would leave a stale token alive with no automatic retry. Delete-then-create has no such window.
- **Infer session origin from `AuthEvent` rows instead of a dedicated `Session.createdVia` field**: considered and rejected — correlating a session to the `AuthEvent` row that logged its creation by timestamp proximity is exactly the kind of fragile, racy inference a dedicated field avoids outright, for one extra nullable column.
- **Revoke other sessions on every successful sign-in, not just magic-link verify**: rejected — would kill a legitimate multi-device user's other sessions every time they sign in with a passkey on a new device, which isn't what REQ-32.4 is asking for and isn't a security benefit (passkey sign-in isn't a recovery event).

## Consequences

- `Session` now carries one ScoutBuddy-specific field (`createdVia`) alongside Better Auth's own standard columns — flagged inline in `prisma/schema.prisma` with the same "this is ours, not the library's contract" distinction [ADR 0033](0033-passkey-based-authentication-via-better-auth.md) already drew for `User.role`/`User.patrolId`.
- Verified empirically, not just by reading the code: two consecutive magic-link requests for the same test address left exactly one `Verification` row in the database, and a fourth request within the rate-limit window was correctly rejected.
- `requireStepUp()` exists but is unreferenced by any current code path — expected and consistent with REQ-31.6's original scope, not dead code to be pruned; it's there for [Requirement 27](../requirements/27-multi-tenant-unit-isolation.md)/[34](../requirements/authentication-accounts/34-unit-membership-invitations-switching.md)/[35](../requirements/35-user-account-disabling-deletion.md) to call once built.

## Related

- [ADR 0033 - Passkey-based authentication via Better Auth](0033-passkey-based-authentication-via-better-auth.md) — the system this ADR extends; its own Status line now points here, following the same "Extended by" pattern [ADR 0005](0005-env-based-secrets-management.md) already uses for [ADR 0021](0021-claude-api-ingredient-categorization.md).
- [Requirement 31 - Core Authentication: Accounts, Sessions & Passkeys](../requirements/authentication-accounts/31-core-authentication-accounts-sessions-passkeys.md) — REQ-31.6's step-up model, which `requireStepUp()` implements the real mechanism for.
- [Requirement 32 - Account Recovery & Credential Reset](../requirements/authentication-accounts/32-account-recovery-credential-reset.md) — the requirement this ADR records the build of.
- [Requirement 33 - Adult/Guardian-Mediated Youth Account Creation (COPPA)](../requirements/33-youth-account-creation-coppa.md) — REQ-32.6's remaining blocker.
