-- AlterTable
ALTER TABLE "User" ADD COLUMN "openrouterApiKey" TEXT,
ADD COLUMN "openrouterUsage" JSONB;

-- Update aiProvider column comment to include openrouter
COMMENT ON COLUMN "User"."aiProvider" IS '"openai", "gemini", "openrouter" - which AI service the key is for';
