import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Get all recipes (public recipes + user's own recipes if authenticated)
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const recipes = await prisma.recipe.findMany({
      where: userId
        ? {
            OR: [{ isPublic: true }, { userId }],
          }
        : {
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
            email: true,
            oauthAvatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
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
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
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
      isPublic,
    } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        userId, // Use authenticated user's ID
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
        isPublic: isPublic ?? false, // Default to private
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
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            oauthAvatar: true,
          },
        },
      },
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: "Failed to create recipe" });
  }
};

// Update recipe
export const updateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, instructions, imageURL, calories, macros } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if recipe exists and belongs to user
    const existingRecipe = await prisma.recipe.findUnique({
      where: { recipeId: id },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    if (existingRecipe.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only modify your own recipes" });
    }

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
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
            oauthAvatar: true,
          },
        },
      },
    });

    res.json(recipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: "Failed to update recipe" });
  }
};

// Delete recipe
export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if recipe exists and belongs to user
    const existingRecipe = await prisma.recipe.findUnique({
      where: { recipeId: id },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    if (existingRecipe.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own recipes" });
    }

    await prisma.recipe.delete({
      where: { recipeId: id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting recipe:", error);
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

// Update recipe visibility (public/private)
export const updateRecipeVisibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if recipe exists and belongs to user
    const existingRecipe = await prisma.recipe.findUnique({
      where: { recipeId: id },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    if (existingRecipe.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You can only modify your own recipes" });
    }

    // Update visibility
    const recipe = await prisma.recipe.update({
      where: { recipeId: id },
      data: { isPublic },
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
            oauthAvatar: true,
          },
        },
      },
    });

    res.json(recipe);
  } catch (error) {
    console.error("Error updating recipe visibility:", error);
    res.status(500).json({ error: "Failed to update recipe visibility" });
  }
};

// Rate a recipe
export const rateRecipe = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = (req as any).user?.userId;

    if (!id) {
      return res.status(400).json({ error: "Recipe ID is required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { recipeId: id },
    });

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Check if user already rated this recipe
    const existingRating = await prisma.recipeRating.findUnique({
      where: {
        recipeId_userId: {
          recipeId: id,
          userId,
        },
      },
    });

    if (existingRating) {
      // Update existing rating
      await prisma.recipeRating.update({
        where: {
          recipeId_userId: {
            recipeId: id,
            userId,
          },
        },
        data: {
          rating,
          comment,
        },
      });
    } else {
      // Create new rating
      await prisma.recipeRating.create({
        data: {
          recipeId: id,
          userId,
          rating,
          comment,
        },
      });
    }

    // Calculate new average rating
    const ratings = await prisma.recipeRating.findMany({
      where: { recipeId: id },
    });

    const avgRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingCount = ratings.length;

    // Update recipe with new rating
    await prisma.recipe.update({
      where: { recipeId: id },
      data: {
        rating: avgRating,
        ratingCount,
      },
    });

    res.json({
      message: "Recipe rated successfully",
      rating: avgRating,
      ratingCount,
    });
  } catch (error) {
    console.error("Error rating recipe:", error);
    res.status(500).json({ error: "Failed to rate recipe" });
  }
};
