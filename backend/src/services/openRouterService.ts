// OpenRouter Service - API key validation and usage tracking
import axios from "axios";
import { encryptApiKey, decryptApiKey } from "./aiService.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterUsage {
  totalRequests: number;
  tokensUsed: {
    input: number;
    output: number;
  };
  lastUpdated: string;
  remainingBalance?: number;
}

export interface OpenRouterValidationResponse {
  valid: boolean;
  error?: string;
}

/**
 * Validate an OpenRouter API key by making a test request
 */
export async function validateOpenRouterKey(
  apiKey: string
): Promise<OpenRouterValidationResponse> {
  try {
    // Make a minimal test request to validate the key
    const response = await axios.get(`${OPENROUTER_API_URL}/auth/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000, // 10 second timeout
    });

    // If we get a 200 response, the key is valid
    if (response.status === 200) {
      return { valid: true };
    }

    return { valid: false, error: "Invalid API key" };
  } catch (error: any) {
    console.error("OpenRouter key validation error:", error.message);

    // Check for specific error codes
    if (error.response?.status === 401 || error.response?.status === 403) {
      return { valid: false, error: "Invalid or unauthorized API key" };
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return { valid: false, error: "Request timeout - please try again" };
    }

    // For network errors or API unavailability, we'll assume the key format is valid
    // but can't be fully verified at this moment
    if (apiKey.startsWith("sk-or-")) {
      return {
        valid: true,
        error: "Key format valid, but couldn't verify with OpenRouter API",
      };
    }

    return { valid: false, error: "Failed to validate API key" };
  }
}

/**
 * Fetch usage data from OpenRouter
 */
export async function fetchOpenRouterUsage(
  apiKey: string
): Promise<OpenRouterUsage> {
  try {
    // Fetch usage statistics from OpenRouter
    const response = await axios.get(`${OPENROUTER_API_URL}/auth/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    const data = response.data;

    // Parse the response to extract usage information
    // Note: Adjust these fields based on actual OpenRouter API response
    const usage: OpenRouterUsage = {
      totalRequests: data.usage?.requests || 0,
      tokensUsed: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
      lastUpdated: new Date().toISOString(),
      remainingBalance: data.limit?.remaining_balance,
    };

    return usage;
  } catch (error: any) {
    console.error("OpenRouter usage fetch error:", error.message);

    // Return default usage data if fetch fails
    return {
      totalRequests: 0,
      tokensUsed: {
        input: 0,
        output: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Encrypt OpenRouter API key for storage
 */
export function encryptOpenRouterKey(apiKey: string): string {
  return encryptApiKey(apiKey);
}

/**
 * Decrypt OpenRouter API key for usage
 */
export function decryptOpenRouterKey(encryptedKey: string): string {
  return decryptApiKey(encryptedKey);
}

export default {
  validateOpenRouterKey,
  fetchOpenRouterUsage,
  encryptOpenRouterKey,
  decryptOpenRouterKey,
};
