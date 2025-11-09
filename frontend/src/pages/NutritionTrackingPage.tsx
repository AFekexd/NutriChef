import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Utensils,
  TrendingUp,
  Target,
  Calendar,
  Flame,
  Apple,
  Drumstick,
  Wheat,
  Droplet,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { formatDate } from "../utils/dateTime";
import { formatNumber, formatCalories } from "../utils/numbers";
import { Badge } from "../components/Badge";
import { apiService } from "../services/api";
import { MetricsCalculatorModal } from "../components/MetricsCalculatorModal";
import { LogMealModal } from "../components/LogMealModal";

interface NutritionGoals {
  dailyCalories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
}

interface DailyIntake {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meals: MealEntry[];
}

interface MealEntry {
  id: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  time: string;
}

interface MacroStats {
  consumed: number;
  goal: number;
  percentage: number;
  remaining: number;
}

export function NutritionTrackingPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [goals, setGoals] = useState<NutritionGoals>({
    dailyCalories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    fiber: 30,
  });
  const [dailyIntake, setDailyIntake] = useState<DailyIntake>({
    date: selectedDate,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    meals: [],
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [showLogMealModal, setShowLogMealModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIntake, setIsLoadingIntake] = useState(false);

  // Load data from API on mount
  useEffect(() => {
    loadGoalsFromAPI();
  }, []);

  useEffect(() => {
    loadDailyIntake(selectedDate);
  }, [selectedDate]);

  const loadGoalsFromAPI = async () => {
    setIsLoading(true);
    try {
      const { goals: apiGoals } = await apiService.getNutritionGoals();
      setGoals(apiGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      // Try to load from localStorage as fallback
      const saved = localStorage.getItem("nutrichef_nutrition_goals");
      if (saved) {
        try {
          setGoals(JSON.parse(saved));
          toast.info(t("nutrition.messages.goalsLoadedFromLocal"));
        } catch (parseError) {
          console.error("Error parsing localStorage goals:", parseError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyIntake = async (date: string) => {
    setIsLoadingIntake(true);
    try {
      const intake = await apiService.getDailyIntake(date);
      setDailyIntake({
        date: intake.date,
        calories: intake.calories,
        protein: intake.protein,
        carbs: intake.carbs,
        fat: intake.fat,
        fiber: intake.fiber,
        meals: intake.meals as MealEntry[],
      });
    } catch (error) {
      console.error("Error loading daily intake:", error);
      // Fallback to localStorage
      const key = `nutrichef_nutrition_${date}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setDailyIntake(JSON.parse(saved));
        } catch (parseError) {
          console.error("Error parsing localStorage intake:", parseError);
          setDailyIntake({
            date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            meals: [],
          });
        }
      } else {
        setDailyIntake({
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          meals: [],
        });
      }
    } finally {
      setIsLoadingIntake(false);
    }
  };

  const saveGoals = async (newGoals: NutritionGoals) => {
    try {
      await apiService.updateNutritionGoals(newGoals);
      setGoals(newGoals);
      setShowGoalModal(false);
      toast.success(t("nutrition.messages.goalsUpdated"));
      // Also save to localStorage as backup
      localStorage.setItem(
        "nutrichef_nutrition_goals",
        JSON.stringify(newGoals)
      );
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error(t("nutrition.messages.goalsUpdateFailed"));
    }
  };

  const handleCalculatorSave = async (calculatedGoals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => {
    await saveGoals(calculatedGoals);
    setShowCalculatorModal(false);
  };

  const calculateMacroStats = (consumed: number, goal: number): MacroStats => {
    return {
      consumed,
      goal,
      percentage: Math.round((consumed / goal) * 100),
      remaining: Math.max(0, goal - consumed),
    };
  };

  const calorieStats = calculateMacroStats(
    dailyIntake.calories,
    goals.dailyCalories
  );
  const proteinStats = calculateMacroStats(dailyIntake.protein, goals.protein);
  const carbsStats = calculateMacroStats(dailyIntake.carbs, goals.carbs);
  const fatStats = calculateMacroStats(dailyIntake.fat, goals.fat);
  const fiberStats = calculateMacroStats(dailyIntake.fiber, goals.fiber);

  const addQuickMeal = async () => {
    // Open the log meal modal
    setShowLogMealModal(true);
  };

  const handleLogMeal = async (mealData: {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5);

    try {
      const { meal } = await apiService.logMeal({
        date: `${selectedDate}T${time}:00Z`,
        mealType: mealData.mealType,
        name: mealData.name,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        fiber: mealData.fiber,
      });

      // Update local state immediately for better UX
      const newMealEntry: MealEntry = {
        id: meal.id,
        mealType: mealData.mealType,
        name: mealData.name,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        fiber: mealData.fiber,
        time: time,
      };

      const newIntake = {
        ...dailyIntake,
        calories: dailyIntake.calories + mealData.calories,
        protein: dailyIntake.protein + mealData.protein,
        carbs: dailyIntake.carbs + mealData.carbs,
        fat: dailyIntake.fat + mealData.fat,
        fiber: dailyIntake.fiber + mealData.fiber,
        meals: [...dailyIntake.meals, newMealEntry],
      };

      setDailyIntake(newIntake);
      setShowLogMealModal(false);
      toast.success(t("nutrition.messages.mealLogged"));
    } catch (error) {
      console.error("Error logging meal:", error);
      toast.error(t("nutrition.messages.mealLogFailed"));
    }
  };

  const deleteMeal = async (mealId: string) => {
    const meal = dailyIntake.meals.find((m) => m.id === mealId);
    if (!meal) return;

    try {
      await apiService.deleteMeal(mealId);

      // Update local state immediately
      const newIntake = {
        ...dailyIntake,
        calories: dailyIntake.calories - meal.calories,
        protein: dailyIntake.protein - meal.protein,
        carbs: dailyIntake.carbs - meal.carbs,
        fat: dailyIntake.fat - meal.fat,
        fiber: dailyIntake.fiber - meal.fiber,
        meals: dailyIntake.meals.filter((m) => m.id !== mealId),
      };

      setDailyIntake(newIntake);
      toast.success(t("nutrition.messages.mealDeleted"));
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error(t("nutrition.messages.mealDeleteFailed"));
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      case "snack":
        return "🍎";
      default:
        return "🍽️";
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getProgressVariant = (
    percentage: number
  ): "success" | "warning" | "info" => {
    if (percentage >= 100) return "success";
    if (percentage >= 75) return "warning";
    return "info";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-8 pt-0 md:pt-20 transition-colors w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <Breadcrumbs />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t("nutrition.title")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {t("nutrition.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowCalculatorModal(true)}
              className="px-3 py-2 sm:px-4 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover-lift flex items-center gap-2"
            >
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {t("nutrition.actions.calculateGoals")}
              </span>
              <span className="sm:hidden">
                {t("nutrition.actions.calculate")}
              </span>
            </button>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-3 py-2 sm:px-4 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors hover-lift flex items-center gap-2"
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                {t("nutrition.actions.setGoals")}
              </span>
              <span className="sm:hidden">{t("nutrition.actions.goals")}</span>
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6 flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(new Date(selectedDate), "long")}
          </span>
        </div>

        {/* Loading State */}
        {(isLoading || isLoadingIntake) && (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        {!isLoading && !isLoadingIntake && (
          <>
            {/* Calorie Overview Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8" />
                  <div>
                    <h2 className="text-lg font-semibold">
                      {t("nutrition.macros.dailyCalories")}
                    </h2>
                    <p className="text-sm opacity-90">
                      {calorieStats.remaining > 0
                        ? t("nutrition.macros.remaining", {
                            count: calorieStats.remaining,
                          })
                        : t("nutrition.macros.goalReached")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {formatNumber(dailyIntake.calories)}
                  </div>
                  <div className="text-sm opacity-90">
                    {t("nutrition.macros.of")}{" "}
                    {formatNumber(goals.dailyCalories)}
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, calorieStats.percentage)}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-right text-sm opacity-90">
                {t("nutrition.macros.percentOfGoal", {
                  percent: calorieStats.percentage,
                })}
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              {/* Protein */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Drumstick className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("nutrition.macros.protein")}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(dailyIntake.protein)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t("nutrition.macros.goal")}: {goals.protein}g
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      proteinStats.percentage
                    )}`}
                    style={{
                      width: `${Math.min(100, proteinStats.percentage)}%`,
                    }}
                  />
                </div>
                <Badge
                  variant={getProgressVariant(proteinStats.percentage)}
                  size="sm"
                  className="mt-2"
                >
                  {proteinStats.percentage}%
                </Badge>
              </div>

              {/* Carbs */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wheat className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("nutrition.macros.carbs")}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(dailyIntake.carbs)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t("nutrition.macros.goal")}: {goals.carbs}g
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      carbsStats.percentage
                    )}`}
                    style={{
                      width: `${Math.min(100, carbsStats.percentage)}%`,
                    }}
                  />
                </div>
                <Badge
                  variant={getProgressVariant(carbsStats.percentage)}
                  size="sm"
                  className="mt-2"
                >
                  {carbsStats.percentage}%
                </Badge>
              </div>

              {/* Fat */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("nutrition.macros.fat")}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(dailyIntake.fat)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t("nutrition.macros.goal")}: {goals.fat}g
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      fatStats.percentage
                    )}`}
                    style={{ width: `${Math.min(100, fatStats.percentage)}%` }}
                  />
                </div>
                <Badge
                  variant={getProgressVariant(fatStats.percentage)}
                  size="sm"
                  className="mt-2"
                >
                  {fatStats.percentage}%
                </Badge>
              </div>

              {/* Fiber */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {t("nutrition.macros.fiber")}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(dailyIntake.fiber)}g
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {t("nutrition.macros.goal")}: {goals.fiber}g
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      fiberStats.percentage
                    )}`}
                    style={{
                      width: `${Math.min(100, fiberStats.percentage)}%`,
                    }}
                  />
                </div>
                <Badge
                  variant={getProgressVariant(fiberStats.percentage)}
                  size="sm"
                  className="mt-2"
                >
                  {fiberStats.percentage}%
                </Badge>
              </div>
            </div>

            {/* Meals List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t("nutrition.meals.title")}
                </h3>
                <button
                  onClick={addQuickMeal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm hover-lift"
                >
                  {t("nutrition.meals.logMeal")}
                </button>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {dailyIntake.meals.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t("nutrition.meals.noMealsLogged")}</p>
                    <p className="text-sm mt-1">
                      {t("nutrition.meals.logMealPrompt")}
                    </p>
                  </div>
                ) : (
                  dailyIntake.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl">
                            {getMealIcon(meal.mealType)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {meal.name}
                              </h4>
                              <Badge variant="default" size="sm">
                                {t(`nutrition.mealTypes.${meal.mealType}`)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              {meal.time} • {formatCalories(meal.calories)}
                            </p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Drumstick className="w-3 h-3 text-red-500" />
                                {meal.protein}g {t("nutrition.macros.protein")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wheat className="w-3 h-3 text-yellow-500" />
                                {meal.carbs}g {t("nutrition.macros.carbs")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Droplet className="w-3 h-3 text-blue-500" />
                                {meal.fat}g {t("nutrition.macros.fat")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Apple className="w-3 h-3 text-green-500" />
                                {meal.fiber}g {t("nutrition.macros.fiber")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          {t("nutrition.meals.remove")}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weekly Summary - Coming Soon */}
            <div className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6" />
                <h3 className="text-lg font-semibold">
                  {t("nutrition.weeklyInsights.title")}
                </h3>
              </div>
              <p className="text-sm opacity-90">
                {t("nutrition.weeklyInsights.description")}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("nutrition.goals.setGoals")}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("nutrition.macros.dailyCalories")}
                </label>
                <input
                  type="number"
                  value={goals.dailyCalories}
                  onChange={(e) =>
                    setGoals({
                      ...goals,
                      dailyCalories: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("nutrition.macros.protein")} (g)
                </label>
                <input
                  type="number"
                  value={goals.protein}
                  onChange={(e) =>
                    setGoals({ ...goals, protein: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("nutrition.macros.carbs")} (g)
                </label>
                <input
                  type="number"
                  value={goals.carbs}
                  onChange={(e) =>
                    setGoals({ ...goals, carbs: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("nutrition.macros.fat")} (g)
                </label>
                <input
                  type="number"
                  value={goals.fat}
                  onChange={(e) =>
                    setGoals({ ...goals, fat: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("nutrition.macros.fiber")} (g)
                </label>
                <input
                  type="number"
                  value={goals.fiber}
                  onChange={(e) =>
                    setGoals({ ...goals, fiber: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("nutrition.goals.cancel")}
              </button>
              <button
                onClick={() => saveGoals(goals)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors hover-lift"
              >
                {t("nutrition.goals.saveGoals")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Calculator Modal */}
      <MetricsCalculatorModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        onSave={handleCalculatorSave}
      />

      {/* Log Meal Modal */}
      <LogMealModal
        isOpen={showLogMealModal}
        onClose={() => setShowLogMealModal(false)}
        onSave={handleLogMeal}
      />
    </div>
  );
}
