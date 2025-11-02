import type { TutorialStep } from "./TutorialOverlay";

// Dashboard Tutorial
export const dashboardTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='welcome']",
    title: "Welcome to NutriChef! 🎉",
    content:
      "Let's take a quick tour of your personalized nutrition and meal planning dashboard. We'll show you all the amazing features available to help you eat healthier!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='daily-summary']",
    title: "Daily Summary",
    content:
      "Track your daily calories, protein, carbs, and fats at a glance. This helps you stay on top of your nutritional goals every single day.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='quick-actions']",
    title: "Quick Actions",
    content:
      "Access the most important features instantly! Log meals, scan ingredients, plan your week, and discover new recipes - all just one tap away.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='inventory-status']",
    title: "Inventory Status",
    content:
      "Keep track of your pantry items and get alerts when food is about to expire. Never waste food again!",
    position: "top",
  },
  {
    target: "[data-tutorial='upcoming-meals']",
    title: "Upcoming Meals",
    content:
      "See what's planned for your next meals. Click on any meal to view details or make changes to your meal plan.",
    position: "top",
  },
];

// Navigation Tutorial
export const navigationTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='nav-recipes']",
    title: "Recipe Library",
    content:
      "Browse through hundreds of delicious, healthy recipes. Save your favorites and create your own custom recipes too!",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-meal-planning']",
    title: "Meal Planning",
    content:
      "Plan your entire week of meals in advance. Our AI can even generate personalized meal plans based on your preferences and available ingredients!",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-center-action']",
    title: "Quick Actions Menu",
    content:
      "Tap this center button anytime for quick access to scan items or jump to the home screen. It's your shortcut hub!",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-inventory']",
    title: "Smart Inventory",
    content:
      "Manage your pantry, fridge, and freezer. Use AI to scan and add items automatically - just take a photo!",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-more']",
    title: "More Options",
    content:
      "Access additional features like nutrition tracking, health insights, your profile settings, and more. Everything else lives here!",
    position: "top",
  },
];

// Inventory Tutorial
export const inventoryTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='inventory-header']",
    title: "Your Smart Inventory",
    content:
      "This is your digital pantry! Keep track of all your ingredients, their quantities, and expiration dates in one place.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='ai-scan-button']",
    title: "AI-Powered Scanning",
    content:
      "Simply take a photo of your groceries and our AI will automatically detect and add items to your inventory. It's like magic! ✨",
    position: "bottom",
  },
  {
    target: "[data-tutorial='add-manual-button']",
    title: "Manual Entry",
    content:
      "Prefer to add items yourself? Use this button to manually input ingredients with all the details you need.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='filter-options']",
    title: "Filter & Search",
    content:
      "Quickly find items by location (fridge, pantry, freezer) or search by name. Stay organized effortlessly!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='expiring-alert']",
    title: "Expiration Alerts",
    content:
      "Items expiring soon are highlighted in red. Get proactive suggestions for recipes that use these ingredients before they go bad!",
    position: "top",
  },
];

// Recipe Recommendations Tutorial
export const recipeTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='recipe-header']",
    title: "Recipe Library",
    content:
      "Discover thousands of healthy recipes tailored to your taste preferences and dietary needs. Your next favorite meal is just a click away!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='recipe-filter']",
    title: "Smart Filters",
    content:
      "Filter recipes by meal type, dietary restrictions, cooking time, and difficulty level. Find exactly what you're looking for!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='recipe-ai-recommendations']",
    title: "AI Recipe Suggestions",
    content:
      "Get personalized recipe recommendations based on what's currently in your inventory. Cook with what you have and reduce food waste!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='recipe-card']",
    title: "Recipe Cards",
    content:
      "Each recipe shows nutritional info, match percentage with your inventory, prep time, and difficulty. Tap any card to see full details and instructions!",
    position: "top",
  },
  {
    target: "[data-tutorial='save-recipe']",
    title: "Save Your Favorites",
    content:
      "Found a recipe you love? Save it to your collection for easy access later. You can also create and share your own recipes!",
    position: "top",
  },
];

