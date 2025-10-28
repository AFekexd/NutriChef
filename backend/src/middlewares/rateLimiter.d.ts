/**
 * General API rate limiter - 100 requests per 15 minutes
 */
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Strict rate limiter for auth endpoints - 5 requests per 15 minutes
 */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Registration rate limiter - 3 registrations per hour per IP
 */
export declare const registerLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map