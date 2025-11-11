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
  oauthProvider?: string | null;
  oauthAvatar?: string | null;
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

// AI API Key types
export interface AIApiKeyConfig {
  hasApiKey: boolean;
  provider?: "openai" | "gemini";
}

export interface SaveAIApiKeyRequest {
  apiKey: string;
  provider: "openai" | "gemini";
}

export interface AIApiKeyResponse {
  message: string;
  provider?: string;
  hasApiKey: boolean;
}

// OpenRouter API Key types
export interface OpenRouterUsage {
  totalRequests: number;
  tokensUsed: {
    input: number;
    output: number;
  };
  lastUpdated: string;
  remainingBalance?: number;
}

export interface OpenRouterApiKeyConfig {
  hasApiKey: boolean;
  usage?: OpenRouterUsage | null;
}

export interface SaveOpenRouterApiKeyRequest {
  apiKey: string;
  isClientEncrypted?: boolean;
}

export interface OpenRouterApiKeyResponse {
  message: string;
  hasApiKey: boolean;
  usage?: OpenRouterUsage;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export interface OpenRouterModelsResponse {
  models: OpenRouterModel[];
  total: number;
}

export interface OpenRouterModelConfig {
  modelId: string | null;
}

export interface OpenRouterKeyInfo {
  label: string;
  limit: number | null; // Credit limit for the key, or null if unlimited
  limit_reset: string | null; // Type of limit reset for the key, or null if never resets
  limit_remaining: number | null; // Remaining credits for the key, or null if unlimited
  include_byok_in_limit: boolean; // Whether to include external BYOK usage in the credit limit
  usage: number; // Number of credits used (all time)
  usage_daily: number; // Number of credits used (current UTC day)
  usage_weekly: number; // Number of credits used (current UTC week, starting Monday)
  usage_monthly: number; // Number of credits used (current UTC month)
  byok_usage: number; // Same for external BYOK usage
  byok_usage_daily: number;
  byok_usage_weekly: number;
  byok_usage_monthly: number;
  is_free_tier: boolean; // Whether the user has paid for credits before
}

export interface OpenRouterKeyInfoResponse {
  keyInfo: OpenRouterKeyInfo;
  message: string;
}

export type AIServiceOption = "default" | "own" | "openrouter";

export interface AIPreferences {
  textGeneration: AIServiceOption;
  imageAnalysis: AIServiceOption;
}

export interface AIPreferencesResponse {
  preferences: AIPreferences;
}

export interface SaveAIPreferencesRequest {
  textGeneration?: AIServiceOption;
  imageAnalysis?: AIServiceOption;
}

// AI Rate Limit types
export interface AIRateLimitService {
  used: number;
  limit: number;
  resetTime: string | null;
}

export interface AIRateLimits {
  healthInsights: AIRateLimitService;
  recipeRecommendations: AIRateLimitService;
  inventoryAI: AIRateLimitService;
}

export interface AIRateLimitStatus {
  userId: string;
  usingOwnApiKey: boolean;
  rateLimits: AIRateLimits | null;
  overall?: {
    used: number;
    limit: number;
    percentage: number;
  };
  message?: string;
}

// Recipe types
export interface Recipe {
  recipeId: string;
  userId?: string;
  user?: {
    userId: string;
    name: string;
    email: string;
    oauthAvatar?: string;
  };
  title: string;
  instructions: string;
  imageURL?: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: "easy" | "medium" | "hard";
  cuisineType?: string;
  isPublic?: boolean;
  rating?: number;
  ratingCount?: number;
  recipeIngredients?: {
    recipeIngredientId: string;
    quantity: number;
    unit: string;
    ingredient: {
      ingredientId: string;
      name: string;
      category: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeRating {
  recipeRatingId: string;
  recipeId: string;
  userId: string;
  rating: number;
  comment?: string;
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
