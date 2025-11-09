import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import {
  getRateLimitStatus,
  resetUserRateLimit,
} from "../middlewares/aiRateLimiter.js";
import {
  sendAccountDeletionEmail,
  sendAccountSuspensionEmail,
  sendAccountReactivationEmail,
} from "../services/emailService.js";
import {
  logAdminAction,
  getAdminLogs,
  createModerationAction,
  getActiveModerationActions,
  getUserModerationHistory,
  removeModerationAction,
} from "../services/adminLogService.js";
import {
  getApiLogs,
  getApiStats,
  cleanupOldApiLogs,
} from "../middlewares/apiLogger.js";

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

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

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
    const { isActive, reason } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Prevent deactivating yourself
    if (req.user?.userId === userId && !isActive) {
      res.status(400).json({ error: "Cannot deactivate your own account" });
      return;
    }

    // Get user details before update for email
    const userBeforeUpdate = await prisma.user.findUnique({
      where: { userId },
      select: {
        email: true,
        name: true,
        isActive: true,
      },
    });

    if (!userBeforeUpdate) {
      res.status(404).json({ error: "User not found" });
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

    // Invalidate all sessions if deactivating
    if (!isActive) {
      await prisma.session.updateMany({
        where: { userId, isValid: true },
        data: { isValid: false },
      });

      // Send suspension email
      sendAccountSuspensionEmail(user.email, user.name, reason).catch(
        (error) => {
          console.error("Failed to send account suspension email:", error);
        }
      );
    } else if (userBeforeUpdate.isActive === false) {
      // Send reactivation email only if account was previously inactive
      sendAccountReactivationEmail(user.email, user.name).catch((error) => {
        console.error("Failed to send account reactivation email:", error);
      });
    }

    // Log the action
    if (req.user?.userId) {
      await logAdminAction({
        adminUserId: req.user.userId,
        action: isActive ? "user_reactivated" : "user_suspended",
        targetType: "user",
        targetId: userId,
        targetEmail: user.email,
        targetName: user.name,
        details: { reason },
        req,
      });
    }

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

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

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

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Prevent deleting yourself
    if (req.user?.userId === userId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    // Get user details before deletion for email
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete user (cascade delete will handle related data)
    await prisma.user.delete({
      where: { userId },
    });

    // Log the action
    if (req.user?.userId) {
      await logAdminAction({
        adminUserId: req.user.userId,
        action: "user_deleted",
        targetType: "user",
        targetId: userId,
        targetEmail: user.email,
        targetName: user.name,
        req,
      });
    }

    // Send deletion notification email
    sendAccountDeletionEmail(user.email, user.name).catch((error) => {
      console.error("Failed to send account deletion email:", error);
      // Don't fail the request if email fails
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

    if (!itemId) {
      res.status(400).json({ error: "Item ID is required" });
      return;
    }

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

    if (!recipeId) {
      res.status(400).json({ error: "Recipe ID is required" });
      return;
    }

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

/**
 * Get AI rate limit status for a user
 */
export const getUserRateLimitStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const status = getRateLimitStatus(userId);

    res.json({
      userId,
      rateLimits: status,
    });
  } catch (error: any) {
    console.error("Error fetching rate limit status:", error);
    res.status(500).json({ error: "Failed to fetch rate limit status" });
  }
};

/**
 * Reset AI rate limit for a user
 */
export const resetUserAIRateLimit = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { service } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    resetUserRateLimit(userId, service);

    // Log the action
    if (req.user?.userId) {
      await logAdminAction({
        adminUserId: req.user.userId,
        action: "rate_limit_reset",
        targetType: "user",
        targetId: userId,
        details: { service: service || "all" },
        req,
      });
    }

    res.json({
      message: service
        ? `Rate limit reset for ${service}`
        : "All rate limits reset",
      userId,
      service: service || "all",
    });
  } catch (error: any) {
    console.error("Error resetting rate limit:", error);
    res.status(500).json({ error: "Failed to reset rate limit" });
  }
};

