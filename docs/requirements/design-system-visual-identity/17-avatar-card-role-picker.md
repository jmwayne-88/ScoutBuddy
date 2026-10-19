# Requirement 17 — Avatar/Card Home Role Picker

Status: Done
Depends on: none tied to a single ROADMAP iteration; builds on the existing role-selection flow (`app/(app)/role-actions.ts`, `components/RoleForm.tsx`, `components/RoleSwitcher.tsx`)

## Goal

Replace the home page's radio-button-list role picker with a one-tap grid of avatar cards — one per role — closer to the "who's using this device" pattern this app's audience already knows from consumer apps, instead of a form that requires selecting a radio and then pressing a separate Continue button.

## Source

Recommendation #8 from the UX/style audit referenced by [Requirement 13](../ux-interaction-polish/13-ux-quick-win-polish.md)'s Source section.

## Problem

`app/(app)/page.tsx` renders `components/RoleForm.tsx`: a `FormLabel` ("I am...") above a `RadioGroup` listing "the ASPL of Camping" and "the Patrol Leader for [patrol badge]" per active patrol, with a separate `Button type="submit"` ("Continue") below. Picking a role today is a two-step interaction (select a radio, then press Continue) styled as a settings form, not a "whose turn is it" screen a Scout would reach for every single session.

## Requirements

- **REQ-17.1** `app/(app)/page.tsx` renders one card per selectable role — "the ASPL of Camping" plus one card per active patrol's Patrol Leader — in a responsive grid (MUI `Grid`), each card showing the role/patrol name and (for a patrol) its existing color identity (the `components/PatrolBadge.tsx` treatment, or the patrol icon from [Requirement 18](18-patrol-icon-identity.md) if that requirement has landed by the time this one is built).
- **REQ-17.2** Tapping/clicking a card immediately submits that role choice — there is no separate Continue button and no intermediate "selected but not confirmed" state. The underlying mechanism is still `app/(app)/role-actions.ts`'s existing `chooseRole` Server Action; only the triggering UI changes.
- **REQ-17.3** The currently active role (if any — `getActor()`'s result, exactly as `app/(app)/page.tsx` already computes `currentValue` today) is visually distinguished on its card (e.g. a border/checkmark), so a returning visitor can see at a glance who they're currently acting as before picking again.
- **REQ-17.4** Every card meets the theme's 44×44px minimum touch target with generous margin — these are the literal first tap of every session, including for a first-time youth user, and must be easy to hit correctly.
- **REQ-17.5** The whole card (not just a small avatar glyph within it) is the tap target — consistent with how `components/CampoutCard.tsx` already makes its entire `Paper` a `Link`, not just a label inside it.
- **REQ-17.6** `components/RoleForm.tsx` is either replaced outright or its internals rebuilt around this card grid; either way, the `FormControlLabel`/`Radio`-construction-must-happen-client-side constraint documented in `components/RoleForm.tsx`'s own comment (and CLAUDE.md's MUI+Server Components gotcha) still applies to whatever replaces it — if cards are plain clickable elements wired to a Server Action directly (no `Radio`/`FormControlLabel` at all), that specific gotcha may no longer apply, but the general Server→Client element-passing constraint does for any MUI composition built here.
- **REQ-17.7** `components/RoleSwitcher.tsx` (the header's compact role dropdown, used once a role is already chosen) is unchanged by this requirement — REQ-17.1-17.6 apply to the full-page picker at `/`, not the header control.

## Acceptance Criteria

- [x] `/` shows one tappable card per role (ASPL + each active Patrol Leader), not a radio list with a separate submit button.
- [x] Tapping a card immediately sets that role and navigates onward (to `/campouts` for ASPL, `/patrol-leader` for a Patrol Leader), with no extra confirmation step.
- [x] The currently active role's card is visually distinguished from the rest.
- [x] Every card is comfortably tappable at 360px width.
- [x] A deactivated patrol never produces a card (same active-only filtering `getActivePatrols()` already provides today).

## Out of Scope for This Requirement

- Any change to the underlying role-storage mechanism (the `scoutbuddy_actor` cookie, `lib/session.ts`) — this is a presentation-only change over the existing `chooseRole` action.
- Patrol icon artwork itself — see [Requirement 18](18-patrol-icon-identity.md); this requirement uses whatever patrol identity treatment already exists (color chip today, icon if/when Requirement 18 lands) rather than commissioning new art itself.
- Changes to `components/RoleSwitcher.tsx` (the header dropdown).

## Related

- [Requirement 18 - Patrol Icon/Avatar Identity](18-patrol-icon-identity.md) — if built first, its patrol icons should appear on these cards instead of just the color chip.
- CLAUDE.md's MUI + Server Components gotcha — governs how this requirement's card composition must be built relative to the Server/Client boundary.
- `components/CampoutCard.tsx` — the existing "whole card is the link" pattern this requirement's cards should follow.
