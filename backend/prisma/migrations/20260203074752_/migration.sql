-- CreateIndex
CREATE INDEX "design_versions_status_idx" ON "design_versions"("status");

-- CreateIndex
CREATE INDEX "otps_userId_type_expiresAt_idx" ON "otps"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "otps_expiresAt_idx" ON "otps"("expiresAt");

-- CreateIndex
CREATE INDEX "users_subscriptionId_idx" ON "users"("subscriptionId");
