import type { TutorialStep } from "./TutorialOverlay";

// Dashboard Tutorial
export const dashboardTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='welcome']",
    title: "Welcome to NutriChef! 🎉",
    content:
      "Your all-in-one nutrition companion! Track meals, manage inventory, plan your week, and get AI-powered recipe recommendations. Let's get started!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='quick-actions']",
    title: "Quick Actions Hub",
    content:
      "Start here! Log today's meals, scan ingredients with AI, generate meal plans, or discover recipes. These are your most-used features.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='daily-summary']",
    title: "Today's Nutrition",
    content:
      "Track your daily progress towards calorie and macro goals. The bars fill up as you log meals throughout the day.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='inventory-status']",
    title: "Pantry Overview",
    content:
      "See items expiring soon (highlighted in red). Click to view your full inventory or get recipe suggestions using what you have.",
    position: "top",
  },
  {
    target: "[data-tutorial='upcoming-meals']",
    title: "Your Meal Plan",
    content:
      "See what's scheduled for breakfast, lunch, and dinner. Click any meal to view details or make changes. You're all set - start exploring! 🚀",
    position: "top",
  },
];

// Navigation Tutorial - Updated for categorized navigation
export const navigationTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='nav-dashboard']",
    title: "Home Base 🏠",
    content:
      "Your dashboard shows today's nutrition, upcoming meals, and pantry alerts. Return here anytime to see your daily overview.",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-inventory']",
    title: "Inventory Menu",
    content:
      "Access your digital pantry and AI scanning tools. Manage what you have and track expiration dates effortlessly.",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-center-action']",
    title: "Quick Access",
    content:
      "Tap this button for instant actions: scan items with your camera or jump back to home. Your shortcut hub!",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-food']",
    title: "Food & Recipes",
    content:
      "Browse all recipes, view your saved favorites, get AI recommendations, and plan your weekly meals. Everything food-related is here!",
    position: "top",
  },
  {
    target: "[data-tutorial='nav-more']",
    title: "More Features",
    content:
      "Access nutrition tracking, health insights, your profile, and settings. All additional features live in this menu.",
    position: "top",
  },
];

// Inventory Tutorial
export const inventoryTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='inventory-header']",
    title: "Your Digital Pantry",
    content:
      "Keep track of everything in your kitchen - fridge, freezer, and pantry. Never forget what you have or let food expire!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='ai-scan-button']",
    title: "AI Scanner ✨",
    content:
      "Take a photo of groceries or receipts and AI automatically detects items, quantities, and expiration dates. No manual typing needed!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='add-manual-button']",
    title: "Manual Entry",
    content:
      "Prefer to add items yourself? Click here to manually input ingredients with custom details and locations.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='filter-options']",
    title: "Filter & Search",
    content:
      "Filter by location (fridge, pantry, freezer) or search by ingredient name. Find what you need instantly!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='expiring-alert']",
    title: "Expiration Alerts",
    content:
      "Items expiring within 3 days appear in red. Click them for recipe suggestions that use these ingredients before they spoil!",
    position: "top",
  },
];

// Recipe Recommendations Tutorial
export const recipeTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='recipe-header']",
    title: "Recipe Discovery",
    content:
      "Browse thousands of recipes from the community. Filter by diet, cooking time, and difficulty to find your perfect meal!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='recipe-filter']",
    title: "Smart Filters",
    content:
      "Narrow down recipes by meal type (breakfast, lunch, dinner), dietary needs (vegan, keto, etc.), prep time, or difficulty level.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='recipe-ai-recommendations']",
    title: "AI-Matched Recipes",
    content:
      "See the 'Match %' badge? It shows how many ingredients you already have! Cook with what's in your pantry and reduce waste.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='recipe-card']",
    title: "Recipe Details",
    content:
      "Each card shows calories, protein, prep time, and community ratings. Click any recipe to see full instructions and nutrition breakdown.",
    position: "top",
  },
  {
    target: "[data-tutorial='save-recipe']",
    title: "Save & Share",
    content:
      "Heart icon saves recipes to 'My Recipes' for quick access. You can also create and share your own recipes with the community!",
    position: "top",
  },
];

