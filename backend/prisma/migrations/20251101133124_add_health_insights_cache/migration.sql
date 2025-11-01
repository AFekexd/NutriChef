-- CreateTable
CREATE TABLE "HealthInsightsCache" (
    "cacheId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "insightsData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthInsightsCache_pkey" PRIMARY KEY ("cacheId")
);

-- CreateIndex
CREATE INDEX "HealthInsightsCache_userId_language_idx" ON "HealthInsightsCache"("userId", "language");

-- CreateIndex
CREATE INDEX "HealthInsightsCache_expiresAt_idx" ON "HealthInsightsCache"("expiresAt");
