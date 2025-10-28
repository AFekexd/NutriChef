export interface JWTPayload {
    userId: string;
    email: string;
    sessionId: string;
    role?: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
/**
 * Generate access and refresh tokens
 */
export declare const generateTokens: (payload: JWTPayload) => TokenPair;
/**
 * Verify access token
 */
export declare const verifyAccessToken: (token: string) => JWTPayload | null;
/**
 * Verify refresh token
 */
export declare const verifyRefreshToken: (token: string) => {
    userId: string;
    sessionId: string;
} | null;
/**
 * Decode token without verification (for expired tokens)
 */
export declare const decodeToken: (token: string) => JWTPayload | null;
/**
 * Calculate token expiration date
 */
export declare const getTokenExpiration: (expiryString: string) => Date;
export declare const REFRESH_TOKEN_EXPIRY_DATE: Date;
//# sourceMappingURL=jwt.d.ts.map