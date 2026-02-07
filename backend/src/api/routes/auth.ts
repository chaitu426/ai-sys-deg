/**
 * Authentication API routes
 * POST /api/auth/register - Register new user
 * POST /api/auth/login - Login user
 * GET /api/auth/me - Get current user
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { userRepository } from '../../db/repositories/user-repository';
import { getLogger } from '../../utils/logger';
import { generateToken } from '../../auth/jwt';
import { authenticate } from '../../auth/middleware';
import { emailService } from '../../utils/email-service';
// import { prisma } from '../../db/client'; // Removed direct usage
import { logAudit } from '../../utils/audit-logger';

const logger = getLogger();

// Request schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  name: z.string().max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(128),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
async function register(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, name, password } = registerSchema.parse(request.body);

    logger.info('User registration attempt', { email });

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Create user (defaults to isVerified: false)
    const user = await userRepository.createUser({
      email,
      name,
      password,
    });

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to DB
    await userRepository.createOtp(user.id, otpCode, 'signup');

    // Send email
    await emailService.sendVerificationEmail(email, otpCode);

    // Audit Log
    await logAudit('signup', { email }, user.id);

    logger.info('User registered, OTP sent', { userId: user.id, email });

    return reply.status(201).send({
      success: true,
      message: 'Registration initiated. Please verify your email with the OTP sent.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error('Registration failed', error);

    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * POST /api/auth/login
 * Login user
 */
async function login(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email, password } = loginSchema.parse(request.body);

    logger.info('User login attempt', { email });

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isValid = await userRepository.verifyPassword(user, password);
    if (!isValid) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Check if verified
    if (!(user as any).isVerified) {
      // Re-send OTP if needed? For now just block
      return reply.status(403).send({
        success: false,
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Generate JWT token
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
      },
      request.server
    );

    const { resolveUserPlan } = await import('../../utils/plans');
    const accuratePlan = resolveUserPlan({
      plan: user.plan,
      currentPeriodEnd: user.currentPeriodEnd,
    });

    logger.info('User logged in successfully', { userId: user.id, email });

    // Audit Log
    await logAudit('login', { email }, user.id);

    return reply.status(200).send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: accuratePlan,
        isVerified: (user as any).isVerified,
        subscriptionStatus: (user as any).subscriptionStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    logger.error('Login failed', error);

    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
async function getMe(request: any, reply: any) {
  try {
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    const { resolveUserPlan } = await import('../../utils/plans');
    const accuratePlan = resolveUserPlan({
      plan: user.plan,
      currentPeriodEnd: user.currentPeriodEnd,
    });

    return reply.status(200).send({
      success: true,
      user: {
        ...user,
        plan: accuratePlan,
      },
    });
  } catch (error) {
    logger.error('Get me failed', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify account registration with OTP
 */
async function verifyOtp(request: any, reply: any) {
  try {
    const { email, code } = verifyOtpSchema.parse(request.body);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    if ((user as any).isVerified) {
      return reply.status(400).send({ success: false, error: 'Account already verified' });
    }

    const validOtp = await userRepository.findValidOtp(user.id, code, 'signup');
    if (!validOtp) {
      return reply.status(400).send({ success: false, error: 'Invalid or expired OTP code' });
    }

    // Use repository transaction
    await userRepository.verifyUserWithOtp(user.id, 'signup');

    // Audit Log
    await logAudit('email_verified', { email }, user.id);

    // Generate JWT token so they are logged in immediately
    const token = generateToken(
      {
        userId: user.id,
        email: user.email,
      },
      request.server
    );

    logger.info('User verified successfully', { userId: user.id, email });

    // Fetch full user for response
    const updatedUser = await userRepository.findById(user.id);

    const { resolveUserPlan } = await import('../../utils/plans');
    const accuratePlan = updatedUser
      ? resolveUserPlan({
        plan: updatedUser.plan,
        currentPeriodEnd: updatedUser.currentPeriodEnd,
      })
      : 'FREE';

    return reply.status(200).send({
      success: true,
      message: 'Account verified successfully',
      user: updatedUser ? { ...updatedUser, plan: accuratePlan } : null,
      token,
    });
  } catch (error) {
    logger.error('Verification failed', error);
    if (error instanceof z.ZodError) {
      return reply
        .status(400)
        .send({ success: false, error: 'Validation error', details: error.errors });
    }
    return reply.status(500).send({ success: false, error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/resend-otp
 */
async function resendOtp(request: any, reply: any) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    if ((user as any).isVerified) {
      return reply.status(400).send({ success: false, error: 'User already verified' });
    }

    // Invalidate old ones
    await userRepository.invalidateOtps(user.id, 'signup');

    // Create new
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await userRepository.createOtp(user.id, otpCode, 'signup');
    await emailService.sendVerificationEmail(email, otpCode);

    return reply.status(200).send({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    return reply.status(500).send({ success: false, error: 'Resend failed' });
  }
}

/**
 * Register auth routes
 */
export async function registerAuthRoutes(fastify: any) {
  // Stricter rate limiting for auth routes
  const authRateLimit = {
    max: 10,
    timeWindow: '1 minute',
  };

  fastify.post('/api/auth/register', { config: { rateLimit: authRateLimit } }, register);
  fastify.post('/api/auth/login', { config: { rateLimit: authRateLimit } }, login);
  fastify.post('/api/auth/verify-otp', { config: { rateLimit: authRateLimit } }, verifyOtp);
  fastify.post(
    '/api/auth/resend-otp',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    resendOtp
  );
  fastify.get('/api/auth/me', { preHandler: [authenticate] }, getMe);
}
