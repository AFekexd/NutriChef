import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Get user's nutrition goals
 */
export const getNutritionGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { healthGoals: true, preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract nutrition goals from healthGoals JSON
    const healthGoals = (user.healthGoals as any) || {};
    const preferences = (user.preferences as any) || {};

    const goals = {
      dailyCalories:
        healthGoals.dailyCalories || preferences.calorieGoal || 2000,
      protein: healthGoals.protein || 150,
      carbs: healthGoals.carbs || 200,
      fat: healthGoals.fat || 65,
      fiber: healthGoals.fiber || 30,
      macroRatios: healthGoals.macroRatios || null,
    };

    res.json({ goals });
  } catch (error) {
    console.error("Error fetching nutrition goals:", error);
    res.status(500).json({ error: "Failed to fetch nutrition goals" });
  }
};

/**
 * Update user's nutrition goals
 */
export const updateNutritionGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { dailyCalories, protein, carbs, fat, fiber, macroRatios } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validation
    if (dailyCalories && (dailyCalories < 1000 || dailyCalories > 5000)) {
      return res
        .status(400)
        .json({ error: "Daily calories must be between 1000 and 5000" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { healthGoals: true },
    });

    const currentHealthGoals = (user?.healthGoals as any) || {};

    const updatedHealthGoals = {
      ...currentHealthGoals,
      dailyCalories: dailyCalories || currentHealthGoals.dailyCalories || 2000,
      protein: protein || currentHealthGoals.protein || 150,
      carbs: carbs || currentHealthGoals.carbs || 200,
      fat: fat || currentHealthGoals.fat || 65,
      fiber: fiber || currentHealthGoals.fiber || 30,
      macroRatios: macroRatios || currentHealthGoals.macroRatios,
      updatedAt: new Date().toISOString(),
    };

    await prisma.user.update({
      where: { userId },
      data: {
        healthGoals: updatedHealthGoals,
      },
    });

    res.json({
      message: "Nutrition goals updated successfully",
      goals: updatedHealthGoals,
    });
  } catch (error) {
    console.error("Error updating nutrition goals:", error);
    res.status(500).json({ error: "Failed to update nutrition goals" });
  }
};

/**
 * Get daily nutrition intake for a specific date
 */
export const getDailyIntake = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { date } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!date) {
      return res.status(400).json({ error: "Date parameter is required" });
    }

    // Parse date
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get meal plans for the day
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        mealPlanRecipes: {
          include: {
            recipe: {
              select: {
                recipeId: true,
                title: true,
                calories: true,
                macros: true,
                servings: true,
              },
            },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    const meals = mealPlans.map((plan) => {
      let mealCalories = 0;
      let mealProtein = 0;
      let mealCarbs = 0;
      let mealFat = 0;
      let mealFiber = 0;

      plan.mealPlanRecipes.forEach((mpr) => {
        const recipe = mpr.recipe;
        const macros = recipe.macros as any;

        mealCalories += recipe.calories;
        mealProtein += macros?.protein || 0;
        mealCarbs += macros?.carbs || 0;
        mealFat += macros?.fat || 0;
        mealFiber += macros?.fiber || 0;
      });

      totalCalories += mealCalories;
      totalProtein += mealProtein;
      totalCarbs += mealCarbs;
      totalFat += mealFat;
      totalFiber += mealFiber;

      return {
        id: plan.mealPlanId,
        mealType: plan.mealType,
        name:
          plan.mealPlanRecipes.map((mpr) => mpr.recipe.title).join(", ") ||
          "Custom Meal",
        calories: Math.round(mealCalories),
        protein: Math.round(mealProtein),
        carbs: Math.round(mealCarbs),
        fat: Math.round(mealFat),
        fiber: Math.round(mealFiber),
        time: plan.date.toTimeString().slice(0, 5),
      };
    });

    res.json({
      date,
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
      meals,
    });
  } catch (error) {
    console.error("Error fetching daily intake:", error);
    res.status(500).json({ error: "Failed to fetch daily intake" });
  }
};

/**
 * Log a meal
 */
export const logMeal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      date,
      mealType,
      name,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      recipeId,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validation
    if (!date || !mealType || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const mealDate = new Date(date);

    // Create meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId,
        date: mealDate,
        mealType,
        targetCalories: calories || 0,
        targetMacros: {
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
        },
      },
    });

    // If recipeId is provided, link the recipe
    if (recipeId) {
      await prisma.mealPlanRecipe.create({
        data: {
          mealPlanId: mealPlan.mealPlanId,
          recipeId,
        },
      });
    }

    res.json({
      message: "Meal logged successfully",
      meal: {
        id: mealPlan.mealPlanId,
        mealType: mealPlan.mealType,
        name,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        fiber: fiber || 0,
        time: mealDate.toTimeString().slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error logging meal:", error);
    res.status(500).json({ error: "Failed to log meal" });
  }
};

/**
 * Delete a meal
 */
export const deleteMeal = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { mealId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!mealId) {
      return res.status(400).json({ error: "Meal ID is required" });
    }

    // Check if meal belongs to user
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { mealPlanId: mealId },
      select: { userId: true },
    });

    if (!mealPlan) {
      return res.status(404).json({ error: "Meal not found" });
    }

    if (mealPlan.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.mealPlan.delete({
      where: { mealPlanId: mealId },
    });

    res.json({ message: "Meal deleted successfully" });
  } catch (error) {
    console.error("Error deleting meal:", error);
    res.status(500).json({ error: "Failed to delete meal" });
  }
};

