# ScoutBuddy — Delivery Roadmap

This breaks [FEATURES.md](FEATURES.md) into small, sequenced iterations, each one a complete, usable increment rather than a partial slice of everything. The order follows dependency and value: each iteration proves something the next one needs, and each is worth shipping on its own even if work stopped right after it.

## Sequencing rationale

- The full approval loop (submit → review → approve/reject → revise) has to work for *one* patrol before it's worth building for four — that's where the real risk is, not the patrol count.
- Multiple patrols matter more than multiple campouts, since a single real campout already needs all four.
- Meal-framework variation only matters once there's a real menu to vary.
- Polish and hardening come last, once real usage (even just yours, testing it) has surfaced what actually needs tightening.

## Iteration 1 — Core Approval Loop (single patrol, single campout)

**Goal:** prove the entire workflow end-to-end for one patrol on one campout.

Requirements:
- ASPL can create a campout (name, date).
- ASPL can assign a menu to a patrol with a due date. All six standard occasions are active by default (no variation logic yet).
- Patrol Leader can add/edit/remove named dishes per occasion, and ingredients (name + quantity) per dish.
- Patrol Leader can fill in the nutrition/MyPlate note and the patrol allergy note (free text, unvalidated).
- Patrol Leader can submit the menu (status → Submitted).
- ASPL can view a submitted menu in full — every occasion, its dishes and ingredients, both notes.
- ASPL can approve (status → Approved) or reject with a required comment (status → Changes Requested).
- Patrol Leader can revise and resubmit after Changes Requested, with no cap on cycles.
- All status transitions are enforced server-side by role, per [ADR 0007](docs/adr/0007-menu-status-lifecycle-and-permissions.md) — not just hidden in the UI.

Deferred to later iterations: the other three patrols, multiple campouts, meal-framework variation, full patrol color treatment.

**Value delivered:** a real menu can go through the entire approval cycle in the app instead of over text and paper.

## Iteration 2 — All Four Patrols + Visual Identity

**Goal:** scale the core loop to how a campout actually works.

Requirements:
- All four patrols (Eagle, Puma, Raven, Silver Fox) exist as fixed, assignable entities.
- ASPL assigns an independent menu to each of the four patrols for a campout.
- Patrol color-coding (background color per patrol, auto-contrast foreground text) applied everywhere a patrol appears.
- ASPL can see all four patrols' menu statuses at a glance for a campout.

**Value delivered:** an ASPL can run a whole campout's menu assignment and review, not just a single-patrol demo.

## Iteration 3 — Multiple Campouts

**Goal:** support planning across a term, not just one campout at a time.

Requirements:
- ASPL can add multiple campouts and see them listed.
- Navigating into a campout shows/manages its own four patrol menus, independent of any other campout's.

**Value delivered:** the tool becomes usable term-over-term instead of single-use.

## Iteration 4 — Meal-Framework Variation

**Goal:** give the ASPL the flexibility real campouts need (e.g., no Friday Cracker Barrel on a campout with a late Friday arrival).

Requirements:
- ASPL can remove one or more of the six standard occasions from a campout, scoped to one named patrol or applied to all patrols at once, per [ADR 0006](docs/adr/0006-structured-meal-framework-variation.md).
- A removed occasion doesn't appear at all in the affected Patrol Leader's menu.
- ASPL can edit the variation after initial assignment.

**Value delivered:** menus reflect real campout logistics instead of forcing every campout through an identical framework.

## Iteration 5 — Workflow Hardening & Polish

**Goal:** close the gaps that only show up once the loop gets used for real.

Requirements:
- Resolve the open decision flagged in FEATURES.md: does editing a Submitted menu silently revert it to In Progress, or stay Submitted-but-edited? Write this up as its own ADR once decided.
- Full review-comment history visible across every revision, not just the latest rejection.
- Sensible empty/loading states for a brand-new campout, patrol, or menu.
- Minimal guardrails that don't contradict the brief's "no validation" stance on the free-text fields — e.g., preventing submission of a menu where an active occasion has zero dishes, while still leaving nutrition/allergy notes completely unvalidated.

**Value delivered:** the workflow is trustworthy enough to hand fully to youth leaders without an adult double-checking it.

## Later — explicitly deferred (from FEATURES.md's Out-of-Scope list)

Not sequenced yet — revisit once Iteration 5 has proven the core loop in real troop use. Each of these should get its own iteration plan and ADR(s) when picked up, not be bundled in silently:

- Shopping list rolled up from all ingredients across dishes/menus.
- Saved library of past menus for reuse across terms.
- Automatic due-date calculation.
- Adult read-only oversight view.
- Formal adult sign-off step.

## How to use this doc

- Treat each iteration as a milestone: don't start the next one until the current one is genuinely usable end-to-end, not just code-complete.
- If scope shifts mid-iteration, update this file and FEATURES.md together so they don't drift apart.
- Any real architectural choice made while executing an iteration still gets its own ADR, per CLAUDE.md's working conventions — iteration boundaries don't change that rule.
