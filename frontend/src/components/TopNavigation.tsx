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
                    Inventory
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
                  <span className="font-medium text-sm lg:text-base">Food</span>
                  <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    onClick={() => navigate("/recipes")}
                    className="cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    All Recipes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/my-recipes")}
                    className="cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    My Recipes
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/recipe-recommendation")}
                    className="cursor-pointer"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Recommendations
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
                    Health
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
