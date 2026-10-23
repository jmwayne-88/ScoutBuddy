# 0036. Per-unit data isolation: a `unitId` on every table, Row-Level Security under a dedicated role, and same-unit triggers

Date: 2026-10-23
Status: Accepted.

## Context

[ADR 0035](0035-units-memberships-and-invitations.md) gave ScoutBuddy units, memberships, and an active unit per session, but troop data stayed global: every `Campout`, `Patrol`, `Menu`, and comment was visible to every unit. That is why ADR 0035 kept unit creation switched off.

[Requirement 27](../requirements/multi-tenancy/27-multi-tenant-unit-isolation.md) settles the *shape* of the fix: one shared database, an indexed `unitId` on every unit-scoped table, and at least one enforcement layer below application code. It leaves two choices to this ADR: the column layout, and RLS versus a compile-time-enforced query layer.

Two facts about this environment shaped the answer:

- **Neon's `neondb_owner` has `BYPASSRLS`.** The app and migrations both connect as that role, so Row-Level Security policies alone would bind nothing. That holds even with `FORCE ROW LEVEL SECURITY`, which doesn't override `BYPASSRLS`.
- **Foreign-key checks ignore RLS.** Even with policies in force, an insert could point a Unit A menu at a Unit B patrol by id, and Postgres would accept it.

## Decision

**Column layout: a direct `unitId` on all eleven troop-data tables**, not only on roots with children inheriting through joins. The tables are `Patrol`, `Campout`, `CampoutUploadBatch`, `Menu`, `Meal`, `Dish`, `Ingredient`, `Review`, `Comment`, `CommentActivity`, and `MealFrameworkException`. Each `unitId` column:

- is `NOT NULL`, with a foreign key to `Unit` that has `ON DELETE RESTRICT`;
- is indexed (REQ-27.5);
- defaults to `scoutbuddy_current_unit_id()`, which reads the transaction's `app.current_unit_id` setting.

App code never passes `unitId`. The database fills it in from the unit context, and with no context the default is NULL and the insert fails. A direct column keeps every RLS policy a single indexed equality with no joins. `MealOccasion`, `Council`, and `District` stay global (REQ-27.2).

**Enforcement below the app: RLS under a dedicated role.** Migration `20261023210000_unit_isolation` adds three things.

- **A restricted role.** It creates `scoutbuddy_unit` (`NOLOGIN NOBYPASSRLS`), grants it to the migrating role with `SET TRUE, INHERIT FALSE`, and gives it DML on the eleven tables only.
- **RLS policies.** RLS is enabled on those eleven tables, each with one `unit_isolation` policy: `"unitId" = scoutbuddy_current_unit_id()` for both `USING` and `WITH CHECK`. A row is visible and writable only inside its own unit, and no context means no rows.
- **The client that uses them.** `lib/unit-db.ts`'s `unitDb(unitId)` is a Prisma client extension. It wraps every query in a short transaction that first runs `set_config('role', 'scoutbuddy_unit', true)` and `set_config('app.current_unit_id', <unit>, true)`. Both settings are transaction-local, so nothing leaks onto the pooled connection. `$unitTransaction(fn)` does the same for several statements that must land together.

**Same-unit triggers (REQ-27.3).** `scoutbuddy_assert_same_unit()` is a `BEFORE INSERT OR UPDATE` trigger on every reference between unit-scoped rows. That covers 14 of them, plus `UnitMembership.patrolId` and `UnitInvitation.patrolId`. It rejects a reference whose parent is in a different unit, or is invisible because RLS hides it. The error names only the table and column, never the other unit's data (REQ-27.13).

Triggers were chosen over composite `(id, unitId)` foreign keys for two reasons:

- Several of these references are nullable `ON DELETE SET NULL`. A composite key would null `unitId` too.
- Composite keys would make Prisma's relation fields overlap across models.

A second trigger, `scoutbuddy_forbid_unit_change()`, makes a row's `unitId` fixed for life. Moving one row would strand its children in the old unit.

**Application layer.**

- **Getting at data.** `lib/session.ts`'s `getUnitScope()`/`requireUnitScope()` return `{ actor, unitId, db }`, with `db` bound to the active unit. That's now the only way pages, Server Actions, and route handlers reach troop data. The plain `db` client is left for the identity layer: auth, units, memberships, and invitations.
- **The actor.** `Actor` now carries `unitId`.
- **Permissions.** `lib/permissions.ts`'s menu-level checks also require `inActorUnit(actor, resource)` (REQ-27.11). A right role in the wrong unit is rejected even before RLS gets involved.

**Deliberately outside RLS.** `Unit`, `UnitMembership`, `UnitInvitation`, `UnitEvent`, `Council`, `District`, and the Better Auth tables stay outside RLS. `lib/session.ts` reads them to decide *which* unit a request is in, before any unit context exists. Those queries filter by `unitId` explicitly, as ADR 0035 already did.

