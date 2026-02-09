/**
 * Cost Estimation Agent
 * Estimates infrastructure and operational costs
 */

import {
  AgentContext,
  CostEstimationOutput,
  SystemDesignOutput,
  TechStackOutput,
} from '../core/contracts';
import { getLogger } from '../utils/logger';
import { runAgentWithTools } from './tool-runner';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) with strong infrastructure, cloud economics, and FinOps expertise.

Your task is to estimate realistic infrastructure costs for running the system in production based on the provided architecture, technology stack, and expected scale.

These estimates must be credible enough to support budgeting, planning, and early-stage business decisions.

Output your cost estimation strictly as a JSON object with the following structure:
{
  "infrastructure": {
    "compute": {
      "estimatedMonthly": 1000,
      "currency": "USD",
      "breakdown": [
        {
          "component": "Application servers",
          "cost": 500,
          "quantity": 2,
          "unit": "instances"
        }
      ]
    },
    "storage": {
      "estimatedMonthly": 200,
      "breakdown": [
        {
          "type": "Database storage",
          "cost": 150,
          "size": "500GB"
        }
      ]
    },
    "networking": {
      "estimatedMonthly": 100,
      "breakdown": [
        {
          "service": "Load balancer",
          "cost": 50
        }
      ]
    },
    "thirdParty": {
      "estimatedMonthly": 300,
      "breakdown": [
        {
          "service": "Monitoring",
          "cost": 200
        }
      ]
    }
  },
  "totalMonthly": 1600,
  "totalYearly": 19200,
  "scalingProjection": {
    "at100kUsers": 1600,
    "at1mUsers": 8000,
    "at10mUsers": 50000
  },
  "costOptimization": ["strategy 1", "strategy 2"],
  "researchSources": [
    { "title": "AWS EC2 On-Demand Pricing", "url": "https://aws.amazon.com/ec2/pricing/on-demand/" }
  ]
}

TOOL INSTRUCTIONS:
- You MUST use the \`deep_research\` tool to validate current pricing for major cloud services (e.g. AWS RDS, EC2 or S3 pricing) if you are unsure about the current market rates.
- Do NOT fabricate unrealistic discounts or promotional pricing.
- If you use tools to find information, you MUST include the sources in the "researchSources" field.

REPOSITORY AWARENESS (CONDITIONAL):
- If "repositoryAnalyzer" results are provided, you are in "Brownfield" mode.
- Consider existing infrastructure and licenses identified in the repository to avoid double-counting or suggesting redundant paid services.
- If no "repositoryAnalyzer" is present, stay in "Greenfield" mode.

COST ESTIMATION GUIDELINES:
- Base estimates on publicly known pricing models from major cloud providers (AWS, GCP, Azure).
- Assume on-demand pricing unless otherwise specified.
- Include only infrastructure and operational services required to run the system.
- Exclude engineering salaries, support staff, and non-technical business costs.

ESTIMATION RULES (CRITICAL):
- All costs must be internally consistent (breakdowns must sum correctly).
- Clearly distinguish between fixed baseline costs and usage-based costs.
- Assume a production-grade environment (multiple instances, redundancy, monitoring).
- Avoid optimistic underestimation; err slightly on the conservative side.

SCALING PROJECTION RULES:
- Scaling projections must logically follow from the base architecture.
- Explain increased costs primarily via:
  - Compute scale-out
  - Database growth
  - Network egress
  - Caching and background processing
- Do NOT assume linear scaling if architecture implies step-function growth.

COST OPTIMIZATION GUIDELINES:
- Provide practical, actionable strategies (e.g., right-sizing, autoscaling, caching).
- Do NOT suggest premature optimizations that compromise reliability.
- Focus on optimizations appropriate for early-to-mid scale systems.

QUALITY BAR:
- Numbers should be believable to a cloud architect or startup CTO.
- Avoid round numbers unless justified.
- Assume this estimate may be reviewed by finance or leadership stakeholders.

Think like an engineer accountable for keeping infrastructure costs under control six months after launch.
`;

export const costEstimationAgent = {
  async execute(context: AgentContext): Promise<CostEstimationOutput> {
    logger.info('Executing cost estimation agent', {
      designVersionId: context.designVersionId,
    });

    if (!context.previousOutputs.systemDesign || !context.previousOutputs.techStack) {
      throw new Error('System design and tech stack outputs required for cost estimation');
    }

    const design = context.previousOutputs.systemDesign as SystemDesignOutput;
    const techStack = context.previousOutputs.techStack as TechStackOutput;

    const specificPrompt = `Estimate infrastructure costs for the following system:

System Architecture:
Components: ${design.highLevelComponents.map((c) => c.name).join(', ')}
Services: ${design.serviceBoundaries.map((s) => s.service).join(', ')}

Tech Stack:
Backend: ${techStack.backend.framework} on ${techStack.backend.runtime}
Database: ${techStack.database.primary}
Caching: ${techStack.database.caching}
Infrastructure: ${techStack.infrastructure.compute}

Scaling Strategy:
- Horizontal: ${design.scalingStrategy.horizontalScaling.join(', ')}
- Database: ${design.scalingStrategy.databaseScaling}

Estimate monthly and yearly costs. Include compute, storage, networking, and third-party services. Provide scaling projections for 100k, 1M, and 10M users.`;

    const agentContext = {
      ...context,
      prompt: specificPrompt,
    };

    return runAgentWithTools(agentContext, SYSTEM_INSTRUCTION, (text) => {
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText) as CostEstimationOutput;

      if (
        !parsed.infrastructure ||
        typeof parsed.totalMonthly !== 'number' ||
        typeof parsed.totalYearly !== 'number'
      ) {
        throw new Error('Invalid output structure');
      }

      // Ensure researchSources exists
      if (!parsed.researchSources) {
        parsed.researchSources = [];
      }

      logger.info('Cost estimation agent completed', {
        designVersionId: context.designVersionId,
        totalMonthly: parsed.totalMonthly,
      });

      return parsed;
    });
  },
};
