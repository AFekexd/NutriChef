import express from "express";
import {
  getHealthInsights,
  getNutritionPlan,
  clearHealthInsightsCache,
} from "../controllers/healthInsightsController.js";
import { authenticate } from "../middlewares/auth.js";
import { createAIRateLimiter } from "../middlewares/aiRateLimiter.js";

const router = express.Router();

// AI rate limiter for health insights (10 requests per day per user)
const healthInsightsRateLimit = createAIRateLimiter("healthInsights");

/**
 * @swagger
 * /api/health-insights:
 *   get:
 *     summary: Get personalized health insights
 *     tags: [Health Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, hu]
 *         description: Response language
 *     responses:
 *       200:
 *         description: AI-generated health insights
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.get("/", authenticate, healthInsightsRateLimit, getHealthInsights);

/**
 * @swagger
 * /api/health-insights/nutrition-plan:
 *   get:
 *     summary: Get personalized nutrition plan
 *     tags: [Health Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, hu]
 *         description: Response language
 *     responses:
 *       200:
 *         description: AI-generated nutrition plan
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.get("/nutrition-plan", authenticate, healthInsightsRateLimit, getNutritionPlan);

/**
 * @swagger
 * /api/health-insights/clear-cache:
 *   delete:
 *     summary: Clear health insights cache
 *     tags: [Health Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [en, hu]
 *         description: Clear cache for specific language only
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       401:
 *         description: Unauthorized
 */
router.delete("/clear-cache", authenticate, clearHealthInsightsCache);

export default router;
