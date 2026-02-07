export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM',
}

export const PLAN_LIMITS = {
  [Plan.FREE]: {
    label: 'Explorer',
    maxProjects: 3,
    maxProjectsPerMonth: 3,
    agents: [
      'requirement_analyzer',
      'system_design',
      'tech_stack',
      'diagram_generator',
      'api_design',
    ],
    canExport: false,
    exportFormats: [] as string[],
    historyDays: 7,
    price: 0,
  },
  [Plan.PRO]: {
    label: 'Builder',
    maxProjects: 50,
    maxProjectsPerMonth: 50,
    agents: [
      'requirement_analyzer',
      'system_design',
      'tech_stack',
      'diagram_generator',
      'api_design',
      'cost_estimation',
      'deployment_strategy',
      'failure_mode_analyzer',
    ],
    canExport: false,
    exportFormats: [] as string[],
    historyDays: 90,
    price: 19,
  },
  [Plan.PREMIUM]: {
    label: 'Architect',
    maxProjects: -1, // Unlimited
    maxProjectsPerMonth: -1,
    agents: [
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
    historyDays: -1, // Unlimited
    price: 49,
  },
};

export const FEATURES = {
  requirement_analyzer: {
    name: 'Requirement Analysis',
    description: 'AI analyzes your prompt to generate functional requirements.',
    plans: [Plan.FREE, Plan.PRO, Plan.PREMIUM],
  },
  system_design: {
    name: 'System Architecture',
    description: 'Generates high-level system design and component breakdown.',
    plans: [Plan.FREE, Plan.PRO, Plan.PREMIUM],
  },
  tech_stack: {
    name: 'Tech Stack Selection',
    description: 'Recommends databases, frameworks, and technologies.',
    plans: [Plan.FREE, Plan.PRO, Plan.PREMIUM],
  },
  diagram_generator: {
    name: 'Architecture Diagrams',
    description: 'Visual Mermaid diagrams for your system.',
    plans: [Plan.FREE, Plan.PRO, Plan.PREMIUM],
  },
  api_design: {
    name: 'API Specifications',
    description: 'OpenAPI/Swagger definitions for your services.',
    plans: [Plan.FREE, Plan.PRO, Plan.PREMIUM],
  },
  cost_estimation: {
    name: 'Cost Estimation',
    description: 'Predict cloud infrastructure costs.',
    plans: [Plan.PRO, Plan.PREMIUM],
  },
  deployment_strategy: {
    name: 'Deployment Strategy',
    description: 'CI/CD pipelines, cloud architecture, and scaling plans.',
    plans: [Plan.PRO, Plan.PREMIUM],
  },
  failure_mode_analyzer: {
    name: 'Failure Mode Analysis',
    description: 'Identify potential points of failure and mitigation strategies.',
    plans: [Plan.PRO, Plan.PREMIUM],
  },

};

/**
 * Check if an agent is available for a given plan
 */
export function isAgentAvailable(plan: Plan | string, agentType: string): boolean {
  const planKey = plan as Plan;
  return PLAN_LIMITS[planKey]?.agents.includes(agentType) ?? false;
}
