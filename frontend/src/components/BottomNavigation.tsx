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
  User,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import { useAuth } from "../context/AuthContext";

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
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
                  <User className="w-5 h-5" />
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
            onClick={() => navigate("/recipes")}
            data-tutorial="nav-recipes"
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
            onClick={() => navigate("/meal-planning")}
            data-tutorial="nav-meal-planning"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive("/meal-planning")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.mealPlanning")}</span>
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
            onClick={() => navigate("/inventory")}
            data-tutorial="nav-inventory"
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive("/inventory")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <Package className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.inventory")}</span>
          </button>

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            data-tutorial="nav-more"
            className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              showMoreMenu ||
              isActive("/dashboard") ||
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
              {(isActive("/dashboard") ||
                isActive("/nutrition") ||
                isActive("/health-insights") ||
                isActive("/profile") ||
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
