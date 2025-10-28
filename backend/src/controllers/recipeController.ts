import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Get all recipes
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const {
      cuisineType,
      difficulty,
      maxCookTime,
      minCookTime,
      dietaryTags,
      userId,
    } = req.query;

    // Build where clause dynamically
    const where: any = {};

    if (cuisineType && typeof cuisineType === 'string') {
      where.cuisineType = cuisineType;
    }

    if (difficulty && typeof difficulty === 'string') {
      where.difficulty = difficulty;
    }

    if (maxCookTime || minCookTime) {
      where.cookTime = {};
      if (maxCookTime) {
        const maxTime = parseInt(maxCookTime as string);
        if (!isNaN(maxTime)) {
          where.cookTime.lte = maxTime;
        }
      }
      if (minCookTime) {
        const minTime = parseInt(minCookTime as string);
        if (!isNaN(minTime)) {
          where.cookTime.gte = minTime;
        }
      }
    }

    if (userId && typeof userId === 'string') {
      where.userId = userId;
    }

    // Note: dietaryTags filtering would require JSON operations
    // For now, we'll fetch all and filter in memory if needed

    const recipes = await prisma.recipe.findMany({
      where,
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
            email: true,
          },
        },
      },
    });

    // If dietaryTags filter is provided, filter in memory
    // Note: Recipes without dietary tags are excluded when filtering by tags
    // This ensures only recipes explicitly marked with the requested tags are returned
    let filteredRecipes = recipes;
    if (dietaryTags && typeof dietaryTags === 'string') {
      const tags = dietaryTags.split(',');
      filteredRecipes = recipes.filter(recipe => {
        if (!recipe.dietaryTags || !Array.isArray(recipe.dietaryTags)) {
          return false; // Exclude recipes without dietary tags when filtering
        }
        return tags.some(tag => recipe.dietaryTags.includes(tag));
      });
    }

    res.json({ recipes: filteredRecipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
};

// Get recipe by ID
export const getRecipeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { recipeId: id },
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
            email: true,
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
};

// Create a new recipe
export const createRecipe = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      title,
      instructions,
      imageURL,
      calories,
      macros,
      servings,
      prepTime,
      cookTime,
      difficulty,
      cuisineType,
      ingredients,
    } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title,
        instructions,
        imageURL,
        calories,
        macros,
        servings: servings || 1,
        prepTime,
        cookTime,
        difficulty,
        cuisineType,
        recipeIngredients: {
          create:
            ingredients?.map((ing: any) => ({
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
            })) || [],
        },
      },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: "Failed to create recipe" });
  }
};

// Update recipe
export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, instructions, imageURL, calories, macros } = req.body;

    const recipe = await prisma.recipe.update({
      where: { recipeId: id },
      data: {
        title,
        instructions,
        imageURL,
        calories,
        macros,
      },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: "Failed to update recipe" });
  }
};

// Delete recipe
export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.recipe.delete({
      where: { recipeId: id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
};

// Get recipes by user
export const getRecipesByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const recipes = await prisma.recipe.findMany({
      where: { userId },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user recipes" });
  }
};
