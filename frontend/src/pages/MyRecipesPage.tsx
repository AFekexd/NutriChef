import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ChefHat,
  AlertCircle,
  Loader2,
  Flame,
  Trash2,
  BookOpen,
  Utensils,
  Plus,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { apiService } from "../services/api";
import type { Recipe } from "../types";
import { useNavigate } from "react-router-dom";

export function MyRecipesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getRecipes();
      setRecipes(response.recipes);
    } catch (err: any) {
      console.error("Error loading recipes:", err);
      setError(
        err.response?.data?.error || "Failed to load recipes. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await apiService.deleteAdminRecipe(recipeId);
      setRecipes(recipes.filter((r) => r.recipeId !== recipeId));
      setSelectedRecipe(null);
    } catch (err: any) {
      console.error("Error deleting recipe:", err);
      setError(
        err.response?.data?.error ||
          "Failed to delete recipe. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-600 bg-clip-text text-transparent">
                My Recipes
              </h1>
            </div>
            <Button
              onClick={() => navigate("/recipes")}
              className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-500 dark:to-blue-500 text-white hover:from-green-700 hover:to-blue-700 dark:hover:from-green-600 dark:hover:to-blue-600 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Recipe
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your saved recipes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && recipes.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/10 dark:to-green-900/10 rounded-2xl p-12 border-2 border-dashed border-blue-200 dark:border-blue-800">
              <div className="flex justify-center mb-6">
                <ChefHat className="w-24 h-24 text-blue-300 dark:text-blue-700" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No Recipes Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Start creating your own recipes or save AI-generated
                recommendations to build your personal cookbook!
              </p>
              <Button
                onClick={() => navigate("/recipes")}
                className="bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-500 dark:to-blue-500 text-white hover:from-green-700 hover:to-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Recipe
              </Button>
            </div>
          </div>
        )}

        {/* Recipes Grid */}
        {!isLoading && recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card
                key={recipe.recipeId}
                className="p-6 hover:shadow-xl transition-all duration-200 h-full flex flex-col bg-gradient-to-br from-white to-blue-50/20 dark:from-gray-900 dark:to-blue-900/10 border-gray-200 dark:border-gray-800"
              >
                {/* Recipe Image */}
                {recipe.imageURL && (
                  <div className="mb-4 -mx-6 -mt-6 rounded-t-lg overflow-hidden">
                    <img
                      src={recipe.imageURL}
                      alt={recipe.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {recipe.title}
                  </h3>
                </div>

                {/* Macros */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                  <div className="grid grid-cols-4 gap-2 text-xs items-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {recipe.calories}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">kcal</p>
                    </div>
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

                {/* Actions */}
                <div className="mt-auto space-y-2">
                  <Button
                    onClick={() => setSelectedRecipe(recipe)}
                    variant="outline"
                    className="w-full border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Utensils className="w-4 h-4 mr-2" />
                    View Recipe
                  </Button>
                  <Button
                    onClick={() => handleDeleteRecipe(recipe.recipeId)}
                    disabled={isDeleting}
                    variant="outline"
                    className="w-full border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
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
              className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
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
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {selectedRecipe.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Nutrition */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t("recipes.nutrition")}
                  </h3>
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="text-center">
                      <Flame className="w-5 h-5 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedRecipe.calories}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("recipes.calories")}
                      </p>
                    </div>
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

                {/* Instructions */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t("recipes.instructions")}
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {selectedRecipe.instructions}
                  </div>
                </div>

                {/* Close Button */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 dark:text-gray-100">
                  <Button
                    onClick={() => setSelectedRecipe(null)}
                    variant="outline"
                    className="w-full dark:border-gray-700"
                  >
                    Close
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
