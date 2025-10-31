/**
 * Print utility for recipes and meal plans
 */

/**
 * Trigger print dialog with custom print styles
 */
export function printPage(): void {
  window.print();
}

/**
 * Print recipe with formatted layout
 */
export function printRecipe(recipeId: number): void {
  // Store current scroll position
  const scrollPos = window.scrollY;

  // Add print-only class to body
  document.body.classList.add("printing-recipe");

  // Trigger print
  window.print();

  // Restore state after print dialog closes
  setTimeout(() => {
    document.body.classList.remove("printing-recipe");
    window.scrollTo(0, scrollPos);
  }, 100);
}

/**
 * Print shopping list
 */
export function printShoppingList(): void {
  document.body.classList.add("printing-shopping-list");
  window.print();
  setTimeout(() => {
    document.body.classList.remove("printing-shopping-list");
  }, 100);
}

/**
 * Print meal plan for current week
 */
export function printMealPlan(): void {
  document.body.classList.add("printing-meal-plan");
  window.print();
  setTimeout(() => {
    document.body.classList.remove("printing-meal-plan");
  }, 100);
}
