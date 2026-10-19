-- CreateEnum
CREATE TYPE "CommentActorRole" AS ENUM ('ASPL', 'PATROL_LEADER');

-- CreateEnum
CREATE TYPE "CommentTargetType" AS ENUM ('MENU', 'DISH', 'INGREDIENT');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "CommentActivityAction" AS ENUM ('CREATED', 'REPLIED', 'ASSIGNED', 'REASSIGNED', 'RESOLVED', 'REOPENED', 'DELETED');

-- DropForeignKey
ALTER TABLE "MealFrameworkException" DROP CONSTRAINT "MealFrameworkException_patrolId_fkey";

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "targetType" "CommentTargetType" NOT NULL,
    "dishId" TEXT,
    "ingredientId" TEXT,
    "targetLabel" TEXT,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "authorRole" "CommentActorRole" NOT NULL,
    "authorPatrolId" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeRole" "CommentActorRole",
    "assigneePatrolId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByRole" "CommentActorRole",
    "resolvedByPatrolId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedByRole" "CommentActorRole",
    "deletedByPatrolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentActivity" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "action" "CommentActivityAction" NOT NULL,
    "actorRole" "CommentActorRole" NOT NULL,
    "actorPatrolId" TEXT,
    "targetSummary" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentActivity" ADD CONSTRAINT "CommentActivity_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentActivity" ADD CONSTRAINT "CommentActivity_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealFrameworkException" ADD CONSTRAINT "MealFrameworkException_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

