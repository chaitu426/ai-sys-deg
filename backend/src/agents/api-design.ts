/**
 * API Design Agent
 * Designs RESTful APIs and endpoints (production-grade)
 * Uses runAgentWithTools for robust JSON parsing and tool support
 */

import {
  AgentContext,
  APIDesignOutput,
  SystemDesignOutput,
  TechStackOutput,
  RequirementAnalyzerOutput,
} from '../core/contracts';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * System instruction with clear JSON requirements
 */
const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) whose sole task is to DESIGN API CONTRACTS.

You MUST output ONLY valid JSON that strictly follows the schema below.

ABSOLUTE RULES:
- Output ONLY raw JSON (no markdown, no backticks)
- Do NOT include explanations, comments, or extra text
- Do NOT include code or implementation details
- Do NOT include trailing commas
- Ensure all strings are properly closed
- Ensure the JSON is complete and parsable
- Use empty objects {} for examples if unsure but try to give it 
- If any required field cannot be determined, use an empty string ""

SCOPE:
- Design ONLY API contracts (endpoints, methods, paths, request/response structure)
- DO NOT include internal logic, algorithms, database queries, or service code
- Paths should be RESTful and versioned
- Keep descriptions concise and technical
- APIs must be suitable for public or partner consumption 

FAILURE MODE:
If you cannot complete the FULL response, output EXACTLY:
{ "error": "INCOMPLETE_OUTPUT" }

JSON SCHEMA (STRICT):
{
  "endpoints": [
    {
      "method": "GET|POST|PUT|DELETE|PATCH",
      "path": "/api/v1/resource",
      "description": "string",
      "requestBody": {
        "schema": "string",
        "example": {}
      },
      "responseBody": {
        "schema": "string",
        "example": {}
      },
      "authentication": "required|optional|none",
      "rateLimiting": "string"
    }
  ],
  "apiVersioning": "string",
  "errorHandling": "string",
  "documentation": "string",
  "researchSources": [
    { "title": "Stripe API Design Guidelines", "url": "https://stripe.com/docs/api" }
  ]
}

TOOL INSTRUCTIONS:
- You MUST use tools if needed to research best practices or specific API standards (e.g. Health level 7 for healthcare, or specific cloud API patterns).
- If you use tools to find information, you MUST include the sources in the "researchSources" field.`;

export const apiDesignAgent = {
  async execute(context: AgentContext): Promise<APIDesignOutput> {
    logger.info('Executing API design agent', {
      designVersionId: context.designVersionId,
    });

    if (!context.previousOutputs.systemDesign) {
      throw new Error('System design output required for API design');
    }

    const design = context.previousOutputs.systemDesign as SystemDesignOutput;
    const techStack = context.previousOutputs.techStack as TechStackOutput | undefined;

    // Build prompt
    let prompt = `Design RESTful APIs for the following system.

System Components:
${design.highLevelComponents.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Services:
${design.serviceBoundaries.map((s) => `- ${s.service}: ${s.description}`).join('\n')}

Data Flow:
${design.dataFlow.description}
`;

    if (techStack) {
      const backendFramework = techStack.backend?.framework ?? 'unspecified';
      const databaseType = techStack.database?.primary ?? 'unspecified';

      prompt += `
Tech Stack:
- Backend Framework: ${backendFramework}
- Database: ${databaseType}
`;
    }

    if (context.previousOutputs.requirementAnalyzer) {
      const requirements = context.previousOutputs.requirementAnalyzer as RequirementAnalyzerOutput;
      prompt += `

Functional Requirements:
${requirements.functionalRequirements.map((r) => `- ${r}`).join('\n')}

Non-Functional Requirements:
${requirements.nonFunctionalRequirements.map((r) => `- ${r}`).join('\n')}

Assumptions:
${requirements.assumptions.map((a) => `- ${a}`).join('\n')}

Clarifying Decisions:
${requirements.clarifyingDecisions.map((d) => `- ${d}`).join('\n')}
`;
    }

    prompt += `
Design comprehensive RESTful APIs that:
1. Support ALL functional requirements
2. Include proper authentication and authorization
3. Define rate limiting policies
4. Follow REST best practices
5. Include error handling standards
`;

    // Use runAgentWithTools for robust parsing and tool support
    const { runAgentWithTools } = await import('./tool-runner');

    const agentContext = {
      ...context,
      prompt,
    };

    return runAgentWithTools(agentContext, SYSTEM_INSTRUCTION, (text) => {
      let jsonText = text.trim();

      // Strip markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      // ROBUST SANITIZATION:
      // Only escape control characters inside string literals.
      // We use a regex to match JSON strings: "..."
      // Inside the match, we replace \n with \\n, etc.
      // Structural newlines outside strings are preserved.
      jsonText = jsonText.replace(/"((?:[^"\\]|\\.)*)"/g, (_, content) => {
        const escapedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escapedContent}"`;
      });

      const parsed = JSON.parse(jsonText) as APIDesignOutput;

      // Validate structure
      if (!Array.isArray(parsed.endpoints)) {
        throw new Error('Missing or invalid "endpoints" array');
      }

      for (const endpoint of parsed.endpoints) {
        if (!endpoint.method || !endpoint.path || !endpoint.description) {
          throw new Error('Invalid endpoint structure: missing required fields');
        }
      }

      // Ensure optional fields exist
      if (!parsed.researchSources) {
        parsed.researchSources = [];
      }
      if (!parsed.apiVersioning) {
        parsed.apiVersioning = 'URL path versioning (e.g., /api/v1/)';
      }
      if (!parsed.errorHandling) {
        parsed.errorHandling = 'Standard HTTP status codes with JSON error bodies';
      }
      if (!parsed.documentation) {
        parsed.documentation = 'OpenAPI 3.0 specification';
      }

      logger.info('API design agent completed', {
        designVersionId: context.designVersionId,
        endpointCount: parsed.endpoints.length,
      });

      return parsed;
    });
  },
};
