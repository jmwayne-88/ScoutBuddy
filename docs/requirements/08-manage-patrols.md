# Requirement 8 — Manage Patrols

Status: Not started — documentation only, per instruction
Depends on: Requirements 1-7 (patrols are currently referenced everywhere via a fixed Prisma enum); this requirement replaces that foundation rather than building on top of it. Also affected by [Requirement 9](09-adopt-mui-design-system.md) — see "Impact from Requirement 9" below.

## Goal

Let the ASPL of Camping view, create, edit, delete, and enable/disable the patrols used throughout the app — instead of patrols being a fixed set baked into the code — with control over display order, name, color, and whether a patrol is a youth or adult patrol. Reachable via a new nav link.

## Why this is bigger than it looks

Patrols are currently a Prisma **enum** (`EAGLE | PUMA | RAVEN | SILVER_FOX | JOE`), not a database table — a "fixed reference data" decision stated explicitly in CLAUDE.md and FEATURES.md since Iteration 1. An enum value can't be created, renamed, reordered, or deleted at runtime — only by editing the schema and shipping a migration. Making patrols admin-manageable means **replacing the enum with a real `Patrol` table** (id, name, color, order, type, active flag), which several other parts of the app depend on directly today:

- `Menu.patrol` and `MealFrameworkException.patrol` are typed columns against the enum — both need to become foreign keys to the new table, with existing rows migrated across, not dropped.
- A Patrol Leader's identity (`lib/session.ts`'s `Actor` type, the session cookie, every permission check in `lib/permissions.ts`) currently stores and compares a fixed enum value. It needs to store a patrol ID instead.
- `lib/constants.ts`'s `PATROLS` array, `lib/colors.ts`'s static color map, and `lib/progress.ts`'s `PATROL_COUNT` are all compile-time constants today. They become database queries and a runtime count.
- Every page that lists or assigns patrols (role picker, header role switcher, campout detail grid, menu assignment) currently iterates the static `PATROLS` array — each needs to query the table instead, respecting order and active status.

None of that makes the feature a bad idea — it's exactly what "admin-managed patrols" has to mean — but it's a foundational change touching the app's identity/permission system, not an additive page bolted on the side.

## Impact from Requirement 9 (MUI adoption)

Requirement 9's doc says "documentation only, do not build yet," but as of this revision the working tree already has it substantially built (uncommitted): MUI is in, Tailwind (`app/globals.css`, `postcss.config.mjs`, the `tailwindcss` dependency) is fully removed, and a real `lib/theme/` module exists — `tokens.ts` (the Scouting America brand hex values), `palette.ts` (MUI light/dark palette mapping), `theme.ts`, and a genuine WCAG contrast utility (`contrast.ts`'s `contrastRatio`/`meetsContrast`, backed by an automated `contrast.test.ts`). A light/dark mode toggle now exists too (`components/ColorModeToggle.tsx`), which didn't factor into this requirement's original drafting at all. That status mismatch is worth your attention on its own, separate from what follows — but regardless of where Requirement 9's own status line ends up, this is the real foundation Requirement 8 will be built on, so the requirements below are written against it.

What that changes for this requirement, concretely:

- **Build the Manage Patrols UI in MUI**, matching the rest of the app (`Paper`/`Stack`/`TextField`/`Button`/`Chip`, the same patterns already used on the campout pages). The delete confirmation (Decision 2) is a natural fit for MUI's `Dialog`.
- **Patrol colors stay outside `lib/theme/tokens.ts`.** That file's own comment already states this boundary explicitly — it's the Scouting America brand palette, not troop-specific patrol identity. Nothing in this requirement should try to register admin-entered patrol colors as theme tokens; they're per-row data, fundamentally different from the fixed brand palette.
- **The simple contrast heuristic in `lib/colors.ts` (`contrastText`) isn't rigorous enough for colors an admin can pick freely.** It was good enough for five hand-picked, eyeballed patrol colors, but Requirement 9's own contrast test caught it failing actual WCAG 4.5:1 for two of the five fixed status colors, which had to be manually corrected (`STATUS_COLORS` in `lib/progress.ts` now hand-overrides text color per status rather than trusting the heuristic). An admin choosing an arbitrary patrol color through Manage Patrols can hit the same failure — see REQ-8.17.
- **Dark mode now exists and needs to work here too.** Whatever Manage Patrols builds (forms, the patrol list, color previews) needs to render correctly in both color schemes, not just light — see REQ-8.18.
- **No AppBar nav-link infrastructure exists yet.** The current `AppBar` (`app/layout.tsx`) only has the title, the role switcher, and the color-mode toggle — no nav links, no mobile Drawer, despite Requirement 9's own REQ-9.18 calling for one. Requirement 8's nav link is likely the first thing that actually needs that infrastructure built, not just a link dropped into an existing nav — see the revised REQ-8.8.

## Decisions (confirmed)

