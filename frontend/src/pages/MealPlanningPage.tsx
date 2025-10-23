import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Calendar,
  Plus,
  ChefHat,
  Trash2,
  TrendingUp,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { apiService } from "../services/api";
import type { MealPlan, Recipe } from "../types";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MealPlanningPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Start from Sunday
    return new Date(today.setDate(diff));
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>("");
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [weeklyStats, setWeeklyStats] = useState({
    totalCalories: 0,
    avgCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  });

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

  // Load meal plans and recipes
  useEffect(() => {
    fetchMealPlans();
    fetchRecipes();
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

  const calculateWeeklyStats = (plans: MealPlan[]) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    plans.forEach((plan) => {
      plan.mealPlanRecipes.forEach((mpr) => {
        totalCalories += mpr.recipe.calories;
        totalProtein += mpr.recipe.macros.protein;
        totalCarbs += mpr.recipe.macros.carbs;
        totalFat += mpr.recipe.macros.fat;
      });
    });

    setWeeklyStats({
      totalCalories,
      avgCalories: totalCalories / 7,
      totalProtein,
      totalCarbs,
      totalFat,
    });
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
    setShowAddMeal(true);
  };

  const handleSaveMeal = async () => {
    if (!selectedDate || !selectedMealType || !selectedRecipe) return;

    try {
      await apiService.createMealPlan({
        date: selectedDate.toISOString(),
        mealType: selectedMealType as any,
        recipeIds: [selectedRecipe],
      });

      await fetchMealPlans();
      setShowAddMeal(false);
    } catch (error) {
      console.error("Error creating meal plan:", error);
    }
  };

  // Delete meal
  const handleDeleteMeal = async (mealPlanId: string) => {
    if (!confirm("Are you sure you want to delete this meal plan?")) return;

    try {
      await apiService.deleteMealPlan(mealPlanId);
      await fetchMealPlans();
    } catch (error) {
      console.error("Error deleting meal plan:", error);
    }
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
    <div className="min-h-screen pb-20 md:pb-8 md:pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8" ref={containerRef}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Meal Planning
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Plan your weekly meals effortlessly
              </p>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousWeek}
              className="dark:border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={currentWeek}
              className="dark:border-gray-700"
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextWeek}
              className="dark:border-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekly Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Calories
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalCalories.toFixed(0)}
            </p>
          </Card>

          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Avg/Day
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.avgCalories.toFixed(0)}
            </p>
          </Card>

          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Protein
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalProtein.toFixed(0)}g
            </p>
          </Card>

          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Carbs</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalCarbs.toFixed(0)}g
            </p>
          </Card>

          <Card className="p-4 dark:bg-gray-900 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Fat</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {weeklyStats.totalFat.toFixed(0)}g
            </p>
          </Card>
        </div>

        {/* Calendar Grid */}
        <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b dark:border-gray-800">
                  <th className="p-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-32">
                    Meal
                  </th>
                  {weekDates.map((date, index) => (
                    <th
                      key={index}
                      className="p-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      <div>{DAYS_OF_WEEK[date.getDay()]}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody ref={calendarRef}>
                {MEAL_TYPES.map((mealType) => (
                  <tr
                    key={mealType}
                    className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {mealType}
                    </td>
                    {weekDates.map((date, dateIndex) => {
                      const meal = getMealsForSlot(date, mealType);
                      return (
                        <td key={dateIndex} className="p-2 align-top">
                          {meal ? (
                            <div className="space-y-2">
                              {meal.mealPlanRecipes.map((mpr) => (
                                <div
                                  key={mpr.mealPlanRecipeId}
                                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 group relative"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {mpr.recipe.title}
                                      </p>
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
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddMeal(date, mealType)}
                              className="w-full h-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group"
                            >
                              <Plus className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-green-600 dark:group-hover:text-green-500" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Meal Modal */}
        {showAddMeal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6 dark:bg-gray-900 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Add Meal
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedDate?.toLocaleDateString()} - {selectedMealType}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Recipe
                </label>
                {recipes.length === 0 ? (
                  <div className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                    No recipes available. Please add some recipes first.
                  </div>
                ) : (
                  <select
                    value={selectedRecipe}
                    onChange={(e) => setSelectedRecipe(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-gray-100"
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMeal(false)}
                  className="flex-1 dark:border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMeal}
                  disabled={!selectedRecipe}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Add Meal
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
