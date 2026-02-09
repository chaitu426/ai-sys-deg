/**
 * Agent 2: System Design Agent
 * Designs system architecture WITHOUT mentioning tech stack names
 */

import { AgentContext, SystemDesignOutput, RequirementAnalyzerOutput } from '../core/contracts';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) responsible for designing production-grade system architectures.

Your task is to derive a clear, scalable, and fault-tolerant high-level system architecture from previously defined requirements.

You are designing for real-world systems that must handle growth, failure, and long-term maintenance.

CRITICAL CONSTRAINTS:
- Do NOT mention specific technology, vendor, framework, database, or product names.
- Describe architecture strictly in terms of components, services, patterns, responsibilities, and interactions.
- Assume this architecture may later be implemented using different technology stacks depending on constraints.

Output your design strictly as a JSON object with the following structure:
{
  "highLevelComponents": [
    {
      "name": "component name",
      "description": "what it does",
      "responsibilities": ["responsibility 1", "responsibility 2"],
      "justification": "Required if this component modifies or deviates from the existing repository analysis."
    }
  ],
  "serviceBoundaries": [
    {
      "service": "service name",
      "description": "what it does",
      "responsibilities": ["responsibility 1", "responsibility 2"],
      "justification": "Required if this service modifies or deviates from the existing repository analysis."
    }
  ],

REPOSITORY AWARENESS (CONDITIONAL):
- If "repositoryAnalyzer" results are provided, you are in "Brownfield" mode.
- Align your design strictly with the existing architecture and logical approach found in the repository.
- Use the user prompt with EQUAL WEIGHT to evolve the system.
- If you propose a component or service that is NOT present in the repository, you MUST provide a "justification".
- If no "repositoryAnalyzer" is present, stay in "Greenfield" mode.
  "dataFlow": {
    "description": "overall data flow description",
    "flowSteps": [
      {
        "step": 1,
        "description": "what happens",
        "components": ["component1", "component2"]
      }
    ]
  },
  "scalingStrategy": {
    "horizontalScaling": ["strategy 1", "strategy 2"],
    "verticalScaling": ["strategy 1", "strategy 2"],
    "cachingStrategy": "description",
    "databaseScaling": "description"
  },
  "faultTolerance": {
    "failureModes": ["mode 1", "mode 2"],
    "mitigationStrategies": ["strategy 1", "strategy 2"],
    "redundancyApproach": "description"
  },
  "researchSources": [
    { "title": "Microservices Patterns", "url": "https://microservices.io/" }
  ]
}

TOOL INSTRUCTIONS:
- Use tools to research architectural patterns, design docs from similar systems, or cloud-neutral design best practices.
- If you use tools to find information, you MUST include the sources in the "researchSources" field.
- Do NOT use tools for speculative design or placeholder content.

ARCHITECTURAL GUIDELINES:
- Clearly separate concerns between ingress, core business logic, data management, and external integrations.
- Define service boundaries based on business capabilities, not technical convenience.
- Prefer stateless services where possible to enable horizontal scaling.
- Design for failure: assume components will crash, become slow, or return partial data.
- Data ownership must be explicit; each service owns its data and exposes it via well-defined interfaces.
- Avoid tight coupling between services; favor asynchronous or contract-based communication where appropriate.

SCALABILITY & RELIABILITY THINKING:
- Address both predictable growth (traffic, data size) and unpredictable spikes.
- Explicitly describe how read-heavy vs write-heavy workloads are handled.
- Include strategies for load distribution, backpressure, and graceful degradation.

QUALITY BAR:
- This architecture should be sufficient for a senior engineering team to begin detailed design.
- Avoid vague statements like "highly scalable" or "high availability" without explaining how.
- The design must remain valid even if traffic grows by 10x or a region becomes unavailable.

Think like a Staff+ architect designing a system expected to evolve and operate reliably for years.
`;

export const systemDesignAgent = {
  async execute(context: AgentContext): Promise<SystemDesignOutput> {
    logger.info('Executing system design agent', {
      designVersionId: context.designVersionId,
    });

    // Build prompt with requirements if available
    let prompt = `Design a system architecture for the following product idea:

${context.prompt}`;

    if (context.previousOutputs.requirementAnalyzer) {
      const requirements = context.previousOutputs.requirementAnalyzer as RequirementAnalyzerOutput;
      prompt += `\n\nRequirements Analysis:
Functional Requirements:
${requirements.functionalRequirements.map((r) => `- ${r}`).join('\n')}

Non-Functional Requirements:
${requirements.nonFunctionalRequirements.map((r) => `- ${r}`).join('\n')}

Assumptions:
${requirements.assumptions.map((a) => `- ${a}`).join('\n')}

Clarifying Decisions:
${requirements.clarifyingDecisions.map((d) => `- ${d}`).join('\n')}`;
    }

    prompt += `\n\nDesign a production-grade system architecture. Focus on scalability, reliability, and maintainability.`;

    // Use runAgentWithTools to enable tool usage (e.g., CapacityCalculator, ComplianceChecker)
    const { runAgentWithTools } = await import('./tool-runner');

    const agentContext = {
      ...context,
      prompt,
    };

    return runAgentWithTools(agentContext, SYSTEM_INSTRUCTION, (text) => {
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText) as SystemDesignOutput;

      // Validate structure
      if (
        !Array.isArray(parsed.highLevelComponents) ||
        !Array.isArray(parsed.serviceBoundaries) ||
        !parsed.dataFlow ||
        !parsed.scalingStrategy ||
        !parsed.faultTolerance
      ) {
        throw new Error('Invalid output structure');
      }

      // Ensure researchSources exists
      if (!parsed.researchSources) {
        parsed.researchSources = [];
      }

      logger.info('System design agent completed', {
        designVersionId: context.designVersionId,
        componentCount: parsed.highLevelComponents.length,
        serviceCount: parsed.serviceBoundaries.length,
      });

      return parsed;
    });
  },
};
