/**
 * Project repository
 * Data access layer for projects
 */

import { prisma } from '../client';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export interface CreateProjectInput {
  userId: string;
  title: string;
  description?: string;
  githubRepoFullName?: string;
}

export interface CreateDesignVersionInput {
  projectId: string;
  prompt: string;
  githubRepoFullName?: string;
}

export class ProjectRepository {
  async createProject(input: CreateProjectInput) {
    logger.debug('Creating project', { userId: input.userId, title: input.title });
    return prisma.project.create({
      data: input,
    });
  }

  async getProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        designVersions: {
          orderBy: { version: 'desc' },
          include: {
            agentOutputs: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  }

  async getProjectWithLatestVersion(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
      include: {
        designVersions: {
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            agentOutputs: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  }

  async createDesignVersion(input: CreateDesignVersionInput) {
    logger.debug('Creating design version', { projectId: input.projectId });

    // Get the latest version number
    const latestVersion = await prisma.designVersion.findFirst({
      where: { projectId: input.projectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;

    return prisma.designVersion.create({
      data: {
        projectId: input.projectId,
        version: nextVersion,
        prompt: input.prompt,
        githubRepoFullName: input.githubRepoFullName,
        status: 'pending',
      },
    });
  }

  async getDesignVersion(projectId: string, version?: number) {
    if (version) {
      return prisma.designVersion.findUnique({
        where: {
          projectId_version: {
            projectId,
            version,
          },
        },
        include: {
          agentOutputs: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    // Get latest version
    return prisma.designVersion.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' },
      include: {
        agentOutputs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getDesignVersionById(designVersionId: string) {
    return prisma.designVersion.findUnique({
      where: { id: designVersionId },
      include: {
        agentOutputs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async updateDesignVersionStatus(
    designVersionId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused'
  ) {
    return prisma.designVersion.update({
      where: { id: designVersionId },
      data: {
        status,
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      },
    });
  }

  async createAgentOutput(input: {
    designVersionId: string;
    agentType: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    output?: unknown;
    error?: string;
  }) {
    return prisma.agentOutput.create({
      data: {
        designVersionId: input.designVersionId,
        agentType: input.agentType,
        status: input.status,
        output: input.output ? (input.output as object) : 'null',
        error: input.error || null,
        startedAt: input.status === 'processing' ? new Date() : null,
        completedAt: input.status === 'completed' ? new Date() : null,
      },
    });
  }

  async updateAgentOutput(
    agentOutputId: string,
    updates: {
      status?: 'pending' | 'processing' | 'completed' | 'failed';
      output?: unknown;
      error?: string;
    }
  ) {
    return prisma.agentOutput.update({
      where: { id: agentOutputId },
      data: {
        ...updates,
        output: updates.output ? (updates.output as object) : undefined,
        ...(updates.status === 'processing' && !updates.error ? { startedAt: new Date() } : {}),
        ...(updates.status === 'completed' ? { completedAt: new Date() } : {}),
      },
    });
  }

  async resetAgentOutput(designVersionId: string, agentType: string) {
    logger.info('Resetting agent output', { designVersionId, agentType });
    return prisma.agentOutput.deleteMany({
      where: {
        designVersionId,
        agentType,
      },
    });
  }

  async getAgentOutput(designVersionId: string, agentType: string) {
    return prisma.agentOutput.findUnique({
      where: {
        designVersionId_agentType: {
          designVersionId,
          agentType,
        },
      },
    });
  }

  async countUserProjectsMonth(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    return prisma.project.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });
  }

  async updateDesignVersionPrompt(designVersionId: string, prompt: string) {
    return prisma.designVersion.update({
      where: { id: designVersionId },
      data: { prompt },
    });
  }

  async createAuditLog(input: {
    designVersionId?: string; // Made optional
    userId?: string; // Added
    action: string;
    details?: unknown;
  }) {
    return prisma.auditLog.create({
      data: {
        designVersionId: input.designVersionId,
        userId: input.userId,
        action: input.action,
        details: input.details ? (input.details as object) : 'null',
      },
    });
  }
  async updateSharedMemory(
    designVersionId: string,
    updates: Partial<import('../../core/contracts').SharedMemory>
  ) {
    // 1. Get current memory
    const designVersion = await prisma.designVersion.findUnique({
      where: { id: designVersionId },
      select: { sharedMemory: true },
    });

    if (!designVersion) return;

    const currentMemory = (designVersion.sharedMemory as unknown as import('../../core/contracts').SharedMemory) || {
      decisions: [],
      constraints: [],
      risks: [],
      insights: {},
    };

    // 2. Merge updates
    const newMemory: import('../../core/contracts').SharedMemory = {
      decisions: [...new Set([...currentMemory.decisions, ...(updates.decisions || [])])],
      constraints: [...new Set([...currentMemory.constraints, ...(updates.constraints || [])])],
      risks: [...new Set([...currentMemory.risks, ...(updates.risks || [])])],
      insights: { ...currentMemory.insights, ...updates.insights },
    };

    // 3. Save
    return prisma.designVersion.update({
      where: { id: designVersionId },
      data: {
        sharedMemory: newMemory as any, // Cast to any for Prisma Json
      },
    });
  }
}

export const projectRepository = new ProjectRepository();
