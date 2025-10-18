-- AlterTable
ALTER TABLE "GroceryListItem" ADD COLUMN     "isPurchased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recommendedUnit" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'unit';

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "averagePrice" DOUBLE PRECISION,
ADD COLUMN     "commonUnits" JSONB;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "aiDetected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetCalories" DOUBLE PRECISION,
ADD COLUMN     "targetMacros" JSONB;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "cookTime" INTEGER,
ADD COLUMN     "cuisineType" TEXT,
ADD COLUMN     "dietaryTags" JSONB,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prepTime" INTEGER,
ADD COLUMN     "servings" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "healthGoals" JSONB;

-- CreateTable
CREATE TABLE "AIGeneratedRecipe" (
    "aiRecipeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "generatedRecipe" JSONB NOT NULL,
    "wasAccepted" BOOLEAN NOT NULL DEFAULT false,
    "recipeId" TEXT,
    "aiModel" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "generationTime" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGeneratedRecipe_pkey" PRIMARY KEY ("aiRecipeId")
);

-- CreateTable
CREATE TABLE "PortionEstimate" (
    "portionEstimateId" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "recommendedPurchaseQty" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "algorithm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortionEstimate_pkey" PRIMARY KEY ("portionEstimateId")
);

-- CreateTable
CREATE TABLE "InventoryImageUpload" (
    "uploadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "detectedItems" JSONB NOT NULL,
    "aiService" TEXT NOT NULL,
    "processingTime" DOUBLE PRECISION,
    "wasAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImageUpload_pkey" PRIMARY KEY ("uploadId")
);

-- CreateTable
CREATE TABLE "NutritionAnalysis" (
    "analysisId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "nutritionData" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NutritionAnalysis_pkey" PRIMARY KEY ("analysisId")
);

-- CreateIndex
CREATE INDEX "AIGeneratedRecipe_userId_idx" ON "AIGeneratedRecipe"("userId");

-- CreateIndex
CREATE INDEX "AIGeneratedRecipe_createdAt_idx" ON "AIGeneratedRecipe"("createdAt");

-- CreateIndex
CREATE INDEX "PortionEstimate_inventoryItemId_idx" ON "PortionEstimate"("inventoryItemId");

-- CreateIndex
CREATE INDEX "InventoryImageUpload_userId_idx" ON "InventoryImageUpload"("userId");

-- CreateIndex
CREATE INDEX "InventoryImageUpload_createdAt_idx" ON "InventoryImageUpload"("createdAt");

-- CreateIndex
CREATE INDEX "NutritionAnalysis_itemName_idx" ON "NutritionAnalysis"("itemName");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionAnalysis_itemName_quantity_unit_key" ON "NutritionAnalysis"("itemName", "quantity", "unit");

-- AddForeignKey
ALTER TABLE "AIGeneratedRecipe" ADD CONSTRAINT "AIGeneratedRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
