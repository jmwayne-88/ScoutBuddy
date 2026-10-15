# Requirement 12 — Menu Print Preview & Shopping List

Status: Not started — documentation only
Depends on: none directly, but reuses [Requirement 1 - Core Approval Loop](01-core-approval-loop.md)'s `Menu`/`Meal`/`Dish`/`Ingredient` data model as-is, and [Requirement 4 - Meal-Framework Variation](04-meal-framework-variation.md)'s occasion ordering (`MEAL_OCCASIONS`)

## Goal

A Patrol Leader needs a physical, take-to-the-campsite reference: what to cook, what it needs, and a way to check items off while shopping. Today's menu page (`/menus/[id]`) is an editing/review screen — forms, remove buttons, status chips — not something anyone would want to print and tape to a cooler lid. This requirement adds a dedicated, print-optimized view of one patrol's menu for one campout: a cooking reference (page 1) and a shopping list with handwrite-to-check boxes (page 2), viewable on-screen exactly as it will print before anyone actually prints it.

## Context: what already exists vs. what's new

Every field this needs already exists — `Campout.name`/`date`, `Patrol.name`, `Menu.allergyNote`/`nutritionNote`, and the full `Meal` → `Dish` → `Ingredient` tree, all already loaded together by the existing `/menus/[id]` page's own query. Nothing about the data model needs to change. What's new is entirely presentational: a second, print-tuned view of the same `Menu`, plus the CSS/layout work to make it paginate predictably at 8.5"×11".

**Two things in the request don't map onto anything that exists today, and need a decision before this gets built** — see "Decisions assumed" below: `Patrol` has no "mascot" concept (just `name`/`color`), and `Campout` stores a single `date`, not a date range.

## Requirements

