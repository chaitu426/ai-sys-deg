/**
 * Email Queue
 * Handles transactional emails asynchronously using BullMQ
 */

import { Queue, Worker, Job } from 'bullmq';
import { getRedisConnection } from './connection';
import { getLogger } from '../utils/logger';
import { EmailOptions } from '../utils/email-service';

const logger = getLogger();
const QUEUE_NAME = 'email-queue';

// Export the queue instance
let emailQueue: Queue | null = null;

export function getEmailQueue(): Queue {
  if (emailQueue) {
    return emailQueue;
  }

  emailQueue = new Queue(QUEUE_NAME, {
    connection: getRedisConnection() as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });

  return emailQueue;
}

import { emailService } from '../utils/email-service';

/**
 * Add an email to the queue
 */
export async function queueEmail(options: EmailOptions, jobId?: string) {
  const queue = getEmailQueue();
  await queue.add('send-email', options, { jobId });
  logger.info('Email added to queue', { to: options.to, subject: options.subject, jobId });
}

/**
 * Create email worker
 */
export function createEmailWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job<EmailOptions>) => {
      await emailService.processQueueJob(job.data);
    },
    {
      connection: getRedisConnection() as any,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info('Email job completed', { jobId: job.id });
  });

  worker.on('failed', (job, error) => {
    logger.error('Email job failed', { jobId: job?.id, error: error.message });
  });

  return worker;
}
