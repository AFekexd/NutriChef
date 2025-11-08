import { Router } from "express";
import {
  getRecommendations,
  getRecommendationsWithIngredients,
  getPublicRecommendations,
} from "../controllers/recipeRecommendationController.js";
import { authenticate } from "../middlewares/auth.js";
import { createAIRateLimiter } from "../middlewares/aiRateLimiter.js";

const router = Router();

// AI rate limiter for recipe recommendations (20 requests per day per user)
const recipeRateLimit = createAIRateLimiter("recipeRecommendations");

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
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post("/", authenticate, recipeRateLimit, getRecommendations);

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
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */
router.post("/manual", recipeRateLimit, getRecommendationsWithIngredients);

/**
 * @swagger
 * /api/recipe-recommendations/public:
 *   post:
 *     summary: Get public recipe recommendations (no AI, no token usage)
 *     tags: [Recipe Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minMatchPercentage:
 *                 type: number
 *                 default: 50
 *                 example: 60
 *               useInventory:
 *                 type: boolean
 *                 default: true
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
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: string
 *               limit:
 *                 type: number
 *                 default: 20
 *     responses:
 *       200:
 *         description: Public recipe recommendations retrieved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/public", authenticate, getPublicRecommendations);

export default router;
