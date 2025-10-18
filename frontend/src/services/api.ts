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
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class ApiService {
  private api: AxiosInstance;
  private refreshTokenPromise: Promise<AuthTokens> | null = null;

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

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private getRefreshTokenValue(): string | null {
    return localStorage.getItem("refreshToken");
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
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
    this.setTokens(response.data.tokens);
    localStorage.setItem("user", JSON.stringify(response.data.user));
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
    localStorage.setItem("user", JSON.stringify(response.data.user));
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

  // Helper to get current user from localStorage
  getCurrentUser(): User | null {
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
  async uploadInventoryImage(file: File): Promise<DetectionResult> {
    const formData = new FormData();
    formData.append("image", file);

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
}

export const apiService = new ApiService();
