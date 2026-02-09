/**
 * Failure Mode Analyzer Agent
 * Analyzes failure scenarios and resilience
 * Uses runAgentWithTools for robust JSON parsing
 */

import { AgentContext, FailureModeAnalyzerOutput, SystemDesignOutput } from '../core/contracts';
import { getLogger } from '../utils/logger';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) specializing in system reliability and failure analysis.

## Your Task
Identify credible failure scenarios, evaluate their likelihood and impact, and assess system resilience.

## Output Requirements
You MUST output ONLY a valid JSON object. No markdown, no explanations, no code blocks.

## JSON Schema (STRICT)
{
  "failureScenarios": [
    {
      "scenario": "Database connection failure",
      "probability": "low|medium|high",
      "impact": "low|medium|high|critical",
      "description": "What happens when this occurs",
      "mitigation": ["strategy 1", "strategy 2"]
    }
  ],
  "singlePointsOfFailure": ["SPOF 1", "SPOF 2"],
  "resilienceScore": 85,
  "recommendations": ["recommendation 1", "recommendation 2"],
  "researchSources": [
    { "title": "Source name", "url": "https://example.com" }
  ]
}

## Analysis Guidelines
1. Focus on plausible production failures
2. Include infrastructure, application, and data failures
3. Consider both partial degradation and full outages
4. Probability: how often per year
5. Impact: user-facing and business impact

## Resilience Score (0-100)
- Based on failure coverage, mitigation effectiveness, automation
- Score above 90 should be rare and well-justified

## Tool Usage
- Use threat_modeler tool to identify security-related failure modes
- Include any research sources in researchSources

REPOSITORY AWARENESS (CONDITIONAL):
- If "repositoryAnalyzer" results are provided, you are in "Brownfield" mode.
- Analyze failure modes specifically relevant to the existing repository's architecture (e.g., if the repo uses a specific legacy DB, consider its unique failure modes).
- If no "repositoryAnalyzer" is present, stay in "Greenfield" mode.

## Critical Rules
- Output ONLY raw JSON
- Ensure all strings are properly escaped
- Do not use control characters
`;

export const failureModeAnalyzerAgent = {
  async execute(context: AgentContext): Promise<FailureModeAnalyzerOutput> {
    logger.info('Executing failure mode analyzer agent', {
      designVersionId: context.designVersionId,
    });

    if (!context.previousOutputs.systemDesign) {
      throw new Error('System design output required for failure mode analysis');
    }

    const design = context.previousOutputs.systemDesign as SystemDesignOutput;

    const prompt = `Analyze failure modes for the following system:

System Architecture:
Components:
${design.highLevelComponents.map((c) => `- ${c.name}: ${c.description}`).join('\n')}

Services:
${design.serviceBoundaries.map((s) => `- ${s.service}: ${s.description}`).join('\n')}

Current Fault Tolerance:
- Failure Modes Identified: ${design.faultTolerance.failureModes.join(', ')}
- Mitigation Strategies: ${design.faultTolerance.mitigationStrategies.join(', ')}
- Redundancy Approach: ${design.faultTolerance.redundancyApproach}

Scaling Strategy:
- Horizontal: ${design.scalingStrategy.horizontalScaling.join(', ')}
- Database: ${design.scalingStrategy.databaseScaling}

Identify:
1. All potential failure scenarios with probability and impact
2. Single points of failure (SPOFs)
3. Overall resilience score
4. Actionable recommendations to improve reliability
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

      const parsed = JSON.parse(jsonText) as FailureModeAnalyzerOutput;

      // Validate structure
      if (!Array.isArray(parsed.failureScenarios)) {
        throw new Error('Invalid output: missing failureScenarios array');
      }

      if (typeof parsed.resilienceScore !== 'number') {
        parsed.resilienceScore = 70; // Default fallback
      }

      // Ensure optional fields exist
      if (!parsed.researchSources) {
        parsed.researchSources = [];
      }
      if (!parsed.singlePointsOfFailure) {
        parsed.singlePointsOfFailure = [];
      }
      if (!parsed.recommendations) {
        parsed.recommendations = [];
      }

      logger.info('Failure mode analyzer agent completed', {
        designVersionId: context.designVersionId,
        scenarioCount: parsed.failureScenarios.length,
        resilienceScore: parsed.resilienceScore,
      });

      return parsed;
    });
  },
};
