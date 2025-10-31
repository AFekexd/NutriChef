import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Utensils,
  Calculator,
  Package,
  BookOpen,
  Search,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import type { InventoryItem, Recipe } from "@/types";

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }) => void;
}

const MEAL_TYPES = [
  { type: "breakfast" as const, emoji: "🌅", label: "Breakfast" },
  { type: "lunch" as const, emoji: "☀️", label: "Lunch" },
  { type: "dinner" as const, emoji: "🌙", label: "Dinner" },
  { type: "snack" as const, emoji: "🍎", label: "Snack" },
];

// Calculate calories from macros: Protein & Carbs = 4 cal/g, Fat = 9 cal/g
const calculateCaloriesFromMacros = (
  protein: number,
  carbs: number,
  fat: number
): number => {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
};

export function LogMealModal({ isOpen, onClose, onSave }: LogMealModalProps) {
  const [inputMode, setInputMode] = useState<"manual" | "inventory" | "recipe">(
    "manual"
  );
  const [formData, setFormData] = useState({
    mealType: "lunch" as "breakfast" | "lunch" | "dinner" | "snack",
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculate, setAutoCalculate] = useState(false);

  // Inventory and Recipe data
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load inventory and recipes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [inventoryData, recipeResponse] = await Promise.all([
        apiService.getAllInventoryItems(),
        apiService.getRecipes(),
      ]);
      setInventoryItems(inventoryData);
      setRecipes(recipeResponse.recipes);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSelectInventoryItem = (item: InventoryItem) => {
    const nutritionInfo = item.ingredient.nutritionalInfo;
    const quantity = item.quantity || 100; // Default to 100g if no quantity

    // Calculate macros based on quantity (nutritional info is per 100g)
    const multiplier = quantity / 100;

    setFormData({
      ...formData,
      name: item.ingredient.name,
      calories: Math.round(nutritionInfo.calories * multiplier),
      protein: Math.round(nutritionInfo.protein * multiplier),
      carbs: Math.round(nutritionInfo.carbs * multiplier),
      fat: Math.round(nutritionInfo.fat * multiplier),
      fiber: 0, // Fiber not available in ingredient data
    });
    setSearchQuery(""); // Clear search
    setInputMode("manual"); // Switch back to manual to show the filled form
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setFormData({
      ...formData,
      name: recipe.title,
      calories: recipe.calories,
      protein: recipe.macros.protein,
      carbs: recipe.macros.carbs,
      fat: recipe.macros.fat,
      fiber: 0, // Fiber not tracked in recipes yet
    });
    setSearchQuery(""); // Clear search
    setInputMode("manual"); // Switch back to manual to show the filled form
  };

  const handleModeChange = (mode: "manual" | "inventory" | "recipe") => {
    setInputMode(mode);
    setSearchQuery(""); // Reset search when changing modes
  };

  // Filter items based on search
  const filteredInventory = inventoryItems.filter((item) =>
    item.ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Meal name is required";
    }

    if (formData.calories <= 0) {
      newErrors.calories = "Calories must be greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);

    // Reset form
    setFormData({
      mealType: "lunch",
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    });
    setErrors({});
  };

  const handleClose = () => {
    setFormData({
      mealType: "lunch",
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    });
    setErrors({});
    setSearchQuery("");
    setInputMode("manual");
    onClose();
  };

  const updateValue = (field: string, value: number, delta: number) => {
    const newValue = Math.max(0, value + delta);
    const updatedData = { ...formData, [field]: newValue };

    // Auto-calculate calories if enabled and a macro is updated
    if (
      autoCalculate &&
      (field === "protein" || field === "carbs" || field === "fat")
    ) {
      updatedData.calories = calculateCaloriesFromMacros(
        field === "protein" ? newValue : formData.protein,
        field === "carbs" ? newValue : formData.carbs,
        field === "fat" ? newValue : formData.fat
      );
    }

    setFormData(updatedData);
  };

  const handleMacroChange = (field: string, value: number) => {
    const updatedData = {
      ...formData,
      [field]: Math.max(0, value),
    };

    // Auto-calculate calories if enabled
    if (
      autoCalculate &&
      (field === "protein" || field === "carbs" || field === "fat")
    ) {
      updatedData.calories = calculateCaloriesFromMacros(
        field === "protein" ? value : formData.protein,
        field === "carbs" ? value : formData.carbs,
        field === "fat" ? value : formData.fat
      );
    }

    setFormData(updatedData);
  };

  const toggleAutoCalculate = () => {
    const newAutoCalculate = !autoCalculate;
    setAutoCalculate(newAutoCalculate);

    // If enabling auto-calculate, immediately calculate calories from current macros
    if (newAutoCalculate) {
      setFormData({
        ...formData,
        calories: calculateCaloriesFromMacros(
          formData.protein,
          formData.carbs,
          formData.fat
        ),
      });
    }
  };

  const MacroInput = ({
    label,
    emoji,
    value,
    field,
    step,
    color,
  }: {
    label: string;
    emoji: string;
    value: number;
    field: string;
    step: number;
    color: "red" | "yellow" | "blue" | "green";
  }) => {
    const colorClasses = {
      red: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 focus-within:ring-red-500",
      yellow:
        "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30 focus-within:ring-yellow-500",
      blue: "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 focus-within:ring-blue-500",
      green:
        "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 focus-within:ring-green-500",
    };

    return (
      <div
        className={cn(
          "rounded-xl p-4 border-2 transition-all ",
          colorClasses[color]
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{emoji}</span>
          <Label className="text-gray-700 dark:text-gray-300">{label}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => updateValue(field, value, -step)}
            className="bg-white dark:bg-gray-800 shadow-sm"
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <Input
            type="number"
            value={value}
            onChange={(e) => handleMacroChange(field, Number(e.target.value))}
            className="text-center font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={() => updateValue(field, value, step)}
            className="bg-white dark:bg-gray-800 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
          grams
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Log Meal</h3>
            <p className="text-green-100 text-sm mt-1">
              Track your nutrition intake
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar"
        >
          {/* Input Mode Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleModeChange("manual")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-medium transition-all border-b-2",
                inputMode === "manual"
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Utensils className="w-4 h-4" />
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("inventory")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-medium transition-all border-b-2",
                inputMode === "inventory"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Package className="w-4 h-4" />
              From Inventory
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("recipe")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 font-medium transition-all border-b-2",
                inputMode === "recipe"
                  ? "border-purple-500 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <BookOpen className="w-4 h-4" />
              From Recipes
            </button>
          </div>

          {/* Inventory Selection View */}
          {inputMode === "inventory" && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 text-gray-700 dark:text-gray-300">
                  Search Inventory Items
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ingredients..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                {isLoadingData ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading inventory items...
                  </div>
                ) : filteredInventory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No items found"
                      : "No inventory items available"}
                  </div>
                ) : (
                  filteredInventory.map((item) => (
                    <button
                      key={item.inventoryItemId}
                      type="button"
                      onClick={() => handleSelectInventoryItem(item)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {item.ingredient.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.quantity} {item.unit} •{" "}
                            {item.ingredient.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {Math.round(
                              (item.ingredient.nutritionalInfo.calories *
                                item.quantity) /
                                100
                            )}{" "}
                            cal
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            P:{" "}
                            {Math.round(
                              (item.ingredient.nutritionalInfo.protein *
                                item.quantity) /
                                100
                            )}
                            g • C:{" "}
                            {Math.round(
                              (item.ingredient.nutritionalInfo.carbs *
                                item.quantity) /
                                100
                            )}
                            g • F:{" "}
                            {Math.round(
                              (item.ingredient.nutritionalInfo.fat *
                                item.quantity) /
                                100
                            )}
                            g
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recipe Selection View */}
          {inputMode === "recipe" && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 text-gray-700 dark:text-gray-300">
                  Search Saved Recipes
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recipes..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                {isLoadingData ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading recipes...
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No recipes found"
                      : "No saved recipes available"}
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => (
                    <button
                      key={recipe.recipeId}
                      type="button"
                      onClick={() => handleSelectRecipe(recipe)}
                      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {recipe.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {recipe.instructions.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {recipe.calories} cal
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            P: {recipe.macros.protein}g • C:{" "}
                            {recipe.macros.carbs}g • F: {recipe.macros.fat}g
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Manual Entry Form - Original Form */}
          {inputMode === "manual" && (
            <>
              {/* Meal Type */}
              <div>
                <Label className="mb-3 text-gray-700 dark:text-gray-300">
                  Meal Type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {MEAL_TYPES.map(({ type, emoji, label }) => (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          mealType: type,
                        })
                      }
                      className={cn(
                        "h-auto py-3 font-medium transition-all",
                        formData.mealType === type
                          ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-md scale-105 hover:bg-green-50 dark:hover:bg-green-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow"
                      )}
                    >
                      <span className="text-xl mr-2">{emoji}</span>
                      <span>{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Meal Name */}
              <div>
                <Label className="mb-2 text-gray-700 dark:text-gray-300">
                  Meal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Grilled Chicken Salad"
                  className={cn(
                    errors.name && "border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {errors.name}
                  </p>
                )}
              </div>

              {/* Calories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700 dark:text-gray-300">
                    Calories <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={toggleAutoCalculate}
                    className={cn(
                      "flex items-center gap-2 text-xs px-3 py-1 rounded-full transition-all",
                      autoCalculate
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <Calculator className="w-3 h-3" />
                    {autoCalculate ? "Auto-calculating" : "Auto-calculate"}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      updateValue("calories", formData.calories, -50)
                    }
                    className="bg-gray-100 dark:bg-gray-800 shadow-sm"
                    disabled={autoCalculate}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <Input
                    type="number"
                    value={formData.calories}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calories: Math.max(0, Number(e.target.value)),
                      })
                    }
                    disabled={autoCalculate}
                    className={cn(
                      "text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      errors.calories && "border-red-500 focus:ring-red-500"
                    )}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      updateValue("calories", formData.calories, 50)
                    }
                    className="bg-gray-100 dark:bg-gray-800 shadow-sm"
                    disabled={autoCalculate}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {autoCalculate && (
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1.5 flex items-center gap-1">
                    <Calculator className="w-3 h-3" />
                    Calculated from macros (P: 4 cal/g, C: 4 cal/g, F: 9 cal/g)
                  </p>
                )}
                {errors.calories && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <span className="font-medium">⚠</span> {errors.calories}
                  </p>
                )}
              </div>

              {/* Macros Grid */}
              <div>
                <Label className="mb-3 text-gray-700 dark:text-gray-300">
                  Macronutrients
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <MacroInput
                    label="Protein"
                    emoji="🥩"
                    value={formData.protein}
                    field="protein"
                    step={5}
                    color="red"
                  />
                  <MacroInput
                    label="Carbs"
                    emoji="🌾"
                    value={formData.carbs}
                    field="carbs"
                    step={5}
                    color="yellow"
                  />
                  <MacroInput
                    label="Fat"
                    emoji="🥑"
                    value={formData.fat}
                    field="fat"
                    step={5}
                    color="blue"
                  />
                  <MacroInput
                    label="Fiber"
                    emoji="🥗"
                    value={formData.fiber}
                    field="fiber"
                    step={1}
                    color="green"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Buttons - Show for all modes */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            {inputMode === "manual" && (
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
              >
                <Utensils className="mr-2" />
                Log Meal
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
