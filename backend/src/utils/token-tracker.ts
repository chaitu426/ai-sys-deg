/**
 * Token usage tracking service
 * Records LLM API usage for cost analysis and budget enforcement
 */

import { prisma } from '../db/client';
import { getLogger } from '../utils/logger';

const logger = getLogger();

export interface TokenUsageData {
  designVersionId: string;
  agentType: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Track token usage in database
 */
export async function trackTokenUsage(data: TokenUsageData): Promise<void> {
  try {
    // Fetch design version to get user and project ID
    const designVersion = await prisma.designVersion.findUnique({
      where: { id: data.designVersionId },
      include: { project: true },
    });

    if (!designVersion) {
      logger.warn('Design version not found for token tracking', {
        designVersionId: data.designVersionId,
      });
      return;
    }

    await prisma.tokenUsage.create({
      data: {
        userId: designVersion.project.userId,
        projectId: designVersion.projectId,
        designVersionId: data.designVersionId,
        agentType: data.agentType,
        provider: data.provider,
        model: data.model,
        inputTokens: data.promptTokens,
        outputTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        estimatedCost: data.estimatedCost,
      },
    });

    logger.info('Token usage tracked', {
      designVersionId: data.designVersionId,
      agentType: data.agentType,
      totalTokens: data.totalTokens,
      cost: data.estimatedCost,
    });
  } catch (error: any) {
    // Don't fail agent execution if token tracking fails
    logger.error('Failed to track token usage', {
      error: error.message,
      data,
    });
  }
}

/**
 * Get token usage summary for a design version
 */
export async function getTokenUsageSummary(designVersionId: string) {
  const usage = await prisma.tokenUsage.aggregate({
    where: { designVersionId },
    _sum: {
      totalTokens: true,
      estimatedCost: true,
    },
    _count: true,
  });

  return {
    totalTokens: usage._sum?.totalTokens || 0,
    totalCost: usage._sum?.estimatedCost || 0,
    requests: usage._count,
  };
}

/**
 * Calculate estimated cost based on provider pricing
 * Prices as of 2026 (estimated)
 */
export function calculateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Pricing per 1M tokens
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'groq/gemma-7b-it': { prompt: 0.05, completion: 0.07 },
    'groq/llama3-8b-8192': { prompt: 0.05, completion: 0.08 },
    'groq/llama3-70b-8192': { prompt: 0.59, completion: 0.79 },
    'google/gemini-pro': { prompt: 0.5, completion: 0.15 },
    'google/gemini-pro-vision': { prompt: 0.5, completion: 0.15 },
  };

  const key = `${provider}/${model}`;
  const rates = pricing[key] || { prompt: 0.1, completion: 0.1 }; // Default fallback

  const promptCost = (promptTokens / 1_000_000) * rates.prompt;
  const completionCost = (completionTokens / 1_000_000) * rates.completion;

  return promptCost + completionCost;
}
