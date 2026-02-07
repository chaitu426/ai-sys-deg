-- CreateTable
CREATE TABLE "token_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "token_usage_userId_idx" ON "token_usage"("userId");

-- CreateIndex
CREATE INDEX "token_usage_createdAt_idx" ON "token_usage"("createdAt");

-- CreateIndex
CREATE INDEX "token_usage_provider_idx" ON "token_usage"("provider");

-- AddForeignKey
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
