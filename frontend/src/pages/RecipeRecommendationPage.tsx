import { useState, useRef, useEffect } from "react";
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
        manualIngredients: manualIngredients.length > 0 ? manualIngredients : undefined,
      });
      setRecommendations(response.recommendations);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to get recipe recommendations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-100 text-green-700";
    if (percentage >= 70) return "bg-blue-100 text-blue-700";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-orange-100 text-orange-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pb-20 md:pb-0 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="w-10 h-10 text-orange-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              Recipe Recommendations
            </h1>
          </div>
          <p className="text-gray-600">
            Get personalized recipe suggestions based on your available
            ingredients
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Configuration Panel */}
        <div ref={configRef}>
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-600" />
              Configure Your Search
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Servings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Servings
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 2)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Match Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Min Match %
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={minMatchPercentage}
                  onChange={(e) =>
                    setMinMatchPercentage(parseInt(e.target.value) || 60)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Use Inventory Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredient Source
                </label>
                <button
                  onClick={() => setUseInventory(!useInventory)}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    useInventory
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {useInventory ? "📦 Using Fridge" : "✋ Manual Input"}
                </button>
              </div>
            </div>

            {/* Manual Ingredients Section */}
            {!useInventory && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Ingredients Manually
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={newIngredient.name}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        name: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Quantity"
                    value={newIngredient.quantity}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <select
                    value={newIngredient.unit}
                    onChange={(e) =>
                      setNewIngredient({
                        ...newIngredient,
                        unit: e.target.value,
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {manualIngredients.length > 0 && (
                  <div className="space-y-2">
                    {manualIngredients.map((ing, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-orange-50 p-3 rounded-lg"
                      >
                        <span className="text-gray-900">
                          {ing.name} - {ing.quantity} {ing.unit}
                        </span>
                        <button
                          onClick={() => handleRemoveIngredient(index)}
                          className="text-red-600 hover:text-red-700"
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
                disabled={isLoading || (!useInventory && manualIngredients.length === 0)}
                className="bg-gradient-to-r from-orange-600 to-green-600 text-white hover:from-orange-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Recommendations Grid */}
        {recommendations.length > 0 && (
          <div ref={recommendationsRef}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              Recommended Recipes ({recommendations.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recipe, index) => (
                <div
                  key={index}
                  className="recipe-card"
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 flex-1">
                          {recipe.title}
                        </h3>
                        <Badge className={getMatchColor(recipe.matchPercentage)}>
                          {recipe.matchPercentage}%
                        </Badge>
                      </div>
                      {recipe.cuisineType && (
                        <p className="text-sm text-gray-600">
                          {recipe.cuisineType} Cuisine
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {recipe.servings} servings
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {recipe.prepTime + recipe.cookTime} min
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Flame className="w-4 h-4" />
                        {recipe.calories} cal
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className={getDifficultyColor(recipe.difficulty)}>
                          {recipe.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {recipe.macros.protein}g
                          </p>
                          <p className="text-gray-600">Protein</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {recipe.macros.carbs}g
                          </p>
                          <p className="text-gray-600">Carbs</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">
                            {recipe.macros.fat}g
                          </p>
                          <p className="text-gray-600">Fat</p>
                        </div>
                      </div>
                    </div>

                    {/* Available Ingredients */}
                    <div className="mb-4 flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-600" />
                        Available ({recipe.availableIngredients.length})
                      </h4>
                      <div className="space-y-1">
                        {recipe.availableIngredients.slice(0, 3).map((ing, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            • {ing.name} ({ing.quantity} {ing.unit})
                          </p>
                        ))}
                        {recipe.availableIngredients.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{recipe.availableIngredients.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Missing Ingredients */}
                    {recipe.missingIngredients.length > 0 && (
                      <div className="mb-4 bg-orange-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                          <ShoppingCart className="w-4 h-4 text-orange-600" />
                          Need to Buy ({recipe.missingIngredients.length})
                        </h4>
                        <div className="space-y-1">
                          {recipe.missingIngredients.map((ing, i) => (
                            <p key={i} className="text-xs text-gray-600">
                              • {ing.name} ({ing.quantity} {ing.unit})
                              {ing.optional && (
                                <span className="text-gray-500"> - optional</span>
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
                      className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                    >
                      <Utensils className="w-4 h-4 mr-2" />
                      View Recipe
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedRecipe(null)}
          >
            <div
              ref={modalRef}
              className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedRecipe.title}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={getMatchColor(selectedRecipe.matchPercentage)}>
                        {selectedRecipe.matchPercentage}% Match
                      </Badge>
                      <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                        {selectedRecipe.difficulty}
                      </Badge>
                      {selectedRecipe.cuisineType && (
                        <span className="text-sm text-gray-600">
                          {selectedRecipe.cuisineType} Cuisine
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-sm text-gray-600">Servings</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedRecipe.servings}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm text-gray-600">Total Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedRecipe.prepTime + selectedRecipe.cookTime} min
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <Flame className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm text-gray-600">Calories</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedRecipe.calories}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <Check className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-sm text-gray-600">Match</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedRecipe.matchPercentage}%
                    </p>
                  </div>
                </div>

                {/* Macros */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Nutrition per serving
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedRecipe.macros.protein}g
                      </p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedRecipe.macros.carbs}g
                      </p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedRecipe.macros.fat}g
                      </p>
                      <p className="text-sm text-gray-600">Fat</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Available Ingredients
                  </h3>
                  <div className="space-y-2 mb-4">
                    {selectedRecipe.availableIngredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-gray-700 bg-green-50 p-2 rounded"
                      >
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>
                          {ing.name} - {ing.quantity} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedRecipe.missingIngredients.length > 0 && (
                    <>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-orange-600" />
                        Shopping List
                      </h3>
                      <div className="space-y-2 mb-4">
                        {selectedRecipe.missingIngredients.map((ing, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-gray-700 bg-orange-50 p-2 rounded"
                          >
                            <ShoppingCart className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span>
                              {ing.name} - {ing.quantity} {ing.unit}
                              {ing.optional && (
                                <span className="text-gray-500 text-sm ml-1">
                                  (optional)
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
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Instructions
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
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
