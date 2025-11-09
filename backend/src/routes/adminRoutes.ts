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
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Whether to activate or deactivate the account
 *               reason:
 *                 type: string
 *                 description: Optional reason for suspension (only used when deactivating)
 *     responses:
 *       200:
 *         description: User status updated, email sent to user
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
 *         description: User deleted, notification email sent
 *       404:
 *         description: User not found
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
router.get(
  "/users/:userId/rate-limits",
  adminController.getUserRateLimitStatus
);

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
router.post(
  "/users/:userId/rate-limits/reset",
  adminController.resetUserAIRateLimit
);

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get admin activity logs
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
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: targetType
 *         schema:
 *           type: string
 *       - in: query
 *         name: adminUserId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Admin activity logs
 */
router.get("/logs", adminController.getActivityLogs);

/**
 * @swagger
 * /api/admin/users/{userId}/moderation:
 *   get:
 *     summary: Get user's moderation history
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
 *         description: User moderation data
 */
router.get("/users/:userId/moderation", adminController.getUserModeration);

/**
 * @swagger
 * /api/admin/users/{userId}/warn:
 *   post:
 *     summary: Send warning to user
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
 *               reason:
 *                 type: string
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Warning sent
 */
router.post("/users/:userId/warn", adminController.sendWarningToUser);

/**
 * @swagger
 * /api/admin/users/{userId}/timeout:
 *   post:
 *     summary: Timeout user (temporary suspension)
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
 *             required:
 *               - duration
 *             properties:
 *               reason:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 description: Duration in hours
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: User timed out
 */
router.post("/users/:userId/timeout", adminController.timeoutUser);

/**
 * @swagger
 * /api/admin/users/{userId}/ban:
 *   post:
 *     summary: Ban user
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
 *               reason:
 *                 type: string
 *               duration:
 *                 type: integer
 *                 description: Duration in hours (null for permanent ban)
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: User banned
 */
router.post("/users/:userId/ban", adminController.banUser);

/**
 * @swagger
 * /api/admin/users/{userId}/unban:
 *   post:
 *     summary: Unban/lift timeout from user
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
 *         description: User unbanned
 */
router.post("/users/:userId/unban", adminController.unbanUser);

/**
 * @swagger
 * /api/admin/api-logs:
 *   get:
 *     summary: Get API activity logs (all users)
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
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API activity logs
 */
router.get("/api-logs", adminController.getApiActivityLogs);

/**
 * @swagger
 * /api/admin/api-logs/stats:
 *   get:
 *     summary: Get API activity statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: API activity statistics
 */
router.get("/api-logs/stats", adminController.getApiActivityStats);

/**
 * @swagger
 * /api/admin/api-logs/cleanup:
 *   post:
 *     summary: Clean up old API logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 30
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
router.post("/api-logs/cleanup", adminController.cleanupApiLogs);

export default router;
