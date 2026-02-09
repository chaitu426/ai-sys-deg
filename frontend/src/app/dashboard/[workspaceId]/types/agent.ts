export type AgentType =
  | 'repository_analyzer'
  | 'requirement_analyzer'
  | 'system_design'
  | 'tech_stack'
  | 'diagram_generator'
  | 'api_design'
  | 'cost_estimation'
  | 'deployment_strategy'
  | 'failure_mode_analyzer';

export type AgentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AgentOutput {
  agentType: AgentType;
  status: AgentStatus;
  output?: any;
  error?: string;
  completedAt?: string;
}

export const AGENT_DISPLAY_NAMES: Record<AgentType, string> = {
  repository_analyzer: 'Repository Analyzer',
  requirement_analyzer: 'Requirement Analyzer',
  system_design: 'System Design',
  tech_stack: 'Tech Stack',
  diagram_generator: 'Diagram Generator',
  api_design: 'API Design',
  cost_estimation: 'Cost Estimation',
  deployment_strategy: 'Deployment Strategy',
  failure_mode_analyzer: 'Failure Mode Analyzer',
};

export const ORDERED_AGENTS: AgentType[] = [
  'repository_analyzer',
  'requirement_analyzer',
  'system_design',
  'tech_stack',
  'api_design',
  'deployment_strategy',
  'cost_estimation',
  'failure_mode_analyzer',
  'diagram_generator',
];

export const OPTIONAL_AGENTS: AgentType[] = [
  'api_design',
  'cost_estimation',
  'deployment_strategy',
  'failure_mode_analyzer',
  'diagram_generator', // Visuals are optional
];
