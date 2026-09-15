# 0012. Meal-framework removal modeled as a campout-scoped exception table

Date: 2026-09-15
Status: Accepted

## Context

[Iteration 4](../requirements/04-meal-framework-variation.md) requires the ASPL to remove one or more of the six standard meal occasions from a campout, scoped either to one named patrol or to all patrols, and to be able to do this both before and after a patrol's menu is assigned. [ADR 0006](0006-structured-meal-framework-variation.md) already decided this is structured removal, not free text — this ADR is about how that removal is stored.

Iteration 1's `assignMenu` eagerly creates all six `Meal` rows the moment a menu is assigned, and `app/menus/[id]/page.tsx` already only renders occasions that have a `Meal` row. A removal mechanism needs to (a) stop those rows from being created for a menu assigned after the removal, and (b) remove them from a menu that already has them, without losing the "occasions that are removed" fact once a matching menu doesn't exist yet.

## Decision

Add a `MealFrameworkException` model: one row per (campout, occasion, patrol-or-null) meaning "this occasion is removed for this patrol, or for every patrol if `patrol` is null."

- **Assigning a menu** queries exceptions for that campout where `patrol IS NULL OR patrol = <the assigned patrol>`, and skips creating `Meal` rows for excluded occasions — so a menu assigned after the exception exists is correct immediately, no cleanup needed.
- **Removing an occasion from an already-assigned menu** creates the exception row (or replaces an identical-scope one — see Consequences) and also deletes the matching `Meal` row, plus its dishes and ingredients, from every currently-affected menu.
- **Restoring** deletes the exception row and re-creates an empty `Meal` row for every affected menu — except a menu whose patrol is still excluded by a *different*, still-standing exception for the same occasion (e.g. restoring an "all patrols" removal must not undo a separate patrol-specific removal that happens to cover the same occasion). This check re-queries remaining exceptions after the delete, rather than assuming the two scopes are mutually exclusive.

## Alternatives Considered

- **A boolean/array field directly on `Menu`** (e.g. `excludedOccasions: MealOccasion[]`): simpler for a single existing menu, but can't represent "removed for a patrol that doesn't have a menu yet" — which the requirement explicitly needs ("set at assignment time... or later"). Would also need the exact same per-menu bookkeeping duplicated across every patrol for an "all patrols" removal, instead of one row.
- **A DB-level unique constraint on `(campoutId, occasion, patrol)`**: would be the natural way to prevent duplicate exception rows, but Postgres treats `NULL` as distinct from itself in a unique index, so it can't dedupe repeated "all patrols" (`patrol = NULL`) removals of the same occasion. Handled instead by having `removeOccasion` explicitly `deleteMany` any existing row for the exact same scope before creating the new one — an application-level upsert.

## Consequences

- Two rows can legitimately coexist for the same occasion — one scoped to "all patrols" and one scoped to a specific patrol — and the restore logic has to account for that overlap explicitly rather than assuming scopes don't intersect. This is the one non-obvious piece of behavior introduced by this model; it's covered by the manual end-to-end verification for this iteration, not by a unit test (it depends on database state, not a pure function).
- Removing an occasion is destructive to any dishes/ingredients already entered under it, deleted the same manual-cascade way as Iteration 1's `removeDish` (ingredients, then dishes, then the meal — no `onDelete: Cascade` in the schema, consistent with the existing pattern rather than mixing cascade styles).
- `app/menus/[id]/page.tsx` needed no changes at all for this feature — it already treats "no `Meal` row for this occasion" as "don't render it," which is exactly what removal now produces.
