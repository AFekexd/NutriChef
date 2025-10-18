import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { verifyAccessToken, type JWTPayload } from "../utils/jwt.js";

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
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
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Check if session is still valid
    const session = await prisma.session.findUnique({
      where: { sessionId: payload.sessionId },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      res.status(401).json({ error: "Session expired or invalid" });
      return;
    }

    // Check if user is active
    if (!session.user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    // Check if account is locked
    if (session.user.lockedUntil && session.user.lockedUntil > new Date()) {
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
    next();
  } catch (error) {
    console.error("Authentication error:", error);
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
