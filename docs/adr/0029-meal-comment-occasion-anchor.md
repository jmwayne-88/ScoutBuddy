# 0029. Meal comments anchor on occasion, not a `Meal` foreign key

Date: 2026-10-19
Status: Accepted

## Context

[Requirement 29](../requirements/29-smaller-comment-icon-and-meal-comments.md) extends [ADR 0026](0026-comment-annotation-data-model.md)'s comment system with a fourth target: a whole meal (e.g. "Saturday Dinner"), not just the menu, a dish, or an ingredient. `Comment`'s existing targets (`dishId`/`ingredientId`) each carry a real foreign key to the row they're about, with `onDelete: SetNull` — the comment survives its target's deletion, just loses the live link, relying on its frozen `targetLabel` snapshot to keep reading sensibly (REQ-26's design).

A `Meal` row doesn't behave like a `Dish` or `Ingredient` row here. `removeOccasion` (`app/(app)/campouts/[id]/actions.ts`) hard-deletes the `Meal` row for a removed occasion, and `restoreOccasion` — the normal Undo path for that removal (REQ-15.1/15.2) — doesn't resurrect it; it `create`s a **brand-new** `Meal` row with a new id. A `mealId` FK with `onDelete: SetNull`, mirroring `dishId`/`ingredientId` exactly, would correctly survive the delete (comment lives on, `mealId` goes null) but would stay null forever after a restore — the new `Meal` row has a different id, so nothing reattaches it. Since remove/restore is routine, expected behavior (not a rare edge case), that would mean losing the meal heading for most meal comments within their normal lifecycle, not just in an unusual one.

## Decision

A `MEAL` comment anchors on `Comment.menuId` (already present) plus a new nullable `Comment.occasion MealOccasion?` column — no foreign key to `Meal` at all. Each menu has at most one `Meal` per occasion (enforced by `Meal`'s existing `@@unique([menuId, occasion])`), so the `(menuId, occasion)` pair already identifies "that meal" uniquely, and it's stable across a remove/restore cycle: the menu page's meal-loop renders a target's trigger and comments by matching `occasion` directly (`commentsForTarget` in `app/(app)/menus/[id]/page.tsx`), with no join to the `Meal` table needed to find them.

`targetLabel` still carries the occasion's point-in-time display name (`mealOccasionLabel()`, `lib/constants.ts`), exactly as REQ-26 already does for dish/ingredient names — a meal occasion's label doesn't actually change over time today, but keeping the same frozen-snapshot mechanism uniformly (rather than special-casing meal targets to read live) keeps `targetSummary`/`activityLine` simple and consistent across all four target types.

While an occasion is removed, its meal comments have no meal heading to render under (REQ-29.7's documented consequence) — they stay in the database and the activity log, and reappear under the meal the moment the occasion is restored, because `occasion` was never tied to the now-gone `Meal` row's id in the first place.

## Alternatives Considered

- **`mealId` FK with `onDelete: SetNull`, matching `dishId`/`ingredientId`**: the obvious "stay consistent with the other three targets" choice. Rejected because it's consistent in shape but wrong in behavior here — it silently and permanently detaches a meal's comments from their heading on the very first ordinary remove/restore cycle, which is exactly the case REQ-15's Undo pattern makes routine, not exceptional.
- **Give `restoreOccasion` reuse of the original `Meal` row's id (soft-delete `Meal` instead of hard-deleting it)**: would let a real `mealId` FK work correctly across restore. Rejected as a much larger, unrelated change to [ADR 0012](0012-meal-framework-exceptions.md)'s meal-framework-exception model and `removeOccasion`/`restoreOccasion`'s established hard-delete/recreate behavior, affecting more than just comments, to solve a problem this requirement doesn't otherwise have.
- **A join table mapping old `Meal` ids to new ones across a restore**: would preserve a real FK's semantics without changing the delete/recreate behavior. Rejected as more schema and bookkeeping than a single nullable enum column, for a problem the occasion-pair anchor already solves directly.

## Consequences

- `Comment.occasion` is only ever set when `targetType = "MEAL"`; every other target type leaves it null, the same pattern `dishId`/`ingredientId` already follow for their own target types.
- Nothing about `removeOccasion`/`restoreOccasion` needed to change — no FK means no cascade, no `SetNull`, and no bookkeeping to reattach comments on restore; it's automatic.
- Unlike a dish or ingredient comment, a meal comment can never be "permanently orphaned with a frozen label" the way a deleted dish's comment can (dish deletion has no corresponding automatic restore) — a removed occasion's meal comments are always one `restoreOccasion` away from reappearing live.
- If a menu could ever have more than one `Meal` row per occasion, this anchor would stop uniquely identifying "the meal" — `Meal`'s existing `@@unique([menuId, occasion])` constraint (unchanged by this ADR) is what keeps that true.

## Related

- [Requirement 29 - Smaller Comment Icon, Meal-Level Comments & Campout-List Comment Counts](../requirements/29-smaller-comment-icon-and-meal-comments.md) — REQ-29.3/29.7, and the Open Question this ADR records the resolution of.
- [ADR 0026 - Comment/annotation data model](0026-comment-annotation-data-model.md) — the `Comment`/`CommentActivity` schema this extends with a fourth target.
- [ADR 0012 - Meal-framework removal modeled as a campout-scoped exception table](0012-meal-framework-exceptions.md) — why `removeOccasion`/`restoreOccasion` hard-delete and recreate `Meal` rows the way they do.
- [Requirement 15 - Consistent Destructive-Action Pattern](../requirements/15-consistent-destructive-action-pattern.md) — the Undo-via-restore flow that makes remove/restore a routine, not exceptional, event.
