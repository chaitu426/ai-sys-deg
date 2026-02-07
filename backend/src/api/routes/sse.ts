/**
 * Server-Sent Events (SSE) API route
 * GET /api/design/:projectId/events - Stream real-time design progress
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { projectRepository } from '../../db/repositories/project-repository';
import { getLogger } from '../../utils/logger';
import {
  designEvents,
  DesignProgressEvent,
  WorkflowCompletedEvent,
  ToolExecutionEvent,
} from '../../utils/event-emitter';
import { AGENTS } from '../../core/contracts';

const logger = getLogger();

/**
 * GET /api/design/:projectId/events
 * Establish SSE connection for real-time updates
 */
async function streamDesignProgress(
  request: FastifyRequest<{
    Params: { projectId: string };
    Querystring: { token?: string };
  }>,
  reply: FastifyReply
) {
  const { projectId } = request.params;

  // SSE doesn't support custom headers, so accept token from query param
  const tokenFromQuery = request.query.token;
  let userId: string | undefined;

  if (tokenFromQuery) {
    try {
      // Verify token manually
      const decoded = (request.server as any).jwt.verify(tokenFromQuery) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  } else {
    // Fallback to standard auth header (for clients that can set headers)
    userId = (request.user as { userId: string })?.userId;
  }

  if (!userId) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Verify project exists and user has access
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

  logger.info('SSE connection established', { userId, projectId });

  // Set SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial state
  const latestVersion = project.designVersions[0];
  if (latestVersion) {
    const allAgentTypes = Object.values(AGENTS);

    const total = allAgentTypes.length;
    const completed = latestVersion.agentOutputs.filter(
      (output) => output.status === 'completed'
    ).length;

    const initialEvent = {
      event: 'initial_state',
      data: {
        projectId,
        designVersionId: latestVersion.id,
        status: latestVersion.status,
        progress: {
          total,
          completed,
          percentage: Math.round((completed / total) * 100),
        },
        agentOutputs: latestVersion.agentOutputs.map((output) => ({
          agentType: output.agentType,
          status: output.status,
          completedAt: output.completedAt,
        })),
      },
    };

    reply.raw.write(`event: ${initialEvent.event}\n`);
    reply.raw.write(`data: ${JSON.stringify(initialEvent.data)}\n\n`);
  }

  // Helper function to send SSE event
  const sendEvent = (eventName: string, data: any) => {
    reply.raw.write(`event: ${eventName}\n`);
    reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Listen for progress events for this specific project
  const handleProgressEvent = (
    event: DesignProgressEvent | ToolExecutionEvent | WorkflowCompletedEvent
  ) => {
    if ('agentType' in event && 'status' in event) {
      // Both agent and tool events have agentType and status
      if ('toolName' in event) {
        // Tool execution event
        const toolEvent = event as ToolExecutionEvent;
        sendEvent('tool_execution', {
          agentType: toolEvent.agentType,
          toolName: toolEvent.toolName,
          status: toolEvent.status,
          input: toolEvent.input,
          output: toolEvent.output,
          error: toolEvent.error,
          timestamp: toolEvent.timestamp,
        });
      } else {
        // Agent progress event
        const progressEvent = event as DesignProgressEvent;

        switch (progressEvent.status) {
          case 'started':
            sendEvent('agent_started', {
              agentType: progressEvent.agentType,
              timestamp: progressEvent.timestamp,
            });
            break;
          case 'completed':
            sendEvent('agent_completed', {
              agentType: progressEvent.agentType,
              output: progressEvent.output,
              progress: progressEvent.progress,
              timestamp: progressEvent.timestamp,
            });
            break;
          case 'failed':
            sendEvent('agent_failed', {
              agentType: progressEvent.agentType,
              error: progressEvent.error,
              timestamp: progressEvent.timestamp,
            });
            break;
        }
      }
    } else {
      // Workflow completed event
      const completedEvent = event as WorkflowCompletedEvent;
      sendEvent('workflow_completed', {
        status: completedEvent.status,
        timestamp: completedEvent.timestamp,
      });

      // Close connection after workflow completes
      reply.raw.end();
    }
  };

  designEvents.onProjectEvent(projectId, handleProgressEvent);

  // Handle client disconnect
  request.raw.on('close', () => {
    logger.info('SSE connection closed', { userId, projectId });
    designEvents.offProjectEvent(projectId, handleProgressEvent);
    reply.raw.end();
  });

  // Keep connection alive with periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    reply.raw.write(':heartbeat\n\n');
  }, 30000); // Every 30 seconds

  request.raw.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}

/**
 * Register SSE routes
 */
export async function registerSSERoutes(fastify: FastifyInstance) {
  // Don't use authenticate preHandler - we handle auth manually to support query param token
  fastify.get('/api/design/:projectId/events', streamDesignProgress as any);
}
