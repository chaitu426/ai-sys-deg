import { Tool } from '../core/tool';
import { z } from 'zod';
import { AgentContext } from '../../core/contracts';

export class TechRadar implements Tool {
  name = 'tech_radar';
  description = 'Checks the maturity status of a technology.';
  category = 'analysis' as const;
  timeoutMs = 15000;

  parameters = {
    type: 'object' as const,
    properties: {
      technology: { type: 'string', description: 'Name of the technology to check' },
    },
    required: ['technology'],
  };

  schema = z.object({
    technology: z.string().min(1, 'Technology name required'),
  });

  async validate(args: any) {
    const result = this.schema.safeParse(args);
    return {
      valid: result.success,
      error: result.success ? undefined : result.error.message,
    };
  }

  async execute(args: { technology: string }) {
    const input = this.schema.parse(args);
    const techName = input.technology.toLowerCase();

    // 1. Web Search for latest status
    let searchContext: { source: string; snippet: string; link: string }[] = [];
    try {
      const { WebSearcher } = await import('../../utils/web-search');
      const query = `${techName} technology radar thoughtworks status 2024 2025`;
      const results = await WebSearcher.search(query, 3);

      searchContext = results.map((r: any) => ({
        source: r.title,
        snippet: r.snippet,
        link: r.link,
      }));
    } catch (e) {
      console.error('TechRadar search failed', e);
    }

    // Mock Radar Data (Fallback)
    const radarData: Record<string, { status: string; category: string; description: string }> = {
      react: { status: 'Adopt', category: 'Frontend', description: 'Standard library for web UI' },
      'next.js': { status: 'Adopt', category: 'Frontend', description: 'Leading React framework' },
      vue: { status: 'Adopt', category: 'Frontend', description: 'Solid progressive framework' },
      angular: {
        status: 'Hold',
        category: 'Frontend',
        description: 'Complexity might be high for new projects',
      },

      'node.js': {
        status: 'Adopt',
        category: 'Backend',
        description: 'Proven runtime for I/O heavy apps',
      },
      'nest.js': {
        status: 'Adopt',
        category: 'Backend',
        description: 'Enterprise-grade Node.js framework',
      },
      python: { status: 'Adopt', category: 'Backend', description: 'King of AI/ML and scripting' },
      rust: {
        status: 'Trial',
        category: 'Backend',
        description: 'Great for performance-critical components',
      },
      go: { status: 'Adopt', category: 'Backend', description: 'Excellent for microservices' },

      postgresql: {
        status: 'Adopt',
        category: 'Database',
        description: 'Best general purpose relational DB',
      },
      mongodb: {
        status: 'Trial',
        category: 'Database',
        description: 'Good for unstructured data, watch out for complexity',
      },
      redis: { status: 'Adopt', category: 'Cache', description: 'Industry standard for caching' },

      kubernetes: {
        status: 'Adopt',
        category: 'Infrastructure',
        description: 'Standard for orchestration',
      },
      docker: {
        status: 'Adopt',
        category: 'Infrastructure',
        description: 'Standard for containerization',
      },
      terraform: {
        status: 'Adopt',
        category: 'IaC',
        description: 'Standard for infrastructure as code',
      },
    };

    const info = radarData[techName];

    return {
      technology: techName,
      status: info ? info.status : 'Assess',
      category: info ? info.category : 'Unknown',
      description: info ? info.description : 'Technology not explicitly tracked in mock radar.',
      recommendation: this.getRecommendation(info ? info.status : 'Assess'),
      dataSource: searchContext.length > 0 ? 'hybrid (web + mock)' : 'mock',
      searchContext,
    };
  }

  private getRecommendation(status: string): string {
    switch (status.toLowerCase()) {
      case 'adopt': return 'Safe to use in production. High maturity.';
      case 'trial': return 'Can be used for non-critical services or with experienced team.';
      case 'assess': return 'Investigate further. Not ready for core production use yet.';
      case 'hold': return 'Avoid for new projects. Use only if legacy requires it.';
      default: return 'Requires expert evaluation.';
    }
  }
}
