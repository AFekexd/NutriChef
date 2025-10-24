// User types
export interface User {
  userId: string;
  name: string;
  email: string;
  role?: string;
  preferences?: Record<string, any>;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  preferences?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
  session: {
    sessionId: string;
    expiresAt: string;
  };
}

export interface Session {
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
}

export interface LoginHistoryItem {
  loginHistoryId: string;
  ipAddress: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  timestamp: string;
}

// Recipe types
export interface Recipe {
  recipeId: string;
  userId?: string;
  title: string;
  instructions: string;
  imageURL?: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Recipe Recommendation types
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  optional?: boolean;
}

export interface RecipeRecommendation {
  title: string;
  matchPercentage: number;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: "easy" | "medium" | "hard";
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  availableIngredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  instructions: string;
  cuisineType?: string;
}

export interface RecipeRecommendationResponse {
  recommendations: RecipeRecommendation[];
  ingredientsUsed: number;
  servings: number;
  minMatchPercentage: number;
}

// Ingredient types
export interface Ingredient {
  ingredientId: string;
  name: string;
  category: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  carbonFootprint: number;
  createdAt: string;
  updatedAt: string;
}

// Inventory types
export interface InventoryItem {
  inventoryItemId: string;
  userId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  expiryDate: string | null;
  location?: string;
  imageUrl?: string;
  aiDetected?: boolean;
  purchaseDate?: string;
  consumptionRate?: number;
  ingredient: Ingredient;
  createdAt: string;
  updatedAt: string;
}

// Vision AI types
export interface DetectedItem {
  name: string;
  confidence: number;
  category: string;
  quantity: number;
  unit: string;
  estimatedExpiry: number;
  location: string;
}

export interface DetectionResult {
  uploadId: string;
  detectedItems: DetectedItem[];
  totalItemsDetected: number;
  processingTime: number;
  aiService: string;
  imageUrl: string;
}

export interface InventoryAnalytics {
  totalItems: number;
  expiringItems: number;
  totalValue: number;
  byLocation: {
    fridge: number;
    pantry: number;
    freezer: number;
  };
  aiDetectedCount?: number;
  aiDetectionPercentage?: number;
}

// API Response types
export interface ApiError {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Meal Planning types
export interface MealPlan {
  mealPlanId: string;
  userId: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  targetCalories?: number;
  targetMacros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  isAIGenerated: boolean;
  mealPlanRecipes: MealPlanRecipe[];
  mealPlanInventoryItems?: MealPlanInventoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanRecipe {
  mealPlanRecipeId: string;
  mealPlanId: string;
  recipeId: string;
  recipe: Recipe;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanInventoryItem {
  mealPlanInventoryItemId: string;
  mealPlanId: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  quantityUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  mealPlans: MealPlan[];
  summary: {
    totalMeals: number;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    averageCaloriesPerDay: number;
  };
}
