import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  ChefHat,
  Calendar,
  ScanLine,
  X,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showActions, setShowActions] = useState(false);
  const logoRef = useRef<HTMLImageElement>(null);
  const xIconRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hide bottom nav on login/register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

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

  return (
    <>
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
            onClick={() => navigate("/shopping-list")}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive("/shopping-list")
                ? "text-green-600 dark:text-green-400"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.shoppingList")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
