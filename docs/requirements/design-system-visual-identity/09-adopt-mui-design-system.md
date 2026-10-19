# Requirement 9 — Adopt MUI with the Scouting America Brand Palette

Status: Implemented. See [ADR 0017](../adr/0017-adopt-mui-design-system.md) for the color-role and Tailwind-removal decisions made along the way.
Depends on: none — cross-cutting design-system requirement, not tied to a single ROADMAP iteration; touches every existing page. Directly conflicts with [ADR 0011](../adr/0011-tailwind-css.md) (Tailwind CSS for styling) and overlaps [ADR 0015](../adr/0015-brand-aligned-visual-design.md) and [ADR 0016](../adr/0016-status-colors-and-header-blue.md) — reconciling with those is part of this requirement, not a side effect of it.

## Goal

Adopt MUI (Material UI) as ScoutBuddy's design system and component library, themed with the Scouting America brand palette already established in ADR 0015. The result must be a responsive app that works equally well on phones (≥360px) and desktops (≥1440px), meets WCAG 2.2 AA contrast and accessibility requirements, and centralizes every color, font, spacing, and shape decision in one theme so future work stays on-brand automatically without per-page styling decisions.

## Requirements

### Investigation and planning (do first, before any code changes)

- **REQ-9.1** Before changing anything, inspect and report: framework/router, React version, TS vs JS; the existing styling approach (Tailwind per ADR 0011) and anything that would conflict with MUI/Emotion; whether MUI is already installed and at which version; every hard-coded color value in the codebase (hex, `rgb(`, `hsl(`, named CSS colors) and every place fonts are declared.
- **REQ-9.2** Propose a short plan (files to add/change/remove) before writing code. Ask the user before removing Tailwind or any other styling system, and before any change touching more than ~15 files.

### Installation and wiring

- **REQ-9.3** Install current stable MUI packages (`@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`); if MUI is already present, keep the installed major version unless upgrading is low-risk, and report which was chosen.
- **REQ-9.4** For Next.js App Router: install `@mui/material-nextjs`, wrap the root layout in `AppRouterCacheProvider`, mark client-only wrappers `"use client"`, and keep the client boundary minimal.
- **REQ-9.5** Enable CSS theme variables (`cssVariables: true`, `colorSchemeSelector`) so light/dark schemes switch without a flash and plain CSS can read `var(--mui-palette-...)` tokens.
- **REQ-9.6** Use current MUI APIs (e.g. `Grid` with `size={{ xs: 12, md: 6 }}`, not legacy `item xs={}`); consult current docs/MCP if available rather than relying on training-data memory, since this project's Next.js version may itself differ from what any model has memorized (see this file's own `CLAUDE.md` warning about the local Next.js install).

### Brand tokens — single source of truth

- **REQ-9.7** Create a theme tokens file (e.g. `src/theme/tokens.ts`) containing the raw brand colors below; build the MUI theme from those tokens. No component may use a raw hex value — everything references the theme. Note at the top of the file that these values come from Scouting America's official brand colors sheet and that `darkBlue` should be re-verified against the current official brand guide.

| Token | Brand name | HEX | RGB | Pantone | Program association |
|---|---|---|---|---|---|
| `blue` | Scouting America Blue | `#003F87` | 0, 63, 135 | PMS 294 | Cub Scouts Blue |
| `red` | Scouting America Red | `#CE1126` | 206, 17, 38 | PMS 186 | Scouts BSA Red |
| `tan` | Scouting America Tan | `#D6CEBD` | 214, 206, 189 | PMS 400 | Scouts BSA Tan |
| `gray` | Scouting America Gray | `#515354` | 81, 83, 84 | — | — |
| `white` | Scouting America White | `#FFFFFF` | 255, 255, 255 | — | — |
| `lightTan` | Scouting America Light Tan | `#E9E9E4` | 233, 233, 228 | — | — |
| `darkTan` | Scouting America Dark Tan | `#AD9D7B` | 173, 157, 123 | PMS 402 | — |
| `paleBlue` | Scouting America Pale Blue | `#9AB3D5` | 154, 179, 213 | PMS 271 | Sea Scouts Light Blue |
| `darkBlue` | Scouting America Dark Blue | `#003366` | — | — | Sea Scouts Dark Blue |
| `paleGray` | Scouting America Pale Gray | `#858787` | 133, 135, 135 | PMS 877 | — |
| `darkGray` | Scouting America Dark Gray | `#232528` | 35, 37, 40 | — | — |

