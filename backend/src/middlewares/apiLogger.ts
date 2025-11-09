import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// Paths to exclude from logging (to avoid noise and circular logging)
const EXCLUDED_PATHS = [
  "/api/admin/logs", // Avoid logging the log viewing endpoint
  "/api/admin/api-logs", // Avoid logging the API log viewing endpoint
  "/health",
  "/favicon.ico",
];

// Sensitive fields to filter from request/response bodies
const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "aiApiKey",
  "secret",
  "creditCard",
  "ssn",
];

/**
 * Recursively filter sensitive data from objects
 */
function filterSensitiveData(obj: any): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => filterSensitiveData(item));
  }

  const filtered: any = {};
  for (const key in obj) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      filtered[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object") {
      filtered[key] = filterSensitiveData(obj[key]);
    } else {
      filtered[key] = obj[key];
    }
  }
  return filtered;
}

/**
 * Middleware to log all API requests and responses
 */
export const apiLogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get the full path (including /api prefix)
  const fullPath = req.originalUrl?.split("?")[0] || req.path; // Remove query params

  // Skip excluded paths
  if (EXCLUDED_PATHS.some((path) => fullPath.startsWith(path))) {
    return next();
  }

  const startTime = Date.now();

  // Capture the original res.json to intercept response
  const originalJson = res.json.bind(res);
  let responseBody: any = null;
  let statusCode = 200;

  res.json = function (body: any) {
    responseBody = body;
    statusCode = res.statusCode;
    return originalJson(body);
  };

  // Continue with the request
  res.on("finish", async () => {
    try {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Get user info if authenticated
      const userId = req.user?.userId || null;
      const userEmail = req.user?.email || null;

      // Fetch user name from database if we have userId
      let userName: string | null = null;
      if (userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { userId },
            select: { name: true },
          });
          userName = user?.name || null;
        } catch (error) {
          // Ignore errors fetching user name
        }
      }

      // Filter sensitive data from request and response
      const filteredRequestBody =
        req.body && Object.keys(req.body).length > 0
          ? filterSensitiveData(req.body)
          : null;

      const filteredResponseBody =
        responseBody && Object.keys(responseBody).length > 0
          ? filterSensitiveData(responseBody)
          : null;

      // Log to database (fire and forget, don't block the response)
      prisma.apiLog
        .create({
          data: {
            userId,
            userEmail,
            userName,
            method: req.method,
            path: fullPath,
            statusCode: statusCode,
            responseTime,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get("user-agent"),
            requestBody: filteredRequestBody,
            responseBody: statusCode >= 400 ? filteredResponseBody : null, // Only log response body for errors
            errorMessage:
              statusCode >= 400 && responseBody?.error
                ? responseBody.error
                : null,
            timestamp: new Date(),
          },
        })
        .catch((error) => {
          // Don't let logging errors break the application
          console.error("Failed to log API request:", error);
        });
    } catch (error) {
      console.error("Error in API logger:", error);
    }
  });

  next();
};

/**
 * Get API logs with filtering and pagination (admin only)
 */
export const getApiLogs = async (params: {
  page?: number;
  limit?: number;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}) => {
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
  } = params;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (userId) where.userId = userId;
  if (method) where.method = method;
  if (path) where.path = { contains: path };
  if (statusCode) where.statusCode = statusCode;

  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  if (searchTerm) {
    where.OR = [
      { userEmail: { contains: searchTerm, mode: "insensitive" as const } },
      { userName: { contains: searchTerm, mode: "insensitive" as const } },
      { path: { contains: searchTerm, mode: "insensitive" as const } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.apiLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
    }),
    prisma.apiLog.count({ where }),
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
 * Get API activity statistics
 */
export const getApiStats = async (params: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const { userId, startDate, endDate } = params;

  const where: any = {};
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [totalRequests, successfulRequests, failedRequests, avgResponseTime] =
    await Promise.all([
      prisma.apiLog.count({ where }),
      prisma.apiLog.count({
        where: { ...where, statusCode: { gte: 200, lt: 400 } },
      }),
      prisma.apiLog.count({ where: { ...where, statusCode: { gte: 400 } } }),
      prisma.apiLog.aggregate({
        where: { ...where, responseTime: { not: null } },
        _avg: { responseTime: true },
      }),
    ]);

  // Get most accessed endpoints
  const topEndpoints = await prisma.apiLog.groupBy({
    by: ["path", "method"],
    where,
    _count: {
      apiLogId: true,
    },
    orderBy: {
      _count: {
        apiLogId: "desc",
      },
    },
    take: 10,
  });

  // Get most active users
  const topUsers = await prisma.apiLog.groupBy({
    by: ["userId", "userEmail", "userName"],
    where: { ...where, userId: { not: null } },
    _count: {
      apiLogId: true,
    },
    orderBy: {
      _count: {
        apiLogId: "desc",
      },
    },
    take: 10,
  });

  // Get error distribution
  const errorDistribution = await prisma.apiLog.groupBy({
    by: ["statusCode"],
    where: { ...where, statusCode: { gte: 400 } },
    _count: {
      apiLogId: true,
    },
    orderBy: {
      _count: {
        apiLogId: "desc",
      },
    },
  });

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
    successRate:
      totalRequests > 0
        ? Math.round((successfulRequests / totalRequests) * 100)
        : 0,
    topEndpoints: topEndpoints.map((e) => ({
      method: e.method,
      path: e.path,
      count: e._count.apiLogId,
    })),
    topUsers: topUsers.map((u) => ({
      userId: u.userId,
      userEmail: u.userEmail,
      userName: u.userName,
      count: u._count.apiLogId,
    })),
    errorDistribution: errorDistribution.map((e) => ({
      statusCode: e.statusCode,
      count: e._count.apiLogId,
    })),
  };
};

/**
 * Clean up old API logs (optional, for data retention)
 */
export const cleanupOldApiLogs = async (daysToKeep: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.apiLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
};
