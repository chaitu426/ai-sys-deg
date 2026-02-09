/**
 * API setup and route registration
 */

import { FastifyInstance } from 'fastify';
import { registerAuthRoutes } from './routes/auth';
import { registerDesignRoutes } from './routes/design';
import { registerProjectRoutes } from './routes/projects';
import { registerSSERoutes } from './routes/sse';
import { registerApprovalRoutes } from './routes/approval';
import { registerPaymentRoutes } from './routes/payments';
import { registerInternalRoutes } from './routes/internal';
import { registerWhiteboardRoutes } from './routes/whiteboard';
import { registerGitHubRoutes } from './routes/github-auth';

export async function registerRoutes(fastify: FastifyInstance) {
  // Parsing is tricky with webhooks. Dodo docs say "fastify.addContentTypeParser".
  // To avoid global side effects, we can try registering payments in a scope
  // or just apply it globally if acceptable. For now, let's keep it simple.
  // Ideally, the adapter handles this, or we register it inside the route file.

  await registerAuthRoutes(fastify);
  await registerDesignRoutes(fastify);
  await registerProjectRoutes(fastify);
  await registerSSERoutes(fastify);
  await registerApprovalRoutes(fastify);
  await registerPaymentRoutes(fastify);
  await registerInternalRoutes(fastify);
  await registerWhiteboardRoutes(fastify);
  await registerGitHubRoutes(fastify);
}
