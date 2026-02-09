import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../auth/middleware';
import { prisma } from '../../db/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

const saveWhiteboardSchema = z.object({
    type: z.string(),
    data: z.any(),
});

async function saveWhiteboard(
    request: FastifyRequest<{ Params: { projectId: string }; Body: { type: string; data: any } }>,
    reply: FastifyReply
) {
    try {
        const { projectId } = request.params;
        const { type, data } = saveWhiteboardSchema.parse(request.body);
        const userId = (request.user as { userId: string })?.userId;

        if (!userId) return reply.status(401).send({ success: false, error: 'Unauthorized' });

        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
        });

        if (!project || project.userId !== userId) {
            return reply.status(403).send({ success: false, error: 'Forbidden' });
        }

        const whiteboard = await prisma.whiteboard.upsert({
            where: {
                projectId_type: {
                    projectId,
                    type,
                },
            },
            update: {
                data,
            },
            create: {
                projectId,
                type,
                data,
            },
        });

        return reply.status(200).send({ success: true, whiteboard });
    } catch (error) {
        logger.error('Failed to save whiteboard', error);
        return reply.status(500).send({ success: false, error: 'Internal server error' });
    }
}

async function getWhiteboard(
    request: FastifyRequest<{ Params: { projectId: string }; Querystring: { type?: string } }>,
    reply: FastifyReply
) {
    try {
        const { projectId } = request.params;
        const { type } = request.query;
        const userId = (request.user as { userId: string })?.userId;

        if (!userId) return reply.status(401).send({ success: false, error: 'Unauthorized' });

        // Verify ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { userId: true },
        });

        if (!project || project.userId !== userId) {
            return reply.status(403).send({ success: false, error: 'Forbidden' });
        }

        if (type) {
            const whiteboard = await prisma.whiteboard.findUnique({
                where: {
                    projectId_type: {
                        projectId,
                        type,
                    },
                },
            });
            return reply.status(200).send({ success: true, whiteboard });
        } else {
            const whiteboards = await prisma.whiteboard.findMany({
                where: { projectId },
            });
            return reply.status(200).send({ success: true, whiteboards });
        }
    } catch (error) {
        logger.error('Failed to get whiteboard', error);
        return reply.status(500).send({ success: false, error: 'Internal server error' });
    }
}

export async function registerWhiteboardRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/api/whiteboard/:projectId',
        { preHandler: [authenticate] },
        saveWhiteboard
    );
    fastify.get(
        '/api/whiteboard/:projectId',
        { preHandler: [authenticate] },
        getWhiteboard
    );
}