1. **Admin = ASPL of Camping.** No separate Admin role. Patrol management is gated the same way campout creation and meal-framework management already are.
2. **Deleting a patrol deletes its history, behind a strong warning.** A hard delete removes the patrol and cascades through everything tied to it: its menus, and each menu's meals, dishes, ingredients, and reviews. Before it happens, the admin sees an explicit, hard-to-misclick confirmation that states what will be destroyed (at minimum: how many menus, and whether any are Approved) and cannot be dismissed accidentally — a plain "Delete" button next to a list of other controls is not enough; require a distinct confirmation step (e.g., a confirmation dialog naming the patrol and the counts, with its own explicit "Yes, delete" action).
3. **Inactive patrols are excluded from new assignment; existing history stays visible.** Deactivating a patrol blocks it from the role picker, the "Viewing as" dropdown, and from being assigned to any *new* campout menu. Menus it already has on existing campouts keep showing, unaffected. **Reactivating** a patrol prompts the admin to choose which campouts to assign it to — a picker over campouts that don't already have a menu for this patrol (not limited to future-only the way initial creation is, since this is a deliberate per-campout choice rather than a blanket yes/no) — creating a Not Started menu for each one picked, using the same due-date default as REQ-8.10 (see REQ-8.16).
4. **Youth vs. Adult is label-only for now.** No behavioral difference anywhere in the app today. Explicitly expected to matter later — a future requirement, not this one.
5. **Due-date default: first Monday of the month before the campout.** Applies specifically to menus created in bulk, where there's no per-menu form to type a due date into (the new-patrol "assign to future campouts" prompt, and the reactivation campout picker) — see REQ-8.16 for the exact rule. General due-date editing after a menu is assigned remains unaddressed, as before; this only defines the default for these two bulk-creation flows.

## Open decision (new, from Requirement 9's impact)

6. **What happens when an admin picks a patrol color that can't pass WCAG contrast with either black or white text?** This couldn't happen with the old fixed five colors (all manually verified to work), but it's a real possibility now that color is a free-form admin input, and the rough heuristic in `lib/colors.ts` isn't a reliable guarantee (see above). Two reasonable options, needing a call before REQ-8.17 is built: **(a)** block saving the patrol and say why, or **(b)** allow it but show a visible warning in the Manage Patrols UI next to that patrol going forward. No default assumed here — this one actually needs an answer.

## Requirements

### Data model
- **REQ-8.1** Patrols are stored in a database table with: id, name, color (hex), display order, type (Youth or Adult), and an active/inactive flag.
- **REQ-8.2** Existing menus and meal-framework exceptions are migrated to reference the new table by ID, with no data loss — the five patrols that exist today (Eagle, Puma, Raven, Silver Fox, Joe) carry over with their current names, colors, and order preserved.

### Viewing and managing patrols
- **REQ-8.3** A "Manage Patrols" page lists every patrol, including inactive ones (so they can be reactivated), showing name, color, type, order, and active status.
- **REQ-8.4** The admin can create a new patrol: name, color, order, and type (Youth/Adult).
- **REQ-8.5** The admin can edit an existing patrol's name, color, order, and type.
- **REQ-8.6** The admin can mark a patrol inactive, or reactivate it (see REQ-8.15 for what reactivation triggers).
- **REQ-8.7** The admin can permanently delete a patrol (see REQ-8.12-8.13 for what this requires).
- **REQ-8.8** A nav link to the Manage Patrols page is visible only to the admin. The app's `AppBar` currently has no nav-link slot at all (just the title, role switcher, and color-mode toggle) — this requirement likely means adding real navigation to it for the first time: an inline link at `md`+ widths and a Drawer behind a hamburger icon at mobile widths, per Requirement 9's own (not-yet-built) AppBar spec, rather than squeezing one link into the existing `Toolbar` as a one-off.

### Ordering
- **REQ-8.9** The admin-specified order is used consistently everywhere patrols are listed: the "Viewing as" dropdown, the role picker, and every campout's patrol grid — one order, defined once, not independently sorted per screen.

### Creating a patrol — campout assignment prompt
- **REQ-8.10** After creating a new patrol, the admin is asked whether to assign it to campouts. If yes, a Not Started menu (all currently-active standard occasions for that campout, per its existing meal-framework exceptions) is created for every campout whose date is in the future relative to today, using the due-date default in REQ-8.16 — campouts that have already happened are left alone. If no, the patrol exists with no menus until assigned manually later, the same way any patrol's menu is assigned today.

### Deleting a patrol
- **REQ-8.11** Deleting a patrol removes it from every place patrols are listed or selected — the "Viewing as" dropdown, the role picker, campout assignment grids, and the Manage Patrols list itself.
- **REQ-8.12** Deleting a patrol permanently deletes its menus and everything under them (meals, dishes, ingredients, reviews) and any meal-framework exceptions scoped to it — real data loss, not a soft hide.
- **REQ-8.13** Before that happens, the admin must pass an explicit, clearly-worded confirmation step stating what will be destroyed (menu count, and whether any are Approved) — a single ambient "Delete" click is not sufficient.
- **REQ-8.14** A Patrol Leader whose patrol is deleted while they're actively using the app (mid-session) doesn't hit a crash or a dead end — they're routed back to the role picker, where that patrol no longer appears.

