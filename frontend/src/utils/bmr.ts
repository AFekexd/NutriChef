/**
 * BMR and TDEE Calculation Utilities
 * Using Mifflin-St Jeor Equation for BMR calculation
 */

export interface UserMetrics {
  age: number; // years
  gender: "male" | "female";
  weight: number; // kg
  height: number; // cm
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
  goal: "lose" | "loseFast" | "loseAggressive" | "maintain" | "gain";
}

export interface NutritionRecommendations {
  bmr: number;
  tdee: number;
  dailyCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
  macroRatios: {
    protein: number; // percentage
    carbs: number; // percentage
    fat: number; // percentage
  };
}

/**
 * Activity level multipliers for TDEE calculation
 */
const ACTIVITY_MULTIPLIERS: Record<UserMetrics["activityLevel"], number> = {
  sedentary: 1.2, // Little or no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  veryActive: 1.9, // Very hard exercise & physical job
};

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 * Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: "male" | "female"
): number {
  const baseCalc = 10 * weight + 6.25 * height - 5 * age;
  const genderOffset = gender === "male" ? 5 : -161;
  return Math.round(baseCalc + genderOffset);
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(
  bmr: number,
  activityLevel: UserMetrics["activityLevel"]
): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate daily calorie goal based on TDEE and user goal
 */
export function calculateCalorieGoal(
  tdee: number,
  goal: UserMetrics["goal"]
): number {
  switch (goal) {
    case "lose":
      return Math.round(tdee - 500); // 500 cal deficit for ~0.5kg/week loss
    case "loseFast":
      return Math.round(tdee - 750); // 750 cal deficit for ~0.75kg/week loss
    case "loseAggressive":
      return Math.round(tdee - 1000); // 1000 cal deficit for ~1kg/week loss
    case "gain":
      return Math.round(tdee + 300); // 300 cal surplus for clean bulk
    case "maintain":
    default:
      return tdee;
  }
}

/**
 * Calculate macro distribution based on weight and activity level
 */
export function calculateMacros(
  dailyCalories: number,
  weight: number,
  activityLevel: UserMetrics["activityLevel"],
  goal: UserMetrics["goal"]
): {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
} {
  // Ensure minimum calories for safety
  const minCalories = Math.max(dailyCalories, 1200);

  // Protein: Higher during deficit to preserve muscle
  // Use 2.2g per kg for deficit, 2.0g for active, 1.6g for moderate
  let proteinPerKg = 1.6;
  if (goal === "lose" || goal === "loseFast" || goal === "loseAggressive") {
    proteinPerKg = 2.2; // Higher protein during deficit to preserve muscle
  } else if (activityLevel === "active" || activityLevel === "veryActive") {
    proteinPerKg = 2.0;
  }
  const protein = Math.round(weight * proteinPerKg);

  // Fat: 20-30% of calories (minimum 0.6g per kg for hormonal health)
  const minFat = Math.round(weight * 0.6); // Minimum for health
  const fatFromCalories = Math.round((minCalories * 0.25) / 9); // 25% of calories
  const fat = Math.max(minFat, fatFromCalories);

  // Calculate calories from protein and fat
  const proteinCalories = protein * 4; // 4 cal per gram
  const fatCalories = fat * 9; // 9 cal per gram

  // Carbs: Fill the rest of calories (minimum 100g for brain function)
  const remainingCalories = Math.max(
    0,
    minCalories - proteinCalories - fatCalories
  );
  const carbsFromCalories = Math.round(remainingCalories / 4);
  const carbs = Math.max(100, carbsFromCalories); // Minimum 100g for brain/energy

  // Fiber: 14g per 1000 calories (recommended by dietary guidelines)
  const fiber = Math.round((minCalories / 1000) * 14);

  return { protein, carbs, fat, fiber };
}

/**
 * Calculate complete nutrition recommendations based on user metrics
 */
export function calculateNutritionRecommendations(
  metrics: UserMetrics
): NutritionRecommendations {
  // Calculate BMR
  const bmr = calculateBMR(
    metrics.weight,
    metrics.height,
    metrics.age,
    metrics.gender
  );

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, metrics.activityLevel);

  // Calculate calorie goal
  const dailyCalories = calculateCalorieGoal(tdee, metrics.goal);

  // Calculate macros
  const { protein, carbs, fat, fiber } = calculateMacros(
    dailyCalories,
    metrics.weight,
    metrics.activityLevel,
    metrics.goal
  );

  // Calculate macro ratios (as percentages)
  const proteinCalories = protein * 4;
  const carbsCalories = carbs * 4;
  const fatCalories = fat * 9;
  const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

  return {
    bmr,
    tdee,
    dailyCalories,
    protein,
    carbs,
    fat,
    fiber,
    macroRatios: {
      protein: Math.round((proteinCalories / totalMacroCalories) * 100),
      carbs: Math.round((carbsCalories / totalMacroCalories) * 100),
      fat: Math.round((fatCalories / totalMacroCalories) * 100),
    },
  };
}

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592);
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54);
}

/**
 * Convert feet and inches to centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

/**
 * Get activity level description
 */
export function getActivityLevelDescription(
  level: UserMetrics["activityLevel"]
): string {
  const descriptions: Record<UserMetrics["activityLevel"], string> = {
    sedentary: "Little or no exercise",
    light: "Light exercise 1-3 days/week",
    moderate: "Moderate exercise 3-5 days/week",
    active: "Hard exercise 6-7 days/week",
    veryActive: "Very hard exercise & physical job",
  };
  return descriptions[level];
}

/**
 * Get goal description
 */
export function getGoalDescription(goal: UserMetrics["goal"]): string {
  const descriptions: Record<UserMetrics["goal"], string> = {
    lose: "Moderate weight loss (0.5kg/week, -500 cal/day)",
    loseFast: "Fast weight loss (0.75kg/week, -750 cal/day)",
    loseAggressive: "Aggressive weight loss (1kg/week, -1000 cal/day)",
    maintain: "Maintain current weight",
    gain: "Gain muscle (clean bulk)",
  };
  return descriptions[goal];
}
