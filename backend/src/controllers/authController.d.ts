import type { Request, Response } from "express";
/**
 * Validation rules for registration
 */
export declare const registerValidation: import("express-validator").ValidationChain[];
/**
 * Validation rules for login
 */
export declare const loginValidation: import("express-validator").ValidationChain[];
/**
 * Register a new user
 */
export declare const register: (req: Request, res: Response) => Promise<void>;
/**
 * Login user
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * Refresh access token
 */
export declare const refreshToken: (req: Request, res: Response) => Promise<void>;
/**
 * Logout user (invalidate session)
 */
export declare const logout: (req: Request, res: Response) => Promise<void>;
/**
 * Get current user profile
 */
export declare const getProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Get user's active sessions
 */
export declare const getSessions: (req: Request, res: Response) => Promise<void>;
/**
 * Revoke a specific session
 */
export declare const revokeSession: (req: Request, res: Response) => Promise<void>;
/**
 * Get login history
 */
export declare const getLoginHistory: (req: Request, res: Response) => Promise<void>;
/**
 * Update user profile
 */
export declare const updateProfile: (req: Request, res: Response) => Promise<void>;
/**
 * Change password
 */
export declare const changePassword: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map