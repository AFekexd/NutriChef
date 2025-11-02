import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { verifyAccessToken, type JWTPayload } from "../utils/jwt.js";

const prisma = new PrismaClient();

// Extend Express Request type to include user and ipAddress
declare global {
  namespace Express {
    interface User extends JWTPayload {}
    interface Request {
      ipAddress?: string;
    }
  }
}

/**
 * Extract IP address from request
 */
export const extractIpAddress = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    const firstIp = forwarded.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }
  return req.socket.remoteAddress || "unknown";
};

/**
 * Authentication middleware - Verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("[authenticate] Checking authentication...");

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[authenticate] No token provided or invalid format");
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    console.log(
      "[authenticate] Token received (first 20 chars):",
      token.substring(0, 20) + "..."
    );

    // Verify token
    const payload = verifyAccessToken(token);
    if (!payload) {
      console.log("[authenticate] Token verification failed");
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    console.log("[authenticate] Token verified for user:", payload.userId);

    // Check if session is still valid
    const session = await prisma.session.findUnique({
      where: { sessionId: payload.sessionId },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      console.log("[authenticate] Session expired or invalid:", {
        sessionExists: !!session,
        isValid: session?.isValid,
        expiresAt: session?.expiresAt,
        now: new Date(),
      });
      res.status(401).json({ error: "Session expired or invalid" });
      return;
    }

    console.log("[authenticate] Session valid for user:", session.user.email);

    // Check if user is active
    if (!session.user.isActive) {
      console.log("[authenticate] User account is deactivated");
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    // Check if account is locked
    if (session.user.lockedUntil && session.user.lockedUntil > new Date()) {
      console.log(
        "[authenticate] Account is locked until:",
        session.user.lockedUntil
      );
      res.status(403).json({
        error: "Account is temporarily locked",
        lockedUntil: session.user.lockedUntil,
      });
      return;
    }

    // Get current IP
    const currentIp = extractIpAddress(req);
    req.ipAddress = currentIp;

    // IP validation (warn if different, but allow)
    if (session.ipAddress !== currentIp) {
      console.warn(
        `IP address mismatch for user ${payload.userId}: session IP ${session.ipAddress}, current IP ${currentIp}`
      );
      // You could add stricter IP validation here if needed
      // For now, we'll just log it and continue
    }

    // Attach user to request
    req.user = payload;
    console.log(
      "[authenticate] Authentication successful, proceeding to route handler"
    );
    next();
  } catch (error) {
    console.error("[authenticate] Authentication error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyAccessToken(token);

      if (payload) {
        const session = await prisma.session.findUnique({
          where: { sessionId: payload.sessionId },
        });

        if (session && session.isValid && session.expiresAt >= new Date()) {
          req.user = payload;
        }
      }
    }

    req.ipAddress = extractIpAddress(req);
    next();
  } catch (error) {
    // Continue without authentication
    req.ipAddress = extractIpAddress(req);
    next();
  }
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (userIdParam: string = "id") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const resourceUserId = req.params[userIdParam];
    if (resourceUserId !== req.user.userId) {
      res
        .status(403)
        .json({ error: "You do not have permission to access this resource" });
      return;
    }

    next();
  };
};
