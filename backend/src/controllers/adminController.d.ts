import type { Request, Response } from "express";
/**
 * Get all users with statistics
 */
export declare const getAllUsers: (req: Request, res: Response) => Promise<void>;
/**
 * Get user details with all related data
 */
export declare const getUserDetails: (req: Request, res: Response) => Promise<void>;
/**
 * Update user status (activate/deactivate)
 */
export declare const updateUserStatus: (req: Request, res: Response) => Promise<void>;
/**
 * Update user role
 */
export declare const updateUserRole: (req: Request, res: Response) => Promise<void>;
/**
 * Delete user and all related data
 */
export declare const deleteUser: (req: Request, res: Response) => Promise<void>;
/**
 * Get all inventory items across all users
 */
export declare const getAllInventoryItems: (req: Request, res: Response) => Promise<void>;
/**
 * Delete inventory item
 */
export declare const deleteInventoryItem: (req: Request, res: Response) => Promise<void>;
/**
 * Get all recipes across all users
 */
export declare const getAllRecipes: (req: Request, res: Response) => Promise<void>;
/**
 * Delete recipe
 */
export declare const deleteRecipe: (req: Request, res: Response) => Promise<void>;
/**
 * Get all uploaded images
 */
export declare const getAllUploadedImages: (req: Request, res: Response) => Promise<void>;
/**
 * Get dashboard statistics
 */
export declare const getDashboardStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map