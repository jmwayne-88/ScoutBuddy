-- AlterTable
ALTER TABLE "Campout" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "lastImportedAt" TIMESTAMP(3),
ADD COLUMN     "lastImportedFrom" TEXT;

-- CreateTable
CREATE TABLE "CampoutImportBatch" (
    "id" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidates" JSONB NOT NULL,

    CONSTRAINT "CampoutImportBatch_pkey" PRIMARY KEY ("id")
);
