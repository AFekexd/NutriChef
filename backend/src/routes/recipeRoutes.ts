import { Router } from "express";
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipesByUser,
  updateRecipeVisibility,
  rateRecipe,
} from "../controllers/recipeController.js";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     tags: [Recipes]
 *     description: Retrieve all public recipes (and user's own recipes if authenticated)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       500:
 *         description: Server error
 */
router.get("/", optionalAuthenticate, getRecipes);

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     tags: [Recipes]
 *     description: Retrieve a specific recipe with all ingredients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getRecipeById);

/**
 * @swagger
 * /api/recipes/user/{userId}:
 *   get:
 *     summary: Get recipes by user
 *     tags: [Recipes]
 *     description: Retrieve all recipes created by a specific user
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
 *         description: User recipes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Recipe'
 *       500:
 *         description: Server error
 */
router.get("/user/:userId", getRecipesByUser);

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     description: Add a new recipe with ingredients (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - instructions
 *               - calories
 *               - macros
 *             properties:
 *               title:
 *                 type: string
 *                 example: Avocado Toast
 *               instructions:
 *                 type: string
 *                 example: Toast bread, mash avocado, spread on toast
 *               imageURL:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/image.jpg
 *               calories:
 *                 type: number
 *                 example: 250
 *               macros:
 *                 type: object
 *                 example: { "protein": 10, "carbs": 30, "fat": 15 }
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ingredientId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, createRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update recipe
 *     tags: [Recipes]
 *     description: Update recipe information (requires authentication and ownership)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               instructions:
 *                 type: string
 *               imageURL:
 *                 type: string
 *                 format: uri
 *               calories:
 *                 type: number
 *               macros:
 *                 type: object
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only modify own recipes
 *       500:
 *         description: Server error
 */
router.put("/:id", authenticate, updateRecipe);

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete recipe
 *     tags: [Recipes]
 *     description: Remove a recipe from the system (requires authentication and ownership)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     responses:
 *       204:
 *         description: Recipe deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only delete own recipes
 *       500:
 *         description: Server error
 */
router.delete("/:id", authenticate, deleteRecipe);

/**
 * @swagger
 * /api/recipes/{id}/visibility:
 *   patch:
 *     summary: Update recipe visibility
 *     tags: [Recipes]
 *     description: Toggle recipe public/private status (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublic
 *             properties:
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Recipe visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - can only modify own recipes
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/visibility", authenticate, updateRecipeVisibility);

/**
 * @swagger
 * /api/recipes/{id}/rating:
 *   post:
 *     summary: Rate a recipe
 *     tags: [Recipes]
 *     description: Submit or update a rating for a recipe (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Great recipe! Very easy to follow.
 *     responses:
 *       200:
 *         description: Recipe rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 rating:
 *                   type: number
 *                 ratingCount:
 *                   type: integer
 *       400:
 *         description: Invalid rating value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
router.post("/:id/rating", authenticate, rateRecipe);

export default router;
