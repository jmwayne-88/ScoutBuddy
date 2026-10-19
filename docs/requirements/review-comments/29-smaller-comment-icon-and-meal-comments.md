# Requirement 29 — Smaller Comment Icon, Meal-Level Comments & Campout-List Comment Counts

Status: Done
Depends on: [Requirement 26 - Full Comment & Annotation System](26-full-comment-annotation-system.md) (threads, replies, assignment, resolve/reopen, soft delete, audit log), [Requirement 28 - Comment Pane UX Revision](28-comment-pane-ux-revision.md) (the per-area icon trigger, unresolved-count badge, and side pane this requirement resizes and extends)

## Goal

Make the per-item comment icon less visually heavy, and let either party comment on a whole meal (e.g. "Saturday Dinner") the same way they already can on a dish or an ingredient. Show the number of unresolved comments on each entry of the campout list, for both the Patrol Leader and the ASPL of Camping, so neither has to open every menu to find open feedback.

## Source

User request, 2026-10-18: make the comments icon smaller, and add the same comment functionality to a meal that exists for a dish and an ingredient. Revised the same day: the campout list for Patrol Leaders and for the ASPL of Camping should both show a count of unresolved comments.

## Problem

- **Icon size.** Requirement 28's icon trigger is a 36×36px `IconButton` wrapping a `fontSize="small"` (20px) chat-bubble icon and a 16px badge (`components/CommentPane.tsx`). It sits beside every dish and every ingredient name. On a menu with many ingredients, that's a column of large icons that competes with the names they annotate.
- **No meal target.** Comments can be anchored to the menu, a dish, or an ingredient (`CommentTargetType`: `MENU | DISH | INGREDIENT`). A remark about a meal as a whole ("Saturday Dinner needs a vegetable," "This breakfast takes too long to cook before the hike") has nowhere natural to go. Today it has to go on the whole menu, which loses which meal it's about, or on one dish, which is wrong when the point covers the entire meal.
- **Open comments are invisible from the campout list.** Unresolved-count badges exist only inside a menu (REQ-28.2). The ASPL's campout list (`CampoutCard` in `app/(app)/campouts/layout.tsx`) shows each campout's menu-status progress, and the Patrol Leader's list (`app/(app)/patrol-leader/page.tsx`) shows each menu's status and due date. Neither shows whether open comments are waiting, so the only way to find them is to open each menu and check every badge.

## Requirements

### Smaller comment icon

