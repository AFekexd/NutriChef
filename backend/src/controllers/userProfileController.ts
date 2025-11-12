// User Profile Management Controller
import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { encryptApiKey, decryptClientData } from "../services/aiService.js";
import { getRateLimitStatus } from "../middlewares/aiRateLimiter.js";

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

// Get AI API key configuration (without exposing the actual key)
export const getAIApiKeyConfig = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        aiProvider: true,
        useOwnApiKey: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      hasApiKey: user.useOwnApiKey,
      provider: user.aiProvider,
    });
  } catch (error: any) {
    console.error("Get AI API key config error:", error);
    res.status(500).json({ error: "Failed to fetch AI API key configuration" });
  }
};

/**
 * Validate API key by making a small test request
 */
async function validateAPIKey(
  apiKey: string,
  provider: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const testClient = new OpenAI({ apiKey });

      // Make a minimal test request (single token)
      await testClient.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 1,
      });

      return { valid: true };
    } else if (provider === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const testClient = new GoogleGenerativeAI(apiKey);
      const model = testClient.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      // Make a minimal test request
      await model.generateContent("Hi");

      return { valid: true };
    }

    return { valid: false, error: "Unsupported provider" };
  } catch (error: any) {
    console.error("API key validation error:", error);

    // Parse error messages
    if (error.status === 401 || error.message?.includes("Invalid API key")) {
      return { valid: false, error: "Invalid API key" };
    } else if (error.status === 429) {
      return { valid: false, error: "API key quota exceeded" };
    } else if (error.message?.includes("API_KEY_INVALID")) {
      return { valid: false, error: "Invalid API key format" };
    }

    return {
      valid: false,
      error: error.message || "Failed to validate API key",
    };
  }
}

// Save or update AI API key
export const saveAIApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { apiKey, provider, isClientEncrypted } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!apiKey || !provider) {
      return res
        .status(400)
        .json({ error: "API key and provider are required" });
    }

    if (!["openai", "gemini"].includes(provider)) {
      return res
        .status(400)
        .json({ error: "Invalid provider. Must be 'openai' or 'gemini'" });
    }

    let plainTextApiKey = apiKey;

    // If the API key was encrypted on the client side, decrypt it first
    if (isClientEncrypted) {
      try {
        plainTextApiKey = decryptClientData(apiKey);
        console.log("✅ Successfully decrypted client-encrypted API key");
      } catch (decryptError) {
        console.error(
          "Failed to decrypt client-encrypted API key:",
          decryptError
        );
        return res.status(400).json({
          error: "Failed to decrypt API key. Please try again.",
        });
      }
    }

    // Validate the API key with a small test request
    console.log(`🔍 Validating ${provider} API key...`);
    const validation = await validateAPIKey(plainTextApiKey, provider);

    if (!validation.valid) {
      console.error(`❌ API key validation failed: ${validation.error}`);
      return res.status(400).json({
        error: `Invalid API key: ${validation.error}`,
        validationFailed: true,
      });
    }

    console.log(`✅ API key validated successfully for ${provider}`);

    // Encrypt the API key for server-side storage using AES-256-GCM
    const encryptedData = encryptApiKey(plainTextApiKey);

    // Update user with encrypted API key and IV
    await prisma.user.update({
      where: { userId },
      data: {
        aiApiKey: encryptedData.value,
        aiApiKeyIv: encryptedData.iv,
        aiProvider: provider,
        useOwnApiKey: true,
      },
    });

    res.json({
      message: "AI API key saved successfully",
      provider,
      hasApiKey: true,
      validated: true,
    });
  } catch (error: any) {
    console.error("Save AI API key error:", error);
    res.status(500).json({ error: "Failed to save AI API key" });
  }
};

// Delete AI API key
export const deleteAIApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Remove AI API key from user
    await prisma.user.update({
      where: { userId },
      data: {
        aiApiKey: null,
        aiApiKeyIv: null,
        aiProvider: null,
        useOwnApiKey: false,
      },
    });

    res.json({
      message: "AI API key deleted successfully",
      hasApiKey: false,
    });
  } catch (error: any) {
    console.error("Delete AI API key error:", error);
    res.status(500).json({ error: "Failed to delete AI API key" });
  }
};

// OpenRouter API Key Management
// Get OpenRouter API key configuration (without exposing the actual key)
export const getOpenRouterApiKeyConfig = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        openrouterApiKey: true,
        openrouterUsage: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      hasApiKey: !!user.openrouterApiKey,
      usage: user.openrouterUsage || null,
    });
  } catch (error: any) {
    console.error("Get OpenRouter API key config error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch OpenRouter API key configuration" });
  }
};

