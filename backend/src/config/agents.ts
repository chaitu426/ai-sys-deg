/**
 * Centralized agent configuration
 * Single source of truth for all agent types
 */

import { AgentType, AGENTS } from '../core/contracts';

/**
 * Core agents executed in sequence
 * These form the main design workflow pipeline
 */
export const CORE_AGENTS: AgentType[] = [
  'requirement_analyzer',
  'system_design',
  'tech_stack',
  'diagram_generator',
  'api_design',
  'cost_estimation',
  'deployment_strategy',
  'failure_mode_analyzer',
];

/**
 * Optional agents that can be triggered separately
 * These have soft dependencies on core agents
 */
export const OPTIONAL_AGENTS: AgentType[] = [
  'api_design',
  'cost_estimation',
  'deployment_strategy',
  'failure_mode_analyzer',
];

/**
 * All valid agent types (union of core and unique optionals)
 */
export const ALL_AGENTS: AgentType[] = Array.from(new Set([...CORE_AGENTS, ...OPTIONAL_AGENTS]));

/**
 * Validate if an agent type is valid
 */
export function isValidAgentType(agentType: string): agentType is AgentType {
  return ALL_AGENTS.includes(agentType as AgentType);
}

/**
 * Get agent display name for UI
 */
export function getAgentDisplayName(agentType: AgentType): string {
  const names: Record<AgentType, string> = {
    [AGENTS.REQUIREMENT_ANALYZER]: 'Requirement Analyzer',
    [AGENTS.SYSTEM_DESIGN]: 'System Design',
    [AGENTS.TECH_STACK]: 'Tech Stack',
    [AGENTS.DIAGRAM_GENERATOR]: 'Diagram Generator',
    [AGENTS.API_DESIGN]: 'API Design',
    [AGENTS.COST_ESTIMATION]: 'Cost Estimation',
    [AGENTS.DEPLOYMENT_STRATEGY]: 'Deployment Strategy',
    [AGENTS.FAILURE_MODE_ANALYZER]: 'Failure Mode Analyzer',
    [AGENTS.PERFORMANCE_ANALYZER]: 'Performance Analyzer',
    [AGENTS.SECURITY_ANALYZER]: 'Security Analyzer',
    [AGENTS.CRITIC]: 'System Critic',
  };
  return names[agentType] || agentType;
}

/**
 * Get agent execution order index (lower = earlier)
 */
export function getAgentOrder(agentType: AgentType): number {
  return CORE_AGENTS.indexOf(agentType);
}