/**
 * Get admin activity logs
 */
export const getActivityLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      targetType,
      adminUserId,
      startDate,
      endDate,
    } = req.query;

    const result = await getAdminLogs({
      page: Number(page),
      limit: Number(limit),
      action: action as string,
      targetType: targetType as string,
      adminUserId: adminUserId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
};

/**
 * Send warning to user
 */
export const sendWarningToUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason, adminNote } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true, name: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create moderation action
    const moderationAction = await createModerationAction({
      userId,
      actionType: "warning",
      reason,
      adminUserId: req.user.userId,
      adminNote,
    });

    // Log the action
    await logAdminAction({
      adminUserId: req.user.userId,
      action: "user_warned",
      targetType: "user",
      targetId: userId,
      targetEmail: user.email,
      targetName: user.name,
      details: {
        reason,
        moderationActionId: moderationAction.moderationActionId,
      },
      req,
    });

    // TODO: Send email notification to user
    // await sendWarningEmail(user.email, user.name, reason);

    res.json({
      message: "Warning sent successfully",
      moderationAction,
    });
  } catch (error: any) {
    console.error("Error sending warning:", error);
    res.status(500).json({ error: "Failed to send warning" });
  }
};

/**
 * Timeout user (temporary suspension)
 */
export const timeoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason, duration, adminNote } = req.body; // duration in hours

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!duration || duration <= 0) {
      res.status(400).json({ error: "Valid duration in hours is required" });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Prevent timing out yourself
    if (req.user.userId === userId) {
      res.status(400).json({ error: "Cannot timeout your own account" });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true, name: true, isActive: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Create moderation action
    const moderationAction = await createModerationAction({
      userId,
      actionType: "timeout",
      reason,
      duration: Number(duration),
      adminUserId: req.user.userId,
      adminNote,
    });

    // Deactivate user account temporarily
    await prisma.user.update({
      where: { userId },
      data: { isActive: false },
    });

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false },
    });

    // Log the action
    await logAdminAction({
      adminUserId: req.user.userId,
      action: "user_timeout",
      targetType: "user",
      targetId: userId,
      targetEmail: user.email,
      targetName: user.name,
      details: {
        reason,
        duration,
        expiresAt: moderationAction.expiresAt,
        moderationActionId: moderationAction.moderationActionId,
      },
      req,
    });

    // Send timeout notification email
    await sendAccountSuspensionEmail(
      user.email,
      user.name,
      `Your account has been temporarily suspended for ${duration} hours. Reason: ${
        reason || "Policy violation"
      }`
    ).catch((error) => {
      console.error("Failed to send timeout email:", error);
    });

    res.json({
      message: `User account timed out for ${duration} hours`,
      moderationAction,
    });
  } catch (error: any) {
    console.error("Error timing out user:", error);
    res.status(500).json({ error: "Failed to timeout user" });
  }
};

/**
 * Ban user (permanent or with expiry)
 */
export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { reason, duration, adminNote } = req.body; // duration in hours (optional, null = permanent)

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Prevent banning yourself
    if (req.user.userId === userId) {
      res.status(400).json({ error: "Cannot ban your own account" });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true, name: true, isActive: true, role: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent banning other admins
    if (user.role === "admin") {
      res.status(403).json({ error: "Cannot ban another admin" });
      return;
    }

    // Create moderation action
    const moderationAction = await createModerationAction({
      userId,
      actionType: "ban",
      reason,
      duration: duration ? Number(duration) : undefined,
      adminUserId: req.user.userId,
      adminNote,
    });

    // Deactivate user account
    await prisma.user.update({
      where: { userId },
      data: { isActive: false },
    });

    // Invalidate all sessions
    await prisma.session.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false },
    });

    // Log the action
    await logAdminAction({
      adminUserId: req.user.userId,
      action: "user_banned",
      targetType: "user",
      targetId: userId,
      targetEmail: user.email,
      targetName: user.name,
      details: {
        reason,
        duration,
        isPermanent: !duration,
        expiresAt: moderationAction.expiresAt,
        moderationActionId: moderationAction.moderationActionId,
      },
      req,
    });

    // Send ban notification email
    const banMessage = duration
      ? `Your account has been banned for ${duration} hours. Reason: ${
          reason || "Policy violation"
        }`
      : `Your account has been permanently banned. Reason: ${
          reason || "Policy violation"
        }`;

    await sendAccountSuspensionEmail(user.email, user.name, banMessage).catch(
      (error) => {
        console.error("Failed to send ban email:", error);
      }
    );

    res.json({
      message: duration
        ? `User banned for ${duration} hours`
        : "User permanently banned",
      moderationAction,
    });
  } catch (error: any) {
    console.error("Error banning user:", error);
    res.status(500).json({ error: "Failed to ban user" });
  }
};

