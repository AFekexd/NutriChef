// AI Service Configuration and Base Classes
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

// Encryption key for API keys (should be in environment variables)
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET;
const CLIENT_ENCRYPTION_KEY = process.env.CLIENT_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-cbc";

// OpenAI Configuration
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Google Gemini Configuration
export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// AI Provider enum
export enum AIProvider {
  OPENAI = "openai",
  GEMINI = "gemini",
}

// Utility functions for API key encryption/decryption
export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptApiKey(encryptedKey: string): string {
  const parts = encryptedKey.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted key format");
  }
  const iv = Buffer.from(parts[0]!, "hex");
  const encryptedText = parts[1]!;
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted: string = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Decrypt client-side encrypted data (using AES-GCM)
 * The client sends base64-encoded data with IV prepended
 */
export function decryptClientData(encryptedBase64: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedBase64, "base64");

    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    const authTag = encryptedData.slice(-16); // Last 16 bytes are the auth tag
    const ciphertext = encryptedData.slice(0, -16);

    // Derive key using PBKDF2 (matching client-side)
    const key = crypto.pbkdf2Sync(
      CLIENT_ENCRYPTION_KEY,
      "nutrichef-salt",
      100000,
      32,
      "sha256"
    );

    // Decrypt using AES-GCM
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Client data decryption error:", error);
    throw new Error("Failed to decrypt client-encrypted data");
  }
}

// Base AI Service Class
export class BaseAIService {
  protected provider: AIProvider;
  protected model: string;
  protected customApiKey?: string;
  protected usingCustomKey: boolean = false;

  constructor(provider: AIProvider = AIProvider.OPENAI, customApiKey?: string) {
    this.provider = provider;
    this.customApiKey = customApiKey;
    this.usingCustomKey = !!customApiKey;
    // Use the same model as visionAI.ts for consistency
    this.model =
      provider === AIProvider.OPENAI ? "gpt-4" : "gemini-flash-latest";
  }

  protected async callOpenAI(
    prompt: string,
    systemMessage?: string
  ): Promise<any> {
    try {
      // Use custom API key if provided, otherwise use default
      const apiClient = this.customApiKey
        ? new OpenAI({ apiKey: this.customApiKey })
        : openai;

      const response = await apiClient.chat.completions.create({
        model: this.model,
        messages: [
          ...(systemMessage
            ? [{ role: "system" as const, content: systemMessage }]
            : []),
          { role: "user" as const, content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return {
        content: response.choices[0]?.message.content || "",
        tokensUsed: response.usage?.total_tokens || 0,
        model: response.model,
        usingCustomKey: this.usingCustomKey,
      };
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  protected async callGemini(
    prompt: string,
    systemMessage?: string
  ): Promise<any> {
    try {
      // Use custom API key if provided, otherwise use default
      const geminiClient = this.customApiKey
        ? new GoogleGenerativeAI(this.customApiKey)
        : gemini;

      const model = geminiClient.getGenerativeModel({ model: this.model });

      const fullPrompt = systemMessage
        ? `${systemMessage}\n\nUser Request: ${prompt}`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        tokensUsed: 0, // Gemini doesn't provide token count in free tier
        model: this.model,
        usingCustomKey: this.usingCustomKey,
      };
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  protected async generateContent(
    prompt: string,
    systemMessage?: string
  ): Promise<any> {
    const startTime = Date.now();

    let result;
    if (this.provider === AIProvider.OPENAI) {
      result = await this.callOpenAI(prompt, systemMessage);
    } else {
      result = await this.callGemini(prompt, systemMessage);
    }

    const generationTime = (Date.now() - startTime) / 1000;

    return {
      ...result,
      generationTime,
      provider: this.provider,
    };
  }

  protected parseJSONResponse(content: string): any {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/```json\n?/, "").replace(/\n?```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```\n?/, "").replace(/\n?```$/, "");
      }

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("JSON Parse Error:", error);
      throw new Error("Failed to parse AI response as JSON");
    }
  }
}

// Usage tracking for cost management
export interface AIUsageLog {
  userId: string;
  provider: AIProvider;
  feature: string;
  tokensUsed: number;
  cost: number;
  timestamp: Date;
}

export class AIUsageTracker {
  // Token costs (per 1K tokens) as of 2024
  private static readonly COSTS = {
    "gpt-4": { input: 0.03, output: 0.06 },
    "gpt-3.5-turbo": { input: 0.0015, output: 0.002 },
    "gemini-flash-latest": { input: 0, output: 0 }, // Free tier
  };

  static calculateCost(model: string, tokensUsed: number): number {
    const cost = this.COSTS[model as keyof typeof this.COSTS];
    if (!cost) return 0;

    // Simplified: assume 50/50 input/output split
    const avgCost = (cost.input + cost.output) / 2;
    return (tokensUsed / 1000) * avgCost;
  }

  static async logUsage(log: AIUsageLog): Promise<void> {
    // TODO: Store in database or analytics service
    console.log("AI Usage:", log);
  }
}

export default BaseAIService;