- **REQ-9.8** Add the brand colors not mapped to a standard MUI palette slot (below) as custom `palette.brand.*` entries, with TypeScript module augmentation (`declare module '@mui/material/styles'`) so `theme.palette.brand.tan` and `color="brand"` are type-safe.

### Light-scheme palette mapping

| MUI role | Token | Notes |
|---|---|---|
| `primary.main` | `blue` `#003F87` | Main actions, AppBar, links. `contrastText` = white. |
| `primary.dark` / `primary.light` | `darkBlue` / derived lighter blue | Hover/pressed states. |
| `secondary.main` | `red` `#CE1126` | Accent and high-emphasis CTAs **only** — must not dominate pages. `contrastText` = white. |
| `error.main` | A red visibly distinct from brand red (e.g. `#9B1B1B`) | Must never be confused with branded accents; always pair with an icon + text, never color alone. |
| `warning` / `info` / `success` | MUI defaults, adjusted only if contrast fails | `info` may use `blue`. |
| `background.default` / `background.paper` | `white` | Custom `background.subtle` key = `lightTan` for alternating sections. |
| `text.primary` | `darkGray` `#232528` | |
| `text.secondary` | `gray` `#515354` | |
| `text.disabled` | `paleGray` `#858787` | Disabled only, never body copy. |
| `divider` | `tan` or low-alpha `gray` | Whichever passes the 3:1 non-text contrast check where dividers carry meaning. |

### Dark scheme

- **REQ-9.9** Define a `dark` color scheme derived from the same tokens: background `darkGray` (or a deep navy derived from `darkBlue`) with a lighter paper surface; `primary.main` = `paleBlue` (brand blue is too dark to read on dark backgrounds); `secondary.main` = a lightened brand red, computed and verified (not guessed) to pass AA on the dark background; `text.primary` near-white, `text.secondary` = `lightTan`/`tan`.
- **REQ-9.10** Respect the OS color-scheme preference by default, and add a light/dark toggle in the app header.

### Contrast and accessibility rules

- **REQ-9.11** Body text/UI labels ≥ 4.5:1; large text (≥24px, or ≥18.66px bold) ≥ 3:1; meaningful icons/borders/focus rings ≥ 3:1.
- **REQ-9.12** Never use `paleBlue`, `tan`, `lightTan`, `darkTan`, or `paleGray` as text color on white — backgrounds/borders/decorative only. White text is allowed on `blue`, `darkBlue`, `red`, `gray`, `darkGray`. On `tan`/`lightTan`/`paleBlue` backgrounds, text is `darkGray` or `blue`.
- **REQ-9.13** A script or test (e.g. `src/theme/contrast.test.ts`) computes WCAG contrast ratios for every foreground/background pairing the theme uses and fails if any pairing is below its threshold; run it and report the results table.

### Typography, shape, spacing

