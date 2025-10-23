import { Router } from "express";
import {
  getMealPlans,
  getMealPlanById,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  addRecipeToMealPlan,
  removeRecipeFromMealPlan,
  getWeeklySummary,
} from "../controllers/mealPlanController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get meal plans for a date range
// Query params: ?startDate=2025-10-20&endDate=2025-10-27
router.get("/", getMealPlans);

// Get weekly summary
router.get("/weekly-summary", getWeeklySummary);

// Get specific meal plan
router.get("/:id", getMealPlanById);

// Create a new meal plan
router.post("/", createMealPlan);

// Update a meal plan
router.put("/:id", updateMealPlan);

// Delete a meal plan
router.delete("/:id", deleteMealPlan);

// Add recipe to meal plan
router.post("/:id/recipes", addRecipeToMealPlan);

// Remove recipe from meal plan
router.delete("/:id/recipes/:recipeId", removeRecipeFromMealPlan);

export default router;
