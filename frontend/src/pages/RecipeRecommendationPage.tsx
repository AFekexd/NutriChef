import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import {
  ChefHat,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Users,
  Clock,
  Flame,
  ShoppingCart,
  Check,
  Percent,
  Filter,
  Sparkles,
  Utensils,
  TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { apiService } from "../services/api";
import type { RecipeRecommendation } from "../types";

interface ManualIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

export function RecipeRecommendationPage() {
  const { t, i18n } = useTranslation();
  const [servings, setServings] = useState(2);
  const [minMatchPercentage, setMinMatchPercentage] = useState(60);
  const [useInventory, setUseInventory] = useState(true);
  const [manualIngredients, setManualIngredients] = useState<
    ManualIngredient[]
  >([]);
  const [newIngredient, setNewIngredient] = useState<ManualIngredient>({
    name: "",
    quantity: 1,
    unit: "unit",
    category: "other",
  });
  const [recommendations, setRecommendations] = useState<
    RecipeRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeRecommendation | null>(null);

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (configRef.current) {
      gsap.fromTo(
        configRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.1, ease: "power2.out" }
      );
    }
  }, []);

  useEffect(() => {
    if (recommendations.length > 0 && recommendationsRef.current) {
      gsap.fromTo(
        recommendationsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.out" }
      );

      const cards = recommendationsRef.current.querySelectorAll(".recipe-card");
      gsap.fromTo(
        cards,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: "back.out(1.1)",
        }
      );
    }
  }, [recommendations]);

  useEffect(() => {
    if (selectedRecipe && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [selectedRecipe]);

  const handleAddIngredient = () => {
    if (newIngredient.name.trim()) {
      setManualIngredients([...manualIngredients, newIngredient]);
      setNewIngredient({
        name: "",
        quantity: 1,
        unit: "unit",
        category: "other",
      });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setManualIngredients(manualIngredients.filter((_, i) => i !== index));
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getRecipeRecommendations({
        servings,
        minMatchPercentage,
        useInventory,
        manualIngredients:
          manualIngredients.length > 0 ? manualIngredients : undefined,
        language: i18n.language, // Pass current language to backend
      });
      setRecommendations(response.recommendations);
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90)
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
    if (percentage >= 70)
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    if (percentage >= 60)
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
    return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="w-10 h-10 text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
              {t("recipes.title")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("recipes.subtitle")}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Configuration Panel */}
        <div ref={configRef}>
          <Card className="p-6 mb-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              {t("recipes.configTitle")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Servings */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t("recipes.servings")}
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 2)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              {/* Match Percentage */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  {t("recipes.minMatch")}
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={minMatchPercentage}
                  onChange={(e) =>
                    setMinMatchPercentage(parseInt(e.target.value) || 60)
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              {/* Use Inventory Toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("recipes.ingredientSource")}
                </label>
                <button
                  onClick={() => setUseInventory(!useInventory)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    useInventory
                      ? "bg-orange-600 dark:bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {useInventory
                    ? `📦 ${t("recipes.usingFridge")}`
                    : `✋ ${t("recipes.manualInput")}`}
                </button>
              </div>
            </div>

            {/* Manual Ingredients Section */}
            {!useInventory && (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  {t("recipes.addIngredientsManually")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder={t("recipes.ingredientNamePlaceholder")}
                    value={newIngredient.name}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        name: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder={t("inventory.quantity")}
                    value={newIngredient.quantity}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
                  />
                  <select
                    value={newIngredient.unit}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        unit: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent"
                  >
                    <option value="unit">unit</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                  </select>
                  <Button
                    onClick={handleAddIngredient}
                    className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("common.add")}
                  </Button>
                </div>

                {manualIngredients.length > 0 && (
                  <div className="space-y-2">
                    {manualIngredients.map((ing, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-gray-100">
                          {ing.name} - {ing.quantity} {ing.unit}
                        </span>
                        <button
                          onClick={() => handleRemoveIngredient(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Get Recommendations Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleGetRecommendations}
                disabled={
                  isLoading || (!useInventory && manualIngredients.length === 0)
                }
                className="bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white hover:from-orange-700 hover:to-green-700 dark:hover:from-orange-600 dark:hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {t("recipes.getRecommendations")}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Recommendations Grid */}
        {recommendations.length > 0 && (
          <div ref={recommendationsRef}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              {t("recipes.title")} ({recommendations.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recipe, index) => (
                <div key={index} className="recipe-card">
                  <Card className="p-6 hover:shadow-lg transition-all duration-200 h-full flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex-1">
                          {recipe.title}
                        </h3>
                        <Badge
                          className={getMatchColor(recipe.matchPercentage)}
                        >
                          {recipe.matchPercentage}%
                        </Badge>
                      </div>
                      {recipe.cuisineType && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {recipe.cuisineType} Cuisine
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {recipe.servings} {t("recipes.servings")}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime + recipe.cookTime} min
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Flame className="w-4 h-4" />
                        {recipe.calories} cal
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge
                          className={getDifficultyColor(recipe.difficulty)}
                        >
                          {recipe.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {recipe.macros.protein}g
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t("recipes.protein")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {recipe.macros.carbs}g
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t("recipes.carbs")}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {recipe.macros.fat}g
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t("recipes.fat")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Available Ingredients */}
                    <div className="mb-4 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        {t("recipes.available")} (
                        {recipe.availableIngredients.length})
                      </h4>
                      <div className="space-y-1">
                        {recipe.availableIngredients
                          .slice(0, 3)
                          .map((ing, i) => (
                            <p
                              key={i}
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
                              • {ing.name} ({ing.quantity} {ing.unit})
                            </p>
                          ))}
                        {recipe.availableIngredients.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            +{recipe.availableIngredients.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Missing Ingredients */}
                    {recipe.missingIngredients.length > 0 && (
                      <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          {t("recipes.missing")} (
                          {recipe.missingIngredients.length})
                        </h4>
                        <div className="space-y-1">
                          {recipe.missingIngredients.map((ing, i) => (
                            <p
                              key={i}
                              className="text-xs text-gray-600 dark:text-gray-400"
                            >
                              • {ing.name} ({ing.quantity} {ing.unit})
                              {ing.optional && (
                                <span className="text-gray-500 dark:text-gray-500">
                                  {" "}
                                  - {t("recipes.optional")}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <Button
                      onClick={() => setSelectedRecipe(recipe)}
                      variant="outline"
                      className="w-full border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    >
                      <Utensils className="w-4 h-4 mr-2" />
                      {t("recipes.instructions")}
                    </Button>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <div
              ref={modalRef}
              className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {selectedRecipe.title}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        className={getMatchColor(
                          selectedRecipe.matchPercentage
                        )}
                      >
                        {selectedRecipe.matchPercentage}% Match
                      </Badge>
                      <Badge
                        className={getDifficultyColor(
                          selectedRecipe.difficulty
                        )}
                      >
                        {selectedRecipe.difficulty}
                      </Badge>
                      {selectedRecipe.cuisineType && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedRecipe.cuisineType} Cuisine
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("recipes.servings")}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedRecipe.servings}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("recipes.totalTime")}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedRecipe.prepTime + selectedRecipe.cookTime} min
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("recipes.calories")}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedRecipe.calories}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <Check className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Match
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {selectedRecipe.matchPercentage}%
                    </p>
                  </div>
                </div>

                {/* Macros */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t("recipes.nutrition")}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedRecipe.macros.protein}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("recipes.protein")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedRecipe.macros.carbs}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("recipes.carbs")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedRecipe.macros.fat}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("recipes.fat")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    {t("recipes.available")} {t("recipes.ingredients")}
                  </h3>
                  <div className="space-y-2 mb-4">
                    {selectedRecipe.availableIngredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-2 rounded"
                      >
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>
                          {ing.name} - {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedRecipe.missingIngredients.length > 0 && (
                    <>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        {t("recipes.missing")} {t("recipes.ingredients")}
                      </h3>
                      <div className="space-y-2 mb-4">
                        {selectedRecipe.missingIngredients.map((ing, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 bg-orange-50 dark:bg-orange-900/20 p-2 rounded"
                          >
                            <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span>
                              {ing.name} - {ing.quantity} {ing.unit}
                              {ing.optional && (
                                <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                                  ({t("recipes.optional")})
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t("recipes.instructions")}
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedRecipe.instructions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
