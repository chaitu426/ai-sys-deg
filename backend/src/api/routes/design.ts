/**
 * Design API routes
 * POST /api/design - Create design
 * GET /api/design/:projectId - Get design status
 * PUT /api/design/:projectId - Update design
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getOrchestrator } from '../../core/orchestrator';
import { projectRepository } from '../../db/repositories/project-repository';
import { getLogger } from '../../utils/logger';
import { authenticate } from '../../auth/middleware';
// import { prisma } from '../../db/client'; // Removed direct prisma access
import { getGeminiClient } from '../../llm/gemini-client';
import { PromptGenerator } from '../../utils/prompt-generator';
import { sanitizePrompt } from '../../utils/sanitize';
import { logAudit } from '../../utils/audit-logger';
import { AGENTS } from '../../core/contracts';

const logger = getLogger();

// Request schemas
const createDesignSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .max(10000, 'Prompt cannot exceed 10,000 characters'),
});

const updateDesignSchema = z.object({
  change: z
    .string()
    .min(1, 'Change description is required')
    .max(5000, 'Change description cannot exceed 5,000 characters'),
  agentType: z
    .enum(Object.values(AGENTS) as [string, ...string[]])
    .optional(),
});

/**
 * POST /api/design
 * Create a new design project
 */
async function createDesign(
  request: FastifyRequest<{ Body: { prompt: string } }>,
  reply: FastifyReply
) {
  try {
    const { prompt } = createDesignSchema.parse(request.body);

    // Sanitize user input to prevent injection attacks
    const sanitizedPrompt = sanitizePrompt(prompt);

    if (!sanitizedPrompt || sanitizedPrompt.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid prompt content after sanitization',
      });
    }

    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    logger.info('Creating design', { userId, promptLength: prompt.length });

    // Get user's plan and check limits
    const { userRepository } = await import('../../db/repositories/user-repository');
    const user = await userRepository.findById(userId);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    const { canCreateProject, getPlanLimits, resolveUserPlan } = await import('../../utils/plans');
    const userPlan = resolveUserPlan(user);
    const limits = getPlanLimits(userPlan);

    // Count user's projects this month (using UTC to be fair across timezones)
    const projectCount = await projectRepository.countUserProjectsMonth(userId);

    if (!canCreateProject(userPlan, projectCount)) {
      return reply.status(403).send({
        success: false,
        error: `Project limit reached. Your ${limits.label} plan allows ${limits.maxProjectsPerMonth} projects per month. Upgrade to create more.`,
        code: 'PROJECT_LIMIT_REACHED',
        currentCount: projectCount,
        limit: limits.maxProjectsPerMonth,
      });
    }

    // Create project with sanitized prompt
    const project = await projectRepository.createProject({
      userId,
      title: `Design: ${sanitizedPrompt.substring(0, 100)}`,
      description: sanitizedPrompt,
    });

    // Start workflow (orchestrator will filter agents by plan)
    const designVersionId = await getOrchestrator().startDesignWorkflow(
      project.id,
      sanitizedPrompt,
      userPlan as any // Pass user plan to orchestrator
    );

    // Audit Log
    await logAudit(
      'project_created',
      {
        projectId: project.id,
        title: project.title,
      },
      userId,
      designVersionId
    );

    return reply.status(201).send({
      success: true,
      projectId: project.id,
      designVersionId,
      message: 'Design workflow started',
    });
  } catch (error) {
    logger.error('Failed to create design', error);

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
 * GET /api/design/:projectId
 * Get design status and artifacts
 */
async function getDesign(
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

    logger.debug('Getting design', { userId, projectId });

    const project = await projectRepository.getProjectWithLatestVersion(projectId);

    if (!project) {
      return reply.status(404).send({
        success: false,
        error: 'Project not found',
      });
    }

    // Verify ownership
    if (project.userId !== userId) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden: You do not have access to this project',
      });
    }

    // Get latest design version
    const latestVersion = project.designVersions[0];

    if (!latestVersion) {
      return reply.status(200).send({
        success: true,
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          status: 'no_versions',
        },
      });
    }

    // Build response with progressive results and ALL agent outputs
    const response: {
      success: boolean;
      project: {
        id: string;
        title: string;
        description: string | null;
        status: string;
        version: number;
        progress: {
          total: number;
          completed: number;
          pending: number;
          processing: number;
          failed: number;
          completionPercentage: number;
        };
        agentStatus: Array<{
          agentType: string;
          status: string;
          completedAt?: Date | null;
        }>;
        requirements?: unknown;
        systemDesign?: unknown;
        techStack?: unknown;
        diagrams?: unknown;
        apiDesign?: unknown;
        costEstimation?: unknown;
        deploymentStrategy?: unknown;
        failureModeAnalysis?: unknown;
      };
    } = {
      success: true,
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        status: latestVersion.status,
        version: latestVersion.version,
        progress: {
          total: 0,
          completed: 0,
          pending: 0,
          processing: 0,
          failed: 0,
          completionPercentage: 0,
        },
        agentStatus: [],
      },
    };

    // Calculate progress and add agent status
    const allAgentTypes = Object.values(AGENTS);

    response.project.progress.total = allAgentTypes.length;

    // Add completed agent outputs and track status
    for (const agentOutput of latestVersion.agentOutputs) {
      // Track agent status
      response.project.agentStatus.push({
        agentType: agentOutput.agentType,
        status: agentOutput.status,
        completedAt: agentOutput.completedAt,
      });

      // Update progress counters
      switch (agentOutput.status) {
        case 'completed':
          response.project.progress.completed++;
          break;
        case 'pending':
          response.project.progress.pending++;
          break;
        case 'processing':
          response.project.progress.processing++;
          break;
        case 'failed':
          response.project.progress.failed++;
          break;
      }

      // Add output data if completed
      if (agentOutput.status === 'completed' && agentOutput.output) {
        switch (agentOutput.agentType) {
          case AGENTS.REQUIREMENT_ANALYZER:
            response.project.requirements = agentOutput.output;
            break;
          case AGENTS.SYSTEM_DESIGN:
            response.project.systemDesign = agentOutput.output;
            break;
          case AGENTS.TECH_STACK:
            response.project.techStack = agentOutput.output;
            break;
          case AGENTS.DIAGRAM_GENERATOR:
            response.project.diagrams = agentOutput.output;
            break;
          case AGENTS.API_DESIGN:
            response.project.apiDesign = agentOutput.output;
            break;
          case AGENTS.COST_ESTIMATION:
            response.project.costEstimation = agentOutput.output;
            break;
          case AGENTS.DEPLOYMENT_STRATEGY:
            response.project.deploymentStrategy = agentOutput.output;
            break;
          case AGENTS.FAILURE_MODE_ANALYZER:
            response.project.failureModeAnalysis = agentOutput.output;
            break;
        }
      }
    }

    // Calculate completion percentage
    response.project.progress.completionPercentage = Math.round(
      (response.project.progress.completed / response.project.progress.total) * 100
    );

    return reply.status(200).send(response);
  } catch (error) {
    logger.error('Failed to get design', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * PUT /api/design/:projectId
 * Update design (creates new version)
 */
// ... existing code ...

const VALID_AGENTS = Object.values(AGENTS);

/**
 * PUT /api/design/:projectId
 * Update design (creates new version)
 */
async function updateDesign(
  request: FastifyRequest<{
    Params: { projectId: string };
    Body: { change: string; agentType?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const { change } = updateDesignSchema.parse(request.body);
    let { agentType } = request.body; // Use mutable let for agentType
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Smart Agent Selection Logic
    if (!agentType) {
      logger.info('Agent type not provided, calculating best start point', { change });

      try {
        const gemini = getGeminiClient();
        const prompt = `
You are a Senior Staff Software Engineer acting as the system architecture orchestrator.

Your responsibility is to analyze a requested change and determine the earliest agent in the design pipeline that must be re-run to correctly and safely apply the update.

The user wants to update their system design with the following request:
"${change}"

You must reason about the BLAST RADIUS of this change.
Choose the earliest point in the pipeline where assumptions may no longer hold.

PIPELINE ORDER (STRICT):
1. requirement_analyzer — Core functional or non-functional requirements, scale, constraints, compliance, users
2. system_design — High-level architecture, service boundaries, data flow, scalability patterns
3. tech_stack — Concrete technology choices (databases, frameworks, runtimes)
4. diagram_generator — Visual representations of the architecture and flows
5. api_design — Public/internal API endpoints and request/response schemas
6. cost_estimation — Infrastructure usage, pricing, scaling costs
7. deployment_strategy — CI/CD, cloud setup, release strategy, scaling model
8. failure_mode_analyzer — Reliability risks, failure scenarios, mitigation strategies

DECISION RULES (CRITICAL):
- If the change alters user-facing behavior, scale, performance expectations, security posture, or compliance → start at "requirement_analyzer"
- If the change modifies system structure, responsibilities, or communication patterns → start at "system_design"
- If the change introduces, replaces, or removes a concrete technology → start at "tech_stack"
- If the change is primarily about visualization or documentation of structure → start at "diagram_generator"
- If the change adds, removes, or modifies API behavior or data contracts → start at "api_design"
- If the change affects infrastructure size, traffic volume, or third-party usage → start at "cost_estimation"
- If the change affects deployment model, environments, or release process → start at "deployment_strategy"
- If the change is about resilience, availability, or recovery behavior → start at "failure_mode_analyzer"

CONSERVATIVE RULE:
- If a change could invalidate earlier assumptions, always choose the EARLIEST affected agent.
- If the change is ambiguous, cross-cutting, or fundamental, return "requirement_analyzer".

OUTPUT RULE (ABSOLUTE):
- Return ONLY the exact agent name as a string.
- Do NOT include explanations, quotes, formatting, or additional text.

EXAMPLES:
- "Add Redis for caching" → tech_stack
- "Add a new user profile API" → api_design
- "Make the system serverless" → deployment_strategy
- "The system must handle 1M concurrent users" → requirement_analyzer
- "Split the monolith into services" → system_design
- "Reduce monthly infra cost by 40%" → cost_estimation
`;

        const result = await gemini.generate(prompt);
        const inferredAgent = result.text.trim().toLowerCase().replace(/['"`]/g, '');

        if (VALID_AGENTS.includes(inferredAgent as any)) {
          agentType = inferredAgent;
          logger.info('Smart Update inferred agent', { inferredAgent });
        } else {
          logger.warn('Smart Update inferred invalid agent, falling back to requirement_analyzer', {
            inferredAgent,
          });
          agentType = AGENTS.REQUIREMENT_ANALYZER;
        }
      } catch (err) {
        logger.error('Smart Update failed to infer agent, falling back', err);
        agentType = AGENTS.REQUIREMENT_ANALYZER;
      }
    }

    logger.info('Updating design', {
      userId,
      projectId,
      changeLength: change.length,
      targetAgent: agentType,
    });

    // Verify project exists and ownership
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

    // Create new version and start workflow
    const designVersionId = await getOrchestrator().updateDesign(
      projectId,
      change,
      agentType as any
    );

    return reply.status(200).send({
      success: true,
      projectId,
      designVersionId,
      inferredAgent: agentType, // Return distinctively so UI can show it
      message: 'Design update workflow started',
    });
  } catch (error) {
    logger.error('Failed to update design', error);

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

const answerQuestionsSchema = z.object({
  answers: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .min(1, 'At least one answer is required'),
});

/**
 * POST /api/design/:projectId/answer
 * Submit answers to clarifying questions
 */
async function answerQuestions(
  request: FastifyRequest<{
    Params: { projectId: string };
    Body: { answers: Array<{ question: string; answer: string }> };
  }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const { answers } = answerQuestionsSchema.parse(request.body);
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    logger.info('Submitting answers', { userId, projectId, answerCount: answers.length });

    // Verify project exists and ownership
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
      return reply.status(404).send({
        success: false,
        error: 'No design version found',
      });
    }

    // 1. Update the design version prompt with Q&A
    const qaText = answers.map((a) => `\nQ: ${a.question}\nA: ${a.answer}`).join('\n');

    // Check if we already have clarifications to avoid duplicates or mess
    const separator = '\n\n[User Clarifications]';
    let updatedPrompt = latestVersion.prompt;

    if (updatedPrompt.includes(separator)) {
      updatedPrompt += qaText;
    } else {
      updatedPrompt += `${separator}${qaText}`;
    }

    await projectRepository.updateDesignVersionPrompt(latestVersion.id, updatedPrompt);

    // 2. Reset the requirement_analyzer output
    await projectRepository.resetAgentOutput(latestVersion.id, AGENTS.REQUIREMENT_ANALYZER);

    // 3. Add audit log
    await logAudit('questions_answered', { answers }, userId, latestVersion.id);

    // 4. Resume workflow (will re-run requirement_analyzer)
    await getOrchestrator().continueWorkflow(latestVersion.id);

    return reply.status(200).send({
      success: true,
      message: 'Answers submitted, requirement analysis restarting',
    });
  } catch (error) {
    logger.error('Failed to submit answers', error);

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
 * GET /api/design/:projectId/doc
 * Generate system design documentation
 */
async function getDesignDoc(
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

    logger.debug('Generating documentation', { userId, projectId });

    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      return reply.status(404).send({ success: false, error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return reply.status(403).send({ success: false, error: 'Forbidden' });
    }

    const latestVersion = project.designVersions[0];
    if (!latestVersion) {
      return reply.status(404).send({ success: false, error: 'No design version found' });
    }

    // Dynamic import to avoid circular dependency issues at module level if any
    const { DocumentationGenerator } = await import('../../utils/doc-generator');
    const markdown = DocumentationGenerator.generateMarkdown(project, latestVersion);

    return reply.status(200).send({
      success: true,
      markdown,
      title: `${project.title.replace(/[^a-z0-9]/gi, '_')}_design_doc.md`,
    });
  } catch (error) {
    logger.error('Failed to generate documentation', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * POST /api/design/:projectId/pause
 */
async function pauseDesign(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) return reply.status(401).send({ success: false, error: 'Unauthorized' });

    const project = await projectRepository.getProjectWithLatestVersion(projectId);
    if (!project || project.userId !== userId)
      return reply.status(404).send({ success: false, error: 'Project not found' });

    const latestVersion = project.designVersions[0];
    if (!latestVersion)
      return reply.status(404).send({ success: false, error: 'No design version found' });

    await getOrchestrator().pauseWorkflow(latestVersion.id);

    return reply.status(200).send({ success: true, message: 'Workflow paused' });
  } catch (error) {
    logger.error('Failed to pause design', error);
    return reply.status(500).send({ success: false, error: 'Internal server error' });
  }
}

/**
 * POST /api/design/:projectId/resume
 */
async function resumeDesign(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) return reply.status(401).send({ success: false, error: 'Unauthorized' });

    const project = await projectRepository.getProjectWithLatestVersion(projectId);
    if (!project || project.userId !== userId)
      return reply.status(404).send({ success: false, error: 'Project not found' });

    const latestVersion = project.designVersions[0];
    if (!latestVersion)
      return reply.status(404).send({ success: false, error: 'No design version found' });

    await getOrchestrator().resumeWorkflow(latestVersion.id);

    return reply.status(200).send({ success: true, message: 'Workflow resumed' });
  } catch (error) {
    logger.error('Failed to resume design', error);
    return reply.status(500).send({ success: false, error: 'Internal server error' });
  }
}

/**
 * POST /api/design/:projectId/retry/:agentType
 */
async function retryAgent(
  request: FastifyRequest<{ Params: { projectId: string; agentType: string } }>,
  reply: FastifyReply
) {
  try {
    const { projectId, agentType } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) return reply.status(401).send({ success: false, error: 'Unauthorized' });

    const project = await projectRepository.getProjectWithLatestVersion(projectId);
    if (!project || project.userId !== userId)
      return reply.status(404).send({ success: false, error: 'Project not found' });

    const latestVersion = project.designVersions[0];
    if (!latestVersion)
      return reply.status(404).send({ success: false, error: 'No design version found' });

    if (!VALID_AGENTS.includes(agentType as any)) {
      return reply.status(400).send({ success: false, error: 'Invalid agent type' });
    }

    await getOrchestrator().retryAgent(latestVersion.id, agentType as any);

    return reply.status(200).send({ success: true, message: `Retrying ${agentType}` });
  } catch (error) {
    logger.error('Failed to retry agent', error);
    return reply.status(500).send({ success: false, error: 'Internal server error' });
  }
}

/**
 * GET /api/design/:projectId/openapi
 * Generate OpenAPI specification
 */
async function getOpenApiSpec(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const project = await projectRepository.getProjectWithLatestVersion(projectId);
    if (!project) {
      return reply.status(404).send({ success: false, error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return reply.status(403).send({ success: false, error: 'Forbidden' });
    }

    // Check Plan Limits
    const { userRepository } = await import('../../db/repositories/user-repository');
    const user = await userRepository.findById(userId);
    const userPlan = user?.plan || 'FREE';
    const { canExport } = await import('../../utils/plans');

    if (!canExport(userPlan, 'json')) {
      // OpenAPI is JSON
      return reply.status(403).send({
        success: false,
        error: 'OpenAPI export is locked. Please upgrade to the Premium plan.',
      });
    }

    const latestVersion = project.designVersions[0];
    if (!latestVersion) {
      return reply.status(404).send({ success: false, error: 'No design version found' });
    }

    const apiDesignOutput = latestVersion.agentOutputs.find(
      (out) => out.agentType === AGENTS.API_DESIGN && out.status === 'completed'
    );

    if (!apiDesignOutput || !apiDesignOutput.output) {
      return reply.status(404).send({ success: false, error: 'API Design not yet completed' });
    }

    const { OpenApiGenerator } = await import('../../utils/openapi-generator');
    const spec = OpenApiGenerator.generate(project.title, apiDesignOutput.output as any);

    return reply.status(200).send({
      success: true,
      spec,
      title: `${project.title.replace(/[^a-z0-9]/gi, '_')}_openapi.json`,
    });
  } catch (error) {
    logger.error('Failed to generate OpenAPI spec', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
/**
 * GET /api/design/:projectId/prompts
 * Get sequential Vibe Coder prompts
 */
async function getDesignPrompts(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const project = await projectRepository.getProjectWithLatestVersion(projectId);
    if (!project) {
      return reply.status(404).send({ success: false, error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return reply.status(403).send({ success: false, error: 'Forbidden' });
    }

    // Check Plan Limits
    const { userRepository } = await import('../../db/repositories/user-repository');
    const user = await userRepository.findById(userId);
    const userPlan = user?.plan || 'FREE';
    const { canAccessVibeCoder } = await import('../../utils/plans');

    if (!canAccessVibeCoder(userPlan)) {
      return reply.status(403).send({
        success: false,
        error:
          'Vibe Coder implementation flow is restricted to Pro and Premium users. Please upgrade.',
      });
    }

    const latestVersion = project.designVersions[0];
    if (!latestVersion) {
      return reply.status(404).send({ success: false, error: 'No design version found' });
    }

    const prompts = PromptGenerator.generatePrompts(latestVersion, latestVersion.sharedMemory as any);

    return reply.status(200).send({
      success: true,
      prompts,
    });
  } catch (error) {
    logger.error('Failed to generate prompts', error);
    return reply.status(500).send({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

/**
 * Register design routes
 */
export async function registerDesignRoutes(fastify: FastifyInstance) {
  // Rate limiting for design creation (10 requests per hour per user)
  const createDesignRateLimit = {
    max: 10,
    timeWindow: '1 hour',
    keyGenerator: (request: any) => {
      // Rate limit per user ID
      const userId = (request.user as { userId: string })?.userId;
      return userId || request.ip;
    },
  };

  fastify.post(
    '/api/design',
    {
      preHandler: [authenticate],
      config: { rateLimit: createDesignRateLimit },
    },
    createDesign as any
  );
  fastify.get('/api/design/:projectId', { preHandler: [authenticate] }, getDesign as any);
  fastify.post(
    '/api/design/:projectId/answer',
    { preHandler: [authenticate] },
    answerQuestions as any
  );
  fastify.put('/api/design/:projectId', { preHandler: [authenticate] }, updateDesign as any);
  fastify.post('/api/design/:projectId/pause', { preHandler: [authenticate] }, pauseDesign as any);
  fastify.post(
    '/api/design/:projectId/resume',
    { preHandler: [authenticate] },
    resumeDesign as any
  );
  fastify.post(
    '/api/design/:projectId/retry/:agentType',
    { preHandler: [authenticate] },
    retryAgent as any
  );
  fastify.get('/api/design/:projectId/doc', { preHandler: [authenticate] }, getDesignDoc as any);
  fastify.get(
    '/api/design/:projectId/openapi',
    { preHandler: [authenticate] },
    getOpenApiSpec as any
  );
  fastify.get(
    '/api/design/:projectId/prompts',
    { preHandler: [authenticate] },
    getDesignPrompts as any
  );
}
