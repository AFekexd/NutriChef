-- CreateTable
CREATE TABLE "AdminLog" (
    "adminLogId" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID,
    "targetEmail" TEXT,
    "targetName" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("adminLogId")
);

-- CreateTable
CREATE TABLE "UserModerationAction" (
    "moderationActionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "actionType" TEXT NOT NULL,
    "reason" TEXT,
    "duration" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminUserId" UUID NOT NULL,
    "adminNote" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserModerationAction_pkey" PRIMARY KEY ("moderationActionId")
);

-- CreateIndex
CREATE INDEX "AdminLog_adminUserId_idx" ON "AdminLog"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminLog_timestamp_idx" ON "AdminLog"("timestamp");

-- CreateIndex
CREATE INDEX "AdminLog_action_idx" ON "AdminLog"("action");

-- CreateIndex
CREATE INDEX "AdminLog_targetType_idx" ON "AdminLog"("targetType");

-- CreateIndex
CREATE INDEX "UserModerationAction_userId_idx" ON "UserModerationAction"("userId");

-- CreateIndex
CREATE INDEX "UserModerationAction_actionType_idx" ON "UserModerationAction"("actionType");

-- CreateIndex
CREATE INDEX "UserModerationAction_isActive_idx" ON "UserModerationAction"("isActive");

-- CreateIndex
CREATE INDEX "UserModerationAction_expiresAt_idx" ON "UserModerationAction"("expiresAt");

-- CreateIndex
CREATE INDEX "UserModerationAction_timestamp_idx" ON "UserModerationAction"("timestamp");
