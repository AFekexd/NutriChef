import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { BaseAIService, AIProvider } from "../services/aiService.js";
import { getAIServiceConfig } from "../services/aiServiceSelector.js";
import crypto from "crypto";

const prisma = new PrismaClient();

// Helper function to create a hash of ingredients for cache lookup
function createIngredientsHash(
  ingredients: Array<{ name: string; quantity: number; unit: string }>,
  servings: number,
  minMatchPercentage: number,
  allergies: string[]
): string {
  const sortedIngredients = [...ingredients]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((i) => `${i.name}:${i.quantity}:${i.unit}`);

  const data = [
    ...sortedIngredients,
    `servings:${servings}`,
    `match:${minMatchPercentage}`,
    `allergies:${allergies.sort().join(",")}`,
  ].join("|");

  return crypto.createHash("sha256").update(data).digest("hex");
}

// Helper function to calculate ingredient match percentage
function calculateMatchPercentage(
  recipeIngredients: Array<{ ingredient: { name: string } }>,
  availableIngredients: Array<{ name: string }>,
  allergies: string[] = []
): {
  matchPercentage: number;
  availableCount: number;
  totalCount: number;
  hasAllergy: boolean;
} {
  const availableNames = new Set(
    availableIngredients.map((i) => i.name.toLowerCase().trim())
  );
  const allergySet = new Set(allergies.map((a) => a.toLowerCase().trim()));

  let matchedCount = 0;
  let hasAllergy = false;

  for (const recipeIng of recipeIngredients) {
    const ingName = recipeIng.ingredient.name.toLowerCase().trim();

    // Check for allergies
    if (allergySet.has(ingName)) {
      hasAllergy = true;
      break;
    }

    // Check if available
    if (availableNames.has(ingName)) {
      matchedCount++;
    }
  }

  const totalCount = recipeIngredients.length;
  const matchPercentage =
    totalCount > 0 ? (matchedCount / totalCount) * 100 : 0;

  return {
    matchPercentage,
    availableCount: matchedCount,
    totalCount,
    hasAllergy,
  };
}

// Get public recipe recommendations based on popularity and inventory matching
async function getPublicRecipeRecommendations(
  availableIngredients: Array<{ name: string; quantity: number; unit: string }>,
  minMatchPercentage: number = 60,
  allergies: string[] = [],
  limit: number = 10
) {
  // Fetch all public recipes with their ingredients and ratings
  const publicRecipes = await prisma.recipe.findMany({
    where: {
      isPublic: true,
    },
    include: {
      recipeIngredients: {
        include: {
          ingredient: true,
        },
      },
      user: {
        select: {
          userId: true,
          name: true,
          oauthAvatar: true,
        },
      },
    },
  });

  // Calculate match percentage for each recipe
  const recipesWithMatch = publicRecipes
    .map((recipe) => {
      const matchData = calculateMatchPercentage(
        recipe.recipeIngredients,
        availableIngredients,
        allergies
      );

      // Filter out recipes with allergies
      if (matchData.hasAllergy) {
        return null;
      }

      // Calculate a score based on match percentage, rating, and rating count
      // This favors high-match recipes, but also considers popularity
      const matchScore = matchData.matchPercentage;
      const ratingScore = (recipe.rating || 0) * 10; // Convert 1-5 to 10-50
      const popularityScore = Math.min(recipe.ratingCount * 2, 20); // Cap at 20

      const totalScore =
        matchScore * 0.6 + ratingScore * 0.3 + popularityScore * 0.1;

      return {
        ...recipe,
        matchPercentage: Math.round(matchData.matchPercentage),
        availableIngredientsCount: matchData.availableCount,
        totalIngredientsCount: matchData.totalCount,
        score: totalScore,
      };
    })
    .filter(
      (recipe) =>
        recipe !== null && recipe.matchPercentage >= minMatchPercentage
    );

  // Sort by score (combination of match, rating, and popularity)
  recipesWithMatch.sort((a, b) => b!.score - a!.score);

  // Return top recipes
  return recipesWithMatch.slice(0, limit);
}

