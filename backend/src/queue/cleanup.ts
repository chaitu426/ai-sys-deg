/**
 * Job cleanup utilities
 * Handle cancellation of orphaned or stale jobs
 */

import { getQueue } from './connection';
import { getLogger } from '../utils/logger';
import { CORE_AGENTS, OPTIONAL_AGENTS } from '../config/agents';

const logger = getLogger();

/**
 * Cancel all running jobs for a design version
 * Called when project is deleted or workflow is cancelled
 */
export async function cancelJobsForDesignVersion(designVersionId: string): Promise<void> {
  logger.info('Cancelling jobs for design version', { designVersionId });

  const agentTypes = [...new Set([...CORE_AGENTS, ...OPTIONAL_AGENTS])];
  let cancelledCount = 0;

  for (const agentType of agentTypes) {
    try {
      const queue = getQueue(agentType);

      // Get all jobs for this design version
      const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);

      for (const job of jobs) {
        if (job.data.designVersionId === designVersionId) {
          await job.remove();
          cancelledCount++;
          logger.debug('Job cancelled', { designVersionId, agentType, jobId: job.id });
        }
      }
    } catch (error: any) {
      logger.error('Failed to cancel jobs for agent', {
        designVersionId,
        agentType,
        error: error.message,
      });
    }
  }

  logger.info('Job cancellation completed', { designVersionId, cancelledCount });
}

/**
 * Cancel all jobs for a project (all design versions)
 * Called when project is deleted
 */
export async function cancelJobsForProject(
  projectId: string,
  designVersionIds: string[]
): Promise<void> {
  logger.info('Cancelling jobs for project', { projectId, versionCount: designVersionIds.length });

  for (const designVersionId of designVersionIds) {
    await cancelJobsForDesignVersion(designVersionId);
  }

  logger.info('Project jobs cancelled', { projectId });
}

/**
 * Clean up stale jobs older than specified hours
 * Run this periodically (e.g., daily cron)
 */
export async function cleanupStaleJobs(maxAgeHours: number = 24): Promise<void> {
  logger.info('Starting stale job cleanup', { maxAgeHours });

  const agentTypes = [...new Set([...CORE_AGENTS, ...OPTIONAL_AGENTS])];
  const cutoffTime = Date.now() - maxAgeHours * 60 * 60 * 1000;
  let cleanedCount = 0;

  for (const agentType of agentTypes) {
    try {
      const queue = getQueue(agentType);

      // Remove completed jobs older than cutoff
      const completed = await queue.getCompleted();
      for (const job of completed) {
        if (job.finishedOn && job.finishedOn < cutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }

      // Remove failed jobs older than cutoff
      const failed = await queue.getFailed();
      for (const job of failed) {
        if (job.finishedOn && job.finishedOn < cutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }
    } catch (error: any) {
      logger.error('Failed to cleanup stale jobs for agent', {
        agentType,
        error: error.message,
      });
    }
  }

  logger.info('Stale job cleanup completed', { cleanedCount });
}
