import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

/**
 * Get all users with statistics
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            {
              name: { contains: String(search), mode: "insensitive" as const },
            },
            {
              email: { contains: String(search), mode: "insensitive" as const },
            },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          userId: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              inventoryItems: true,
              recipes: true,
              sessions: true,
              loginHistory: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

/**
 * Get user details with all related data
 */
export const getUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inventoryItems: true,
            recipes: true,
            sessions: true,
            loginHistory: true,
            aiGeneratedRecipes: true,
          },
        },
        inventoryItems: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            ingredient: true,
          },
        },
        recipes: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        sessions: {
          where: { isValid: true },
          orderBy: { createdAt: "desc" },
        },
        loginHistory: {
          take: 20,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

/**
 * Update user status (activate/deactivate)
 */
export const updateUserStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Prevent deactivating yourself
    if (req.user?.userId === userId && !isActive) {
      res.status(400).json({ error: "Cannot deactivate your own account" });
      return;
    }

    const user = await prisma.user.update({
      where: { userId },
      data: { isActive },
      select: {
        userId: true,
        name: true,
        email: true,
        isActive: true,
      },
    });

    res.json({ user, message: "User status updated successfully" });
  } catch (error: any) {
    console.error("Error updating user status:", error);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!["user", "admin"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    // Prevent changing your own role
    if (req.user?.userId === userId) {
      res.status(400).json({ error: "Cannot change your own role" });
      return;
    }

    const user = await prisma.user.update({
      where: { userId },
      data: { role },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({ user, message: "User role updated successfully" });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

/**
 * Delete user and all related data
 */
export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (req.user?.userId === userId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    await prisma.user.delete({
      where: { userId },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

/**
 * Get all inventory items across all users
 */
export const getAllInventoryItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 50, userId, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (userId) {
      where.userId = String(userId);
    }
    if (search) {
      where.ingredient = {
        name: { contains: String(search), mode: "insensitive" as const },
      };
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          ingredient: true,
          user: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching inventory items:", error);
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
};

/**
 * Delete inventory item
 */
export const deleteInventoryItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { itemId } = req.params;

    await prisma.inventoryItem.delete({
      where: { inventoryItemId: itemId },
    });

    res.json({ message: "Inventory item deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
};

/**
 * Get all recipes across all users
 */
export const getAllRecipes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 50, userId, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (userId) {
      where.userId = String(userId);
    }
    if (search) {
      where.title = { contains: String(search), mode: "insensitive" as const };
    }

    const [recipes, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        include: {
          user: {
            select: {
              userId: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              recipeIngredients: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.recipe.count({ where }),
    ]);

    res.json({
      recipes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
};

/**
 * Delete recipe
 */
export const deleteRecipe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { recipeId } = req.params;

    await prisma.recipe.delete({
      where: { recipeId },
    });

    res.json({ message: "Recipe deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
};

/**
 * Get all uploaded images
 */
export const getAllUploadedImages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 50, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (userId) {
      where.userId = String(userId);
    }

    const [uploads, total] = await Promise.all([
      prisma.inventoryImageUpload.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryImageUpload.count({ where }),
    ]);

    res.json({
      uploads,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching uploaded images:", error);
    res.status(500).json({ error: "Failed to fetch uploaded images" });
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalInventoryItems,
      totalRecipes,
      totalUploads,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.inventoryItem.count(),
      prisma.recipe.count(),
      prisma.inventoryImageUpload.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          userId: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalInventoryItems,
        totalRecipes,
        totalUploads,
      },
      recentUsers,
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};
