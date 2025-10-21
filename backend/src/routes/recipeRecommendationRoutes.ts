import { Router } from "express";
import {
  getRecommendations,
  getRecommendationsWithIngredients,
} from "../controllers/recipeRecommendationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * /api/recipe-recommendations:
 *   post:
 *     summary: Get recipe recommendations based on user's inventory or manual ingredients
 *     tags: [Recipe Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               servings:
 *                 type: number
 *                 default: 2
 *                 example: 4
 *               minMatchPercentage:
 *                 type: number
 *                 default: 60
 *                 example: 70
 *               useInventory:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               manualIngredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     category:
 *                       type: string
 *     responses:
 *       200:
 *         description: Recipe recommendations generated successfully
 *       400:
 *         description: Invalid request or no ingredients provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, getRecommendations);

/**
 * @swagger
 * /api/recipe-recommendations/manual:
 *   post:
 *     summary: Get recipe recommendations with manual ingredient list
 *     tags: [Recipe Recommendations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ingredients
 *             properties:
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     category:
 *                       type: string
 *               servings:
 *                 type: number
 *                 default: 2
 *               minMatchPercentage:
 *                 type: number
 *                 default: 60
 *     responses:
 *       200:
 *         description: Recipe recommendations generated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post("/manual", getRecommendationsWithIngredients);

export default router;
