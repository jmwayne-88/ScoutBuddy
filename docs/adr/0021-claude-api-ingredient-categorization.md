# 0021. Ingredient grocery categorization via the Claude API, cached per name

Date: 2026-10-15
Status: Accepted

## Context

[Requirement 12](../requirements/12-menu-print-preview.md)'s shopping list needs to group ingredients the way a grocery store would (Produce, Meat & Protein, Dairy & Eggs, ...) without the Patrol Leader ever tagging a category by hand. A hand-maintained keyword list was the original default proposal in the requirements doc, but after reviewing current model pricing, the user chose real AI classification instead — this is this app's first call to any external AI service, and its first secret that isn't a database credential.

## Decision

**Classify each distinct ingredient name once, via a single Claude API call (model `claude-haiku-5-5`), and cache the result on the `Ingredient` row.** `lib/ingredient-categorization.ts`'s `classifyIngredientWithClaude` sends one non-streaming request — a short system prompt listing the 10 fixed categories, the ingredient name as the only user message, `max_tokens: 20` — and validates the reply is an exact match to one of the known category enum values. `addIngredient` (`app/(app)/menus/[id]/actions.ts`) checks for a prior `Ingredient` row with the same name (case-insensitive) and a non-null category *before* ever calling the API, reusing that category instead — so "salt" is classified once across the entire app's lifetime, not once per dish it's added to.

**Any failure falls back to a small built-in keyword heuristic (`classifyIngredientFallback`), never to a blocked save or a permanently uncategorized row.** A missing/invalid `ANTHROPIC_API_KEY`, a network error, a rate limit, or a reply that doesn't exactly match a known category all take the same path: catch, fall back, keep going. This was also how this feature was verified in the environment it was built in — there was no real API key available during development, so every verification exercised the fallback path (confirmed correct classification, confirmed the cache lookup takes precedence over a fresh classification via a seeded-row test) rather than a live model response. The live path is unverified beyond type-checking and the SDK call's shape until a real key is added and exercised.

**The reply is validated as plain text against the enum, not via `output_config.format`'s structured-output feature**, specifically because there was no way to verify a real structured-output response shape without a working API key in the build environment. This is a narrower, more conservative implementation than the requirements doc originally sketched, worth revisiting once live responses can actually be observed.

**`Ingredient.category` is nullable, with no backfill migration for pre-existing rows.** Null is treated identically to `OTHER` everywhere it's displayed — a pre-existing ingredient from before this column existed just shows under "Other" until it's ever re-saved. The only pre-existing data at the time this shipped was this project's own test fixtures; a real backfill script was explicitly scoped out of the initial build rather than silently skipped (see Requirement 12's doc).

## Alternatives Considered

- **A hand-maintained keyword/lookup heuristic as the primary mechanism** (the requirements doc's original default): rejected once the user compared it against real classification pricing — a call this small and cheap on Haiku 5.5 handles unusual/compound ingredient names far better than substring matching ever could, for a cost low enough to be irrelevant at this app's scale, with no word list for anyone to keep extending by hand. The heuristic survives only as the failure-mode fallback.
- **`output_config.format` structured outputs**: the more correct long-term choice, deferred specifically because it couldn't be verified against a real response without API access in this environment (see Decision above).
- **A separate cache table keyed by normalized ingredient name**, instead of querying existing `Ingredient` rows directly: rejected as an unnecessary extra model for a lookup the existing table already answers correctly.
- **A one-time backfill script for pre-existing ingredients**: deferred, not rejected — there's real data to backfill eventually, but not enough today to justify building and maintaining a script for it now.

## Consequences

- A new secret, `ANTHROPIC_API_KEY`, needs adding to local `.env` and to Vercel's environment variables for every environment that runs this code path — a different *kind* of secret than the Neon database credentials [ADR 0005](0005-env-based-secrets-management.md) originally covered, though the same gitignored-env-file handling applies.
- `addIngredient` now awaits a network call (or, in the common case, a cheap cache-hit DB query) before completing — a few hundred milliseconds added to adding a brand-new ingredient name, effectively nothing for a repeat of one already classified.
- Nobody tags, corrects, or overrides a category through the UI today — if the model (or its fallback) gets something wrong, there's no way to fix it except re-adding the ingredient under a different exact name. Worth a follow-up if miscategorization turns out to matter in practice.
- This app now has a second category of external dependency (an AI service call) alongside its one existing one (the Neon database) — worth keeping in mind if this app's "no background services" framing (ADR 0001/0002) ever gets revisited.

## Related

- [Requirement 12 - Menu Print Preview & Shopping List](../requirements/12-menu-print-preview.md)
- [ADR 0005 - Secrets kept in gitignored env files](0005-env-based-secrets-management.md) — gains a second kind of secret.
- [ADR 0020 - Print view route group and pagination](0020-print-view-route-group-and-pagination.md) — the other new piece of Requirement 12, built alongside this one.
