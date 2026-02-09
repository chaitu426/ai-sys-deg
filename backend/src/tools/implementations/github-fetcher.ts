import { Tool } from '../core/tool';
import { AgentContext } from '../../core/contracts';
import axios from 'axios';
import { prisma } from '../../db/client';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

interface GitHubFetcherInput {
    repoFullName: string;
}

export class GitHubFetcher implements Tool {
    name = 'github_fetcher';
    description = 'Fetch repository file structure and README content from GitHub.';
    parameters = {
        type: 'object' as const,
        properties: {
            repoFullName: {
                type: 'string',
                description: 'The full name of the repository (e.g., "owner/repo").',
            },
            path: {
                type: 'string',
                description: 'Optional: Specific file path to fetch contents for.',
            },
        },
        required: ['repoFullName'],
    };

    async execute(input: GitHubFetcherInput & { path?: string }, context?: AgentContext): Promise<any> {
        if (!context?.projectId) {
            throw new Error('Project ID is required in context for github_fetcher.');
        }

        try {
            // 1. Get user's access token
            const project = await prisma.project.findUnique({
                where: { id: context.projectId },
                select: { userId: true },
            });

            if (!project) {
                throw new Error('Project not found');
            }

            const user = (await prisma.user.findUnique({
                where: { id: project.userId },
                select: { githubAccessToken: true } as any,
            })) as any;

            if (!user?.githubAccessToken) {
                throw new Error('GitHub account not connected. Please connect your GitHub account.');
            }

            const token = user.githubAccessToken;

            // 2. If path is provided, fetch specific file content
            if (input.path) {
                try {
                    const fileResponse = await axios.get(
                        `https://api.github.com/repos/${input.repoFullName}/contents/${input.path}`,
                        {
                            headers: {
                                Authorization: `token ${token}`,
                                Accept: 'application/vnd.github.v3.raw'
                            },
                        }
                    );
                    return {
                        repoFullName: input.repoFullName,
                        path: input.path,
                        content: typeof fileResponse.data === 'string' ? fileResponse.data : JSON.stringify(fileResponse.data),
                    };
                } catch (err: any) {
                    logger.warn('File not found or error fetching content', { repoFullName: input.repoFullName, path: input.path });
                    throw new Error(`Failed to fetch file ${input.path}: ${err.message}`);
                }
            }

            // 3. Fetch repository structure (Recursive tree)
            // We'll get the default branch first
            const repoInfoResponse = await axios.get(`https://api.github.com/repos/${input.repoFullName}`, {
                headers: { Authorization: `token ${token}` },
            });
            const defaultBranch = repoInfoResponse.data.default_branch;

            const treeResponse = await axios.get(
                `https://api.github.com/repos/${input.repoFullName}/git/trees/${defaultBranch}?recursive=1`,
                {
                    headers: { Authorization: `token ${token}` },
                }
            );

            const fileTree = treeResponse.data.tree
                .filter((item: any) => item.type === 'blob')
                .map((item: any) => item.path);

            // 4. Fetch README content
            let readme = '';
            try {
                const readmeResponse = await axios.get(`https://api.github.com/repos/${input.repoFullName}/readme`, {
                    headers: {
                        Authorization: `token ${token}`,
                        Accept: 'application/vnd.github.v3.raw'
                    },
                });
                readme = readmeResponse.data;
            } catch (err) {
                logger.warn('README not found for repo', { repoFullName: input.repoFullName });
            }

            // 5. Summarize structure to keep it manageable
            const topLevelFiles = fileTree.filter((path: string) => !path.includes('/'));
            const directories = Array.from(new Set(fileTree.filter((path: string) => path.includes('/')).map((path: string) => path.split('/')[0])));

            return {
                repoFullName: input.repoFullName,
                defaultBranch,
                readmePreview: readme.substring(0, 5000), // Cap for context window
                fileTreeSummary: {
                    topLevelFiles,
                    directories,
                    totalFiles: fileTree.length,
                },
            };
        } catch (error: any) {
            logger.error('GitHub fetcher failed', error);
            throw new Error(`Failed to fetch GitHub repo: ${error.message}`);
        }
    }
}
