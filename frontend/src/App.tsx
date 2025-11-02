import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { OfflineBanner } from "./components/OfflineBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNavigation } from "./components/BottomNavigation";
import { TopNavigation } from "./components/TopNavigation";
import type { ReactNode } from "react";

// Lazy load pages for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
const RecipeRecommendationPage = lazy(() =>
  import("./pages/RecipeRecommendationPage").then((m) => ({
    default: m.RecipeRecommendationPage,
  }))
);
const MyRecipesPage = lazy(() =>
  import("./pages/MyRecipesPage").then((m) => ({ default: m.MyRecipesPage }))
);
const ShoppingListPage = lazy(() =>
  import("./pages/ShoppingListPage").then((m) => ({
    default: m.ShoppingListPage,
  }))
);
const MealPlanningPage = lazy(() =>
  import("./pages/MealPlanningPage").then((m) => ({
    default: m.MealPlanningPage,
  }))
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);
const AdminPage = lazy(() =>
  import("./pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);
const NutritionTrackingPage = lazy(() =>
  import("./pages/NutritionTrackingPage").then((m) => ({
    default: m.NutritionTrackingPage,
  }))
);
const HealthInsightsPage = lazy(() =>
  import("./pages/HealthInsightsPage").then((m) => ({
    default: m.HealthInsightsPage,
  }))
);

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute>
              <RecipeRecommendationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-recipes"
          element={
            <ProtectedRoute>
              <MyRecipesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shopping-list"
          element={
            <ProtectedRoute>
              <ShoppingListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meal-planning"
          element={
            <ProtectedRoute>
              <MealPlanningPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nutrition"
          element={
            <ProtectedRoute>
              <NutritionTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-insights"
          element={
            <ProtectedRoute>
              <HealthInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors ">
              <OfflineBanner />
              <TopNavigation />
              <AppRoutes />
              <BottomNavigation />
              <Toaster position="top-right" />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
