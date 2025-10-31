import { toast } from "sonner";

/**
 * Copy text to clipboard with user feedback
 */
export async function copyToClipboard(
  text: string,
  successMessage = "Copied to clipboard!"
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
    return true;
  } catch (error) {
    toast.error("Failed to copy to clipboard");
    console.error("Clipboard error:", error);
    return false;
  }
}

/**
 * Copy recipe URL to clipboard
 */
export function copyRecipeUrl(recipeId: number): void {
  const url = `${window.location.origin}/recipes/${recipeId}`;
  copyToClipboard(url, "Recipe link copied!");
}

/**
 * Copy shopping list to clipboard
 */
export function copyShoppingList(
  items: { name: string; quantity?: number; unit?: string }[]
): void {
  const text = items
    .map((item) => {
      const qty = item.quantity
        ? `${item.quantity}${item.unit ? " " + item.unit : ""}`
        : "";
      return `- ${item.name}${qty ? ` (${qty})` : ""}`;
    })
    .join("\n");

  copyToClipboard(text, "Shopping list copied!");
}
