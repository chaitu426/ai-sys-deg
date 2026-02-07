/**
 * Projects API routes
 * GET /api/projects - List user's projects
 * GET /api/projects/:projectId/detailed - Get detailed project information
 * POST /api/projects/:projectId/agents/:agentType - Trigger optional agent
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { projectRepository } from '../../db/repositories/project-repository';
import { userRepository } from '../../db/repositories/user-repository';
import { getOrchestrator } from '../../core/orchestrator';
import { getLogger } from '../../utils/logger';
import { authenticate } from '../../auth/middleware';
import { AgentType } from '../../core/contracts';

const logger = getLogger();

/**
 * GET /api/projects
 * List all projects for authenticated user
 */
async function listProjects(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    const page = parseInt((request.query as any).page || '1');
    const limit = parseInt((request.query as any).limit || '20');

    logger.debug('Listing projects', { userId, page, limit });

    const result = await userRepository.getUserProjects(userId, page, limit);

    return reply.status(200).send({
      success: true,
      projects: result.projects.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        latestVersion: p.designVersions[0]
          ? {
              version: p.designVersions[0].version,
              status: p.designVersions[0].status,
            }
          : null,
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error) {
    logger.error('Failed to list projects', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * GET /api/projects/:projectId/detailed
 * Get comprehensive project details
 */
async function getDetailedProject(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    logger.debug('Getting detailed project', { userId, projectId });

    const project = await projectRepository.getProjectById(projectId);

    if (!project) {
      return reply.status(404).send({
        success: false,
        error: 'Project not found',
      });
    }

    if (project.userId !== userId) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden: You do not have access to this project',
      });
    }

    // Get all design versions with complete agent outputs
    const allVersions = await Promise.all(
      project.designVersions.map(async (version) => {
        const agentOutputs: Record<string, unknown> = {};

        for (const output of version.agentOutputs) {
          if (output.status === 'completed' && output.output) {
            agentOutputs[output.agentType] = output.output;
          }
        }

        return {
          version: version.version,
          status: version.status,
          prompt: version.prompt,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
          completedAt: version.completedAt,
          agentOutputs,
        };
      })
    );

    // Build comprehensive response
    const latestVersion = project.designVersions[0];
    const response: {
      success: boolean;
      project: {
        id: string;
        title: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        versions: Array<{
          version: number;
          status: string;
          prompt: string;
          createdAt: Date;
          updatedAt: Date;
          completedAt: Date | null;
          agentOutputs: Record<string, unknown>;
        }>;
        latestVersion?: {
          requirements?: unknown;
          systemDesign?: unknown;
          techStack?: unknown;
          diagrams?: unknown;
          apiDesign?: unknown;
          costEstimation?: unknown;
          deploymentStrategy?: unknown;
          failureModeAnalyzer?: unknown;
        };
      };
    } = {
      success: true,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        versions: allVersions,
      },
    };

    // Add latest version details
    if (latestVersion) {
      const latestOutputs: Record<string, unknown> = {};
      for (const output of latestVersion.agentOutputs) {
        if (output.status === 'completed' && output.output) {
          switch (output.agentType) {
            case 'requirement_analyzer':
              latestOutputs.requirements = output.output;
              break;
            case 'system_design':
              latestOutputs.systemDesign = output.output;
              break;
            case 'tech_stack':
              latestOutputs.techStack = output.output;
              break;
            case 'diagram_generator':
              latestOutputs.diagrams = output.output;
              break;
            case 'api_design':
              latestOutputs.apiDesign = output.output;
              break;
            case 'cost_estimation':
              latestOutputs.costEstimation = output.output;
              break;
            case 'deployment_strategy':
              latestOutputs.deploymentStrategy = output.output;
              break;
            case 'failure_mode_analyzer':
              latestOutputs.failureModeAnalyzer = output.output;
              break;
          }
        }
      }
      response.project.latestVersion = latestOutputs;
    }

    return reply.status(200).send(response);
  } catch (error) {
    logger.error('Failed to get detailed project', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * POST /api/projects/:projectId/agents/:agentType
 * Trigger optional agent on demand
 */
async function triggerAgent(
  request: FastifyRequest<{
    Params: { projectId: string; agentType: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { projectId, agentType } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Validate agent type
    const validOptionalAgents: AgentType[] = [
      'api_design',
      'cost_estimation',
      'deployment_strategy',
      'failure_mode_analyzer',
    ];

    if (!validOptionalAgents.includes(agentType as AgentType)) {
      return reply.status(400).send({
        success: false,
        error: `Invalid agent type. Must be one of: ${validOptionalAgents.join(', ')}`,
      });
    }

    // Verify project ownership
    const project = await projectRepository.getProjectWithLatestVersion(projectId);
    if (!project) {
      return reply.status(404).send({
        success: false,
        error: 'Project not found',
      });
    }

    if (project.userId !== userId) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden: You do not have access to this project',
      });
    }

    // Get latest design version
    const latestVersion = project.designVersions[0];
    if (!latestVersion) {
      return reply.status(400).send({
        success: false,
        error: 'No design version found for this project',
      });
    }

    logger.info('Triggering optional agent', { userId, projectId, agentType });

    // Trigger agent
    await getOrchestrator().triggerOptionalAgent(latestVersion.id, agentType as any);

    return reply.status(200).send({
      success: true,
      message: `Agent ${agentType} triggered successfully`,
      designVersionId: latestVersion.id,
    });
  } catch (error) {
    logger.error('Failed to trigger agent', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * Register project routes
 */
export async function registerProjectRoutes(fastify: FastifyInstance) {
  fastify.get('/api/projects', { preHandler: [authenticate] }, listProjects);
  fastify.get(
    '/api/projects/:projectId/detailed',
    { preHandler: [authenticate] },
    getDetailedProject as any
  );
  fastify.post(
    '/api/projects/:projectId/agents/:agentType',
    { preHandler: [authenticate] },
    triggerAgent as any
  );
}
