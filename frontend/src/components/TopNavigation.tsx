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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import SettingsMenu from "./SettingsMenu";
import { TutorialButton } from "./Tutorial";

export function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useTranslation();

  // Hide top nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

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
            <div className="flex items-center gap-0.5 lg:gap-1">
              <button
                onClick={() => navigate("/dashboard")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/dashboard")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Home className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.dashboard")}
                </span>
              </button>

              <button
                onClick={() => navigate("/inventory")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/inventory")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Package className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.inventory")}
                </span>
              </button>

              <button
                onClick={() => navigate("/shopping-list")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/shopping-list")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.shoppingList")}
                </span>
              </button>

              <button
                onClick={() => navigate("/recipes")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/recipes")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <ChefHat className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.recipes")}
                </span>
              </button>

              <button
                onClick={() => navigate("/meal-planning")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/meal-planning")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Calendar className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.mealPlanning")}
                </span>
              </button>

              <button
                onClick={() => navigate("/nutrition")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/nutrition")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Utensils className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.nutrition")}
                </span>
              </button>

              <button
                onClick={() => navigate("/health-insights")}
                className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive("/health-insights")
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Activity className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium text-sm lg:text-base hidden xl:inline">
                  {t("nav.healthInsights")}
                </span>
              </button>

              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive("/admin")
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base hidden xl:inline">
                    {t("nav.admin")}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* User Info, Settings, and Logout - Right */}
          <div className="flex items-center gap-1 lg:gap-2 xl:gap-3 justify-end">
            <TutorialButton text="" />
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
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <User className="w-4 h-4 lg:w-5 lg:h-5" />
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
