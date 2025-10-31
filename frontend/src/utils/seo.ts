/**
 * SEO and meta tag utilities
 */

interface MetaTagsConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "recipe";
}

/**
 * Update page meta tags for SEO
 */
export function updateMetaTags(config: MetaTagsConfig): void {
  const {
    title = "NutriChef - Smart Meal Planning & Recipe Management",
    description = "Discover, plan, and cook delicious meals with NutriChef. AI-powered recipe recommendations, smart inventory management, and personalized meal planning.",
    keywords = [
      "meal planning",
      "recipe management",
      "cooking",
      "nutrition",
      "AI recipes",
    ],
    image = "/og-image.png",
    url = window.location.href,
    type = "website",
  } = config;

  // Update document title
  document.title = title;

  // Helper to update or create meta tag
  const setMetaTag = (selector: string, content: string) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      const attrName = selector.includes("property") ? "property" : "name";
      const attrValue = selector.match(/["']([^"']+)["']/)?.[1] || "";
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  // Standard meta tags
  setMetaTag('meta[name="description"]', description);
  setMetaTag('meta[name="keywords"]', keywords.join(", "));

  // Open Graph tags (Facebook, LinkedIn, etc.)
  setMetaTag('meta[property="og:title"]', title);
  setMetaTag('meta[property="og:description"]', description);
  setMetaTag('meta[property="og:image"]', image);
  setMetaTag('meta[property="og:url"]', url);
  setMetaTag('meta[property="og:type"]', type);
  setMetaTag('meta[property="og:site_name"]', "NutriChef");

  // Twitter Card tags
  setMetaTag('meta[name="twitter:card"]', "summary_large_image");
  setMetaTag('meta[name="twitter:title"]', title);
  setMetaTag('meta[name="twitter:description"]', description);
  setMetaTag('meta[name="twitter:image"]', image);
}

/**
 * Generate meta tags for recipe page
 */
export function recipeMetaTags(recipe: {
  name: string;
  description?: string;
  image?: string;
  cookTime?: number;
  servings?: number;
}) {
  const description =
    recipe.description ||
    `Learn how to make ${recipe.name}. ${
      recipe.cookTime ? `Ready in ${recipe.cookTime} minutes.` : ""
    } ${recipe.servings ? `Serves ${recipe.servings}.` : ""}`;

  updateMetaTags({
    title: `${recipe.name} - NutriChef Recipe`,
    description,
    keywords: ["recipe", recipe.name, "cooking", "food", "meal"],
    image: recipe.image,
    type: "article",
  });
}

/**
 * Generate structured data (JSON-LD) for recipes
 */
export function generateRecipeSchema(recipe: {
  name: string;
  description?: string;
  image?: string;
  cookTime?: number;
  prepTime?: number;
  totalTime?: number;
  servings?: number;
  calories?: number;
  ingredients?: string[];
  instructions?: string[];
  rating?: number;
  reviewCount?: number;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description,
    image: recipe.image ? [recipe.image] : [],
    cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
    prepTime: recipe.prepTime ? `PT${recipe.prepTime}M` : undefined,
    totalTime: recipe.totalTime ? `PT${recipe.totalTime}M` : undefined,
    recipeYield: recipe.servings?.toString(),
    nutrition: recipe.calories
      ? {
          "@type": "NutritionInformation",
          calories: `${recipe.calories} calories`,
        }
      : undefined,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions?.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    })),
    aggregateRating:
      recipe.rating && recipe.reviewCount
        ? {
            "@type": "AggregateRating",
            ratingValue: recipe.rating,
            reviewCount: recipe.reviewCount,
          }
        : undefined,
  };

  // Remove undefined fields
  Object.keys(schema).forEach(
    (key) =>
      schema[key as keyof typeof schema] === undefined &&
      delete schema[key as keyof typeof schema]
  );

  // Update or create script tag
  let scriptTag = document.querySelector('script[type="application/ld+json"]');
  if (!scriptTag) {
    scriptTag = document.createElement("script");
    scriptTag.setAttribute("type", "application/ld+json");
    document.head.appendChild(scriptTag);
  }
  scriptTag.textContent = JSON.stringify(schema);
}
