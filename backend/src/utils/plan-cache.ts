/**
 * Plan cache with TTL
 * Prevents stale plan data after user upgrades
 */

import { getLogger } from '../utils/logger';

const logger = getLogger();

interface CachedPlan {
  plan: string;
  cachedAt: number;
  expiresAt: number;
}

export class PlanCache {
  private cache = new Map<string, CachedPlan>();
  private readonly TTL = 300000; // 5 minutes in milliseconds

  /**
   * Get cached plan if valid
   */
  get(designVersionId: string): string | null {
    const cached = this.cache.get(designVersionId);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      logger.debug('Plan cache expired', { designVersionId });
      this.cache.delete(designVersionId);
      return null;
    }

    logger.debug('Plan cache hit', { designVersionId, plan: cached.plan });
    return cached.plan;
  }

  /**
   * Set plan in cache with TTL
   */
  set(designVersionId: string, plan: string): void {
    const now = Date.now();
    this.cache.set(designVersionId, {
      plan,
      cachedAt: now,
      expiresAt: now + this.TTL,
    });
    logger.debug('Plan cached', { designVersionId, plan, ttl: this.TTL });
  }

  /**
   * Invalidate cache for a design version
   */
  invalidate(designVersionId: string): void {
    this.cache.delete(designVersionId);
    logger.debug('Plan cache invalidated', { designVersionId });
  }

  /**
   * Invalidate all cache entries for a user
   * Called when user upgrades/downgrades plan
   */
  invalidateUser(userId: string): void {
    // Note: We don't have userId -> designVersionId mapping here
    // This is a placeholder for future enhancement
    logger.debug('User plan cache invalidation requested', { userId });
  }

  /**
   * Clear all expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Plan cache cleanup completed', { entriesRemoved: cleaned });
    }
  }
}

// Singleton instance
let planCache: PlanCache | null = null;

export function getPlanCache(): PlanCache {
  if (!planCache) {
    planCache = new PlanCache();

    // Run cleanup every 10 minutes
    setInterval(() => {
      planCache?.cleanup();
    }, 600000);
  }
  return planCache;
}