// Save or update OpenRouter API key
export const saveOpenRouterApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { apiKey, isClientEncrypted } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }

    let plainTextApiKey = apiKey;

    // If the API key was encrypted on the client side, decrypt it first
    if (isClientEncrypted) {
      try {
        plainTextApiKey = decryptClientData(apiKey);
        console.log(
          "✅ Successfully decrypted client-encrypted OpenRouter API key"
        );
      } catch (decryptError) {
        console.error(
          "Failed to decrypt client-encrypted OpenRouter API key:",
          decryptError
        );
        return res.status(400).json({
          error: "Failed to decrypt API key. Please try again.",
        });
      }
    }

    // Validate the OpenRouter API key
    const {
      validateOpenRouterKey,
      encryptOpenRouterKey,
      fetchOpenRouterUsage,
    } = await import("../services/openRouterService.js");

    const validation = await validateOpenRouterKey(plainTextApiKey);

    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error || "Invalid OpenRouter API key",
      });
    }

    // Encrypt the API key for server-side storage using AES-256-GCM
    const encryptedData = encryptOpenRouterKey(plainTextApiKey);

    // Fetch initial usage data
    const usage = await fetchOpenRouterUsage(plainTextApiKey);

    // Update user with encrypted API key, IV, and usage data
    await prisma.user.update({
      where: { userId },
      data: {
        openrouterApiKey: encryptedData.value,
        openrouterApiKeyIv: encryptedData.iv,
        openrouterUsage: usage as any,
      },
    });

    res.json({
      message: "OpenRouter API key saved successfully",
      hasApiKey: true,
      usage,
    });
  } catch (error: any) {
    console.error("Save OpenRouter API key error:", error);
    res.status(500).json({ error: "Failed to save OpenRouter API key" });
  }
};

// Delete OpenRouter API key
export const deleteOpenRouterApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Remove OpenRouter API key from user
    await prisma.user.update({
      where: { userId },
      data: {
        openrouterApiKey: null,
        openrouterApiKeyIv: null,
        openrouterUsage: null as any,
      },
    });

    res.json({
      message: "OpenRouter API key deleted successfully",
      hasApiKey: false,
    });
  } catch (error: any) {
    console.error("Delete OpenRouter API key error:", error);
    res.status(500).json({ error: "Failed to delete OpenRouter API key" });
  }
};

// Refresh OpenRouter usage data
export const refreshOpenRouterUsage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        openrouterApiKey: true,
        openrouterApiKeyIv: true,
      },
    });

    if (!user || !user.openrouterApiKey || !user.openrouterApiKeyIv) {
      return res.status(404).json({ error: "OpenRouter API key not found" });
    }

    // Decrypt the API key and fetch usage
    const { decryptOpenRouterKey, fetchOpenRouterUsage } = await import(
      "../services/openRouterService.js"
    );
    const plainTextApiKey = decryptOpenRouterKey({
      value: user.openrouterApiKey,
      iv: user.openrouterApiKeyIv,
    });
    const usage = await fetchOpenRouterUsage(plainTextApiKey);

    // Update usage data in database
    await prisma.user.update({
      where: { userId },
      data: {
        openrouterUsage: usage as any,
      },
    });

    res.json({
      message: "Usage data refreshed successfully",
      usage,
    });
  } catch (error: any) {
    console.error("Refresh OpenRouter usage error:", error);
    res.status(500).json({ error: "Failed to refresh usage data" });
  }
};

// Get available OpenRouter models
export const getOpenRouterModels = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const searchQuery = req.query.search as string | undefined;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's API key to make authenticated request (optional)
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        openrouterApiKey: true,
        openrouterApiKeyIv: true,
      },
    });

    let apiKey: string | undefined;
    if (user?.openrouterApiKey && user?.openrouterApiKeyIv) {
      const { decryptOpenRouterKey } = await import(
        "../services/openRouterService.js"
      );
      apiKey = decryptOpenRouterKey({
        value: user.openrouterApiKey,
        iv: user.openrouterApiKeyIv,
      });
    }

    // Fetch models from OpenRouter
    const { fetchOpenRouterModels, searchModels } = await import(
      "../services/openRouterService.js"
    );

    let models = await fetchOpenRouterModels(apiKey);

    // Apply search filter if provided
    if (searchQuery) {
      models = searchModels(models, searchQuery);
    }

    res.json({
      models,
      total: models.length,
    });
  } catch (error: any) {
    console.error("Get OpenRouter models error:", error);
    res.status(500).json({ error: "Failed to fetch available models" });
  }
};

// Get OpenRouter key information with usage stats
export const getOpenRouterKeyInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's OpenRouter API key
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        openrouterApiKey: true,
        openrouterApiKeyIv: true,
      },
    });

    if (!user?.openrouterApiKey || !user?.openrouterApiKeyIv) {
      return res
        .status(404)
        .json({ error: "No OpenRouter API key configured" });
    }

    const { decryptOpenRouterKey, getOpenRouterKeyInfo } = await import(
      "../services/openRouterService.js"
    );

    const apiKey = decryptOpenRouterKey({
      value: user.openrouterApiKey,
      iv: user.openrouterApiKeyIv,
    });
    const keyInfo = await getOpenRouterKeyInfo(apiKey);

    if (!keyInfo) {
      return res.status(500).json({ error: "Failed to fetch key information" });
    }

    res.json({
      keyInfo,
      message: "OpenRouter key information retrieved successfully",
    });
  } catch (error: any) {
    console.error("Get OpenRouter key info error:", error);
    res.status(500).json({ error: "Failed to fetch key information" });
  }
};

