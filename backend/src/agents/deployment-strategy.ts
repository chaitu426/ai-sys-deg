/**
 * Deployment Strategy Agent
 * Designs deployment and CI/CD strategy
 * Uses runAgentWithTools for robust JSON parsing
 */

import {
  AgentContext,
  DeploymentStrategyOutput,
  SystemDesignOutput,
  TechStackOutput,
} from '../core/contracts';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) designing production-ready deployment strategies and CI/CD pipelines.

## Your Task
Define a comprehensive, realistic deployment and delivery strategy based on the system architecture and technology stack.

## Output Requirements
You MUST output ONLY a valid JSON object. No markdown, no explanations, no code blocks.

## JSON Schema (STRICT)
{
  "deploymentModel": "containerized|serverless|hybrid|vm-based",
  "environments": [
    {
      "name": "production",
      "purpose": "live user traffic",
      "infrastructure": "description"
    }
  ],
  "ciCd": {
    "pipeline": "description of pipeline",
    "stages": ["build", "test", "deploy"],
    "tools": ["GitHub Actions", "ArgoCD", etc.]
  },
  "rollbackStrategy": "how to rollback safely",
  "blueGreenDeployment": "strategy if applicable",
  "canaryDeployment": "strategy if applicable",
  "monitoring": ["monitoring tools and metrics"],
  "disasterRecovery": "DR strategy",
  "researchSources": [
    { "title": "Source name", "url": "https://example.com" }
  ]
}

## Design Guidelines
1. Design for zero-downtime or near-zero-downtime deployments
2. Prefer immutable deployments over in-place updates
3. Environments should include development, staging, production
4. CI/CD pipelines must include automated validation
5. Rollback strategies must be fast and automated
6. Include monitoring for both system health and business signals

## Tool Usage
- Use deep_research tool to research modern CI/CD patterns or cloud-specific deployment services
- Include any research sources in the researchSources field

## Critical Rules
- Output ONLY raw JSON
- Ensure all strings are properly escaped
- Do not use control characters in strings
`;

export const deploymentStrategyAgent = {
  async execute(context: AgentContext): Promise<DeploymentStrategyOutput> {
    logger.info('Executing deployment strategy agent', {
      designVersionId: context.designVersionId,
    });

    if (!context.previousOutputs.systemDesign || !context.previousOutputs.techStack) {
      throw new Error('System design and tech stack outputs required for deployment strategy');
    }

    const design = context.previousOutputs.systemDesign as SystemDesignOutput;
    const techStack = context.previousOutputs.techStack as TechStackOutput;

    const prompt = `Design a deployment strategy for the following system:

System Architecture:
- Components: ${design.highLevelComponents.map((c) => c.name).join(', ')}
- Services: ${design.serviceBoundaries.map((s) => s.service).join(', ')}

Tech Stack:
- Backend: ${techStack.backend.framework} on ${techStack.backend.runtime}
- Infrastructure: ${techStack.infrastructure.compute}
- Monitoring: ${techStack.infrastructure.monitoring}

Fault Tolerance:
- Redundancy: ${design.faultTolerance.redundancyApproach}
- Failure Modes: ${design.faultTolerance.failureModes.join(', ')}

Design a comprehensive deployment strategy including:
1. CI/CD pipeline with automated testing
2. Environment separation (dev, staging, prod)
3. Rollback and recovery strategies
4. Blue-green or canary deployment approaches
5. Disaster recovery plan
`;

    const { runAgentWithTools } = await import('./tool-runner');

    const agentContext = {
      ...context,
      prompt,
    };

    return runAgentWithTools(agentContext, SYSTEM_INSTRUCTION, (text) => {
      let jsonText = text.trim();

      // Strip markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // ROBUST SANITIZATION:
      // Only escape control characters inside string literals.
      jsonText = jsonText.replace(/"((?:[^"\\]|\\.)*)"/g, (_, content) => {
        const escapedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escapedContent}"`;
      });

      const parsed = JSON.parse(jsonText) as DeploymentStrategyOutput;

      // Validate structure
      if (!parsed.deploymentModel || !Array.isArray(parsed.environments) || !parsed.ciCd) {
        throw new Error('Invalid output structure');
      }

      // Ensure optional fields exist
      if (!parsed.researchSources) {
        parsed.researchSources = [];
      }

      logger.info('Deployment strategy agent completed', {
        designVersionId: context.designVersionId,
        environmentCount: parsed.environments.length,
      });

      return parsed;
    });
  },
};
