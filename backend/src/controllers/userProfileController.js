import { PrismaClient } from "../../generated/prisma/index.js";
const prisma = new PrismaClient();
// Get user profile with preferences and health goals
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { userId },
            select: {
                userId: true,
                name: true,
                email: true,
                preferences: true,
                healthGoals: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};
// Update user preferences
export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { preferences } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Validate preferences structure
        const validPreferences = {
            dietaryRestrictions: preferences.dietaryRestrictions || [],
            allergies: preferences.allergies || [],
            cuisinePreferences: preferences.cuisinePreferences || [],
            dislikedIngredients: preferences.dislikedIngredients || [],
            calorieGoal: preferences.calorieGoal || 2000,
            macroGoals: preferences.macroGoals || { protein: 30, carbs: 40, fat: 30 },
        };
        const user = await prisma.user.update({
            where: { userId },
            data: { preferences: validPreferences },
            select: {
                userId: true,
                name: true,
                email: true,
                preferences: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error("Update preferences error:", error);
        res.status(500).json({ error: "Failed to update preferences" });
    }
};
// Update health goals
export const updateHealthGoals = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { healthGoals } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Validate health goals structure
        const validHealthGoals = {
            targetWeight: healthGoals.targetWeight || null,
            currentWeight: healthGoals.currentWeight || null,
            dailyCalories: healthGoals.dailyCalories || 2000,
            macroRatios: healthGoals.macroRatios || {
                protein: 30,
                carbs: 40,
                fat: 30,
            },
            activityLevel: healthGoals.activityLevel || "moderate", // sedentary, light, moderate, active, very_active
            weightGoal: healthGoals.weightGoal || "maintain", // lose, gain, maintain
            weeklyWeightChangeGoal: healthGoals.weeklyWeightChangeGoal || 0, // kg per week
        };
        const user = await prisma.user.update({
            where: { userId },
            data: { healthGoals: validHealthGoals },
            select: {
                userId: true,
                name: true,
                healthGoals: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error("Update health goals error:", error);
        res.status(500).json({ error: "Failed to update health goals" });
    }
};
// Get user stats
export const getUserStats = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get counts and statistics
        const [inventoryCount, recipeCount, mealPlanCount, recentLogins] = await Promise.all([
            prisma.inventoryItem.count({ where: { userId } }),
            prisma.recipe.count({ where: { userId } }),
            prisma.mealPlan.count({ where: { userId } }),
            prisma.loginHistory.findMany({
                where: { userId, success: true },
                orderBy: { timestamp: "desc" },
                take: 5,
            }),
        ]);
        // Get expiring items (next 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const expiringItems = await prisma.inventoryItem.count({
            where: {
                userId,
                expiryDate: {
                    lte: sevenDaysFromNow,
                    gte: new Date(),
                },
            },
        });
        res.json({
            inventoryCount,
            recipeCount,
            mealPlanCount,
            expiringItemsCount: expiringItems,
            recentLogins: recentLogins.map((login) => ({
                timestamp: login.timestamp,
                location: login.location,
                ipAddress: login.ipAddress,
            })),
        });
    }
    catch (error) {
        console.error("Get user stats error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};
// Get user activity feed
export const getActivityFeed = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { limit = 20 } = req.query;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Get recent activity
        const [recentInventory, recentRecipes, recentMealPlans] = await Promise.all([
            prisma.inventoryItem.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: Number(limit) / 3,
                include: { ingredient: true },
            }),
            prisma.recipe.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: Number(limit) / 3,
            }),
            prisma.mealPlan.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: Number(limit) / 3,
                include: {
                    mealPlanRecipes: {
                        include: { recipe: true },
                    },
                },
            }),
        ]);
        // Combine and sort by date
        const activities = [
            ...recentInventory.map((item) => ({
                type: "inventory",
                action: "added",
                item: item.ingredient.name,
                timestamp: item.createdAt,
            })),
            ...recentRecipes.map((recipe) => ({
                type: "recipe",
                action: recipe.isAIGenerated ? "generated" : "created",
                item: recipe.title,
                timestamp: recipe.createdAt,
            })),
            ...recentMealPlans.map((plan) => ({
                type: "meal_plan",
                action: "planned",
                item: `${plan.mealType} on ${plan.date.toLocaleDateString()}`,
                timestamp: plan.createdAt,
            })),
        ]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, Number(limit));
        res.json(activities);
    }
    catch (error) {
        console.error("Get activity feed error:", error);
        res.status(500).json({ error: "Failed to fetch activity feed" });
    }
};
export default {
    getUserProfile,
    updatePreferences,
    updateHealthGoals,
    getUserStats,
    getActivityFeed,
};
//# sourceMappingURL=userProfileController.js.map