// Meal Planning Tutorial
export const mealPlanningTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='meal-plan-header']",
    title: "Weekly Meal Planner",
    content:
      "Plan breakfast, lunch, dinner, and snacks for the entire week. Save time, reduce stress, and eat healthier with preparation!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='calendar-view']",
    title: "Weekly Calendar",
    content:
      "Visual overview of your week. Each day shows planned meals with total calories and macros. Drag to rearrange or click to edit.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='ai-generate-plan']",
    title: "AI Meal Plan Generator",
    content:
      "Let AI create a complete week's plan based on your calorie goals, dietary preferences, and pantry inventory. One click meal planning!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='add-meal']",
    title: "Add Meals Manually",
    content:
      "Click any empty meal slot to add recipes from your library, saved favorites, or create custom meals.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='shopping-list']",
    title: "Smart Shopping List",
    content:
      "Generate a shopping list for the week. It automatically subtracts what's already in your inventory - buy only what you need!",
    position: "top",
  },
];

// Nutrition Tracking Tutorial
export const nutritionTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='nutrition-header']",
    title: "Nutrition Tracking",
    content:
      "Log what you eat and monitor your daily intake. Track calories, macros, and micronutrients to hit your health goals!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='daily-goals']",
    title: "Daily Goals & Progress",
    content:
      "Set calorie and macro targets (protein, carbs, fats). Progress bars show real-time tracking as you log meals throughout the day.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='log-meal']",
    title: "Quick Meal Logging",
    content:
      "Add meals from your planned recipes, create custom entries, or scan food labels. Logging takes seconds!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='nutrition-chart']",
    title: "Visual Analytics",
    content:
      "See weekly and monthly trends with charts. Identify eating patterns and adjust your diet for better results over time.",
    position: "top",
  },
  {
    target: "[data-tutorial='meal-history']",
    title: "Meal History",
    content:
      "Review past meals to see what worked for your goals. Copy successful days to repeat winning nutrition patterns!",
    position: "top",
  },
];

// Health Insights Tutorial
export const healthInsightsTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='health-header']",
    title: "AI Health Insights",
    content:
      "Get personalized health analysis powered by AI. Understand your nutrition patterns and receive data-driven recommendations!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='bmr-calculator']",
    title: "BMR Calculator",
    content:
      "Calculate your Basal Metabolic Rate - how many calories your body burns at rest. This sets your baseline nutrition targets!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='health-metrics']",
    title: "Health Metrics",
    content:
      "Track BMI, water intake, activity levels, and weight changes. Monitor key indicators to measure your health progress.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='ai-insights']",
    title: "Personalized AI Analysis",
    content:
      "AI analyzes your eating patterns and identifies nutritional gaps. Get specific recommendations tailored to YOUR health data!",
    position: "top",
  },
  {
    target: "[data-tutorial='progress-tracking']",
    title: "Long-term Progress",
    content:
      "View weekly, monthly, and yearly trends. Celebrate improvements and stay motivated with visual progress tracking!",
    position: "top",
  },
];

// Profile Tutorial
export const profileTutorialSteps: TutorialStep[] = [
  {
    target: "[data-tutorial='profile-header']",
    title: "Your Profile Settings",
    content:
      "Manage your account, preferences, and personal info. Customize NutriChef to work exactly how you want!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='dietary-preferences']",
    title: "Dietary Preferences",
    content:
      "Set dietary restrictions (vegan, gluten-free, etc.), allergies, and food dislikes. All recipes and meal plans will respect these preferences!",
    position: "bottom",
  },
  {
    target: "[data-tutorial='health-goals']",
    title: "Health Goals",
    content:
      "Choose your primary goal: weight loss, muscle gain, maintenance, or general health. This adjusts calorie targets and recommendations.",
    position: "bottom",
  },
  {
    target: "[data-tutorial='theme-settings']",
    title: "Appearance & Language",
    content:
      "Toggle between light and dark mode, and select your preferred language. Make the app comfortable for your eyes!",
    position: "top",
  },
  {
    target: "[data-tutorial='account-security']",
    title: "Security & Privacy",
    content:
      "Update your password, manage connected OAuth accounts (Google, etc.), and control privacy settings. Your data stays secure!",
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
