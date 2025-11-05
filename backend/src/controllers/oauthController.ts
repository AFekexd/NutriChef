import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma/index.js";
import { generateTokens, getTokenExpiration } from "../utils/jwt.js";
import { extractIpAddress } from "../middlewares/auth.js";

const prisma = new PrismaClient();

/**
 * Handle successful OAuth authentication
 */
export const handleOAuthSuccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=authentication_failed`
      );
      return;
    }

    const user = req.user as any;
    const ipAddress = extractIpAddress(req);
    const userAgent = req.headers["user-agent"] || "unknown";

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

    // Update user login info
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
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

    // Redirect to frontend with tokens
    const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set("accessToken", tokens.accessToken);
    redirectUrl.searchParams.set("refreshToken", tokens.refreshToken);
    redirectUrl.searchParams.set(
      "user",
      JSON.stringify({
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        oauthProvider: user.oauthProvider,
        oauthAvatar: user.oauthAvatar,
      })
    );

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth success handler error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

/**
 * Handle OAuth authentication failure
 */
export const handleOAuthFailure = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("OAuth authentication failed");
  res.redirect(
    `${process.env.FRONTEND_URL}/login?error=oauth_authentication_failed`
  );
};
