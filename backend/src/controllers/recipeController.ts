import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Get all recipes
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
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
    res.json({ recipes });
  } catch (error) {
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
