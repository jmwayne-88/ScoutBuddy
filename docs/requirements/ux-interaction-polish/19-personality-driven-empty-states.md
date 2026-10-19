# Requirement 19 — Personality-Driven Empty States

Status: Done
Depends on: [Requirement 5](../roadmap-iterations/05-workflow-hardening-and-polish.md)'s REQ-5.5 (the original guarantee that every empty state shows *something* rather than a blank/broken view — this requirement is about what that something says and looks like, not whether it exists)

## Goal

Give every "there's nothing here yet" moment in the app warmer, specific, youth-facing copy and a small supporting icon, replacing today's flat, interchangeable "No X yet." sentences — without changing when an empty state appears or what action it offers.

## Source

Recommendation #12 from the UX/style audit referenced by [Requirement 13](13-ux-quick-win-polish.md)'s Source section.

## Problem

Every empty state in the app currently uses the same flat, generic phrasing, distinguished only by the noun:

- `app/(app)/menus/[id]/page.tsx`: `"No dishes yet."` per occasion.
- `app/(app)/campouts/layout.tsx`: `"No campouts yet — create the first one."`
- `app/(app)/patrol-leader/page.tsx`: `"No menu has been assigned to your patrol yet."`
- `(print)` shopping-list page: `"No ingredients listed yet."`

Each is accurate and functional (satisfying Requirement 5's original guardrail against a blank page) but reads identically to a generic CRUD admin tool, with no icon, no encouragement, no sense that this is a troop's own planning tool.

## Requirements

- **REQ-19.1** Each distinct empty state in the app is rewritten with specific, encouraging, in-voice copy that names what the viewer can do next, using the troop's real language (Patrol Leader, ASPL, campout, Cracker Barrel) per CLAUDE.md's domain-language rule — for example, the per-occasion "No dishes yet." becomes something like "Nothing planned for Saturday Lunch yet — add your patrol's first dish below," not a generic restatement.
- **REQ-19.2** Every empty state gains a small supporting icon or simple illustration (MUI icon, not a photographic/illustrated asset requiring new art direction beyond a single-color icon) placed above or beside its message — visually distinguishing "empty, waiting for input" from "empty, nothing to show" states (e.g. a fork-and-plate icon for no-dishes-yet vs. a calendar icon for no-campouts-yet).
- **REQ-19.3** An empty state's copy and icon differ based on *who's* viewing it where that's meaningful — e.g. a Patrol Leader viewing their own not-yet-started menu sees different phrasing than an ASPL viewing a campout with zero assigned patrols, even if both are technically "nothing here yet."
- **REQ-19.4** No empty state's new copy overstates what's available — e.g. the per-occasion empty state must not imply a feature (suggested dishes, templates) that doesn't exist; encouragement must stay honest about current scope.
- **REQ-19.5** The full set of empty states covered by this requirement is enumerated and kept in one place (e.g. a small `lib/empty-states.ts` module of message/icon pairs keyed by context) rather than inlined ad hoc per page, so a future page reuses the established voice instead of inventing a new one.
- **REQ-19.6** This requirement changes wording and iconography only — it does not change any condition under which an empty state appears, any permission check, or any data-fetching logic established by Requirement 5 or later requirements.

## Acceptance Criteria

- [x] Every empty state identified in the Problem section shows new, specific copy distinct from a generic "No X yet." sentence.
- [x] Every empty state shows a supporting icon.
- [x] The copy for a given empty state uses real troop terms, not genericized language.
- [x] No empty state's new copy references a feature that doesn't exist in the current build.
- [x] A Patrol Leader's and an ASPL's respective empty states for related situations (e.g. "your menu has no dishes" vs. "this campout has no patrols assigned") read distinctly, not as copy-pasted variants of each other.

## Out of Scope for This Requirement

- Changing *when* an empty state is shown versus real content — that's governed by Requirement 5's REQ-5.5 and unchanged here.
- Custom illustrated artwork beyond a single-color MUI icon — a larger design investment than this requirement's scope.
- Gamified empty-state framing (streaks, badges) — see the separate gamification requirement.

## Related

- [Requirement 5 - Workflow Hardening & Polish](../roadmap-iterations/05-workflow-hardening-and-polish.md) — REQ-5.5 is the guardrail this requirement's copy work sits on top of.
- CLAUDE.md's domain-language rule — every rewritten message must use real troop terms.