// Format public recipes into recommendation format
function formatPublicRecipesAsRecommendations(
  recipes: any[],
  availableIngredients: Array<{ name: string; quantity: number; unit: string }>
) {
  return recipes.map((recipe) => {
    const availableSet = new Set(
      availableIngredients.map((i) => i.name.toLowerCase().trim())
    );

    const available = recipe.recipeIngredients
      .filter((ri: any) =>
        availableSet.has(ri.ingredient.name.toLowerCase().trim())
      )
      .map((ri: any) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      }));

    const missing = recipe.recipeIngredients
      .filter(
        (ri: any) => !availableSet.has(ri.ingredient.name.toLowerCase().trim())
      )
      .map((ri: any) => ({
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
        optional: false,
      }));

    return {
      recipeId: recipe.recipeId,
      title: recipe.title,
      matchPercentage: recipe.matchPercentage,
      servings: recipe.servings,
      prepTime: recipe.prepTime || 0,
      cookTime: recipe.cookTime || 0,
      difficulty: recipe.difficulty || "medium",
      calories: recipe.calories,
      macros: recipe.macros,
      availableIngredients: available,
      missingIngredients: missing,
      instructions: recipe.instructions,
      cuisineType: recipe.cuisineType || "Various",
      imageURL: recipe.imageURL,
      rating: recipe.rating,
      ratingCount: recipe.ratingCount,
      isPublic: true,
      author: recipe.user
        ? {
            name: recipe.user.name,
            avatar: recipe.user.oauthAvatar,
          }
        : null,
    };
  });
}

class RecipeRecommendationService extends BaseAIService {
  constructor(
    provider: AIProvider | "openrouter" = AIProvider.GEMINI,
    customApiKey?: string,
    model?: string
  ) {
    // Use Gemini as default, or user's configured provider
    // Increased to 8000 tokens for recipe generation to avoid truncation
    // This is especially important for complex recipes with many ingredients
    super(provider, customApiKey, model, 8000);
  }

  async generateRecommendations(
    availableIngredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }>,
    servings: number = 2,
    minMatchPercentage: number = 60,
    language: string = "en",
    allergies: string[] = []
  ) {
    const ingredientsList = availableIngredients
      .map((ing) => `${ing.name} (${ing.quantity} ${ing.unit})`)
      .join(", ");

    // Language-specific instructions
    const languageInstructions =
      language === "hu"
        ? "Válaszolj magyarul. Minden receptnév, hozzávaló, utasítás és leírás magyar nyelvű legyen."
        : "Respond in English. All recipe names, ingredients, instructions, and descriptions should be in English.";

    const allergiesText =
      allergies.length > 0
        ? `\n\nIMPORTANT - DIETARY RESTRICTIONS: The user is allergic to or wants to avoid: ${allergies.join(
            ", "
          )}. 
DO NOT include ANY recipes that contain these ingredients in any form (including derivatives, extracts, or traces).
Exclude any recipe that might contain: ${allergies.join(", ")}.`
        : "";

    const systemMessage = `You are a professional chef and nutritionist. Generate recipe recommendations based on available ingredients.
Your recommendations should be realistic, healthy, and delicious.
${languageInstructions}
${allergiesText}

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid, properly formatted JSON
- DO NOT wrap the JSON in markdown code blocks
- Ensure all strings are properly quoted
- Do not use trailing commas
- Make sure the JSON is complete and not truncated
- Keep instructions concise (max 500 characters per recipe)

Provide recipes in JSON format with the following structure:
{
  "recommendations": [
    {
      "title": "Recipe Name",
      "matchPercentage": 70,
      "servings": 2,
      "prepTime": 20,
      "cookTime": 30,
      "difficulty": "easy",
      "calories": 450,
      "macros": {"protein": 25, "carbs": 40, "fat": 15},
      "availableIngredients": [
        {"name": "ingredient", "quantity": 2, "unit": "cups"}
      ],
      "missingIngredients": [
        {"name": "ingredient", "quantity": 1, "unit": "cup", "optional": false}
      ],
      "instructions": "Step by step instructions (keep concise)",
      "cuisineType": "Italian"
    }
  ]
}`;

    const prompt = `Based on these available ingredients: ${ingredientsList}

${
  allergies.length > 0
    ? `⚠️ CRITICAL: User is allergic to or avoiding: ${allergies.join(", ")}
DO NOT suggest ANY recipes containing these ingredients or their derivatives!
Filter out ALL recipes with: ${allergies.join(", ")}

`
    : ""
}Generate 5 recipe recommendations that:
1. Match at least ${minMatchPercentage}% of ingredients from the available list
2. Serve ${servings} people
3. Include both recipes that can be made entirely with available ingredients and recipes that need 1-3 additional ingredients
4. Calculate match percentage based on the number of required ingredients that are available
5. Mark additional ingredients as "optional: false" if essential, or "optional: true" if nice-to-have
6. Include prep time, cook time, calories, and macros
7. Provide clear, step-by-step instructions (max 3-4 steps, keep each step under 100 characters)
${
  allergies.length > 0
    ? `8. EXCLUDE any recipe containing: ${allergies.join(", ")}`
    : ""
}

${
  language === "hu"
    ? "FONTOS: Az egész válasz magyarul legyen!"
    : "IMPORTANT: The entire response should be in English!"
}

CRITICAL: Return ONLY the JSON object, nothing else. Do not wrap in markdown code blocks. Ensure the JSON is complete and valid.`;

    try {
      const response = await this.generateContent(prompt, systemMessage);
      const recommendations = this.parseJSONResponse(response.content);
      return recommendations;
    } catch (error: any) {
      console.error("AI recommendation error:", error);
      throw new Error("Failed to generate recipe recommendations");
    }
  }
}

