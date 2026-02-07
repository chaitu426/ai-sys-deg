import { Tool } from './core/tool';
import { AgentType, AGENTS } from '../core/contracts';

/**
 * Registry to manage available tools and access control
 */
export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private accessControl = new Map<AgentType, string[]>();

  constructor() {
    this.initializeAccessControl();
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getToolsForAgent(agentType: AgentType): Tool[] {
    const allowedToolNames = this.accessControl.get(agentType) || [];
    return allowedToolNames
      .map((name) => this.tools.get(name))
      .filter((tool): tool is Tool => !!tool);
  }

  getToolCount(): number {
    return this.tools.size;
  }

  private initializeAccessControl() {
    // Define which agents can use which tools

    // Requirement Analyzer: User safety, compliance
    this.accessControl.set('requirement_analyzer', ['compliance_checker']);

    // System Design: Capacity, Compliance, Latency, DB Selection, Security
    this.accessControl.set('system_design', [
      'capacity_calculator',
      'compliance_checker',
      'latency_budget_calculator',
      'database_selector',
      'threat_modeler'
    ]);

    // Cost Estimation: Pricing, Capacity
    this.accessControl.set('cost_estimation', ['cloud_pricing', 'capacity_calculator']);

    // Tech Stack: Tech Radar, DB Selection, Deep Research
    this.accessControl.set('tech_stack', ['tech_radar', 'database_selector', 'deep_research']);

    // Failure Mode: Threat Modeling
    this.accessControl.set('failure_mode_analyzer', ['threat_modeler']);

    // API Design: Deep Research for API standards
    this.accessControl.set('api_design', ['deep_research']);

    // Deployment Strategy: Deep Research for CI/CD patterns
    this.accessControl.set('deployment_strategy', ['deep_research']);

    // Diagram Generator: No tools needed (pure generation)
    this.accessControl.set('diagram_generator', []);
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
