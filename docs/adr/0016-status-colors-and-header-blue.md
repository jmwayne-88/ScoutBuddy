# 0016. Semantic status colors, and a Scouting Blue header

Date: 2026-09-15
Status: Accepted

## Context

[Requirement 7](../requirements/07-campout-dashboard-layout.md) — a dashboard-style layout based on a reference screenshot — needs a consistent color per menu status (Not Started, In Progress, Submitted, Changes Requested, Approved) used everywhere a status appears, plus a campout-level progress summary. The reference screenshot also uses a blue header, not the dark gray [ADR 0015](0015-brand-aligned-visual-design.md) chose.

## Decision

**Status colors** (`lib/progress.ts`'s `menuStatusColor`): five distinct, semantic colors — gray (Not Started), blue (In Progress), amber (Submitted — awaiting review), purple (Changes Requested), green (Approved). These are **not** drawn from the Scouts BSA brand palette in ADR 0015 — that palette governs brand chrome (buttons, backgrounds, links), not functional status indicators, and a five-way distinction (plus "gray = neutral," "green = good," "amber/purple = needs attention") is a near-universal, expected UX convention that the neutral tan/gray/olive/red brand palette can't express on its own without inventing meaning that isn't there.

**Header color**: changes from `scout-gray-dark` to `scout-blue` (`#003F87`). This is not a departure from the brand guidelines — Blue is one of the five official Scouting America *primary* colors, explicitly usable by any sub-brand, per the same guidelines document ADR 0015 was built from. ADR 0015 had reserved it narrowly for hyperlinks only, out of caution about reading as Cub Scouting's dominant color; the reference screenshot's header use changes that judgment call. Text links keep using `scout-blue` too — a blue header and blue inline links elsewhere in the page aren't in visual competition with each other, so there was no need to invent a second link color.

**Campout-level progress** (`campoutProgress`): approved-menu count ÷ 4, expressed as both a percentage and an "X/4 approved" badge, computed once and reused everywhere it's shown (sidebar list, detail panel) — one calculation, not two that could disagree.

## Alternatives Considered

- **Deriving status colors from the ADR 0015 palette** (e.g., red for Changes Requested, olive for Submitted): rejected — the palette has exactly one accent color to spare (`scout-red`, already meaning "primary action") and one secondary (`scout-olive`, already meaning "secondary action"); reusing them for status would make the same color mean two different things depending on context.
- **Keeping the dark gray header and only changing status colors**: considered, but the reference screenshot's blue header is a specific, deliberate part of what the user asked to match, and it's defensible against the brand guidelines rather than contradicting them.

## Consequences

- `lib/progress.ts` is the single source of truth for both status color and campout progress — any new UI showing a menu's status or a campout's overall progress should call into it rather than reintroducing ad hoc colors or a second progress formula.
- ADR 0015 is not superseded wholesale — its choices for buttons (red/olive), backgrounds (tan), and typography (Montserrat/Arial) are unchanged. Only its header-color and link-color specifics are revised here; ADR 0015's own text is left as written (per CLAUDE.md's convention of writing a new ADR rather than editing history), with this ADR as the record of what changed and why.
