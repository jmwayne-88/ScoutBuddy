# Requirement 18 — Patrol Icon/Avatar Identity

Status: Done
Depends on: none tied to a single ROADMAP iteration; extends the existing patrol color system ([Requirement 2](02-four-patrols-and-visual-identity.md), [ADR 0018](../adr/0018-patrols-as-database-rows.md))

## Goal

Give each patrol a small original icon or avatar shape alongside its existing color identity, so a patrol reads as more than a colored rectangle everywhere it appears — the badge, the campout patrol cards, the home role picker, the print view — while staying strictly within CLAUDE.md's rule against recreating any Scouting America logo, the fleur-de-lis, or other protected program marks.

## Source

Recommendation #9 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

Every place a patrol appears today — `components/PatrolBadge.tsx`, the patrol-color header band on each campout patrol card (`app/(app)/campouts/[id]/page.tsx`), the small color swatch on `/patrols` (`app/(app)/patrols/page.tsx`), the home role picker — uses only a flat background color (`patrol.color`) with computed contrast text (`lib/colors.ts`'s `contrastText`). Patrols are a beloved, central identity concept in a real troop (Eagle, Puma, Raven, Silver Fox, Joe, and whatever else an ASPL adds per [ADR 0018](../adr/0018-patrols-as-database-rows.md) now that patrols are admin-managed rows, not a fixed five), and a color chip alone under-serves that.

## Requirements

- **REQ-18.1** The `Patrol` model gains an optional icon identifier (e.g. a nullable `icon` column naming one of a fixed, bundled icon set — not a free-text upload field) — a real data-model change, so this requirement's implementation must be accompanied by its own ADR per CLAUDE.md's "every architecture decision gets its own ADR" rule.
- **REQ-18.2** A fixed set of original, troop-neutral icon choices ships with the app; the ASPL picks one per patrol from this fixed set when creating or editing a patrol on `/patrols/[id]` and `/patrols/new`, the same way `components/PatrolColorField.tsx` already offers a constrained color picker rather than a free-text hex-only field. Icons are commissioned or drawn as new art (or sourced from a permissively-licensed general-purpose icon set, e.g. Lucide/Material Symbols — not traced or adapted from any emblem), never a scan or trace of any real Scouting America emblem, the BSA fleur-de-lis, or another organization's protected mark.

  Because patrols are admin-managed rows an ASPL can name anything (per [ADR 0018](../adr/0018-patrols-as-database-rows.md)), the set must be considerably broader than just the five current default patrols' own namesakes. Ship a comprehensive, categorized library up front rather than growing it piecemeal later:
  - **Animals — land**: fox, wolf, bear, deer, elk/moose, bison, beaver, otter, raccoon, badger, bobcat/lynx, mountain lion/puma, rabbit, squirrel, skunk, porcupine, armadillo, coyote, ram/bighorn sheep, goat, horse, dog, turtle/tortoise.
  - **Animals — birds**: eagle, hawk, owl, raven/crow, falcon, osprey, heron, duck, goose, cardinal, woodpecker, turkey.
  - **Animals — water/other**: fish/trout, frog, snake, lizard, bee, butterfly, spider, dragonfly, ant.
  - **Outdoors & nature**: tree/pine, mountain, sun, moon/stars, lightning bolt, cloud, water drop/wave, leaf, flame/campfire, rock/boulder, river, trail.
  - **Camping & Scoutcraft gear**: tent, backpack, compass, map, canoe/kayak, rope/knot, lantern, axe/hatchet, knife, binoculars, first-aid cross, cooking pot, water bottle.
  - **Neutral fallback shapes** (for a patrol name with no obvious match, e.g. "Joe Patrol"): star, shield, arrow, banner/pennant, mountain peak, compass rose — generic enough to pair with any name without implying a specific animal or theme.

  This list is a floor, not a ceiling — additional icons within these same categories (or a new category that stays troop-neutral and trademark-safe) may be added at implementation time; the goal is broad enough coverage that most patrol names an ASPL invents land a reasonable match, not just coverage for Eagle, Puma, Raven, Silver Fox, and Joe.
- **REQ-18.3** A patrol with no icon selected (every existing patrol, immediately after this requirement ships, and any patrol an ASPL chooses not to customize) falls back cleanly to today's plain color treatment — this requirement must not force every existing patrol to suddenly look broken or incomplete.
- **REQ-18.4** Everywhere `components/PatrolBadge.tsx` is used, the icon (when set) renders inside the badge alongside the patrol name, with `patrol.color` still driving the background and `contrastText(patrol.color)` still driving both the text and icon's foreground color — this requirement is additive to the existing badge, not a redesign of it.
- **REQ-18.5** The campout patrol card's color header band (`app/(app)/campouts/[id]/page.tsx`) and the `/patrols` list's color swatch both gain the same icon-when-set treatment, consistent with REQ-18.4.
- **REQ-18.6** The print view (`app/(print)/menus/[id]/print/page.tsx`) is unaffected by this requirement — it already deliberately avoids decorative color/branding risk for a printed, black-and-white-friendly cooking reference, and a patrol icon would not reliably render well at print DPI without separate validation; icons stay screen-only unless a later requirement explicitly extends them to print.
- **REQ-18.7** No icon in the fixed set may be, resemble, or be derived from any official Scouting America logo, the fleur-de-lis, or another program's protected emblem — the same constraint [ADR 0015](../adr/0015-brand-aligned-visual-design.md) already established for the rest of the app's visual identity, carried forward explicitly to this new icon set.
- **REQ-18.8** Every icon in the fixed set is defined once, in a single shared module (e.g. `lib/patrolIcons.ts`), as an id, its rendered glyph, and a short list of matching keywords (e.g. the fox icon's keywords include `"fox"`; the eagle icon's include `"eagle"`). Both the icon-picker UI (REQ-18.2) and the name-matching suggestion (REQ-18.9) read from this one table, so there is a single source of truth for "what icons exist and what they're called" rather than the picker and the suggester drifting out of sync.
- **REQ-18.9** When an ASPL is creating or editing a patrol on `/patrols/new` or `/patrols/[id]`, the icon picker suggests a best-effort match based on the patrol's name as currently typed, by case-insensitive matching the name's words against each icon's keyword list from REQ-18.8 (e.g. typing "Wolf Patrol" or "Timber Wolves" highlights/pre-selects the wolf icon; "Silver Fox Patrol" matches on "fox"). This is a convenience default, not a silent auto-assignment:
  - The suggested icon is shown pre-selected/highlighted in the same picker grid REQ-18.2 already renders — never saved or applied without the picker being visible and the ASPL able to change it before submitting.
  - The ASPL can freely pick any other icon from the full set, or clear the selection back to "no icon," overriding the suggestion at any time.
  - A name with no keyword match (e.g. "Joe Patrol," or any troop-specific name that isn't in the library) leaves the picker with nothing pre-selected, falling back to REQ-18.3's existing unset default rather than guessing.
  - Matching is a plain local keyword lookup against REQ-18.8's table — no fuzzy/AI matching and no network call — so suggestions are instant and fully deterministic as the ASPL types.
  - Editing an existing patrol's name does not retroactively change an icon the ASPL already explicitly chose; the suggestion only applies to the picker's current (possibly still-unset) selection, the same way changing a form field never overwrites another field the user already filled in.

## Acceptance Criteria

- [x] An ASPL can assign one icon from the fixed set to a patrol, or leave it unset.
- [x] A patrol with an icon shows it (plus its existing color) in the badge, the campout patrol card, and the `/patrols` list.
- [x] A patrol with no icon set renders exactly as it does today — no broken image, no placeholder gap.
- [x] No icon in the shipped set is a reproduction of, or recognizably derived from, a Scouting America logo, the fleur-de-lis, or any other organization's protected mark.
- [x] The print view is visually unchanged by this requirement.
- [x] A new ADR documents the data-model and icon-sourcing decisions made while implementing this requirement.
- [x] The bundled icon set spans considerably more than the five current default patrols' own namesakes (see REQ-18.2's categorized list), so a newly created patrol with an arbitrary name has a reasonable chance of a relevant match.
- [x] Typing a patrol name with an obvious keyword match (e.g. "Wolf Patrol") pre-selects/highlights a matching icon in the picker before the ASPL saves.
- [x] The ASPL can override a suggested icon with any other icon from the full set, or clear it back to unset, before saving.
- [x] A patrol name with no keyword match (e.g. "Joe Patrol") leaves the picker with nothing pre-selected — same unset default as REQ-18.3, not a random guess.

## Out of Scope for This Requirement

- Free-text/uploaded custom patrol artwork — the icon set is fixed and bundled, not user-uploaded, to keep the trademark-safety guarantee enforceable rather than dependent on every future ASPL's judgment.
- Any change to the print view's visual treatment.
- The home role picker's own layout — see [Requirement 17](17-avatar-card-role-picker.md), which should consume this requirement's icons once both exist, but is a separate piece of work.
- Fuzzy, typo-tolerant, or AI/LLM-based name matching — REQ-18.9's suggestion is a plain local keyword lookup; a name that doesn't contain one of an icon's keywords simply gets no suggestion, rather than the app guessing at user intent.
- Auto-assigning or auto-saving a suggested icon without the ASPL explicitly confirming it via the normal picker-and-save flow.

## Related

- [Requirement 2 - Four Patrols + Visual Identity](02-four-patrols-and-visual-identity.md) — the original color-only identity system this requirement extends.
- [ADR 0015 - Brand-aligned visual design, no trademarks](../adr/0015-brand-aligned-visual-design.md) — the trademark-safety constraint REQ-18.7 carries forward.
- [ADR 0018 - Patrols as database rows](../adr/0018-patrols-as-database-rows.md) — patrols are admin-managed data now, which is why this requirement's icon set must be ASPL-selectable per patrol rather than hardcoded to the original five names.
- [Requirement 17 - Avatar/Card Home Role Picker](17-avatar-card-role-picker.md) — the clearest consumer of this requirement's icons once both exist.
