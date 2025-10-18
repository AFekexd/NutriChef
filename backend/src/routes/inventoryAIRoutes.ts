// Vision AI Inventory Routes
import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  uploadMiddleware,
  uploadInventoryImage,
  confirmDetectedItems,
  getExpiringItems,
  getItemsByLocation,
  getInventoryAnalytics,
  updateConsumption,
} from "../controllers/inventoryAIController.js";
import { getMyInventoryItems } from "../controllers/inventoryController.js";

const router = Router();

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items for authenticated user
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all inventory items
 *       401:
 *         description: Unauthorized
 */
router.get("/", authenticate, getMyInventoryItems);

/**
 * @swagger
 * /api/inventory/upload-image:
 *   post:
 *     summary: Upload and analyze fridge/pantry image with AI
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, max 10MB)
 *     responses:
 *       200:
 *         description: Image processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadId:
 *                   type: string
 *                 detectedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                       category:
 *                         type: string
 *                       quantity:
 *                         type: number
 *                       unit:
 *                         type: string
 *                       estimatedExpiry:
 *                         type: number
 *                       location:
 *                         type: string
 *                 totalItemsDetected:
 *                   type: number
 *                 processingTime:
 *                   type: number
 *                 aiService:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *       400:
 *         description: No image uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Image processing failed
 */
router.post(
  "/upload-image",
  authenticate,
  uploadMiddleware,
  uploadInventoryImage
);

/**
 * @swagger
 * /api/inventory/confirm-detected:
 *   post:
 *     summary: Confirm and add AI-detected items to inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: string
 *                 description: ID from the upload-image response
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     category:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     estimatedExpiry:
 *                       type: number
 *                     location:
 *                       type: string
 *     responses:
 *       200:
 *         description: Items added to inventory
 *       400:
 *         description: Invalid items array
 *       404:
 *         description: Upload not found
 *       500:
 *         description: Failed to add items
 */
router.post("/confirm-detected", authenticate, confirmDetectedItems);

/**
 * @swagger
 * /api/inventory/expiring:
 *   get:
 *     summary: Get items expiring soon
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Expiring items list
 *       401:
 *         description: Unauthorized
 */
router.get("/expiring", authenticate, getExpiringItems);

/**
 * @swagger
 * /api/inventory/location/{location}:
 *   get:
 *     summary: Get items by storage location
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *           enum: [fridge, pantry, freezer]
 *     responses:
 *       200:
 *         description: Items at specified location
 *       400:
 *         description: Invalid location
 *       401:
 *         description: Unauthorized
 */
router.get("/location/:location", authenticate, getItemsByLocation);

/**
 * @swagger
 * /api/inventory/analytics:
 *   get:
 *     summary: Get inventory analytics and statistics
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalItems:
 *                   type: number
 *                 byLocation:
 *                   type: object
 *                 byCategory:
 *                   type: object
 *                 expiryStatus:
 *                   type: object
 *                 aiDetectedCount:
 *                   type: number
 *                 aiDetectionPercentage:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/analytics", authenticate, getInventoryAnalytics);

/**
 * @swagger
 * /api/inventory/{id}/consume:
 *   post:
 *     summary: Log consumption of inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               quantityConsumed:
 *                 type: number
 *     responses:
 *       200:
 *         description: Consumption logged
 *       400:
 *         description: Invalid quantity
 *       404:
 *         description: Item not found
 */
router.post("/:id/consume", authenticate, updateConsumption);

export default router;
