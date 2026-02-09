/**
 * Authentication middleware
 * Protects routes requiring authentication
 */

//import { FastifyRequest, FastifyReply } from 'fastify';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authenticate(request: any, reply: any): Promise<void> {
  try {
    // 1. Try default jwtVerify (checks headers)
    try {
      await request.jwtVerify();
    } catch (headerError) {
      // 2. If header is missing/invalid, try from query param for specifically allowed routes
      const token = request.query?.token;
      if (token) {
        const decoded = await request.server.jwt.verify(token);
        request.user = decoded;
      } else {
        throw headerError; // Re-throw if no query token either
      }
    }

    // Attach user payload to request
    const payload = request.user;

    logger.debug('Authenticated request', {
      userId: payload.userId,
      email: payload.email,
    });
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    reply.status(401).send({
      success: false,
      error: 'Unauthorized. Please provide a valid authentication token.',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 */
export async function optionalAuthenticate(request: any): Promise<void> {
  try {
    await request.jwtVerify();
    const payload = request.user as { userId: string; email: string };
    request.user = payload;
  } catch (error) {
    // Silently fail - user is optional
    request.user = undefined;
  }
}
