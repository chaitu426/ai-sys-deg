/**
 * Approval API routes
 * POST /api/design/:projectId/approve - Approve requirements and continue workflow
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getOrchestrator } from '../../core/orchestrator';
import { projectRepository } from '../../db/repositories/project-repository';
import { getLogger } from '../../utils/logger';
import { authenticate } from '../../auth/middleware';
import { RequirementAnalyzerOutput } from '../../core/contracts';
import { sanitizeAgentArray } from '../../utils/sanitize';

const logger = getLogger();

// Schema for approval request
const approveRequirementsSchema = z.object({
  approvedRequirements: z.preprocess(
    (input: any) => {
      if (!input) return input;
      return {
        ...input,
        functionalRequirements: sanitizeAgentArray(input.functionalRequirements),
        nonFunctionalRequirements: sanitizeAgentArray(input.nonFunctionalRequirements),
        assumptions: sanitizeAgentArray(input.assumptions),
        clarifyingDecisions: sanitizeAgentArray(input.clarifyingDecisions),
      };
    },
    z.object({
      functionalRequirements: z.array(z.string()),
      nonFunctionalRequirements: z.array(z.string()),
      assumptions: z.array(z.string()),
      clarifyingDecisions: z.array(z.string()),
    })
  ).optional(),
});

/**
 * POST /api/design/:projectId/approve
 * Approve requirements and resume workflow
 */
async function approveRequirements(
  request: FastifyRequest<{
    Params: { projectId: string };
    Body: { approvedRequirements?: RequirementAnalyzerOutput };
  }>,
  reply: FastifyReply
) {
  try {
    const { projectId } = request.params;
    const { approvedRequirements } = approveRequirementsSchema.parse(request.body);
    const userId = (request.user as { userId: string })?.userId;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
      });
    }

    logger.info('Approving requirements', { userId, projectId });

    // Verify project exists and ownership
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

    // Get latest design version
    const latestVersion = project.designVersions[0];
    if (!latestVersion) {
      return reply.status(404).send({
        success: false,
        error: 'No design version found',
      });
    }

    // If requirements are updated, save them
    if (approvedRequirements) {
      // Find the requirement_analyzer output
      const agentOutput = latestVersion.agentOutputs.find(
        (o) => o.agentType === 'requirement_analyzer'
      );

      if (agentOutput) {
        await projectRepository.updateAgentOutput(agentOutput.id, {
          output: {
            // Merge existing output with new approved requirements
            ...(agentOutput.output as any),
            ...approvedRequirements,
            isApproved: true,
          },
        });

        await projectRepository.createAuditLog({
          designVersionId: latestVersion.id,
          action: 'requirements_updated_by_user',
          details: { approvedRequirements },
        });
      }
    } else {
      // Just approving existing requirements
      const agentOutput = latestVersion.agentOutputs.find(
        (o) => o.agentType === 'requirement_analyzer'
      );

      if (agentOutput) {
        await projectRepository.updateAgentOutput(agentOutput.id, {
          output: {
            ...(agentOutput.output as any),
            isApproved: true,
          },
        });
      }
    }

    // Resume workflow (force = true)
    await getOrchestrator().continueWorkflow(latestVersion.id, true);

    return reply.status(200).send({
      success: true,
      message: 'Requirements approved, workflow resumed',
    });
  } catch (error) {
    logger.error('Failed to approve requirements', error);

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
 * Register approval routes
 */
export async function registerApprovalRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/design/:projectId/approve',
    { preHandler: [authenticate] },
    approveRequirements as any
  );
}
