import { PrismaClient } from "../../generated/prisma/index.js";
import { BaseAIService, AIProvider } from "../services/aiService.js";
const prisma = new PrismaClient();
class RecipeRecommendationService extends BaseAIService {
    constructor() {
        // Use Gemini as the AI provider (you can change this to OPENAI if you add the API key)
        super(AIProvider.GEMINI);
    }
    async generateRecommendations(availableIngredients, servings = 2, minMatchPercentage = 60, language = "en", allergies = []) {
        const ingredientsList = availableIngredients
            .map((ing) => `${ing.name} (${ing.quantity} ${ing.unit})`)
            .join(", ");
        // Language-specific instructions
        const languageInstructions = language === "hu"
            ? "Válaszolj magyarul. Minden receptnév, hozzávaló, utasítás és leírás magyar nyelvű legyen."
            : "Respond in English. All recipe names, ingredients, instructions, and descriptions should be in English.";
        const allergiesText = allergies.length > 0
            ? `\n\nIMPORTANT - DIETARY RESTRICTIONS: The user is allergic to or wants to avoid: ${allergies.join(", ")}. 
DO NOT include ANY recipes that contain these ingredients in any form (including derivatives, extracts, or traces).
Exclude any recipe that might contain: ${allergies.join(", ")}.`
            : "";
        const systemMessage = `You are a professional chef and nutritionist. Generate recipe recommendations based on available ingredients.
Your recommendations should be realistic, healthy, and delicious.
${languageInstructions}
${allergiesText}
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
      "instructions": "Step by step instructions",
      "cuisineType": "Italian"
    }
  ]
}`;
        const prompt = `Based on these available ingredients: ${ingredientsList}

${allergies.length > 0
            ? `⚠️ CRITICAL: User is allergic to or avoiding: ${allergies.join(", ")}
DO NOT suggest ANY recipes containing these ingredients or their derivatives!
Filter out ALL recipes with: ${allergies.join(", ")}

`
            : ""}Generate 5 recipe recommendations that:
1. Match at least ${minMatchPercentage}% of ingredients from the available list
2. Serve ${servings} people
3. Include both recipes that can be made entirely with available ingredients and recipes that need 1-3 additional ingredients
4. Calculate match percentage based on the number of required ingredients that are available
5. Mark additional ingredients as "optional: false" if essential, or "optional: true" if nice-to-have
6. Include prep time, cook time, calories, and macros
7. Provide clear, step-by-step instructions
${allergies.length > 0
            ? `8. EXCLUDE any recipe containing: ${allergies.join(", ")}`
            : ""}

${language === "hu"
            ? "FONTOS: Az egész válasz magyarul legyen!"
            : "IMPORTANT: The entire response should be in English!"}

Return ONLY valid JSON with no additional text.`;
        try {
            const response = await this.generateContent(prompt, systemMessage);
            const recommendations = this.parseJSONResponse(response.content);
            return recommendations;
        }
        catch (error) {
            console.error("AI recommendation error:", error);
            throw new Error("Failed to generate recipe recommendations");
        }
    }
}
// Get recipe recommendations based on user's inventory
export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { servings = 2, minMatchPercentage = 60, useInventory = true, manualIngredients = [], language = "en", allergies = [], } = req.body;
        let ingredientsToUse = [];
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
                error: "No ingredients provided. Either enable inventory or add manual ingredients.",
            });
        }
        // Generate recommendations using AI
        const recommendationService = new RecipeRecommendationService();
        const recommendations = await recommendationService.generateRecommendations(ingredientsToUse, servings, minMatchPercentage, language, allergies);
        res.json({
            ...recommendations,
            ingredientsUsed: ingredientsToUse.length,
            servings,
            minMatchPercentage,
        });
    }
    catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({
            error: error.message || "Failed to generate recipe recommendations",
        });
    }
};
// Get recommendations with manual ingredient list
export const getRecommendationsWithIngredients = async (req, res) => {
    try {
        const { ingredients, servings = 2, minMatchPercentage = 60, language = "en", allergies = [], } = req.body;
        if (!ingredients || ingredients.length === 0) {
            return res.status(400).json({ error: "Ingredients list is required" });
        }
        const recommendationService = new RecipeRecommendationService();
        const recommendations = await recommendationService.generateRecommendations(ingredients, servings, minMatchPercentage, language, allergies);
        res.json({
            ...recommendations,
            ingredientsUsed: ingredients.length,
            servings,
            minMatchPercentage,
        });
    }
    catch (error) {
        console.error("Error generating recommendations:", error);
        res.status(500).json({
            error: error.message || "Failed to generate recipe recommendations",
        });
    }
};
//# sourceMappingURL=recipeRecommendationController.js.map