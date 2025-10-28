import { Router } from "express";
import { getRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getRecipesByUser, } from "../controllers/recipeController.js";
const router = Router();
/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Get all recipes
 *     tags: [Recipes]
 *     description: Retrieve all recipes with ingredients and user information
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
router.get("/", getRecipes);
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
 *     description: Add a new recipe with ingredients
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
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
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
 *       500:
 *         description: Server error
 */
router.post("/", createRecipe);
/**
 * @swagger
 * /api/recipes/{id}:
 *   put:
 *     summary: Update recipe
 *     tags: [Recipes]
 *     description: Update recipe information
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
 *       500:
 *         description: Server error
 */
router.put("/:id", updateRecipe);
/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Delete recipe
 *     tags: [Recipes]
 *     description: Remove a recipe from the system
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
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteRecipe);
export default router;
//# sourceMappingURL=recipeRoutes.js.map