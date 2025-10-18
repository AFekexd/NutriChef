import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Get all ingredients
export const getIngredients = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const ingredients = await prisma.ingredient.findMany({
      where: category ? { category: category as string } : undefined,
    });

    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
};

// Get ingredient by ID
export const getIngredientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findUnique({
      where: { ingredientId: id },
    });

    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
};

// Create a new ingredient
export const createIngredient = async (req: Request, res: Response) => {
  try {
    const { name, category, nutritionalInfo, carbonFootprint } = req.body;

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        category,
        nutritionalInfo,
        carbonFootprint,
      },
    });

    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Failed to create ingredient" });
  }
};

// Update ingredient
export const updateIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, nutritionalInfo, carbonFootprint } = req.body;

    const ingredient = await prisma.ingredient.update({
      where: { ingredientId: id },
      data: {
        name,
        category,
        nutritionalInfo,
        carbonFootprint,
      },
    });

    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: "Failed to update ingredient" });
  }
};

// Delete ingredient
export const deleteIngredient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.ingredient.delete({
      where: { ingredientId: id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
};
