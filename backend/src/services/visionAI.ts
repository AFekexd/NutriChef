// Vision AI Service for Ingredient Detection from Images
import vision from "@google-cloud/vision";
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import fs from "fs/promises";

// Initialize Google Cloud Vision (requires credentials)
let visionClient: vision.ImageAnnotatorClient | null = null;

try {
  // Try to initialize with credentials
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    visionClient = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_CLOUD_CREDENTIALS,
    });
  }
} catch (error) {
  console.warn("Google Cloud Vision not initialized. Using Gemini fallback.");
}

// Initialize Gemini as fallback
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// OpenRouter configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface DetectedItem {
  name: string;
  confidence: number;
  category: string;
  quantity?: number;
  unit?: string;
  estimatedExpiry?: number; // Days
  location?: "fridge" | "pantry" | "freezer";
}

export interface DetectionResult {
  items: DetectedItem[];
  imageUrl: string;
  processingTime: number;
  aiService: "google_vision" | "gemini" | "openrouter";
  totalItemsDetected: number;
}

class VisionAIService {
  private customApiKey?: string;
  private provider: "default" | "gemini" | "openrouter" = "default";
  private openRouterModel?: string;

  // Set custom API key for this service instance
  setCustomApiKey(apiKey: string | undefined) {
    this.customApiKey = apiKey;
  }

  // Set provider for vision detection
  setProvider(provider: "default" | "gemini" | "openrouter", model?: string) {
    this.provider = provider;
    if (model) {
      this.openRouterModel = model;
    }
  }

  // Compress and optimize uploaded image
  async optimizeImage(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }

  // Method 1: Google Cloud Vision API (most accurate)
  async detectWithGoogleVision(imagePath: string): Promise<DetectedItem[]> {
    if (!visionClient) {
      throw new Error("Google Cloud Vision not configured");
    }

    const [result] = await visionClient.labelDetection(imagePath);
    const labels = result.labelAnnotations || [];

    // Filter for food-related labels
    const foodKeywords = [
      "food",
      "fruit",
      "vegetable",
      "ingredient",
      "produce",
      "grocery",
    ];
    const foodLabels = labels.filter((label) => {
      const desc = label.description?.toLowerCase() || "";
      return (
        foodKeywords.some((keyword) => desc.includes(keyword)) ||
        (label.score || 0) > 0.7
      );
    });

    // Additional OCR for packaged foods
    const [textResult] = await visionClient.textDetection(imagePath);
    const text = textResult.fullTextAnnotation?.text || "";

    // Combine label detection with text detection
    const detectedItems: DetectedItem[] = foodLabels.map((label) => ({
      name: label.description || "Unknown",
      confidence: (label.score || 0) * 100,
      category: this.categorizeItem(label.description || ""),
      location: this.guessLocation(label.description || ""),
    }));

    // Parse text for additional items and expiry dates
    const textItems = this.parseTextForItems(text);
    detectedItems.push(...textItems);

    return this.deduplicateItems(detectedItems);
  }

