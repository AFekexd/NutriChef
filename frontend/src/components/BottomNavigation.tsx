import { useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, ChefHat, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();

  // Hide bottom nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50 transition-colors">
      <div className="flex items-center justify-around h-20">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive("/dashboard")
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">{t("nav.home")}</span>
        </button>

        <button
          onClick={() => navigate("/inventory")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive("/inventory")
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-xs font-medium">{t("nav.inventory")}</span>
        </button>

        <button
          onClick={() => navigate("/recipes")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
            isActive("/recipes")
              ? "text-green-600 dark:text-green-400"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <ChefHat className="w-6 h-6" />
          <span className="text-xs font-medium">{t("nav.recipes")}</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-medium">{t("common.logout")}</span>
        </button>
      </div>
    </nav>
  );
}
