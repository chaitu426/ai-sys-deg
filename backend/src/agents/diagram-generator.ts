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
  APIDesignOutput,
  DeploymentStrategyOutput,
  TechStackOutput,
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
  "highLevelSystem": "graph TD\\n  A[Client] --> B[API Gateway]...",
  "requestFlow": "sequenceDiagram\\n  participant Client\\n  ...",
  "scalingView": "graph TD\\n  LB[Load Balancer] --> S1[Service 1]...",
  "cloudArchitecture": "graph TD\\n  subgraph AWS...",
  "apiArchitecture": "graph LR\\n  C[Client] -->|GET /users| API..."
}

## Diagram Requirements

### 1. highLevelSystem
- Use: graph TD (Top-Down) or graph LR (Left-Right) ONLY.
- Show: Client, API Gateway, Services, Databases, Caches.
- Keep it readable. Avoid crossing lines where possible.

### 2. requestFlow
- Use: sequenceDiagram ONLY.
- Key Rule: Define participants first if needed for order.
- Use ->> for solid lines (requests), -->> for dotted lines (responses).
- Valid participants: Client, API Gateway, Service A, Database, Cache, Queue.

### 3. scalingView
- Use: graph TD.
- Visualizing scaling: Show "Load Balancer" pointing to multiple "Service Instance" nodes.
- Show "Primary DB" and "Read Replica" if applicable.

### 4. cloudArchitecture
- Use: graph TD.
- Show: Cloud infrastructure (Regions, AZs, VPCs, Subnets, Services).
- Visualize the deployment strategy context (e.g. AWS/GCP/Azure components).

### 5. apiArchitecture
- Use: graph LR.
- Show: Client triggering specific API endpoints (grouped by resource).
- Visualize how endpoints map to services.

## Mermaid Syntax Rules (CRITICAL - DO NOT BREAK THESE)
1. **Node IDs**: Must be alphanumeric ONLY (e.g., \`AuthService\`, \`API_Gateway\`). NO spaces, NO dashes in IDs.
   - BAD: \`Auth Service\` --> B
   - GOOD: \`AuthService["Auth Service"]\` --> B
2. **Text Labels**: ALWAYS wrap text labels in double quotes inside the brackets.
   - BAD: A[Client App]
   - GOOD: A["Client App"]
3. **NO STYLING**: Do NOT use \`style\`, \`classDef\`, or CSS. Keep it raw and clean.
4. **NO SUBGRAPHS**: Do NOT use subgraphs. They often break the renderer. Use clusters only if absolutely necessary and you are 100% sure of syntax. Preferred: Flat graph.
5. **Standard Arrow**: Use simple \`-->\` for graphs.

## String Escaping
Since diagrams go inside JSON strings, you must:
- Use \\n for newlines (not actual newlines)
- Escape internal quotes as \\"
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

Generate FIVE diagrams:
1. highLevelSystem: Overview of all components and connections
2. requestFlow: Sequence diagram showing a typical API request
3. scalingView: How the system scales (load balancers, replicas, workers)
4. cloudArchitecture: Infrastructure & Deployment view
5. apiArchitecture: API endpoints and service mapping

ADDITIONAL CONTEXT (USE THIS!):

${context.previousOutputs.techStack ? `
Tech Stack:
Frontend: ${(context.previousOutputs.techStack as TechStackOutput).frontend}
Backend: ${(context.previousOutputs.techStack as TechStackOutput).backend}
Database: ${(context.previousOutputs.techStack as TechStackOutput).database}
Infra: ${(context.previousOutputs.techStack as TechStackOutput).infrastructure}
` : ''}

${context.previousOutputs.apiDesign ? `
API Design:
${(context.previousOutputs.apiDesign as APIDesignOutput).endpoints.slice(0, 10).map(e => `${e.method} ${e.path}`).join('\n')}
` : ''}

${context.previousOutputs.deploymentStrategy ? `
Deployment Strategy:
Model: ${(context.previousOutputs.deploymentStrategy as DeploymentStrategyOutput).deploymentModel}
Environments: ${(context.previousOutputs.deploymentStrategy as DeploymentStrategyOutput).environments.map(e => e.name).join(', ')}
` : ''}
`;

    if (context.previousOutputs.requirementAnalyzer) {
      const requirements = context.previousOutputs.requirementAnalyzer as RequirementAnalyzerOutput;
      prompt += `


Key Requirements to Visualize:
${requirements.functionalRequirements.slice(0, 5).map((r) => `- ${r}`).join('\n')}

REMINDER:
- For 'highLevelSystem', use graph TD. NO SUBGRAPHS.
- For 'requestFlow', use sequenceDiagram. Define participants first.
- For 'scalingView', use graph TD. Simple nodes.
- STRICT SYNTAX: No spaces in node IDs, no special chars, no styling.
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
      if (!parsed.highLevelSystem || !parsed.requestFlow || !parsed.scalingView || !parsed.cloudArchitecture || !parsed.apiArchitecture) {
        throw new Error('Invalid output structure: missing required diagram fields');
      }

      // Basic Mermaid validation
      const validateMermaid = (diagram: string, name: string) => {
        if (!diagram) return; // Should be caught by structure check
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
      validateMermaid(parsed.cloudArchitecture, 'cloudArchitecture');
      validateMermaid(parsed.apiArchitecture, 'apiArchitecture');

      logger.info('Diagram generator agent completed', {
        designVersionId: context.designVersionId,
      });

      return parsed;
    });
  },
};