- **REQ-12.1** A "Print preview" entry point appears on `/menus/[id]`, linking to a new, dedicated print view of that same menu.
- **REQ-12.2** The print view shows, on what will print as **page 1**: the campout name and date, the patrol's name (and color, consistent with how the patrol is identified everywhere else in the app), the menu's allergy note displayed prominently (not buried at the bottom the way today's edit page does), and every meal occasion that has dishes, in the same fixed order used everywhere else (`MEAL_OCCASIONS`), each listing its dishes by name.
- **REQ-12.3** The print view shows, on what will print as **page 2**: a shopping list covering every ingredient, across every dish, across every meal on this menu — each row showing the ingredient's name and quantity exactly as entered, grouped by the dish/meal it belongs to, with a printed checkbox-style box next to each row for handwriting a checkmark once purchased (not an interactive form control — this is read by a human holding a pen, not a browser).
- **REQ-12.4** The page is laid out for a standard 8.5"×11" sheet with 1-inch margins on all sides (`@page { size: letter; margin: 1in; }`), and the page break between page 1 and page 2 is explicit (the menu content and the shopping list never share a printed page).
- **REQ-12.5** The on-screen preview renders the same content with the same pagination the browser's print will actually produce — margins, page break, and overall proportions visible before anyone opens the print dialog — rather than a different-looking screen layout that only becomes "the real thing" once printed.
- **REQ-12.6** The print view carries no app chrome (header, navigation, role switcher) — on screen or on paper — so what's visible is only ever the menu content itself.
- **REQ-12.7** The print entry point and view are available to the Patrol Leader viewing their own patrol's menu and to the ASPL of Camping viewing any patrol's menu — the same two audiences who can already reach `/menus/[id]` today.
- **REQ-12.8** As content volume grows, page 1's dish list and page 2's shopping list shrink (smaller text, tighter spacing) to keep fitting within 2 pages — but never below **8pt** text. A menu whose content still doesn't fit at 8pt overflows onto a third (or further) page rather than shrinking past that floor. Confirmed: legibility has a hard lower bound; the page count doesn't.

## Decisions assumed (flag if these aren't what you want)

- **"Mascot" means the patrol's existing `name`** (e.g. "Eagle Patrol" — the mascot is already in the name), not a separate icon/image. `Patrol` has no mascot/icon field today, and adding one would be new schema + new admin UI in Manage Patrols (Requirement 8) — a separate, bigger decision. If you actually want a distinct visual mascot (an icon or small image per patrol), say so; this requirement as scoped doesn't add that.
- **"Campout dates" means the single `Campout.date` field already shown everywhere else in the app** — not a computed Friday–Sunday range inferred from the meal framework's occasions. `Campout` only stores one date today; a real date range would need a new `endDate` field (or similar), which is out of scope here unless you want it folded in.
- **Page 1 shows dish names only, not full ingredient lists** — ingredient-level detail (with quantities and checkboxes) lives entirely on page 2's shopping list, not duplicated under each dish on page 1 too. This is what makes "the full menu fits on page 1" realistic for a menu with several dishes per occasion. If you want full ingredient breakdowns under each dish on page 1 *in addition to* the shopping list, say so — that makes REQ-12.8's 2-page target harder to hold to.
- **No new view-permission gate.** `/menus/[id]` has no access restriction today — anyone who reaches the URL can view it, role gating only controls which *actions* (edit, submit, approve) are available. The print view follows the same existing pattern rather than introducing the app's first "who can view this" check. If you want printing specifically restricted to just the owning Patrol Leader and the ASPL (tighter than viewing the menu itself already is), that's new access-control logic, not something already established elsewhere to extend.
- **The menu's status and approval history don't appear on the print view.** They're relevant to the approval workflow, not to someone standing at a camp stove; omitted to keep page 1 focused. The nutrition/MyPlate note *is* included alongside the allergy note (same kind of existing data, shown together) unless you'd rather leave it off.

## Acceptance Criteria

- [ ] `/menus/[id]` has a working "Print preview" link/button, visible to anyone who can already view that menu.
- [ ] The print view's on-screen rendering visibly shows two distinct 8.5"×11"-proportioned pages with 1-inch margins and a clear break between them — not a single continuous scroll that only becomes paginated once actually printed.
- [ ] Page 1 shows the campout name and date, the patrol's name, the allergy note (prominently), and every occasion with dishes in the correct fixed order, each listing its dishes.
- [ ] Page 2 shows every ingredient from every dish on the menu, each with its quantity and a printable checkbox, grouped by dish/meal.
- [ ] Using the browser's actual print function (or print-to-PDF) on this view produces output matching the on-screen preview: two pages, 1-inch margins, no app header/nav visible anywhere.
- [ ] A menu with zero dishes, and a menu with an unusually large number of dishes/ingredients, both render sensibly (empty state handled gracefully; a large menu shrinks toward fitting 2 pages rather than silently truncating data).
- [ ] Shrinking stops at 8pt text — a menu large enough to still overflow at 8pt spills onto a third page at 8pt rather than continuing to shrink past it.

## Out of Scope for This Requirement

- Any change to `/menus/[id]` itself beyond adding the print entry point — this is a new, separate view, not a redesign of the existing editing/review page.
- A distinct per-patrol mascot icon/image (see Decisions Assumed) — the patrol's existing name/color stand in for this.
- A real campout date *range* (start/end dates) — the single existing `Campout.date` is used as-is.
- Printing anything other than one patrol's one menu at a time (e.g., a combined print of every patrol's menu for a campout) — one Patrol Leader, one campout, one print view, matching how the rest of the app scopes a `Menu`.
- PDF generation via a server-side library (e.g. a headless-browser or PDF-rendering service) — this uses the browser's own native print/print-to-PDF, consistent with this being a Vercel-hosted app with no background job infrastructure (ADR 0001/0002).

## Related

- [Requirement 1 - Core Approval Loop](01-core-approval-loop.md) — the `Menu`/`Meal`/`Dish`/`Ingredient` model this prints, unchanged.
- [Requirement 4 - Meal-Framework Variation](04-meal-framework-variation.md) — `MEAL_OCCASIONS`'s fixed ordering, reused for both pages.
- [Requirement 8 - Manage Patrols](08-manage-patrols.md) — where a future "patrol mascot" field would need to be added and administered, if that's ever wanted beyond this requirement's scope.
- Expected to need its own ADR when built — this introduces the app's first print-specific layout strategy (likely a chrome-free route group, `@page`/`@media print` rules, and a deliberate on-screen-matches-print pagination approach), a real new architectural pattern per CLAUDE.md's "every architecture decision gets its own ADR" rule, not a straightforward extension of an existing one.
