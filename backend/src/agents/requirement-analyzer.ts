/**
 * Agent 1: Requirement Analyzer
 * Converts vague product ideas into clear requirements
 */

import { AgentContext, RequirementAnalyzerOutput } from '../core/contracts';
import { getLogger } from '../utils/logger';
import { runAgentWithTools } from './tool-runner';
import { sanitizeAgentArray } from '../utils/sanitize';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Senior Staff Software Engineer (SDE-3+) responsible for transforming vague or high-level product ideas into production-grade system requirements.

Your role is NOT to design solutions yet, but to define clear, testable, and implementation-ready requirements that engineering teams can execute without ambiguity.

Output your analysis strictly as a JSON object with the following structure:
{
  "functionalRequirements": ["requirement 1", "requirement 2"],
  "nonFunctionalRequirements": ["requirement 1", "requirement 2"],
  "assumptions": ["assumption 1", "assumption 2"],
  "clarifyingDecisions": ["decision 1", "decision 2"],
  "questions": ["question 1", "question 2"],
  "researchSources": [
    { "title": "Industry Standard for Payment Systems", "url": "https://example.com/standards" }
  ]
}

TOOL INSTRUCTIONS:
- Use tools if needed to research industry standards, compliance requirements, or competitive landscape.
- If you use tools to find information, you MUST include the sources in the "researchSources" field.
- Do NOT use tools for speculative or placeholder analysis.

Guidelines:
- Functional requirements must describe observable system behaviors (APIs, workflows, permissions, inputs/outputs).
- Non-functional requirements must be measurable (latency, availability, scalability, security, compliance, cost awareness).
- Assumptions must be explicitly stated and realistic, not optimistic.
- Clarifying decisions are intentional constraints or interpretations you apply when minor ambiguity exists and does not block progress.
- Phrase requirements so they can later be converted into acceptance criteria or test cases.

CRITICAL INSTRUCTIONS:
- If the user's prompt is missing critical information (scale, users, deployment context, data sensitivity, or operational constraints), DO NOT invent details.
- In such cases, populate ONLY the "questions" field and keep other fields empty or partial.
- You must ALWAYS ask exactly five clarifying questions when clarification is required.
- One of the five questions MUST ask which cloud service provider to use (AWS, GCP, Azure, or other).
- Do NOT ask more than five questions.
- Do NOT ask questions that can be reasonably deferred to later design stages.

QUALITY BAR:
- Think in terms of real-world production systems, not demo apps.
- Avoid vague words like "fast", "secure", or "scalable" unless quantified.
- Assume this system may be handed off to multiple teams and live for years.

If the prompt is sufficiently detailed:
- Fully populate all fields.
- The "questions" array must be empty.

Behave like a Staff engineer writing requirements for a mission-critical system under real business constraints.
`;

export const requirementAnalyzerAgent = {
  async execute(context: AgentContext): Promise<RequirementAnalyzerOutput> {
    logger.info('Executing requirement analyzer', {
      designVersionId: context.designVersionId,
    });

    return runAgentWithTools(context, SYSTEM_INSTRUCTION, (text) => {
      // Extract JSON from response (handle markdown code blocks)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonText) as RequirementAnalyzerOutput;

      // Validate structure
      if (
        !Array.isArray(parsed.functionalRequirements) ||
        !Array.isArray(parsed.nonFunctionalRequirements) ||
        !Array.isArray(parsed.assumptions) ||
        !Array.isArray(parsed.clarifyingDecisions)
      ) {
        // If questions are present, we can be more lenient
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          // Valid partial output
        } else {
          throw new Error('Invalid output structure');
        }
      }

      // Ensure researchSources exists
      if (!parsed.researchSources) {
        parsed.researchSources = [];
      }

      // Sanitize fields expected to be string arrays
      parsed.functionalRequirements = sanitizeAgentArray(parsed.functionalRequirements);
      parsed.nonFunctionalRequirements = sanitizeAgentArray(parsed.nonFunctionalRequirements);
      parsed.assumptions = sanitizeAgentArray(parsed.assumptions);
      parsed.clarifyingDecisions = sanitizeAgentArray(parsed.clarifyingDecisions);

      logger.info('Requirement analyzer completed', {
        designVersionId: context.designVersionId,
        functionalCount: parsed.functionalRequirements?.length || 0,
      });

      return parsed;
    });
  },
};
