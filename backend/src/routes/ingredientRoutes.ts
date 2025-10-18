import { Router } from "express";
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../controllers/ingredientController.js";

const router = Router();

/**
 * @swagger
 * /api/ingredients:
 *   get:
 *     summary: Get all ingredients
 *     tags: [Ingredients]
 *     description: Retrieve all ingredients, optionally filtered by category
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (e.g., vegetables, fruits, dairy)
 *         example: vegetables
 *     responses:
 *       200:
 *         description: List of ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ingredient'
 *       500:
 *         description: Server error
 */
router.get("/", getIngredients);

/**
 * @swagger
 * /api/ingredients/{id}:
 *   get:
 *     summary: Get ingredient by ID
 *     tags: [Ingredients]
 *     description: Retrieve a specific ingredient by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ingredient ID
 *     responses:
 *       200:
 *         description: Ingredient found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *       404:
 *         description: Ingredient not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getIngredientById);

/**
 * @swagger
 * /api/ingredients:
 *   post:
 *     summary: Create a new ingredient
 *     tags: [Ingredients]
 *     description: Add a new ingredient to the database
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - nutritionalInfo
 *               - carbonFootprint
 *             properties:
 *               name:
 *                 type: string
 *                 example: Avocado
 *               category:
 *                 type: string
 *                 example: fruits
 *               nutritionalInfo:
 *                 type: object
 *                 example: { "calories": 160, "protein": 2, "carbs": 9, "fat": 15 }
 *               carbonFootprint:
 *                 type: number
 *                 example: 0.5
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *       500:
 *         description: Server error
 */
router.post("/", createIngredient);

/**
 * @swagger
 * /api/ingredients/{id}:
 *   put:
 *     summary: Update ingredient
 *     tags: [Ingredients]
 *     description: Update ingredient information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ingredient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               nutritionalInfo:
 *                 type: object
 *               carbonFootprint:
 *                 type: number
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ingredient'
 *       500:
 *         description: Server error
 */
router.put("/:id", updateIngredient);

/**
 * @swagger
 * /api/ingredients/{id}:
 *   delete:
 *     summary: Delete ingredient
 *     tags: [Ingredients]
 *     description: Remove an ingredient from the system
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ingredient ID
 *     responses:
 *       204:
 *         description: Ingredient deleted successfully
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteIngredient);

export default router;
