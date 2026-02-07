-- Migration: Add index on designVersionId for better query performance
-- This migration addresses Critical Issue #8 from the security audit

-- Add index on AgentOutput.designVersionId
CREATE INDEX IF NOT EXISTS "agent_outputs_designVersionId_idx" ON "agent_outputs"("designVersionId");

-- Add index on AuditLog.designVersionId (bonus optimization)
CREATE INDEX IF NOT EXISTS "audit_logs_designVersionId_idx" ON "audit_logs"("designVersionId");

-- Add index on Payment.userId (bonus optimization)
CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON "payments"("userId");
