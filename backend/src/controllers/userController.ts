import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { userId: id },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, preferences } = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        preferences,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, preferences } = req.body;

    const user = await prisma.user.update({
      where: { userId: id },
      data: {
        name,
        email,
        preferences,
      },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { userId: id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Get recent activities for a user
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch recent activities from different sources
    const [recentInventory, recentRecipes, recentMealPlans] = await Promise.all([
      // Recent inventory additions
      prisma.inventoryItem.findMany({
        where: { userId },
        select: {
          inventoryItemId: true,
          ingredient: {
            select: { name: true }
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // Recent recipes
      prisma.recipe.findMany({
        where: { userId },
        select: {
          recipeId: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      // Recent meal plans
      prisma.mealPlan.findMany({
        where: { userId },
        select: {
          mealPlanId: true,
          date: true,
          mealType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort all activities
    const activities = [
      ...recentInventory.map(item => ({
        id: item.inventoryItemId,
        type: 'inventory' as const,
        title: `Added ${item.ingredient.name} to inventory`,
        timestamp: item.createdAt,
      })),
      ...recentRecipes.map(recipe => ({
        id: recipe.recipeId,
        type: 'recipe' as const,
        title: `Saved recipe: ${recipe.title}`,
        timestamp: recipe.createdAt,
      })),
      ...recentMealPlans.map(plan => ({
        id: plan.mealPlanId,
        type: 'mealplan' as const,
        title: `Planned ${plan.mealType} for ${new Date(plan.date).toLocaleDateString()}`,
        timestamp: plan.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    res.json({ activities });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ error: "Failed to fetch recent activities" });
  }
};
