import { Router } from "express";
import {
  getNutritionGoals,
  updateNutritionGoals,
  getDailyIntake,
  logMeal,
  deleteMeal,
  calculateBMR,
  getWeeklySummary,
} from "../controllers/nutritionController.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Nutrition goals
router.get("/goals", getNutritionGoals);
router.put("/goals", updateNutritionGoals);

// Daily intake
router.get("/daily/:date", getDailyIntake);

// Meal logging
router.post("/meals", logMeal);
router.delete("/meals/:mealId", deleteMeal);

// BMR calculation
router.post("/calculate-bmr", calculateBMR);

// Weekly summary
router.get("/weekly-summary", getWeeklySummary);

export default router;
