/**
 * Explicit contracts between agents and orchestration
 * Type-safe interfaces for agent inputs and outputs
 */

/**
 * Agent types in the system
 */
export const AGENTS = {
  REQUIREMENT_ANALYZER: 'requirement_analyzer',
  SYSTEM_DESIGN: 'system_design',
  TECH_STACK: 'tech_stack',
  DIAGRAM_GENERATOR: 'diagram_generator',
  API_DESIGN: 'api_design',
  COST_ESTIMATION: 'cost_estimation',
  DEPLOYMENT_STRATEGY: 'deployment_strategy',
  FAILURE_MODE_ANALYZER: 'failure_mode_analyzer',
  REPOSITORY_ANALYZER: 'repository_analyzer',
} as const;

export type AgentType = typeof AGENTS[keyof typeof AGENTS];

/**
 * Base contract for all agent outputs
 */
export interface AgentOutput {
  agentType: AgentType;
  status: 'completed' | 'failed';
  output?: unknown;
  error?: string;
}

/**
 * Requirement Analyzer output contract
 */
export interface RequirementAnalyzerOutput {
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  assumptions: string[];
  clarifyingDecisions: string[];
  questions?: string[]; // Questions for the user if requirements are ambiguous
  researchSources?: { title: string; url: string }[];
  isApproved?: boolean; // User approval status
}

/**
 * System Design Agent output contract
 * MUST NOT include tech stack names
 */
export interface SystemDesignOutput {
  highLevelComponents: Array<{
    name: string;
    description: string;
    responsibilities: string[];
    justification?: string;
  }>;
  serviceBoundaries: Array<{
    service: string;
    description: string;
    responsibilities: string[];
    justification?: string;
  }>;
  dataFlow: {
    description: string;
    flowSteps: Array<{
      step: number;
      description: string;
      components: string[];
    }>;
  };
  scalingStrategy: {
    horizontalScaling: string[];
    verticalScaling: string[];
    cachingStrategy: string;
    databaseScaling: string;
  };
  faultTolerance: {
    failureModes: string[];
    mitigationStrategies: string[];
    redundancyApproach: string;
  };
  researchSources?: { title: string; url: string }[];
}

/**
 * Tech Stack Agent output contract
 */
export interface TechStackOutput {
  frontend: {
    framework: string;
    stateManagement: string;
    buildTool: string;
    justification: string;
  };
  backend: {
    runtime: string;
    framework: string;
    justification: string;
  };
  database: {
    primary: string;
    caching: string;
    search?: string;
    justification: string;
  };
  messaging: {
    queue: string;
    pubsub?: string;
    justification: string;
  };
  infrastructure: {
    compute: string;
    storage: string;
    cdn?: string;
    monitoring: string;
    justification: string;
  };
  tradeOffAnalysis?: {
    category: string;
    selected: string;
    alternatives: string[];
    researchSummary: string;
    sources?: { title: string; url: string }[];
    score: number;
  }[];
}

/**
 * Diagram Generator output contract
 */
export interface DiagramGeneratorOutput {
  highLevelSystem: string; // Mermaid diagram
  requestFlow: string; // Mermaid diagram
  scalingView: string; // Mermaid diagram
  cloudArchitecture: string; // Mermaid diagram
  apiArchitecture: string; // Mermaid diagram
}

/**
 * API Design Agent output contract
 */
export interface APIDesignOutput {
  endpoints: Array<{
    method: string;
    path: string;
    description: string;
    requestBody?: {
      schema: string;
      example: any;
    };
    responseBody?: {
      schema: string;
      example: any;
    };
    authentication: 'required' | 'optional' | 'none';
    rateLimiting: string;
    justification?: string;
  }>;
  apiVersioning: string;
  errorHandling: string;
  documentation: string;
  researchSources?: { title: string; url: string }[];
}

/**
 * Cost Estimation Agent output contract
 */
export interface CostEstimationOutput {
  infrastructure: {
    compute: {
      estimatedMonthly: number;
      currency: string;
      breakdown: Array<{
        component: string;
        cost: number;
        quantity: number;
        unit: string;
      }>;
    };
    storage: {
      estimatedMonthly: number;
      breakdown: Array<{
        type: string;
        cost: number;
        size: string;
      }>;
    };
    networking: {
      estimatedMonthly: number;
      breakdown: Array<{
        service: string;
        cost: number;
      }>;
    };
    thirdParty: {
      estimatedMonthly: number;
      breakdown: Array<{
        service: string;
        cost: number;
      }>;
    };
  };
  totalMonthly: number;
  totalYearly: number;
  scalingProjection: {
    at100kUsers: number;
    at1mUsers: number;
    at10mUsers: number;
  };
  costOptimization: string[];
  researchSources?: { title: string; url: string }[];
}

/**
 * Deployment Strategy Agent output contract
 */
export interface DeploymentStrategyOutput {
  deploymentModel: string;
  environments: Array<{
    name: string;
    purpose: string;
    infrastructure: string;
  }>;
  ciCd: {
    pipeline: string;
    stages: string[];
    tools: string[];
  };
  rollbackStrategy: string;
  blueGreenDeployment?: string;
  canaryDeployment?: string;
  monitoring: string[];
  disasterRecovery: string;
  researchSources?: { title: string; url: string }[];
}

/**
 * Failure Mode Analyzer output contract
 */
export interface FailureModeAnalyzerOutput {
  failureScenarios: Array<{
    scenario: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigation: string[];
  }>;
  singlePointsOfFailure: string[];
  resilienceScore: number; // 0-100
  recommendations: string[];
  researchSources?: { title: string; url: string }[];
}

/**
 * Neural Board: Shared blackboard for cross-agent intelligence
 */
export interface SharedMemory {
  decisions: string[];      // Key architectural decisions made
  constraints: string[];    // Global constraints (budget, compliance)
  risks: string[];         // Identified risks to watch out for
  insights: Record<string, string>; // Unstructured insights (e.g. "User values privacy")
}

/**
 * Repository Analyzer output contract
 */
export interface RepositoryAnalyzerOutput {
  techStack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    infrastructure?: string[];
  };
  mainComponents: string[];
  purpose: string;
  architecturalPatterns?: string[];
  apis?: {
    type: string;
    endpoints: string[];
  };
  logicalApproach?: string;
}

/**
 * Context passed between agents
 */
export interface AgentContext {
  projectId: string;
  designVersionId: string;
  projectTitle: string;
  prompt: string;
  userPlan: string;
  githubRepoFullName?: string;
  sharedMemory: SharedMemory;
  previousOutputs: {
    repositoryAnalyzer?: RepositoryAnalyzerOutput;
    requirementAnalyzer?: RequirementAnalyzerOutput;
    systemDesign?: SystemDesignOutput;
    techStack?: TechStackOutput;
    diagramGenerator?: DiagramGeneratorOutput;
    apiDesign?: APIDesignOutput;
    costEstimation?: CostEstimationOutput;
    deploymentStrategy?: DeploymentStrategyOutput;
    failureModeAnalyzer?: FailureModeAnalyzerOutput;
  };
  allowedTools?: string[];
  agentType: AgentType;
  agentStatuses: Record<string, 'pending' | 'processing' | 'completed' | 'failed'>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  toolUsage?: Array<{
    tool: string;
    input: unknown;
    output: unknown;
  }>;
  memoryUpdates?: Partial<SharedMemory>; // Agents can propose updates to the shared memory
}

