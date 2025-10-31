// Shopping List Service - Manages shopping list in localStorage
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
  isRecipe?: boolean; // Flag to indicate this is a recipe parent item
  recipeId?: string; // ID of the recipe if applicable
  subItems?: ShoppingItem[]; // Sub-items (ingredients) for recipes
  isExpanded?: boolean; // Accordion state
}

const STORAGE_KEY = "nutrichef_shopping_list";

export const shoppingListService = {
  // Get all items from localStorage
  getItems(): ShoppingItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading shopping list:", error);
      return [];
    }
  },

  // Save items to localStorage
  saveItems(items: ShoppingItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving shopping list:", error);
    }
  },

  // Add a single item to the shopping list
  addItem(item: Omit<ShoppingItem, "id" | "checked">): ShoppingItem {
    const items = this.getItems();

    // Check if item already exists (by name)
    const existingItem = items.find(
      (i) => i.name.toLowerCase() === item.name.toLowerCase()
    );

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity += item.quantity;
      this.saveItems(items);
      return existingItem;
    }

    // Add new item
    const newItem: ShoppingItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      checked: false,
    };

    items.push(newItem);
    this.saveItems(items);
    return newItem;
  },

  // Add multiple items at once
  addMultipleItems(itemsToAdd: Omit<ShoppingItem, "id" | "checked">[]): number {
    const items = this.getItems();
    let addedCount = 0;

    itemsToAdd.forEach((itemToAdd) => {
      const existingItem = items.find(
        (i) => i.name.toLowerCase() === itemToAdd.name.toLowerCase()
      );

      if (existingItem) {
        existingItem.quantity += itemToAdd.quantity;
      } else {
        const newItem: ShoppingItem = {
          ...itemToAdd,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          checked: false,
        };
        items.push(newItem);
        addedCount++;
      }
    });

    this.saveItems(items);
    return addedCount;
  },

  // Add a recipe with its ingredients as sub-items
  addRecipe(
    recipeName: string,
    recipeId: string,
    ingredients: Omit<ShoppingItem, "id" | "checked">[]
  ): ShoppingItem {
    const items = this.getItems();

    // Check if recipe already exists
    const existingRecipe = items.find(
      (i) => i.isRecipe && i.recipeId === recipeId
    );

    if (existingRecipe) {
      // Update existing recipe - merge ingredients
      if (existingRecipe.subItems) {
        ingredients.forEach((newIng) => {
          const existingIng = existingRecipe.subItems!.find(
            (si) => si.name.toLowerCase() === newIng.name.toLowerCase()
          );
          if (existingIng) {
            existingIng.quantity += newIng.quantity;
          } else {
            existingRecipe.subItems!.push({
              ...newIng,
              id:
                Date.now().toString() + Math.random().toString(36).substr(2, 9),
              checked: false,
            });
          }
        });
      }
      this.saveItems(items);
      return existingRecipe;
    }

    // Create new recipe item with sub-items
    const newRecipe: ShoppingItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: recipeName,
      quantity: 1,
      unit: "recipe",
      category: "recipes",
      checked: false,
      priority: "medium",
      isRecipe: true,
      recipeId,
      isExpanded: true, // Start expanded
      subItems: ingredients.map((ing) => ({
        ...ing,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        checked: false,
      })),
    };

    items.push(newRecipe);
    this.saveItems(items);
    return newRecipe;
  },

  // Toggle expansion state of a recipe item
  toggleExpanded(id: string): void {
    const items = this.getItems();
    const item = items.find((i) => i.id === id);
    if (item && item.isRecipe) {
      item.isExpanded = !item.isExpanded;
      this.saveItems(items);
    }
  },

  // Toggle check state of a sub-item
  toggleSubItemCheck(parentId: string, subItemId: string): void {
    const items = this.getItems();
    const parent = items.find((i) => i.id === parentId);
    if (parent && parent.subItems) {
      const subItem = parent.subItems.find((si) => si.id === subItemId);
      if (subItem) {
        subItem.checked = !subItem.checked;
        // Update parent checked state based on all sub-items
        parent.checked = parent.subItems.every((si) => si.checked);
        this.saveItems(items);
      }
    }
  },

  // Remove item by id
  removeItem(id: string): void {
    const items = this.getItems().filter((item) => item.id !== id);
    this.saveItems(items);
  },

  // Clear all items
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
