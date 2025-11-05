// User Profile Management Controller
import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const prisma = new PrismaClient();

// Extend Express Request type
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "./uploads/avatars";
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const uniqueSuffix = Date.now();
    cb(
      null,
      `avatar-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
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

export const avatarUpload = upload.single("avatar");

// Get user profile with preferences and health goals
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        preferences: true,
        healthGoals: true,
        oauthProvider: true,
        oauthAvatar: true,
        isEmailVerified: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Update user preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { preferences } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate preferences structure
    const validPreferences = {
      dietaryRestrictions: preferences.dietaryRestrictions || [],
      allergies: preferences.allergies || [],
      cuisinePreferences: preferences.cuisinePreferences || [],
      dislikedIngredients: preferences.dislikedIngredients || [],
      calorieGoal: preferences.calorieGoal || 2000,
      macroGoals: preferences.macroGoals || { protein: 30, carbs: 40, fat: 30 },
    };

    const user = await prisma.user.update({
      where: { userId },
      data: { preferences: validPreferences },
      select: {
        userId: true,
        name: true,
        email: true,
        preferences: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
};

// Update health goals
export const updateHealthGoals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { healthGoals } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate health goals structure
    const validHealthGoals = {
      targetWeight: healthGoals.targetWeight || null,
      currentWeight: healthGoals.currentWeight || null,
      dailyCalories: healthGoals.dailyCalories || 2000,
      macroRatios: healthGoals.macroRatios || {
        protein: 30,
        carbs: 40,
        fat: 30,
      },
      activityLevel: healthGoals.activityLevel || "moderate", // sedentary, light, moderate, active, very_active
      weightGoal: healthGoals.weightGoal || "maintain", // lose, gain, maintain
      weeklyWeightChangeGoal: healthGoals.weeklyWeightChangeGoal || 0, // kg per week
    };

    const user = await prisma.user.update({
      where: { userId },
      data: { healthGoals: validHealthGoals },
      select: {
        userId: true,
        name: true,
        healthGoals: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    console.error("Update health goals error:", error);
    res.status(500).json({ error: "Failed to update health goals" });
  }
};

// Get user stats
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get counts and statistics
    const [inventoryCount, recipeCount, mealPlanCount, recentLogins] =
      await Promise.all([
        prisma.inventoryItem.count({ where: { userId } }),
        prisma.recipe.count({ where: { userId } }),
        prisma.mealPlan.count({ where: { userId } }),
        prisma.loginHistory.findMany({
          where: { userId, success: true },
          orderBy: { timestamp: "desc" },
          take: 5,
        }),
      ]);

    // Get expiring items (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringItems = await prisma.inventoryItem.count({
      where: {
        userId,
        expiryDate: {
          lte: sevenDaysFromNow,
          gte: new Date(),
        },
      },
    });

    res.json({
      inventoryCount,
      recipeCount,
      mealPlanCount,
      expiringItemsCount: expiringItems,
      recentLogins: recentLogins.map((login) => ({
        timestamp: login.timestamp,
        location: login.location,
        ipAddress: login.ipAddress,
      })),
    });
  } catch (error: any) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// Get user activity feed
export const getActivityFeed = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get recent activity
    const [recentInventory, recentRecipes, recentMealPlans] = await Promise.all(
      [
        prisma.inventoryItem.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: Number(limit) / 3,
          include: { ingredient: true },
        }),
        prisma.recipe.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: Number(limit) / 3,
        }),
        prisma.mealPlan.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: Number(limit) / 3,
          include: {
            mealPlanRecipes: {
              include: { recipe: true },
            },
          },
        }),
      ]
    );

    // Combine and sort by date
    const activities = [
      ...recentInventory.map((item) => ({
        type: "inventory",
        action: "added",
        item: item.ingredient.name,
        timestamp: item.createdAt,
      })),
      ...recentRecipes.map((recipe) => ({
        type: "recipe",
        action: recipe.isAIGenerated ? "generated" : "created",
        item: recipe.title,
        timestamp: recipe.createdAt,
      })),
      ...recentMealPlans.map((plan) => ({
        type: "meal_plan",
        action: "planned",
        item: `${plan.mealType} on ${plan.date.toLocaleDateString()}`,
        timestamp: plan.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, Number(limit));

    res.json(activities);
  } catch (error: any) {
    console.error("Get activity feed error:", error);
    res.status(500).json({ error: "Failed to fetch activity feed" });
  }
};

// Upload avatar
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const file = (req as MulterRequest).file;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check if user is OAuth user (they shouldn't manually upload)
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { oauthProvider: true, oauthAvatar: true },
    });

    // Delete old avatar file if it exists and is not an OAuth avatar
    if (user?.oauthAvatar && !user.oauthProvider) {
      const oldFilePath = path.join(process.cwd(), user.oauthAvatar);
      try {
        await fs.unlink(oldFilePath);
      } catch (err) {
        // Ignore error if file doesn't exist
        console.log("Old avatar file not found or already deleted");
      }
    }

    // Generate URL for the uploaded file
    const avatarUrl = `/uploads/avatars/${file.filename}`;

    // Update user with new avatar
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { oauthAvatar: avatarUrl },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        oauthProvider: true,
        oauthAvatar: true,
      },
    });

    res.json({
      message: "Avatar uploaded successfully",
      user: updatedUser,
      avatarUrl,
    });
  } catch (error: any) {
    console.error("Upload avatar error:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
};

// Delete avatar
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { oauthProvider: true, oauthAvatar: true },
    });

    // Don't allow deleting OAuth avatars
    if (user?.oauthProvider) {
      return res.status(400).json({
        error: "Cannot delete OAuth avatar. Disconnect OAuth account first.",
      });
    }

    // Delete file if it exists
    if (user?.oauthAvatar) {
      const filePath = path.join(process.cwd(), user.oauthAvatar);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log("Avatar file not found or already deleted");
      }
    }

    // Update user to remove avatar
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { oauthAvatar: null },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        oauthAvatar: true,
      },
    });

    res.json({
      message: "Avatar deleted successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Delete avatar error:", error);
    res.status(500).json({ error: "Failed to delete avatar" });
  }
};

export default {
  getUserProfile,
  updatePreferences,
  updateHealthGoals,
  getUserStats,
  getActivityFeed,
  uploadAvatar,
  deleteAvatar,
  avatarUpload,
};
