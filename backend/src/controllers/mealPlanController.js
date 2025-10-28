import { PrismaClient } from "../../generated/prisma/index.js";
const prisma = new PrismaClient();
// Get meal plans for a date range
export const getMealPlans = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { startDate, endDate } = req.query;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const where = { userId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = new Date(startDate);
            }
            if (endDate) {
                where.date.lte = new Date(endDate);
            }
        }
        const mealPlans = await prisma.mealPlan.findMany({
            where,
            include: {
                mealPlanRecipes: {
                    include: {
                        recipe: {
                            include: {
                                recipeIngredients: {
                                    include: {
                                        ingredient: true,
                                    },
                                },
                            },
                        },
                    },
                },
                mealPlanInventoryItems: {
                    include: {
                        inventoryItem: {
                            include: {
                                ingredient: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
        });
        res.json({ mealPlans });
    }
    catch (error) {
        console.error("Error fetching meal plans:", error);
        res.status(500).json({ error: "Failed to fetch meal plans" });
    }
};
// Get meal plan by ID
export const getMealPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id) {
            return res.status(400).json({ error: "Meal plan ID is required" });
        }
        const mealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
            include: {
                mealPlanRecipes: {
                    include: {
                        recipe: {
                            include: {
                                recipeIngredients: {
                                    include: {
                                        ingredient: true,
                                    },
                                },
                            },
                        },
                    },
                },
                mealPlanInventoryItems: {
                    include: {
                        inventoryItem: {
                            include: {
                                ingredient: true,
                            },
                        },
                    },
                },
            },
        });
        if (!mealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        res.json({ mealPlan });
    }
    catch (error) {
        console.error("Error fetching meal plan:", error);
        res.status(500).json({ error: "Failed to fetch meal plan" });
    }
};
// Create a new meal plan
export const createMealPlan = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { date, mealType, recipeIds, inventoryItemIds, targetCalories, targetMacros, isAIGenerated, } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!date || !mealType) {
            return res.status(400).json({ error: "Date and meal type are required" });
        }
        // Validate mealType
        const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
        if (!validMealTypes.includes(mealType)) {
            return res.status(400).json({
                error: `Invalid meal type. Must be one of: ${validMealTypes.join(", ")}`,
            });
        }
        // Create meal plan with recipes and inventory items
        const mealPlan = await prisma.mealPlan.create({
            data: {
                userId,
                date: new Date(date),
                mealType,
                targetCalories: targetCalories || null,
                targetMacros: targetMacros || null,
                isAIGenerated: isAIGenerated || false,
                mealPlanRecipes: {
                    create: recipeIds?.map((recipeId) => ({
                        recipeId,
                    })) || [],
                },
                mealPlanInventoryItems: {
                    create: inventoryItemIds?.map((inventoryItemId) => ({
                        inventoryItemId,
                        quantityUsed: 1, // Default quantity, can be customized
                    })) || [],
                },
            },
            include: {
                mealPlanRecipes: {
                    include: {
                        recipe: {
                            include: {
                                recipeIngredients: {
                                    include: {
                                        ingredient: true,
                                    },
                                },
                            },
                        },
                    },
                },
                mealPlanInventoryItems: {
                    include: {
                        inventoryItem: {
                            include: {
                                ingredient: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(201).json({ message: "Meal plan created", mealPlan });
    }
    catch (error) {
        console.error("Error creating meal plan:", error);
        res.status(500).json({ error: "Failed to create meal plan" });
    }
};
// Update a meal plan
export const updateMealPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const { date, mealType, recipeIds, targetCalories, targetMacros } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id) {
            return res.status(400).json({ error: "Meal plan ID is required" });
        }
        // Check if meal plan exists and belongs to user
        const existingMealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
        });
        if (!existingMealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        // Validate mealType if provided
        if (mealType) {
            const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
            if (!validMealTypes.includes(mealType)) {
                return res.status(400).json({
                    error: `Invalid meal type. Must be one of: ${validMealTypes.join(", ")}`,
                });
            }
        }
        // Update meal plan
        const updateData = {};
        if (date)
            updateData.date = new Date(date);
        if (mealType)
            updateData.mealType = mealType;
        if (targetCalories !== undefined)
            updateData.targetCalories = targetCalories;
        if (targetMacros !== undefined)
            updateData.targetMacros = targetMacros;
        // If recipeIds provided, update the recipes
        if (recipeIds) {
            // Delete existing recipes
            await prisma.mealPlanRecipe.deleteMany({
                where: { mealPlanId: id },
            });
            // Add new recipes
            updateData.mealPlanRecipes = {
                create: recipeIds.map((recipeId) => ({
                    recipeId,
                })),
            };
        }
        const mealPlan = await prisma.mealPlan.update({
            where: { mealPlanId: id },
            data: updateData,
            include: {
                mealPlanRecipes: {
                    include: {
                        recipe: {
                            include: {
                                recipeIngredients: {
                                    include: {
                                        ingredient: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        res.json({ message: "Meal plan updated", mealPlan });
    }
    catch (error) {
        console.error("Error updating meal plan:", error);
        res.status(500).json({ error: "Failed to update meal plan" });
    }
};
// Delete a meal plan
export const deleteMealPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id) {
            return res.status(400).json({ error: "Meal plan ID is required" });
        }
        // Check if meal plan exists and belongs to user
        const existingMealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
        });
        if (!existingMealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        // Delete meal plan (cascade will delete mealPlanRecipes)
        await prisma.mealPlan.delete({
            where: { mealPlanId: id },
        });
        res.json({ message: "Meal plan deleted" });
    }
    catch (error) {
        console.error("Error deleting meal plan:", error);
        res.status(500).json({ error: "Failed to delete meal plan" });
    }
};
// Add recipe to meal plan
export const addRecipeToMealPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { recipeId } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id) {
            return res.status(400).json({ error: "Meal plan ID is required" });
        }
        if (!recipeId) {
            return res.status(400).json({ error: "Recipe ID is required" });
        }
        // Check if meal plan exists and belongs to user
        const existingMealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
        });
        if (!existingMealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        // Check if recipe exists
        const recipe = await prisma.recipe.findUnique({
            where: { recipeId },
        });
        if (!recipe) {
            return res.status(404).json({ error: "Recipe not found" });
        }
        // Add recipe to meal plan
        const mealPlanRecipe = await prisma.mealPlanRecipe.create({
            data: {
                mealPlanId: id,
                recipeId,
            },
            include: {
                recipe: {
                    include: {
                        recipeIngredients: {
                            include: {
                                ingredient: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(201).json({
            message: "Recipe added to meal plan",
            mealPlanRecipe,
        });
    }
    catch (error) {
        console.error("Error adding recipe to meal plan:", error);
        res.status(500).json({ error: "Failed to add recipe to meal plan" });
    }
};
// Remove recipe from meal plan
export const removeRecipeFromMealPlan = async (req, res) => {
    try {
        const { id, recipeId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id || !recipeId) {
            return res
                .status(400)
                .json({ error: "Meal plan ID and Recipe ID are required" });
        }
        // Check if meal plan exists and belongs to user
        const existingMealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
        });
        if (!existingMealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        // Remove recipe from meal plan
        await prisma.mealPlanRecipe.deleteMany({
            where: {
                mealPlanId: id,
                recipeId,
            },
        });
        res.json({ message: "Recipe removed from meal plan" });
    }
    catch (error) {
        console.error("Error removing recipe from meal plan:", error);
        res.status(500).json({ error: "Failed to remove recipe from meal plan" });
    }
};
// Get weekly summary
export const getWeeklySummary = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { weekStart } = req.query;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const startDate = weekStart ? new Date(weekStart) : new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        const mealPlans = await prisma.mealPlan.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            include: {
                mealPlanRecipes: {
                    include: {
                        recipe: true,
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
        });
        // Calculate totals
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        mealPlans.forEach((plan) => {
            plan.mealPlanRecipes.forEach((mpr) => {
                totalCalories += mpr.recipe.calories;
                const macros = mpr.recipe.macros;
                totalProtein += macros.protein || 0;
                totalCarbs += macros.carbs || 0;
                totalFat += macros.fat || 0;
            });
        });
        res.json({
            weekStart: startDate,
            weekEnd: endDate,
            mealPlans,
            summary: {
                totalMeals: mealPlans.length,
                totalCalories,
                totalProtein,
                totalCarbs,
                totalFat,
                averageCaloriesPerDay: totalCalories / 7,
            },
        });
    }
    catch (error) {
        console.error("Error fetching weekly summary:", error);
        res.status(500).json({ error: "Failed to fetch weekly summary" });
    }
};
// Add inventory item to meal plan
export const addInventoryItemToMealPlan = async (req, res) => {
    try {
        const { id } = req.params; // meal plan ID
        const { inventoryItemId, quantityUsed } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id) {
            return res.status(400).json({ error: "Meal plan ID is required" });
        }
        if (!inventoryItemId) {
            return res.status(400).json({ error: "Inventory item ID is required" });
        }
        // Verify meal plan belongs to user
        const mealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
        });
        if (!mealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        // Verify inventory item belongs to user
        const inventoryItem = await prisma.inventoryItem.findFirst({
            where: {
                inventoryItemId,
                userId,
            },
        });
        if (!inventoryItem) {
            return res.status(404).json({ error: "Inventory item not found" });
        }
        // Add inventory item to meal plan
        const mealPlanInventoryItem = await prisma.mealPlanInventoryItem.create({
            data: {
                mealPlanId: id,
                inventoryItemId,
                quantityUsed: quantityUsed || 1,
            },
            include: {
                inventoryItem: {
                    include: {
                        ingredient: true,
                    },
                },
            },
        });
        res.status(201).json({
            message: "Inventory item added to meal plan",
            mealPlanInventoryItem,
        });
    }
    catch (error) {
        console.error("Error adding inventory item to meal plan:", error);
        res
            .status(500)
            .json({ error: "Failed to add inventory item to meal plan" });
    }
};
// Remove inventory item from meal plan
export const removeInventoryItemFromMealPlan = async (req, res) => {
    try {
        const { id, inventoryItemId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!id) {
            return res.status(400).json({ error: "Meal plan ID is required" });
        }
        if (!inventoryItemId) {
            return res.status(400).json({ error: "Inventory item ID is required" });
        }
        // Verify meal plan belongs to user
        const mealPlan = await prisma.mealPlan.findFirst({
            where: {
                mealPlanId: id,
                userId,
            },
        });
        if (!mealPlan) {
            return res.status(404).json({ error: "Meal plan not found" });
        }
        // Find and delete the meal plan inventory item
        const deleted = await prisma.mealPlanInventoryItem.deleteMany({
            where: {
                mealPlanId: id,
                inventoryItemId,
            },
        });
        if (deleted.count === 0) {
            return res
                .status(404)
                .json({ error: "Inventory item not found in meal plan" });
        }
        res.json({ message: "Inventory item removed from meal plan" });
    }
    catch (error) {
        console.error("Error removing inventory item from meal plan:", error);
        res
            .status(500)
            .json({ error: "Failed to remove inventory item from meal plan" });
    }
};
//# sourceMappingURL=mealPlanController.js.map