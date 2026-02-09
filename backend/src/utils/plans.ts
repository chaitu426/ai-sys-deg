/**
 * Plan definitions and limits
 * Server-side source of truth for subscription tiers
 */

import { AgentType } from '../core/contracts';

export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
}

export interface PlanLimits {
  label: string;
  maxProjects: number;
  maxProjectsPerMonth: number;
  allowedAgents: AgentType[];
  canExport: boolean;
  exportFormats: string[];
  canAccessVibeCoder: boolean; // New Flag
  historyDays: number;
  queuePriority: number; // Lower = higher priority
  price: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  [Plan.FREE]: {
    label: 'Explorer',
    maxProjects: 3,
    maxProjectsPerMonth: 3,
    allowedAgents: [
      'repository_analyzer',
      'requirement_analyzer',
      'system_design',
      'tech_stack',
      'diagram_generator',
      'api_design',
    ],
    canExport: false,
    exportFormats: [],
    canAccessVibeCoder: false, // Locked
    historyDays: 7,
    queuePriority: 100,
    price: 0,
  },
  [Plan.PRO]: {
    label: 'Builder',
    maxProjects: 50,
    maxProjectsPerMonth: 50,
    allowedAgents: [
      'repository_analyzer',
      'requirement_analyzer',
      'system_design',
      'tech_stack',
      'diagram_generator',
      'api_design',
      'cost_estimation',
      'deployment_strategy',
      'failure_mode_analyzer',
    ],
    canExport: false, // Updated: Pro cannot export documents
    exportFormats: [],
    canAccessVibeCoder: true, // Unlocked
    historyDays: 90,
    queuePriority: 10,
    price: 19,
  },
  [Plan.PREMIUM]: {
    label: 'Architect',
    maxProjects: -1, // Unlimited
    maxProjectsPerMonth: -1,
    allowedAgents: [
      'repository_analyzer',
      'requirement_analyzer',
      'system_design',
      'tech_stack',
      'diagram_generator',
      'api_design',
      'cost_estimation',
      'deployment_strategy',
      'failure_mode_analyzer',
    ],
    canExport: true,
    exportFormats: ['pdf', 'png', 'markdown', 'drawio', 'json'],
    canAccessVibeCoder: true, // Unlocked
    historyDays: -1, // Unlimited
    queuePriority: 1,
    price: 49,
  },
};

/**
 * Get plan limits for a given plan
 */
export function getPlanLimits(plan: Plan | string): PlanLimits {
  const planKey = plan as Plan;
  return PLAN_LIMITS[planKey] || PLAN_LIMITS[Plan.FREE];
}

/**
 * Check if an agent is allowed for a plan
 */
export function isAgentAllowed(plan: Plan | string, agentType: AgentType): boolean {
  const limits = getPlanLimits(plan);
  return limits.allowedAgents.includes(agentType);
}

/**
 * Filter agents to only those allowed by plan
 */
export function filterAgentsByPlan(plan: Plan | string, agents: AgentType[]): AgentType[] {
  const limits = getPlanLimits(plan);
  return agents.filter((agent) => limits.allowedAgents.includes(agent));
}

/**
 * Check if user can create more projects
 */
export function canCreateProject(plan: Plan | string, currentProjectCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxProjects === -1) return true; // Unlimited
  return currentProjectCount < limits.maxProjects;
}

/**
 * Check if export is allowed
 */
export function canExport(plan: Plan | string, format?: string): boolean {
  const limits = getPlanLimits(plan);
  if (!limits.canExport) return false;
  if (format && !limits.exportFormats.includes(format.toLowerCase())) return false;
  return true;
}

/**
 * Check if Vibe Coder is allowed
 */
export function canAccessVibeCoder(plan: Plan | string): boolean {
  const limits = getPlanLimits(plan);
  return limits.canAccessVibeCoder;
}

/**
 * Resolve user plan based on current database state and expiry date.
 * Enforces local downgrade if currentPeriodEnd has passed.
 */
export function resolveUserPlan(user: { plan: Plan | string; currentPeriodEnd?: Date | null }): Plan {
  const storedPlan = (user.plan as Plan) || Plan.FREE;

  // Free users don't have an expiry
  if (storedPlan === Plan.FREE) return Plan.FREE;

  // If we have an expiry date and it's in the past, downgrade to FREE
  if (user.currentPeriodEnd) {
    const now = new Date();
    if (new Date(user.currentPeriodEnd) < now) {
      return Plan.FREE;
    }
  }

  return storedPlan;
}
