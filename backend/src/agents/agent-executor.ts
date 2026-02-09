/**
 * Agent executor dispatchar
 * Routes agent execution to apropriate implementation
 */

import { AgentType, AgentContext, AgentExecutionResult, AGENTS } from '../core/contracts';
import { requirementAnalyzerAgent } from './requirement-analyzer';
import { systemDesignAgent } from './system-design';
import { techStackAgent } from './tech-stack';
import { diagramGeneratorAgent } from './diagram-generator';
import { apiDesignAgent } from './api-design';
import { costEstimationAgent } from './cost-estimation';
import { deploymentStrategyAgent } from './deployment-strategy';
import { failureModeAnalyzerAgent } from './failure-mode-analyzer';
import { repositoryAnalyzerAgent } from './repository-analyzer';
import { getLogger } from '../utils/logger';
import { toolRegistry } from '../tools/registry';

const logger = getLogger();

/**
 * Execute an agent based on type
 */
export async function executeAgent(
  agentType: AgentType,
  context: AgentContext
): Promise<AgentExecutionResult> {
  logger.info('Executing agent', { agentType, designVersionId: context.designVersionId });

  try {
    let output: unknown;

    // Inject allowed tools into context
    const allowedTools = toolRegistry.getToolsForAgent(agentType);
    if (allowedTools.length > 0) {
      // We just pass the names here for reference if needed,
      // but the actual tools are resolved by the agent runner using the registry
      context.allowedTools = allowedTools.map((t) => t.name);
    }

    switch (agentType) {
      case 'requirement_analyzer':
        // Modified execution for tool support
        output = await requirementAnalyzerAgent.execute(context);
        break;

      case AGENTS.SYSTEM_DESIGN:
        output = await systemDesignAgent.execute(context);
        break;

      case AGENTS.TECH_STACK:
        output = await techStackAgent.execute(context);
        break;

      case 'diagram_generator':
        output = await diagramGeneratorAgent.execute(context);
        break;

      case 'api_design':
        output = await apiDesignAgent.execute(context);
        break;

      case 'cost_estimation':
        output = await costEstimationAgent.execute(context);
        break;

      case 'deployment_strategy':
        output = await deploymentStrategyAgent.execute(context);
        break;

      case 'failure_mode_analyzer':
        output = await failureModeAnalyzerAgent.execute(context);
        break;

      case AGENTS.REPOSITORY_ANALYZER:
        output = await repositoryAnalyzerAgent.execute(context);
        break;

      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    return {
      success: true,
      output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Agent execution error', { agentType, error: errorMessage });
    return {
      success: false,
      error: errorMessage,
    };
  }
}
