import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "your-refresh-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh tokens
 */
export const generateTokens = (payload: JWTPayload): TokenPair => {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, sessionId: payload.sessionId },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (
  token: string
): { userId: string; sessionId: string } | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as {
      userId: string;
      sessionId: string;
    };
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification (for expired tokens)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Calculate token expiration date
 */
export const getTokenExpiration = (expiryString: string): Date => {
  const match = expiryString.match(/^(\d+)([smhd])$/);
  if (!match || !match[1] || !match[2])
    return new Date(Date.now() + 15 * 60 * 1000); // Default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2] as "s" | "m" | "h" | "d";

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const multiplier = multipliers[unit];
  if (!multiplier) return new Date(Date.now() + 15 * 60 * 1000);

  return new Date(Date.now() + value * multiplier);
};

export const REFRESH_TOKEN_EXPIRY_DATE =
  getTokenExpiration(REFRESH_TOKEN_EXPIRY);
