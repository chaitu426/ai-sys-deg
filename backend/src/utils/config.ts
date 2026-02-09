/**
 * Environment configuration with validation
 * Explicit contracts for all environment variables
 */

import { z } from 'zod';

const configSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // Google Gemini API
  GEMINI_API_KEY: z.string().min(1),

  // Groq API Key
  GROQ_API_KEY: z.string().min(1),

  // Resend API
  RESEND_API_KEY: z.string().min(1).optional(),

  // Server
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Dodo Payments
  DODO_PAYMENTS_API_KEY: z.string().min(1),
  DODO_PAYMENTS_WEBHOOK_KEY: z.string().min(1),
  DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),
  DODO_PAYMENTS_RETURN_URL: z.string().url().optional(),
  DODO_PRODUCT_ID_PRO: z.string().min(1),
  DODO_PRODUCT_ID_PREMIUM: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),

  // Internal Dashboard
  INTERNAL_DASHBOARD_PASSWORD: z.string().min(8),
  INTERNAL_SESSION_SECRET: z.string().min(32),

  // Worker Configuration
  WORKER_CONCURRENCY: z.coerce.number().int().positive().optional(),
  WORKER_MAX_JOBS_PER_SECOND: z.coerce.number().int().positive().optional(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().min(1).optional(), // Optional for now to not break existing setups
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
});

export type Config = z.infer<typeof configSchema>;

let config: Config | null = null;

export function getConfig(): Config {
  if (config) {
    return config;
  }

  // Load .env in development
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

  try {
    config = configSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((e) => e.message === 'Required')
        .map((e) => e.path.join('.'))
        .join(', ');

      const errorMsg = `Configuration validation failed:\n${error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`;

      if (missingVars) {
        throw new Error(
          `${errorMsg}\n\n💡 Solution: Create a .env file in the project root with the required variables.\n   Missing: ${missingVars}\n   See .env.example for a template.`
        );
      }

      throw new Error(errorMsg);
    }
    throw error;
  }
}