// Meal Planning Tutorial
export const mealPlanningTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='meal-plan-header']",
    title: "Weekly Meal Planning",
    content:
      "Plan your entire week of meals in advance. This helps you eat healthier, save money, and reduce stress about 'what's for dinner?'",
    position: "bottom",
  },
  {
    target: "[data-tutorial='calendar-view']",
    title: "Visual Calendar",
    content:
      "See your whole week at a glance. Each day shows breakfast, lunch, dinner, and snacks with their nutritional info.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='ai-generate-plan']",
    title: "AI Meal Plan Generator",
    content:
      "Let AI do the work! Generate a complete meal plan based on your dietary goals, preferences, and available ingredients with one click.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='add-meal']",
    title: "Add Meals",
    content:
      "Manually add any recipe to your meal plan. Simply pick the day, meal type, and your chosen recipe. Easy peasy!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='shopping-list']",
    title: "Auto Shopping List",
    content:
      "Generate a shopping list automatically based on your meal plan. It calculates exactly what you need to buy based on what's already in your inventory!",
    position: "top",
  },
];

// Nutrition Tracking Tutorial
export const nutritionTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='nutrition-header']",
    title: "Nutrition Tracking",
    content:
      "Monitor your daily nutrition intake and stay on track with your health goals. Knowledge is power when it comes to healthy eating!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='daily-goals']",
    title: "Daily Goals",
    content:
      "Set and track your daily calorie and macro targets. Visual progress bars make it easy to see how you're doing throughout the day.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='log-meal']",
    title: "Log Your Meals",
    content:
      "Quickly log what you eat throughout the day. Choose from recipes, custom entries, or scan food labels for instant nutritional data.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='nutrition-chart']",
    title: "Visual Analytics",
    content:
      "See your nutrition trends over time with beautiful charts and graphs. Identify patterns and optimize your diet for better results!",
    position: "top",
  },
  {
    target: "[data-tutorial='meal-history']",
    title: "Meal History",
    content:
      "Review your past meals and see what worked well for you. Learn from your eating patterns to make better choices going forward.",
    position: "top",
  },
];

// Health Insights Tutorial
export const healthInsightsTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='health-header']",
    title: "AI Health Insights",
    content:
      "Get personalized health insights powered by advanced AI. Understand your nutrition patterns and receive actionable recommendations!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='bmr-calculator']",
    title: "BMR Calculator",
    content:
      "Calculate your Basal Metabolic Rate to understand how many calories your body needs at rest. This is the foundation of your nutrition plan!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='health-metrics']",
    title: "Health Metrics",
    content:
      "Track important health indicators like BMI, water intake, and activity levels. Small measurements lead to big improvements!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='ai-insights']",
    title: "Personalized Insights",
    content:
      "Receive AI-powered recommendations based on your eating patterns, nutritional gaps, and health goals. Your personal nutritionist in your pocket!",
    position: "top",
  },
  {
    target: "[data-tutorial='progress-tracking']",
    title: "Progress Over Time",
    content:
      "See how you're improving week by week and month by month. Celebrate your wins and stay motivated on your health journey!",
    position: "top",
  },
];

// Profile Tutorial
export const profileTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='profile-header']",
    title: "Your Profile",
    content:
      "Manage your account settings, preferences, and personal information all in one place. Make NutriChef truly yours!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='dietary-preferences']",
    title: "Dietary Preferences",
    content:
      "Set your dietary restrictions, allergies, and food preferences. This ensures all recommendations are tailored to your needs!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='health-goals']",
    title: "Health Goals",
    content:
      "Define your health and fitness goals - whether it's weight loss, muscle gain, or maintaining a balanced diet. We'll help you get there!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='theme-settings']",
    title: "Theme & Language",
    content:
      "Customize the app appearance with light/dark mode and choose your preferred language. Make yourself at home!",
    position: "top",
  },
  {
    target: "[data-tutorial='account-security']",
    title: "Account Security",
    content:
      "Manage your password, connected accounts, and privacy settings. Your data security is our top priority!",
    position: "top",
  },
];

// Get tutorial steps for a specific page
export function getTutorialSteps(page: string): TutorialStep[] {
  switch (page) {
    case "dashboard":
      return dashboardTutorialSteps;
    case "navigation":
      return navigationTutorialSteps;
    case "inventory":
      return inventoryTutorialSteps;
    case "recipes":
      return recipeTutorialSteps;
    case "meal-planning":
      return mealPlanningTutorialSteps;
    case "nutrition":
      return nutritionTutorialSteps;
    case "health-insights":
      return healthInsightsTutorialSteps;
    case "profile":
      return profileTutorialSteps;
    default:
      return [];
  }
}
