/**
 * Redis-based session store for internal dashboard
 * Production-ready, scalable session management
 */

import { getLogger } from './logger';
import Redis from 'ioredis';
import { getRedisConnection } from '../queue/connection';

const logger = getLogger();

export interface Session {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

export class SessionStore {
  private redis: Redis;
  private readonly SESSION_PREFIX = 'internal_session:';
  private readonly SESSION_TTL = 3600; // 1 hour in seconds

  constructor() {
    this.redis = getRedisConnection();
  }

  /**
   * Create a new session
   */
  async create(sessionToken: string, userId: string, email: string): Promise<Session> {
    const now = Date.now();
    const session: Session = {
      userId,
      email,
      createdAt: now,
      expiresAt: now + this.SESSION_TTL * 1000,
    };

    const key = this.SESSION_PREFIX + sessionToken;
    await this.redis.setex(key, this.SESSION_TTL, JSON.stringify(session));

    logger.info('Session created', { userId, sessionToken: sessionToken.substring(0, 8) + '...' });
    return session;
  }

  /**
   * Get session by token
   */
  async get(sessionToken: string): Promise<Session | null> {
    const key = this.SESSION_PREFIX + sessionToken;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      const session = JSON.parse(data) as Session;

      // Check if expired (redundant with TTL but safe)
      if (session.expiresAt < Date.now()) {
        await this.delete(sessionToken);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to parse session', { error });
      return null;
    }
  }

  /**
   * Delete session (logout)
   */
  async delete(sessionToken: string): Promise<void> {
    const key = this.SESSION_PREFIX + sessionToken;
    await this.redis.del(key);
    logger.info('Session deleted', { sessionToken: sessionToken.substring(0, 8) + '...' });
  }

  /**
   * Extend session TTL
   */
  async extend(sessionToken: string): Promise<boolean> {
    const key = this.SESSION_PREFIX + sessionToken;
    const exists = await this.redis.exists(key);

    if (!exists) {
      return false;
    }

    await this.redis.expire(key, this.SESSION_TTL);
    return true;
  }

  /**
   * Clean up all sessions for a user (e.g., on password change)
   */
  async deleteAllForUser(userId: string): Promise<void> {
    const pattern = this.SESSION_PREFIX + '*';
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        try {
          const session = JSON.parse(data) as Session;
          if (session.userId === userId) {
            await this.redis.del(key);
          }
        } catch (error) {
          logger.error('Failed to parse session during cleanup', { error });
        }
      }
    }

    logger.info('All sessions deleted for user', { userId });
  }
}

// Singleton instance
let sessionStore: SessionStore | null = null;

export function getSessionStore(): SessionStore {
  if (!sessionStore) {
    sessionStore = new SessionStore();
  }
  return sessionStore;
}
