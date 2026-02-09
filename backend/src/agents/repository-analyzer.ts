/**
 * Agent: Repository Analyzer
 * Extracts technical context from a GitHub repository
 */

import { AgentContext, RepositoryAnalyzerOutput } from '../core/contracts';
import { getLogger } from '../utils/logger';
import { runAgentWithTools } from './tool-runner';

const logger = getLogger();

const SYSTEM_INSTRUCTION = `
You are a Staff Systems Architect specialized in deep-dive repository analysis.
Your goal is to extract architectural, technical, and structural insights from the provided GitHub repository.

DEEP DIVE PROCESS:
1. FETCH STRUCTURE: Use "github_fetcher" with "repoFullName" to get the file tree and README preview.
2. IDENTIFY CORE FILES: Based on the file tree, identify critical configuration and entry files:
   - Node.js: package.json, src/index.js, routes/, etc.
   - Spring Boot: pom.xml, build.gradle, src/main/..., application.yml.
   - Go: go.mod, main.go, pkg/, cmd/.
   - Python: requirements.txt, pyproject.toml, app.py.
3. EXTRACT CONTENT: Use "github_fetcher" with "path" to READ the content of these critical files.
4. SYNTHESIZE: Analyze the code structure, dependencies, and patterns.

OUTPUT FORMAT (JSON):
{
  "techStack": {
    "frontend": ["React", "Next.js"],
    "backend": ["Spring Boot", "JDK 17"],
    "database": ["MongoDB"],
    "infrastructure": ["GitHub Actions", "Terraform"]
  },
  "mainComponents": ["Inventory Service", "Payment Gateway", "User Auth"],
  "purpose": "A clear, concise summary of the system's objective.",
  "architecturalPatterns": ["Event-Driven", "Layered Architecture"],
  "apis": {
    "type": "REST",
    "endpoints": ["/api/v1/auth", "/api/v1/orders"]
  },
  "logicalApproach": "Detailed description of how the system is organized, its core logic flow, and architectural philosophy."
}

GUIDELINES:
- DO NOT hallucinate. Only report what you find via tools.
- Multi-Language: Handle Node.js, Spring, Go, Python, etc. with equal care.
- Logic Detection: Look at service/controller logic to understand the "logical approach".
- API Discovery: Look for route definitions, controllers, or annotation-based APIs (like @RestController or gin.Engine).
`;

export const repositoryAnalyzerAgent = {
    async execute(context: AgentContext): Promise<RepositoryAnalyzerOutput> {
        logger.info('Executing repository analyzer', {
            designVersionId: context.designVersionId,
        });

        const repoFullName = (context as any).githubRepoFullName || (context.sharedMemory as any).githubRepoFullName;

        if (!repoFullName) {
            logger.warn('No repository full name provided for analysis');
            return {
                techStack: {},
                mainComponents: [],
                purpose: 'No repository provided.',
            };
        }

        const enhancedInstruction = `${SYSTEM_INSTRUCTION}\n\nTarget Repository: ${repoFullName}\nUser Prompt: ${context.prompt}`;

        return runAgentWithTools(context, enhancedInstruction, (text) => {
            let jsonText = text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            const parsed = JSON.parse(jsonText) as RepositoryAnalyzerOutput;

            // Ensure techStack structure exists
            if (!parsed.techStack) parsed.techStack = {};

            logger.info('Repository analyzer completed', {
                designVersionId: context.designVersionId,
                techCount: Object.values(parsed.techStack).flat().length,
            });
            logger.info(text)
            logger.info(parsed as any)

            return parsed;
        });
    },
};
