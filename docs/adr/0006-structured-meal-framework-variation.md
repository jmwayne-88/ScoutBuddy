# 0006. Meal-framework variation as structured occasion removal

Date: 2026-09-14
Status: Accepted

## Context

The standard meal framework defines six fixed eating occasions per campout (Friday Cracker Barrel, Saturday Breakfast, Saturday Lunch, Saturday Dinner, Saturday Cracker Barrel, Sunday Breakfast). The brief calls for the ASPL of Camping to be able to vary this framework per campout. The variation could have been modeled as unstructured free text attached to a menu, or as structured data the app understands.

## Decision

Model meal-framework variation as the ASPL removing one or more of the six standard occasions from a campout's menus. Removal can be scoped to a single named patrol or applied to all patrols on that campout. Only removal is supported in this scope — the ASPL cannot add non-standard occasions, and the Patrol Leader has no control over which occasions are active.

A removed occasion does not appear in the affected menu at all: no meal record, nothing for the Patrol Leader to fill in.

## Alternatives Considered

- **Free-text variation note per menu or per occasion**: simpler to build initially, but leaves the app unable to reason about which occasions are actually active — every future feature that touches occasions (a shopping list rollup, validation, reporting) would need to parse or ignore that text.

## Consequences

- Each menu has a derivable, closed set of "active occasions" rather than a parsed or inferred one, which keeps future logic (e.g. shopping list rollup) reliable.
- If the troop later wants genuinely non-standard meals (not just removing a standard one), that requires new schema and product decisions, not just relaxed validation on existing fields.
