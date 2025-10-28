import type { Request, Response, NextFunction } from "express";
import { type JWTPayload } from "../utils/jwt.js";
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
export declare const extractIpAddress: (req: Request) => string;
/**
 * Authentication middleware - Verifies JWT token
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Optional authentication - doesn't fail if no token
 */
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Check if user owns the resource
 */
export declare const checkOwnership: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map