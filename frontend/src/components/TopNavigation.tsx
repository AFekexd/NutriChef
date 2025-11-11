import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LogOut,
  ChefHat,
  User,
  Shield,
  Calendar,
  Package,
  ShoppingCart,
  Utensils,
  Activity,
  ChevronDown,
  Store,
  Salad,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import SettingsMenu from "./SettingsMenu";
import { TutorialButton } from "./Tutorial";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useEffect, useState, useCallback, useRef } from "react";
import { apiService } from "../services/api";
import type { AIRateLimitStatus } from "../types";

export function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();
  const [rateLimitStatus, setRateLimitStatus] =
    useState<AIRateLimitStatus | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const isMountedRef = useRef(true);

  // Fetch AI rate limit status with debouncing (prevent rapid successive calls)
  const fetchRateLimitStatus = useCallback(
    async (force = false) => {
      // Skip if user is not authenticated or component is unmounted
      if (!user || !isMountedRef.current) {
        console.log(
          "Skipping rate limit fetch (not authenticated or unmounted)"
        );
        return;
      }

      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTime;

      // Debounce: don't fetch if called within last 3 seconds (unless forced)
      if (!force && timeSinceLastFetch < 3000) {
        console.log("Skipping rate limit fetch (debounced)");
        return;
      }

      try {
        setLastFetchTime(now);
        const status = await apiService.getAIRateLimitStatus();
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setRateLimitStatus(status);
          console.log("Rate limit status fetched:", status);
        }
      } catch (error) {
        // Silently fail - this is just a nice-to-have indicator
        console.error("Failed to fetch AI rate limit status:", error);
      }
    },
    [lastFetchTime, user]
  );

  // Fetch on mount and periodically
  useEffect(() => {
    // Don't run on login/register pages
    if (location.pathname === "/login" || location.pathname === "/register") {
      return;
    }

    isMountedRef.current = true;
    fetchRateLimitStatus(true); // Force on mount

    // Refresh every 5 minutes
    const interval = setInterval(
      () => fetchRateLimitStatus(true),
      5 * 60 * 1000
    );
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchRateLimitStatus, location.pathname]);

  // Listen for AI preferences changes (only from profile page)
  useEffect(() => {
    // Don't run on login/register pages
    if (location.pathname === "/login" || location.pathname === "/register") {
      return;
    }

    const handlePreferencesChanged = () => {
      console.log("AI preferences changed, refreshing rate limits...");
      fetchRateLimitStatus(true); // Force refresh on preference change
    };

    window.addEventListener("aiPreferencesChanged", handlePreferencesChanged);
    return () => {
      window.removeEventListener(
        "aiPreferencesChanged",
        handlePreferencesChanged
      );
    };
  }, [fetchRateLimitStatus, location.pathname]);

  // Hide top nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    try {
      // Mark component as unmounting to prevent state updates
      isMountedRef.current = false;
      await logout();
      // Use replace to avoid back button issues
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to login even if logout fails
      navigate("/login", { replace: true });
    }
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    console.log("Rate Limit Status:", rateLimitStatus);
    console.log("Using Own API Key:", rateLimitStatus?.usingOwnApiKey);
    console.log("Overall Rate Limit:", rateLimitStatus?.overall);
  }, [rateLimitStatus]);
  return (
    <nav className="hidden md:block w-full fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50 transition-colors">
      <div className="max-w-full px-2 lg:px-4 xl:px-6">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 gap-2 lg:gap-4">
          {/* Logo - Left */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-green-400 dark:from-green-200 to-blue-500 dark:to-blue-300 rounded-lg flex items-center justify-center shadow-md">
              {/* <ChefHat className="w-6 h-6 text-white" /> */}
              <img src="/nutrichef-512.png" alt="Logo" className="rounded-lg" />
            </div>
            <h1 className="text-base lg:text-xl font-bold bg-gradient-to-r from-green-400 dark:from-green-200 to-blue-500 dark:to-blue-300 bg-clip-text text-transparent hidden lg:block whitespace-nowrap">
              NutriChef
            </h1>
          </div>

          {/* Center Navigation */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1 lg:gap-2">
              {/* Dashboard */}
              <button
                onClick={() => navigate("/dashboard")}
                className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/dashboard")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Home className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base">
                  {t("nav.dashboard")}
                </span>
              </button>

              {/* Inventory & Shopping */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive("/inventory") || isActive("/shopping-list")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Store className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base">
                    {t("nav.inventory")}
                  </span>
                  <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => navigate("/inventory")}
                    className="cursor-pointer"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {t("nav.inventory")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/shopping-list")}
                    className="cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t("nav.shoppingList")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Food & Meals */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive("/recipes") ||
                    isActive("/my-recipes") ||
                    isActive("/recipe-recommendation") ||
                    isActive("/meal-planning")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Salad className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base">
                    {t("nav.foodAndMeals")}
                  </span>
                  <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    onClick={() => navigate("/recipes")}
                    className="cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    {t("nav.allRecipes")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/my-recipes")}
                    className="cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    {t("nav.myRecipes")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/recipe-recommendation")}
                    className="cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    {t("nav.recipeRecommendations")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/meal-planning")}
                    className="cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {t("nav.mealPlanning")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Health */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive("/nutrition") || isActive("/health-insights")
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Activity className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base">
                    {t("nav.health")}
                  </span>
                  <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => navigate("/nutrition")}
                    className="cursor-pointer"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    {t("nav.nutrition")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/health-insights")}
                    className="cursor-pointer"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {t("nav.healthInsights")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Admin */}
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive("/admin")
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base">
                    {t("nav.admin")}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* User Info, Settings, and Logout - Right */}
          <div className="flex items-center gap-1 lg:gap-2 xl:gap-3 justify-end">
            <TutorialButton text="" />

            {/* AI Rate Limit Indicator */}
            {rateLimitStatus &&
              !rateLimitStatus.usingOwnApiKey &&
              rateLimitStatus.overall && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`flex items-center gap-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-all border ${
                      rateLimitStatus.overall.percentage >= 90
                        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                        : rateLimitStatus.overall.percentage >= 70
                        ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                        : "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                    }`}
                    title={t("aiRateLimit.clickToViewDetails")}
                  >
                    <Zap className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs lg:text-sm font-medium hidden lg:inline">
                      {rateLimitStatus.overall.percentage}%
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 p-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {t("aiRateLimit.title")}
                      </h3>

                      {/* Overall Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {t("aiRateLimit.used", {
                              used: rateLimitStatus.overall.used,
                              limit: rateLimitStatus.overall.limit,
                            })}
                          </span>
                          <span className="font-medium">
                            {rateLimitStatus.overall.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-full ${
                              rateLimitStatus.overall.percentage >= 90
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : rateLimitStatus.overall.percentage >= 70
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-green-500 to-green-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                rateLimitStatus.overall.percentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Individual Services */}
                      {rateLimitStatus.rateLimits && (
                        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {/* Health Insights */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("aiRateLimit.healthInsights")}
                            </span>
                            <span className="font-medium">
                              {rateLimitStatus.rateLimits.healthInsights.used}/
                              {rateLimitStatus.rateLimits.healthInsights.limit}
                            </span>
                          </div>

                          {/* Recipe Recommendations */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("aiRateLimit.recipeRecommendations")}
                            </span>
                            <span className="font-medium">
                              {
                                rateLimitStatus.rateLimits.recipeRecommendations
                                  .used
                              }
                              /
                              {
                                rateLimitStatus.rateLimits.recipeRecommendations
                                  .limit
                              }
                            </span>
                          </div>

                          {/* Inventory AI */}
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t("aiRateLimit.inventoryAI")}
                            </span>
                            <span className="font-medium">
                              {rateLimitStatus.rateLimits.inventoryAI.used}/
                              {rateLimitStatus.rateLimits.inventoryAI.limit}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Configure Own Key CTA */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => navigate("/profile")}
                          className="w-full text-xs text-blue-600 dark:text-blue-400 hover:underline text-center"
                        >
                          {t("aiRateLimit.configureOwnKey")}
                        </button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

            <SettingsMenu />
            <button
              onClick={() => navigate("/profile")}
              className={`flex items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                isActive("/profile")
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={user?.name}
            >
              {user?.oauthAvatar ? (
                <img
                  src={
                    user.oauthAvatar.startsWith("http")
                      ? user.oauthAvatar
                      : `${
                          import.meta.env.VITE_API_BASE_URL ||
                          "http://localhost:5000"
                        }${user.oauthAvatar}`
                  }
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
                />
              ) : (
                <User className="w-5 h-5 flex-shrink-0" />
              )}
            </button>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800 px-2 lg:px-3"
            >
              <LogOut className="w-4 h-4" />
              <span className="ml-1 lg:ml-2 hidden lg:inline text-sm">
                {t("common.logout")}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