### Inactive and reactivated patrols
- **REQ-8.15** Reactivating a previously-inactive patrol prompts the admin to pick which campouts (from those that don't already have a menu for it) to assign it to. For each one picked, a Not Started menu is created using the due-date default in REQ-8.16. Not limited to future-only campouts, since the admin is choosing deliberately, per campout, rather than answering a single yes/no for "all upcoming."
- **REQ-8.16** Due-date default for REQ-8.10 and REQ-8.15's bulk-created menus: the first Monday of the calendar month immediately before the campout's own month (e.g., a campout on any date in November gets a due date on the first Monday of October).

### MUI / design-system integration (from Requirement 9's impact)
- **REQ-8.17** When the admin sets or changes a patrol's color, it's checked with the real WCAG contrast utility (`lib/theme/contrast.ts`'s `contrastRatio`/`meetsContrast`, 4.5:1 text threshold) against both black and white — not just `lib/colors.ts`'s rough luminance heuristic — and handled per Open Decision 6 once that's answered (blocked, or saved with a visible warning).
- **REQ-8.18** The Manage Patrols page, its create/edit forms, and any color preview work correctly in both light and dark color scheme (toggleable via `ColorModeToggle`) — patrol badges/previews stay legible in both, the same way every other page in the app now has to.
- **REQ-8.19** Patrol colors are never added to `lib/theme/tokens.ts` or the static MUI theme — they remain runtime, per-row data read from the database, consistent with that file's existing documented boundary between Scouting America's brand palette and troop-specific patrol identity.

## Acceptance Criteria

- [ ] A new patrol created through Manage Patrols appears, in the chosen order, in the role picker, the header dropdown, and every campout's patrol grid (unless marked inactive).
- [ ] Reordering patrols changes the order consistently everywhere they're listed, from one place — no two screens disagreeing.
- [ ] Creating a patrol and answering "yes" to the campout-assignment prompt creates a Not Started menu, due on the first Monday of the prior month, on every future campout and none on any past campout.
- [ ] Marking a patrol inactive removes it from the role picker and header dropdown immediately, and from the "assign a new menu" picker on any campout, without deleting any of its existing data or hiding its existing menus.
- [ ] Reactivating a patrol presents a campout picker (excluding campouts that already have a menu for it) and creates correctly-due-dated Not Started menus for exactly the ones chosen.
- [ ] Deleting a patrol requires an explicit confirmation step naming what will be destroyed, and cannot be triggered by a single accidental click.
- [ ] After confirming, the patrol and all of its menus, meals, dishes, ingredients, reviews, and meal-framework exceptions are gone — and the patrol itself is gone from every dropdown and grid, including ones already open in another tab after a refresh.
- [ ] A Patrol Leader whose patrol was deleted mid-session is routed back to the role picker rather than erroring.
- [ ] All five existing patrols are present, correctly colored, and in their current order immediately after the migration — nothing about today's app regresses.
- [ ] Picking a patrol color that fails WCAG 4.5:1 against both black and white is caught and handled per Open Decision 6 — not silently saved with illegible badge text.
- [ ] The Manage Patrols page and its forms are legible and usable with the color-mode toggle switched to dark.
- [ ] The "Manage Patrols" nav link is reachable at both mobile and desktop widths, visible only to the admin.

## Out of Scope for This Requirement

- Any behavioral difference between Youth and Adult patrols beyond storing/showing the distinction — confirmed label-only for now, expected to matter in a future requirement.
- Drag-and-drop reordering UI — a plain numeric order field (or up/down controls) satisfies the requirement; fancier reordering UI can come later if wanted.
- General due-date editing after a menu is assigned — still unaddressed, independent of the specific default this requirement defines for its own two bulk-creation flows (REQ-8.16).
- A distinct Admin role separate from ASPL of Camping — confirmed not needed.

## Related

- This will need its own ADR when built — replacing the "patrols as a fixed enum" assumption that's held since Iteration 1 is exactly the kind of real architecture change CLAUDE.md's working conventions ask to be documented, not just coded.
- [Requirement 2 - All Four Patrols + Visual Identity](02-four-patrols-and-visual-identity.md) — the original "fixed four" decision this requirement replaces (the Joe Patrol addition already showed the pattern of hand-editing the enum; this requirement is what makes that no longer necessary).
- [Requirement 9 - Adopt MUI with the Scouting America Brand Palette](09-adopt-mui-design-system.md) — see "Impact from Requirement 9" above; this requirement's UI is built on whatever Requirement 9 actually leaves in place (MUI components, `lib/theme/`, dark mode, the still-missing AppBar nav).
- `lib/constants.ts`, `lib/colors.ts`, `lib/progress.ts`, `lib/session.ts`, `lib/permissions.ts` — every one of these has a static, compile-time assumption about patrols that this requirement removes.
- `lib/theme/tokens.ts`, `lib/theme/contrast.ts` — the brand-token boundary this requirement respects (REQ-8.19) and the contrast utility it reuses (REQ-8.17).
