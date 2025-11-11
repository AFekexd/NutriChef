// AI Service Selector - Determines which AI service to use based on user preferences
import { PrismaClient } from "../../generated/prisma/index.js";
import { decryptApiKey } from "./aiService.js";
import { decryptOpenRouterKey } from "./openRouterService.js";
import axios from "axios";

const prisma = new PrismaClient();

export interface AIServiceConfig {
  provider: "openai" | "gemini" | "openrouter" | "default";
  apiKey?: string;
  model?: string;
  useCustomKey: boolean;
}

export type AIFeatureType = "textGeneration" | "imageAnalysis";

/**
 * Get the AI service configuration for a specific user and feature
 * @param userId - The user's ID
 * @param featureType - The type of feature (textGeneration or imageAnalysis)
 * @returns AI service configuration
 */
export async function getAIServiceConfig(
  userId: string,
  featureType: AIFeatureType
): Promise<AIServiceConfig> {
  try {
    // Fetch user's AI preferences and API keys
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        aiPreferences: true,
        aiApiKey: true,
        aiProvider: true,
        openrouterApiKey: true,
        openrouterModel: true,
      },
    });

    if (!user) {
      // User not found, use default
      return {
        provider: "default",
        useCustomKey: false,
      };
    }

    // Parse AI preferences
    const preferences = (user.aiPreferences as any) || {
      textGeneration: "default",
      imageAnalysis: "default",
    };

    const userPreference = preferences[featureType] || "default";

    // Handle different preference options
    switch (userPreference) {
      case "own":
        // Use user's own API key
        if (user.aiApiKey && user.aiProvider) {
          const decryptedKey = decryptApiKey(user.aiApiKey);
          return {
            provider: user.aiProvider as "openai" | "gemini",
            apiKey: decryptedKey,
            useCustomKey: true,
          };
        }
        // Fallback to default if no key configured
        console.warn(
          `User ${userId} prefers own API key but none configured, using default`
        );
        return {
          provider: "default",
          useCustomKey: false,
        };

      case "openrouter":
        // Use OpenRouter
        if (user.openrouterApiKey) {
          const decryptedKey = decryptOpenRouterKey(user.openrouterApiKey);
          return {
            provider: "openrouter",
            apiKey: decryptedKey,
            model: user.openrouterModel || undefined,
            useCustomKey: true,
          };
        }
        // Fallback to default if no OpenRouter key configured
        console.warn(
          `User ${userId} prefers OpenRouter but not configured, using default`
        );
        return {
          provider: "default",
          useCustomKey: false,
        };

      case "default":
      default:
        // Use system default
        return {
          provider: "default",
          useCustomKey: false,
        };
    }
  } catch (error) {
    console.error("Error getting AI service config:", error);
    // Fallback to default on error
    return {
      provider: "default",
      useCustomKey: false,
    };
  }
}

/**
 * Make an OpenRouter API call
 * @param apiKey - OpenRouter API key
 * @param model - Model to use
 * @param messages - Chat messages
 * @param temperature - Temperature setting
 * @param maxTokens - Max tokens
 * @returns API response
 */
export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<any> {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "NutriChef",
        },
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || "",
      tokensUsed: response.data.usage?.total_tokens || 0,
      model: response.data.model,
      usingCustomKey: true,
    };
  } catch (error: any) {
    console.error(
      "OpenRouter API Error:",
      error.response?.data || error.message
    );
    throw new Error(
      `OpenRouter API Error: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
}

/**
 * Make an OpenRouter vision API call for image analysis
 * @param apiKey - OpenRouter API key
 * @param model - Model to use (should support vision)
 * @param imageUrl - URL of the image to analyze
 * @param prompt - Analysis prompt
 * @returns API response
 */
export async function callOpenRouterVision(
  apiKey: string,
  model: string,
  imageUrl: string,
  prompt: string
): Promise<any> {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model || "openai/gpt-4-vision-preview", // Default to GPT-4 Vision
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
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "NutriChef",
        },
      }
    );

    return {
      content: response.data.choices[0]?.message?.content || "",
      tokensUsed: response.data.usage?.total_tokens || 0,
      model: response.data.model,
      usingCustomKey: true,
    };
  } catch (error: any) {
    console.error(
      "OpenRouter Vision API Error:",
      error.response?.data || error.message
    );
    throw new Error(
      `OpenRouter Vision API Error: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
}

export default {
  getAIServiceConfig,
  callOpenRouter,
  callOpenRouterVision,
};
