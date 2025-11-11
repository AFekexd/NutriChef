import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { BaseAIService, AIProvider } from "../services/aiService.js";
import { getAIServiceConfig } from "../services/aiServiceSelector.js";

const prisma = new PrismaClient();

// Helper function to get user's AI configuration for text generation
async function getUserAIConfig(userId: string): Promise<{
  provider: AIProvider | "openrouter";
  apiKey?: string;
  model?: string;
}> {
  const config = await getAIServiceConfig(userId, "textGeneration");

  if (config.provider === "default") {
    // Use default Gemini
    return { provider: AIProvider.GEMINI };
  } else if (config.provider === "openrouter") {
    return {
      provider: "openrouter",
      apiKey: config.apiKey,
      model: config.model,
    };
  } else {
    // Use user's own API key (OpenAI or Gemini)
    return {
      provider:
        config.provider === "openai" ? AIProvider.OPENAI : AIProvider.GEMINI,
      apiKey: config.apiKey,
    };
  }
}

class HealthInsightsService extends BaseAIService {
  constructor(
    provider: AIProvider | "openrouter" = AIProvider.GEMINI,
    customApiKey?: string,
    model?: string
  ) {
    super(provider, customApiKey, model);
  }

  async generatePersonalizedInsights(
    userData: {
      age: number;
      weight: number;
      height: number;
      activityLevel: string;
      goals: string[];
      recentNutrition: Array<{
        date: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }>;
      averageCalories: number;
      averageProtein: number;
      averageCarbs: number;
      averageFat: number;
      bmr: number;
      tdee: number;
    },
    language: string = "en"
  ) {
    const languageInstructions =
      language === "hu"
        ? "Válaszolj magyarul. Minden tanács, ajánlás és magyarázat magyar nyelvű legyen."
        : "Respond in English. All advice, recommendations, and explanations should be in English.";

    const systemMessage = `You are a professional nutritionist and health coach with expertise in personalized nutrition planning.
Analyze the user's health data and provide actionable, science-based insights and recommendations.
${languageInstructions}

Provide your response in the following JSON format:
{
  "overallScore": 85,
  "scoreBreakdown": {
    "calorieBalance": 90,
    "macroBalance": 80,
    "consistency": 85,
    "hydration": 75
  },
  "insights": [
    {
      "type": "success",
      "title": "Great Progress!",
      "description": "Your protein intake is excellent...",
      "icon": "trophy"
    },
    {
      "type": "warning",
      "title": "Consider This",
      "description": "You might want to increase...",
      "icon": "alert-circle"
    },
    {
      "type": "tip",
      "title": "Pro Tip",
      "description": "Try to...",
      "icon": "lightbulb"
    }
  ],
  "recommendations": [
    {
      "category": "Nutrition",
      "priority": "high",
      "title": "Increase Fiber Intake",
      "description": "Add more vegetables and whole grains",
      "actionItems": [
        "Add a serving of vegetables to lunch",
        "Choose whole grain bread",
        "Include legumes in dinner"
      ]
    }
  ],
  "weeklyGoals": [
    {
      "goal": "Maintain consistent meal timing",
      "target": "Eat at regular intervals",
      "progress": 0
    }
  ],
  "nutritionCoachMessage": "Based on your recent nutrition data, you're doing well! Here are some personalized recommendations..."
}`;

    const prompt = `Analyze this user's health and nutrition data:

USER PROFILE:
- Age: ${userData.age} years
- Weight: ${userData.weight} kg
- Height: ${userData.height} cm
- Activity Level: ${userData.activityLevel}
- Goals: ${userData.goals.join(", ")}
- BMR (Basal Metabolic Rate): ${userData.bmr} calories
- TDEE (Total Daily Energy Expenditure): ${userData.tdee} calories

RECENT NUTRITION (Last 7 days):
${userData.recentNutrition
  .map(
    (day, i) =>
      `Day ${i + 1} (${day.date}): ${day.calories} cal, ${
        day.protein
      }g protein, ${day.carbs}g carbs, ${day.fat}g fat`
  )
  .join("\n")}

AVERAGES:
- Daily Calories: ${userData.averageCalories} cal (Target: ${userData.tdee})
- Daily Protein: ${userData.averageProtein}g
- Daily Carbs: ${userData.averageCarbs}g
- Daily Fat: ${userData.averageFat}g

Provide:
1. Overall health score (0-100) based on nutrition quality and consistency
2. Breakdown scores for different aspects
3. 3-5 personalized insights (mix of success, warnings, and tips)
4. 2-4 actionable recommendations with priority levels
5. 2-3 weekly goals the user should focus on
6. A personalized coaching message (2-3 sentences)

${
  language === "hu"
    ? "FONTOS: Az egész válasz magyarul legyen!"
    : "IMPORTANT: The entire response should be in English!"
}

Return ONLY valid JSON with no additional text.`;

    try {
      const response = await this.generateContent(prompt, systemMessage);
      const insights = this.parseJSONResponse(response.content);
      return insights;
    } catch (error: any) {
      console.error("AI insights generation error:", error);
      throw new Error("Failed to generate health insights");
    }
  }

