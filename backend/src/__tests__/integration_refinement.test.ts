import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AGENTS } from '../core/contracts';

// Mock dependencies
jest.mock('../db/client', () => ({
    prisma: {
        project: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        designVersion: { findUnique: jest.fn() },
    }
}));
jest.mock('../queue/connection', () => ({
    getRedisConnection: jest.fn(() => ({})),
}));
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        close: jest.fn(),
    })),
}));
jest.mock('../utils/logger', () => ({
    getLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    })),
}));

// We need to import the Orchestrator after mocking
import { Orchestrator } from '../core/orchestrator';

describe('Orchestrator Integration Refinement (Logic Verification)', () => {
    let orchestrator: any;

    beforeEach(() => {
        jest.clearAllMocks();
        orchestrator = new Orchestrator();
    });

    describe('determineNextAgents', () => {
        it('should skip REPOSITORY_ANALYZER if githubRepoFullName is missing', async () => {
            const context = {
                githubRepoFullName: undefined,
                agentStatuses: {},
                previousOutputs: {},
                userPlan: 'FREE',
            };

            const nextAgents = await orchestrator.determineNextAgents(context, 'test-id');
            expect(nextAgents).toContain(AGENTS.REQUIREMENT_ANALYZER);
            expect(nextAgents).not.toContain(AGENTS.REPOSITORY_ANALYZER);
        });

        it('should include REPOSITORY_ANALYZER if githubRepoFullName is present', async () => {
            const context = {
                githubRepoFullName: 'owner/repo',
                agentStatuses: {},
                previousOutputs: {},
                userPlan: 'FREE',
            };

            const nextAgents = await orchestrator.determineNextAgents(context, 'test-id');
            expect(nextAgents).toContain(AGENTS.REPOSITORY_ANALYZER);
        });

        it('should skip REPOSITORY_ANALYZER if it is already completed', async () => {
            const context = {
                githubRepoFullName: 'owner/repo',
                agentStatuses: {
                    [AGENTS.REPOSITORY_ANALYZER]: 'completed',
                },
                previousOutputs: {
                    repositoryAnalyzer: { techStack: {}, mainComponents: [], purpose: '' },
                },
                userPlan: 'FREE',
            };

            const nextAgents = await orchestrator.determineNextAgents(context, 'test-id');
            expect(nextAgents).toContain(AGENTS.REQUIREMENT_ANALYZER);
            expect(nextAgents).not.toContain(AGENTS.REPOSITORY_ANALYZER);
        });
    });
});
