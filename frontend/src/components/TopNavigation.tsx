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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import SettingsMenu from "./SettingsMenu";

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
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-3 mr-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 dark:from-green-200 to-blue-500 dark:to-blue-300 rounded-lg flex items-center justify-center shadow-md">
              {/* <ChefHat className="w-6 h-6 text-white" /> */}
              <img src="/nutrichef-512.png" alt="Logo" className="rounded-lg" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 dark:from-green-200 to-blue-500 dark:to-blue-300 bg-clip-text text-transparent">
              NutriChef
            </h1>
          </div>

          <div className="flex items-center gap-1 flex-1 justify-center">
            <button
              onClick={() => navigate("/dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/dashboard")
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">{t("nav.dashboard")}</span>
            </button>

            <button
              onClick={() => navigate("/inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/inventory")
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">{t("nav.inventory")}</span>
            </button>

            <button
              onClick={() => navigate("/shopping-list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/shopping-list")
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">{t("nav.shoppingList")}</span>
            </button>

            <button
              onClick={() => navigate("/recipes")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/recipes")
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <ChefHat className="w-5 h-5" />
              <span className="font-medium">{t("nav.recipes")}</span>
            </button>

            <button
              onClick={() => navigate("/meal-planning")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive("/meal-planning")
                  ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">{t("nav.mealPlanning")}</span>
            </button>

            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive("/admin")
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </button>
            )}
          </div>

          {/* User Info, Settings, and Logout - Right Side */}
          <div className="flex items-center gap-4 ml-auto">
            <SettingsMenu />
            <div className="text-right flex items-center gap-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {user?.name}
              </p>{" "}
              <button
                onClick={() => navigate("/profile")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive("/profile")
                    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <User className="w-5 h-5" />
              </button>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("common.logout")}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
