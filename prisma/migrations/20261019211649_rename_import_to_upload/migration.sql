-- Renames only, not drop+recreate -- preserves any existing data (the
-- default diff Prisma generates for a renamed column/table is a
-- destructive drop+add; this is hand-edited to use RENAME instead).
ALTER TABLE "Campout" RENAME COLUMN "lastImportedAt" TO "lastUploadedAt";
ALTER TABLE "Campout" RENAME COLUMN "lastImportedFrom" TO "lastUploadedFrom";

ALTER TABLE "CampoutImportBatch" RENAME TO "CampoutUploadBatch";
ALTER TABLE "CampoutUploadBatch" RENAME CONSTRAINT "CampoutImportBatch_pkey" TO "CampoutUploadBatch_pkey";
