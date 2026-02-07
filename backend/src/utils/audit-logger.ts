/**
 * Audit Logger Service
 * Centralized logging for security and compliance events
 */

import { prisma } from '../db/client';
import { getLogger } from './logger';

const logger = getLogger();

export type AuditAction =
  | 'login'
  | 'logout'
  | 'signup'
  | 'email_verified'
  | 'password_reset'
  | 'plan_upgrade'
  | 'plan_downgrade'
  | 'project_created'
  | 'project_deleted'
  | 'design_updated'
  | 'agent_started'
  | 'agent_completed'
  | 'agent_failed'
  | 'questions_answered';

/**
 * Log a critical system action
 */
export async function logAudit(
  action: AuditAction,
  details: Record<string, any> | null,
  userId?: string,
  designVersionId?: string
) {
  const logData = {
    action,
    userId: userId || 'system',
    designVersionId,
  };

  logger.info('Audit Log', logData);

  try {
    await prisma.auditLog.create({
      data: {
        action,
        details: details || {},
        userId,
        designVersionId,
      },
    });
  } catch (error: any) {
    // Audit logging failure should not break the application flow, but should be logged as error
    logger.error('Failed to write audit log', {
      error: error.message,
      ...logData,
    });
  }
}
