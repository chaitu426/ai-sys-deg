/**
 * Agent 3: Tech Stack Agent
 * Chooses concrete technologies and justifies decisions
 */

import {
  AgentContext,
  TechStackOutput,
  SystemDesignOutput,
  RequirementAnalyzerOutput,
} from '../core/contracts';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) responsible for selecting a concrete, production-ready technology stack.

Your task is to choose specific technologies that best implement the previously defined system architecture and requirements.

You are making real-world engineering decisions with long-term impact. Prioritize stability, maintainability, ecosystem maturity, and operational simplicity over novelty.

Output your recommendations strictly as a JSON object with the following structure:
{
  "frontend": {
    "framework": "framework name",
    "stateManagement": "state management solution",
    "buildTool": "build tool",
    "justification": "why this choice"
  },
  "backend": {
    "runtime": "runtime environment",
    "framework": "framework name",
    "justification": "why this choice"
  },
  "database": {
    "primary": "primary database",
    "caching": "caching solution",
    "search": "search solution (if needed)",
    "justification": "why these choices"
  },
  "messaging": {
    "queue": "message queue",
    "pubsub": "pub/sub system (if needed)",
    "justification": "why this choice"
  },
  "infrastructure": {
    "compute": "compute platform",
    "storage": "storage solution",
    "cdn": "CDN (if needed)",
    "monitoring": "monitoring solution",
    "justification": "why these choices"
  }
}

TOOL INSTRUCTIONS:
- You MUST use the \`deep_research\` tool for at least 2 major decisions (e.g., Database choice, Framework choice) to validate ecosystem status.
- Do NOT use tools to blindly suggest trending or experimental technologies.

TRADE-OFF ANALYSIS:
- For the primary database and backend framework, you must perform a comparison.
- Output this comparison in a new "tradeOffAnalysis" field in the JSON (see structure below).

Output your recommendations strictly as a JSON object with the following structure:
{
  "frontend": { ... },
  "backend": { ... },
  ...
  "tradeOffAnalysis": [
    {
       "category": "Database",
       "selected": "Postgres",
       "alternatives": ["Mongo", "MySQL"],
       "researchSummary": "Deep research showed Postgres has better JSONB support...",
       "sources": [
         { "title": "Postgres vs MySQL 2024", "url": "https://example.com/pg-vs-mysql" }
       ],
       "score": 90 // 0-100 suitability
    }
  ]
}

SELECTION GUIDELINES:
- Choices MUST align with the system architecture, scaling strategy, and fault tolerance assumptions.
- Prefer boring, well-understood technologies unless the requirements explicitly justify complexity.
- Consider developer experience, onboarding speed, and operational burden.
- Favor technologies with strong community support, documentation, and long-term viability.
- Avoid vendor lock-in where reasonable, but do not sacrifice reliability for theoretical portability.

DECISION PRINCIPLES:
- If multiple options are viable, select the one with the lowest operational risk.
- Explicitly justify tradeoffs (e.g., flexibility vs simplicity, cost vs scalability).
- Assume this system may need to support a growing team and increasing traffic over time.

QUALITY BAR:
- The selected stack should be suitable for a real production deployment.
- Avoid vague justifications like "popular" or "fast" without context.
- Each justification should clearly explain why the technology fits this system specifically.

Think like a Staff engineer accountable for this stack one year after launch.
`;

export const techStackAgent = {
  async execute(context: AgentContext): Promise<TechStackOutput> {
    logger.info('Executing tech stack agent', {
      designVersionId: context.designVersionId,
    });

    // Build prompt with system design if available
    let prompt = `Select a technology stack for the following product idea:

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

    if (context.previousOutputs.systemDesign) {
      const design = context.previousOutputs.systemDesign as SystemDesignOutput;
      prompt += `\n\nSystem Design:
High-Level Components:
${design.highLevelComponents.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Service Boundaries:
${design.serviceBoundaries.map((s) => `- ${s.service}: ${s.description}`).join('\n')}

Scaling Strategy:
- Horizontal: ${design.scalingStrategy.horizontalScaling.join(', ')}
- Vertical: ${design.scalingStrategy.verticalScaling.join(', ')}
- Caching: ${design.scalingStrategy.cachingStrategy}
- Database: ${design.scalingStrategy.databaseScaling}`;
    }

    prompt += `\n\nSelect concrete technologies that align with this architecture. Justify each choice.`;

    // Use runAgentWithTools to enable tool usage (e.g., TechRadar)
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

      const parsed = JSON.parse(jsonText) as TechStackOutput;

      // Validate structure
      if (
        !parsed.frontend ||
        !parsed.backend ||
        !parsed.database ||
        !parsed.infrastructure ||
        !Array.isArray(parsed.tradeOffAnalysis)
      ) {
        throw new Error('Invalid output structure');
      }

      // Ensure sources exist if tradeOffAnalysis is present
      parsed.tradeOffAnalysis.forEach(item => {
        if (item.researchSummary && !item.sources) {
          item.sources = []; // Fallback to empty array
        }
      });

      logger.info('Tech stack agent completed', {
        designVersionId: context.designVersionId,
      });

      return parsed;
    });
  },
};
