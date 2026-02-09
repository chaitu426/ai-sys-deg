/**
 * GitHub OAuth API routes
 * GET /api/auth/github - Redirect to GitHub
 * GET /api/auth/github/callback - Handle callback
 * GET /api/github/repos - List user repositories
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
// import { z } from 'zod';
// import { userRepository } from '../../db/repositories/user-repository';
import { getLogger } from '../../utils/logger';
import { authenticate } from '../../auth/middleware';
import { getConfig } from '../../utils/config';
import axios from 'axios';
import { prisma } from '../../db/client';

const logger = getLogger();

/**
 * GET /api/auth/github
 * Redirect to GitHub OAuth
 */
async function githubLogin(request: FastifyRequest, reply: FastifyReply) {
  const config = getConfig();
  const userId = (request.user as { userId: string })?.userId;

  if (!userId) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }

  if (!config.GITHUB_CLIENT_ID) {
    return reply.status(500).send({ success: false, error: 'GitHub OAuth not configured' });
  }

  // Use a state parameter to prevent CSRF and link to the user
  const returnTo = (request.query as any).returnTo || '/dashboard';
  const state = encodeURIComponent(JSON.stringify({ userId, returnTo }));
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&redirect_uri=${config.GITHUB_CALLBACK_URL}&scope=repo,user:email&state=${state}`;

  return reply.redirect(githubUrl);
}

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
async function githubCallback(request: FastifyRequest, reply: FastifyReply) {
  const { code, state } = request.query as { code: string; state: string };
  const config = getConfig();

  try {
    const { userId, returnTo } = JSON.parse(decodeURIComponent(state));

    if (!userId) {
      throw new Error('Invalid state: userId missing');
    }

    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: config.GITHUB_CALLBACK_URL,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token, error } = tokenResponse.data;

    if (error) {
      throw new Error(`GitHub OAuth error: ${error}`);
    }

    // 2. Get GitHub user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const githubUser = userResponse.data;

    // 3. Update user in database
    await (prisma.user as any).update({
      where: { id: userId },
      data: {
        githubId: githubUser.id.toString(),
        githubAccessToken: access_token,
      },
    });

    logger.info('GitHub account connected', { userId, githubId: githubUser.id });

    // 4. Redirect back to frontend dashboard
    const frontendUrl = getConfig().FRONTEND_URL;
    const redirectPath = returnTo.startsWith('/') ? returnTo : '/dashboard';
    const separator = redirectPath.includes('?') ? '&' : '?';
    return reply.redirect(`${frontendUrl}${redirectPath}${separator}github_connected=true`);
  } catch (error) {
    logger.error('GitHub callback failed', error);
    const frontendUrl = getConfig().FRONTEND_URL;
    return reply.redirect(`${frontendUrl}/dashboard?github_error=true`);
  }
}

/**
 * GET /api/github/repos
 * List authenticated user's repositories
 */
async function listRepos(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { userId: string })?.userId;

  if (!userId) {
    return reply.status(401).send({ success: false, error: 'Unauthorized' });
  }

  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { githubAccessToken: true },
    });

    if (!user?.githubAccessToken) {
      return reply.status(400).send({ success: false, error: 'GitHub account not connected' });
    }

    const response = await axios.get('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: { Authorization: `token ${user.githubAccessToken}` },
    });

    const repos = response.data.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
    }));

    return reply.status(200).send({ success: true, repos });
  } catch (error) {
    logger.error('Failed to list GitHub repos', error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch repositories' });
  }
}

/**
 * Register GitHub routes
 */
export async function registerGitHubRoutes(fastify: FastifyInstance) {
  fastify.get('/api/auth/github', { preHandler: [authenticate] }, githubLogin);
  fastify.get('/api/auth/github/callback', githubCallback);
  fastify.get('/api/github/repos', { preHandler: [authenticate] }, listRepos);
}
