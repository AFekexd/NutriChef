import axios from "axios";
import type { AxiosInstance, AxiosError } from "axios";
import type {
  LoginCredentials,
  RegisterData,
  LoginResponse,
  User,
  AuthTokens,
  Session,
  LoginHistoryItem,
  ApiError,
  DetectionResult,
  DetectedItem,
  InventoryItem,
  InventoryAnalytics,
  RecipeRecommendationResponse,
  AIApiKeyConfig,
  SaveAIApiKeyRequest,
  AIApiKeyResponse,
  OpenRouterApiKeyConfig,
  SaveOpenRouterApiKeyRequest,
  OpenRouterApiKeyResponse,
  OpenRouterUsage,
  OpenRouterModelsResponse,
  OpenRouterModelConfig,
  OpenRouterKeyInfoResponse,
  AIPreferences,
  AIPreferencesResponse,
  SaveAIPreferencesRequest,
  AIRateLimitStatus,
} from "../types";
import type { AppStore } from "../store";
import { updateTokens, logout } from "../store/slices/authSlice";
import { encryptData } from "../utils/encryption";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<AuthTokens> | null = null;
  private store: AppStore | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;

        // Check if this is a refresh token request that failed
        const isRefreshRequest =
          originalRequest?.url?.includes("/api/auth/refresh");

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest.headers?.["X-Retry"] &&
          !originalRequest.headers?.["X-Skip-Auth-Refresh"] &&
          !isRefreshRequest // Don't retry if the refresh request itself failed
        ) {
          try {
            if (!this.refreshTokenPromise) {
              this.refreshTokenPromise = this.refreshToken();
            }

            const tokens = await this.refreshTokenPromise;
            this.refreshTokenPromise = null;

            this.setTokens(tokens);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            originalRequest.headers["X-Retry"] = "true";

            return this.api(originalRequest);
          } catch (refreshError) {
            this.refreshTokenPromise = null; // Reset the promise on error
            this.clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        // If the refresh token request itself failed with 401, logout immediately
        if (isRefreshRequest && error.response?.status === 401) {
          this.refreshTokenPromise = null;
          this.clearTokens();
          window.location.href = "/login";
        }

        return Promise.reject(error);
      }
    );
  }

  // Store management
  setStore(store: AppStore): void {
    this.store = store;
  }

  // Token management
  private getAccessToken(): string | null {
    if (this.store) {
      return this.store.getState().auth.tokens?.accessToken || null;
    }
    // Fallback to localStorage for backward compatibility during migration
    return localStorage.getItem("accessToken");
  }

  private getRefreshTokenValue(): string | null {
    if (this.store) {
      return this.store.getState().auth.tokens?.refreshToken || null;
    }
    // Fallback to localStorage for backward compatibility during migration
    return localStorage.getItem("refreshToken");
  }

  private setTokens(tokens: AuthTokens): void {
    if (this.store) {
      this.store.dispatch(updateTokens(tokens));
    } else {
      // Fallback to localStorage if store not set
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
    }
  }

  private clearTokens(): void {
    if (this.store) {
      this.store.dispatch(logout());
    } else {
      // Fallback to localStorage if store not set
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<{ message: string; user: User }> {
    const response = await this.api.post("/api/auth/register", data);
    return response.data;
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>(
      "/api/auth/login",
      credentials
    );
    // Tokens and user are now managed by Redux through AuthContext
    this.setTokens(response.data.tokens);
    return response.data;
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshTokenValue();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await this.api.post<{ tokens: AuthTokens }>(
      "/api/auth/refresh",
      {
        refreshToken,
      }
    );

    return response.data.tokens;
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/api/auth/logout");
    } finally {
      this.clearTokens();
    }
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.api.get<{ user: User }>("/api/auth/profile");
    // User is now managed by Redux through AuthContext
    return response.data;
  }

  async getSessions(): Promise<{ sessions: Session[] }> {
    const response = await this.api.get<{ sessions: Session[] }>(
      "/api/auth/sessions"
    );
    return response.data;
  }

  async revokeSession(
    sessionId: string
  ): Promise<{ wasCurrentSession: boolean }> {
    try {
      await this.api.delete(`/api/auth/sessions/${sessionId}`);
      // Try to verify if we still have access (to detect if we revoked our own session)
      try {
        // Add a special header to prevent token refresh on this request
        await this.api.get("/api/auth/profile", {
          headers: { "X-Skip-Auth-Refresh": "true" },
        });
        return { wasCurrentSession: false };
      } catch (verifyError: any) {
        // If we get 401, we revoked our own session
        if (verifyError.response?.status === 401) {
          return { wasCurrentSession: true };
        }
        throw verifyError;
      }
    } catch (error) {
      // If the delete itself failed, re-throw
      throw error;
    }
  }

  async getLoginHistory(
    limit = 20,
    offset = 0
  ): Promise<{
    history: LoginHistoryItem[];
    pagination: { total: number; limit: number; offset: number };
  }> {
    const response = await this.api.get("/api/auth/login-history", {
      params: { limit, offset },
    });
    return response.data;
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
  }): Promise<{ message: string; user: User }> {
    const response = await this.api.put("/api/auth/profile", data);
    // User is now managed by Redux through AuthContext
    return response.data;
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    const response = await this.api.post("/api/auth/change-password", data);
    return response.data;
  }

  async uploadAvatar(
    file: File
  ): Promise<{ message: string; user: User; avatarUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await this.api.post("/api/auth/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  async deleteAvatar(): Promise<{ message: string; user: User }> {
    const response = await this.api.delete("/api/auth/avatar");
    return response.data;
  }

  // AI API Key endpoints
  async getAIApiKeyConfig(): Promise<AIApiKeyConfig> {
    const response = await this.api.get("/api/auth/ai-api-key");
    return response.data;
  }

  async saveAIApiKey(data: SaveAIApiKeyRequest): Promise<AIApiKeyResponse> {
    // Encrypt the API key on the client side before sending
    const encryptedApiKey = await encryptData(data.apiKey);

    const response = await this.api.post("/api/auth/ai-api-key", {
      apiKey: encryptedApiKey,
      provider: data.provider,
      isClientEncrypted: true, // Flag to indicate client-side encryption
    });
    return response.data;
  }

  async deleteAIApiKey(): Promise<AIApiKeyResponse> {
    const response = await this.api.delete("/api/auth/ai-api-key");
    return response.data;
  }

  // OpenRouter API Key endpoints
  async getOpenRouterApiKeyConfig(): Promise<OpenRouterApiKeyConfig> {
    const response = await this.api.get("/api/auth/openrouter-api-key");
    return response.data;
  }

  async saveOpenRouterApiKey(
    data: SaveOpenRouterApiKeyRequest
  ): Promise<OpenRouterApiKeyResponse> {
    // Encrypt the API key on the client side before sending
    const encryptedApiKey = await encryptData(data.apiKey);

    const response = await this.api.post("/api/auth/openrouter-api-key", {
      apiKey: encryptedApiKey,
      isClientEncrypted: true, // Flag to indicate client-side encryption
    });
    return response.data;
  }

  async deleteOpenRouterApiKey(): Promise<OpenRouterApiKeyResponse> {
    const response = await this.api.delete("/api/auth/openrouter-api-key");
    return response.data;
  }

  async refreshOpenRouterUsage(): Promise<{
    message: string;
    usage: OpenRouterUsage;
  }> {
    const response = await this.api.post(
      "/api/auth/openrouter-api-key/refresh"
    );
    return response.data;
  }

  async getOpenRouterModels(
    searchQuery?: string
  ): Promise<OpenRouterModelsResponse> {
    const params = searchQuery ? { search: searchQuery } : {};
    const response = await this.api.get("/api/auth/openrouter-models", {
      params,
    });
    return response.data;
  }

  async getOpenRouterKeyInfo(): Promise<OpenRouterKeyInfoResponse> {
    const response = await this.api.get("/api/auth/openrouter-key-info");
    return response.data;
  }

  async getOpenRouterModel(): Promise<OpenRouterModelConfig> {
    const response = await this.api.get("/api/auth/openrouter-model");
    return response.data;
  }

  async saveOpenRouterModel(
    modelId: string
  ): Promise<{ message: string; modelId: string }> {
    const response = await this.api.post("/api/auth/openrouter-model", {
      modelId,
    });
    return response.data;
  }

  async getAIPreferences(): Promise<AIPreferencesResponse> {
    const response = await this.api.get("/api/auth/ai-preferences");
    return response.data;
  }

  async saveAIPreferences(
    preferences: SaveAIPreferencesRequest
  ): Promise<{ message: string; preferences: AIPreferences }> {
    const response = await this.api.post(
      "/api/auth/ai-preferences",
      preferences
    );
    return response.data;
  }

  async getAIRateLimitStatus(): Promise<AIRateLimitStatus> {
    const response = await this.api.get("/api/auth/ai-rate-limit-status", {
      headers: { "X-Skip-Auth-Refresh": "true" },
    });
    return response.data;
  }

  // Helper to get current user from Redux store
  getCurrentUser(): User | null {
    if (this.store) {
      return this.store.getState().auth.user;
    }
    // Fallback to localStorage for backward compatibility during migration
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // Vision AI endpoints
  async uploadInventoryImage(
    file: File,
    language?: string
  ): Promise<DetectionResult> {
    const formData = new FormData();
    formData.append("image", file);
    if (language) {
      formData.append("language", language);
    }

    const response = await this.api.post<DetectionResult>(
      "/api/inventory/upload-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async confirmDetectedItems(
    uploadId: string,
    items: DetectedItem[]
  ): Promise<{ message: string; itemsAdded: number; items: InventoryItem[] }> {
    const response = await this.api.post("/api/inventory/confirm-detected", {
      uploadId,
      items,
    });
    return response.data;
  }

  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const response = await this.api.get<InventoryAnalytics>(
      "/api/inventory/analytics"
    );
    return response.data;
  }

  async getExpiringItems(days = 7): Promise<{
    expiringCount: number;
    daysAhead: number;
    items: InventoryItem[];
  }> {
    const response = await this.api.get("/api/inventory/expiring", {
      params: { days },
    });
    return response.data;
  }

  async getItemsByLocation(
    location: "fridge" | "pantry" | "freezer"
  ): Promise<{ location: string; itemCount: number; items: InventoryItem[] }> {
    const response = await this.api.get(`/api/inventory/location/${location}`);
    return response.data;
  }

  async getAllInventoryItems(): Promise<InventoryItem[]> {
    const response = await this.api.get<InventoryItem[]>("/api/inventory");
    return response.data;
  }

  async addManualInventoryItem(data: {
    ingredientName: string;
    quantity: number;
    unit: string;
    location: string;
    expiryDate?: string;
    category?: string;
  }): Promise<{ message: string; item: InventoryItem }> {
    const response = await this.api.post("/api/inventory/manual", data);
    return response.data;
  }

  async logConsumption(
    itemId: string,
    quantityConsumed: number
  ): Promise<{
    message: string;
    item: InventoryItem;
    remainingQuantity: number;
  }> {
    const response = await this.api.post(`/api/inventory/${itemId}/consume`, {
      quantityConsumed,
    });
    return response.data;
  }

  async deleteInventoryItem(itemId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/inventory/${itemId}`);
    return response.data;
  }

  async updateInventoryItem(
    itemId: string,
    data: {
      quantity?: number;
      unit?: string;
      location?: string;
      expiryDate?: string;
    }
  ): Promise<{ message: string; item: InventoryItem }> {
    const response = await this.api.put(`/api/inventory/${itemId}`, data);
    return response.data;
  }

  // Recipe Recommendation endpoints
  async getRecipes(): Promise<{ recipes: import("../types").Recipe[] }> {
    const response = await this.api.get("/api/recipes");
    return response.data;
  }

  async createRecipe(data: {
    title: string;
    instructions: string;
    calories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
    servings?: number;
    prepTime?: number;
    cookTime?: number;
    difficulty?: string;
    cuisineType?: string;
    imageURL?: string;
    isPublic?: boolean;
    ingredients?: Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
    }>;
  }): Promise<import("../types").Recipe> {
    const response = await this.api.post("/api/recipes", data);
    return response.data;
  }

  async updateRecipeVisibility(
    recipeId: string,
    isPublic: boolean
  ): Promise<import("../types").Recipe> {
    const response = await this.api.patch(
      `/api/recipes/${recipeId}/visibility`,
      {
        isPublic,
      }
    );
    return response.data;
  }

  async rateRecipe(
    recipeId: string,
    rating: number,
    comment?: string
  ): Promise<{ message: string; rating: number; ratingCount: number }> {
    const response = await this.api.post(`/api/recipes/${recipeId}/rating`, {
      rating,
      comment,
    });
    return response.data;
  }

  async getRecipeRecommendations(data: {
    servings?: number;
    minMatchPercentage?: number;
    useInventory?: boolean;
    language?: string;
    allergies?: string[];
    manualIngredients?: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }>;
  }): Promise<RecipeRecommendationResponse> {
    const response = await this.api.post<RecipeRecommendationResponse>(
      "/api/recipe-recommendations",
      data
    );
    return response.data;
  }

  async getRecipeRecommendationsManual(data: {
    ingredients: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
    }>;
    servings?: number;
    minMatchPercentage?: number;
    language?: string;
  }): Promise<RecipeRecommendationResponse> {
    const response = await this.api.post<RecipeRecommendationResponse>(
      "/api/recipe-recommendations/manual",
      data
    );
    return response.data;
  }

  // Search ingredients for autocomplete
  async searchIngredients(query: string): Promise<
    Array<{
      ingredientId: number;
      name: string;
      category: string;
    }>
  > {
    const response = await this.api.get(`/api/ingredients/search`, {
      params: { q: query },
    });
    return response.data;
  }

  // Create or get ingredient by name
  async getOrCreateIngredient(
    name: string,
    category: string = "other"
  ): Promise<{
    ingredientId: string;
    name: string;
    category: string;
  }> {
    // First, try to search for existing ingredient
    const searchResults = await this.searchIngredients(name);
    const exactMatch = searchResults.find(
      (ing) => ing.name.toLowerCase() === name.toLowerCase()
    );

    if (exactMatch) {
      return {
        ingredientId: exactMatch.ingredientId.toString(),
        name: exactMatch.name,
        category: exactMatch.category,
      };
    }

    // If not found, create new ingredient
    const response = await this.api.post("/api/ingredients", {
      name,
      category,
    });
    return {
      ingredientId: response.data.ingredientId,
      name: response.data.name,
      category: response.data.category,
    };
  }

  // Admin endpoints
  async getAdminStats(): Promise<{
    stats: {
      totalUsers: number;
      activeUsers: number;
      totalInventoryItems: number;
      totalRecipes: number;
      totalUploads: number;
    };
    recentUsers: Array<{
      userId: string;
      name: string;
      email: string;
      createdAt: string;
    }>;
  }> {
    const response = await this.api.get("/api/admin/stats");
    return response.data;
  }

  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{
    users: Array<any>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get("/api/admin/users", { params });
    return response.data;
  }

  async getUserDetails(userId: string): Promise<{ user: any }> {
    const response = await this.api.get(`/api/admin/users/${userId}`);
    return response.data;
  }

  async updateUserStatus(
    userId: string,
    isActive: boolean,
    reason?: string
  ): Promise<{ user: any; message: string }> {
    const response = await this.api.put(`/api/admin/users/${userId}/status`, {
      isActive,
      ...(reason && { reason }),
    });
    return response.data;
  }

  async updateUserRole(
    userId: string,
    role: string
  ): Promise<{ user: any; message: string }> {
    const response = await this.api.put(`/api/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  }

  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/admin/users/${userId}`);
    return response.data;
  }

  async getAllAdminInventoryItems(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    search?: string;
  }): Promise<{
    items: Array<any>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get("/api/admin/inventory", { params });
    return response.data;
  }

  async deleteAdminInventoryItem(itemId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/admin/inventory/${itemId}`);
    return response.data;
  }

  async getAllAdminRecipes(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    search?: string;
  }): Promise<{
    recipes: Array<any>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get("/api/admin/recipes", { params });
    return response.data;
  }

  async deleteAdminRecipe(recipeId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/admin/recipes/${recipeId}`);
    return response.data;
  }

  async getAllUploads(params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{
    uploads: Array<any>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get("/api/admin/uploads", { params });
    return response.data;
  }

  // Admin logging and moderation endpoints
  async getAdminLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    targetType?: string;
    adminUserId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    logs: Array<{
      adminLogId: string;
      adminUserId: string;
      action: string;
      targetType: string;
      targetId?: string;
      targetEmail?: string;
      targetName?: string;
      details?: any;
      ipAddress?: string;
      userAgent?: string;
      timestamp: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get("/api/admin/logs", { params });
    return response.data;
  }

  async getUserModeration(userId: string): Promise<{
    activeActions: Array<any>;
    history: Array<any>;
  }> {
    const response = await this.api.get(
      `/api/admin/users/${userId}/moderation`
    );
    return response.data;
  }

  async sendWarningToUser(
    userId: string,
    reason?: string,
    adminNote?: string
  ): Promise<{ message: string; moderationAction: any }> {
    const response = await this.api.post(`/api/admin/users/${userId}/warn`, {
      reason,
      adminNote,
    });
    return response.data;
  }

  async timeoutUser(
    userId: string,
    duration: number,
    reason?: string,
    adminNote?: string
  ): Promise<{ message: string; moderationAction: any }> {
    const response = await this.api.post(`/api/admin/users/${userId}/timeout`, {
      duration,
      reason,
      adminNote,
    });
    return response.data;
  }

  async banUser(
    userId: string,
    reason?: string,
    duration?: number,
    adminNote?: string
  ): Promise<{ message: string; moderationAction: any }> {
    const response = await this.api.post(`/api/admin/users/${userId}/ban`, {
      reason,
      duration,
      adminNote,
    });
    return response.data;
  }

  async unbanUser(userId: string): Promise<{ message: string }> {
    const response = await this.api.post(`/api/admin/users/${userId}/unban`);
    return response.data;
  }

  // API Activity Logs endpoints
  async getApiActivityLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
  }): Promise<{
    logs: Array<{
      apiLogId: string;
      userId?: string;
      userEmail?: string;
      userName?: string;
      method: string;
      path: string;
      statusCode: number;
      responseTime?: number;
      ipAddress?: string;
      userAgent?: string;
      requestBody?: any;
      responseBody?: any;
      errorMessage?: string;
      timestamp: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const response = await this.api.get("/api/admin/api-logs", { params });
    return response.data;
  }

  async getApiActivityStats(params?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    successRate: number;
    topEndpoints: Array<{
      method: string;
      path: string;
      count: number;
    }>;
    topUsers: Array<{
      userId: string;
      userEmail: string;
      userName: string;
      count: number;
    }>;
    errorDistribution: Array<{
      statusCode: number;
      count: number;
    }>;
  }> {
    const response = await this.api.get("/api/admin/api-logs/stats", {
      params,
    });
    return response.data;
  }

  async cleanupApiLogs(daysToKeep: number = 30): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const response = await this.api.post("/api/admin/api-logs/cleanup", {
      daysToKeep,
    });
    return response.data;
  }

  // Meal Planning endpoints
  async getMealPlans(
    startDate?: string,
    endDate?: string
  ): Promise<{
    mealPlans: import("../types").MealPlan[];
  }> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await this.api.get("/api/meal-plans", { params });
    return response.data;
  }

  async getMealPlanById(
    id: string
  ): Promise<{ mealPlan: import("../types").MealPlan }> {
    const response = await this.api.get(`/api/meal-plans/${id}`);
    return response.data;
  }

  async createMealPlan(data: {
    date: string;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    recipeIds?: string[];
    inventoryItemIds?: string[];
    targetCalories?: number;
    targetMacros?: { protein: number; carbs: number; fat: number };
    isAIGenerated?: boolean;
  }): Promise<{
    message: string;
    mealPlan: import("../types").MealPlan;
  }> {
    const response = await this.api.post("/api/meal-plans", data);
    return response.data;
  }

  async updateMealPlan(
    id: string,
    data: {
      date?: string;
      mealType?: "breakfast" | "lunch" | "dinner" | "snack";
      recipeIds?: string[];
      targetCalories?: number;
      targetMacros?: { protein: number; carbs: number; fat: number };
    }
  ): Promise<{
    message: string;
    mealPlan: import("../types").MealPlan;
  }> {
    const response = await this.api.put(`/api/meal-plans/${id}`, data);
    return response.data;
  }

  async deleteMealPlan(id: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/meal-plans/${id}`);
    return response.data;
  }

  async addRecipeToMealPlan(
    mealPlanId: string,
    recipeId: string
  ): Promise<{ message: string; mealPlanRecipe: any }> {
    const response = await this.api.post(
      `/api/meal-plans/${mealPlanId}/recipes`,
      { recipeId }
    );
    return response.data;
  }

  async removeRecipeFromMealPlan(
    mealPlanId: string,
    recipeId: string
  ): Promise<{ message: string }> {
    const response = await this.api.delete(
      `/api/meal-plans/${mealPlanId}/recipes/${recipeId}`
    );
    return response.data;
  }

  async addInventoryItemToMealPlan(
    mealPlanId: string,
    inventoryItemId: string,
    quantityUsed?: number
  ): Promise<{ message: string; mealPlanInventoryItem: any }> {
    const response = await this.api.post(
      `/api/meal-plans/${mealPlanId}/inventory-items`,
      { inventoryItemId, quantityUsed }
    );
    return response.data;
  }

  async removeInventoryItemFromMealPlan(
    mealPlanId: string,
    inventoryItemId: string
  ): Promise<{ message: string }> {
    const response = await this.api.delete(
      `/api/meal-plans/${mealPlanId}/inventory-items/${inventoryItemId}`
    );
    return response.data;
  }

  async getWeeklySummary(
    weekStart?: string
  ): Promise<import("../types").WeeklySummary> {
    const params: any = {};
    if (weekStart) params.weekStart = weekStart;
    const response = await this.api.get("/api/meal-plans/weekly-summary", {
      params,
    });
    return response.data;
  }

  // Nutrition Tracking Methods
  async getNutritionGoals(): Promise<{
    goals: {
      dailyCalories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      macroRatios: { protein: number; carbs: number; fat: number } | null;
    };
  }> {
    const response = await this.api.get("/api/nutrition/goals");
    return response.data;
  }

  async updateNutritionGoals(goals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    macroRatios?: { protein: number; carbs: number; fat: number };
  }): Promise<{
    message: string;
    goals: any;
  }> {
    const response = await this.api.put("/api/nutrition/goals", goals);
    return response.data;
  }

  async getDailyIntake(date: string): Promise<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    meals: Array<{
      id: string;
      mealType: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      time: string;
    }>;
  }> {
    const response = await this.api.get(`/api/nutrition/daily/${date}`);
    return response.data;
  }

  async logMeal(mealData: {
    date: string;
    mealType: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    recipeId?: string;
  }): Promise<{
    message: string;
    meal: any;
  }> {
    const response = await this.api.post("/api/nutrition/meals", mealData);
    return response.data;
  }

  async deleteMeal(mealId: string): Promise<{ message: string }> {
    const response = await this.api.delete(`/api/nutrition/meals/${mealId}`);
    return response.data;
  }

  async calculateBMR(metrics: {
    age: number;
    gender: "male" | "female";
    weight: number;
    height: number;
    activityLevel: "sedentary" | "light" | "moderate" | "active" | "veryActive";
    goal: "lose" | "loseFast" | "loseAggressive" | "maintain" | "gain";
  }): Promise<{
    message: string;
    recommendations: {
      bmr: number;
      tdee: number;
      dailyCalories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      macroRatios: { protein: number; carbs: number; fat: number };
      activityLevel: string;
      goal: string;
    };
  }> {
    const response = await this.api.post(
      "/api/nutrition/calculate-bmr",
      metrics
    );
    return response.data;
  }

  async getNutritionWeeklySummary(weekStart?: string): Promise<{
    weekStart: string;
    weekEnd: string;
    summary: Array<{
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      meals: number;
    }>;
  }> {
    const params: any = {};
    if (weekStart) params.weekStart = weekStart;
    const response = await this.api.get("/api/nutrition/weekly-summary", {
      params,
    });
    return response.data;
  }

  // Health Insights
  async getHealthInsights(language: string): Promise<{
    overallScore: number;
    scoreBreakdown: {
      calorieBalance: number;
      macroBalance: number;
      consistency: number;
      hydration: number;
    };
    insights: Array<{
      type: "success" | "warning" | "tip" | "info";
      title: string;
      description: string;
      icon: string;
    }>;
    recommendations: Array<{
      category: string;
      priority: "high" | "medium" | "low";
      title: string;
      description: string;
      actionItems: string[];
    }>;
    weeklyGoals: Array<{
      goal: string;
      target: string;
      progress: number;
    }>;
    nutritionCoachMessage: string;
    userData: {
      bmr: number;
      tdee: number;
      averageCalories: number;
      daysTracked: number;
    };
  }> {
    const response = await this.api.get("/api/health-insights", {
      params: { language },
    });
    return response.data;
  }

  async getNutritionPlan(language: string): Promise<{
    mealPlan: Array<{
      day: string;
      meals: Array<{
        mealType: string;
        name: string;
        description: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        ingredients: string[];
        instructions: string[];
      }>;
      dailyTotals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    }>;
    weeklyTotals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }> {
    const response = await this.api.get("/api/health-insights/nutrition-plan", {
      params: { language },
    });
    return response.data;
  }

  async clearHealthInsightsCache(language?: string): Promise<{
    message: string;
  }> {
    const response = await this.api.delete("/api/health-insights/clear-cache", {
      params: language ? { language } : undefined,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