/**
 * Calculate BMR and suggest nutrition goals
 */
export const calculateBMR = async (req: Request, res: Response) => {
  try {
    const {
      age,
      gender,
      weight, // in kg
      height, // in cm
      activityLevel,
      goal, // 'maintain', 'lose', 'loseFast', 'loseAggressive', 'gain'
    } = req.body;

    // Validation
    if (!age || !gender || !weight || !height || !activityLevel || !goal) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (age < 15 || age > 100) {
      return res.status(400).json({ error: "Age must be between 15 and 100" });
    }

    if (weight < 30 || weight > 300) {
      return res
        .status(400)
        .json({ error: "Weight must be between 30 and 300 kg" });
    }

    if (height < 100 || height > 250) {
      return res
        .status(400)
        .json({ error: "Height must be between 100 and 250 cm" });
    }

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2, // Little or no exercise
      light: 1.375, // Light exercise 1-3 days/week
      moderate: 1.55, // Moderate exercise 3-5 days/week
      active: 1.725, // Hard exercise 6-7 days/week
      veryActive: 1.9, // Very hard exercise & physical job
    };

    const multiplier = activityMultipliers[activityLevel] || 1.2;
    const tdee = Math.round(bmr * multiplier); // Total Daily Energy Expenditure

    // Adjust calories based on goal
    let dailyCalories = tdee;
    if (goal === "lose") {
      dailyCalories = Math.round(tdee - 500); // 500 cal deficit for ~0.5kg/week loss
    } else if (goal === "loseFast") {
      dailyCalories = Math.round(tdee - 750); // 750 cal deficit for ~0.75kg/week loss
    } else if (goal === "loseAggressive") {
      dailyCalories = Math.round(tdee - 1000); // 1000 cal deficit for ~1kg/week loss
    } else if (goal === "gain") {
      dailyCalories = Math.round(tdee + 300); // 300 cal surplus for clean bulk
    }

    // Ensure minimum calories for safety
    const minCalories = Math.max(dailyCalories, 1200);

    // Calculate macros with improved logic
    // Protein: Higher during deficit to preserve muscle
    let proteinPerKg = 1.6;
    if (goal === "lose" || goal === "loseFast" || goal === "loseAggressive") {
      proteinPerKg = 2.2; // Higher protein during deficit to preserve muscle
    } else if (activityLevel === "active" || activityLevel === "veryActive") {
      proteinPerKg = 2.0;
    }
    const protein = Math.round(weight * proteinPerKg);

    // Fat: 20-30% of calories (minimum 0.6g per kg for hormonal health)
    const minFat = Math.round(weight * 0.6); // Minimum for health
    const fatFromCalories = Math.round((minCalories * 0.25) / 9); // 25% of calories
    const fat = Math.max(minFat, fatFromCalories);

    // Carbs: Fill the rest of calories (minimum 100g for brain function)
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const remainingCalories = Math.max(
      0,
      minCalories - proteinCalories - fatCalories
    );
    const carbsFromCalories = Math.round(remainingCalories / 4);
    const carbs = Math.max(100, carbsFromCalories); // Minimum 100g for brain/energy

    // Fiber: 14g per 1000 calories
    const fiber = Math.round((minCalories / 1000) * 14);

    // Recalculate total for accurate percentages
    const totalMacroCalories = proteinCalories + carbs * 4 + fatCalories;

    const recommendations = {
      bmr: Math.round(bmr),
      tdee,
      dailyCalories: minCalories,
      protein,
      carbs,
      fat,
      fiber,
      macroRatios: {
        protein: Math.round((proteinCalories / totalMacroCalories) * 100),
        carbs: Math.round(((carbs * 4) / totalMacroCalories) * 100),
        fat: Math.round((fatCalories / totalMacroCalories) * 100),
      },
      activityLevel,
      goal,
    };

    res.json({
      message: "BMR calculated successfully",
      recommendations,
    });
  } catch (error) {
    console.error("Error calculating BMR:", error);
    res.status(500).json({ error: "Failed to calculate BMR" });
  }
};

/**
 * Get weekly nutrition summary
 */
export const getWeeklySummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { weekStart } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const startDate = weekStart
      ? new Date(weekStart as string)
      : new Date(new Date().setDate(new Date().getDate() - 7));

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

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
            recipe: {
              select: {
                calories: true,
                macros: true,
              },
            },
          },
        },
      },
    });

    // Group by day
    const dailyData: Record<string, any> = {};

    mealPlans.forEach((plan) => {
      const dateKey = plan.date.toISOString().split("T")[0];
      if (!dateKey) return;

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          meals: 0,
        };
      }

      const dayData = dailyData[dateKey];
      if (!dayData) return;

      plan.mealPlanRecipes.forEach((mpr) => {
        const macros = mpr.recipe.macros as any;
        dayData.calories += mpr.recipe.calories;
        dayData.protein += macros?.protein || 0;
        dayData.carbs += macros?.carbs || 0;
        dayData.fat += macros?.fat || 0;
        dayData.fiber += macros?.fiber || 0;
      });

      dayData.meals += 1;
    });

    const summary = Object.values(dailyData).map((day: any) => ({
      ...day,
      calories: Math.round(day.calories),
      protein: Math.round(day.protein),
      carbs: Math.round(day.carbs),
      fat: Math.round(day.fat),
      fiber: Math.round(day.fiber),
    }));

    res.json({
      weekStart: startDate.toISOString().split("T")[0],
      weekEnd: endDate.toISOString().split("T")[0],
      summary,
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    res.status(500).json({ error: "Failed to fetch weekly summary" });
  }
};
