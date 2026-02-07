/**
 * Redis connection for BullMQ
 * Shared connection pool
 */

import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { getConfig } from '../utils/config';
import { getLogger } from '../utils/logger';
import { AgentType } from '../core/contracts';

const logger = getLogger();

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (redisConnection) {
    return redisConnection;
  }

  const config = getConfig();
  const redisUrl = new URL(config.REDIS_URL);

  redisConnection = new Redis({
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port || '6379'),
    password: redisUrl.password || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisConnection.on('connect', () => {
    logger.info('Redis connected');
  });

  redisConnection.on('error', (error) => {
    logger.error('Redis error', error);
  });

  // Graceful shutdown
  process.on('beforeExit', async () => {
    logger.info('Closing Redis connection');
    await redisConnection?.quit();
  });

  return redisConnection;
}

/**
 * Get or create a Queue instance for a specific agent type
 * Queues are cached to prevent multiple instances
 */
const queueCache = new Map<string, Queue>();

export function getQueue(agentType: AgentType): Queue {
  const queueName = `agent-${agentType}`;

  if (queueCache.has(queueName)) {
    return queueCache.get(queueName)!;
  }

  const queue = new Queue(queueName, {
    connection: getRedisConnection() as any,
  });

  queueCache.set(queueName, queue);

  return queue;
}
