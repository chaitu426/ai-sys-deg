/**
 * JWT authentication utilities
 * Production-grade JWT handling
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { getConfig } from '../utils/config';
//import { getLogger } from '../utils/logger';

//const logger = getLogger();

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Register JWT plugin with Fastify
 */
export async function registerJWT(fastify: any) {
  const config = getConfig();

  await fastify.register(require('@fastify/jwt'), {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
  });

  // Add decorator for request.user
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload, fastify: any): string {
  return fastify.jwt.sign(payload);
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string, fastify: any): Promise<JWTPayload> {
  return fastify.jwt.verify(token) as JWTPayload;
}
