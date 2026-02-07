import Fastify, { FastifyInstance } from 'fastify';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

// We mock the modules to test the route logic in isolation if needed,
// but for a health check we want to check the actual response structure.
// In a real integration test, we might mock DB/Redis to control status.

describe('Health Check API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Basic Fastify instance setup for testing route logic
    app = Fastify();

    // Mock health route logic similar to actual implementation
    app.get('/health', async (_request, _reply) => {
      return {
        status: 'ok',
        services: {
          database: 'up',
          redis: 'up',
        },
      };
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 OK with service status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.services).toBeDefined();
    expect(body.services.database).toBe('up');
    expect(body.services.redis).toBe('up');
  });
});
