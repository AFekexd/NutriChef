// List available Gemini models
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log("Fetching available models...\n");

    // Try to list models
    const models = await genAI.listModels();

    console.log("Available models:");
    for await (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(
        `  Supported methods: ${model.supportedGenerationMethods?.join(", ")}`
      );
      console.log("");
    }
  } catch (error) {
    console.error("Error listing models:", error.message);
    console.log("\nTrying alternative approach...\n");

    // Try some known model names
    const modelsToTry = [
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-pro",
      "gemini-pro-vision",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest",
    ];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        console.log(`✓ ${modelName} - Available`);
      } catch (err) {
        console.log(`✗ ${modelName} - Not available`);
      }
    }
  }
}

listModels();
