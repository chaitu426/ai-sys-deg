import {
  AgentOutput,
  TechStackOutput,
  APIDesignOutput,
  SystemDesignOutput,
  SharedMemory,
  AGENTS,
} from '../core/contracts';

export interface CodingPrompt {
  step: number;
  title: string;
  description: string;
  promptContent: string;
}

export class PromptGenerator {
  static generatePrompts(latestVersion: any, sharedMemory?: SharedMemory): CodingPrompt[] {
    const outputs = this.mapOutputs(latestVersion.agentOutputs);
    const prompts: CodingPrompt[] = [];

    const techStack = outputs[AGENTS.TECH_STACK] as TechStackOutput;
    const systemDesign = outputs[AGENTS.SYSTEM_DESIGN] as SystemDesignOutput;
    const apiDesign = outputs[AGENTS.API_DESIGN] as APIDesignOutput;

    if (!techStack) return [];

    const globalContext = this.generateGlobalContext(sharedMemory, techStack);
    let step = 1;

    // 1. Scaffolding Prompt (Expanded)
    prompts.push(this.generateScaffoldPrompt(step++, techStack, globalContext));

    // 2. Database Prompt
    if (systemDesign) {
      prompts.push(this.generateDatabasePrompt(step++, techStack, systemDesign, globalContext));
    }

    // 3. API Core & Auth
    if (apiDesign) {
      prompts.push(this.generateApiCorePrompt(step++, apiDesign, techStack, globalContext));
    }

    // 4. Feature Implementation (Batched)
    if (apiDesign) {
      const featurePrompts = this.generateFeaturePrompts(
        step,
        apiDesign,
        techStack,
        systemDesign,
        globalContext
      );
      prompts.push(...featurePrompts);
      step += featurePrompts.length;
    }

    // 5. Frontend Integration (New)
    if (apiDesign) {
      prompts.push(
        this.generateFrontendIntegrationPrompt(step++, techStack, apiDesign, globalContext)
      );
    }

    return prompts;
  }

  private static mapOutputs(agentOutputs: AgentOutput[]): Record<string, unknown> {
    const map: Record<string, unknown> = {};
    for (const out of agentOutputs) {
      if (out.status === 'completed' && out.output) {
        map[out.agentType] = out.output;
      }
    }
    return map;
  }

  private static generateGlobalContext(
    memory: SharedMemory | undefined,
    techStack: TechStackOutput
  ): string {
    const rules = [
      '# GLOBAL RULES & CONTEXT (CRITICAL)',
      '1. **NO PLACEHOLDERS**: Write full, working code. Do not use "// ... rest of code".',
      '2. **FILE PATHS**: Always specify the exact relative file path at the top of code blocks.',
      '3. **TECH STACK ENFORCEMENT**:',
      `   - Frontend: ${techStack.frontend.framework} (${techStack.frontend.stateManagement})`,
      `   - Backend: ${techStack.backend.framework} (${techStack.backend.runtime})`,
      `   - Database: ${techStack.database.primary}`,
    ];

    if (memory) {
      if (memory.decisions.length > 0) {
        rules.push('4. **ARCHITECTURAL DECISIONS**:');
        memory.decisions.forEach((d) => rules.push(`   - ${d}`));
      }
      if (memory.constraints.length > 0) {
        rules.push('5. **CONSTRAINTS**:');
        memory.constraints.forEach((c) => rules.push(`   - ${c}`));
      }
      if (memory.risks.length > 0) {
        rules.push('6. **RISKS TO MITIGATE**:');
        memory.risks.forEach((r) => rules.push(`   - ${r}`));
      }
    }

    return rules.join('\n') + '\n\n';
  }

