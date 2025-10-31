/**
 * Local storage utilities with type safety and error handling
 */

/**
 * Save data to localStorage
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Load data from localStorage
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove item from localStorage
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
}

/**
 * Clear all localStorage
 */
export function clearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage size in bytes
 */
export function getStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += key.length + (localStorage.getItem(key)?.length || 0);
    }
  }
  return total;
}

/**
 * Storage keys constants (centralized management)
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "nutrichef_auth_token",
  USER_PROFILE: "nutrichef_user_profile",
  THEME: "nutrichef_theme",
  LANGUAGE: "nutrichef_language",
  SHOPPING_LIST: "nutrichef_shopping_list",
  REMEMBER_ME: "nutrichef_remember_me",
  RECENT_SEARCHES: "nutrichef_recent_searches",
  FAVORITES: "nutrichef_favorites",
} as const;
