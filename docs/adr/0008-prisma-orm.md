# 0008. Prisma as the ORM, with the binary query engine

Date: 2026-09-14
Status: Accepted

## Context

[ADR 0003](0003-postgres-database-via-neon.md) chose Postgres via Neon but left the migration/query tooling as "not yet decided." Implementing Iteration 1 required picking one.

Separately, the development machine is Windows on ARM64. Prisma's default "library" query engine loads as an in-process native Node addon (`query_engine-windows.dll.node`), and Prisma does not ship a native Windows-ARM64 build of it — Node on ARM64 cannot load an x64 native addon in-process (unlike spawning a separate x64 executable, which Windows can emulate). This surfaced immediately as `prisma generate`/`prisma migrate` failing with "is not a valid Win32 application."

## Decision

Use **Prisma** (schema.prisma + Prisma Migrate + `@prisma/client`) as the ORM, pinned to the 6.x line (6.19.3 at time of writing — see Alternatives for why not the 7.x/8.x line). In `prisma/schema.prisma`'s `generator client` block, set `engineType = "binary"` so the query engine runs as a separate spawned process (like the Schema Engine already does) instead of an in-process native addon — this works under Windows' x64 emulation on ARM64, whereas the default in-process library engine does not.

## Alternatives Considered

- **Drizzle**: a comparable lighter-weight option; no strong reason favored Prisma beyond it being the more common default with broader Next.js ecosystem examples. Revisit only if Prisma becomes a real friction point.
- **Prisma 7.x (the version `npm install prisma@latest` resolves to)**: install failed outright on this machine — a new dependency chain (`@prisma/composer` and friends) pulls in `workerd` (Cloudflare's Workers runtime), which has no win32-arm64 build at all, so `npm install` itself errored before any schema.prisma existed. Pinning to the 6.x line avoided this entirely.
- **Prisma Driver Adapters** (`@prisma/adapter-neon` + `driverAdapters`/`queryCompiler` preview features): Prisma's own JS/WASM-based answer to exactly this class of native-binary problem (also relevant for edge runtimes). Tried first, then dropped once `engineType = "binary"` alone proved sufficient — it's a smaller change with fewer moving parts (no extra `@neondatabase/serverless`/`ws` dependencies) for a project that isn't targeting edge runtimes.

## Consequences

- `prisma/schema.prisma` is the single source of truth for the data model; `npx prisma migrate dev` generates and applies migrations against `DIRECT_URL` (see [ADR 0003](0003-postgres-database-via-neon.md)'s pooled-vs-direct note).
- The binary engine type means one extra spawned process per query engine instance rather than an in-process addon — negligible at troop scale, but worth knowing if this ever needs to run somewhere with process-spawn restrictions (some serverless/edge sandboxes forbid it). If that becomes relevant, driver adapters are the documented fallback.
- Pinning to Prisma 6.x is a deliberate, temporary constraint tied to this machine's architecture and the workerd install failure — worth re-checking whether 7.x/8.x has fixed the win32-arm64 install path before assuming this pin needs to stay forever.