  private static generateScaffoldPrompt(
    step: number,
    techStack: TechStackOutput,
    globalContext: string
  ): CodingPrompt {
    return {
      step,
      title: 'Project Scaffolding & Initialization',
      description:
        'Initialize the monorepo structure, backend, and frontend with selected technologies.',
      promptContent: `${globalContext}You are an expert software architect acting as the Tech Lead.
Initialize a robust project structure based on the following stack:

# Technology Stack
- **Frontend**: ${techStack.frontend.framework} (${techStack.frontend.buildTool}) - State: ${techStack.frontend.stateManagement}
- **Backend**: ${techStack.backend.framework} (${techStack.backend.runtime})
- **Database**: ${techStack.database.primary}
- **Monorepo/Structure**: Standard folder structure for these technologies.

# Goal
Create the foundational file structure and configuration files.

# Instructions
1. **Directory Structure**: Create a clean structure (e.g., \`apps/web\`, \`apps/api\` or \`frontend/\`, \`backend/\`).
2. **Backend Setup**:
   - Initialize \`package.json\` for the backend.
   - Install dependencies: \`${techStack.backend.framework}\`, db drivers, etc.
   - Setup basic tsconfig.json (if TypeScript).
   - Create \`.env.example\`.
3. **Frontend Setup**:
   - Initialize \`package.json\` for the frontend with \`${techStack.frontend.framework}\`.
   - Setup build tool config (\`${techStack.frontend.buildTool}\`).
   - Setup state management (\`${techStack.frontend.stateManagement}\`).
4. **Shared Config**: Setup eslint, prettier, or gitignore at root if applicable.

# Output
- Provide the **Terminal Commands** to create directories and install packages.
- Provide the **File Contents** for critical config files (\`package.json\`, \`tsconfig.json\`, \`vite.config.ts\`, etc.).
`,
    };
  }

  private static generateDatabasePrompt(
    step: number,
    techStack: TechStackOutput,
    systemDesign: SystemDesignOutput,
    globalContext: string
  ): CodingPrompt {
    const componentNames = systemDesign.highLevelComponents.map((c) => c.name).join(', ');

    return {
      step,
      title: 'Database Schema & Data Layer',
      description: 'Define the data models, relationships, and ORM configuration.',
      promptContent: `${globalContext}You are a Senior Database Engineer.

# Context
- **System**: ${componentNames}
- **Database**: ${techStack.database.primary}
- **Caching**: ${techStack.database.caching}

# Goal
Implement the database schema and connection logic.

# Instructions
1. **Schema Definition**: 
   - Create ALL necessary tables/collections based on the system design responsibilities.
   - Ensure proper relationships (Foreign Keys) and Indexing for performance.
   - **Crucial**: If using Prisma/TypeORM/Mongoose, write the COMPLETE schema file (e.g., \`schema.prisma\`).
2. **Connection Setup**:
   - Write the database connection utility/module (e.g., \`src/db/client.ts\`).
   - Handle connection persistence and errors.
3. **Seeds**:
   - Provide a basic seed script to populate initial static data if needed.

# Output
- The **Schema Configuration** code.
- The **DB Connection** code.
- A **Migration/Sync** command if applicable.
`,
    };
  }

  private static generateApiCorePrompt(
    step: number,
    apiDesign: APIDesignOutput,
    techStack: TechStackOutput,
    globalContext: string
  ): CodingPrompt {
    return {
      step,
      title: 'API Core, Extensions & Auth',
      description:
        'Set up the server instance, global middleware, error handling, and authentication.',
      promptContent: `${globalContext}You are a Backend Specialist expert in ${techStack.backend.framework}.

# Specs
- **Framework**: ${techStack.backend.framework}
- **Versioning**: ${apiDesign.apiVersioning}
- **Auth Strategy**: ${apiDesign.endpoints.find((e) => e.authentication !== 'None')?.authentication || 'Standard'
        }

# Instructions
1. **Server Entry Point**:
   - Setup the main application (e.g., \`src/app.ts\` or \`src/main.ts\`).
   - Configure CORS, Helmet/Security headers, and Body Parsing.
   - Register the Global Error Handler (standardized error responses).
2. **Authentication Middleware**:
   - Implement the Auth middleware (JWT validation, session check, etc.) as described in the specs.
   - Create a \`UserContext\` decorator or utility to access the current user in routes.
3. **Base Controller/Router Setup**:
   - Setup the main router that mounts versioned routes (e.g., \`/api/${apiDesign.apiVersioning}\`).

# Output
- Code for \`src/app.ts\`, \`src/middleware/auth.ts\`, \`src/middleware/error-handler.ts\`.
`,
    };
  }