// Save selected OpenRouter model
export const saveOpenRouterModel = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { modelId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!modelId) {
      return res.status(400).json({ error: "Model ID is required" });
    }

    // Update user with selected model
    await prisma.user.update({
      where: { userId },
      data: {
        openrouterModel: modelId,
      },
    });

    res.json({
      message: "OpenRouter model saved successfully",
      modelId,
    });
  } catch (error: any) {
    console.error("Save OpenRouter model error:", error);
    res.status(500).json({ error: "Failed to save selected model" });
  }
};

// Get selected OpenRouter model
export const getOpenRouterModel = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { openrouterModel: true },
    });

    res.json({
      modelId: user?.openrouterModel || null,
    });
  } catch (error: any) {
    console.error("Get OpenRouter model error:", error);
    res.status(500).json({ error: "Failed to fetch selected model" });
  }
};

// Get AI preferences for different features
export const getAIPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: { aiPreferences: true },
    });

    // Default preferences if not set
    const defaultPreferences = {
      textGeneration: "default",
      imageAnalysis: "default",
    };

    res.json({
      preferences: (user?.aiPreferences as any) || defaultPreferences,
    });
  } catch (error: any) {
    console.error("Get AI preferences error:", error);
    res.status(500).json({ error: "Failed to fetch AI preferences" });
  }
};

// Save AI preferences
export const saveAIPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { textGeneration, imageAnalysis } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate preference values
    const validOptions = ["default", "own", "openrouter"];
    if (
      (textGeneration && !validOptions.includes(textGeneration)) ||
      (imageAnalysis && !validOptions.includes(imageAnalysis))
    ) {
      return res.status(400).json({
        error:
          "Invalid preference value. Must be 'default', 'own', or 'openrouter'",
      });
    }

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { aiPreferences: true },
    });

    const currentPreferences = (user?.aiPreferences as any) || {
      textGeneration: "default",
      imageAnalysis: "default",
    };

    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...(textGeneration && { textGeneration }),
      ...(imageAnalysis && { imageAnalysis }),
    };

    await prisma.user.update({
      where: { userId },
      data: {
        aiPreferences: updatedPreferences as any,
      },
    });

    res.json({
      message: "AI preferences updated successfully",
      preferences: updatedPreferences,
    });
  } catch (error: any) {
    console.error("Save AI preferences error:", error);
    res.status(500).json({ error: "Failed to save AI preferences" });
  }
};

/**
 * Get current user's AI rate limit status (for server API key usage only)
 */
export const getAIRateLimitStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check if user has their own API key configured AND is using it
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        useOwnApiKey: true,
        aiApiKey: true,
        openrouterApiKey: true,
        aiPreferences: true,
      },
    });

    // Parse AI preferences to check if user is actually using their own keys
    const preferences = (user?.aiPreferences as any) || {};
    const textGenPref = preferences.textGeneration || "default";
    const imageAnalysisPref = preferences.imageAnalysis || "default";

    // User bypasses rate limits only if:
    // 1. They have "own" API key and textGen or imageAnalysis is set to "own", OR
    // 2. They have OpenRouter key and textGen or imageAnalysis is set to "openrouter"
    const usingOwnKey =
      (user?.useOwnApiKey &&
        user?.aiApiKey &&
        (textGenPref === "own" || imageAnalysisPref === "own")) ||
      (user?.openrouterApiKey &&
        (textGenPref === "openrouter" || imageAnalysisPref === "openrouter"));

    if (usingOwnKey) {
      res.json({
        userId,
        usingOwnApiKey: true,
        rateLimits: null,
        message: "Rate limits bypassed - using own API key",
      });
      return;
    }

    // Get rate limit status from the in-memory tracker
    const status = getRateLimitStatus(userId);

    // Calculate overall usage percentage
    const totalUsed =
      status.healthInsights.used +
      status.recipeRecommendations.used +
      status.inventoryAI.used;
    const totalLimit =
      status.healthInsights.limit +
      status.recipeRecommendations.limit +
      status.inventoryAI.limit;
    const overallPercentage = Math.round((totalUsed / totalLimit) * 100);

    res.json({
      userId,
      usingOwnApiKey: false,
      rateLimits: status,
      overall: {
        used: totalUsed,
        limit: totalLimit,
        percentage: overallPercentage,
      },
    });
  } catch (error: any) {
    console.error("Error fetching AI rate limit status:", error);
    res.status(500).json({ error: "Failed to fetch AI rate limit status" });
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
  getAIApiKeyConfig,
  saveAIApiKey,
  deleteAIApiKey,
  getOpenRouterApiKeyConfig,
  saveOpenRouterApiKey,
  deleteOpenRouterApiKey,
  refreshOpenRouterUsage,
  getOpenRouterModels,
  getOpenRouterKeyInfo,
  saveOpenRouterModel,
  getOpenRouterModel,
  getAIPreferences,
  saveAIPreferences,
  getAIRateLimitStatus,
};
