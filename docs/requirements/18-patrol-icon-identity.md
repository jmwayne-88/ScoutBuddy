# Requirement 18 — Patrol Icon/Avatar Identity

Status: Not started
Depends on: none tied to a single ROADMAP iteration; extends the existing patrol color system ([Requirement 2](02-four-patrols-and-visual-identity.md), [ADR 0018](../adr/0018-patrols-as-database-rows.md))

## Goal

Give each patrol a small original icon or avatar shape alongside its existing color identity, so a patrol reads as more than a colored rectangle everywhere it appears — the badge, the campout patrol cards, the home role picker, the print view — while staying strictly within CLAUDE.md's rule against recreating any Scouting America logo, the fleur-de-lis, or other protected program marks.

## Source

Recommendation #9 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

Every place a patrol appears today — `components/PatrolBadge.tsx`, the patrol-color header band on each campout patrol card (`app/(app)/campouts/[id]/page.tsx`), the small color swatch on `/patrols` (`app/(app)/patrols/page.tsx`), the home role picker — uses only a flat background color (`patrol.color`) with computed contrast text (`lib/colors.ts`'s `contrastText`). Patrols are a beloved, central identity concept in a real troop (Eagle, Puma, Raven, Silver Fox, Joe, and whatever else an ASPL adds per [ADR 0018](../adr/0018-patrols-as-database-rows.md) now that patrols are admin-managed rows, not a fixed five), and a color chip alone under-serves that.

## Requirements

- **REQ-18.1** The `Patrol` model gains an optional icon identifier (e.g. a nullable `icon` column naming one of a fixed, bundled icon set — not a free-text upload field) — a real data-model change, so this requirement's implementation must be accompanied by its own ADR per CLAUDE.md's "every architecture decision gets its own ADR" rule.
- **REQ-18.2** A fixed set of original, troop-neutral icon choices (e.g. simple animal/outdoors glyphs matching each default patrol's own namesake — an eagle-ish mark for Eagle Patrol, a paw for Puma, a bird for Raven, a fox for Silver Fox — commissioned or drawn as new art, never a scan or trace of any real Scouting America emblem, the BSA fleur-de-lis, or another organization's protected mark) ships with the app; the ASPL picks one per patrol from this fixed set when creating or editing a patrol on `/patrols/[id]` and `/patrols/new`, the same way `components/PatrolColorField.tsx` already offers a constrained color picker rather than a free-text hex-only field.
- **REQ-18.3** A patrol with no icon selected (every existing patrol, immediately after this requirement ships, and any patrol an ASPL chooses not to customize) falls back cleanly to today's plain color treatment — this requirement must not force every existing patrol to suddenly look broken or incomplete.
- **REQ-18.4** Everywhere `components/PatrolBadge.tsx` is used, the icon (when set) renders inside the badge alongside the patrol name, with `patrol.color` still driving the background and `contrastText(patrol.color)` still driving both the text and icon's foreground color — this requirement is additive to the existing badge, not a redesign of it.
- **REQ-18.5** The campout patrol card's color header band (`app/(app)/campouts/[id]/page.tsx`) and the `/patrols` list's color swatch both gain the same icon-when-set treatment, consistent with REQ-18.4.
- **REQ-18.6** The print view (`app/(print)/menus/[id]/print/page.tsx`) is unaffected by this requirement — it already deliberately avoids decorative color/branding risk for a printed, black-and-white-friendly cooking reference, and a patrol icon would not reliably render well at print DPI without separate validation; icons stay screen-only unless a later requirement explicitly extends them to print.
- **REQ-18.7** No icon in the fixed set may be, resemble, or be derived from any official Scouting America logo, the fleur-de-lis, or another program's protected emblem — the same constraint [ADR 0015](../adr/0015-brand-aligned-visual-design.md) already established for the rest of the app's visual identity, carried forward explicitly to this new icon set.

## Acceptance Criteria

- [ ] An ASPL can assign one icon from the fixed set to a patrol, or leave it unset.
- [ ] A patrol with an icon shows it (plus its existing color) in the badge, the campout patrol card, and the `/patrols` list.
- [ ] A patrol with no icon set renders exactly as it does today — no broken image, no placeholder gap.
- [ ] No icon in the shipped set is a reproduction of, or recognizably derived from, a Scouting America logo, the fleur-de-lis, or any other organization's protected mark.
- [ ] The print view is visually unchanged by this requirement.
- [ ] A new ADR documents the data-model and icon-sourcing decisions made while implementing this requirement.

## Out of Scope for This Requirement

- Free-text/uploaded custom patrol artwork — the icon set is fixed and bundled, not user-uploaded, to keep the trademark-safety guarantee enforceable rather than dependent on every future ASPL's judgment.
- Any change to the print view's visual treatment.
- The home role picker's own layout — see [Requirement 17](17-avatar-card-role-picker.md), which should consume this requirement's icons once both exist, but is a separate piece of work.

## Related

- [Requirement 2 - Four Patrols + Visual Identity](02-four-patrols-and-visual-identity.md) — the original color-only identity system this requirement extends.
- [ADR 0015 - Brand-aligned visual design, no trademarks](../adr/0015-brand-aligned-visual-design.md) — the trademark-safety constraint REQ-18.7 carries forward.
- [ADR 0018 - Patrols as database rows](../adr/0018-patrols-as-database-rows.md) — patrols are admin-managed data now, which is why this requirement's icon set must be ASPL-selectable per patrol rather than hardcoded to the original five names.
- [Requirement 17 - Avatar/Card Home Role Picker](17-avatar-card-role-picker.md) — the clearest consumer of this requirement's icons once both exist.
