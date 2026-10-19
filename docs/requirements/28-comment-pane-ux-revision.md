# Requirement 28 — Comment Pane UX Revision

Status: Done
Depends on: [Requirement 26 - Full Comment & Annotation System](26-full-comment-annotation-system.md) (the comment threads, replies, assignment, resolve/reopen, delete, and audit log this requirement re-presents)

## Goal

Make viewing and starting comments feel seamless instead of clunky, without changing what the comment system can do or how it's stored.

## Source

User feedback, 2026-10-18, after Requirement 26 shipped: where you view and start comments is clunky and the UX should be more seamless; each area needs to support more than one comment; the roll-up should show how many unresolved comments exist for that area; and there should be an easy way to cancel a comment you've started.

## Problem

Requirement 26's first pass rendered comments inline:

- A "Comments (N)" text button sat under every dish and every ingredient, and expanding one pushed a full thread (bubbles, an always-visible reply field, an assign dropdown with its own button, and a resolve button for *every* thread, plus an "Add a comment" box) into the middle of the menu, shifting everything below it.
- Menu-level comments lived in their own section near the bottom of the page, far from where the menu is read.
- N counted every thread ever started, resolved or not, so it didn't tell anyone what still needed attention.
- The "Add a comment" box sat below all existing threads with nothing marking it as "start another thread," so it read as if each area held one comment.
- Composers had no Cancel. Once you'd typed something, the only way out was to clear the text by hand.

## Requirements

- **REQ-28.1** Each commentable area (the whole menu, each dish, each ingredient) has one compact comment trigger placed right beside it: a small icon next to the dish or ingredient name, and a "Menu comments" button in the menu page header next to Print preview. Clicking it opens a side pane (a bottom sheet on phone-sized screens) holding that area's threads. The menu layout never expands or shifts. The pane's header names the area, e.g. "Dish · Trail Stew".
- **REQ-28.2** The trigger's badge shows that area's number of **unresolved** threads (open root comments; replies and resolved threads don't count). The icon is outlined when the area has no comments, filled when it has any, and highlighted in `primary` when it has unresolved ones. The trigger's accessible label says the same thing, e.g. "Comments on Trail Stew (2 unresolved)".
- **REQ-28.3** An area can hold any number of separate threads. A "New comment" button is always at the top of the pane, whether or not threads already exist. Opening an area that has no comments yet goes straight into the composer.
- **REQ-28.4** No composer is visible until someone asks for one ("New comment", or "Reply" on a thread). Every composer has a Cancel button, and Escape inside the text field also cancels, discarding the draft without closing the pane. The submit button stays disabled until there's text. Ctrl/Cmd+Enter submits.
- **REQ-28.5** Each thread's controls are one compact row: Reply, Resolve or Reopen, and Assign or Reassign. Assign opens a two-item menu (the ASPL, or this patrol's Leader) and applies the choice right away. Resolved and assigned states show as chips at the top of the thread. A resolved thread hides Reply until it's reopened.
- **REQ-28.6** Comment triggers render only for parties who can comment on the menu (`canCommentOnMenu`), matching REQ-26.1's view boundary.
- **REQ-28.7** Nothing in Requirement 26's data model, permissions, Server Actions, or audit log changes. This is a presentation-only revision.

## Acceptance Criteria

- [x] Every dish and ingredient shows a comment icon beside its name, and the menu header shows a "Menu comments" button. Clicking either opens a side pane (or a bottom sheet at 360px) without shifting the menu layout.
- [x] The badge count equals the area's unresolved threads, and it drops when a thread is resolved.
- [x] A second, third, … thread can be started in the same area via "New comment".
- [x] "New comment" and "Reply" composers each have a working Cancel, and Escape cancels the draft while leaving the pane open.
- [x] The pane stays open across posting, resolving, and replying (each still delivers its toast per ADR 0023).

## Out of Scope

- Editing a posted comment, real-time updates, and notifications. All remain out of scope, as in Requirement 26.
- A menu-wide "all comments" list or a total unresolved count across every area.
- Deep links from an activity-log row to its thread.

## Related

- [Requirement 26 - Full Comment & Annotation System](26-full-comment-annotation-system.md) — the system this revises.
- [ADR 0023 - Toast feedback delivered via a post-redirect query param](../adr/0023-redirect-based-toast-notifications.md) — comment actions still redirect with a toast. Because a search-param-only redirect doesn't remount the page, the pane's open state survives it.
- [ADR 0026 - Comment/annotation data model](../adr/0026-comment-annotation-data-model.md) — unchanged.
