import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
export declare const openai: OpenAI;
export declare const gemini: GoogleGenerativeAI;
export declare enum AIProvider {
    OPENAI = "openai",
    GEMINI = "gemini"
}
export declare class BaseAIService {
    protected provider: AIProvider;
    protected model: string;
    constructor(provider?: AIProvider);
    protected callOpenAI(prompt: string, systemMessage?: string): Promise<any>;
    protected callGemini(prompt: string, systemMessage?: string): Promise<any>;
    protected generateContent(prompt: string, systemMessage?: string): Promise<any>;
    protected parseJSONResponse(content: string): any;
}
export interface AIUsageLog {
    userId: string;
    provider: AIProvider;
    feature: string;
    tokensUsed: number;
    cost: number;
    timestamp: Date;
}
export declare class AIUsageTracker {
    private static readonly COSTS;
    static calculateCost(model: string, tokensUsed: number): number;
    static logUsage(log: AIUsageLog): Promise<void>;
}
export default BaseAIService;
//# sourceMappingURL=aiService.d.ts.map