export interface DetectedItem {
    name: string;
    confidence: number;
    category: string;
    quantity?: number;
    unit?: string;
    estimatedExpiry?: number;
    location?: "fridge" | "pantry" | "freezer";
}
export interface DetectionResult {
    items: DetectedItem[];
    imageUrl: string;
    processingTime: number;
    aiService: "google_vision" | "gemini";
    totalItemsDetected: number;
}
declare class VisionAIService {
    optimizeImage(inputPath: string, outputPath: string): Promise<void>;
    detectWithGoogleVision(imagePath: string): Promise<DetectedItem[]>;
    detectWithGemini(imagePath: string, language?: string): Promise<DetectedItem[]>;
    private parseGeminiResponse;
    detectIngredients(imagePath: string, language?: string): Promise<DetectionResult>;
    private categorizeItem;
    private guessLocation;
    private parseTextForItems;
    private deduplicateItems;
    detectFromMultipleImages(imagePaths: string[]): Promise<DetectionResult[]>;
}
declare const _default: VisionAIService;
export default _default;
//# sourceMappingURL=visionAI.d.ts.map