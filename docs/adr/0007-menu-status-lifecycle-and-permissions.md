# 0007. Menu status lifecycle as a role-gated state machine

Date: 2026-09-14
Status: Accepted

## Context

The core value ScoutBuddy provides is a correct, trustworthy approval workflow between a Patrol Leader and the ASPL of Camping. The brief is explicit that status changes are permission-gated: a Patrol Leader must never be able to approve their own menu, and only the ASPL may move a menu to Changes Requested or Approved.

## Decision

Model menu status as a fixed enum with one legal path forward and one loop-back:

`Not Started -> In Progress -> Submitted -> Changes Requested -> Approved`

(with `Changes Requested` looping back through editing to a re-`Submitted` state, unlimited times).

Permissions are enforced by role, not just by UI affordance:

- The Patrol Leader may edit the menu's contents in any status except Approved, and may move it to Submitted.
- Only the ASPL may set a menu to Changes Requested (with required comments) or Approved.
- The Patrol Leader can never set their own menu to Changes Requested or Approved.

## Alternatives Considered

- **Free-form status field with UI-only restrictions** (e.g. just hiding the Approve button from Patrol Leaders in the interface): rejected — a client-side-only restriction isn't a real guarantee and is trivially bypassed via direct API calls. Because permission-gating is the workflow's core value, it must be enforced server-side.

## Consequences

- Status transition logic must live in the backend (API routes / server-side logic), checked against the requesting user's role on every transition, not just hidden in the UI.
- This logic is a good candidate for isolated unit tests, since it's small, rule-based, and central to correctness.
- Comments on a Changes Requested decision need to persist as a running record tied to the submission (not a single overwritable field), so a Patrol Leader can see review history across revisions.
