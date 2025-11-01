import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Helper function to invalidate recipe recommendations cache when inventory changes
async function invalidateRecipeCache(userId: string) {
  try {
    await prisma.recipeRecommendationsCache.deleteMany({
      where: { userId },
    });
    console.log(`🗑️  Invalidated recipe cache for user ${userId}`);
  } catch (error) {
    console.error("Error invalidating recipe cache:", error);
  }
}

// Get all inventory items for a user
export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const items = await prisma.inventoryItem.findMany({
      where: { userId },
      include: {
        ingredient: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
};

// Get all inventory items for authenticated user (from token)
export const getMyInventoryItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const items = await prisma.inventoryItem.findMany({
      where: { userId: req.user.userId },
      include: {
        ingredient: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory items" });
  }
};

// Get inventory item by ID
export const getInventoryItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.inventoryItem.findUnique({
      where: { inventoryItemId: id },
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
    });

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory item" });
  }
};

// Create a new inventory item
export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      ingredientId,
      quantity,
      unit,
      expiryDate,
      consumptionRate,
    } = req.body;

    const item = await prisma.inventoryItem.create({
      data: {
        userId,
        ingredientId,
        quantity,
        unit,
        expiryDate: new Date(expiryDate),
        consumptionRate,
      },
      include: {
        ingredient: true,
      },
    });

    // Invalidate recipe recommendations cache since inventory changed
    await invalidateRecipeCache(userId);

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to create inventory item" });
  }
};

// Update inventory item
export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, unit, expiryDate, consumptionRate } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { inventoryItemId: id },
      data: {
        quantity,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        consumptionRate,
      },
      include: {
        ingredient: true,
      },
    });

    // Invalidate recipe recommendations cache since inventory changed
    await invalidateRecipeCache(item.userId);

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update inventory item" });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get the item first to get userId for cache invalidation
    const item = await prisma.inventoryItem.findUnique({
      where: { inventoryItemId: id },
    });

    if (item) {
      await prisma.inventoryItem.delete({
        where: { inventoryItemId: id },
      });

      // Invalidate recipe recommendations cache since inventory changed
      await invalidateRecipeCache(item.userId);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete inventory item" });
  }
};

// Get expiring items
export const getExpiringItems = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const daysAhead = parseInt(req.query.days as string) || 7;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const items = await prisma.inventoryItem.findMany({
      where: {
        userId,
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expiring items" });
  }
};

// Get expiring items for authenticated user (from token)
export const getMyExpiringItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const daysAhead = parseInt(req.query.days as string) || 7;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const items = await prisma.inventoryItem.findMany({
      where: {
        userId: req.user.userId,
        expiryDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    res.json({
      expiringCount: items.length,
      daysAhead,
      items,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch expiring items" });
  }
};

// Get inventory analytics for authenticated user
export const getInventoryAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userId = req.user.userId;

    // Get total items count
    const totalItems = await prisma.inventoryItem.count({
      where: { userId },
    });

    // Get items by location
    const byLocation = await prisma.inventoryItem.groupBy({
      by: ["unit"],
      where: { userId },
      _count: true,
    });

    // Get items expiring in 7 days
    const expiringDate = new Date();
    expiringDate.setDate(expiringDate.getDate() + 7);

    const expiringItems = await prisma.inventoryItem.count({
      where: {
        userId,
        expiryDate: {
          lte: expiringDate,
          gte: new Date(),
        },
      },
    });

    // Get total value (estimated)
    const items = await prisma.inventoryItem.findMany({
      where: { userId },
      include: { ingredient: true },
    });

    const totalValue = items.reduce((sum, item) => {
      // Estimate value based on quantity and carbonFootprint as proxy
      return sum + item.quantity * (item.ingredient.carbonFootprint || 1);
    }, 0);

    res.json({
      totalItems,
      expiringItems,
      totalValue: Math.round(totalValue * 100) / 100,
      byLocation: {
        fridge: items.filter((i) => i.unit === "g").length,
        pantry: items.filter((i) => i.unit === "tbsp").length,
        freezer: items.filter((i) => i.unit === "clove" || i.unit === "cloves")
          .length,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

// Get items by location for authenticated user
export const getItemsByLocation = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { location } = req.params;
    const validLocations = ["fridge", "pantry", "freezer"];

    if (!validLocations.includes(location)) {
      return res.status(400).json({ error: "Invalid location" });
    }

    // Map location to unit or other criteria
    const unitMap: { [key: string]: string[] } = {
      fridge: ["g"],
      pantry: ["tbsp"],
      freezer: ["clove", "cloves"],
    };

    const items = await prisma.inventoryItem.findMany({
      where: {
        userId: req.user.userId,
        unit: {
          in: unitMap[location] || [],
        },
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    res.json({
      location,
      itemCount: items.length,
      items,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items by location" });
  }
};

// Add manual inventory item (creates ingredient if not exists)
export const addManualInventoryItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { ingredientName, quantity, unit, location, expiryDate, category } =
      req.body;

    // Validation
    if (!ingredientName || !quantity || !unit) {
      return res.status(400).json({
        error: "ingredientName, quantity, and unit are required",
      });
    }

    // Find or create ingredient
    let ingredient = await prisma.ingredient.findFirst({
      where: {
        name: {
          equals: ingredientName,
          mode: "insensitive",
        },
      },
    });

    if (!ingredient) {
      // Create new ingredient
      ingredient = await prisma.ingredient.create({
        data: {
          name: ingredientName,
          category: category || "other",
          // Default values for other fields
          nutritionalInfo: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
          },
          carbonFootprint: 0,
        },
      });
    }

    // Calculate expiry date if not provided
    let parsedExpiryDate: Date;
    if (expiryDate && expiryDate.trim() !== "") {
      parsedExpiryDate = new Date(expiryDate);
    } else {
      // Default to 7 days from now
      parsedExpiryDate = new Date();
      parsedExpiryDate.setDate(parsedExpiryDate.getDate() + 7);
    }

    // Create inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        userId: req.user.userId,
        ingredientId: ingredient.ingredientId,
        quantity: parseFloat(quantity.toString()),
        unit,
        expiryDate: parsedExpiryDate,
        aiDetected: false,
        location: location || "pantry",
      },
      include: {
        ingredient: true,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding manual inventory item:", error);
    res.status(500).json({ error: "Failed to add inventory item" });
  }
};
