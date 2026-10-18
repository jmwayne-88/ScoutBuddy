-- Hand-written, applied via `prisma migrate deploy` rather than
-- `prisma migrate dev`, for the same reason documented in
-- 20261015153840_ingredient_category/migration.sql: `migrate dev`'s
-- shadow-database checksum validation trips over this project's migration
-- history and refuses to proceed without a full `migrate reset`, which
-- would drop all dev data. `migrate deploy` doesn't run that check.
--
-- Purely additive: one new nullable column. No backfill, no data loss
-- possible -- every existing patrol gets icon = NULL, which Requirement
-- 18 treats as "no icon selected" (falls back to the plain color
-- treatment it already has today).

-- AlterTable
ALTER TABLE "Patrol" ADD COLUMN "icon" TEXT;