  async generateNutritionPlan(
    userData: {
      age: number;
      weight: number;
      height: number;
      activityLevel: string;
      goals: string[];
      dietaryRestrictions: string[];
      tdee: number;
    },
    language: string = "en"
  ) {
    const languageInstructions =
      language === "hu"
        ? "Válaszolj magyarul. Minden étel és utasítás magyar nyelvű legyen."
        : "Respond in English. All meals and instructions should be in English.";

    const systemMessage = `You are a professional nutritionist creating personalized meal plans.
${languageInstructions}

Provide your response in JSON format with a daily meal plan structure.`;

    const prompt = `Create a personalized daily nutrition plan for:

USER PROFILE:
- Age: ${userData.age} years
- Weight: ${userData.weight} kg
- Height: ${userData.height} cm
- Activity Level: ${userData.activityLevel}
- Goals: ${userData.goals.join(", ")}
- Dietary Restrictions: ${userData.dietaryRestrictions.join(", ") || "None"}
- Target Daily Calories: ${userData.tdee}

Provide a JSON response with:
{
  "dailyCalorieTarget": ${userData.tdee},
  "macroTargets": {
    "protein": 150,
    "carbs": 200,
    "fat": 60
  },
  "mealPlan": [
    {
      "mealType": "breakfast",
      "name": "Meal name",
      "calories": 400,
      "protein": 30,
      "carbs": 45,
      "fat": 12,
      "foods": ["Food 1", "Food 2"]
    }
  ],
  "tips": ["Tip 1", "Tip 2"]
}

Return ONLY valid JSON.`;

    try {
      const response = await this.generateContent(prompt, systemMessage);
      const plan = this.parseJSONResponse(response.content);
      return plan;
    } catch (error: any) {
      console.error("AI nutrition plan error:", error);
      throw new Error("Failed to generate nutrition plan");
    }
  }
}

