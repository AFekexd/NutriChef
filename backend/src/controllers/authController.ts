import type { Request, Response } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import {
  generateTokens,
  verifyRefreshToken,
  getTokenExpiration,
} from "../utils/jwt.js";
import { extractIpAddress } from "../middlewares/auth.js";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Validation rules for registration
 */
export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
];

/**
 * Validation rules for login
 */
export const loginValidation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password, preferences } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        preferences: preferences || {},
      },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        preferences: true,
        isEmailVerified: true,
        oauthProvider: true,
        oauthAvatar: true,
        createdAt: true,
      },
    });

    // Log registration
    const ipAddress = extractIpAddress(req);
    const userAgent = req.headers["user-agent"] || "unknown";

    await prisma.loginHistory.create({
      data: {
        userId: user.userId,
        ipAddress,
        userAgent,
        success: true,
        failureReason: null,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const ipAddress = extractIpAddress(req);
    const userAgent = req.headers["user-agent"] || "unknown";

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Helper function to log failed login
    const logFailedLogin = async (reason: string) => {
      if (user) {
        await prisma.loginHistory.create({
          data: {
            userId: user.userId,
            ipAddress,
            userAgent,
            success: false,
            failureReason: reason,
          },
        });
      }
    };

    if (!user) {
      await logFailedLogin("User not found");
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logFailedLogin("Account locked");
      res.status(403).json({
        error:
          "Account is temporarily locked due to too many failed login attempts",
        lockedUntil: user.lockedUntil,
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      await logFailedLogin("Account deactivated");
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    // Check if user is an OAuth user (no password)
    if (!user.passwordHash) {
      await logFailedLogin("OAuth account - no password");
      res.status(400).json({
        error:
          "This account uses OAuth authentication. Please login with your OAuth provider.",
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account if too many failed attempts
      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION);
      }

      await prisma.user.update({
        where: { userId: user.userId },
        data: updateData,
      });

      await logFailedLogin("Invalid password");

      if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
        res.status(403).json({
          error: "Account locked due to too many failed login attempts",
          lockedUntil: updateData.lockedUntil,
        });
      } else {
        res.status(401).json({
          error: "Invalid credentials",
          attemptsRemaining: MAX_LOGIN_ATTEMPTS - failedAttempts,
        });
      }
      return;
    }

    // Create session
    const expiresAt = getTokenExpiration("7d");
    const session = await prisma.session.create({
      data: {
        userId: user.userId,
        token: "", // Will be updated with refresh token
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.userId,
      email: user.email,
      sessionId: session.sessionId,
      role: user.role,
    });

    // Update session with refresh token
    await prisma.session.update({
      where: { sessionId: session.sessionId },
      data: { token: tokens.refreshToken },
    });

    // Update user login info and reset failed attempts
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginAttempts: 0,
        lockedUntil: null,
        refreshToken: tokens.refreshToken,
      },
    });

    // Log successful login
    await prisma.loginHistory.create({
      data: {
        userId: user.userId,
        ipAddress,
        userAgent,
        success: true,
      },
    });

    res.json({
      message: "Login successful",
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        oauthProvider: user.oauthProvider,
        oauthAvatar: user.oauthAvatar,
      },
      tokens,
      session: {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { sessionId: payload.sessionId },
      include: { user: true },
    });

    if (!session || !session.isValid || session.token !== refreshToken) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    if (session.expiresAt < new Date()) {
      res.status(401).json({ error: "Session expired" });
      return;
    }

    // Check if user is active
    if (!session.user.isActive) {
      res.status(403).json({ error: "Account is deactivated" });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: session.user.userId,
      email: session.user.email,
      sessionId: session.sessionId,
      role: session.user.role,
    });

    // Update session with new refresh token
    await prisma.session.update({
      where: { sessionId: session.sessionId },
      data: { token: tokens.refreshToken },
    });

    await prisma.user.update({
      where: { userId: session.user.userId },
      data: { refreshToken: tokens.refreshToken },
    });

    res.json({
      message: "Token refreshed successfully",
      tokens,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
};

/**
 * Logout user (invalidate session)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Invalidate session
    await prisma.session.update({
      where: { sessionId: req.user.sessionId },
      data: { isValid: false },
    });

    // Clear refresh token
    await prisma.user.update({
      where: { userId: req.user.userId },
      data: { refreshToken: null },
    });

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        preferences: true,
        isEmailVerified: true,
        lastLoginAt: true,
        lastLoginIp: true,
        oauthProvider: true,
        oauthAvatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
};

/**
 * Get user's active sessions
 */
export const getSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.userId,
        isValid: true,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        sessionId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: "Session ID is required" });
      return;
    }

    // Verify session belongs to user
    const session = await prisma.session.findFirst({
      where: {
        sessionId,
        userId: req.user.userId,
      },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // Invalidate session
    await prisma.session.update({
      where: { sessionId: session.sessionId },
      data: { isValid: false },
    });

    res.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({ error: "Failed to revoke session" });
  }
};

/**
 * Get login history
 */
export const getLoginHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await prisma.loginHistory.findMany({
      where: { userId: req.user.userId },
      select: {
        loginHistoryId: true,
        ipAddress: true,
        userAgent: true,
        success: true,
        failureReason: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.loginHistory.count({
      where: { userId: req.user.userId },
    });

    res.json({
      history,
      pagination: {
        total,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get login history error:", error);
    res.status(500).json({ error: "Failed to get login history" });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { name, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { userId: req.user.userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        preferences: true,
        isEmailVerified: true,
        lastLoginAt: true,
        oauthProvider: true,
        oauthAvatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/**
 * Change password
 */
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ error: "New password must be at least 8 characters long" });
      return;
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { userId: req.user.userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if user is an OAuth user (no password)
    if (!user.passwordHash) {
      res.status(400).json({
        error:
          "Cannot change password for OAuth accounts. Please use your OAuth provider to manage your account.",
      });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { userId: req.user.userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