- **REQ-29.1** The icon-variant comment trigger (dish, ingredient, and the new meal trigger from REQ-29.3) is visibly smaller: the chat-bubble glyph drops from 20px to about 16px, the button's visual footprint from 36×36px to about 28×28px, and the unresolved-count badge shrinks to match (about 14px tall with a correspondingly smaller font). Exact values get settled at build time against the 360px and 1440px layouts.
- **REQ-29.2** The smaller icon must still meet WCAG 2.2 target size: the clickable/tappable area stays at least 24×24px (SC 2.5.8). Everything else from REQ-28.2 is unchanged: outlined vs. filled vs. `primary`-highlighted states, the badge counting only unresolved threads, the accessible label and tooltip text, and the icon's placement beside the item's name.
- The "Menu comments" button in the menu page header (REQ-28.1's `button` variant) is **not** resized by this requirement.

### Meal-level comments

- **REQ-29.3** Each meal on a menu (each meal-framework occasion shown on the menu page, e.g. "Friday Cracker Barrel", "Saturday Breakfast") gets the same icon comment trigger as dishes and ingredients, placed right beside the meal's heading. It opens the same side pane (bottom sheet on phone-sized screens). The pane header names the area, e.g. "Meal · Saturday Dinner".
- **REQ-29.4** Meal comments support everything dish and ingredient comments do, with no differences: start any number of threads, flat replies, assign to the ASPL or this patrol's Patrol Leader, resolve/reopen, author-only soft delete, cancellable composers, and the unresolved-count badge. The same permission boundary applies: only parties who pass `canCommentOnMenu` see or use the trigger (REQ-26.1, REQ-28.6).
- **REQ-29.5** Meal comment threads count only toward their own meal's badge. Comments on a dish or ingredient inside that meal do **not** roll up into the meal's badge, the same way dish badges don't include their ingredients' comments today.
- **REQ-29.6** Every meal-comment lifecycle event is written to the existing comment activity log and renders there like any other entry, with a target summary that names the meal, e.g. "ASPL resolved a comment on Saturday Dinner (meal)".
- **REQ-29.7** A meal comment keeps its point-in-time label (the occasion's display name) so it and its activity-log entries still read correctly if the meal is later removed. The ASPL's "remove occasion" action (`removeOccasion` in `app/(app)/campouts/[id]/actions.ts`) hard-deletes the `Meal` row and its dishes, and that must not fail or delete the meal's comments. Because meal comments are anchored on menu + occasion rather than a `Meal` FK (see Open Questions), they are untouched by the delete and reattach to the meal automatically if `restoreOccasion` brings it back.
- **REQ-29.8** None of this changes `Menu.status`, `canEditMenu`, `canSubmitMenu`, or `canReview` (REQ-26.10 still holds).

### Unresolved comment counts on the campout list

- **REQ-29.9** **ASPL of Camping.** Each campout card in the ASPL's campout list shows that campout's total number of unresolved comment threads, summed across every patrol's menu for that campout.
- **REQ-29.10** **Patrol Leader.** Each entry in the Patrol Leader's menu list (one per campout) shows the number of unresolved comment threads on their own patrol's menu for that campout. It never includes other patrols' menus. The Patrol Leader page skips the list and goes straight to the menu when the patrol has only one menu. That redirect stays as is, so this count appears only when the list renders (two or more menus).
- **REQ-29.11** **What counts.** A count is the number of unresolved, non-deleted top-level threads on the menu or menus in question, across every target: menu, meal, dish, and ingredient. Replies don't count separately, and soft-deleted threads don't count. It's the same definition the in-menu badges use (REQ-28.2), totaled for the whole menu. Threads on a removed occasion's meal (REQ-29.7) still count: they're still unresolved even though no meal heading currently shows them.
- **REQ-29.12** **Display.** The count is a small badge or chip with a chat-bubble glyph, matching the comment icon's visual language. When the count is zero, nothing is shown, so the list stays quiet when there's nothing to act on. It has an accessible label that reads as a sentence (e.g. "3 unresolved comments") and isn't conveyed by color alone. It's informational, not a separate link: activating the entry still goes where it goes today. Colors come from theme tokens and must pass `lib/theme/contrast.test.ts`.
- **REQ-29.13** **Freshness.** The count reflects the database at page load, like the status and progress already shown on those lists. It doesn't update live (real-time updates stay out of scope). Posting, resolving, reopening, or deleting a thread must revalidate the campout list, so the count is current the next time the list renders.
- REQ-29.8 applies here too: the counts are read-only and change no status or permission.

## Acceptance Criteria

- [ ] The dish and ingredient comment icons render visibly smaller than before, and still have a clickable/tappable area of at least 24×24px.
- [ ] At 360px and 1440px, the smaller icon and its badge stay aligned with the item name and don't overlap the name or the row actions.
- [ ] Every meal heading on a menu page shows a comment icon. Clicking it opens a pane titled "Meal · <occasion>" without shifting the menu layout.
- [ ] Either party can start multiple threads on a meal, reply, assign, resolve/reopen, and delete their own comments there.
- [ ] A meal's badge shows only that meal's unresolved threads, not its dishes' or ingredients'.
- [ ] Meal-comment events appear in the comment activity log, naming the meal.
- [ ] Removing a meal occasion that has comments succeeds. Its comments' activity-log entries still read correctly afterward.
- [ ] Restoring that occasion (including via the toast's Undo) shows its earlier meal comments under the meal heading again.
- [ ] Each campout card in the ASPL's campout list shows the total unresolved threads across all patrols' menus for that campout, and shows nothing when the total is zero.
- [ ] Each entry in the Patrol Leader's menu list shows the unresolved threads on that patrol's menu only, and shows nothing when the count is zero.
- [ ] The counts include menu, meal, dish, and ingredient threads, leave out replies and soft-deleted threads, and drop after a thread is resolved (the next time the list loads).
- [ ] The count badge has an accessible label like "3 unresolved comments", and the cards and list entries stay readable with no overlap at 360px and 1440px.
- [ ] `npm test` passes, including `lib/theme/contrast.test.ts`.

## Out of Scope

- Rolling dish/ingredient comment counts up into the meal badge, or a menu-wide total inside the menu page itself (REQ-28's "Out of Scope" still excludes that). The campout-list counts in REQ-29.9–29.13 are the only roll-up this requirement adds, and they appear only on the campout lists.
- Breaking the campout-list count down by patrol, target, or assignee, or linking from the count straight to a specific thread.
- Comments on the meal framework itself on the campout page (the ASPL's occasion list), as opposed to a meal on a patrol's menu.
- Resizing the "Menu comments" header button.
- Editing posted comments, real-time updates, and notifications. All remain out of scope, as in Requirements 26 and 28.

## Open Questions

- **Data-model shape for a meal anchor** — **resolved** (user decision, 2026-10-18): anchor a `MEAL` comment on its menu plus its occasion (`menuId` + a `MealOccasion` value), with no foreign key to `Meal`. Each menu has at most one meal per occasion, so that pair already identifies a meal uniquely. Because `restoreOccasion` creates a **new** `Meal` row, an FK to `Meal` (mirroring `dishId`/`ingredientId`) would leave comments detached after a remove/restore cycle. Anchoring on the occasion makes them reattach automatically, which matters because remove/restore is the normal Undo path (REQ-15.1/15.2).
  - Rejected alternative: `mealId` FK with `onDelete: SetNull`, matching dishes and ingredients (ADR 0026). It's more consistent with the other targets but loses the link on every restore.
  - Consequence: while an occasion is removed, its meal comments have no meal heading to appear under. They stay in the database and the activity log, and reappear under the meal when it's restored.
  - This is a data-model change, so it gets its own ADR at build time, per this project's working conventions. See [ADR 0029](../adr/0029-meal-comment-occasion-anchor.md).

## Related

- [Requirement 26 - Full Comment & Annotation System](26-full-comment-annotation-system.md) — the comment system extended here with a fourth target.
- [Requirement 28 - Comment Pane UX Revision](28-comment-pane-ux-revision.md) — the icon trigger and pane this requirement resizes and reuses.
- [Requirement 4 - Meal-Framework Variation](../roadmap-iterations/04-meal-framework-variation.md) — the remove/restore occasion behavior REQ-29.7 and the Open Question depend on.
- [Requirement 15 - Consistent Destructive-Action Pattern](../ux-interaction-polish/15-consistent-destructive-action-pattern.md) — the Undo-via-restore flow behind the Open Question's recommendation.
- [ADR 0026 - Comment/annotation data model](../adr/0026-comment-annotation-data-model.md) — the `Comment`/`CommentActivity` schema a meal target extends.
- [ADR 0029 - Meal comments anchor on occasion, not a `Meal` foreign key](../adr/0029-meal-comment-occasion-anchor.md) — records the occasion-based meal anchor (see Open Questions).
