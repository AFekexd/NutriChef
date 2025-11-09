import { PrismaClient } from "../../generated/prisma/index.js";
import type { Request } from "express";

const prisma = new PrismaClient();

interface LogActionParams {
  adminUserId: string;
  action: string;
  targetType: "user" | "recipe" | "inventory" | "upload" | "system";
  targetId?: string;
  targetEmail?: string;
  targetName?: string;
  details?: any;
  req?: Request;
}

/**
 * Log an admin action to the database
 */
export const logAdminAction = async (params: LogActionParams) => {
  try {
    await prisma.adminLog.create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetEmail: params.targetEmail,
        targetName: params.targetName,
        details: params.details || {},
        ipAddress: params.req?.ip || params.req?.socket.remoteAddress,
        userAgent: params.req?.get("user-agent"),
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Don't throw - logging failure shouldn't break the main operation
  }
};

/**
 * Get admin logs with pagination and filtering
 */
export const getAdminLogs = async (params: {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  adminUserId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const {
    page = 1,
    limit = 50,
    action,
    targetType,
    adminUserId,
    startDate,
    endDate,
  } = params;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (adminUserId) where.adminUserId = adminUserId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
    }),
    prisma.adminLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create a moderation action (warning, timeout, ban)
 */
export const createModerationAction = async (params: {
  userId: string;
  actionType: "warning" | "timeout" | "ban";
  reason?: string;
  duration?: number; // hours
  adminUserId: string;
  adminNote?: string;
}) => {
  const { userId, actionType, reason, duration, adminUserId, adminNote } =
    params;

  let expiresAt: Date | null = null;
  if (duration) {
    expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);
  }

  // Deactivate previous active moderation actions of the same type
  await prisma.userModerationAction.updateMany({
    where: {
      userId,
      actionType,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  const moderationAction = await prisma.userModerationAction.create({
    data: {
      userId,
      actionType,
      reason,
      duration,
      expiresAt,
      adminUserId,
      adminNote,
      isActive: true,
      timestamp: new Date(),
    },
  });

  return moderationAction;
};

/**
 * Get active moderation actions for a user
 */
export const getActiveModerationActions = async (userId: string) => {
  const now = new Date();

  const actions = await prisma.userModerationAction.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { timestamp: "desc" },
  });

  return actions;
};

/**
 * Get all moderation history for a user
 */
export const getUserModerationHistory = async (userId: string) => {
  const actions = await prisma.userModerationAction.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });

  return actions;
};

/**
 * Remove/deactivate a moderation action
 */
export const removeModerationAction = async (
  moderationActionId: string,
  adminUserId: string
) => {
  const action = await prisma.userModerationAction.update({
    where: { moderationActionId },
    data: { isActive: false },
  });

  // Log the removal
  await logAdminAction({
    adminUserId,
    action: "moderation_removed",
    targetType: "user",
    targetId: action.userId,
    details: {
      moderationActionId,
      originalActionType: action.actionType,
    },
  });

  return action;
};

/**
 * Check if user has active ban or timeout
 */
export const isUserModerated = async (userId: string) => {
  const now = new Date();

  const activeBanOrTimeout = await prisma.userModerationAction.findFirst({
    where: {
      userId,
      actionType: { in: ["ban", "timeout"] },
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  return activeBanOrTimeout;
};

/**
 * Clean up expired moderation actions
 */
export const cleanupExpiredModerations = async () => {
  const now = new Date();

  const result = await prisma.userModerationAction.updateMany({
    where: {
      isActive: true,
      expiresAt: { lte: now },
    },
    data: {
      isActive: false,
    },
  });

  return result.count;
};
