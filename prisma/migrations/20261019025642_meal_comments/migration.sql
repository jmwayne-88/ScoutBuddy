-- AlterEnum
ALTER TYPE "CommentTargetType" ADD VALUE 'MEAL';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN "occasion" "MealOccasion";
