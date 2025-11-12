// OpenRouter Service - API key validation and usage tracking
import axios from "axios";
import { OpenRouter } from "@openrouter/sdk";
import {
  encryptKey,
  decryptKey,
  type EncryptedData,
} from "../utils/encryption.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterKeyInfo {
  label: string;
  limit: number | null; // Credit limit for the key, or null if unlimited
  limit_reset: string | null; // Type of limit reset for the key, or null if never resets
  limit_remaining: number | null; // Remaining credits for the key, or null if unlimited
  include_byok_in_limit: boolean; // Whether to include external BYOK usage in the credit limit
  usage: number; // Number of credits used (all time)
  usage_daily: number; // Number of credits used (current UTC day)
  usage_weekly: number; // Number of credits used (current UTC week, starting Monday)
  usage_monthly: number; // Number of credits used (current UTC month)
  byok_usage: number; // Same for external BYOK usage
  byok_usage_daily: number;
  byok_usage_weekly: number;
  byok_usage_monthly: number;
  is_free_tier: boolean; // Whether the user has paid for credits before
}

export interface OpenRouterUsage {
  totalRequests: number;
  tokensUsed: {
    input: number;
    output: number;
  };
  lastUpdated: string;
  remainingBalance?: number;
  // Enhanced fields from SDK
  keyInfo?: OpenRouterKeyInfo;
}

export interface OpenRouterValidationResponse {
  valid: boolean;
  error?: string;
  keyInfo?: OpenRouterKeyInfo;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/**
 * Validate an OpenRouter API key by making a test request using the SDK
 */
export async function validateOpenRouterKey(
  apiKey: string
): Promise<OpenRouterValidationResponse> {
  try {
    // Create OpenRouter client
    const openRouter = new OpenRouter({
      apiKey: apiKey,
    });

    // Get key information using the SDK
    // Note: The SDK method might be different, let's use the raw API call for now
    const response = await axios.get(`${OPENROUTER_API_URL}/auth/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.status === 200 && response.data?.data) {
      return {
        valid: true,
        keyInfo: response.data.data as OpenRouterKeyInfo,
      };
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
 * Fetch usage data from OpenRouter using enhanced key info
 */
export async function fetchOpenRouterUsage(
  apiKey: string
): Promise<OpenRouterUsage> {
  try {
    // Fetch key information from OpenRouter
    const response = await axios.get(`${OPENROUTER_API_URL}/auth/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    const keyData = response.data?.data;

    if (!keyData) {
      throw new Error("No key data returned");
    }

    // Parse the response with enhanced usage information
    const usage: OpenRouterUsage = {
      totalRequests: 0, // Not directly available in key info
      tokensUsed: {
        input: 0,
        output: 0,
      },
      lastUpdated: new Date().toISOString(),
      remainingBalance: keyData.limit_remaining,
      keyInfo: {
        label: keyData.label || "",
        limit: keyData.limit,
        limit_reset: keyData.limit_reset,
        limit_remaining: keyData.limit_remaining,
        include_byok_in_limit: keyData.include_byok_in_limit || false,
        usage: keyData.usage || 0,
        usage_daily: keyData.usage_daily || 0,
        usage_weekly: keyData.usage_weekly || 0,
        usage_monthly: keyData.usage_monthly || 0,
        byok_usage: keyData.byok_usage || 0,
        byok_usage_daily: keyData.byok_usage_daily || 0,
        byok_usage_weekly: keyData.byok_usage_weekly || 0,
        byok_usage_monthly: keyData.byok_usage_monthly || 0,
        is_free_tier: keyData.is_free_tier || false,
      },
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
 * Get detailed OpenRouter key information with limits and usage stats
 */
export async function getOpenRouterKeyInfo(
  apiKey: string
): Promise<OpenRouterKeyInfo | null> {
  try {
    const response = await axios.get(`${OPENROUTER_API_URL}/auth/key`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 10000,
    });

    const keyData = response.data?.data;

    if (!keyData) {
      return null;
    }

    return {
      label: keyData.label || "",
      limit: keyData.limit,
      limit_reset: keyData.limit_reset,
      limit_remaining: keyData.limit_remaining,
      include_byok_in_limit: keyData.include_byok_in_limit || false,
      usage: keyData.usage || 0,
      usage_daily: keyData.usage_daily || 0,
      usage_weekly: keyData.usage_weekly || 0,
      usage_monthly: keyData.usage_monthly || 0,
      byok_usage: keyData.byok_usage || 0,
      byok_usage_daily: keyData.byok_usage_daily || 0,
      byok_usage_weekly: keyData.byok_usage_weekly || 0,
      byok_usage_monthly: keyData.byok_usage_monthly || 0,
      is_free_tier: keyData.is_free_tier || false,
    };
  } catch (error: any) {
    console.error("Failed to get OpenRouter key info:", error.message);
    return null;
  }
}

/**
 * Encrypt OpenRouter API key for storage
 */
export function encryptOpenRouterKey(apiKey: string): EncryptedData {
  return encryptKey(apiKey);
}

/**
 * Decrypt OpenRouter API key for usage
 */
export function decryptOpenRouterKey(encryptedData: EncryptedData): string {
  return decryptKey(encryptedData);
}

/**
 * Fetch available models from OpenRouter
 */
export async function fetchOpenRouterModels(
  apiKey?: string
): Promise<OpenRouterModel[]> {
  try {
    const headers: any = {};

    // Add authorization header if API key is provided
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await axios.get(`${OPENROUTER_API_URL}/models`, {
      headers,
      timeout: 15000, // 15 second timeout
    });

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error("OpenRouter models fetch error:", error.message);

    // Return empty array if fetch fails
    return [];
  }
}

/**
 * Search models by name or description
 */
export function searchModels(
  models: OpenRouterModel[],
  query: string
): OpenRouterModel[] {
  const lowerQuery = query.toLowerCase();

  return models.filter(
    (model) =>
      model.id.toLowerCase().includes(lowerQuery) ||
      model.name.toLowerCase().includes(lowerQuery) ||
      model.description?.toLowerCase().includes(lowerQuery)
  );
}

export default {
  validateOpenRouterKey,
  fetchOpenRouterUsage,
  getOpenRouterKeyInfo,
  encryptOpenRouterKey,
  decryptOpenRouterKey,
  fetchOpenRouterModels,
  searchModels,
};
