# Requirement 24 — Due-Date & Review Notifications (Push/Email)

Status: Not started — blocked on an open identity decision (see Problem)
Depends on: [ADR 0010](../adr/0010-cookie-based-role-identity.md) (must be revisited or superseded before this requirement can be built)

## Goal

Notify a Patrol Leader when their menu's due date is approaching or past, and notify both the ASPL and the relevant Patrol Leader when a menu's status changes (submitted, changes requested, approved) — via push notification and/or email — so the workflow doesn't depend entirely on someone remembering to open the app.

## Source

Recommendation #19 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section — explicitly flagged there as a "bigger bet" requiring real infrastructure, not a quick win.

## Problem — a real blocker, not just scope

[ADR 0010](../adr/0010-cookie-based-role-identity.md) established cookie-based role identity with **no accounts, no passwords, and no per-person identity at all** — `lib/session.ts`'s `Actor` type is only `{ role: "ASPL" }` or `{ role: "PATROL_LEADER", patrolId }`. There is no email address, no phone number, no stable per-device push-subscription owner, and no way to distinguish "the Eagle Patrol Leader on this phone" from "the Eagle Patrol Leader on a different phone" — by design, intentionally, per that ADR's reasoning that this is a small, trusted, youth-led troop that doesn't need real accounts.

**This requirement cannot be built as specified without first revisiting ADR 0010.** Every notification channel under consideration needs *some* persistent, addressable identity:

- **Web push** needs a browser `PushSubscription` stored against *something* stable — today, nothing survives beyond the `scoutbuddy_actor` cookie, which identifies a role, not a person or device, and isn't designed to persist a subscription registration.
- **Email** needs an email address collected from *someone*, stored against a patrol (so the current Patrol Leader's device receives it) or an individual — a new, explicit data-collection step this app has never needed before.

## Requirements (contingent on resolving the identity blocker)

- **REQ-24.1** A new ADR is written that explicitly revisits [ADR 0010](../adr/0010-cookie-based-role-identity.md)'s no-accounts decision — not silently working around it — and either (a) supersedes it with some minimal addressable-identity mechanism (e.g. an optional email captured once per patrol, or a per-device push subscription tied to the existing role cookie with explicit user consent), or (b) concludes notifications aren't worth that trade-off at this troop's scale and this requirement is declined. This requirement's remaining items (REQ-24.2 onward) assume option (a).
- **REQ-24.2** A Patrol Leader can opt in to browser push notifications for their own patrol's menu(s), granted explicitly (the standard browser permission prompt, triggered by a deliberate in-app action, never requested automatically on page load).
- **REQ-24.3** A notification fires when a menu's due date is reached and it still has at least one active occasion with zero dishes (reusing the same "empty occasion" condition `lib/validation.ts`'s `menuHasEmptyOccasion` already defines for the submit-blocking check in [Requirement 5](05-workflow-hardening-and-polish.md)'s REQ-5.6) — not merely "due date reached" regardless of actual completeness, so a patrol that finished early isn't nagged.
- **REQ-24.4** A notification fires to the relevant Patrol Leader when their menu's status changes to Changes Requested, and to the ASPL when any menu's status changes to Submitted — mirroring the two directions of the existing review workflow ([ADR 0007](../adr/0007-menu-status-lifecycle-and-permissions.md)).
- **REQ-24.5** Email is a secondary/fallback channel only if REQ-24.1's identity decision captures an email address at all; this requirement does not assume email is available and must degrade to push-only (or notification-free, for anyone who declines push) rather than silently failing to notify.
- **REQ-24.6** No notification includes menu content (dish names, ingredient lists, review comments) in its payload — only enough context to identify what changed (e.g. "Eagle Patrol's menu for Fall Campout needs changes") — since push payloads and email previews are not guaranteed private the way the in-app view is.
- **REQ-24.7** A Patrol Leader or ASPL can turn notifications off as easily as they turned them on — this requirement does not ship an always-on, unremovable notification channel.

## Acceptance Criteria

- [ ] A new ADR exists that explicitly makes the identity-mechanism decision this requirement depends on, before any of REQ-24.2 onward is implemented.
- [ ] A Patrol Leader who opts in receives a push notification when their menu's due date passes while it's still incomplete.
- [ ] An ASPL receives a notification when any menu is submitted; a Patrol Leader receives one when their menu gets Changes Requested.
- [ ] No notification payload contains dish, ingredient, or review-comment content.
- [ ] Opting out of notifications is a single, discoverable action.

## Out of Scope for This Requirement

- Automatic due-date calculation — explicitly deferred in FEATURES.md's Out-of-Scope list and ROADMAP.md's Later section; this requirement notifies about existing due dates, it doesn't compute new ones.
- Any notification channel beyond push and (optionally) email — no SMS, no in-app-only badge system (that's closer to the gamification requirement).
- Building REQ-24.2 onward before REQ-24.1's identity ADR is written and accepted — that ADR is a hard prerequisite, not a parallel task.

## Related

- [ADR 0010 - Cookie-based role identity, no accounts or passwords](../adr/0010-cookie-based-role-identity.md) — the decision this requirement cannot proceed without revisiting.
- [ADR 0007 - Menu status lifecycle as a role-gated state machine](../adr/0007-menu-status-lifecycle-and-permissions.md) — the status transitions REQ-24.4's notifications fire on.
- [Requirement 5 - Workflow Hardening & Polish](05-workflow-hardening-and-polish.md) — REQ-5.6's empty-occasion check, reused by REQ-24.3.
- ROADMAP.md's "Later — explicitly deferred" section — automatic due-date calculation, the adjacent-but-distinct deferred item this requirement does not include.
