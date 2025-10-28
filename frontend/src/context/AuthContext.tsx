import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api";
import { useAppDispatch, useAppSelector, store } from "../store";
import {
  setCredentials,
  logout as logoutAction,
  updateUser,
} from "../store/slices/authSlice";
import type {
  User,
  LoginCredentials,
  RegisterData,
  LoginResponse,
} from "../types";

// Initialize apiService with the store
apiService.setStore(store);

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        if (isAuthenticated && apiService.isAuthenticated()) {
          const { user } = await apiService.getProfile();
          dispatch(updateUser(user));
        }
      } catch (error: any) {
        console.error("Failed to fetch user profile:", error);

        // Only logout if it's an auth error (401/403), not a connection error
        const isConnectionError =
          error.code === "ERR_NETWORK" ||
          error.code === "ERR_CONNECTION_REFUSED" ||
          error.message?.includes("Network Error") ||
          !error.response;

        if (!isConnectionError) {
          // Clear invalid tokens only for actual auth errors
          await apiService.logout();
          dispatch(logoutAction());
        }
        // If it's a connection error, keep the user logged in with cached data
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [dispatch, isAuthenticated]);

  const login = async (
    credentials: LoginCredentials
  ): Promise<LoginResponse> => {
    const response = await apiService.login(credentials);
    dispatch(setCredentials({ user: response.user, tokens: response.tokens }));
    return response;
  };

  const register = async (data: RegisterData): Promise<void> => {
    await apiService.register(data);
    // After registration, log them in
    await login({ email: data.email, password: data.password });
  };

  const logout = async (): Promise<void> => {
    await apiService.logout();
    dispatch(logoutAction());
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const { user } = await apiService.getProfile();
      dispatch(updateUser(user));
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
