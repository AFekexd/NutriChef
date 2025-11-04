import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { toast } from "sonner";
import {
  ShoppingCart,
  Plus,
  X,
  Check,
  Trash2,
  TrendingUp,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollToTop } from "../components/ScrollToTop";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { apiService } from "../services/api";
import { shoppingListService } from "../services/shoppingListService";
import type { InventoryItem } from "../types";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  priority: "high" | "medium" | "low";
  inInventory?: boolean;
  inventoryQuantity?: number;
  isRecipe?: boolean;
  recipeId?: string;
  subItems?: ShoppingItem[];
  isExpanded?: boolean;
}

export function ShoppingListPage() {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "unit",
    category: "other",
  });
  const [servings, setServings] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const showChecked = true;

  // GSAP refs
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadShoppingListData();
    loadInventoryData();
  }, []);

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
          case "a":
            e.preventDefault();
            // Focus on add item input
            document.getElementById("item-name-input")?.focus();
            break;
          case "e":
            e.preventDefault();
            handleExportList();
            break;
        }
      } else if (e.key === "Delete" && shoppingItems.length > 0) {
        // Clear completed items
        const checkedItems = shoppingItems.filter((item) => item.checked);
        if (checkedItems.length > 0) {
          checkedItems.forEach((item) => handleRemoveItem(item.id));
          toast.success(`Removed ${checkedItems.length} completed items`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [shoppingItems]);

  // Show toast for errors and success messages
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      setSuccessMessage(null);
    }
  }, [successMessage]);

  const loadShoppingListData = () => {
    const items = shoppingListService.getItems();
    setShoppingItems(items);
  };

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
    if (listRef.current && shoppingItems.length > 0) {
      const items = listRef.current.querySelectorAll(".shopping-item");
      gsap.fromTo(
        items,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [shoppingItems, groupByCategory]);

  const loadInventoryData = async () => {
    try {
      const items = await apiService.getAllInventoryItems();
      setInventoryItems(items);
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      setError("Failed to load inventory data");
    }
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) return;

    // Check if item exists in inventory
    const inventoryItem = inventoryItems.find(
      (item) =>
        item.ingredient.name.toLowerCase() === newItem.name.toLowerCase()
    );

    const itemToAdd = {
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: inventoryItem?.ingredient.category || newItem.category,
      priority: "medium" as const,
      inInventory: !!inventoryItem,
      inventoryQuantity: inventoryItem?.quantity || 0,
    };

    const addedItem = shoppingListService.addItem(itemToAdd);
    loadShoppingListData();
    setNewItem({ name: "", quantity: 1, unit: "unit", category: "other" });
    setSuccessMessage(`Added "${addedItem.name}" to shopping list`);
  };

  const handleRemoveItem = (id: string) => {
    shoppingListService.removeItem(id);
    loadShoppingListData();
  };

  const handleToggleCheck = (id: string) => {
    const items = shoppingListService.getItems();
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    shoppingListService.saveItems(updatedItems);
    loadShoppingListData();
  };

  const handleToggleExpanded = (id: string) => {
    shoppingListService.toggleExpanded(id);
    loadShoppingListData();
  };

  const handleToggleSubItemCheck = (parentId: string, subItemId: string) => {
    shoppingListService.toggleSubItemCheck(parentId, subItemId);
    loadShoppingListData();
  };

  const handleOptimizePortions = () => {
    const items = shoppingListService.getItems();
    const optimized = items.map((item) => {
      // Simple optimization: round to common package sizes
      let optimizedQty = item.quantity;

      if (item.unit === "g" || item.unit === "ml") {
        // Round to nearest 100
        optimizedQty = Math.ceil(item.quantity / 100) * 100;
      } else if (item.unit === "kg" || item.unit === "l") {
        // Round to nearest 0.5
        optimizedQty = Math.ceil(item.quantity * 2) / 2;
      } else {
        // Round to nearest whole number
        optimizedQty = Math.ceil(item.quantity);
      }

      const optimizedItem = { ...item, quantity: optimizedQty };

      // Also optimize sub-items (recipe ingredients) if they exist
      if (optimizedItem.subItems && optimizedItem.subItems.length > 0) {
        optimizedItem.subItems = optimizedItem.subItems.map((subItem) => {
          let subOptimizedQty = subItem.quantity;

          if (subItem.unit === "g" || subItem.unit === "ml") {
            subOptimizedQty = Math.ceil(subItem.quantity / 100) * 100;
          } else if (subItem.unit === "kg" || subItem.unit === "l") {
            subOptimizedQty = Math.ceil(subItem.quantity * 2) / 2;
          } else {
            subOptimizedQty = Math.ceil(subItem.quantity);
          }

          return { ...subItem, quantity: subOptimizedQty };
        });
      }

      return optimizedItem;
    });

    shoppingListService.saveItems(optimized);
    loadShoppingListData();
    setSuccessMessage("Portions optimized for standard package sizes!");
  };

  const handleAdjustServings = (newServings: number) => {
    if (newServings < 1 || newServings > 20) return;

    const ratio = newServings / servings;
    const items = shoppingListService.getItems();
    const adjusted = items.map((item) => {
      const adjustedItem = {
        ...item,
        quantity: item.quantity * ratio,
      };

      // Also adjust sub-items (recipe ingredients) if they exist
      if (adjustedItem.subItems && adjustedItem.subItems.length > 0) {
        adjustedItem.subItems = adjustedItem.subItems.map((subItem) => ({
          ...subItem,
          quantity: subItem.quantity * ratio,
        }));
      }

      return adjustedItem;
    });

    setServings(newServings);
    shoppingListService.saveItems(adjusted);
    loadShoppingListData();
  };

  const handleClearChecked = () => {
    const items = shoppingListService.getItems();
    const unchecked = items.filter((item) => !item.checked);
    shoppingListService.saveItems(unchecked);
    loadShoppingListData();
    setSuccessMessage("Checked items removed");
  };

  const handleClearCompleted = () => {
    const checkedItems = shoppingItems.filter((item) => item.checked);
    if (checkedItems.length === 0) {
      toast.info("No completed items to clear");
      return;
    }

    checkedItems.forEach((item) => handleRemoveItem(item.id));
    toast.success(`Removed ${checkedItems.length} completed items`);
  };

  const handleExportList = () => {
    const text = shoppingItems
      .map(
        (item) =>
          `${item.checked ? "✓" : "○"} ${item.name} - ${item.quantity} ${
            item.unit
          }`
      )
      .join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Normalize category names to match our predefined categories
  const normalizeCategory = (category: string): string => {
    const normalized = category.toLowerCase().trim();

    // Direct mappings for backend categories
    if (
      normalized === "vegetables" ||
      normalized === "fruits" ||
      normalized.includes("produce")
    ) {
      return "produce";
    }
    if (
      normalized === "meat" ||
      normalized === "poultry" ||
      normalized === "fish" ||
      normalized === "seafood"
    ) {
      return "meat";
    }
    if (
      normalized === "grains" ||
      normalized === "bread" ||
      normalized === "pasta" ||
      normalized === "rice" ||
      normalized === "cereal"
    ) {
      return "grains";
    }
    if (
      normalized === "oils" ||
      normalized === "spices" ||
      normalized === "herbs" ||
      normalized === "condiments" ||
      normalized === "sauces"
    ) {
      return "pantry";
    }
    if (
      normalized === "dairy" ||
      normalized.includes("milk") ||
      normalized.includes("cheese") ||
      normalized.includes("egg")
    ) {
      return "dairy";
    }
    if (normalized.includes("frozen")) {
      return "frozen";
    }
    if (
      normalized.includes("beverage") ||
      normalized.includes("drink") ||
      normalized.includes("juice")
    ) {
      return "beverages";
    }

    return "other";
  };

  const groupedItems = groupByCategory
    ? shoppingItems.reduce((acc, item) => {
        const category = normalizeCategory(item.category || "other");
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {} as Record<string, ShoppingItem[]>)
    : { all: shoppingItems };

  const categories = {
    recipes: "Recipes",
    produce: "Fruits & Vegetables",
    dairy: "Dairy & Eggs",
    meat: "Meat & Seafood",
    grains: "Grains & Bread",
    pantry: "Pantry",
    frozen: "Frozen Foods",
    beverages: "Beverages",
    other: "Other",
  };

  const stats = {
    total: shoppingItems.length,
    checked: shoppingItems.filter((i) => i.checked).length,
    inInventory: shoppingItems.filter((i) => i.inInventory).length,
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 pt-0 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Breadcrumbs />
        {/* Header */}
        <div ref={headerRef} className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-600 bg-clip-text text-transparent">
                Shopping List
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleClearCompleted}
                variant="outline"
                disabled={shoppingItems.filter((i) => i.checked).length === 0}
                className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Completed
              </Button>
              <Button
                onClick={handleExportList}
                variant="outline"
                disabled={shoppingItems.length === 0}
                className="border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Smart shopping lists with portion optimization for {servings}{" "}
            servings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Shopping List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Total Items
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.checked}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Checked
                </div>
              </Card>
              <Card className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.inInventory}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  In Stock
                </div>
              </Card>
            </div>

            {/* Controls */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleOptimizePortions}
                  disabled={shoppingItems.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-500 dark:to-green-500 text-white hover:from-blue-700 hover:to-green-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Optimize Portions
                </Button>
                <Button
                  onClick={() => setGroupByCategory(!groupByCategory)}
                  variant="outline"
                >
                  {groupByCategory ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Ungroup
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Group by Category
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleClearChecked}
                  disabled={stats.checked === 0}
                  variant="outline"
                  className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Checked
                </Button>
              </div>
            </Card>

            {/* Shopping Items */}
            <div ref={listRef} className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => {
                const displayItems = showChecked
                  ? items
                  : items.filter((i) => !i.checked);

                if (displayItems.length === 0) return null;

                return (
                  <Card key={category} className="p-6">
                    {groupByCategory && (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {categories[category as keyof typeof categories] ||
                          "Other"}
                      </h3>
                    )}
                    <div className="space-y-2">
                      {displayItems.map((item) => (
                        <div key={item.id} className="shopping-item">
                          {/* Main Item */}
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              item.checked
                                ? "bg-gray-50 dark:bg-gray-800 opacity-60"
                                : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            {/* Expand/Collapse Button for Recipes */}
                            {item.isRecipe &&
                              item.subItems &&
                              item.subItems.length > 0 && (
                                <button
                                  onClick={() => handleToggleExpanded(item.id)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
                                >
                                  {item.isExpanded ? (
                                    <ChevronUp className="w-5 h-5" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5" />
                                  )}
                                </button>
                              )}

                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleCheck(item.id)}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                item.checked
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                              }`}
                            >
                              {item.checked && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </button>

                            {/* Item Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium ${
                                    item.checked
                                      ? "line-through text-gray-500 dark:text-gray-500"
                                      : "text-gray-900 dark:text-gray-100"
                                  }`}
                                >
                                  {item.isRecipe && "📖 "}
                                  {item.name}
                                </span>
                                {item.isRecipe && item.subItems && (
                                  <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                                    {item.subItems.length} ingredients
                                  </Badge>
                                )}
                                {item.inInventory && !item.isRecipe && (
                                  <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs">
                                    In Stock: {item.inventoryQuantity}{" "}
                                    {item.unit}
                                  </Badge>
                                )}
                              </div>
                              {!item.isRecipe && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.quantity} {item.unit}
                                </span>
                              )}
                            </div>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Sub-items (Ingredients) - Accordion Content */}
                          {item.isRecipe &&
                            item.subItems &&
                            item.isExpanded && (
                              <div className="ml-11 mt-2 space-y-2 border-l-2 border-purple-200 dark:border-purple-800 pl-4">
                                {item.subItems.map((subItem) => (
                                  <div
                                    key={subItem.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                                      subItem.checked
                                        ? "bg-gray-50 dark:bg-gray-800 opacity-60"
                                        : "bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    {/* Sub-item Checkbox */}
                                    <button
                                      onClick={() =>
                                        handleToggleSubItemCheck(
                                          item.id,
                                          subItem.id
                                        )
                                      }
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                        subItem.checked
                                          ? "bg-green-500 border-green-500"
                                          : "border-gray-300 dark:border-gray-600 hover:border-green-500"
                                      }`}
                                    >
                                      {subItem.checked && (
                                        <Check className="w-3 h-3 text-white" />
                                      )}
                                    </button>

                                    {/* Sub-item Info */}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-sm font-medium ${
                                            subItem.checked
                                              ? "line-through text-gray-500 dark:text-gray-500"
                                              : "text-gray-800 dark:text-gray-200"
                                          }`}
                                        >
                                          {subItem.name}
                                        </span>
                                        {subItem.inInventory && (
                                          <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs">
                                            In Stock
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {subItem.quantity} {subItem.unit}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}

              {shoppingItems.length === 0 && (
                <Card className="p-12 text-center">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Your shopping list is empty
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add items to start building your smart shopping list
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add Item */}
            <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-900/5 border-gray-200 dark:border-gray-800 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Add Item
              </h2>

              <div className="space-y-3">
                <input
                  id="item-name-input"
                  type="text"
                  placeholder="Item name (Ctrl+A)"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
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
                </div>
                <Button
                  onClick={handleAddItem}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to List
                </Button>
              </div>
            </Card>

            {/* Servings Adjuster */}
            <Card className="p-6 dark:text-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                Adjust Servings
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleAdjustServings(servings - 1)}
                  disabled={servings <= 1}
                  variant="outline"
                  size="sm"
                >
                  -
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {servings}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    servings
                  </div>
                </div>
                <Button
                  onClick={() => handleAdjustServings(servings + 1)}
                  disabled={servings >= 20}
                  variant="outline"
                  size="sm"
                >
                  +
                </Button>
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-green-200 dark:border-green-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                Smart Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Optimize portions for standard package sizes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Items in your inventory are highlighted</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Adjust servings to scale quantities</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Export your list to share or print</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
}
