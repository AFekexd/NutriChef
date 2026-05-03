import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChefHat,
  Loader2,
  Flame,
  BookOpen,
  Utensils,
  ShoppingCart,
  User as UserIcon,
  Calendar,
  Star,
  Globe,
  Search,
  Filter,
  X,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { apiService } from "../services/api";
import { shoppingListService } from "../services/shoppingListService";
import type { Recipe, InventoryItem } from "../types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function PublicRecipesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "rating" | "calories" | "name"
  >("recent");
  const [maxCalories, setMaxCalories] = useState<number>(2000);
  const [showFilters, setShowFilters] = useState(false);

  // Pull to refresh
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await loadRecipes();
      toast.success(t("publicRecipes.messages.recipesRefreshed"));
    },
    threshold: 80,
  });

  useEffect(() => {
    loadRecipes();
    loadInventoryData();
  }, []);

  useEffect(() => {
    filterAndSortRecipes();
  }, [recipes, searchQuery, selectedCategory, sortBy, maxCalories]);

  const loadInventoryData = async () => {
    try {
      const items = await apiService.getAllInventoryItems();
      setInventoryItems(items);
    } catch (err: any) {
      console.error("Error loading inventory:", err);
    }
  };

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getRecipes();
      // Only show public recipes
      const publicRecipes = response.recipes.filter((r) => r.isPublic);
      setRecipes(publicRecipes);
    } catch (err: any) {
      console.error("Error loading recipes:", err);
      toast.error(t("publicRecipes.messages.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortRecipes = () => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.instructions.toLowerCase().includes(query) ||
          recipe.cuisineType?.toLowerCase().includes(query) ||
          recipe.user?.name.toLowerCase().includes(query)
      );
    }

    // Category filter (by difficulty)
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (recipe) => recipe.difficulty === selectedCategory
      );
    }

    // Calories filter
    filtered = filtered.filter((recipe) => recipe.calories <= maxCalories);

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "calories":
          return a.calories - b.calories;
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredRecipes(filtered);
  };

  const getDifficultyLabel = (difficulty?: string | null) => {
    if (!difficulty) return "";

    switch (difficulty.toLowerCase()) {
      case "easy":
        return t("publicRecipes.filters.easy");
      case "medium":
        return t("publicRecipes.filters.medium");
      case "hard":
        return t("publicRecipes.filters.hard");
      default:
        return difficulty;
    }
  };

  const handleAddRecipeToShoppingList = (recipe: Recipe) => {
    if (!recipe.recipeIngredients || recipe.recipeIngredients.length === 0) {
      shoppingListService.addItem({
        name: `Recipe: ${recipe.title}`,
        quantity: 1,
        unit: "recipe",
        category: "recipes",
        priority: "medium",
      });
      toast.success(t("publicRecipes.messages.recipeAdded", { name: recipe.title }));
      return;
    }

    const ingredientsToAdd = recipe.recipeIngredients.map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
      category: ri.ingredient.category,
      priority: "medium" as const,
    }));

    // Pass inventory data to auto-check items in stock
    shoppingListService.addRecipe(
      recipe.title,
      recipe.recipeId,
      ingredientsToAdd,
      inventoryItems
    );

    // Count how many ingredients are already in stock
    const inStockCount = ingredientsToAdd.filter((ing) =>
      inventoryItems.some(
        (inv) => inv.ingredient.name.toLowerCase() === ing.name.toLowerCase()
      )
    ).length;

    const message =
      inStockCount > 0
        ? t("publicRecipes.messages.recipeAddedPartial", {
            name: recipe.title,
            inStock: inStockCount,
            total: ingredientsToAdd.length,
          })
        : t("publicRecipes.messages.recipeAddedFull", {
            name: recipe.title,
            count: ingredientsToAdd.length,
          });

    toast.success(message);
  };

  const handleRateRecipe = async (recipeId: string, rating: number) => {
    try {
      const response = await apiService.rateRecipe(recipeId, rating);
      toast.success(t("publicRecipes.messages.recipeRated"));

      // Update the recipes state locally instead of reloading
      setRecipes((prevRecipes) =>
        prevRecipes.map((recipe) =>
          recipe.recipeId === recipeId
            ? {
                ...recipe,
                rating: response.rating,
                ratingCount: response.ratingCount,
              }
            : recipe
        )
      );

      // Update selected recipe if it's currently open
      if (selectedRecipe?.recipeId === recipeId) {
        setSelectedRecipe({
          ...selectedRecipe,
          rating: response.rating,
          ratingCount: response.ratingCount,
        });
      }
    } catch (err: any) {
      console.error("Error rating recipe:", err);
      toast.error(
        err.response?.data?.error || t("publicRecipes.messages.ratingFailed")
      );
    }
  };

  const categories = [
    { value: "all", label: t("publicRecipes.filters.all"), icon: Globe },
    { value: "easy", label: t("publicRecipes.filters.easy"), icon: Users },
    {
      value: "medium",
      label: t("publicRecipes.filters.medium"),
      icon: ChefHat,
    },
    { value: "hard", label: t("publicRecipes.filters.hard"), icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-green-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-green-950/20">
      <PullToRefreshIndicator
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-green-500 dark:from-blue-600 dark:to-green-600 rounded-xl shadow-lg">
                <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-600 bg-clip-text text-transparent">
                  {t("publicRecipes.title")}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredRecipes.length === 1
                    ? t("publicRecipes.subtitle", {
                        count: filteredRecipes.length,
                      })
                    : t("publicRecipes.subtitle_plural", {
                        count: filteredRecipes.length,
                      })}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/my-recipes")}
              variant="outline"
              className="border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              {t("publicRecipes.myRecipes")}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t("publicRecipes.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.value
                      ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg scale-105"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters
                ? t("publicRecipes.filters.hideFilters")
                : t("publicRecipes.filters.showFilters")}
            </Button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "recent" | "rating" | "calories" | "name"
                )
              }
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">{t("publicRecipes.filters.mostRecent")}</option>
              <option value="rating">{t("publicRecipes.filters.highestRated")}</option>
              <option value="calories">{t("publicRecipes.filters.lowestCalories")}</option>
              <option value="name">{t("publicRecipes.filters.nameAZ")}</option>
            </select>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="p-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("publicRecipes.filters.maxCalories", { value: maxCalories })}
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={maxCalories}
                  onChange={(e) => setMaxCalories(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>100</span>
                  <span>2000</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRecipes.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 rounded-2xl p-12 border-2 border-dashed border-blue-200 dark:border-blue-800">
              <div className="flex justify-center mb-6">
                <ChefHat className="w-24 h-24 text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {searchQuery || selectedCategory !== "all"
                  ? t("publicRecipes.emptyState.noRecipesFound")
                  : t("publicRecipes.emptyState.noPublicRecipes")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== "all"
                  ? t("publicRecipes.emptyState.tryAdjusting")
                  : t("publicRecipes.emptyState.beTheFirst")}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setMaxCalories(2000);
                  }}
                  variant="outline"
                  className="border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400"
                >
                  {t("publicRecipes.filters.clearFilters")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Recipes Grid */}
        {!isLoading && filteredRecipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card
                key={recipe.recipeId}
                className="group p-0 hover:shadow-2xl transition-all duration-300 h-full flex flex-col bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 overflow-hidden hover:scale-[1.02]"
              >
                {/* Recipe Image */}
                {recipe.imageURL && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={recipe.imageURL}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>
                        {recipe.calories} {t("publicRecipes.recipeDetails.calories")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {recipe.title}
                  </h3>

                  {/* Author and Date */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-2">
                      {recipe.user?.oauthAvatar ? (
                        <img
                          src={
                            recipe.user.oauthAvatar.startsWith("http")
                              ? recipe.user.oauthAvatar
                              : `${
                                  import.meta.env.VITE_API_BASE_URL ||
                                  "http://localhost:5000"
                                }${recipe.user.oauthAvatar}`
                          }
                          alt={recipe.user.name}
                          className="w-6 h-6 rounded-full border-2 border-blue-200 dark:border-blue-800"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                          <UserIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="font-medium">
                        {recipe.user?.name || t("myRecipes.details.unknown")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 cursor-pointer transition-all ${
                            star <= (recipe.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600 hover:text-yellow-400"
                          }`}
                          onClick={() =>
                            handleRateRecipe(recipe.recipeId, star)
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {recipe.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({recipe.ratingCount || 0}{" "}
                      {t("publicRecipes.rating", {
                        count: recipe.ratingCount || 0,
                      })})
                    </span>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.protein")}
                      </p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {recipe.macros.protein}g
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.carbs")}
                      </p>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {recipe.macros.carbs}g
                      </p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.fat")}
                      </p>
                      <p className="font-bold text-yellow-600 dark:text-yellow-400">
                        {recipe.macros.fat}g
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.difficulty && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                        {getDifficultyLabel(recipe.difficulty)}
                      </span>
                    )}
                    {recipe.cuisineType && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                        {recipe.cuisineType}
                      </span>
                    )}
                    {recipe.prepTime && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTime}m
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-2">
                    <Button
                      onClick={() => setSelectedRecipe(recipe)}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
                    >
                      <Utensils className="w-4 h-4 mr-2" />
                      {t("publicRecipes.actions.viewRecipe")}
                    </Button>
                    <Button
                      onClick={() => handleAddRecipeToShoppingList(recipe)}
                      variant="outline"
                      className="w-full border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t("publicRecipes.actions.addToShoppingList")}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recipe Detail Modal */}
        {selectedRecipe && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
                {selectedRecipe.imageURL && (
                  <div className="mb-4 -mx-6 -mt-6 rounded-t-xl overflow-hidden">
                    <img
                      src={selectedRecipe.imageURL}
                      alt={selectedRecipe.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {selectedRecipe.title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        {selectedRecipe.user?.oauthAvatar ? (
                          <img
                            src={selectedRecipe.user.oauthAvatar}
                            alt={selectedRecipe.user.name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <UserIcon className="w-4 h-4" />
                        )}
                        <span>
                          {selectedRecipe.user?.name ||
                            t("myRecipes.details.unknown")}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {selectedRecipe.rating?.toFixed(1) || "0.0"} (
                          {selectedRecipe.ratingCount || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Nutrition */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/20 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {t("publicRecipes.recipeDetails.nutrition")}
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                        {selectedRecipe.calories}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.calories")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedRecipe.macros.protein}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.protein")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {selectedRecipe.macros.carbs}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.carbs")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                        {selectedRecipe.macros.fat}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("publicRecipes.recipeDetails.fat")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                {selectedRecipe.recipeIngredients &&
                  selectedRecipe.recipeIngredients.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                        {t("publicRecipes.recipeDetails.ingredients")}
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                        {selectedRecipe.recipeIngredients.map((ri) => (
                          <div
                            key={ri.recipeIngredientId}
                            className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                          >
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {ri.ingredient.name}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {ri.quantity} {ri.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                    {t("publicRecipes.recipeDetails.instructions")}
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {selectedRecipe.instructions}
                  </div>
                </div>

                {/* Rate Recipe */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t("publicRecipes.actions.rateRecipe")}
                  </h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => {
                          handleRateRecipe(selectedRecipe.recipeId, star);
                        }}
                        className="group"
                      >
                        <Star
                          className={`w-8 h-8 transition-all ${
                            star <= (selectedRecipe.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600 group-hover:text-yellow-400 group-hover:scale-110"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      handleAddRecipeToShoppingList(selectedRecipe);
                      setSelectedRecipe(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t("publicRecipes.actions.addToShoppingList")}
                  </Button>
                  <Button
                    onClick={() => setSelectedRecipe(null)}
                    variant="outline"
                    className="dark:border-gray-700"
                  >
                    {t("publicRecipes.actions.close")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
