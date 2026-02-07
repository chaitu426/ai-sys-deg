/**
 * BullMQ workers for agent execution
 * One worker per agent type
 * Horizontally scalable
 */

import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './connection';
import { getLogger } from '../utils/logger';
import { AgentType, AgentContext, AGENTS } from '../core/contracts';
import { projectRepository } from '../db/repositories/project-repository';
import { getOrchestrator } from '../core/orchestrator';
import { executeAgent } from '../agents/agent-executor';
import { designEvents } from '../utils/event-emitter';
import { createEmailWorker } from './email-queue';
import { OPTIONAL_AGENTS } from '../core/orchestrator'; // Import added for optional agent check

const logger = getLogger();

interface AgentJobData {
  designVersionId: string;
  agentType: AgentType;
  context: AgentContext;
}

/**
 * Create worker for a specific agent type
 * Each agent type has its own queue for proper job routing
 */
export function createAgentWorker(agentType: AgentType): Worker {
  // Use agent-specific queue name
  const queueName = `agent-${agentType}`;

  const worker = new Worker<AgentJobData>(
    queueName,
    async (job: Job<AgentJobData>) => {
      const { designVersionId, agentType: jobAgentType, context } = job.data;

      // Double-check agent type matches (safety check)
      if (jobAgentType !== agentType) {
        logger.error('Worker received job for different agent type', {
          workerAgentType: agentType,
          jobAgentType,
          queueName,
        });
        throw new Error(
          `Job agent type ${jobAgentType} does not match worker agent type ${agentType}`
        );
      }

      logger.info('Processing agent job', {
        designVersionId,
        agentType,
        jobId: job.id,
      });

      // Get agent output record
      const agentOutput = await projectRepository.getAgentOutput(designVersionId, agentType);

      if (!agentOutput) {
        throw new Error(`Agent output record not found for ${agentType}`);
      }

      try {
        // Update status to processing
        await projectRepository.updateAgentOutput(agentOutput.id, {
          status: 'processing',
        });

        // Log agent start
        await projectRepository.createAuditLog({
          designVersionId,
          action: 'agent_started',
          details: { agentType },
        });

        // Get design version for projectId and progress calculation
        const designVersion = await projectRepository.getDesignVersionById(designVersionId);
        if (designVersion) {
          const allAgents = Object.values(AGENTS);
          const completed = designVersion.agentOutputs.filter(
            (o) => o.status === 'completed'
          ).length;

          // Emit agent started event
          designEvents.emitAgentProgress({
            projectId: designVersion.projectId,
            designVersionId,
            agentType,
            status: 'started',
            progress: {
              total: allAgents.length,
              completed,
              percentage: Math.round((completed / allAgents.length) * 100),
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Execute agent
        const result = await executeAgent(agentType, context);

        if (result.success && result.output) {
          // Update agent output with result
          await projectRepository.updateAgentOutput(agentOutput.id, {
            status: 'completed',
            output: result.output,
          });

          // Log agent completion
          await projectRepository.createAuditLog({
            designVersionId,
            action: 'agent_completed',
            details: { agentType },
          });

          // Update shared memory if agent proposed updates
          if (result.memoryUpdates) {
            await projectRepository.updateSharedMemory(designVersionId, result.memoryUpdates);
            logger.info('Shared memory updated', { designVersionId, agentType });
          }

          // Get updated design version for progress calculation
          const designVersion = await projectRepository.getDesignVersionById(designVersionId);
          if (designVersion) {
            const allAgents = Object.values(AGENTS);
            const completed = designVersion.agentOutputs.filter(
              (o) => o.status === 'completed'
            ).length;

            // Emit agent completed event
            designEvents.emitAgentProgress({
              projectId: designVersion.projectId,
              designVersionId,
              agentType,
              status: 'completed',
              output: result.output,
              progress: {
                total: allAgents.length,
                completed,
                percentage: Math.round((completed / allAgents.length) * 100),
              },
              timestamp: new Date().toISOString(),
            });
          }

          // Continue workflow
          await getOrchestrator().continueWorkflow(designVersionId);
        } else {
          throw new Error(result.error || 'Agent execution failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // CHECK FOR TRANSIENT FAILURES (Smart Retries)
        // If we have attempts left, let BullMQ retry without marking as failed in DB
        // job.attemptsMade starts at 0 for first attempt.
        // job.opts.attempts default is 3.
        // If attemptsMade (0) < attempts (3) - 1, we retry.
        const maxAttempts = job.opts.attempts || 3;

        // Note: attemptsMade is the number of times it HAS failed. 
        // So on first run, it is 0. If it fails now, it will be 1.
        // Wait, actually attemptsMade is incremented BEFORE processing in some versions, 
        // but safely: if we throw here, BullMQ increments attempt count.
        // Simple check: if we haven't hit max attempts, throw to retry.
        if (job.attemptsMade < maxAttempts - 1) {
          logger.warn('Agent failed transiently, retrying...', {
            designVersionId,
            agentType,
            attempt: job.attemptsMade + 1,
            maxAttempts,
            error: errorMessage,
          });
          // Do NOT close/fail the DB record yet. 
          // Just throw so BullMQ puts it back in queue (after backoff).
          throw error;
        }

        // FINAL FAILURE LOGIC
        logger.error('Agent execution failed permanently', {
          designVersionId,
          agentType,
          error: errorMessage,
        });

        // Update agent output with error
        await projectRepository.updateAgentOutput(agentOutput.id, {
          status: 'failed',
          error: errorMessage,
        });

        // Log agent failure
        await projectRepository.createAuditLog({
          designVersionId,
          action: 'agent_failed',
          details: { agentType, error: errorMessage },
        });

        // Get design version for progress calculation
        const designVersion = await projectRepository.getDesignVersionById(designVersionId);

        // GRACEFUL DEGRADATION: Check if agent is optional
        const { OPTIONAL_AGENTS } = await import('../core/orchestrator');
        const isOptional = OPTIONAL_AGENTS.includes(agentType);

        if (designVersion) {
          const allAgents = Object.values(AGENTS);
          const completed = designVersion.agentOutputs.filter(
            (o) => o.status === 'completed'
          ).length;

          // Emit agent failed event
          designEvents.emitAgentProgress({
            projectId: designVersion.projectId,
            designVersionId,
            agentType,
            status: 'failed',
            error: errorMessage,
            progress: {
              total: allAgents.length,
              completed,
              percentage: Math.round((completed / allAgents.length) * 100),
            },
            timestamp: new Date().toISOString(),
          });
        }

        if (isOptional) {
          logger.warn('Optional agent failed, continuing workflow', { agentType, designVersionId });
          // FORCE CONTINUE WORKFLOW
          await getOrchestrator().continueWorkflow(designVersionId);
          return; // Job is "done" (failed state handled), don't throw to prevent BullMQ marking as failed if we handled it? 
          // Actually, for BullMQ, if we return normally, it marks job as completed.
          // If we mark agent as failed in DB, but want workflow to proceed, we should probably 
          // let the job count as "completed" (processed) even if result was failure.
          // OR we can throw, let it be "failed" in BullMQ, but we already handled the side effects.
          // Let's return normally so BullMQ doesn't consider it a "job failure" that clogs the failed list,
          // since we handled it gracefully.
        } else {
          // Critical failure - stop workflow
          await projectRepository.updateDesignVersionStatus(designVersionId, 'failed');

          // Throw so BullMQ marks it as failed
          throw error;
        }
      }
    },
    {
      connection: getRedisConnection() as any,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info('Agent job completed', {
      jobId: job.id,
      agentType,
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Agent job failed', {
      jobId: job?.id,
      agentType,
      error: error.message,
    });
  });

  return worker;
}

/**
 * Initialize all workers
 */
export function initializeWorkers(): Worker[] {
  const workers: Worker[] = [];

  // Create workers for each agent type
  // Create workers for each agent type
  const agentTypes: AgentType[] = Object.values(AGENTS);

  for (const agentType of agentTypes) {
    const worker = createAgentWorker(agentType);
    workers.push(worker);
    logger.info('Worker initialized', { agentType });
  }

  // Initialize email worker
  const emailWorker = createEmailWorker();
  workers.push(emailWorker);
  logger.info('Email worker initialized');

  // Initialize OTP cleanup worker
  const { createOtpCleanupWorker, scheduleOtpCleanup } = require('./otp-cleanup-worker');
  const otpCleanupWorker = createOtpCleanupWorker();
  workers.push(otpCleanupWorker);
  logger.info('OTP cleanup worker initialized');

  // Schedule recurring OTP cleanup
  scheduleOtpCleanup().catch((error: Error) => {
    logger.error('Failed to schedule OTP cleanup', error);
  });

  return workers;
}
