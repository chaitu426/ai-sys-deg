/**
 * Tool Audit Service
 * specialized service for tracking tool usage in the audit log
 */

import { projectRepository } from '../db/repositories/project-repository';
import { getLogger } from '../utils/logger';

const logger = getLogger();

export interface ToolExecutionRecord {
    designVersionId: string;
    agentType: string;
    toolName: string;
    input: any;
    output: any;
    durationMs: number;
    success: boolean;
    error?: string;
}

export const toolAuditService = {
    /**
     * Log a tool execution to the database audit log
     */
    async logExecution(record: ToolExecutionRecord): Promise<void> {
        try {
            // Create detailed metadata for the audit log
            const details = {
                agentType: record.agentType,
                toolName: record.toolName,
                input: record.input,
                durationMs: record.durationMs,
                success: record.success,
                error: record.error,
                // We limit output size in logs to prevent bloat, but for audit we might want more
                outputSummary: JSON.stringify(record.output).substring(0, 500)
            };

            await projectRepository.createAuditLog({
                designVersionId: record.designVersionId,
                action: 'tool_execution',
                details: details as any, // Cast to any as details is JSON
            });

            logger.debug('Logged tool execution to audit table', {
                tool: record.toolName,
                agent: record.agentType
            });
        } catch (error) {
            // Non-blocking error - don't fail the workflow if logging fails
            logger.error('Failed to log tool execution audito', {
                error: error instanceof Error ? error.message : String(error),
                tool: record.toolName
            });
        }
    }
};
