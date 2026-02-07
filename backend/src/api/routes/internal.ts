import { prisma } from '../../db/client';
import { getLogger } from '../../utils/logger';
import { getConfig } from '../../utils/config';
import { getSessionStore } from '../../utils/session-store';
import * as crypto from 'crypto';
// import * as bcrypt from 'bcryptjs';

const logger = getLogger();
const config = getConfig();
const sessionStore = getSessionStore();

/**
 * Internal dashboard authentication
 * Now uses constant-time comparison for security
 */
async function login(request: any, reply: any) {
  try {
    const { password } = request.body;

    if (!password || typeof password !== 'string') {
      return reply.status(400).send({ success: false, error: 'Password required' });
    }

    // Use constant-time comparison to prevent timing attacks
    const expectedPassword = config.INTERNAL_DASHBOARD_PASSWORD;
    const isValid = crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));

    if (!isValid) {
      logger.warn('Failed internal dashboard login attempt');
      return reply.status(401).send({ success: false, error: 'Invalid password' });
    }

    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const session = await sessionStore.create(sessionToken, 'admin', 'admin@internal');

    logger.info('Internal dashboard login successful');

    return reply.status(200).send({
      success: true,
      token: sessionToken,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    logger.error('Internal dashboard login failed', error);
    return reply.status(500).send({ success: false, error: 'Login failed' });
  }
}

/**
 * Verify session middleware
 * Now uses Redis-backed session store
 */
async function verifySession(request: any, reply: any) {
  const token = request.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return reply.status(401).send({ success: false, error: 'No token provided' });
  }

  const session = await sessionStore.get(token);

  if (!session) {
    return reply.status(401).send({ success: false, error: 'Invalid or expired session' });
  }

  // Extend session on each request
  await sessionStore.extend(token);
}

/**
 * Get dashboard overview metrics
 */
async function getDashboard(request: any, reply: any) {
  try {
    const { timeRange = '30d' } = request.query;
    const now = new Date();
    const startDate = getStartDate(timeRange, now);

    // User metrics
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });

    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });

    // Revenue metrics
    const payments = await prisma.payment.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Project metrics
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.designVersion.count({
      where: { status: 'processing' },
    });

    // Token usage
    const tokenUsage = await prisma.tokenUsage.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
    });

    const tokensByProvider = await prisma.tokenUsage.groupBy({
      by: ['provider'],
      where: { createdAt: { gte: startDate } },
      _sum: {
        totalTokens: true,
        estimatedCost: true,
      },
    });

    return reply.status(200).send({
      success: true,
      data: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          new: newUsers,
          byPlan: usersByPlan.map((p) => ({ plan: p.plan, count: p._count })),
        },
        revenue: {
          total: totalRevenue,
          transactions: payments.length,
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
        },
        tokens: {
          total: tokenUsage._sum.totalTokens || 0,
          cost: tokenUsage._sum.estimatedCost || 0,
          byProvider: tokensByProvider.map((p) => ({
            provider: p.provider,
            tokens: p._sum.totalTokens || 0,
            cost: p._sum.estimatedCost || 0,
          })),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get dashboard metrics', error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch metrics' });
  }
}

/**
 * Get token usage analytics with time series
 */
async function getTokenAnalytics(request: any, reply: any) {
  try {
    const { timeRange = '30d', groupBy = 'day' } = request.query;
    const now = new Date();
    const startDate = getStartDate(timeRange, now);

    // Raw token usage data
    const tokenUsage = await prisma.tokenUsage.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        provider: true,
        totalTokens: true,
        estimatedCost: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by time period
    const grouped = groupByTimePeriod(tokenUsage, groupBy);

    return reply.status(200).send({
      success: true,
      data: {
        timeSeries: grouped,
        summary: {
          totalTokens: tokenUsage.reduce((sum, t) => sum + t.totalTokens, 0),
          totalCost: tokenUsage.reduce((sum, t) => sum + t.estimatedCost, 0),
          avgPerDay:
            tokenUsage.length > 0
              ? tokenUsage.reduce((sum, t) => sum + t.totalTokens, 0) / getDaysDiff(startDate, now)
              : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get token analytics', error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch analytics' });
  }
}

/**
 * Get user list with details
 */
async function getUsers(request: any, reply: any) {
  try {
    const { page = 1, limit = 50, plan } = request.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (plan) where.plan = plan;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isVerified: true,
        subscriptionStatus: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            payments: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.user.count({ where });

    const { resolveUserPlan } = await import('../../utils/plans');
    const accurateUsers = users.map((u) => ({
      ...u,
      plan: resolveUserPlan(u),
    }));

    return reply.status(200).send({
      success: true,
      data: {
        users: accurateUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Failed to get users', error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch users' });
  }
}

// Helper functions
function getStartDate(timeRange: string, now: Date): Date {
  const date = new Date(now);
  switch (timeRange) {
    case '1d':
      date.setDate(date.getDate() - 1);
      break;
    case '7d':
      date.setDate(date.getDate() - 7);
      break;
    case '30d':
      date.setDate(date.getDate() - 30);
      break;
    case '90d':
      date.setDate(date.getDate() - 90);
      break;
    default:
      date.setDate(date.getDate() - 30);
  }
  return date;
}

function getDaysDiff(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function groupByTimePeriod(data: any[], groupBy: string) {
  const grouped = new Map();

  data.forEach((item) => {
    const date = new Date(item.createdAt);
    let key: string;

    if (groupBy === 'hour') {
      key = date.toISOString().slice(0, 13) + ':00:00';
    } else if (groupBy === 'day') {
      key = date.toISOString().slice(0, 10);
    } else {
      // month
      key = date.toISOString().slice(0, 7);
    }

    if (!grouped.has(key)) {
      grouped.set(key, { date: key, tokens: 0, cost: 0, count: 0 });
    }

    const existing = grouped.get(key);
    existing.tokens += item.totalTokens;
    existing.cost += item.estimatedCost;
    existing.count += 1;
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Register internal dashboard routes
 */
export async function registerInternalRoutes(fastify: any) {
  // Rate limiting for auth
  const authRateLimit = {
    max: 5,
    timeWindow: '1 minute',
  };

  // Login endpoint
  fastify.post('/api/internal/login', { config: { rateLimit: authRateLimit } }, login);

  // Protected routes
  fastify.get('/api/internal/dashboard', { preHandler: [verifySession] }, getDashboard);
  fastify.get('/api/internal/tokens', { preHandler: [verifySession] }, getTokenAnalytics);
  fastify.get('/api/internal/users', { preHandler: [verifySession] }, getUsers);
}