// Get personalized health insights
export const getHealthInsights = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { language = "en" } = req.query;

    // Get user's AI configuration
    const aiConfig = await getUserAIConfig(userId);

    // Check cache first
    const existingCache = await prisma.healthInsightsCache.findFirst({
      where: {
        userId,
        language: language as string,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return cached data if available and not expired
    if (existingCache) {
      console.log(`Returning cached health insights for user ${userId}`);
      return res.json(existingCache.insightsData);
    }

    // If no valid cache, generate new insights
    console.log(`Generating new health insights for user ${userId}`);

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        name: true,
        preferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const preferences = (user.preferences as any) || {};
    const age = preferences.age || 30;
    const weight = preferences.weight || 70;
    const height = preferences.height || 170;
    const activityLevel = preferences.activityLevel || "moderate";
    const goals = preferences.goals || ["maintain weight", "healthy lifestyle"];

    // Calculate BMR and TDEE
    const bmr = calculateBMR(weight, height, age, preferences.gender || "male");
    const tdee = calculateTDEE(bmr, activityLevel);

    // Get recent nutrition data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMealPlans = await prisma.mealPlan.findMany({
      where: {
        userId,
        date: {
          gte: sevenDaysAgo,
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
        date: "desc",
      },
    });

    // Aggregate nutrition data by day
    const dailyNutrition: Map<
      string,
      {
        date: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }
    > = new Map();

    recentMealPlans.forEach((mealPlan) => {
      const dateKey: string = mealPlan.date.toISOString().split("T")[0]!;
      if (!dailyNutrition.has(dateKey)) {
        dailyNutrition.set(dateKey, {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
      }
      const day = dailyNutrition.get(dateKey)!;

      // Add nutrition from target calories/macros
      day.calories += mealPlan.targetCalories || 0;
      const macros = mealPlan.targetMacros as any;
      if (macros) {
        day.protein += macros.protein || 0;
        day.carbs += macros.carbs || 0;
        day.fat += macros.fat || 0;
      }
    });

    const recentNutrition = Array.from(dailyNutrition.values());

    // Calculate averages
    const avgCalories =
      recentNutrition.length > 0
        ? recentNutrition.reduce((sum, day) => sum + day.calories, 0) /
          recentNutrition.length
        : 0;
    const avgProtein =
      recentNutrition.length > 0
        ? recentNutrition.reduce((sum, day) => sum + day.protein, 0) /
          recentNutrition.length
        : 0;
    const avgCarbs =
      recentNutrition.length > 0
        ? recentNutrition.reduce((sum, day) => sum + day.carbs, 0) /
          recentNutrition.length
        : 0;
    const avgFat =
      recentNutrition.length > 0
        ? recentNutrition.reduce((sum, day) => sum + day.fat, 0) /
          recentNutrition.length
        : 0;

    const userData = {
      age,
      weight,
      height,
      activityLevel,
      goals,
      recentNutrition,
      averageCalories: Math.round(avgCalories),
      averageProtein: Math.round(avgProtein),
      averageCarbs: Math.round(avgCarbs),
      averageFat: Math.round(avgFat),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
    };

    // Generate AI insights with user's custom API key if available
    const insightsService = new HealthInsightsService(
      aiConfig.provider,
      aiConfig.apiKey,
      aiConfig.model
    );
    const insights = await insightsService.generatePersonalizedInsights(
      userData,
      language as string
    );

    const responseData = {
      ...insights,
      userData: {
        bmr: userData.bmr,
        tdee: userData.tdee,
        averageCalories: userData.averageCalories,
        daysTracked: recentNutrition.length,
      },
    };

    // Store in cache (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.healthInsightsCache.create({
      data: {
        userId,
        language: language as string,
        insightsData: responseData as any,
        expiresAt,
      },
    });

    // Clean up old expired cache entries for this user
    await prisma.healthInsightsCache.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    res.json(responseData);
  } catch (error: any) {
    console.error("Error generating health insights:", error);
    res.status(500).json({
      error: error.message || "Failed to generate health insights",
    });
  }
};

// Get personalized nutrition plan
export const getNutritionPlan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { language = "en" } = req.query;

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        preferences: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const preferences = (user.preferences as any) || {};
    const age = preferences.age || 30;
    const weight = preferences.weight || 70;
    const height = preferences.height || 170;
    const activityLevel = preferences.activityLevel || "moderate";
    const goals = preferences.goals || ["maintain weight"];
    const dietaryRestrictions = preferences.dietaryRestrictions || [];

    const bmr = calculateBMR(weight, height, age, preferences.gender || "male");
    const tdee = calculateTDEE(bmr, activityLevel);

    const userData = {
      age,
      weight,
      height,
      activityLevel,
      goals,
      dietaryRestrictions,
      tdee: Math.round(tdee),
    };

    // Get user's AI configuration
    const aiConfig = await getUserAIConfig(userId);

    // Generate AI nutrition plan with user's custom API key if available
    const insightsService = new HealthInsightsService(
      aiConfig.provider,
      aiConfig.apiKey,
      aiConfig.model
    );
    const plan = await insightsService.generateNutritionPlan(
      userData,
      language as string
    );

    res.json(plan);
  } catch (error: any) {
    console.error("Error generating nutrition plan:", error);
    res.status(500).json({
      error: error.message || "Failed to generate nutrition plan",
    });
  }
};

// Clear health insights cache for a user
export const clearHealthInsightsCache = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { language } = req.query;

    // Delete cache entries
    const deleteCondition: any = { userId };
    if (language) {
      deleteCondition.language = language as string;
    }

    await prisma.healthInsightsCache.deleteMany({
      where: deleteCondition,
    });

    res.json({
      message: "Health insights cache cleared successfully",
    });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      error: error.message || "Failed to clear cache",
    });
  }
};

// Helper functions
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: string
): number {
  // Mifflin-St Jeor Equation
  if (gender === "female") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: { [key: string]: number } = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return bmr * (multipliers[activityLevel] || 1.55);
}
