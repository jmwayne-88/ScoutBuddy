# 0017. Adopt MUI as the design system; brand color roles revised; Tailwind removed

Date: 2026-10-14
Status: Accepted

## Context

[Requirement 9](../requirements/design-system-visual-identity/09-adopt-mui-design-system.md) asked to adopt MUI (Material UI), themed with the Scouting America brand palette, as ScoutBuddy's design system — centralizing color/typography/spacing/shape decisions in one theme, meeting WCAG 2.2 AA, and working at both phone and desktop widths.

Two existing decisions were directly in scope for a conflict, and the user resolved both explicitly before implementation:

1. **Styling system**: [ADR 0011](0011-tailwind-css.md) chose Tailwind CSS. ADR 0011 itself had already flagged a component library as worth reconsidering "once patrol color-coding and general visual polish become the focus" — which this requirement is. The app was still small (9 of 22 source files used Tailwind classes, pre-launch, single maintainer), so the user chose a **full cutover** over a temporary coexistence period.
2. **Brand color roles**: [ADR 0015](0015-brand-aligned-visual-design.md) and [ADR 0016](0016-status-colors-and-header-blue.md) had established Scouting America Red as the primary/affirmative action color and olive as the secondary action color, deliberately keeping Blue off buttons/backgrounds — reserved for the header and links — because ScoutBuddy's domain (patrols, troop) is Scouts BSA, not Cub Scouting, whose dominant color blue is. MUI's own `primary`/`secondary` palette slots map most naturally onto the dominant/accent action pair. The user chose to **reverse** that assignment for the MUI theme: `primary` = Blue, `secondary` = Red (sparing accent only), explicitly overriding ADR 0015's button-color reasoning while leaving ADR 0016's blue header unaffected (it was already blue).

## Decision

