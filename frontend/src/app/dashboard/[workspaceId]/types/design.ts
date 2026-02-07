export interface Project {
  id: string;
  title: string;
  prompt: string;
  status: 'active' | 'archived';
  userId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt?: string;
  description?: string;
  latestVersion?: {
    version: number;
    status: string;
  };
}

export interface Requirements {
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  assumptions: string[];
  clarifyingDecisions: string[];
  questions?: string[];
  researchSources?: { title: string; url: string }[];
  isApproved?: boolean;
}

export interface SystemComponent {
  name: string;
  description: string;
  responsibilities: string[];
}

export interface ServicedBoundary {
  service: string;
  description: string;
  responsibilities: string[];
}

export interface DataFlowStep {
  step: number;
  description: string;
  components: string[];
}

export interface SystemDesign {
  highLevelComponents: SystemComponent[];
  serviceBoundaries: ServicedBoundary[];
  dataFlow: {
    description: string;
    flowSteps: DataFlowStep[];
  };
  scalingStrategy: {
    horizontalScaling: string[];
    verticalScaling: string[];
    databaseScaling: string;
    cachingStrategy: string;
  };
  faultTolerance: {
    redundancyApproach: string;
    failureModes: string[];
    mitigationStrategies: string[];
  };
  researchSources?: { title: string; url: string }[];
}

export interface TechSection {
  primary?: string; // framework, runtime, etc.
  framework?: string;
  runtime?: string;
  language?: string;
  database?: string;
  queue?: string;
  compute?: string;
  justification?: string;
  reason?: string;
  [key: string]: string | undefined;
}

export interface TechStack {
  frontend?: TechSection | string;
  backend?: TechSection | string;
  database?: TechSection | string;
  messaging?: TechSection | string;
  infrastructure?: TechSection | string;
  tradeOffAnalysis?: {
    category: string;
    selected: string;
    alternatives: string[];
    researchSummary: string;
    sources?: { title: string; url: string }[];
    score: number;
  }[];
  [key: string]: any;
}

export interface Diagrams {
  highLevelSystem: string;
  requestFlow: string;
  scalingView: string;
  cloudArchitecture: string;
  apiArchitecture: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
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
  authentication?: string;
  rateLimiting?: string;
}

export interface ApiDesign {
  apiVersioning: string;
  errorHandling: string;
  documentation: string;
  endpoints: ApiEndpoint[];
  researchSources?: { title: string; url: string }[];
}

export interface InfrastructureCost {
  estimatedMonthly: number;
  breakdown: {
    component: string;
    type?: string;
    service?: string;
    quantity?: number;
    cost: number;
  }[];
}

export interface CostEstimation {
  totalMonthly: number;
  totalYearly: number;
  infrastructure: {
    compute?: InfrastructureCost;
    storage?: InfrastructureCost;
    networking?: InfrastructureCost;
    [key: string]: InfrastructureCost | undefined;
  };
  scalingProjection?: Record<string, number>;
  costOptimization?: string[];
  researchSources?: { title: string; url: string }[];
}

export interface DeploymentEnvironment {
  name: string;
  purpose: string;
  infrastructure: string;
}

export interface DeploymentStrategy {
  deploymentModel: string;
  rollbackStrategy: string;
  environments: DeploymentEnvironment[];
  ciCd: {
    pipeline: string;
    stages: string[];
    tools: string[];
  };
  blueGreenDeployment?: string;
  canaryDeployment?: string;
  disasterRecovery?: string;
  researchSources?: { title: string; url: string }[];
}

export interface FailureModeAnalysis {
  resilienceScore: number;
  singlePointsOfFailure: string[];
  recommendations: string[];
  failureScenarios?: string[]; // Legacy support
  risks?: string[]; // Legacy support
  failureModes?: string[]; // Legacy support
  researchSources?: { title: string; url: string }[];
}

export interface DesignVersion {
  id: string;
  projectId: string;
  version: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requirements?: Requirements;
  systemDesign?: SystemDesign;
  techStack?: TechStack;
  diagrams?: Diagrams;
  apiDesign?: ApiDesign;
  costEstimation?: CostEstimation;
  deploymentStrategy?: DeploymentStrategy;
  failureModeAnalysis?: FailureModeAnalysis;
  createdAt: string;
}
