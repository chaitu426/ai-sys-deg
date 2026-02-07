/**
 * Agent: Diagram Generator
 * Creates Mermaid diagrams from architecture
 * Uses runAgentWithTools for robust JSON parsing
 */

import {
  AgentContext,
  DiagramGeneratorOutput,
  SystemDesignOutput,
  RequirementAnalyzerOutput,
} from '../core/contracts';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) specializing in system architecture visualization.

## Your Task
Generate valid, production-ready Mermaid diagrams that accurately represent the system architecture.

## Output Requirements
You MUST output ONLY a valid JSON object. No markdown, no explanations.

## JSON Schema (STRICT)
{
  "highLevelSystem": "graph TD\\n  A[Client] --> B[API Gateway]\\n  ...",
  "requestFlow": "sequenceDiagram\\n  participant Client\\n  ...",
  "scalingView": "graph TD\\n  LB[Load Balancer] --> S1[Service 1]\\n  ..."
}

## Diagram Requirements

### 1. highLevelSystem
- Use: graph TD or graph LR
- Show: Client, API Gateway, Services, Databases, Caches
- Keep it readable and high-level

### 2. requestFlow
- Use: sequenceDiagram
- Show: Complete request lifecycle from client to response
- Use proper arrows: ->> for requests, -->> for responses

### 3. scalingView
- Use: graph TD or graph LR
- Show: Load balancers, multiple service instances, workers, replicas

## Mermaid Syntax Rules (CRITICAL)
1. Node IDs must have NO spaces (use camelCase or PascalCase)
2. Do NOT use HTML, markdown, emojis, or comments
3. Escape special characters in labels
4. Each diagram must be a single valid Mermaid string
5. Use \\n for newlines within the string

## String Escaping
Since diagrams go inside JSON strings, you must:
- Use \\n for newlines (not actual newlines)
- Escape quotes as \\"
- Keep each diagram as a single-line JSON string value

## Critical Output Rules
- Output ONLY raw JSON
- Do NOT wrap in markdown code blocks
- Ensure the JSON is complete and valid
`;

export const diagramGeneratorAgent = {
  async execute(context: AgentContext): Promise<DiagramGeneratorOutput> {
    logger.info('Executing diagram generator agent', {
      designVersionId: context.designVersionId,
    });

    if (!context.previousOutputs.systemDesign) {
      throw new Error('System design output required for diagram generation');
    }

    const design = context.previousOutputs.systemDesign as SystemDesignOutput;

    let prompt = `Generate Mermaid diagrams for the following system architecture:

High-Level Components:
${design.highLevelComponents.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Service Boundaries:
${design.serviceBoundaries.map((s) => `- ${s.service}: ${s.description}`).join('\n')}

Data Flow:
${design.dataFlow.description}
Steps:
${design.dataFlow.flowSteps.map((step) => `${step.step}. ${step.description}`).join('\n')}

Scaling Strategy:
- Horizontal: ${design.scalingStrategy.horizontalScaling.join(', ')}
- Caching: ${design.scalingStrategy.cachingStrategy}
- Database: ${design.scalingStrategy.databaseScaling}

Generate three diagrams:
1. highLevelSystem: Overview of all components and connections
2. requestFlow: Sequence diagram showing a typical API request
3. scalingView: How the system scales (load balancers, replicas, workers)
`;

    if (context.previousOutputs.requirementAnalyzer) {
      const requirements = context.previousOutputs.requirementAnalyzer as RequirementAnalyzerOutput;
      prompt += `

Key Requirements to Visualize:
${requirements.functionalRequirements.slice(0, 5).map((r) => `- ${r}`).join('\n')}
`;
    }

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

      // For diagrams, we need to be careful - the mermaid syntax uses \n
      // We should NOT sanitize those. Only remove actual control chars outside strings.
      // Simple approach: trust the LLM to format correctly, just remove null bytes
      // ROBUST SANITIZATION:
      // Only escape control characters inside string literals.
      // This is crucial for Mermaid diagrams which may contain \n
      jsonText = jsonText.replace(/"((?:[^"\\]|\\.)*)"/g, (_, content) => {
        const escapedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escapedContent}"`;
      });

      const parsed = JSON.parse(jsonText) as DiagramGeneratorOutput;

      // Validate structure
      if (!parsed.highLevelSystem || !parsed.requestFlow || !parsed.scalingView) {
        throw new Error('Invalid output structure: missing required diagram fields');
      }

      // Basic Mermaid validation
      const validateMermaid = (diagram: string, name: string) => {
        if (!diagram.includes('graph') && !diagram.includes('sequenceDiagram') && !diagram.includes('flowchart')) {
          logger.warn(`${name} diagram may not be valid Mermaid`, {
            designVersionId: context.designVersionId,
            preview: diagram.substring(0, 100),
          });
        }
      };

      validateMermaid(parsed.highLevelSystem, 'highLevelSystem');
      validateMermaid(parsed.requestFlow, 'requestFlow');
      validateMermaid(parsed.scalingView, 'scalingView');

      logger.info('Diagram generator agent completed', {
        designVersionId: context.designVersionId,
      });

      return parsed;
    });
  },
};
