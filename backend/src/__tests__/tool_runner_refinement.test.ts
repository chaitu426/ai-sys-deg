import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { runAgentWithTools } from '../agents/tool-runner';
import { getGeminiClient } from '../llm/gemini-client';

jest.mock('../llm/gemini-client');
jest.mock('../utils/logger', () => ({
    getLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    })),
}));
jest.mock('../tools/registry', () => ({
    toolRegistry: {
        getTool: jest.fn(),
    },
}));
jest.mock('../utils/event-emitter', () => ({
    designEvents: {
        emitToolExecution: jest.fn(),
    },
}));

describe('Tool Runner Refinement (Context Trimming Verification)', () => {
    let mockGemini: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGemini = {
            generateFromHistory: jest.fn<any>().mockResolvedValue({ text: '{}' } as any),
        };
        (getGeminiClient as jest.Mock).mockReturnValue(mockGemini);
    });

    it('should trim previous outputs if they exceed 30,000 characters', async () => {
        // Create a large previous output object (approx 40k chars)
        const largeOutput = {
            data: 'a'.repeat(40000)
        };

        const context = {
            prompt: 'test prompt',
            previousOutputs: {
                requirementAnalyzer: largeOutput,
            },
            agentType: 'system_design',
            designVersionId: 'test-version-id',
            projectId: 'test-project-id',
            allowedTools: [],
        };

        // We expect this to call generateFromHistory once
        await runAgentWithTools(context as any, 'You are a test agent', (text) => JSON.parse(text));

        const messages = (mockGemini.generateFromHistory as jest.Mock).mock.calls[0][0] as any[];
        const userMessage = messages.find(m => m.role === 'user');

        expect(userMessage).toBeDefined();
        expect(userMessage.content.length).toBeLessThan(40000);
        expect(userMessage.content).toContain('... (truncated for context limit)');
        expect(userMessage.content).toContain('Previous Analysis Results:');
    });

    it('should NOT trim previous outputs if they are within limits (e.g. 1000 chars)', async () => {
        const smallOutput = {
            data: 'small'
        };

        const context = {
            prompt: 'test prompt',
            previousOutputs: {
                requirementAnalyzer: smallOutput,
            },
            agentType: 'system_design',
            designVersionId: 'test-version-id',
            projectId: 'test-project-id',
            allowedTools: [],
        };

        await runAgentWithTools(context as any, 'You are a test agent', (text) => JSON.parse(text));

        const messages = (mockGemini.generateFromHistory as jest.Mock).mock.calls[0][0] as any[];
        const userMessage = messages.find(m => m.role === 'user');

        expect(userMessage.content).not.toContain('... (truncated for context limit)');
        expect(userMessage.content).toContain('"data": "small"');
    });
});
