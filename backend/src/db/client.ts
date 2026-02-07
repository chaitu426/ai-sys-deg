/**
 * Prisma client singleton
 * Ensures single connection pool across the application
 */

import { PrismaClient } from '@prisma/client';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Prisma query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma error', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma warning', e);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Closing Prisma connection');
  await prisma.$disconnect();
});

export { prisma };