**Backfill (REQ-27.19).** All existing rows go to the one unit ADR 0035's migration created. That's the user's chosen placeholder identity, Troop 8 (Boys), to be corrected through Requirement 38. If there isn't exactly one unit when troop data exists, the migration refuses to run rather than guess.

**Unit export and deletion (REQ-27.15).** `lib/unit-data.ts` exports the active unit as flat JSON tables at `/unit/export`, a Route Handler, and deletes a whole unit from `/unit`. Both are ASPL-only and need a passkey session; deletion also requires typing the unit's name. Deletion runs in two steps:

1. Inside the unit's scoped transaction it deletes the troop data, leaves first. These deletes also carry explicit `unitId` filters, so the most destructive operation doesn't rely on one layer.
2. It deletes the `Unit` row, which cascades to its memberships, invitations, and event log, and records `UNIT_DELETED` in `AuthEvent`.

**Tests (REQ-27.6).** `lib/unit-isolation.test.ts` runs in `npm test` against the development branch only, and refuses any other host. It seeds 24 units, then checks:

- schema invariants: every `unitId` table is either scoped or one of the named identity tables, every scoped table has RLS, and every `unitId` is the leading column of an index;
- the data layer under a mismatched unit;
- every Server Action that takes an id, invoked as Unit A with Unit B's ids, after which Unit B's data must be unchanged;
- that no row anywhere references across units.

A mutation check, running the unit client as the owner role, fails 6 of its tests. The Server Action attacks that still pass in that run are stopped by the app-level checks alone, which is the defense in depth working as designed.

## Alternatives Considered

- **A compile-time-enforced query layer instead of RLS.** One option was a wrapper that always injects `where: { unitId }`. It's rejected as the *only* layer because it stays one forgotten code path, or one raw query, away from a leak. The `UnitScope` client gives most of the same ergonomics anyway.
- **`FORCE ROW LEVEL SECURITY` on the owner role.** Rejected: `BYPASSRLS` wins, so it would have done nothing on Neon.
- **A separate login role in its own connection pool.** It would avoid the per-query `SET ROLE`, but needs a second credential in every environment ([ADR 0005](0005-env-based-secrets-management.md)) and doubles connections. `SET LOCAL ROLE` gets the same guarantee with the existing credential.
- **Composite `(id, unitId)` foreign keys for REQ-27.3.** Rejected above, because of the nullable `SET NULL` references and Prisma relation overlap.
- **The bare `NULLIF(current_setting(...))` expression as the column default.** Rejected because Prisma can't introspect that expression, so every future `migrate dev` would report permanent drift. Wrapping it in `scoutbuddy_current_unit_id()` introspects cleanly.
- **Database- or schema-per-unit.** Already rejected by Requirement 27's Architecture Validation.

## Consequences

- **Every unit-scoped query costs a small transaction.** That's `BEGIN`, `set_config`, the query, and `COMMIT`, about three extra round trips. Measured from a local machine to Neon us-east-2: ~40 ms for a plain query, ~400 ms for a scoped one. In production that scales with Vercel-to-Neon latency, which is far lower within the region. Pages that read several things can share one transaction with `$unitTransaction`; the menu page does. If a profile ever shows this mattering, the next step is batching more page reads that way, not weakening the scoping.
- **Don't call `$transaction` on a unit client.** The per-query wrapper can't nest inside it. Use `$unitTransaction`, and keep `redirect()` out of its callback, because it throws and would roll the transaction back.
- **New tables need a decision.** A table that gains `unitId` must either join the scoped list (RLS policy, grant, triggers, index) or be added to the test's identity-table list on purpose. `lib/unit-isolation.test.ts` fails until one of those happens.
- **`npm test` now needs the development database** for this one suite. It skips when there's no `DATABASE_URL`.
- **Unit creation is no longer blocked by data isolation.** It still has no UI, and who may create a unit is Requirement 38's question.
- **The `/menus/[id]/print` page now requires a signed-in unit scope.** Before this, it had no gate at all.

## Related

- [ADR 0035](0035-units-memberships-and-invitations.md): the units, memberships, and active-unit resolution this builds on.
- [ADR 0003](0003-postgres-database-via-neon.md), [ADR 0014](0014-separate-dev-test-database-branch.md): Neon and the development branch the isolation suite runs against.
- [ADR 0018](0018-patrols-as-database-rows.md): the hand-ordered backfill migration style.
- [ADR 0012](0012-meal-framework-exceptions.md): the manual-cascade (RESTRICT) style unit deletion follows.
- [Requirement 27](../requirements/multi-tenancy/27-multi-tenant-unit-isolation.md), [Requirement 38](../requirements/38-platform-admin-cross-tenant-support.md).
