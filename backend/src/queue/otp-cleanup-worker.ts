/**
 * OTP Cleanup Worker
 * Periodically removes expired OTP codes from database
 */

import { Worker, Queue } from 'bullmq';
import { getRedisConnection } from './connection';
import { prisma } from '../db/client';
import { getLogger } from '../utils/logger';

const logger = getLogger();

// Queue for scheduled OTP cleanup
export const otpCleanupQueue = new Queue('otp-cleanup', {
  connection: getRedisConnection() as any,
});

/**
 * OTP Cleanup Worker
 * Runs every 30 minutes to delete expired OTPs
 */
export function createOtpCleanupWorker(): Worker {
  const worker = new Worker(
    'otp-cleanup',
    async () => {
      try {
        logger.info('Starting OTP cleanup job');

        const result = await prisma.otp.deleteMany({
          where: {
            expiresAt: {
              lt: new Date(), // Delete all OTPs that have expired
            },
          },
        });

        logger.info('OTP cleanup completed', { deletedCount: result.count });

        return { success: true, deletedCount: result.count };
      } catch (error) {
        logger.error('OTP cleanup failed', error);
        throw error;
      }
    },
    {
      connection: getRedisConnection() as any,
      concurrency: 1, // Only one cleanup job at a time
    }
  );

  worker.on('completed', (job) => {
    logger.debug('OTP cleanup job completed', { jobId: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error('OTP cleanup job failed', { jobId: job?.id, error: err });
  });

  return worker;
}

/**
 * Schedule recurring OTP cleanup
 * Runs every 30 minutes
 */
export async function scheduleOtpCleanup() {
  try {
    // Remove any existing repeatable jobs
    const repeatableJobs = await otpCleanupQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await otpCleanupQueue.removeRepeatableByKey(job.key);
    }

    // Schedule new repeatable job
    await otpCleanupQueue.add(
      'cleanup-expired-otps',
      {},
      {
        repeat: {
          pattern: '*/30 * * * *', // Every 30 minutes
        },
      }
    );

    logger.info('OTP cleanup job scheduled (runs every 30 minutes)');
  } catch (error) {
    logger.error('Failed to schedule OTP cleanup', error);
    throw error;
  }
}