/**
 * Unban/lift timeout from user
 */
export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { email: true, name: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Get active moderation actions
    const activeActions = await getActiveModerationActions(userId);
    const banOrTimeout = activeActions.find(
      (a) => a.actionType === "ban" || a.actionType === "timeout"
    );

    if (!banOrTimeout) {
      res
        .status(400)
        .json({ error: "User is not currently banned or timed out" });
      return;
    }

    // Remove moderation action
    await removeModerationAction(
      banOrTimeout.moderationActionId,
      req.user.userId
    );

    // Reactivate user account
    await prisma.user.update({
      where: { userId },
      data: { isActive: true },
    });

    // Log the action
    await logAdminAction({
      adminUserId: req.user.userId,
      action: "user_unbanned",
      targetType: "user",
      targetId: userId,
      targetEmail: user.email,
      targetName: user.name,
      details: {
        previousActionType: banOrTimeout.actionType,
        moderationActionId: banOrTimeout.moderationActionId,
      },
      req,
    });

    // Send reactivation email
    await sendAccountReactivationEmail(user.email, user.name).catch((error) => {
      console.error("Failed to send reactivation email:", error);
    });

    res.json({
      message: "User unbanned successfully",
    });
  } catch (error: any) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ error: "Failed to unban user" });
  }
};

/**
 * Get user's moderation history
 */
export const getUserModeration = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const [activeActions, history] = await Promise.all([
      getActiveModerationActions(userId),
      getUserModerationHistory(userId),
    ]);

    res.json({
      activeActions,
      history,
    });
  } catch (error: any) {
    console.error("Error fetching user moderation:", error);
    res.status(500).json({ error: "Failed to fetch user moderation data" });
  }
};

/**
 * Get API activity logs (all users)
 */
export const getApiActivityLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      method,
      path,
      statusCode,
      startDate,
      endDate,
      searchTerm,
    } = req.query;

    const result = await getApiLogs({
      page: Number(page),
      limit: Number(limit),
      userId: userId as string,
      method: method as string,
      path: path as string,
      statusCode: statusCode ? Number(statusCode) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      searchTerm: searchTerm as string,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching API logs:", error);
    res.status(500).json({ error: "Failed to fetch API logs" });
  }
};

/**
 * Get API activity statistics
 */
export const getApiActivityStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, startDate, endDate } = req.query;

    const stats = await getApiStats({
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json(stats);
  } catch (error: any) {
    console.error("Error fetching API stats:", error);
    res.status(500).json({ error: "Failed to fetch API statistics" });
  }
};

/**
 * Clean up old API logs
 */
export const cleanupApiLogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { daysToKeep = 30 } = req.body;

    const count = await cleanupOldApiLogs(Number(daysToKeep));

    res.json({
      message: `Successfully deleted ${count} old API log entries`,
      deletedCount: count,
    });
  } catch (error: any) {
    console.error("Error cleaning up API logs:", error);
    res.status(500).json({ error: "Failed to cleanup API logs" });
  }
};
