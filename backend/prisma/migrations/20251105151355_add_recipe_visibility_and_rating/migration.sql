-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RecipeRating" (
    "recipeRatingId" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeRating_pkey" PRIMARY KEY ("recipeRatingId")
);

-- CreateIndex
CREATE INDEX "RecipeRating_recipeId_idx" ON "RecipeRating"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeRating_userId_idx" ON "RecipeRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeRating_recipeId_userId_key" ON "RecipeRating"("recipeId", "userId");

-- AddForeignKey
ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("recipeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeRating" ADD CONSTRAINT "RecipeRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
