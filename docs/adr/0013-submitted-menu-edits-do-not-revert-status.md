# 0013. Editing a Submitted menu does not revert its status

Date: 2026-09-15
Status: Accepted

## Context

[FEATURES.md](../../FEATURES.md) explicitly left open whether a Patrol Leader editing a menu while it's `SUBMITTED` should silently revert its status to `IN_PROGRESS` (requiring an explicit re-submit), or leave it `SUBMITTED` while edited. [REQ-5.1](../requirements/05-workflow-hardening-and-polish.md) requires this be decided and written down before Iteration 5 is considered done.

Separately, the user directed earlier in this project that "the Patrol Leader can tweak it until it's been approved" — i.e. editing should remain possible in every pre-`APPROVED` status, without qualification.

## Decision

Editing a menu that is `SUBMITTED` or `CHANGES_REQUESTED` does **not** change its status. Only the one-time `NOT_STARTED → IN_PROGRESS` bump (on the very first edit) is automatic; nothing else about status is a side effect of editing. This was already Iteration 1's actual behavior (see `bumpNotStarted` in `app/menus/[id]/actions.ts`) — this ADR formalizes it as an intentional decision rather than leaving it as an undocumented accident of how Iteration 1 happened to be written.

## Alternatives Considered

- **Revert to `IN_PROGRESS` on any edit while `SUBMITTED`**: would guarantee the ASPL never reviews content that changed after submission, but forces a full re-submit for something as small as fixing a typo in an ingredient quantity — friction that directly contradicts the "tweak it until approved" instruction, for a benefit (staleness protection) that a five-person, socially-coordinated troop is unlikely to need in practice.

## Consequences

- An ASPL reviewing a `SUBMITTED` menu could, in principle, be looking at content that the Patrol Leader is still actively changing in a second tab — there's no lock or staleness warning. Acceptable at this scale; revisit if it ever causes real confusion.
- No code changes were needed to implement this decision — it documents existing behavior. Any future change to this behavior should be a new ADR that supersedes this one, not a silent code change.
