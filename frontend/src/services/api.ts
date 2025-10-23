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
} from "../types";
import type { AppStore } from "../store";
import { updateTokens, logout } from "../store/slices/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest.headers?.["X-Retry"]
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
            this.clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
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

  async revokeSession(sessionId: string): Promise<void> {
    await this.api.delete(`/api/auth/sessions/${sessionId}`);
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
  async getRecipeRecommendations(data: {
    servings?: number;
    minMatchPercentage?: number;
    useInventory?: boolean;
    language?: string;
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
    isActive: boolean
  ): Promise<{ user: any; message: string }> {
    const response = await this.api.put(`/api/admin/users/${userId}/status`, {
      isActive,
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
}

export const apiService = new ApiService();
