import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api";
import type {
  User,
  LoginCredentials,
  RegisterData,
  LoginResponse,
} from "../types";

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const { user } = await apiService.getProfile();
          setUser(user);
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Clear invalid tokens
        apiService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    credentials: LoginCredentials
  ): Promise<LoginResponse> => {
    const response = await apiService.login(credentials);
    setUser(response.user);
    return response;
  };

  const register = async (data: RegisterData): Promise<void> => {
    await apiService.register(data);
    // After registration, log them in
    await login({ email: data.email, password: data.password });
  };

  const logout = async (): Promise<void> => {
    await apiService.logout();
    setUser(null);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const { user } = await apiService.getProfile();
      setUser(user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
