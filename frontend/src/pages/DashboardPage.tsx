import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";

import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ChefHat,
  Apple,
  ShoppingCart,
  Calendar,
  TrendingUp,
  Heart,
  LogOut,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const welcomeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Stats state
  const [stats, setStats] = useState({
    inventoryCount: 0,
    recipeCount: 0,
    mealPlanCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Generate trend indicators (mock data for demo)
  const getTrendData = () => {
    return {
      inventory: { value: 12, isUp: true },
      recipes: { value: 5, isUp: true },
      mealPlans: { value: 3, isUp: false },
    };
  };

  const trends = getTrendData();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "i":
            e.preventDefault();
            navigate("/inventory");
            toast.info("Opening Inventory...");
            break;
          case "r":
            e.preventDefault();
            navigate("/recipes");
            toast.info("Opening Recipes...");
            break;
          case "s":
            e.preventDefault();
            navigate("/shopping-list");
            toast.info("Opening Shopping List...");
            break;
          case "m":
            e.preventDefault();
            navigate("/meal-planning");
            toast.info("Opening Meal Planning...");
            break;
          case "p":
            e.preventDefault();
            navigate("/profile");
            toast.info("Opening Profile...");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const [inventory, recipesResponse, mealPlansResponse] =
          await Promise.all([
            apiService.getAllInventoryItems(),
            apiService.getRecipes(),
            apiService.getMealPlans(),
          ]);

        setStats({
          inventoryCount: inventory.length,
          recipeCount: recipesResponse.recipes.length,
          mealPlanCount: mealPlansResponse.mealPlans.length,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast.error("Failed to load dashboard stats");
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    if (welcomeRef.current) {
      gsap.fromTo(
        welcomeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
        }
      );
    }
  }, []);

  useEffect(() => {
    if (statsRef.current && !isLoadingStats) {
      const statCards = statsRef.current.querySelectorAll(".stat-card");
      gsap.fromTo(
        statCards,
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.15,
          ease: "back.out(1.3)",
          delay: 0.3,
        }
      );
    }
  }, [isLoadingStats]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const features = [
    {
      icon: Apple,
      title: "Smart Inventory",
      description: "Track ingredients and expiry dates with AI",
      color: "#4CAF50",
      bgColor: "bg-green-100",
    },
    {
      icon: ChefHat,
      title: "AI Recipe Generator",
      description: "Get personalized recipes based on what you have",
      color: "#FF7043",
      bgColor: "bg-orange-100",
    },
    {
      icon: ShoppingCart,
      title: "Grocery Planning",
      description: "Smart shopping lists with portion optimization",
      color: "#29B6F6",
      bgColor: "bg-blue-100",
    },
    {
      icon: Calendar,
      title: "Meal Planning",
      description: "Plan your weekly meals effortlessly",
      color: "#4CAF50",
      bgColor: "bg-green-100",
    },
    {
      icon: TrendingUp,
      title: "Nutrition Tracking",
      description: "Monitor calories and macros automatically",
      color: "#FF7043",
      bgColor: "bg-orange-100",
    },
    {
      icon: Heart,
      title: "Health Insights",
      description: "AI-powered nutrition coaching",
      color: "#29B6F6",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-10">
      {/* Header - Mobile only */}
      <header className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#4CAF50] rounded-xl flex items-center justify-center shadow-md">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl font-bold text-[#4A4A4A] dark:text-gray-100"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              NutriChef
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-[#4A4A4A] dark:text-gray-100">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white dark:border-red-400 dark:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("common.logout")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div ref={welcomeRef} className="text-center mb-12">
          <h2
            className="text-4xl font-bold mb-4 text-[#4A4A4A] dark:text-gray-100"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {getGreeting()},{" "}
            <span className="text-[#4CAF50] dark:text-green-400">
              {user?.name?.split(" ")[0]}
            </span>
            ! 👋
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your AI-powered nutrition assistant is ready to help you plan meals,
            manage inventory, and achieve your health goals.
          </p>
          {/* Keyboard shortcuts hint */}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            💡 Tip: Use{" "}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
              Ctrl+I
            </kbd>{" "}
            for Inventory,{" "}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
              Ctrl+R
            </kbd>{" "}
            for Recipes,{" "}
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
              Ctrl+S
            </kbd>{" "}
            for Shopping List
          </div>
        </div>

        {/* Features Grid */}
        <div
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="feature-card">
                <Card
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
                  onClick={() => {
                    if (feature.title === "Smart Inventory") {
                      navigate("/inventory");
                    } else if (feature.title === "AI Recipe Generator") {
                      navigate("/recipes");
                    } else if (feature.title === "Grocery Planning") {
                      navigate("/shopping-list");
                    } else if (feature.title === "Meal Planning") {
                      navigate("/meal-planning");
                    } else if (feature.title === "Nutrition Tracking") {
                      navigate("/nutrition");
                    }
                  }}
                >
                  <CardHeader>
                    <div
                      className={`w-14 h-14 rounded-xl ${feature.bgColor} dark:opacity-80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon
                        className="w-7 h-7"
                        style={{ color: feature.color }}
                      />
                    </div>
                    <CardTitle
                      className="text-[#4A4A4A] dark:text-gray-100 font-semibold"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div ref={statsRef}>
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle
                className="text-[#4A4A4A] dark:text-gray-100 text-2xl"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Getting Started
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Complete these steps to maximize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat-card p-6 bg-green-50 dark:bg-green-950/30 rounded-xl border-2 border-green-200 dark:border-green-800">
                  {isLoadingStats ? (
                    <Loader2 className="h-10 w-10 animate-spin text-[#4CAF50] dark:text-green-400 mb-2" />
                  ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                      <div
                        className="text-4xl font-bold text-[#4CAF50] dark:text-green-400"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {stats.inventoryCount}
                      </div>
                      <div
                        className={`flex items-center text-sm font-semibold ${
                          trends.inventory.isUp
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <TrendingUp
                          className={`w-4 h-4 mr-1 ${
                            trends.inventory.isUp ? "" : "rotate-180"
                          }`}
                        />
                        {trends.inventory.value}%
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                    {t("dashboard.totalItems")}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#4CAF50] dark:text-green-400 hover:text-[#45a049] font-semibold"
                    onClick={() => navigate("/inventory")}
                  >
                    Add ingredients →
                  </Button>
                </div>
                <div className="stat-card p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                  {isLoadingStats ? (
                    <Loader2 className="h-10 w-10 animate-spin text-[#FF7043] dark:text-orange-400 mb-2" />
                  ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                      <div
                        className="text-4xl font-bold text-[#FF7043] dark:text-orange-400"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {stats.recipeCount}
                      </div>
                      <div
                        className={`flex items-center text-sm font-semibold ${
                          trends.recipes.isUp
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <TrendingUp
                          className={`w-4 h-4 mr-1 ${
                            trends.recipes.isUp ? "" : "rotate-180"
                          }`}
                        />
                        {trends.recipes.value}%
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                    Saved Recipes
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#FF7043] dark:text-orange-400 hover:text-[#f4511e] font-semibold"
                    onClick={() => navigate("/my-recipes")}
                  >
                    Explore recipes →
                  </Button>
                </div>
                <div className="stat-card p-6 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                  {isLoadingStats ? (
                    <Loader2 className="h-10 w-10 animate-spin text-[#29B6F6] dark:text-blue-400 mb-2" />
                  ) : (
                    <div className="flex items-baseline gap-2 mb-2">
                      <div
                        className="text-4xl font-bold text-[#29B6F6] dark:text-blue-400"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        {stats.mealPlanCount}
                      </div>
                      <div
                        className={`flex items-center text-sm font-semibold ${
                          trends.mealPlans.isUp
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <TrendingUp
                          className={`w-4 h-4 mr-1 ${
                            trends.mealPlans.isUp ? "" : "rotate-180"
                          }`}
                        />
                        {trends.mealPlans.value}%
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                    Active Meal Plans
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[#29B6F6] dark:text-blue-400 hover:text-[#0288d1] font-semibold"
                    onClick={() => navigate("/meal-planning")}
                  >
                    Plan meals →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
