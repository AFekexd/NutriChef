-- CreateTable
CREATE TABLE "RecipeRecommendationsCache" (
    "cacheId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ingredientsHash" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "minMatchPercentage" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "allergies" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeRecommendationsCache_pkey" PRIMARY KEY ("cacheId")
);

-- CreateIndex
CREATE INDEX "RecipeRecommendationsCache_userId_ingredientsHash_idx" ON "RecipeRecommendationsCache"("userId", "ingredientsHash");

-- CreateIndex
CREATE INDEX "RecipeRecommendationsCache_expiresAt_idx" ON "RecipeRecommendationsCache"("expiresAt");
