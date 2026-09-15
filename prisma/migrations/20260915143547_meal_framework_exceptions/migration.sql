-- CreateTable
CREATE TABLE "MealFrameworkException" (
    "id" TEXT NOT NULL,
    "campoutId" TEXT NOT NULL,
    "patrol" "Patrol",
    "occasion" "MealOccasion" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealFrameworkException_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MealFrameworkException" ADD CONSTRAINT "MealFrameworkException_campoutId_fkey" FOREIGN KEY ("campoutId") REFERENCES "Campout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
