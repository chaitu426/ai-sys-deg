-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "designVersionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "token_usage" ADD COLUMN     "agentType" TEXT,
ADD COLUMN     "designVersionId" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_designVersionId_idx" ON "audit_logs"("designVersionId");

-- CreateIndex
CREATE INDEX "token_usage_designVersionId_idx" ON "token_usage"("designVersionId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "design_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
