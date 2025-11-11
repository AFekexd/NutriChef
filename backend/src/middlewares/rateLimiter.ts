import rateLimit from "express-rate-limit";

/**
 * General API rate limiter - 100 requests per 15 minutes
 * Excludes certain read-only endpoints that shouldn't be rate limited
 */
export const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 200,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for AI rate limit status endpoint (read-only status check)
    // This is polled frequently by the frontend and doesn't consume resources
    if (req.path === "/auth/ai-rate-limit-status") {
      return true;
    }
    return false;
  },
});

/**
 * Strict rate limiter for auth endpoints - 5 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Registration rate limiter - 3 registrations per hour per IP
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: "Too many accounts created from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
