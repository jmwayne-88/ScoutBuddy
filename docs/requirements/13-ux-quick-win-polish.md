# Requirement 13 — UX Quick-Win Polish Pass

Status: Not started
Depends on: none tied to a single ROADMAP iteration (cross-cutting, like Requirements 6+); builds on the status-color and progress conventions from [Requirement 7](07-campout-dashboard-layout.md)

## Goal

Close the gap between how ScoutBuddy behaves today and how a modern, youth-facing app is expected to feel — immediate feedback, humane date/status presentation, no dead-end screens, one consistent way to do each thing — without touching the underlying approval workflow, data model, or permissions. This is a presentation/feedback-layer requirement only.

## Source

An ad hoc UX/style audit of the running app (conversation of 2026-10-15), comparing current behavior against modern-app interaction conventions and FEATURES.md's youth-led, independently-run intent. That audit produced 20 recommendations rated by size/complexity/benefit; this requirement captures the 8 rated lowest-cost and highest-benefit (there numbered #1, #3, #4, #5, #10, #11, #13, #16). The remaining, larger recommendations are intentionally deferred — see Out of Scope.

## Requirements

### Feedback & confirmation

- **REQ-13.1** Every Server Action that mutates data — add/rename/remove dish, add/edit/remove ingredient, update notes, submit menu, approve, reject, assign menu, remove/restore meal occasion, add/remove patrol from campout, and the patrol-management actions (create, update, delete, activate/deactivate, reorder) — surfaces a brief, non-blocking confirmation (e.g. "Dish added", "Menu submitted") instead of relying on a silent re-render as the only feedback.
- **REQ-13.2** The confirmation in REQ-13.1 is delivered through a single shared toast/snackbar mechanism (one hook/component used everywhere), not a one-off implementation per form, so any action added later gets the same behavior automatically.
- **REQ-13.3** A toast auto-dismisses after a short delay (around 4 seconds) and is announced to screen readers (e.g. `role="status"` / `aria-live="polite"`), consistent with the accessibility bar CLAUDE.md already holds the app to.
- **REQ-13.4** When a menu's status becomes Approved, both the Patrol Leader and the ASPL see a distinctly celebratory confirmation (e.g. a one-time animated accent or banner) rather than the same neutral toast used for routine edits — this is the end of the workflow, not an incremental save, and should feel like it.
- **REQ-13.5** The celebratory treatment in REQ-13.4 has no motion-based effect (e.g. confetti) for a user whose OS/browser has `prefers-reduced-motion` set, consistent with the reduced-motion handling already present in `lib/theme/theme.ts`'s smooth-scroll rule.

### Navigation & dead ends

- **REQ-13.6** `/campouts` (`app/(app)/campouts/page.tsx`) no longer renders a bare empty page for a Patrol Leader or a visitor with no role set. It renders a real message explaining the page is for the ASPL, with a link onward to that visitor's own landing page (`/patrol-leader` for a Patrol Leader, `/` if no role is set yet) — the same shape of role-gate message `app/(app)/patrols/page.tsx` already uses, just with a link added.
- **REQ-13.7** `/patrols` and any other role-gated page that currently shows a message with no link forward gets the same "wrong role, here's where to go instead" treatment as REQ-13.6, so every role mismatch behaves the same way app-wide.
- **REQ-13.8** The standalone "Switch role" text link at the bottom of the menu page (`app/(app)/menus/[id]/page.tsx`) is removed. The header's `RoleSwitcher` becomes the single place to change role, so there is exactly one control for this, not two that happen to do the same thing.

### Information clarity

