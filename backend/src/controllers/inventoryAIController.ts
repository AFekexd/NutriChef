// Enhanced Inventory Controller with Vision AI
import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import visionAI from "../services/visionAI.js";

const prisma = new PrismaClient();

// Extend Express Request type
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || "./uploads/inventory";
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "inventory-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
        )
      );
    }
  },
});

export const uploadMiddleware = upload.single("image");

// Upload and analyze fridge/pantry image
export const uploadInventoryImage = async (req: Request, res: Response) => {
  try {
    console.log("[uploadInventoryImage] Request received:", {
      userId: req.user?.userId,
      hasFile: !!(req as MulterRequest).file,
    });

    const userId = req.user?.userId;

    if (!userId) {
      console.log("[uploadInventoryImage] Unauthorized - no userId");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const file = (req as MulterRequest).file;

    if (!file) {
      console.log("[uploadInventoryImage] No file uploaded");
      return res.status(400).json({ error: "No image file uploaded" });
    }

    console.log("[uploadInventoryImage] File received:", {
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    });

    const imagePath = file.path;

    // Optimize image
    const optimizedPath = imagePath.replace(/\.[^.]+$/, "-optimized.jpg");
    console.log("[uploadInventoryImage] Optimizing image...");
    await visionAI.optimizeImage(imagePath, optimizedPath);

    // Detect ingredients using AI
    console.log("[uploadInventoryImage] Detecting ingredients...");
    const detectionResult = await visionAI.detectIngredients(optimizedPath);
    console.log("[uploadInventoryImage] Detection complete:", {
      itemsDetected: detectionResult.totalItemsDetected,
      aiService: detectionResult.aiService,
      processingTime: detectionResult.processingTime,
    });

    // Store upload record in database (serialize detectedItems as JSON)
    const uploadRecord = await prisma.inventoryImageUpload.create({
      data: {
        userId,
        imageUrl: optimizedPath,
        detectedItems: JSON.parse(JSON.stringify(detectionResult.items)), // Convert to plain object
        aiService: detectionResult.aiService,
        processingTime: detectionResult.processingTime,
        wasAccepted: false,
      },
    });

    console.log(
      "[uploadInventoryImage] Upload record created:",
      uploadRecord.uploadId
    );

    // Clean up original unoptimized image
    await fs.unlink(imagePath).catch(() => {});

    res.json({
      uploadId: uploadRecord.uploadId,
      detectedItems: detectionResult.items,
      totalItemsDetected: detectionResult.totalItemsDetected,
      processingTime: detectionResult.processingTime,
      aiService: detectionResult.aiService,
      imageUrl: `/uploads/${path.basename(optimizedPath)}`,
    });
  } catch (error: any) {
    console.error("[uploadInventoryImage] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Clean up file on error
    const file = (req as MulterRequest).file;
    if (file) {
      await fs.unlink(file.path).catch(() => {});
    }

    res.status(500).json({
      error: "Failed to process image",
      details: error.message,
    });
  }
};

// Confirm and add AI-detected items to inventory
export const confirmDetectedItems = async (req: Request, res: Response) => {
  try {
    console.log("[confirmDetectedItems] Request received:", {
      userId: req.user?.userId,
      uploadId: req.body.uploadId,
      itemsCount: req.body.items?.length,
    });

    const userId = req.user?.userId;
    const { uploadId, items } = req.body;

    if (!userId) {
      console.log("[confirmDetectedItems] Unauthorized - no userId");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!items || !Array.isArray(items)) {
      console.log("[confirmDetectedItems] Invalid items array");
      return res.status(400).json({ error: "Invalid items array" });
    }

    // Verify upload belongs to user
    console.log("[confirmDetectedItems] Verifying upload ownership...");
    const uploadRecord = await prisma.inventoryImageUpload.findFirst({
      where: {
        uploadId,
        userId,
      },
    });

    if (!uploadRecord) {
      console.log("[confirmDetectedItems] Upload not found:", uploadId);
      return res.status(404).json({ error: "Upload not found" });
    }

    console.log("[confirmDetectedItems] Processing items...");
    // Process each confirmed item
    const createdItems = [];

    for (const item of items) {
      console.log("[confirmDetectedItems] Processing item:", item.name);

      // Find or create ingredient
      let ingredient = await prisma.ingredient.findFirst({
        where: {
          name: {
            equals: item.name,
            mode: "insensitive",
          },
        },
      });

      if (!ingredient) {
        console.log(
          "[confirmDetectedItems] Creating new ingredient:",
          item.name
        );
        // Create new ingredient
        ingredient = await prisma.ingredient.create({
          data: {
            name: item.name,
            category: item.category || "other",
            nutritionalInfo: {}, // Will be populated later
            carbonFootprint: 0,
          },
        });
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (item.estimatedExpiry || 7));

      // Create inventory item
      const inventoryItem = await prisma.inventoryItem.create({
        data: {
          userId,
          ingredientId: ingredient.ingredientId,
          quantity: item.quantity || 1,
          unit: item.unit || "whole",
          expiryDate,
          location: item.location || "fridge",
          imageUrl: uploadRecord.imageUrl,
          aiDetected: true,
        },
        include: {
          ingredient: true,
        },
      });

      createdItems.push(inventoryItem);
    }

    // Mark upload as accepted
    await prisma.inventoryImageUpload.update({
      where: { uploadId },
      data: { wasAccepted: true },
    });

    console.log(
      "[confirmDetectedItems] Successfully created items:",
      createdItems.length
    );

    res.json({
      message: "Items added to inventory successfully",
      itemsAdded: createdItems.length,
      items: createdItems,
    });
  } catch (error: any) {
    console.error("[confirmDetectedItems] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      error: "Failed to add items to inventory",
      details: error.message,
    });
  }
};

// Get items expiring soon
export const getExpiringItems = async (req: Request, res: Response) => {
  try {
    console.log("[getExpiringItems] Request received:", {
      userId: req.user?.userId,
      query: req.query,
      headers: req.headers.authorization ? "Bearer token present" : "No token",
    });

    const userId = req.user?.userId;
    const { days = 7 } = req.query;

    if (!userId) {
      console.log("[getExpiringItems] Unauthorized - no userId");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const daysAhead = parseInt(days as string);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    console.log("[getExpiringItems] Querying with:", {
      userId,
      daysAhead,
      futureDate: futureDate.toISOString(),
      now: new Date().toISOString(),
    });

    const expiringItems = await prisma.inventoryItem.findMany({
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

    console.log("[getExpiringItems] Found items:", expiringItems.length);

    res.json({
      expiringCount: expiringItems.length,
      daysAhead,
      items: expiringItems,
    });
  } catch (error: any) {
    console.error("[getExpiringItems] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to fetch expiring items",
      details: error.message,
    });
  }
};

// Get items by location
export const getItemsByLocation = async (req: Request, res: Response) => {
  try {
    console.log("[getItemsByLocation] Request received:", {
      userId: req.user?.userId,
      location: req.params.location,
    });

    const userId = req.user?.userId;
    const { location } = req.params;

    if (!userId) {
      console.log("[getItemsByLocation] Unauthorized - no userId");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!location || !["fridge", "pantry", "freezer"].includes(location)) {
      console.log("[getItemsByLocation] Invalid location:", location);
      return res.status(400).json({
        error: "Invalid location. Must be: fridge, pantry, or freezer",
      });
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        userId,
        location,
      },
      include: {
        ingredient: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    console.log("[getItemsByLocation] Found items:", items.length);

    res.json({
      location,
      itemCount: items.length,
      items,
    });
  } catch (error: any) {
    console.error("[getItemsByLocation] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res.status(500).json({
      error: "Failed to fetch items",
      details: error.message,
    });
  }
};

// Get inventory analytics
export const getInventoryAnalytics = async (req: Request, res: Response) => {
  try {
    console.log("[getInventoryAnalytics] Request received:", {
      userId: req.user?.userId,
    });

    const userId = req.user?.userId;

    if (!userId) {
      console.log("[getInventoryAnalytics] Unauthorized - no userId");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("[getInventoryAnalytics] Fetching location counts...");
    // Get counts by location
    const [fridgeCount, pantryCount, freezerCount] = await Promise.all([
      prisma.inventoryItem.count({ where: { userId, location: "fridge" } }),
      prisma.inventoryItem.count({ where: { userId, location: "pantry" } }),
      prisma.inventoryItem.count({ where: { userId, location: "freezer" } }),
    ]);

    console.log("[getInventoryAnalytics] Location counts:", {
      fridge: fridgeCount,
      pantry: pantryCount,
      freezer: freezerCount,
    });

    console.log("[getInventoryAnalytics] Fetching items with ingredients...");
    // Get counts by category
    const itemsWithIngredients = await prisma.inventoryItem.findMany({
      where: { userId },
      include: {
        ingredient: {
          select: { category: true },
        },
      },
    });

    console.log(
      "[getInventoryAnalytics] Total items:",
      itemsWithIngredients.length
    );

    const categoryCount: { [key: string]: number } = {};
    itemsWithIngredients.forEach((item) => {
      const category = item.ingredient.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    console.log("[getInventoryAnalytics] Category breakdown:", categoryCount);

    // Get expiry statistics
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log("[getInventoryAnalytics] Fetching expiry statistics...");
    const [expiredCount, expiring3Days, expiring7Days] = await Promise.all([
      prisma.inventoryItem.count({
        where: { userId, expiryDate: { lt: now } },
      }),
      prisma.inventoryItem.count({
        where: { userId, expiryDate: { gte: now, lte: threeDays } },
      }),
      prisma.inventoryItem.count({
        where: { userId, expiryDate: { gte: now, lte: sevenDays } },
      }),
    ]);

    console.log("[getInventoryAnalytics] Expiry stats:", {
      expired: expiredCount,
      expiring3Days,
      expiring7Days,
    });

    // Get AI detection stats
    const aiDetectedCount = await prisma.inventoryItem.count({
      where: { userId, aiDetected: true },
    });

    console.log("[getInventoryAnalytics] AI detected count:", aiDetectedCount);

    const response = {
      totalItems: itemsWithIngredients.length,
      byLocation: {
        fridge: fridgeCount,
        pantry: pantryCount,
        freezer: freezerCount,
      },
      byCategory: categoryCount,
      expiryStatus: {
        expired: expiredCount,
        expiring3Days,
        expiring7Days,
      },
      aiDetectedCount,
      aiDetectionPercentage:
        itemsWithIngredients.length > 0
          ? Math.round((aiDetectedCount / itemsWithIngredients.length) * 100)
          : 0,
    };

    console.log("[getInventoryAnalytics] Sending response:", response);

    res.json(response);
  } catch (error: any) {
    console.error("[getInventoryAnalytics] Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to fetch analytics",
      details: error.message,
    });
  }
};

// Update consumption rate
export const updateConsumption = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantityConsumed } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!id) {
      return res.status(400).json({ error: "Inventory item ID is required" });
    }

    if (!quantityConsumed || quantityConsumed <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    // Get inventory item
    const item = await prisma.inventoryItem.findFirst({
      where: {
        inventoryItemId: id,
        userId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Log consumption
    await prisma.consumptionLog.create({
      data: {
        userId,
        inventoryItemId: id,
        quantityConsumed,
        dateTime: new Date(),
      },
    });

    // Update quantity
    const newQuantity = Math.max(0, item.quantity - quantityConsumed);
    const updatedItem = await prisma.inventoryItem.update({
      where: { inventoryItemId: id },
      include: { ingredient: true },
      data: { quantity: newQuantity },
    });

    // Calculate consumption rate if we have enough data
    const logs = await prisma.consumptionLog.findMany({
      where: { inventoryItemId: id },
      orderBy: { dateTime: "asc" },
    });

    if (logs.length >= 2) {
      const totalConsumed = logs.reduce(
        (sum, log) => sum + log.quantityConsumed,
        0
      );
      const firstLog = logs[0];
      const lastLog = logs[logs.length - 1];

      if (firstLog && lastLog) {
        const daysDiff =
          (lastLog.dateTime.getTime() - firstLog.dateTime.getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysDiff > 0) {
          const consumptionRate = totalConsumed / daysDiff;
          await prisma.inventoryItem.update({
            where: { inventoryItemId: id },
            data: { consumptionRate },
          });
        }
      }
    }

    res.json({
      message: "Consumption logged successfully",
      item: updatedItem,
      remainingQuantity: newQuantity,
    });
  } catch (error: any) {
    console.error("Update consumption error:", error);
    res.status(500).json({ error: "Failed to update consumption" });
  }
};

export default {
  uploadMiddleware,
  uploadInventoryImage,
  confirmDetectedItems,
  getExpiringItems,
  getItemsByLocation,
  getInventoryAnalytics,
  updateConsumption,
};
