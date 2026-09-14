# 0010. Cookie-based role identity, no accounts or passwords

Date: 2026-09-14
Status: Accepted

## Context

Enforcing "a Patrol Leader can never approve their own menu" ([REQ-1.15/1.16](../requirements/01-core-approval-loop.md)) server-side requires the app to know, on every request, who is acting. Neither the brief nor any earlier document specified how — there are exactly five youth leaders (one ASPL of Camping, one Patrol Leader per patrol), and this is a low-stakes internal troop tool, not something handling sensitive personal data.

## Decision

Identity is a role choice, not an account: a picker on `/` lets someone declare "I am the ASPL of Camping" or "I am the Patrol Leader for [patrol]," stored in an httpOnly cookie (`scoutbuddy_actor`, e.g. `{"role":"PATROL_LEADER","patrol":"EAGLE"}`). No passwords, no sign-up, no session expiry beyond the cookie itself. Every Server Action reads this cookie server-side (`lib/session.ts`) and runs it through the permission functions ([ADR 0007](0007-menu-status-lifecycle-and-permissions.md)) before mutating anything — the cookie is trusted as *identity*, but never as *authorization* on its own.

## Alternatives Considered

- **Picker + shared PIN per role**: adds friction to stop casual mis-selection, without real security (a shared PIN is still not authentication). Deferred — can be layered on top of the same cookie mechanism later if casual mis-selection turns out to be a real problem in practice.
- **Full accounts with login** (email/password or magic link): the "correct" long-term answer, but meaningfully more to build (auth library, session storage, account recovery) for a 5-person user base where the actual risk of someone impersonating a role they don't hold is low and socially self-correcting (everyone knows each other).

## Consequences

- Anyone with the app's URL can declare themselves the ASPL and approve any menu — there is no real access control, only a convention the app helps people follow. This is an accepted tradeoff, not an oversight; revisit if ScoutBuddy is ever used somewhere the stakes are higher (e.g. shared across multiple troops, or storing anything sensitive).
- Because there's no account system, there's also no notion of "which specific person" acted beyond their role — a review comment is attributed to "the ASPL," not to a named individual. Fine for now; would need real accounts to change.
- Switching roles is just re-submitting the picker form — useful for testing and for one shared device, but means the app can't tell two different Patrol Leaders apart if they happen to use the same browser without switching roles in between.