// Get recipe recommendations based on user's inventory
export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      servings = 2,
      minMatchPercentage = 60,
      useInventory = true,
      manualIngredients = [],
      language = "en",
      allergies = [],
      useAI = false, // New parameter - explicitly request AI recommendations
      publicRecipesLimit = 10,
    } = req.body;

    let ingredientsToUse: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }> = [];

    // Get ingredients from inventory if requested
    if (useInventory) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          userId,
          quantity: { gt: 0 },
        },
        include: {
          ingredient: true,
        },
      });

      ingredientsToUse = inventoryItems.map((item) => ({
        name: item.ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.ingredient.category,
      }));
    }

    // Add manual ingredients if provided
    if (manualIngredients && manualIngredients.length > 0) {
      ingredientsToUse = [...ingredientsToUse, ...manualIngredients];
    }

    if (ingredientsToUse.length === 0) {
      return res.status(400).json({
        error:
          "No ingredients provided. Either enable inventory or add manual ingredients.",
      });
    }

    // STEP 1: Try to get public recipe recommendations first
    console.log(
      `Searching public recipes for user ${userId} with ${ingredientsToUse.length} ingredients`
    );

    const publicRecipes = await getPublicRecipeRecommendations(
      ingredientsToUse,
      minMatchPercentage,
      allergies,
      publicRecipesLimit
    );

    // If we have enough good public recipes and AI not explicitly requested, return them
    if (publicRecipes.length >= 3 && !useAI) {
      console.log(
        `Returning ${publicRecipes.length} public recipe recommendations (no AI needed)`
      );

      const formattedRecipes = formatPublicRecipesAsRecommendations(
        publicRecipes,
        ingredientsToUse
      );

      return res.json({
        recommendations: formattedRecipes,
        ingredientsUsed: ingredientsToUse.length,
        servings,
        minMatchPercentage,
        source: "public_recipes",
        publicRecipesCount: publicRecipes.length,
        aiGenerated: false,
      });
    }

    // STEP 2: If user explicitly wants AI or not enough public recipes, use AI
    console.log(
      `${
        useAI ? "AI explicitly requested" : "Not enough public recipes"
      }, generating AI recommendations for user ${userId}`
    );

    // Create a hash of ingredients for cache lookup
    const ingredientsHash = createIngredientsHash(
      ingredientsToUse,
      servings,
      minMatchPercentage,
      allergies
    );

    // Check cache first for AI recommendations
    const existingCache = await prisma.recipeRecommendationsCache.findFirst({
      where: {
        userId,
        ingredientsHash,
        language,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return cached AI data if available
    if (existingCache) {
      console.log(
        `Returning cached AI recipe recommendations for user ${userId}`
      );
      return res.json({
        ...(existingCache.recommendations as any),
        ingredientsUsed: ingredientsToUse.length,
        servings,
        minMatchPercentage,
        cached: true,
        source: "ai_cached",
        publicRecipesAvailable: publicRecipes.length,
      });
    }

    // Get user's AI service configuration
    const aiConfig = await getAIServiceConfig(userId, "textGeneration");

    // Map provider to correct type
    let provider: AIProvider | "openrouter";
    if (aiConfig.provider === "default") {
      provider = AIProvider.GEMINI; // Use Gemini as default
    } else if (aiConfig.provider === "openai") {
      provider = AIProvider.OPENAI;
    } else if (aiConfig.provider === "gemini") {
      provider = AIProvider.GEMINI;
    } else {
      provider = "openrouter";
    }

    console.log("[Recipe Recommendations] Using AI config:", {
      provider,
      hasApiKey: !!aiConfig.apiKey,
      model: aiConfig.model,
    });

    // Generate new AI recommendations with user's configured service
    const recommendationService = new RecipeRecommendationService(
      provider,
      aiConfig.apiKey,
      aiConfig.model
    );
    const recommendations = await recommendationService.generateRecommendations(
      ingredientsToUse,
      servings,
      minMatchPercentage,
      language,
      allergies
    );

    // Store in cache (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.recipeRecommendationsCache.create({
      data: {
        userId,
        ingredientsHash,
        servings,
        minMatchPercentage,
        language,
        allergies: allergies as any,
        recommendations: recommendations as any,
        expiresAt,
      },
    });

    // Clean up old expired cache entries for this user
    await prisma.recipeRecommendationsCache.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    res.json({
      ...recommendations,
      ingredientsUsed: ingredientsToUse.length,
      servings,
      minMatchPercentage,
      source: "ai_generated",
      publicRecipesAvailable: publicRecipes.length,
      aiGenerated: true,
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      error: error.message || "Failed to generate recipe recommendations",
    });
  }
};

