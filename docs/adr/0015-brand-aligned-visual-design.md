# 0015. Visual design aligned to Scouting America's brand guidelines, no trademarks

Date: 2026-09-15
Status: Accepted — header color and link color specifics revised by [ADR 0016](0016-status-colors-and-header-blue.md); everything else here still applies

## Context

ScoutBuddy's UI was styled with generic Tailwind defaults (slate/emerald/amber) with no relationship to Scouting America's actual brand. The user asked for the app to look and feel representative of Scouting America, evaluated against the organization's official brand guidelines PDF, while explicitly **not** using any official logos or trademarks (the fleur-de-lis/eagle/shield emblem, program trademarks like the Cub Scouts wolf or Venturing mountain, or the "Prepared. For Life.®" tagline — all called out in the guidelines as protected marks requiring licensing).

The guidelines define a primary Scouting America palette (Red `#CE1126`, Blue `#003F87`, Tan `#D6CEBD`, Gray `#515354`, White) plus four program sub-brands, each with its own accent. ScoutBuddy's own domain — patrols, a Patrol Leader, a troop-run campout — maps to the **Scouts BSA** sub-brand (ages 11-17, patrol-based troops), not Cub Scouts (dens), Venturing (crews), or Sea Scouts (ships). The guidelines give Scouts BSA-specific direction: *"a similarly neutral palette composed mainly of tan, gray, and olive hues, with color coming in from the use of imagery and illustrations. Scouts BSA Red should be used as an accent or action color."* They also list approved fonts (Times New Roman, Arial, Helvetica Neue Bold Condensed, Proxima Nova Extra Bold) and name **Montserrat** as the approved free Google Fonts alternate to Proxima Nova.

## Decision

Adopt the Scouts BSA palette as the app's chrome (backgrounds, borders, buttons, links, text) via Tailwind v4 theme tokens in `app/globals.css`:

- `scout-red` `#CE1126` — primary/affirmative actions (Submit, Approve, Create, Continue)
- `scout-olive` `#243E2C` — secondary actions (Request Changes, Remove occasion) — Scouts BSA's one distinguishing color beyond the shared neutrals
- `scout-tan` / `scout-tan-light` / `scout-tan-dark` — page background and layered surfaces (the guidelines' own suggested use for the tan/secondary-tan pair)
- `scout-gray` / `scout-gray-pale` / `scout-gray-dark` — body text, borders, muted text, and the header background
- `scout-blue` `#003F87` — hyperlinks only, restrained use (Blue is one of the five official primary colors "usable by any sub-brand," but is Cub Scouting's dominant color, not Scouts BSA's — kept to the single, conventional role of link color rather than backgrounds or buttons, to avoid reading as the wrong sub-brand)

Destructive/low-emphasis actions (Remove dish, Remove ingredient) intentionally do **not** use `scout-red` — the guidelines forbid creating shades or tints of Scouting America Red, so a single flat red used for both "primary action" and "delete this" would be ambiguous. They use a muted gray text-link style instead.

Typography: Montserrat (bold, via `next/font/google` — self-hosted by Next.js at build time, not a runtime external request) for headings, applied globally via a plain `h1, h2, h3` CSS rule rather than a className on every heading; Arial/Helvetica for body text, matching the guidelines' "universal fonts" for broad compatibility.

**Explicitly out of scope**: no fleur-de-lis, eagle/shield emblem, or any program trademark shape; no "Prepared. For Life.®" tagline text; no attempt to reproduce or approximate the official trademark artwork. Patrol identity colors (`lib/colors.ts`, `components/PatrolBadge.tsx` — Eagle blue, Puma gold, Raven dark purple, Silver Fox silver) are **not** touched by this decision; they're a pre-existing, separate concept (troop-specific patrol identity, not Scouting America's organizational brand) established back in [Iteration 2](../requirements/02-four-patrols-and-visual-identity.md) and are left exactly as they were.

## Alternatives Considered

- **Cub Scouts' Blue/Gold or Venturing's Green/Yellow palette**: rejected — ScoutBuddy's domain (patrols, troop, Patrol Leader) is specifically Scouts BSA's structure, not Cub Scouting's dens or Venturing's crews; using another sub-brand's colors would misrepresent which program this tool is for.
- **Using the actual Scouting America trademark or a stylized fleur-de-lis as a decorative element**: explicitly rejected per the user's instruction and the guidelines themselves, which reserve trademark reproduction for licensed use only.

## Consequences

- Five Tailwind utility "colors" now exist as reusable theme tokens (`bg-scout-red`, `text-scout-gray`, etc.) plus three small component classes (`.btn-primary`, `.btn-secondary`, `.card`, `.link`, `.link-muted`) in `globals.css` — new UI should reach for these instead of reintroducing generic Tailwind grays/blues, to keep the app visually consistent with this decision.
- Montserrat is now a build dependency fetched from Google Fonts at build time (via `next/font/google`, which self-hosts the result — no runtime request to Google, no client-side layout shift from a late-loading web font).
- If ScoutBuddy ever adds features for a different Scouting program (unlikely, given its scope), that would warrant a fresh look at which sub-brand palette applies rather than assuming Scouts BSA's carries over.