**Adopt `@mui/material` + `@emotion/react`/`@emotion/styled` + `@mui/icons-material` + `@mui/material-nextjs`** (installed at the then-current stable major, v9) as the only component library and styling system. Tailwind, `@tailwindcss/postcss`, and `postcss.config.mjs` are removed entirely; `app/globals.css` is gone (MUI's `CssBaseline` replaces it).

**Theme lives in `lib/theme/`**:
- `tokens.ts` — the raw Scouting America brand hex values (same source as ADR 0015), plus the pre-existing `olive` token, as the single place a brand hex value may be written literally.
- `palette.ts` — light and dark `PaletteOptions`, `satisfies`-checked against MUI's augmented `PaletteOptions` type so both palettes get precise literal types (`contrast.test.ts` needs this — a plain `: PaletteOptions` annotation types every color slot as the full MUI union and loses literal narrowing).
- `theme.ts` — `createTheme()` with `cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' }` (the attribute `InitColorSchemeScript` manages), `colorSchemes.light`/`.dark`, `responsiveFontSizes()`, typography (Montserrat headings via the existing `next/font` variable, Arial/Helvetica body, 16px minimum to avoid iOS input zoom), and `theme.components` defaults (Button: `disableElevation`, no text-transform, 44px touch target, focus ring; AppBar: `color="primary"`; Link: underline on hover/focus; Card: divider-colored border; TextField: outlined by default; CssBaseline: reduced-motion-gated smooth scroll).
- `contrast.ts` / `contrast.test.ts` — a WCAG contrast-ratio calculator (reusing the relative-luminance math already in `lib/colors.ts`) and a test enumerating every foreground/background pairing the theme and the semantic status-color system (`lib/progress.ts`) actually render, failing if any drops below its threshold (4.5:1 text, 3:1 large-text/non-text).

**Palette role mapping** (per the user's explicit choice above):
- `primary` = Scouting America Blue (`#003F87`) — AppBar, links, and the general action color (Submit, Create, Approve, Continue).
- `secondary` = Scouting America Red (`#CE1126`) — a sparing high-emphasis accent, not the default button color.
- `error` = `#9B1B1B` in light mode (verified 8.18:1 on white, visibly distinct from brand red); left unset in dark mode so MUI supplies its own vetted dark error, since the light-mode value fails AA on a dark background (~1.6:1) and would otherwise land close in hue to the dark-mode secondary accent.
- `palette.brand.olive` (`#243E2C`) preserves ADR 0015's "secondary action" meaning (Request Changes, Remove occasion) as a named custom token, since MUI's `secondary` slot was reassigned to the sparing-accent role above. `brand.oliveDark` (`#7FA98C`, verified 5.82:1) is a lighter variant for an outlined treatment in dark mode, where filled olive is unreadable against the dark background (~1.3:1).
- Divider resolves to `paleGray` (`#858787`), not `tan` — `tan` measured ~1.56:1 against white, failing the 3:1 non-text threshold; `paleGray` (~3.6:1) is what the pre-MUI `.card` border already used.
- Dark scheme: background `darkGray`/`#2E3033` paper, `primary` = `paleBlue` (brand blue is unreadable on dark), `secondary` = a verified lightened red (`#E57373`, not a guess).

**Two pre-existing accessibility bugs surfaced by the new contrast test** and fixed as part of this work: `lib/progress.ts`'s `NOT_STARTED` (gray `#858787`) and `SUBMITTED` (amber `#b8860b`) status-chip colors used white text, which measured 3.61:1 and 3.25:1 — both failing 4.5:1. Both now use black text (5.81:1 and 6.45:1).

**A genuine MUI + React Server Components incompatibility was found by running the app, not discovered by inspection**: MUI's `FormControlLabel` reads `control.props.*` synchronously (for `disabled`/`required`/`checked`/etc.), and passing `component={Link}` (`next/link`) as a prop value to an MUI Client Component (`Button`, `Paper`, `Link`) does the equivalent. When the enclosing composition is constructed in a Server Component in this Next/React version, the element doesn't survive serialization as a plain object with `.props`, and every read throws `Cannot read properties of undefined`. Confirmed via `/` (the role-picker page, which calls `getActor()` — a dynamic API — and uses `FormControlLabel`) returning 500 in the dev server; fixed by moving each such composition into a dedicated `"use client"` wrapper (`components/LinkButton.tsx`, `components/NavLink.tsx`, `components/CampoutCard.tsx`, `components/RoleForm.tsx`) so the element is constructed and consumed entirely client-side. Documented in `CLAUDE.md` so a future session doesn't lose an afternoon to the same error.

A living style guide at `/style-guide` (excluded from production navigation) renders every brand swatch, the typography scale, all button/input/card/chip/alert variants, and an AppBar+Drawer navigation demo, with the header's light/dark toggle available for reviewing both schemes.

## Alternatives Considered

- **Keep ADR 0015/0016's red-primary/olive-secondary roles, map `primary` to red instead of blue**: the "do nothing new" option; rejected by the user in favor of the more MUI-idiomatic blue-primary mapping, accepting that this ADR explicitly revises ADR 0015's button-color reasoning.
- **Keep Tailwind temporarily, migrate page-by-page across sessions**: safer for a larger app, but unnecessary overhead at this app's current size (9 Tailwind-using files); the user chose a single clean cutover instead.
- **A different component library (shadcn/ui, Chakra)**: not seriously evaluated — Requirement 9 specified MUI directly, and ADR 0011 had already named MUI as the library worth reconsidering Tailwind for.

## Consequences

- [ADR 0011](0011-tailwind-css.md)'s status is updated to reflect its supersession by this ADR; its original text is left as written, per `CLAUDE.md`'s convention.
- [ADR 0015](0015-brand-aligned-visual-design.md)'s button/background color-role choice is superseded by this ADR; its palette *values* (the brand hex codes themselves), typography choice (Montserrat/Arial), and trademark guardrails are unchanged and are exactly what `lib/theme/tokens.ts` carries forward.
- [ADR 0016](0016-status-colors-and-header-blue.md)'s header-blue decision is unaffected (carried forward via `AppBar` defaulting to `color="primary"`, which is blue); its claim that "buttons (red/olive)... are unchanged" is no longer accurate as of this ADR and should be read as superseded on that one point.
- All future UI work uses `theme.palette.*`/`sx` exclusively — no raw hex, no Tailwind classes (none remain in the codebase). See `CLAUDE.md`'s Design System section for the enforced rules.
- `npm test` now includes a contrast gate (`lib/theme/contrast.test.ts`) that fails the suite if a future theme change drops any rendered color pairing below its WCAG threshold.

## Related

- [Requirement 9 - Adopt MUI with the Scouting America Brand Palette](../requirements/design-system-visual-identity/09-adopt-mui-design-system.md)
- [ADR 0011 - Tailwind CSS for styling](0011-tailwind-css.md) — superseded by this ADR.
- [ADR 0015 - Brand-aligned visual design](0015-brand-aligned-visual-design.md) — button/background color roles superseded; palette values and trademark guardrails carried forward.
- [ADR 0016 - Semantic status colors, and a Scouting Blue header](0016-status-colors-and-header-blue.md) — header-blue choice carried forward unchanged; its "buttons unchanged" consequence note is superseded.
