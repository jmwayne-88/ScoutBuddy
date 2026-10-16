# Requirement 16 — Icon-Button Row Actions & Swipe-to-Delete

Status: Not started
Depends on: [Requirement 15](15-consistent-destructive-action-pattern.md) (the undo-toast behavior this requirement's remove actions should trigger)

## Goal

Replace the small text links ("Rename", "Remove dish", "Edit", "Remove") used on every dish and ingredient row with icon buttons, and add swipe-to-delete as a touch-native alternative on mobile — so editing a menu reads as a youth-facing app's list UI rather than an admin backend's row of form links.

## Source

Recommendation #7 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

In `app/(app)/menus/[id]/page.tsx`, every dish row renders `RenameDishDialog`'s trigger as `<Button variant="text" size="small">Rename</Button>` next to a plain `<Button variant="text" size="small">Remove dish</Button>`, and every ingredient row renders `EditIngredientDialog`'s trigger as `<Button variant="text" size="small">Edit</Button>` next to `<Button variant="text" size="small">Remove</Button>`. These are functional but visually indistinguishable from any generic admin CRUD screen — small blue text links with no iconography, at odds with the "fun for youth" goal this round of requirements is built around.

## Requirements

- **REQ-16.1** `RenameDishDialog`'s trigger becomes an icon button (pencil/edit icon, MUI `IconButton`) with an `aria-label="Rename dish"`, replacing its current `<Button variant="text">Rename</Button>`.
- **REQ-16.2** The "Remove dish" text button becomes an icon button (trash icon) with `aria-label="Remove dish"`, wired to the same Tier 2 undo-toast behavior established in [Requirement 15](15-consistent-destructive-action-pattern.md).
- **REQ-16.3** `EditIngredientDialog`'s trigger and the ingredient "Remove" button get the same icon-button treatment (pencil / trash), each with its own `aria-label`.
- **REQ-16.4** Every such icon button meets the theme's existing 44×44px minimum touch target (`lib/theme/theme.ts`'s `MuiButton` override already enforces this for `Button`; `IconButton` must be checked against the same minimum explicitly, since MUI's default small `IconButton` padding can fall under it).
- **REQ-16.5** On a touch viewport (below the theme's `sm` breakpoint), a dish or ingredient row additionally supports swipe-to-reveal (swiping the row left reveals the rename/remove icon actions already present in REQ-16.1-16.3, rather than introducing a third, swipe-only action) — swipe is an alternate gesture for the same two actions, not new functionality.
- **REQ-16.6** Swipe-to-delete (dragging past a threshold rather than tapping the revealed delete icon) triggers the same Tier 2 undo-toast action as REQ-16.2/16.3, never a silent, unconfirmed, un-undoable delete.
- **REQ-16.7** On a pointer/mouse viewport (at or above `sm`), the icon buttons from REQ-16.1-16.3 remain visible and clickable at all times — swipe is additive on touch, not a replacement that hides the action from non-touch input.
- **REQ-16.8** Icon choice is internally consistent: the same pencil icon is used for every "rename/edit" action and the same trash icon for every "remove" action across dishes and ingredients, not a different icon per row type.

## Acceptance Criteria

- [ ] Every dish and ingredient row shows icon buttons (not text links) for its edit and remove actions, each with a correct `aria-label`.
- [ ] Every icon button is at least 44×44px.
- [ ] On a touch-sized viewport, swiping a dish or ingredient row left reveals the same rename/remove actions as its icon buttons.
- [ ] Swiping to delete produces the same undo-toast behavior as tapping the trash icon — never an unconfirmed, non-undoable delete.
- [ ] On a desktop-sized viewport, the icon buttons are present and usable without any swipe gesture.

## Out of Scope for This Requirement

- Reordering dishes or ingredients via drag/swipe — this requirement covers edit/remove only.
- Any new action beyond the existing rename/remove pair — swipe surfaces what's already there, it doesn't add new capability.
- Icon-button treatment for other parts of the app (patrol rows on `/patrols`, meal-framework exceptions on the campout page) — those keep their current controls unless a future requirement extends this pattern there explicitly.

## Related

- [Requirement 15 - Consistent Destructive-Action Pattern](15-consistent-destructive-action-pattern.md) — every remove action this requirement touches must use that requirement's undo-toast behavior, not a new confirmation pattern of its own.
- CLAUDE.md's Design System section — the 44px minimum touch target this requirement must preserve for every `IconButton`.
