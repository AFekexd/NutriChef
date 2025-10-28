import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  getInventoryItems,
  getMyInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getExpiringItems,
  getMyExpiringItems,
  getInventoryAnalytics,
  getItemsByLocation,
  addManualInventoryItem,
  batchDeleteInventoryItems,
} from "../controllers/inventoryController.js";

const router = Router();

// Authenticated user routes (use auth middleware)
router.get("/", authenticate, getMyInventoryItems);
router.get("/analytics", authenticate, getInventoryAnalytics);
router.get("/expiring", authenticate, getMyExpiringItems);
router.get("/location/:location", authenticate, getItemsByLocation);
router.post("/manual", authenticate, addManualInventoryItem);
router.post("/batch-delete", authenticate, batchDeleteInventoryItems);

/**
 * @swagger
 * /api/inventory/user/{userId}:
 *   get:
 *     summary: Get all inventory items for a user
 *     tags: [Inventory]
 *     description: Retrieve all items in a user's inventory, sorted by expiry date
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 *       500:
 *         description: Server error
 */
router.get("/user/:userId", getInventoryItems);

/**
 * @swagger
 * /api/inventory/user/{userId}/expiring:
 *   get:
 *     summary: Get expiring inventory items
 *     tags: [Inventory]
 *     description: Retrieve items that are expiring soon for a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look ahead for expiring items
 *         example: 7
 *     responses:
 *       200:
 *         description: List of expiring items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InventoryItem'
 *       500:
 *         description: Server error
 */
router.get("/user/:userId/expiring", getExpiringItems);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     tags: [Inventory]
 *     description: Retrieve a specific inventory item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getInventoryItemById);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
 *     description: Add a new item to a user's inventory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - ingredientId
 *               - quantity
 *               - unit
 *               - expiryDate
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               ingredientId:
 *                 type: string
 *                 format: uuid
 *                 example: 660e8400-e29b-41d4-a716-446655440001
 *               quantity:
 *                 type: number
 *                 example: 2
 *               unit:
 *                 type: string
 *                 example: kg
 *               expiryDate:
 *                 type: string
 *                 format: date
 *                 example: 2025-10-25
 *               consumptionRate:
 *                 type: number
 *                 example: 0.2
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       500:
 *         description: Server error
 */
router.post("/", createInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Inventory]
 *     description: Update an existing inventory item
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               consumptionRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryItem'
 *       500:
 *         description: Server error
 */
router.put("/:id", updateInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     description: Remove an item from inventory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Inventory item ID
 *     responses:
 *       204:
 *         description: Inventory item deleted successfully
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteInventoryItem);

export default router;