- **REQ-9.14** Confirm the official Scouting America typefaces from the current brand standards before using them — ask the user rather than guessing. Until confirmed, use a single system sans-serif stack (`system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) defined in one place so it can be swapped later. Load any eventual web fonts with `next/font` (or self-hosted, `font-display: swap`).
- **REQ-9.15** Apply `responsiveFontSizes()`; minimum body size 16px on mobile (prevents iOS input zoom).
- **REQ-9.16** Keep MUI's 8px spacing unit; `shape.borderRadius` 6–8px; `textTransform: 'none'` on buttons (no default all-caps).

### Component defaults (`theme.components`)

- **REQ-9.17** Button: `disableElevation`, `textTransform: 'none'`, ≥44×44px touch target, visible `:focus-visible` ring.
- **REQ-9.18** AppBar: `primary` background, white text; mobile nav collapses into a `Drawer` behind a labeled hamburger `IconButton`; `md`+ shows inline nav links.
- **REQ-9.19** Link: `primary` color, underline on hover/focus, distinguishable by more than color alone in body text.
- **REQ-9.20** Card/Paper: subtle `tan` border or low elevation, padding that reduces on `xs`.
- **REQ-9.21** TextField: `variant="outlined"`, `fullWidth` on `xs`, labels always visible (no placeholder-only labels).
- **REQ-9.22** Chip/Badge: may use `brand.tan`/`brand.paleBlue` backgrounds with dark text.
- **REQ-9.23** Alert: uses `error`/`warning`/`info`/`success` only — never brand red for errors.
- **REQ-9.24** CssBaseline sets `body` background/text from the theme; `scroll-behavior: smooth` behind `prefers-reduced-motion: no-preference`.

### Responsive layout

- **REQ-9.25** Mobile-first via MUI breakpoints (`xs` 0, `sm` 600, `md` 900, `lg` 1200, `xl` 1536) through `sx`/`theme.breakpoints` — no hand-written media queries.
- **REQ-9.26** Page content wrapped in `Container maxWidth="lg"` with reduced horizontal padding on `xs`; `Grid`/`Stack` for layout, single column on `xs`, multi-column from `md`.
- **REQ-9.27** No horizontal scrolling at 360px; tables reflow into stacked cards on `xs` or scroll inside their own container; images use explicit dimensions/`aspect-ratio` to avoid layout shift.
- **REQ-9.28** Verified at 360, 390, 768, 1024, and 1440px widths.

### Brand and trademark guardrails

- **REQ-9.29** Never recreate, redraw, or approximate Scouting America logos, the fleur-de-lis, program marks, or other trademarks in code or SVG — carried forward from ADR 0015. Reference official asset files the user places in `public/brand/` (ask if missing), following the brand guide's clear-space and color-version rules.
- **REQ-9.30** Respect program color associations — Blue = Cub Scouts, Red/Tan = Scouts BSA, Pale/Dark Blue = Sea Scouts — don't borrow one program's color for another program's content. Brand red stays an accent, never a background for large areas.

### Migration

- **REQ-9.31** Replace hard-coded colors/fonts found under REQ-9.1 with theme tokens; report a before/after mapping summary, and flag any color with no reasonable brand equivalent rather than inventing one.
- **REQ-9.32** Convert existing components to MUI incrementally, page by page, keeping the app working after each step. If Tailwind must coexist temporarily, configure it so it doesn't fight MUI (CSS layer ordering / preflight) and document the plan to remove it.

### Living style guide

- **REQ-9.33** A route (e.g. `/style-guide`), excluded from production navigation or protected, renders: every brand color swatch (token name, hex, passing text color); the typography scale (h1–h6, body, caption, button); buttons (all variants/colors), form inputs, cards, chips, alerts, AppBar + Drawer nav; and a light/dark toggle for side-by-side review.

### Documentation

- **REQ-9.34** Add a "Design system" section to `CLAUDE.md`: MUI is the only component library, theme lives in `src/theme/`; no raw hex/rgb in components — always `theme.palette.*` or `var(--mui-palette-*)`; brand red is an accent only, errors use `error`; pale/tan colors are never text on white; no recreating logos/trademarks — use `public/brand/`; run the contrast check and verify 360px/1440px layouts before finishing UI work.
- **REQ-9.35** Per this project's own working conventions, adopting MUI (and any resulting change or supersession of ADR 0011's Tailwind decision) gets its own ADR, written when the decision is actually implemented — not invented ahead of that work.

## Acceptance Criteria

- [x] Investigation report delivered (REQ-9.1) and plan approved before any styling-system change or any change touching >15 files — see the color-role and Tailwind-removal questions put to the user before implementation began.
- [x] App builds with no type errors; lint passes.
- [x] Contrast test (REQ-9.13) passes; results table included in the report. Two pre-existing failures the test caught (`NOT_STARTED`/`SUBMITTED` status-chip text) were fixed as part of this work — see ADR 0017.
- [ ] No horizontal scroll at 360px on any page or the style guide; layout looks correct at 1440px. **Not independently verified** — no headless-browser tool (`chromium-cli` or equivalent) was available in this environment; verified instead via server-rendering smoke tests (every route returns 200, zero console errors/warnings on a fresh dev server) and the same `sx` responsive-breakpoint mechanism (`xs`/`sm`/`md`) used consistently throughout. Recommend a manual pass or a follow-up session with browser tooling before calling this fully done.
- [ ] Keyboard-only navigation works: logical tab order, always-visible focus, mobile drawer reachable and closable by keyboard. **Not independently verified**, same tooling limitation as above.
- [x] A search for remaining hard-coded colors turns up none, or each remaining one is reported with its reason — zero Tailwind classes and zero component-level raw hex values remain; `lib/theme/tokens.ts` is the only file with literal brand hex values.
- [x] `/style-guide` renders all required sections (REQ-9.33) with working light/dark toggle (the header's `ColorModeToggle`, present on every page).
- [x] No Scouting America logo, fleur-de-lis, or program mark is reproduced in code/SVG anywhere in the app — unchanged from before this requirement.

## Out of Scope for This Requirement

- Sourcing or designing official logo/trademark assets — the user supplies files in `public/brand/` if and when needed; none were needed for this pass.
- Visual/screenshot-based responsive and keyboard-navigation verification — blocked on browser tooling not available in this environment (see Acceptance Criteria above).

## Open Questions

- Official Scouting America typefaces — **resolved without needing to ask**: ADR 0015 had already recorded Montserrat (headings) + Arial/Helvetica (body) as sourced from the official brand guidelines; carried forward into the MUI theme as-is.
- Whether Tailwind (ADR 0011) is removed outright or coexists temporarily — **resolved**: the user chose a full cutover; see ADR 0017.
- Brand color role conflict with ADR 0015/0016 (red-primary/olive-secondary vs. MUI's primary/secondary slots) — **resolved**: the user chose `primary`=blue, `secondary`=red-as-sparing-accent, with `brand.olive` preserving the prior secondary-action meaning; see ADR 0017.
- Any hard-coded color discovered in the Step 0 investigation with no reasonable brand-palette equivalent (REQ-9.31) — none found; every existing color (patrol identity colors, semantic status colors) had a clear place in the new theme or was deliberately left as its own system (see ADR 0017).

## Related

- [ADR 0017 - Adopt MUI as the design system; brand color roles revised; Tailwind removed](../adr/0017-adopt-mui-design-system.md) — the implementation record for this requirement: exact palette values, the Tailwind cutover, and a genuine MUI+React-Server-Components incompatibility found by running the app (fixed with client-component wrappers, documented in `CLAUDE.md`).
- [ADR 0011 - Tailwind CSS for styling](../adr/0011-tailwind-css.md) — superseded by ADR 0017.
- [ADR 0015 - Brand-aligned visual design](../adr/0015-brand-aligned-visual-design.md) — this requirement's brand palette and trademark guardrails are the same ones ADR 0015 established; MUI theming must reproduce, not redefine, that decision.
- [ADR 0016 - Semantic status colors, and a Scouting Blue header](../adr/0016-status-colors-and-header-blue.md) — status pill colors and the header's blue must be preserved through the MUI theme mapping.
- [Requirement 2 - Patrol Visual Identity](../roadmap-iterations/02-four-patrols-and-visual-identity.md) — patrol background colors and computed contrast text are a parallel, pre-existing instance of the same "never hand-set contrast text" principle this requirement generalizes via theme tokens.
- [Requirement 7 - Campout Dashboard Layout & Status Visualization](../ux-interaction-polish/07-campout-dashboard-layout.md) — not yet built; if MUI adoption lands first, Requirement 7 should be implemented directly in MUI rather than Tailwind.