  // Method 2: Gemini Vision (free, good quality)
  async detectWithGemini(
    imagePath: string,
    language: string = "en"
  ): Promise<DetectedItem[]> {
    try {
      // Use custom API key if provided, otherwise use default
      const geminiClient = this.customApiKey
        ? new GoogleGenerativeAI(this.customApiKey)
        : gemini;

      // Use gemini-1.5-flash for vision + text generation
      const model = geminiClient.getGenerativeModel({
        model: "gemini-flash-lite",
      });

      // Read image as base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString("base64");

      // Detect mime type from file extension
      const mimeType = imagePath.toLowerCase().endsWith(".png")
        ? "image/png"
        : imagePath.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

      // Language-specific instructions
      const languageInstructions =
        language === "hu"
          ? "Válaszolj magyarul. Minden élelmiszernév és kategória magyar nyelvű legyen."
          : "Respond in English. All food item names and categories should be in English.";

      const prompt = `Analyze this image of a fridge, pantry, or food storage area. 
${languageInstructions}
List all visible food items and ingredients you can identify.

For each item, provide:
1. Name of the item
2. Confidence level (0-100)
3. Category (fruit, vegetable, dairy, meat, grains, etc.)
4. Estimated quantity if visible (e.g., "3 apples", "1 bottle")
5. Storage location (fridge, pantry, or freezer based on item type)
6. Estimated days until expiry (rough estimate based on item type)

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Apple",
    "confidence": 95,
    "category": "fruit",
    "quantity": 3,
    "unit": "whole",
    "estimatedExpiry": 7,
    "location": "fridge"
  }
]

Be specific (e.g., "Red Apple" not just "Fruit"). Only include items you can clearly see.
${
  language === "hu"
    ? "FONTOS: Minden név magyarul legyen!"
    : "IMPORTANT: All names should be in English!"
}`;

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image,
          },
        },
        { text: prompt },
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      return this.parseGeminiResponse(text);
    } catch (error: any) {
      console.error("Gemini detection error:", error);
      throw new Error(`Gemini Vision failed: ${error.message}`);
    }
  }

  // Parse Gemini's JSON response
  private parseGeminiResponse(text: string): DetectedItem[] {
    try {
      // Remove markdown code blocks if present
      let cleaned = text.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      const items = JSON.parse(cleaned);

      if (!Array.isArray(items)) {
        throw new Error("Response is not an array");
      }

      return items.map((item: any) => ({
        name: item.name || "Unknown",
        confidence: item.confidence || 50,
        category: item.category || "other",
        quantity: item.quantity,
        unit: item.unit,
        estimatedExpiry: item.estimatedExpiry,
        location: item.location || "fridge",
      }));
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return [];
    }
  }

  // Detect with OpenRouter vision model
  async detectWithOpenRouter(
    imagePath: string,
    language: string = "en",
    apiKey: string,
    model: string = "google/gemini-flash-1.5-8b"
  ): Promise<DetectedItem[]> {
    try {
      console.log(`[OpenRouter Vision] Analyzing image with ${model}...`);

      // Read and encode image as base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString("base64");
      const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

      // Create the prompt for ingredient detection
      const languageInstructions =
        language === "en"
          ? "Respond in English."
          : language === "es"
          ? "Respond in Spanish."
          : language === "fr"
          ? "Respond in French."
          : language === "de"
          ? "Respond in German."
          : language === "it"
          ? "Respond in Italian."
          : language === "pt"
          ? "Respond in Portuguese."
          : language === "ja"
          ? "Respond in Japanese."
          : language === "ko"
          ? "Respond in Korean."
          : language === "zh"
          ? "Respond in Chinese."
          : "Respond in English.";

      const prompt = `You are a food detection AI. Analyze this image and detect all food items, ingredients, or beverages visible.

For each item detected, provide:
- name: The name of the item
- confidence: Confidence level (0-100)
- category: One of: fruit, vegetable, dairy, meat, grains, beverage, condiment, or other
- quantity: Estimated quantity (if visible)
- unit: Unit of measurement (whole, kg, liter, etc.)
- estimatedExpiry: Estimated days until expiry (based on item type)
- location: Suggested storage location (fridge, pantry, or freezer)

${languageInstructions}

Return ONLY a JSON array of objects, no additional text. Example:
[{"name":"Milk","confidence":95,"category":"dairy","quantity":1,"unit":"liter","estimatedExpiry":7,"location":"fridge"}]`;

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
          "X-Title": "NutriChef - Inventory Detection",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `OpenRouter API error: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No response from OpenRouter");
      }

      console.log("[OpenRouter Vision] Raw response:", content);

      // Parse the response
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const items = JSON.parse(cleaned);

      if (!Array.isArray(items)) {
        throw new Error("Response is not an array");
      }

      return items.map((item: any) => ({
        name: item.name || "Unknown",
        confidence: item.confidence || 50,
        category: item.category || "other",
        quantity: item.quantity,
        unit: item.unit,
        estimatedExpiry: item.estimatedExpiry,
        location: item.location || "fridge",
      }));
    } catch (error) {
      console.error("Failed to analyze with OpenRouter vision:", error);
      throw error;
    }
  }

  // Main detection method (uses provider setting)
  async detectIngredients(
    imagePath: string,
    language: string = "en"
  ): Promise<DetectionResult> {
    const startTime = Date.now();
    let items: DetectedItem[] = [];
    let aiService: "google_vision" | "gemini" | "openrouter" = "gemini";

    try {
      // Use provider-specific detection
      if (
        this.provider === "openrouter" &&
        this.customApiKey &&
        this.openRouterModel
      ) {
        items = await this.detectWithOpenRouter(
          imagePath,
          language,
          this.customApiKey,
          this.openRouterModel
        );
        aiService = "openrouter";
      } else if (this.provider === "gemini" || this.provider === "default") {
        // Try Gemini first (free and good)
        items = await this.detectWithGemini(imagePath, language);
        aiService = "gemini";
      } else {
        // Fallback to Google Vision if available
        if (visionClient) {
          items = await this.detectWithGoogleVision(imagePath);
          aiService = "google_vision";
        } else {
          throw new Error("No vision AI service available");
        }
      }
    } catch (primaryError) {
      console.log(
        `Primary AI service (${this.provider}) failed, trying fallback...`
      );

      // Fallback logic
      if (this.provider === "openrouter") {
        // Fallback to Gemini
        try {
          items = await this.detectWithGemini(imagePath, language);
          aiService = "gemini";
        } catch (geminiError) {
          // Final fallback to Google Vision
          if (visionClient) {
            items = await this.detectWithGoogleVision(imagePath);
            aiService = "google_vision";
          } else {
            throw primaryError;
          }
        }
      } else if (visionClient) {
        // If Gemini failed, try Google Vision
        try {
          items = await this.detectWithGoogleVision(imagePath);
          aiService = "google_vision";
        } catch (visionError) {
          console.error("All AI services failed:", visionError);
          throw new Error("All AI services failed");
        }
      } else {
        throw primaryError;
      }
    }

    const processingTime = (Date.now() - startTime) / 1000;

    return {
      items: items.filter((item) => item.confidence > 40), // Filter low confidence
      imageUrl: imagePath,
      processingTime,
      aiService,
      totalItemsDetected: items.length,
    };
  }

  // Helper: Categorize item based on name
  private categorizeItem(name: string): string {
    const lower = name.toLowerCase();

    const categories: { [key: string]: string[] } = {
      fruit: [
        "apple",
        "banana",
        "orange",
        "berry",
        "grape",
        "melon",
        "peach",
        "pear",
      ],
      vegetable: [
        "carrot",
        "lettuce",
        "tomato",
        "broccoli",
        "spinach",
        "pepper",
        "onion",
      ],
      dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
      meat: ["chicken", "beef", "pork", "fish", "turkey", "lamb"],
      grains: ["bread", "rice", "pasta", "cereal", "flour"],
      beverage: ["juice", "soda", "water", "tea", "coffee"],
      condiment: ["sauce", "ketchup", "mustard", "mayo", "dressing"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return category;
      }
    }

    return "other";
  }

  // Helper: Guess storage location based on item type
  private guessLocation(name: string): "fridge" | "pantry" | "freezer" {
    const lower = name.toLowerCase();

    const fridgeItems = [
      "milk",
      "cheese",
      "yogurt",
      "butter",
      "meat",
      "fish",
      "vegetable",
      "fruit",
    ];
    const freezerItems = ["frozen", "ice", "frozen"];
    const pantryItems = ["rice", "pasta", "flour", "cereal", "canned", "jar"];

    if (freezerItems.some((item) => lower.includes(item))) return "freezer";
    if (fridgeItems.some((item) => lower.includes(item))) return "fridge";
    if (pantryItems.some((item) => lower.includes(item))) return "pantry";

    return "fridge"; // Default
  }

  // Helper: Parse OCR text for items
  private parseTextForItems(text: string): DetectedItem[] {
    const items: DetectedItem[] = [];
    const lines = text.split("\n");

    // Look for common food words and expiry dates
    const foodRegex = /\b(milk|bread|cheese|eggs|butter|juice)\b/gi;
    const expiryRegex = /exp[iry]*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i;

    for (const line of lines) {
      const foodMatch = line.match(foodRegex);
      if (foodMatch) {
        items.push({
          name: foodMatch[0],
          confidence: 60,
          category: this.categorizeItem(foodMatch[0]),
          location: this.guessLocation(foodMatch[0]),
        });
      }

      // Extract expiry dates (could be associated with detected items)
      const expiryMatch = line.match(expiryRegex);
      if (expiryMatch && expiryMatch[1] && items.length > 0) {
        // Associate with last detected item
        const expiryDate = new Date(expiryMatch[1]);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const lastItem = items[items.length - 1];
        if (lastItem) {
          lastItem.estimatedExpiry = daysUntilExpiry;
        }
      }
    }

    return items;
  }

  // Helper: Remove duplicate items
  private deduplicateItems(items: DetectedItem[]): DetectedItem[] {
    const seen = new Map<string, DetectedItem>();

    for (const item of items) {
      const key = item.name.toLowerCase();
      const existing = seen.get(key);

      if (!existing || item.confidence > existing.confidence) {
        seen.set(key, item);
      }
    }

    return Array.from(seen.values());
  }

  // Batch process multiple images
  async detectFromMultipleImages(
    imagePaths: string[]
  ): Promise<DetectionResult[]> {
    const results = await Promise.all(
      imagePaths.map((path) => this.detectIngredients(path))
    );

    return results;
  }
}

export default new VisionAIService();
