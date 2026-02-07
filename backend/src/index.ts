/**
 * Main application entry point
 * Production-grade System Design Intelligence Platform
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { getConfig } from './utils/config';
import { getLogger } from './utils/logger';
import { registerRoutes } from './api';
import { initializeWorkers } from './queue/workers';
import { prisma } from './db/client';
import { registerJWT } from './auth/jwt';
import { designEvents } from './utils/event-emitter';
import { initializeTools } from './tools/init';

const logger = getLogger();

async function buildApp() {
  const app = Fastify({
    logger: false, // We use our own logger
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  });

  const config = getConfig();

  // Security headers with CSP
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  });

  // Global rate limiting (conservative default)
  await app.register(import('@fastify/rate-limit'), {
    global: true,
    max: 100,
    timeWindow: '1 minute',
  });

  // CORS - strict in production, permissive in development
  // CORS - strict in production, permissive in development
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true);

      const allowedOrigins = [config.FRONTEND_URL];
      if (config.NODE_ENV !== 'production') {
        allowedOrigins.push('http://localhost:5173');
        allowedOrigins.push('http://127.0.0.1:5173');
        return cb(null, true); // Allow all in dev for simplicity
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // JWT Authentication
  await registerJWT(app);

  // Enhanced Health check
  app.get('/health', async (request, reply) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    try {
      // Check Database
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'up';
    } catch (error: any) {
      health.status = 'degraded';
      health.services.database = 'down';
      request.log.error('Health check: Database down', error);
    }

    try {
      // Check Redis
      const { getRedisConnection } = await import('./queue/connection');
      const redis = getRedisConnection();
      await redis.ping();
      health.services.redis = 'up';
    } catch (error: any) {
      health.status = 'degraded';
      health.services.redis = 'down';
      request.log.error('Health check: Redis down', error);
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(health);
  });

  // Register API routes
  await registerRoutes(app);

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error('Request error', error, {
      method: request.method,
      url: request.url,
    });

    reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  });

  return app;
}

async function start() {
  try {
    logger.info('Starting System Design Intelligence Platform');

    // Verify database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Initialize agent tools
    initializeTools();
    logger.info('Agent tools initialized');

    // Build and start Fastify app
    const app = await buildApp();
    const config = getConfig();

    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on port ${config.PORT}`);

    // Initialize background workers
    const workers = initializeWorkers();
    logger.info(`Initialized ${workers.length} background workers`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully`);

      // Close workers
      for (const worker of workers) {
        await worker.close();
      }

      // Close app
      await app.close();

      // Close database
      await prisma.$disconnect();

      // Close event emitter
      await designEvents.close();

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Start the application
start();
