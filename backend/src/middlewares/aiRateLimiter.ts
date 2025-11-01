import type { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface AIRateLimits {
  healthInsights: Map<string, RateLimitRecord>;
  recipeRecommendations: Map<string, RateLimitRecord>;
  inventoryAI: Map<string, RateLimitRecord>;
}

// In-memory storage for rate limits (use Redis in production for distributed systems)
const rateLimits: AIRateLimits = {
  healthInsights: new Map(),
  recipeRecommendations: new Map(),
  inventoryAI: new Map(),
};

// Rate limit configurations (per user per day)
export const AI_RATE_LIMITS = {
  healthInsights: {
    maxRequests: 10, // 10 health insights per day
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  recipeRecommendations: {
    maxRequests: 20, // 20 recipe recommendations per day
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  inventoryAI: {
    maxRequests: 15, // 15 image detections per day
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Cleanup expired records every hour
setInterval(() => {
  const now = Date.now();

  Object.values(rateLimits).forEach((limitMap) => {
    for (const [key, record] of limitMap.entries()) {
      if (now > record.resetTime) {
        limitMap.delete(key);
      }
    }
  });

  console.log("🧹 Cleaned up expired AI rate limit records");
}, 60 * 60 * 1000); // Every hour

/**
 * Create a rate limiter middleware for specific AI service
 */
export function createAIRateLimiter(
  service: keyof AIRateLimits
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const config = AI_RATE_LIMITS[service];
    const limitMap = rateLimits[service];
    const now = Date.now();

    // Get or create rate limit record for this user
    let record = limitMap.get(userId);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      limitMap.set(userId, record);
    }

    // Check if user exceeded the limit
    if (record.count >= config.maxRequests) {
      const resetInHours = Math.ceil(
        (record.resetTime - now) / (60 * 60 * 1000)
      );

      console.log(`⛔ AI rate limit exceeded for user ${userId} on ${service}`);

      return res.status(429).json({
        error: "AI rate limit exceeded",
        message: `You have reached the maximum number of ${service} requests (${config.maxRequests} per day). Please try again later.`,
        service,
        limit: config.maxRequests,
        resetInHours,
        resetTime: new Date(record.resetTime).toISOString(),
      });
    }

    // Increment the counter
    record.count++;
    limitMap.set(userId, record);

    // Add rate limit info to response headers
    res.setHeader("X-RateLimit-Limit", config.maxRequests.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      (config.maxRequests - record.count).toString()
    );
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(record.resetTime).toISOString()
    );

    console.log(
      `✅ AI rate limit check passed for user ${userId} on ${service}: ${record.count}/${config.maxRequests}`
    );

    next();
  };
}

/**
 * Get current rate limit status for a user
 */
export function getRateLimitStatus(userId: string): {
  healthInsights: { used: number; limit: number; resetTime: string | null };
  recipeRecommendations: {
    used: number;
    limit: number;
    resetTime: string | null;
  };
  inventoryAI: { used: number; limit: number; resetTime: string | null };
} {
  const now = Date.now();

  return {
    healthInsights: getServiceStatus("healthInsights", userId, now),
    recipeRecommendations: getServiceStatus(
      "recipeRecommendations",
      userId,
      now
    ),
    inventoryAI: getServiceStatus("inventoryAI", userId, now),
  };
}

function getServiceStatus(
  service: keyof AIRateLimits,
  userId: string,
  now: number
): { used: number; limit: number; resetTime: string | null } {
  const config = AI_RATE_LIMITS[service];
  const record = rateLimits[service].get(userId);

  if (!record || now > record.resetTime) {
    return {
      used: 0,
      limit: config.maxRequests,
      resetTime: null,
    };
  }

  return {
    used: record.count,
    limit: config.maxRequests,
    resetTime: new Date(record.resetTime).toISOString(),
  };
}

/**
 * Manually reset rate limit for a user (admin function)
 */
export function resetUserRateLimit(
  userId: string,
  service?: keyof AIRateLimits
) {
  if (service) {
    rateLimits[service].delete(userId);
    console.log(`🔄 Reset AI rate limit for user ${userId} on ${service}`);
  } else {
    // Reset all services
    Object.values(rateLimits).forEach((limitMap) => {
      limitMap.delete(userId);
    });
    console.log(`🔄 Reset all AI rate limits for user ${userId}`);
  }
}

export default createAIRateLimiter;
