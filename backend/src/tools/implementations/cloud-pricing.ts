import { Tool } from '../core/tool';
import { z } from 'zod';

export class CloudPricing implements Tool {
  name = 'cloud_pricing';
  description = 'Estimates monthly cloud costs for various services.';
  category = 'cost' as const;
  timeoutMs = 15000;

  parameters = {
    type: 'object' as const,
    properties: {
      service: { type: 'string', description: 'Service type (compute, database, storage, cache)' },
      size: { type: 'string', description: 'Size/Tier (small, medium, large, xlarge)' },
    },
    required: ['service', 'size'],
  };

  schema = z.object({
    service: z.enum(['compute', 'database', 'storage', 'cache']),
    size: z.enum(['small', 'medium', 'large', 'xlarge']),
  });

  async validate(args: any) {
    const result = this.schema.safeParse(args);
    return {
      valid: result.success,
      error: result.success ? undefined : result.error.message,
    };
  }

  async execute(args: { service: string; size: string }) {
    // Validate inputs
    const input = this.schema.parse(args);
    const service = input.service;
    const size = input.size;

    // 1. Try to search for real-time data
    let searchContext = [] as any;
    try {
      // Dynamic import to avoid issues if utils not yet compiled in some envs
      const { WebSearcher } = await import('../../utils/web-search');
      const query = `cloud pricing ${service} ${size} usd month 2024 2025`;
      const results = await WebSearcher.search(query, 3);

      searchContext = results.map((r: any) => ({
        source: r.title,
        snippet: r.snippet,
        link: r.link,
      }));
    } catch (e) {
      console.error('CloudPricing search failed', e);
    }

    // 2. Mock database of prices (USD/month) as fallback/reference
    const priceMap: Record<string, Record<string, number>> = {
      compute: {
        // EC2 / VM
        small: 15,
        medium: 40,
        large: 80,
        xlarge: 160,
      },
      database: {
        // RDS / Cloud SQL
        small: 30,
        medium: 80,
        large: 200,
        xlarge: 500,
      },
      storage: {
        // S3 / GCS (per TB)
        small: 23, // 1 TB
        medium: 115, // 5 TB
        large: 230, // 10 TB
        xlarge: 1150, // 50 TB
      },
      cache: {
        // Redis / Memcached
        small: 20,
        medium: 50,
        large: 120,
        xlarge: 300,
      },
    };

    const category = priceMap[service];
    let estimatedCost = 0;

    if (category && category[size] !== undefined) {
      estimatedCost = category[size];
    } else {
      estimatedCost = -1;
    }

    return {
      service,
      size,
      estimatedMonthlyCost: estimatedCost,
      currency: 'USD',
      dataSource: searchContext.length > 0 ? 'hybrid (web + mock)' : 'mock',
      searchContext: searchContext, // Return snippets for LLM to refine the cost
      note: 'estimatedMonthlyCost is a baseline from 2024 data. Use searchContext for most recent pricing.',
      lastUpdated: '2024-Q1',
    };
  }
}
