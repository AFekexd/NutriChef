import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
  BookOpen,
  Save,
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

interface CreateRecipeForm {
  title: string;
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: "easy" | "medium" | "hard";
  cuisineType: string;
  imageURL: string;
}

export function RecipeRecommendationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
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
  const [showCacheNotice, setShowCacheNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRecipeForm>({
    title: "",
    instructions: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servings: 2,
    prepTime: 15,
    cookTime: 30,
    difficulty: "medium",
    cuisineType: "",
    imageURL: "",
  });

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

  // Cache helper functions
  const generateCacheKey = (params: {
    servings: number;
    minMatchPercentage: number;
    useInventory: boolean;
    manualIngredients?: ManualIngredient[];
  }): string => {
    const key = {
      servings: params.servings,
      minMatchPercentage: params.minMatchPercentage,
      useInventory: params.useInventory,
      ingredients: params.useInventory
        ? "inventory"
        : params.manualIngredients
            ?.map((ing) => `${ing.name}-${ing.quantity}-${ing.unit}`)
            .sort()
            .join(",") || "none",
    };
    return JSON.stringify(key);
  };

  const getCachedRecommendations = (
    key: string
  ): RecipeRecommendation[] | null => {
    try {
      const cached = localStorage.getItem(`recipe_cache_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      // Cache expires after 24 hours
      const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > MAX_CACHE_AGE) {
        localStorage.removeItem(`recipe_cache_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  };

  const setCachedRecommendations = (
    key: string,
    data: RecipeRecommendation[]
  ) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(`recipe_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error setting cache:", error);
    }
  };

  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("recipe_cache_")) {
          localStorage.removeItem(key);
        }
      });
      setShowCacheNotice(false);
      alert("Recipe cache cleared successfully!");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  const handleSaveRecipe = async (recipe: RecipeRecommendation) => {
    if (savedRecipes.has(recipe.title)) {
      return; // Already saved
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setError(null);

    try {
      // Convert RecipeRecommendation to Recipe format for API
      const recipeData = {
        title: recipe.title,
        instructions: recipe.instructions,
        calories: recipe.calories,
        macros: {
          protein: recipe.macros.protein,
          carbs: recipe.macros.carbs,
          fat: recipe.macros.fat,
        },
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        cuisineType: recipe.cuisineType,
        // Note: We don't have ingredient IDs from AI recommendations,
        // so the recipe will be saved without ingredients linked
      };

      await apiService.createRecipe(recipeData);

      // Mark as saved
      setSavedRecipes(new Set([...savedRecipes, recipe.title]));
      setSaveSuccess(`"${recipe.title}" saved successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving recipe:", err);
      setError(
        err.response?.data?.error || "Failed to save recipe. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSaveSuccess(null);

    try {
      const recipeData = {
        title: createForm.title,
        instructions: createForm.instructions,
        calories: createForm.calories,
        macros: {
          protein: createForm.protein,
          carbs: createForm.carbs,
          fat: createForm.fat,
        },
        servings: createForm.servings,
        prepTime: createForm.prepTime,
        cookTime: createForm.cookTime,
        difficulty: createForm.difficulty,
        cuisineType: createForm.cuisineType,
        imageURL: createForm.imageURL || undefined,
      };

      await apiService.createRecipe(recipeData);
      setSaveSuccess(`"${createForm.title}" created successfully!`);

      // Reset form and close modal
      setCreateForm({
        title: "",
        instructions: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servings: 2,
        prepTime: 15,
        cookTime: 30,
        difficulty: "medium",
        cuisineType: "",
        imageURL: "",
      });
      setShowCreateModal(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error creating recipe:", err);
      setError(
        err.response?.data?.error ||
          "Failed to create recipe. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      instructions: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      servings: 2,
      prepTime: 15,
      cookTime: 30,
      difficulty: "medium",
      cuisineType: "",
      imageURL: "",
    });
    setError(null);
  };

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setShowCacheNotice(false);

    try {
      // Generate cache key based on current parameters
      const cacheKey = generateCacheKey({
        servings,
        minMatchPercentage,
        useInventory,
        manualIngredients,
      });

      // Check if we have cached results
      const cachedData = getCachedRecommendations(cacheKey);

      if (cachedData) {
        console.log("Using cached recommendations");
        setRecommendations(cachedData);
        setShowCacheNotice(true);
        setIsLoading(false);
        return;
      }

      // Fetch fresh recommendations from API
      const response = await apiService.getRecipeRecommendations({
        servings,
        minMatchPercentage,
        useInventory,
        manualIngredients:
          manualIngredients.length > 0 ? manualIngredients : undefined,
        language: i18n.language, // Pass current language to backend
      });

      setRecommendations(response.recommendations);

      // Cache the results
      setCachedRecommendations(cacheKey, response.recommendations);
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ChefHat className="w-10 h-10 text-green-600 dark:text-green-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-600 bg-clip-text text-transparent">
                {t("recipes.title")}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/my-recipes")}
                variant="outline"
                className="border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                My Recipes
              </Button>
              <Button
                onClick={() => {
                  resetCreateForm();
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-500 dark:to-blue-500 text-white hover:from-green-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:to-blue-600 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Recipe
              </Button>
            </div>
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

        {/* Cache Notice */}
        {showCacheNotice && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-blue-700 dark:text-blue-300">
                Loaded from cache (saved tokens!) - Results are from a previous
                search with the same parameters.
              </p>
            </div>
            <Button
              onClick={clearCache}
              variant="outline"
              size="sm"
              className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              Clear Cache
            </Button>
          </div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-300">{saveSuccess}</p>
          </div>
        )}

        {/* Configuration Panel */}
        <div ref={configRef}>
          <Card className="p-6 mb-8 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-900/5 border-gray-200 dark:border-gray-800 shadow-lg">
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
            <div className="mt-6 flex justify-center md:justify-end">
              <Button
                onClick={handleGetRecommendations}
                disabled={
                  isLoading || (!useInventory && manualIngredients.length === 0)
                }
                className="bg-gradient-to-r from-orange-600 to-green-600 dark:from-orange-500 dark:to-green-500 text-white hover:from-orange-700 hover:to-green-700 dark:hover:from-orange-600 dark:hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-lg font-semibold"
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

        {/* Empty State */}
        {!isLoading && recommendations.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-orange-50 to-green-50 dark:from-orange-900/10 dark:to-green-900/10 rounded-2xl p-12 border-2 border-dashed border-orange-200 dark:border-orange-800">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <ChefHat className="w-24 h-24 text-orange-300 dark:text-orange-700" />
                  <Sparkles className="w-8 h-8 text-green-500 dark:text-green-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {t("recipes.emptyStateTitle") ||
                  "Ready to Cook Something Amazing?"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {t("recipes.emptyStateDescription") ||
                  "Configure your preferences above and click 'Get Recommendations' to discover delicious recipes tailored to your ingredients!"}
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>AI-Powered Suggestions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Personalized Match %</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Nutritional Info</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  <Card className="p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 h-full flex flex-col bg-gradient-to-br from-white to-orange-50/20 dark:from-gray-900 dark:to-orange-900/10 border-gray-200 dark:border-gray-800">
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
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleSaveRecipe(recipe)}
                        disabled={isSaving || savedRecipes.has(recipe.title)}
                        className={`w-full ${
                          savedRecipes.has(recipe.title)
                            ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                        } text-white`}
                      >
                        {savedRecipes.has(recipe.title) ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Saved
                          </>
                        ) : isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Save Recipe
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setSelectedRecipe(recipe)}
                        variant="outline"
                        className="w-full border-orange-600 dark:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      >
                        <Utensils className="w-4 h-4 mr-2" />
                        {t("recipes.instructions")}
                      </Button>
                    </div>
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

                {/* Action Footer */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex gap-3">
                  <Button
                    onClick={() => handleSaveRecipe(selectedRecipe)}
                    disabled={
                      isSaving || savedRecipes.has(selectedRecipe.title)
                    }
                    className={`flex-1 ${
                      savedRecipes.has(selectedRecipe.title)
                        ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                    } text-white`}
                  >
                    {savedRecipes.has(selectedRecipe.title) ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Recipe Saved
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5 mr-2" />
                        Save to My Recipes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setSelectedRecipe(null)}
                    variant="outline"
                    className="px-6 dark:border-gray-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Recipe Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateModal(false);
              resetCreateForm();
            }}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <ChefHat className="w-8 h-8 text-green-600 dark:text-green-400" />
                      Create Your Own Recipe
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Share your culinary masterpiece with nutritional details
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateRecipe} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recipe Title */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Recipe Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.title}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            title: e.target.value,
                          })
                        }
                        placeholder="e.g., Mediterranean Grilled Chicken"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Cuisine Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cuisine Type
                      </label>
                      <input
                        type="text"
                        value={createForm.cuisineType}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            cuisineType: e.target.value,
                          })
                        }
                        placeholder="e.g., Italian, Asian, Mediterranean"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={createForm.difficulty}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            difficulty: e.target.value as
                              | "easy"
                              | "medium"
                              | "hard",
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    {/* Servings */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Servings <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="20"
                        value={createForm.servings}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            servings: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Prep Time */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Prep Time (minutes){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={createForm.prepTime}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            prepTime: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Cook Time */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Cook Time (minutes){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={createForm.cookTime}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            cookTime: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Image URL */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Image URL (optional)
                      </label>
                      <input
                        type="url"
                        value={createForm.imageURL}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            imageURL: e.target.value,
                          })
                        }
                        placeholder="https://example.com/recipe-image.jpg"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Nutritional Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    Nutritional Information (per serving)
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Calories */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Calories <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={createForm.calories}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            calories: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Protein */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Protein (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.1"
                        value={createForm.protein}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            protein: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Carbs */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Carbs (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.1"
                        value={createForm.carbs}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            carbs: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>

                    {/* Fat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fat (g) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.1"
                        value={createForm.fat}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            fat: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Cooking Instructions
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instructions <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={8}
                      value={createForm.instructions}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          instructions: e.target.value,
                        })
                      }
                      placeholder="Step 1: Prepare ingredients...&#10;Step 2: Heat oil in a pan...&#10;Step 3: Cook until done..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Provide detailed step-by-step instructions for the recipe
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex gap-3">
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-500 dark:to-blue-500 text-white hover:from-green-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:to-blue-600 py-3 text-lg font-semibold"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Recipe...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Create Recipe
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    variant="outline"
                    className="px-8 dark:border-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
