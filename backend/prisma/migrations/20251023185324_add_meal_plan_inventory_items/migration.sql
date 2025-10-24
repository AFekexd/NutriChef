-- DropForeignKey
ALTER TABLE "public"."MealPlanRecipe" DROP CONSTRAINT "MealPlanRecipe_mealPlanId_fkey";

-- CreateTable
CREATE TABLE "MealPlanInventoryItem" (
    "mealPlanInventoryItemId" UUID NOT NULL,
    "mealPlanId" UUID NOT NULL,
    "inventoryItemId" UUID NOT NULL,
    "quantityUsed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlanInventoryItem_pkey" PRIMARY KEY ("mealPlanInventoryItemId")
);

-- AddForeignKey
ALTER TABLE "MealPlanRecipe" ADD CONSTRAINT "MealPlanRecipe_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("mealPlanId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanInventoryItem" ADD CONSTRAINT "MealPlanInventoryItem_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("mealPlanId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlanInventoryItem" ADD CONSTRAINT "MealPlanInventoryItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("inventoryItemId") ON DELETE RESTRICT ON UPDATE CASCADE;
