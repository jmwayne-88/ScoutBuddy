# Requirement 8 — Manage Patrols

Status: Not started — documentation only, per instruction
Depends on: Requirements 1-7 (patrols are currently referenced everywhere via a fixed Prisma enum); this requirement replaces that foundation rather than building on top of it

## Goal

Let an admin (see Open Decision 1) view, create, edit, delete, and enable/disable the patrols used throughout the app — instead of patrols being a fixed set baked into the code — with control over display order, name, color, and whether a patrol is a youth or adult patrol. Reachable via a new nav link.

## Why this is bigger than it looks

Patrols are currently a Prisma **enum** (`EAGLE | PUMA | RAVEN | SILVER_FOX | JOE`), not a database table — a "fixed reference data" decision stated explicitly in CLAUDE.md and FEATURES.md since Iteration 1. An enum value can't be created, renamed, reordered, or deleted at runtime — only by editing the schema and shipping a migration. Making patrols admin-manageable means **replacing the enum with a real `Patrol` table** (id, name, color, order, type, active flag), which several other parts of the app depend on directly today:

- `Menu.patrol` and `MealFrameworkException.patrol` are typed columns against the enum — both need to become foreign keys to the new table, with existing rows migrated across, not dropped.
- A Patrol Leader's identity (`lib/session.ts`'s `Actor` type, the session cookie, every permission check in `lib/permissions.ts`) currently stores and compares a fixed enum value. It needs to store a patrol ID instead.
- `lib/constants.ts`'s `PATROLS` array, `lib/colors.ts`'s static color map, and `lib/progress.ts`'s `PATROL_COUNT` are all compile-time constants today. They become database queries and a runtime count.
- Every page that lists or assigns patrols (role picker, header role switcher, campout detail grid, menu assignment) currently iterates the static `PATROLS` array — each needs to query the table instead, respecting order and active status.

None of that makes the feature a bad idea — it's exactly what "admin-managed patrols" has to mean — but it's a foundational change touching the app's identity/permission system, not an additive page bolted on the side. Worth seeing written out before committing to build it.

## Requirements

### Data model
- **REQ-8.1** Patrols are stored in a database table with: id, name, color (hex), display order, type (Youth or Adult), and an active/inactive flag.
- **REQ-8.2** Existing menus and meal-framework exceptions are migrated to reference the new table by ID, with no data loss — the five patrols that exist today (Eagle, Puma, Raven, Silver Fox, Joe) carry over with their current names, colors, and order preserved.

### Viewing and managing patrols
- **REQ-8.3** A "Manage Patrols" page lists every patrol, including inactive ones (so they can be reactivated), showing name, color, type, order, and active status.
- **REQ-8.4** The admin can create a new patrol: name, color, order, and type (Youth/Adult).
- **REQ-8.5** The admin can edit an existing patrol's name, color, order, and type.
- **REQ-8.6** The admin can mark a patrol inactive (hides it, see REQ-8.12) or reactivate it.
- **REQ-8.7** The admin can delete a patrol outright (see REQ-8.10-8.11 for what this requires).
- **REQ-8.8** A nav link to the Manage Patrols page is visible wherever the admin would expect to find it (e.g., the header), and only to the admin.

### Ordering
- **REQ-8.9** The admin-specified order is used consistently everywhere patrols are listed: the "Viewing as" dropdown, the role picker, and every campout's patrol grid — one order, defined once, not independently sorted per screen.

### Creating a patrol — campout assignment prompt
- **REQ-8.10** After creating a new patrol, the admin is asked whether to assign it to campouts. If yes, a menu (Not Started, all currently-active standard occasions for each campout) is created for every campout whose date is in the future relative to today — campouts that have already happened are left alone. If no, the patrol exists with no menus until assigned manually later, the same way any patrol's menu is assigned today.

### Deleting a patrol
- **REQ-8.11** Deleting a patrol removes it from every place patrols are listed or selected — the "Viewing as" dropdown, the role picker, campout assignment grids, and the Manage Patrols list itself.
- **REQ-8.12** See Open Decision 2: deleting a patrol that already has menus needs a defined behavior (block the delete, or cascade-delete its menus too) — not specified by the request as given.

