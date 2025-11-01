import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/adminAuth.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       403:
 *         description: Admin access required
 */
router.get("/stats", adminController.getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/users", adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/users/:userId", adminController.getUserDetails);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Update user status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 */
router.put("/users/:userId/status", adminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update user role
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.put("/users/:userId/role", adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/users/:userId", adminController.deleteUser);

/**
 * @swagger
 * /api/admin/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inventory items
 */
router.get("/inventory", adminController.getAllInventoryItems);

/**
 * @swagger
 * /api/admin/inventory/{itemId}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item deleted
 */
router.delete("/inventory/:itemId", adminController.deleteInventoryItem);

/**
 * @swagger
 * /api/admin/recipes:
 *   get:
 *     summary: Get all recipes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recipes
 */
router.get("/recipes", adminController.getAllRecipes);

/**
 * @swagger
 * /api/admin/recipes/{recipeId}:
 *   delete:
 *     summary: Delete recipe
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recipeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe deleted
 */
router.delete("/recipes/:recipeId", adminController.deleteRecipe);

/**
 * @swagger
 * /api/admin/uploads:
 *   get:
 *     summary: Get all uploaded images
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of uploaded images
 */
router.get("/uploads", adminController.getAllUploadedImages);

/**
 * @swagger
 * /api/admin/users/{userId}/rate-limits:
 *   get:
 *     summary: Get AI rate limit status for a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rate limit status
 */
router.get("/users/:userId/rate-limits", adminController.getUserRateLimitStatus);

/**
 * @swagger
 * /api/admin/users/{userId}/rate-limits/reset:
 *   post:
 *     summary: Reset AI rate limits for a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service:
 *                 type: string
 *                 enum: [healthInsights, recipeRecommendations, inventoryAI]
 *                 description: Specific service to reset, or omit to reset all
 *     responses:
 *       200:
 *         description: Rate limits reset
 */
router.post("/users/:userId/rate-limits/reset", adminController.resetUserAIRateLimit);

export default router;