  private static generateFeaturePrompts(
    startStep: number,
    apiDesign: APIDesignOutput,
    techStack: TechStackOutput,
    systemDesign: SystemDesignOutput,
    globalContext: string
  ): CodingPrompt[] {
    const prompts: CodingPrompt[] = [];
    const chunkSize = 4; // Smaller chunks for more detail

    const endpoints = apiDesign.endpoints;

    if (endpoints.length === 0) return [];

    for (let i = 0; i < endpoints.length; i += chunkSize) {
      const chunk = endpoints.slice(i, i + chunkSize);
      const stepNum = startStep + Math.floor(i / chunkSize);

      const endpointDetails = chunk
        .map((e) => {
          const reqSchema = e.requestBody
            ? JSON.stringify(e.requestBody.schema, null, 2)
            : 'No Body';
          const resSchema = e.responseBody
            ? JSON.stringify(e.responseBody.schema, null, 2)
            : 'Standard Response';
          return `
### ${e.method} ${e.path}
- **Description**: ${e.description}
- **Auth**: ${e.authentication}
- **Request Schema**:
\`\`\`json
${reqSchema}
\`\`\`
- **Response Schema**:
\`\`\`json
${resSchema}
\`\`\`
`;
        })
        .join('\n---\n');

      prompts.push({
        step: stepNum,
        title: `Implement Features (Part ${Math.floor(i / chunkSize) + 1})`,
        description: `Implement endpoints: ${chunk.map((e) => e.path).join(', ')}`,
        promptContent: `${globalContext}You are a Full-Stack Developer building robust API features.

# Context
- **Framework**: ${techStack.backend.framework}
- **Database**: ${techStack.database.primary}
- **System Components**: ${systemDesign.highLevelComponents.map((c) => c.name).join(', ')}

# Goal
Implement the business logic and API endpoints for this batch.

# Endpoints needed
${endpointDetails}

# Instructions
1. **DTOs/Validation**: Create Zod/TypeBox/Class-Validator schemas for the requests.
2. **Service Layer**: Implement the business logic in a Service (not directly in controller).
   - Handle DB operations.
   - Throw specific errors for the Error Handler to catch.
3. **Controller**: Connect the Route to the Service.
4. **Integration**: Ensure routes are registered in the main router.

# Output
- Full code for Controllers, Services, and DTOs for these endpoints.
`,
      });
    }

    return prompts;
  }

  private static generateFrontendIntegrationPrompt(
    step: number,
    techStack: TechStackOutput,
    apiDesign: APIDesignOutput,
    globalContext: string
  ): CodingPrompt {
    return {
      step,
      title: 'Frontend Integration & Client',
      description: 'Setup API client and basic UI integration.',
      promptContent: `${globalContext}You are a Frontend Expert specializing in ${techStack.frontend.framework}.

# Specs
- **Framework**: ${techStack.frontend.framework}
- **State Config**: ${techStack.frontend.stateManagement}
- **Base API URL**: \`/api/${apiDesign.apiVersioning}\`

# Goal
Connect the frontend to the backend API.

# Instructions
1. **API Client**:
   - Create a typed API client (e.g., using Axios or Fetch wrapper) in \`src/api/client.ts\`.
   - Implement an Interceptor to automatically attach the Auth Token.
2. **Types**:
   - Generate TypeScript interfaces matching the Backend DTOs for the users/features.
3. **Integration Example**:
   - Create a "Dashboard" or "Home" component that fetches data from one of the main endpoints implemented earlier.
   - Display the data using a simple UI component.
4. **State Management**:
   - Setup a basic Store/Context (using ${techStack.frontend.stateManagement}) to hold User session or Global data.

# Output
- Code for \`src/api/client.ts\`, \`src/types/api.ts\`, and the example Component.
`,
    };
  }
}
