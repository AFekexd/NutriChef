import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

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

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update inventory item" });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.inventoryItem.delete({
      where: { inventoryItemId: id },
    });

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
