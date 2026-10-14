-- Replace the fixed "Patrol" enum with a real, admin-manageable table.
-- Hand-written (not auto-generated) because the naive enum->FK diff has no
-- way to know "seed rows for the existing enum values, then backfill" --
-- left to Prisma's own diffing, this would just drop data. See ADR 0018
-- and docs/requirements/08-manage-patrols.md.
--
-- The new table is created as "Patrol_new" and renamed to "Patrol" only
-- after the old enum type (also named "Patrol") is dropped -- Postgres
-- won't allow a table and an enum type to share a name at the same time,
-- since CREATE TABLE implicitly creates a row type of the same name.

-- CreateEnum
CREATE TYPE "PatrolType" AS ENUM ('YOUTH', 'ADULT');

-- CreateTable (temporary name, see note above)
CREATE TABLE "Patrol_new" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "PatrolType" NOT NULL DEFAULT 'YOUTH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patrol_new_pkey" PRIMARY KEY ("id")
);

-- Seed rows for the five patrols that exist today, preserving their current
-- name, color, and order (source: lib/constants.ts + lib/colors.ts).
INSERT INTO "Patrol_new" ("id", "name", "color", "order", "type", "isActive", "createdAt") VALUES
    ('patrol_eagle',      'Eagle Patrol',      '#1d4ed8', 0, 'YOUTH', true, CURRENT_TIMESTAMP),
    ('patrol_puma',       'Puma Patrol',       '#d4af37', 1, 'YOUTH', true, CURRENT_TIMESTAMP),
    ('patrol_raven',      'Raven Patrol',      '#4c1d6b', 2, 'YOUTH', true, CURRENT_TIMESTAMP),
    ('patrol_silver_fox', 'Silver Fox Patrol', '#9ca3af', 3, 'YOUTH', true, CURRENT_TIMESTAMP),
    ('patrol_joe',        'Joe Patrol',        '#8b4513', 4, 'YOUTH', true, CURRENT_TIMESTAMP);

-- Add nullable patrolId columns to backfill before making Menu's required.
ALTER TABLE "Menu" ADD COLUMN "patrolId" TEXT;
ALTER TABLE "MealFrameworkException" ADD COLUMN "patrolId" TEXT;

-- Backfill: map each old enum value to its new Patrol row. A NULL "patrol"
-- on MealFrameworkException meant "all patrols" and stays NULL here too.
UPDATE "Menu" SET "patrolId" = CASE "patrol"
    WHEN 'EAGLE' THEN 'patrol_eagle'
    WHEN 'PUMA' THEN 'patrol_puma'
    WHEN 'RAVEN' THEN 'patrol_raven'
    WHEN 'SILVER_FOX' THEN 'patrol_silver_fox'
    WHEN 'JOE' THEN 'patrol_joe'
END;

UPDATE "MealFrameworkException" SET "patrolId" = CASE "patrol"
    WHEN 'EAGLE' THEN 'patrol_eagle'
    WHEN 'PUMA' THEN 'patrol_puma'
    WHEN 'RAVEN' THEN 'patrol_raven'
    WHEN 'SILVER_FOX' THEN 'patrol_silver_fox'
    WHEN 'JOE' THEN 'patrol_joe'
    ELSE NULL
END;

-- Now that every Menu row has a patrolId, make it required.
ALTER TABLE "Menu" ALTER COLUMN "patrolId" SET NOT NULL;

-- Drop the old enum-backed unique index and columns, then the enum type
-- itself -- now safe, since nothing references it any more.
DROP INDEX "Menu_campoutId_patrol_key";
ALTER TABLE "Menu" DROP COLUMN "patrol";
ALTER TABLE "MealFrameworkException" DROP COLUMN "patrol";
DROP TYPE "Patrol";

-- The name "Patrol" is free now -- rename the real table into place.
ALTER TABLE "Patrol_new" RENAME TO "Patrol";
ALTER TABLE "Patrol" RENAME CONSTRAINT "Patrol_new_pkey" TO "Patrol_pkey";

-- Recreate the unique constraint against the new column, and add FKs.
CREATE UNIQUE INDEX "Menu_campoutId_patrolId_key" ON "Menu"("campoutId", "patrolId");

ALTER TABLE "Menu" ADD CONSTRAINT "Menu_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealFrameworkException" ADD CONSTRAINT "MealFrameworkException_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
