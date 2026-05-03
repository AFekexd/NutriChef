import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ChefHat,
  Calendar,
  ScanLine,
  X,
  Package,
  Menu,
  Utensils,
  Activity,
  Shield,
  ShoppingCart,
  Store,
  Salad,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";
import { UserAvatar } from "./UserAvatar";

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);
  const xIconRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleActionClick = (action: "scan" | "home") => {
    setShowActions(false);
    if (action === "scan") {
      navigate("/inventory");
    } else {
      navigate("/dashboard");
    }
  };

  // Animate icon transitions
  useEffect(() => {
    if (showActions) {
      // Animate logo out and X in
      if (logoRef.current && xIconRef.current && buttonRef.current) {
        gsap.to(logoRef.current, {
          scale: 0,
          rotation: -180,
          opacity: 0,
          duration: 0.3,
          ease: "back.in(1.7)",
        });
        gsap.fromTo(
          xIconRef.current,
          {
            scale: 0,
            rotation: 180,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.7)",
            delay: 0.15,
          }
        );
        gsap.to(buttonRef.current, {
          rotation: 180,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    } else {
      // Animate X out and logo in
      if (logoRef.current && xIconRef.current && buttonRef.current) {
        gsap.to(xIconRef.current, {
          scale: 0,
          rotation: 180,
          opacity: 0,
          duration: 0.3,
          ease: "back.in(1.7)",
        });
        gsap.fromTo(
          logoRef.current,
          {
            scale: 0,
            rotation: -180,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.3,
            ease: "back.out(1.7)",
            delay: 0.15,
          }
        );
        gsap.to(buttonRef.current, {
          rotation: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  }, [showActions]);

  // Hide bottom nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <>
      {/* More Menu Overlay */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div className="absolute bottom-24 left-0 right-0 mx-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
              {/* Main Pages */}
              <div className="p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">
                  {t("nav.pages")}
                </div>
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/dashboard")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">{t("nav.dashboard")}</span>
                </button>
              </div>

              {/* Inventory Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">
                  Inventory
                </div>
                <button
                  onClick={() => {
                    navigate("/inventory");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/inventory")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">{t("nav.inventory")}</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/shopping-list");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/shopping-list")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-medium">{t("nav.shoppingList")}</span>
                </button>
              </div>

              {/* Food Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">
                  {t("nav.foodAndMeals")}
                </div>
                <button
                  onClick={() => {
                    navigate("/recipes");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/recipes")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ChefHat className="w-5 h-5" />
                  <span className="font-medium">{t("nav.allRecipes")}</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/my-recipes");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/my-recipes")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <ChefHat className="w-5 h-5" />
                  <span className="font-medium">{t("nav.myRecipes")}</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/recipe-recommendation");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/recipe-recommendation")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Salad className="w-5 h-5" />
                  <span className="font-medium">
                    {t("nav.recipeRecommendations")}
                  </span>
                </button>
                <button
                  onClick={() => {
                    navigate("/meal-planning");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/meal-planning")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{t("nav.mealPlanning")}</span>
                </button>
              </div>

              {/* Health Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">
                  {t("nav.health")}
                </div>
                <button
                  onClick={() => {
                    navigate("/nutrition");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/nutrition")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                  <span className="font-medium">{t("nav.nutrition")}</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/health-insights");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/health-insights")
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">{t("nav.healthInsights")}</span>
                </button>
              </div>

              {/* Account Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">
                  {t("nav.account")}
                </div>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setShowMoreMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive("/profile")
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <UserAvatar
                    name={user?.name}
                    avatar={user?.oauthAvatar}
                    className="w-6 h-6 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    iconClassName="w-4 h-4"
                  />
                  <span className="font-medium">{t("nav.profile")}</span>
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive("/admin")
                        ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">{t("nav.admin")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu Overlay */}
      {showActions && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowActions(false)}
        >
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-3">
            <button
              onClick={() => handleActionClick("scan")}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Scan Item
              </span>
            </button>
            <button
              onClick={() => handleActionClick("home")}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Home className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Home
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-50 transition-colors">
        <div className="relative flex items-center justify-around h-20">
          {/* Left Side - 2 buttons */}
          <button
            onClick={() => navigate("/dashboard")}
            data-tutorial="nav-dashboard"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive("/dashboard")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.dashboard")}</span>
          </button>

          <button
            onClick={() => navigate("/inventory")}
            data-tutorial="nav-inventory"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive("/inventory") || isActive("/shopping-list")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Store className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.inventory")}</span>
          </button>

          {/* Center Action Button */}
          <div className="relative flex items-center justify-center w-20 h-full">
            <button
              ref={buttonRef}
              data-tutorial="nav-center-action"
              onClick={() => setShowActions(!showActions)}
              className="absolute -top-6 w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow hover:scale-110 border-4 border-white dark:border-gray-900"
            >
              <img
                ref={logoRef}
                src="/nutrichef-128.png"
                alt="NutriChef"
                className="w-12 h-12 absolute"
                style={{ opacity: showActions ? 0 : 1 }}
              />
              <X
                ref={xIconRef}
                className="w-7 h-7 text-white absolute"
                style={{ opacity: showActions ? 1 : 0 }}
              />
            </button>
          </div>

          {/* Right Side - 2 buttons */}
          <button
            onClick={() => navigate("/recipes")}
            data-tutorial="nav-food"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive("/recipes") ||
              isActive("/my-recipes") ||
              isActive("/recipe-recommendation") ||
              isActive("/meal-planning")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Salad className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.foodAndMeals")}</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            data-tutorial="nav-more"
            className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              showMoreMenu ||
              isActive("/nutrition") ||
              isActive("/health-insights") ||
              isActive("/profile") ||
              isActive("/admin")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <div className="relative">
              <Menu className="w-6 h-6" />
              {(isActive("/nutrition") ||
                isActive("/health-insights") ||
                isActive("/profile") ||
                isActive("/shopping-list") ||
                isActive("/admin")) && (
                <span className="absolute -top-1 -right-1 bg-green-500 dark:bg-green-400 rounded-full w-2 h-2"></span>
              )}
            </div>
            <span className="text-xs font-medium">{t("nav.more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
