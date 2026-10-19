# Requirement 26 — Full Comment & Annotation System (Office Review-Mode Style)

Status: Done
Depends on: [Requirement 22 - Chat-Thread Review History](22-chat-thread-review-history.md) (the bubble/thread visual language and patrol-color accent this requirement reuses for a new, more general comment target)

## Goal

Extend Requirement 22's chat-thread restyle into a full, Microsoft-Office-review-mode-style commenting system: either party can open a comment thread anchored to the whole menu, a specific dish, or a specific ingredient; reply within it; assign it to a party; resolve it; and remove it — with every action permanently recorded in an audit log at the bottom of the menu page.

## Source

User request, 2026-10-18: overhaul comment functionality to behave like review mode in Microsoft Office — any party can start a comment on any dish, ingredient, or the overall menu; reply; assign; resolve; delete; full audit log at the bottom of the page.

## Problem

Today the only commentary a menu supports is `Review.comment` — a single, optional, ASPL-authored string tied 1:1 to a Changes-Requested or Approved decision at the whole-menu level (Requirement 22 only restyled how that history displays, per its own REQ-22.6). There is no way to:

- Comment on a specific dish or ingredient — only the whole menu.
- Have the Patrol Leader initiate a comment or reply to one — commentary today is one-directional (ASPL → Patrol Leader) and tied to the approve/reject action itself.
- Thread a back-and-forth on a single point without it becoming a new formal review decision.
- Assign a comment to a party for follow-up.
- Mark a comment resolved without wrapping it into a status-lifecycle transition.
- Remove a comment, or see a durable record of who did what to a comment and when.

## Relationship to the Existing Review Model

This requirement does not replace `Review`/`ReviewDecision` or the Approved/Changes-Requested decision flow ([ADR 0007](../adr/0007-menu-status-lifecycle-and-permissions.md)) — approve/reject remains the single, formal, status-changing action, and Requirement 22's chat-thread restyle of that history is unchanged. The new Comment system is a separate, lighter-weight annotation layer that exists alongside it: comments never move `Menu.status`, and a Changes-Requested decision's required comment (ADR 0007) is still captured on `Review`, not as a `Comment`.

## Requirements

