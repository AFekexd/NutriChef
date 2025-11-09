-- DropForeignKey
ALTER TABLE "public"."ConsumptionLog" DROP CONSTRAINT "ConsumptionLog_inventoryItemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MealPlanInventoryItem" DROP CONSTRAINT "MealPlanInventoryItem_inventoryItemId_fkey";

-- AddForeignKey
ALTER TABLE "MealPlanInventoryItem" ADD CONSTRAINT "MealPlanInventoryItem_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("inventoryItemId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumptionLog" ADD CONSTRAINT "ConsumptionLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("inventoryItemId") ON DELETE CASCADE ON UPDATE CASCADE;