// Get recommendations with manual ingredient list
export const getRecommendationsWithIngredients = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const {
      ingredients,
      servings = 2,
      minMatchPercentage = 60,
      language = "en",
      allergies = [],
    } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: "Ingredients list is required" });
    }

    // Get user's AI service configuration if authenticated
    let provider: AIProvider | "openrouter" = AIProvider.GEMINI;
    let apiKey: string | undefined;
    let model: string | undefined;

    if (userId) {
      const aiConfig = await getAIServiceConfig(userId, "textGeneration");

      // Map provider to correct type
      if (aiConfig.provider === "default") {
        provider = AIProvider.GEMINI;
      } else if (aiConfig.provider === "openai") {
        provider = AIProvider.OPENAI;
      } else if (aiConfig.provider === "gemini") {
        provider = AIProvider.GEMINI;
      } else {
        provider = "openrouter";
      }

      apiKey = aiConfig.apiKey;
      model = aiConfig.model;

      console.log("[Recipe Recommendations - Manual] Using AI config:", {
        provider,
        hasApiKey: !!apiKey,
        model,
      });
    }

    const recommendationService = new RecipeRecommendationService(
      provider,
      apiKey,
      model
    );
    const recommendations = await recommendationService.generateRecommendations(
      ingredients,
      servings,
      minMatchPercentage,
      language,
      allergies
    );

    res.json({
      ...recommendations,
      ingredientsUsed: ingredients.length,
      servings,
      minMatchPercentage,
    });
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      error: error.message || "Failed to generate recipe recommendations",
    });
  }
};

// Get only public recipe recommendations (no AI)
export const getPublicRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      minMatchPercentage = 50,
      useInventory = true,
      manualIngredients = [],
      allergies = [],
      limit = 20,
    } = req.body;

    let ingredientsToUse: Array<{
      name: string;
      quantity: number;
      unit: string;
      category?: string;
    }> = [];

    // Get ingredients from inventory if requested
    if (useInventory) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          userId,
          quantity: { gt: 0 },
        },
        include: {
          ingredient: true,
        },
      });

      ingredientsToUse = inventoryItems.map((item) => ({
        name: item.ingredient.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.ingredient.category,
      }));
    }

    // Add manual ingredients if provided
    if (manualIngredients && manualIngredients.length > 0) {
      ingredientsToUse = [...ingredientsToUse, ...manualIngredients];
    }

    if (ingredientsToUse.length === 0) {
      return res.status(400).json({
        error:
          "No ingredients provided. Either enable inventory or add manual ingredients.",
      });
    }

    // Get public recipe recommendations
    const publicRecipes = await getPublicRecipeRecommendations(
      ingredientsToUse,
      minMatchPercentage,
      allergies,
      limit
    );

    const formattedRecipes = formatPublicRecipesAsRecommendations(
      publicRecipes,
      ingredientsToUse
    );

    res.json({
      recommendations: formattedRecipes,
      ingredientsUsed: ingredientsToUse.length,
      minMatchPercentage,
      source: "public_recipes",
      count: formattedRecipes.length,
    });
  } catch (error: any) {
    console.error("Error getting public recommendations:", error);
    res.status(500).json({
      error: error.message || "Failed to get public recipe recommendations",
    });
  }
};
