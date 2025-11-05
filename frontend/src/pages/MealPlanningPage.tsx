import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  ChefHat,
  Trash2,
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
  Apple,
  X,
  ShoppingCart,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ScrollToTop } from "../components/ScrollToTop";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { apiService } from "../services/api";
import { shoppingListService } from "../services/shoppingListService";
import { confirmDialog } from "../utils/confirmDialog";
import type { MealPlan, Recipe, InventoryItem } from "../types";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MealPlanningPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Start from Sunday
    return new Date(today.setDate(diff));
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [addMode, setAddMode] = useState<"recipe" | "ingredient">("recipe");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>("");
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<
    string[]
  >([]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalCalories: 0,
    avgCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  });
  const [dailyStats, setDailyStats] = useState<{
    [key: string]: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLTableSectionElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Get week dates
  const getWeekDates = (): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "arrowleft":
            e.preventDefault();
            previousWeek();
            toast.info("Previous week");
            break;
          case "arrowright":
            e.preventDefault();
            nextWeek();
            toast.info("Next week");
            break;
          case "t":
            e.preventDefault();
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day;
            setCurrentWeekStart(new Date(today.setDate(diff)));
            toast.info("Jumped to current week");
            break;
        }
      } else if (e.key === "Escape") {
        if (showAddMeal) setShowAddMeal(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showAddMeal]);

  // Load meal plans and recipes
  useEffect(() => {
    fetchMealPlans();
    fetchRecipes();
    fetchInventoryItems();
  }, [currentWeekStart]);

  const fetchMealPlans = async () => {
    try {
      setIsLoading(true);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { mealPlans: plans } = await apiService.getMealPlans(
        currentWeekStart.toISOString(),
        weekEnd.toISOString()
      );

      setMealPlans(plans);
      calculateWeeklyStats(plans);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await apiService.getRecipes();
      console.log("Recipes response:", response);
      const recipeList = response?.recipes || [];
      console.log("Recipe list:", recipeList);
      setRecipes(Array.isArray(recipeList) ? recipeList : []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      setRecipes([]);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const items = await apiService.getAllInventoryItems();
      setInventoryItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      setInventoryItems([]);
    }
  };

  const calculateWeeklyStats = (plans: MealPlan[]) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Initialize daily stats for the week
    const daily: {
      [key: string]: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    } = {};

    weekDates.forEach((date) => {
      const dateKey = date.toISOString().split("T")[0];
      daily[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    });

    plans.forEach((plan) => {
      const dateKey = plan.date.split("T")[0];

      // Calculate from recipes
      plan.mealPlanRecipes.forEach((mpr) => {
        const calories = mpr.recipe.calories;
        const protein = mpr.recipe.macros.protein;
        const carbs = mpr.recipe.macros.carbs;
        const fat = mpr.recipe.macros.fat;

        totalCalories += calories;
        totalProtein += protein;
        totalCarbs += carbs;
        totalFat += fat;

        if (daily[dateKey]) {
          daily[dateKey].calories += calories;
          daily[dateKey].protein += protein;
          daily[dateKey].carbs += carbs;
          daily[dateKey].fat += fat;
        }
      });

      // Calculate from inventory items
      plan.mealPlanInventoryItems?.forEach((mpi) => {
        const ingredient = mpi.inventoryItem.ingredient;
        const nutritionalInfo = ingredient.nutritionalInfo;

        // Calculate nutritional values based on quantity used
        // Assuming nutritionalInfo is per 100g or per unit
        const multiplier = mpi.quantityUsed;

        const calories = (nutritionalInfo.calories || 0) * multiplier;
        const protein = (nutritionalInfo.protein || 0) * multiplier;
        const carbs = (nutritionalInfo.carbs || 0) * multiplier;
        const fat = (nutritionalInfo.fat || 0) * multiplier;

        totalCalories += calories;
        totalProtein += protein;
        totalCarbs += carbs;
        totalFat += fat;

        if (daily[dateKey]) {
          daily[dateKey].calories += calories;
          daily[dateKey].protein += protein;
          daily[dateKey].carbs += carbs;
          daily[dateKey].fat += fat;
        }
      });
    });

    setWeeklyStats({
      totalCalories,
      avgCalories: totalCalories / 7,
      totalProtein,
      totalCarbs,
      totalFat,
    });

    setDailyStats(daily);
  };

  // Get meals for a specific date and meal type
  const getMealsForSlot = (date: Date, mealType: string): MealPlan | null => {
    const dateStr = date.toISOString().split("T")[0];
    return (
      mealPlans.find(
        (plan) => plan.date.startsWith(dateStr) && plan.mealType === mealType
      ) || null
    );
  };

  // Navigate weeks
  const previousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const currentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  // Add meal
  const handleAddMeal = (date: Date, mealType: string) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setSelectedRecipe("");
    setSelectedInventoryItems([]);
    setAddMode("recipe");
    setShowAddMeal(true);
  };

  const handleSaveMeal = async () => {
    if (!selectedDate || !selectedMealType) return;

    if (addMode === "recipe" && !selectedRecipe) return;
    if (addMode === "ingredient" && selectedInventoryItems.length === 0) return;

    try {
      // Check if a meal plan already exists for this date and meal type
      const existingMeal = getMealsForSlot(selectedDate, selectedMealType);

      if (existingMeal) {
        // Append to existing meal plan
        if (addMode === "recipe") {
          await apiService.addRecipeToMealPlan(
            existingMeal.mealPlanId,
            selectedRecipe
          );
        } else {
          // Add all selected inventory items
          for (const itemId of selectedInventoryItems) {
            await apiService.addInventoryItemToMealPlan(
              existingMeal.mealPlanId,
              itemId
            );
          }
        }
      } else {
        // Create new meal plan
        if (addMode === "recipe") {
          await apiService.createMealPlan({
            date: selectedDate.toISOString(),
            mealType: selectedMealType as any,
            recipeIds: [selectedRecipe],
          });
        } else {
          await apiService.createMealPlan({
            date: selectedDate.toISOString(),
            mealType: selectedMealType as any,
            inventoryItemIds: selectedInventoryItems,
          });
        }
      }

      await fetchMealPlans();
      setShowAddMeal(false);
      setSelectedRecipe("");
      setSelectedInventoryItems([]);
      toast.success("Meal added to plan successfully!");
    } catch (error) {
      console.error("Error creating meal plan:", error);
      toast.error("Failed to add meal to plan. Please try again.");
    }
  };

  // Delete meal
  const handleDeleteMeal = async (mealPlanId: string) => {
    confirmDialog({
      title: "Delete Meal Plan?",
      message:
        "Are you sure you want to delete this meal plan? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await apiService.deleteMealPlan(mealPlanId);
          await fetchMealPlans();
          toast.success("Meal plan deleted successfully");
        } catch (error) {
          console.error("Error deleting meal plan:", error);
          toast.error("Failed to delete meal plan");
        }
      },
    });
  };

  // Add week's meals to shopping list
  const handleAddWeekToShoppingList = () => {
    const itemsToAdd: Array<{
      name: string;
      quantity: number;
      unit: string;
      category: string;
      priority: "high" | "medium" | "low";
    }> = [];

    mealPlans.forEach((meal) => {
      // Add ingredients from inventory items
      meal.mealPlanInventoryItems?.forEach((mpi) => {
        itemsToAdd.push({
          name: mpi.inventoryItem.ingredient.name,
          quantity: mpi.quantityUsed,
          unit: mpi.inventoryItem.unit,
          category: mpi.inventoryItem.ingredient.category,
          priority: "medium",
        });
      });

      // For recipes, we don't have ingredient details in the meal plan
      // so we'll add a note that this is from a recipe
      meal.mealPlanRecipes.forEach((mpr) => {
        itemsToAdd.push({
          name: `${mpr.recipe.title} (Recipe)`,
          quantity: 1,
          unit: "recipe",
          category: "other",
          priority: "medium",
        });
      });
    });

    const addedCount = shoppingListService.addMultipleItems(itemsToAdd);
    toast.success(
      `Added ${addedCount} new items to shopping list!${
        itemsToAdd.length - addedCount > 0
          ? ` (${
              itemsToAdd.length - addedCount
            } items were already in the list)`
          : ""
      }`
    );
  };

  // Animations
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (calendarRef.current && !isLoading) {
      gsap.fromTo(
        calendarRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [mealPlans, isLoading]);

  useEffect(() => {
    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.children,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [weeklyStats]);

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20 bg-gray-50 dark:bg-gray-950">
      <div
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8"
        ref={containerRef}
      >
        <Breadcrumbs />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Meal Planning
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Plan your weekly meals effortlessly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Add to Shopping List Button */}
            <Button
              onClick={handleAddWeekToShoppingList}
              disabled={mealPlans.length === 0}
              className="bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-500 dark:to-green-500 text-white hover:from-blue-700 hover:to-green-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Shopping List
            </Button>

            {/* Week Navigation */}
            <div className="flex items-center gap-2 dark:text-gray-300">
              <Button
                variant="outline"
                size="sm"
                onClick={previousWeek}
                className="dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={currentWeek}
                className="dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/20"
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextWeek}
                className="dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8"
        >
          <Card className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Total Calories
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalCalories.toFixed(0)}
            </p>
          </Card>

          <Card className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Avg/Day
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.avgCalories.toFixed(0)}
            </p>
          </Card>

          <Card className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Protein
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalProtein.toFixed(0)}g
            </p>
          </Card>

          <Card className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Carbs
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalCarbs.toFixed(0)}g
            </p>
          </Card>

          <Card className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Fat
              </p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalFat.toFixed(0)}g
            </p>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="p-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-32">
                    Meal
                  </th>
                  {weekDates.map((date, index) => {
                    const dateKey = date.toISOString().split("T")[0];
                    const stats = dailyStats[dateKey] || {
                      calories: 0,
                      protein: 0,
                      carbs: 0,
                      fat: 0,
                    };
                    return (
                      <th
                        key={index}
                        className="p-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
                      >
                        <div>{DAYS_OF_WEEK[date.getDay()]}</div>
                        <div className="text-lg font-bold">
                          {date.getDate()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        {/* Daily Macros Summary */}
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs font-normal space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {stats.calories.toFixed(0)} cal
                              </span>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-[10px]">
                              <span className="text-red-600 dark:text-red-400">
                                P: {stats.protein.toFixed(0)}g
                              </span>
                              <span className="text-yellow-600 dark:text-yellow-400">
                                C: {stats.carbs.toFixed(0)}g
                              </span>
                              <span className="text-purple-600 dark:text-purple-400">
                                F: {stats.fat.toFixed(0)}g
                              </span>
                            </div>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody ref={calendarRef}>
                {MEAL_TYPES.map((mealType) => (
                  <tr
                    key={mealType}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {mealType}
                    </td>
                    {weekDates.map((date, dateIndex) => {
                      const meal = getMealsForSlot(date, mealType);
                      return (
                        <td key={dateIndex} className="p-2 align-top">
                          <div className="space-y-2">
                            {meal && (
                              <>
                                {meal.mealPlanRecipes.map((mpr) => (
                                  <div
                                    key={mpr.mealPlanRecipeId}
                                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 group relative"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                          <ChefHat className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                          <p
                                            className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                                            aria-label={mpr.recipe.title}
                                            title={mpr.recipe.title}
                                          >
                                            {mpr.recipe.title}
                                          </p>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {mpr.recipe.calories} cal
                                        </p>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleDeleteMeal(meal.mealPlanId)
                                        }
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {meal.mealPlanInventoryItems?.map((mpi) => (
                                  <div
                                    key={mpi.mealPlanInventoryItemId}
                                    className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 group relative"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                          <Apple className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {mpi.inventoryItem.ingredient.name}
                                          </p>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {mpi.quantityUsed}{" "}
                                          {mpi.inventoryItem.unit}
                                        </p>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleDeleteMeal(meal.mealPlanId)
                                        }
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            <button
                              onClick={() => handleAddMeal(date, mealType)}
                              className={`w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group ${
                                meal ? "h-10" : "h-16"
                              }`}
                              title="Add meal"
                            >
                              <Plus className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-green-500" />
                              {meal && (
                                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-500">
                                  Add more
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Meal Modal */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Add to Meal Plan
              </h3>
              <button
                onClick={() => setShowAddMeal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedDate?.toLocaleDateString()} - {selectedMealType}
            </p>

            {/* Mode Toggle */}
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => setAddMode("recipe")}
                variant={addMode === "recipe" ? "default" : "outline"}
                className={`flex-1 ${
                  addMode === "recipe"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Recipe
              </Button>
              <Button
                onClick={() => setAddMode("ingredient")}
                variant={addMode === "ingredient" ? "default" : "outline"}
                className={`flex-1 ${
                  addMode === "ingredient"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Apple className="w-4 h-4 mr-2" />
                Ingredients
              </Button>
            </div>

            {/* Recipe Mode */}
            {addMode === "recipe" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Recipe
                </label>
                {recipes.length === 0 ? (
                  <div className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                    No recipes available. Please add some recipes first.
                  </div>
                ) : (
                  <select
                    value={selectedRecipe}
                    onChange={(e) => setSelectedRecipe(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Choose a recipe...</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.recipeId} value={recipe.recipeId}>
                        {recipe.title} ({recipe.calories} cal)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Ingredient Mode */}
            {addMode === "ingredient" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Ingredients from Inventory
                </label>
                {inventoryItems.length === 0 ? (
                  <div className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                    No inventory items available. Please add items to your
                    inventory first.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                    {inventoryItems.map((item) => (
                      <label
                        key={item.inventoryItemId}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInventoryItems.includes(
                            item.inventoryItemId
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInventoryItems([
                                ...selectedInventoryItems,
                                item.inventoryItemId,
                              ]);
                            } else {
                              setSelectedInventoryItems(
                                selectedInventoryItems.filter(
                                  (id) => id !== item.inventoryItemId
                                )
                              );
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.ingredient.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.quantity} {item.unit} •{" "}
                            {item.location || "N/A"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedInventoryItems.length > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    {selectedInventoryItems.length} item(s) selected
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMeal(false);
                  setSelectedRecipe("");
                  setSelectedInventoryItems([]);
                }}
                className="flex-1 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMeal}
                disabled={
                  addMode === "recipe"
                    ? !selectedRecipe
                    : selectedInventoryItems.length === 0
                }
                className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addMode === "recipe" ? (
                  <>
                    <ChefHat className="w-4 h-4 mr-2" />
                    Add Recipe
                  </>
                ) : (
                  <>
                    <Apple className="w-4 h-4 mr-2" />
                    Add Ingredients
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