### Inactive patrols
- **REQ-8.13** An inactive patrol is hidden from selection contexts: the "Viewing as" dropdown, the role picker, and the "assign a menu to this patrol" prompt on a campout that doesn't have one yet for that patrol.
- **REQ-8.14** See Open Decision 3: whether an inactive patrol's *existing* menus (on campouts already assigned before it was deactivated) stay visible on those campout pages, or disappear too.

## Open decisions (need an answer before this is built)

1. **Who is "admin"?** The request says "admin user," but ScoutBuddy only has two roles today: ASPL of Camping and Patrol Leader. This doc assumes **admin = ASPL of Camping** (the role that already creates campouts and manages the meal framework) rather than introducing a third role. Say so if you actually want a separate Admin role distinct from ASPL of Camping — that's a meaningfully bigger addition (a new identity concept, not just a new page).
2. **Deleting a patrol with existing menus.** Recommended default: **block the delete** (with a clear message) if the patrol has any menus at all, and point the admin at "mark inactive" instead — menus carry real troop history (dishes, approvals, review comments) that a hard delete would destroy. A patrol with zero menus (e.g., created by mistake) can be deleted freely. Confirm this is what you want, or say what should happen instead.
3. **Does hiding an inactive patrol include its existing menus?** Recommended default: **no** — a campout that already has a menu for a patrol keeps showing it even after that patrol is deactivated (perhaps with a small "inactive" label), since that menu is real history. Only *new* selection (role picker, assigning a fresh menu) is blocked for inactive patrols. Confirm, or say you want existing menus hidden too.
4. **What does Youth vs. Adult actually change?** The request asks to store and manage this distinction but doesn't say it should change any behavior yet. This doc assumes it's **just a stored/displayed attribute** for now, with no behavior difference (e.g., adult patrols still go through the same menu/approval flow). If you have something specific in mind for how adult patrols should behave differently, that's its own follow-up requirement.
5. **Due date for auto-created menus (REQ-8.10).** Assigning a new patrol to every future campout at once needs a due date for each menu, and there currently isn't any way to edit a menu's due date after it's created — a gap that exists already, independent of this feature. Recommended default: default the due date to the campout's own date. Worth confirming, and worth knowing that changing it later also depends on an "edit due date" capability that doesn't exist yet.

## Acceptance Criteria

- [ ] A new patrol created through Manage Patrols appears, in the chosen order, in the role picker, the header dropdown, and every campout's patrol grid (unless marked inactive).
- [ ] Reordering patrols changes the order consistently everywhere they're listed, from one place — no two screens disagreeing.
- [ ] Creating a patrol and answering "yes" to the campout-assignment prompt creates a Not Started menu on every future campout and none on any past campout.
- [ ] Marking a patrol inactive removes it from the role picker and header dropdown immediately, without deleting any of its data.
- [ ] Deleting a patrol with no menus removes it everywhere, including already-open dropdowns after a refresh.
- [ ] Attempting to delete a patrol that has menus is blocked with a clear explanation (pending confirmation of Open Decision 2).
- [ ] A Patrol Leader whose patrol was deleted mid-session is handled gracefully (doesn't crash, points them back to the role picker) rather than erroring.
- [ ] All five existing patrols are present, correctly colored, and in their current order immediately after the migration — nothing about today's app regresses.

## Out of Scope for This Requirement

- Any behavioral difference between Youth and Adult patrols beyond storing/showing the distinction (see Open Decision 4).
- Drag-and-drop reordering UI — a plain numeric order field (or up/down controls) satisfies the requirement; fancier reordering UI can come later if wanted.
- Editing a menu's due date after assignment — a pre-existing gap this requirement bumps into (Open Decision 5) but doesn't have to solve.
- A distinct Admin role separate from ASPL of Camping (see Open Decision 1) — unless told otherwise.

## Related

- This will need its own ADR when built — replacing the "patrols as a fixed enum" assumption that's held since Iteration 1 is exactly the kind of real architecture change CLAUDE.md's working conventions ask to be documented, not just coded.
- [Requirement 2 - All Four Patrols + Visual Identity](02-four-patrols-and-visual-identity.md) — the original "fixed four" decision this requirement replaces (the Joe Patrol addition already showed the pattern of hand-editing the enum; this requirement is what makes that no longer necessary).
- `lib/constants.ts`, `lib/colors.ts`, `lib/progress.ts`, `lib/session.ts`, `lib/permissions.ts` — every one of these has a static, compile-time assumption about patrols that this requirement removes.
