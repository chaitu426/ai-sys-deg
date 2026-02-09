import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { GitHubFetcher } from '../tools/implementations/github-fetcher';
import axios from 'axios';
import { prisma } from '../db/client';

jest.mock('axios');
jest.mock('../db/client', () => ({
    prisma: {
        project: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
    }
}));
jest.mock('../utils/logger', () => ({
    getLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    })),
}));

describe('GitHubFetcher', () => {
    let fetcher: GitHubFetcher;
    const mockContext: any = { projectId: 'project-123' };

    beforeEach(() => {
        jest.clearAllMocks();
        fetcher = new GitHubFetcher();

        (prisma.project.findUnique as any).mockImplementation(() => Promise.resolve({ userId: 'user-123' }));
        (prisma.user.findUnique as any).mockImplementation(() => Promise.resolve({ githubAccessToken: 'fake-token' }));
    });

    it('should fetch repository structure and README when no path is provided', async () => {
        (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve({ data: { default_branch: 'main' } }));
        (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve({ data: { tree: [{ path: 'README.md', type: 'blob' }, { path: 'src/index.js', type: 'blob' }] } }));
        (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve({ data: '# Local README' }));

        const result = await fetcher.execute({ repoFullName: 'owner/repo' }, mockContext);

        expect(result.repoFullName).toBe('owner/repo');
        expect(result.fileTreeSummary.totalFiles).toBe(2);
        expect(result.readmePreview).toContain('# Local README');
        expect(axios.get).toHaveBeenCalledTimes(3);
    });

    it('should fetch specific file content when path is provided', async () => {
        (axios.get as jest.Mock).mockImplementationOnce(() => Promise.resolve({ data: 'console.log("hello")' }));

        const result = await fetcher.execute({ repoFullName: 'owner/repo', path: 'src/index.js' }, mockContext);

        expect(result.path).toBe('src/index.js');
        expect(result.content).toBe('console.log("hello")');
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/contents/src/index.js'),
            expect.any(Object)
        );
    });

    it('should throw error if file path fetch fails', async () => {
        (axios.get as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('404 Not Found')));

        await expect(fetcher.execute({ repoFullName: 'owner/repo', path: 'invalid.js' }, mockContext))
            .rejects.toThrow('Failed to fetch file invalid.js: 404 Not Found');
    });
});
