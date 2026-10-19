# 0019. Local production credentials, automated migrations, and a startup environment guard

Date: 2026-10-15
Status: Accepted

## Context

On 2026-10-14/15, the live Vercel deployment started throwing a generic server error on every page. The cause: [ADR 0018](0018-patrols-as-database-rows.md)'s enum→table migration for patrols was applied to the `development` Neon branch — everything this project's tooling touches by default — and never applied to the `production` branch Vercel actually serves from. [ADR 0014](0014-separate-dev-test-database-branch.md) named this exact risk in its own Consequences section ("Skipping the second step means production silently falls behind the code that expects the new schema — worth catching before it ships") and [Requirement 6](../requirements/infrastructure-deployment/06-test-database-isolation.md) left verifying Vercel's Production configuration as an unchecked, manual acceptance criterion. Neither caught the actual gap, which was the migration itself never being applied to `production` — a manual step nobody remembered.

[Requirement 11](../requirements/infrastructure-deployment/11-production-deployment-pipeline.md) asks for this to become structurally impossible to forget, not something to be more careful about next time.

## Decision

Three changes, together:

**Production migrations run automatically, as part of the deploy that needs them.** `vercel.json`'s `buildCommand` becomes conditional on `VERCEL_ENV`: `prisma migrate deploy && next build` for a real Production build, plain `next build` otherwise (Preview has never had production-equivalent `DATABASE_URL`/`DIRECT_URL` configured, so running `migrate deploy` unconditionally would break every Preview build instead). This is the direct fix — a schema change now ships to `production` in the same push that ships the code expecting it, with no separate manual action to remember.

**A startup guard (`lib/db-environment-guard.ts`) checks that the resolved `DATABASE_URL`'s hostname actually matches where the process is running**, before `lib/db.ts` constructs the Prisma client. A Neon host carries no credentials (the user/password are a separate part of the connection string), so two host values are committed in plain text as `NEON_DEVELOPMENT_HOST`/`NEON_PRODUCTION_HOST`. If `VERCEL_ENV === "production"` and the host doesn't match production's, or the reverse (a non-production process somehow pointed at production's host), the process throws before serving a single request. This catches the *connection-string* version of this mistake automatically; the `buildCommand` change above catches the *schema* version. Neither alone would have caught 2026-10-14's actual incident (the connection string was correct the whole time — only the schema was stale), which is why both exist.

**Production's connection strings may now also live locally, in a gitignored `.env.migrate-production.local`** — a deliberate, narrow reversal of [ADR 0005](0005-env-based-secrets-management.md)'s original stance that production secrets should only ever exist in Vercel's dashboard. That stance didn't cause this incident and keeping it wouldn't have prevented it, but it does block the one thing that would have let someone fix this from a terminal in the moment: a human-confirmed local escape hatch (`npm run migrate:production`, `scripts/migrate-production.js`) that loads this file via Node's `--env-file` flag, prints the target host and pending-migration count, and requires typing the literal word `PRODUCTION` before running `prisma migrate deploy`. The file is covered by the existing `.env*.local` gitignore pattern; nothing about ADR 0005's actual git-exclusion decision changes, only the "never touches this project at all" consequence does.

The filename is deliberately *not* `.env.production.local`, even though that reads more naturally and still matches the gitignore pattern. Next.js auto-loads a file with that exact name during any local `next build`/`next start` (`.env.{NODE_ENV}.local` is one of its built-in conventions), which would silently point an ordinary local build at production the moment that file exists on disk — confirmed the hard way during this rollout, when a local `npm run build` picked it up and the guard above correctly refused to start rather than quietly connecting. `.env.migrate-production.local` isn't a name Next recognizes, so only this one explicit `--env-file` invocation ever reads it.

No application data (`Campout`/`Menu`/`Meal`/`Dish`/`Ingredient`/`Review`/`MealFrameworkException`) crosses branches by any of this, in either direction — that part of ADR 0014's isolation guarantee is unchanged and this ADR doesn't touch it. The only thing that ends up identical in both branches is schema and whatever seed `INSERT` statements a migration itself contains (e.g. ADR 0018's five patrol rows) — the same committed migration file, run independently against each branch by the mechanism above, not a copy step between two already-existing databases.

## Alternatives Considered

- **A separate CI/CD pipeline (GitHub Actions) running `prisma migrate deploy` before triggering a Vercel deploy**: would work, but [ADR 0004](0004-vercel-deployment-via-github.md) already decided against a separate CI/CD system for a reason that still holds — Vercel's own `buildCommand` achieves the same outcome with zero new infrastructure to maintain.
- **Pulling production credentials on demand via `vercel env pull --environment=production` instead of a static local file**: avoids a file that can drift from Vercel's dashboard if credentials are ever rotated, at the cost of requiring the Vercel CLI to be authenticated locally every time. Rejected for now as more moving parts than the actual problem calls for; worth revisiting if the static file becomes a real maintenance burden.
- **Hard-failing immediately if `NEON_PRODUCTION_HOST` is left as its placeholder value, instead of warning**: rejected specifically to avoid this very change causing a second outage during rollout, before the real production host has been filled in locally and verified.

## Consequences

- `lib/db-environment-guard.ts`'s `NEON_PRODUCTION_HOST` started as a placeholder (`"REPLACE_WITH_PRODUCTION_NEON_HOST"`) and was filled in with the real host as part of this rollout — until that happened, a deploy to `main` would have gotten a console warning instead of the guard's real protection, by design (see Alternatives).
- `.env.migrate-production.local` must be created by hand, out-of-band (same as `.env` itself always has been, per ADR 0005) — nothing in this repository can populate it, by design.
- Vercel's Project Settings → Build & Development Settings must not have an explicit Build Command override already set, or it will silently take precedence over `vercel.json` and this ADR's automation won't run. This is a one-time check, not an ongoing manual step.
- `package.json` gains its first `engines.node` pin (`>=20.6.0`), made necessary by `migrate:production`'s use of Node's `--env-file` flag.

## Related

- [Requirement 11 - Production Deployment Pipeline & Environment Isolation](../requirements/infrastructure-deployment/11-production-deployment-pipeline.md)
- [ADR 0005 - Secrets kept in gitignored env files](0005-env-based-secrets-management.md) — partially superseded; see that ADR's Status line.
- [ADR 0014 - Separate Neon branch for development and testing](0014-separate-dev-test-database-branch.md) — partially superseded; see that ADR's Status line. This ADR's branch-isolation decision itself is unchanged.
- [ADR 0004 - Vercel deployment via GitHub](0004-vercel-deployment-via-github.md) — the `buildCommand` change stays inside this ADR's "no separate CI/CD system" decision rather than replacing it.
- [ADR 0018 - Patrols become admin-managed database rows, not a fixed enum](0018-patrols-as-database-rows.md) — the migration whose missed production deploy is this ADR's direct motivation.
