-- Hand-written (see note in migration_dev_notes below) because
-- `prisma migrate dev`'s checksum validation trips over this project's
-- migration history (a rolled-back then successfully-reapplied
-- "20261014142438_patrols_table" entry) and refuses to proceed without a
-- full `migrate reset` -- which would drop all dev data. The actual applied
-- migration's checksum matches its file exactly (verified directly against
-- _prisma_migrations); this is a `migrate dev`-specific quirk, not a real
-- data-integrity problem. Applying this file via `prisma migrate deploy`
-- (which doesn't run that same check) avoids it entirely.
--
-- Purely additive: a new enum and a new nullable column. No backfill, no
-- data loss possible.

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('PRODUCE', 'MEAT_PROTEIN', 'DAIRY_EGGS', 'BREAD_BAKERY', 'PANTRY_DRY_GOODS', 'CONDIMENTS_SAUCES', 'SPICES_SEASONINGS', 'FROZEN', 'BEVERAGES', 'OTHER');

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN "category" "IngredientCategory";
