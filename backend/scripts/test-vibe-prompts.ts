
import { PromptGenerator } from '../src/utils/prompt-generator';
import { AgentOutput, SharedMemory, TechStackOutput } from '../src/core/contracts';

// Mock Data
const mockSharedMemory: SharedMemory = {
    decisions: ['Use Microservices', 'Use PostgreSQL'],
    constraints: ['Budget < $500'],
    risks: ['Complexity overhead'],
    insights: {}
};

const mockTechStack: TechStackOutput = {
    frontend: { framework: 'React', buildTool: 'Vite', stateManagement: 'Zustand', justification: '' },
    backend: { framework: 'Node.js', runtime: 'Express', justification: '' },
    database: { primary: 'PostgreSQL', caching: 'Redis', justification: '' },
    messaging: { queue: 'RabbitMQ', justification: '' },
    infrastructure: { compute: 'AWS', storage: 'S3', monitoring: 'Datadog', justification: '' }
};

const mockAgentOutputs: AgentOutput[] = [
    { agentType: 'tech_stack', status: 'completed', output: mockTechStack },
    { agentType: 'system_design', status: 'completed', output: { highLevelComponents: [] } },
    { agentType: 'api_design', status: 'completed', output: { endpoints: [], apiVersioning: 'v1' } }
];

const mockVersion = {
    agentOutputs: mockAgentOutputs
};

// Run Test
console.log('🧪 Testing Vibe Coding Prompts...');

const prompts = PromptGenerator.generatePrompts(mockVersion, mockSharedMemory);

if (prompts.length === 0) {
    console.error('❌ No prompts generated');
    process.exit(1);
}

const scaffoldPrompt = prompts[0];

console.log('📝 Prompt 1 Title:', scaffoldPrompt.title);

// Check for Global Context
if (scaffoldPrompt.promptContent.includes('# GLOBAL RULES & CONTEXT')) {
    console.log('✅ Global Context Header found');
} else {
    console.error('❌ Global Context Header MISSING');
}

// Check for Memory Items
if (scaffoldPrompt.promptContent.includes('Use Microservices')) {
    console.log('✅ Shared Memory (Decision) found');
} else {
    console.error('❌ Shared Memory (Decision) MISSING');
}

if (scaffoldPrompt.promptContent.includes('Budget < $500')) {
    console.log('✅ Shared Memory (Constraint) found');
} else {
    console.error('❌ Shared Memory (Constraint) MISSING');
}

console.log('\n--- Preview of Context ---\n');
console.log(scaffoldPrompt.promptContent.substring(0, 300));