- **REQ-13.9** A new shared date-formatting helper (alongside `lib/dates.ts`) renders a due date as relative, humanized text within a reasonable window — "Due today", "Due tomorrow", "Due in 3 days", "Overdue by 2 days" — and falls back to an absolute date beyond that window (e.g. more than 14 days out). The exact calendar date remains available as secondary text or a tooltip everywhere the relative form is shown, so precision is never lost, only de-emphasized.
- **REQ-13.10** REQ-13.9's helper replaces every current raw `.toDateString()` call on a due date or campout date — at minimum the menu page, the campout detail page, `components/CampoutCard.tsx`, and the Patrol Leader's own menu list (`app/(app)/patrol-leader/page.tsx`) — so date presentation is consistent everywhere, not fixed in one place and left raw elsewhere.
- **REQ-13.11** An overdue due date (per REQ-13.9) renders in a visually distinct way using an existing semantic color token (e.g. the error/status-red token already defined in the theme — never a raw hex, per CLAUDE.md's design-system rule), so a missed deadline is visible at a glance.
- **REQ-13.12** Each menu status chip — wherever `menu.status.replace(/_/g, " ")` is rendered today (the campout detail page's patrol cards, the menu page's own header) — is paired with a small icon reflecting that status (for example: hourglass for Not Started/In Progress, a send/upload icon for Submitted, an edit icon for Changes Requested, a check for Approved). The icon is additive to the existing color coding from `lib/progress.ts`'s `menuStatusColor`, not a replacement for it.
- **REQ-13.13** The status-to-icon mapping in REQ-13.12 is defined once, alongside `menuStatusColor` in `lib/progress.ts`, and imported everywhere a status chip is rendered — not re-implemented per page.
- **REQ-13.14** The Patrol Leader's own menu page shows a meal-level progress indicator — e.g. "4/6 meal occasions have at least one dish" plus a progress bar — using the same calculation convention `campoutProgress` already establishes in `lib/progress.ts`, so a Patrol Leader gets the same kind of at-a-glance feedback the ASPL already has on the campout dashboard.
- **REQ-13.15** REQ-13.14's progress indicator counts only the menu's currently active occasions (after any meal-framework exceptions), matching how the rest of the menu page already only renders active occasions.

### Visual polish

- **REQ-13.16** The theme's body typography (`lib/theme/theme.ts`'s `typography.fontFamily`) moves from `Arial, Helvetica, sans-serif` to a more current font stack, loaded the same way the existing Montserrat heading font already is — a `next/font/google` variable referenced through a CSS variable — not a second raw `<link>` tag or an unmanaged `@import`. Montserrat continues to own headings; this changes body text only.
- **REQ-13.17** The font change in REQ-13.16 is re-verified against `lib/theme/contrast.test.ts` and checked at 360px and 1440px per CLAUDE.md's standing UI checklist before this requirement is considered done, since a font-stack change can shift line-wrapping and perceived spacing even when no color changes.

## Acceptance Criteria

- [ ] Every mutating action listed in REQ-13.1 produces a toast; none rely solely on a full-page reload or silent revalidation as its only feedback.
- [ ] Reaching Approved status is visibly, intentionally different from a routine save, and that difference is absent under `prefers-reduced-motion`.
- [ ] Visiting `/campouts` or `/patrols` in a role that can't use them shows an explanatory message with a working link onward — never a blank page.
- [ ] Exactly one role-switching control exists in the app.
- [ ] Every due date shown anywhere in the app goes through the same relative-date helper and the same overdue treatment.
- [ ] The same status always shows the same icon everywhere it appears.
- [ ] The Patrol Leader's menu page shows a progress indicator that matches the menu's actual active-occasion dish counts.
- [ ] `npm test` passes, including `lib/theme/contrast.test.ts`, and both 360px and 1440px layouts are checked, after the font change.

## Out of Scope for This Requirement

The larger recommendations from the same audit, each likely sized for its own requirement (and, where it introduces a new interaction pattern such as undo, possibly its own ADR):

- A redesigned home role-picker (one-tap avatar/card grid).
- Patrol icon/avatar treatment beyond the existing color chip.
- Icon-button row actions and swipe-to-delete for dishes/ingredients.
- A consistent undo-toast pattern for cheap/reversible deletes, as distinct from confirm-dialogs for real data loss.
- Inline/toast-based validation errors replacing today's `?error=` query-string pattern.
- Loading skeletons for server-rendered pages.
- A chat-thread visual treatment for review comments.
- A persistent mobile bottom tab bar.
- Push/email due-date reminders.
- Lightweight gamification (streaks/badges).

Any change to the underlying approval workflow, permissions, or status lifecycle is also out of scope — everything in this requirement is presentation/feedback-only, the same posture as Requirement 7.

## Related

- [Requirement 5 - Workflow Hardening & Polish](05-workflow-hardening-and-polish.md) — REQ-5.5's empty-state guardrail is the direct ancestor of REQ-13.6/13.7.
- [Requirement 7 - Campout Dashboard Layout & Status Visualization](07-campout-dashboard-layout.md) — REQ-13.12's status icons and REQ-13.14's progress indicator extend the status-color and progress conventions established there.
- [ADR 0016 - Semantic status colors, and a Scouting Blue header](../adr/0016-status-colors-and-header-blue.md) — status icons (REQ-13.12) must not disturb the semantic color pairing this ADR established.
- [ADR 0017 - Adopt MUI design system](../adr/0017-adopt-mui-design-system.md) — a new toast mechanism (REQ-13.1/13.2) should be built on MUI's `Snackbar`/`Alert`, consistent with "MUI is the only component library."
- CLAUDE.md's Design System section — any new color introduced here (overdue red, celebratory accent) must be a theme token, never a raw hex/rgb/hsl value.
