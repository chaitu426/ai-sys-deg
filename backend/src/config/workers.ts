/**
 * Worker configuration
 * Centralized configuration for all background workers
 */

import { getConfig } from '../utils/config';

export interface WorkerConfig {
  concurrency: number;
  maxJobsPerSecond: number;
  retryAttempts: number;
  retryBackoffDelay: number; // in milliseconds
}

/**
 * Get worker configuration from environment or defaults
 */
export function getWorkerConfig(): WorkerConfig {
  const config = getConfig();

  return {
    // Number of concurrent jobs per worker
    // Default: 5, can be overridden with WORKER_CONCURRENCY env var
    concurrency: config.WORKER_CONCURRENCY || 5,

    // Maximum jobs processed per second (rate limiting)
    // Default: 10, can be overridden with WORKER_MAX_JOBS_PER_SECOND env var
    maxJobsPerSecond: config.WORKER_MAX_JOBS_PER_SECOND || 10,

    // Number of retry attempts for failed jobs
    retryAttempts: 3,

    // Exponential backoff starting delay
    retryBackoffDelay: 2000, // 2 seconds
  };
}

/**
 * Determine if an error is retryable
 * Network errors, timeouts, and rate limits should retry
 * Validation errors and business logic errors should not
 */
export function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Retryable: Network and infrastructure errors
  const retryablePatterns = [
    'network',
    'timeout',
    'econnrefused',
    'enotfound',
    'etimedout',
    'rate limit',
    'quota exceeded',
    'too many requests',
    'service unavailable',
    '503',
    '502',
    '504',
    'socket hang up',
  ];

  // Non-retryable: Business logic and validation errors
  const nonRetryablePatterns = [
    'validation',
    'invalid',
    'unauthorized',
    '401',
    '403',
    '404',
    'not found',
    'schema',
    'parse error',
    'syntax error',
  ];

  // Check non-retryable first (higher priority)
  if (
    nonRetryablePatterns.some(
      (pattern) => errorMessage.includes(pattern) || errorName.includes(pattern)
    )
  ) {
    return false;
  }

  // Check retryable patterns
  if (
    retryablePatterns.some(
      (pattern) => errorMessage.includes(pattern) || errorName.includes(pattern)
    )
  ) {
    return true;
  }

  // Default: retry unknown errors (safer for infrastructure issues)
  return true;
}
