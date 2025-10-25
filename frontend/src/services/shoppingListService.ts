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
