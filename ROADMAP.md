# ScoutBuddy — Delivery Roadmap

This breaks [FEATURES.md](FEATURES.md) into small, sequenced iterations, each one a complete, usable increment rather than a partial slice of everything. The order follows dependency and value: each iteration proves something the next one needs, and each is worth shipping on its own even if work stopped right after it.

## Sequencing rationale

- The full approval loop (submit → review → approve/reject → revise) has to work for *one* patrol before it's worth building for four — that's where the real risk is, not the patrol count.
- Multiple patrols matter more than multiple campouts, since a single real campout already needs all four.
- Meal-framework variation only matters once there's a real menu to vary.
- Polish and hardening come last, once real usage (even just yours, testing it) has surfaced what actually needs tightening.

## Iteration 1 — Core Approval Loop (single patrol, single campout)

**Goal:** prove the entire workflow end-to-end for one patrol on one campout.

Full requirements and acceptance criteria: [docs/requirements/01-core-approval-loop.md](docs/requirements/01-core-approval-loop.md)

**Value delivered:** a real menu can go through the entire approval cycle in the app instead of over text and paper.

## Iteration 2 — All Four Patrols + Visual Identity

**Goal:** scale the core loop to how a campout actually works.

Full requirements and acceptance criteria: [docs/requirements/02-four-patrols-and-visual-identity.md](docs/requirements/02-four-patrols-and-visual-identity.md)

**Value delivered:** an ASPL can run a whole campout's menu assignment and review, not just a single-patrol demo.

## Iteration 3 — Multiple Campouts

**Goal:** support planning across a term, not just one campout at a time.

Full requirements and acceptance criteria: [docs/requirements/03-multiple-campouts.md](docs/requirements/03-multiple-campouts.md)

**Value delivered:** the tool becomes usable term-over-term instead of single-use.

## Iteration 4 — Meal-Framework Variation

**Goal:** give the ASPL the flexibility real campouts need (e.g., no Friday Cracker Barrel on a campout with a late Friday arrival).

Full requirements and acceptance criteria: [docs/requirements/04-meal-framework-variation.md](docs/requirements/04-meal-framework-variation.md) (see also [ADR 0006](docs/adr/0006-structured-meal-framework-variation.md))

**Value delivered:** menus reflect real campout logistics instead of forcing every campout through an identical framework.

## Iteration 5 — Workflow Hardening & Polish

**Goal:** close the gaps that only show up once the loop gets used for real.

Full requirements and acceptance criteria: [docs/requirements/05-workflow-hardening-and-polish.md](docs/requirements/05-workflow-hardening-and-polish.md)

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