- **REQ-26.1** Either party with access to the menu — the owning Patrol Leader or the ASPL of Camping — can start a new comment thread anchored to one of three targets: the menu as a whole, a specific dish, or a specific ingredient. No one outside those two parties (e.g. another patrol's Patrol Leader) can see or start a comment on this menu, matching the existing view/edit boundary (`lib/permissions.ts`'s `canEditMenu`/`canReview`).
- **REQ-26.2** Either party can reply to an existing thread. Replies are flat under their root comment (one level of threading, matching Office's model) — not reply-to-reply.
- **REQ-26.3** A thread can be assigned to a party for follow-up. The app has no named-individual login — only the two roles in `lib/session.ts`'s `Actor` type ("ASPL" or "Patrol Leader of Patrol X") — so assignment targets one of those two roles, not a named person. (Resolved — see Open Questions.)
- **REQ-26.4** A thread can be marked Resolved, and a Resolved thread can be reopened. Resolving does not delete the thread's content. A Resolved thread collapses out of the main thread list by default; a visible toggle (e.g. "Show resolved (N)") reveals resolved threads on demand, matching Office's default behavior. (Resolved — see Open Questions.)
- **REQ-26.5** A comment or reply can be removed, but only by the party who authored it — not by the other party, and not by the ASPL overriding someone else's comment. Removal is a soft delete: it disappears from the live thread but its content and metadata are retained for the audit log (REQ-26.6) — a true hard delete would make "full audit log of comment activity" impossible to honor. (Resolved — see Open Questions.)
- **REQ-26.6** Every lifecycle event on every comment — created, replied-to, assigned, reassigned, resolved, reopened, deleted — is written to an append-only audit log entry: actor (role, and patrol where applicable), action, timestamp, and which thread/target it applies to. The log is immutable; deleting a comment never deletes its audit entries.
- **REQ-26.7** The audit log renders at the very bottom of `app/(app)/menus/[id]/page.tsx`, below Requirement 22's review-history thread and below the comment threads themselves, as its own dedicated section titled something like "Comment activity log." Specifically:
  - Newest-first order — the opposite of REQ-22's oldest-to-newest thread, deliberately: a conversation thread reads forward in time, but an activity log is scanned for "what just happened," so the most recent event belongs at the top.
  - Each entry is a single compact row, not a chat bubble (it's a log, not a conversation): an icon keyed to the action type, a plain-language line ("ASPL resolved a comment on Trail Stew," "Eagle Patrol Leader deleted a reply on the menu's allergy note"), and a relative timestamp via the same `formatEventDate`/`RelativeDate` pair REQ-22 uses, with the exact date on hover/tap.
  - The log loads an initial page (most recent ~20 entries) with a "Load more" affordance rather than rendering a menu's entire history at once — keeps "full" (nothing is ever deleted or summarized out) without forcing a single unbounded render. (Resolved — see Open Questions.)
- **REQ-26.8** Dish- and ingredient-anchored comments surface at their anchor point (e.g. a comment-count affordance next to that dish/ingredient row), not only in one undifferentiated list, so a reader can tell what a thread is actually about at a glance.
- **REQ-26.9** The new comment-thread UI reuses Requirement 22's chat-bubble/patrol-color visual language (bubble shapes, patrol-color accent for the ASPL side, `formatEventDate`/`RelativeDate` timestamps) rather than inventing a second, inconsistent comment UI on the same page.
- **REQ-26.10** None of the above changes `Menu.status`, `canEditMenu`, `canSubmitMenu`, or `canReview` — a menu's ability to be edited, submitted, approved, or rejected stays governed entirely by the existing status lifecycle (ADR 0007), untouched by comment activity.

## Acceptance Criteria

- [x] From a menu's page, the owning Patrol Leader and the ASPL can each start a new comment thread on the menu overall, on any dish, and on any ingredient.
- [x] Both parties can reply to any thread either of them started.
- [x] A thread can be assigned to a role and that assignment is visible on the thread.
- [x] A thread can be marked Resolved and later reopened; a Resolved thread collapses out of the default view and a "Show resolved" toggle reveals it again.
- [x] A comment/reply shows a delete control only to the party who authored it, never to the other party.
- [x] Deleting a comment removes it from the live thread view but it still appears as a "deleted" event in the audit log, including who deleted it and when.
- [x] The bottom-of-page audit log shows every create/reply/assign/resolve/reopen/delete event across every thread on the menu, newest first, each as a compact single-line entry with a relative timestamp — not a full re-rendering of the comment conversation itself.
- [x] A menu with more activity-log entries than the initial page shows a "Load more" control rather than silently truncating history.
- [x] No comment-system action changes the menu's status or who can edit/submit/review it.

## Out of Scope for This Requirement

- Editing the text of an already-posted comment or reply (Office supports this; this pass does not — only reply, assign, resolve, and delete, per the user's explicit list).
- Real-time/live updates to threads or the audit log — matches Requirement 22's existing precedent; requires a refresh, same as the rest of the app today.
- Notifications/alerts on assignment, reply, or resolution — a natural fit for [Requirement 24 - Due-Date & Review Notifications](../24-due-date-and-review-notifications.md) if ever extended there, not built here.
- Replacing or restructuring `Review`/`ReviewDecision` or the Approved/Changes-Requested decision flow — unchanged; see "Relationship to the Existing Review Model" above.
- Comments from any party other than the menu's own Patrol Leader and the ASPL (e.g. other patrols, adult leaders) — no such viewer exists in the current permission model.
- The underlying data-model shape (new `Comment`/audit-log tables, a target discriminator for menu/dish/ingredient, etc.) is not designed in this document — it's a real data-model decision and gets its own ADR at build time per this project's working conventions, not invented here.

## Open Questions

- **Deletion permission** — **resolved**: author-only. A party may delete only the comment/reply they personally wrote; the ASPL has no override authority over another party's comment, unlike its sole authority over the menu's status decision. No change to `lib/permissions.ts`'s existing ASPL/Patrol-Leader split is implied — this is a new, narrower "authored by me" check on the `Comment` itself.
- **Assignment granularity** — **resolved**: role-level only. A thread is assigned to "the ASPL" or "the Patrol Leader of this patrol," the same two parties who can already see/comment on the menu — no named-individual identity system is introduced.
- **Resolved-thread visibility default** — **resolved**: hidden by default, with a toggle to reveal (REQ-26.4) — matches Office's own default.
- **Audit log length and on-screen presentation**: resolved by design decision rather than a question back to the user — see REQ-26.7 for the full spec (dedicated bottom-of-page section, newest-first, compact single-line entries, initial page + "Load more").

## Related

- [Requirement 28 - Comment Pane UX Revision](28-comment-pane-ux-revision.md) — revises where/how REQ-26.8's per-anchor threads are viewed and started (side pane, unresolved-count badges, cancellable composers); the data model and audit log above are unchanged.
- [Requirement 22 - Chat-Thread Review History](22-chat-thread-review-history.md) — the bubble/thread visual language this requirement extends to a new, general-purpose comment target; `Review`'s chat-thread restyle itself is unchanged by this requirement.
- [ADR 0007 - Menu status lifecycle as a role-gated state machine](../adr/0007-menu-status-lifecycle-and-permissions.md) — the approve/reject/status rules this requirement's comment layer sits alongside but never alters (REQ-26.10).
- [ADR 0026 - Comment/annotation data model](../adr/0026-comment-annotation-data-model.md) — the `Comment`/`CommentActivity` schema this requirement is implemented with, including why deletion is a soft delete and why assignment is role-level.
- [Requirement 5 - Workflow Hardening & Polish](../roadmap-iterations/05-workflow-hardening-and-polish.md) — REQ-5.3/5.4's existing guarantee that review comments stay visible and timestamped across revisions; this requirement's audit log extends that same spirit to the new, more granular comment system.
- [Requirement 24 - Due-Date & Review Notifications](../24-due-date-and-review-notifications.md) — the natural home for comment-assignment/reply notifications if ever built; explicitly out of scope here.
