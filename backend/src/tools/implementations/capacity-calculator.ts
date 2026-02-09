import { Tool } from '../core/tool';
import { z } from 'zod';
import { AgentContext } from '../../core/contracts';

export class CapacityCalculator implements Tool {
  name = 'capacity_calculator';
  description = 'Calculates Request Per Second (RPS) and storage needs based on user scale.';
  category = 'analysis' as const;
  timeoutMs = 5000;

  parameters = {
    type: 'object' as const,
    properties: {
      dailyActiveUsers: { type: 'number', description: 'Number of daily active users (DAU)' },
      avgRequestsPerUser: { type: 'number', description: 'Average API requests per user per day' },
      avgStoragePerUserMB: {
        type: 'number',
        description: 'Average storage generation per user per day in MB',
      },
    },
    required: ['dailyActiveUsers'],
  };

  schema = z.object({
    dailyActiveUsers: z.number().min(1, 'DAU must be greater than 0'),
    avgRequestsPerUser: z.number().optional().default(50),
    avgStoragePerUserMB: z.number().optional().default(1),
  });

  async validate(args: any) {
    const result = this.schema.safeParse(args);
    return {
      valid: result.success,
      error: result.success ? undefined : result.error.message,
    };
  }

  async execute(args: any, context?: AgentContext) {
    // Validate inputs using Zod
    const input = this.schema.parse(args);

    const dau = input.dailyActiveUsers;
    const reqPerUser = input.avgRequestsPerUser;
    const storagePerUser = input.avgStoragePerUserMB;

    // Calculations
    const totalRequestsPerDay = dau * reqPerUser;
    const rps = Math.ceil(totalRequestsPerDay / (24 * 60 * 60));
    const peakRps = Math.ceil(rps * 2); // Assume 2x peak

    const totalStoragePerDayMB = dau * storagePerUser;
    const totalStoragePerYearTB = (totalStoragePerDayMB * 365) / (1024 * 1024);

    return {
      requests: {
        totalRequestsPerDay,
        averageRPS: rps,
        peakRPS: peakRps,
        methodology: `Assumed ${reqPerUser} requests/user/day distributed over 24h`
      },
      storage: {
        dailyNewStorageGB: parseFloat((totalStoragePerDayMB / 1024).toFixed(2)),
        yearlyNewStorageTB: parseFloat(totalStoragePerYearTB.toFixed(2)),
        methodology: `Assumed ${storagePerUser}MB/user/day`
      },
      scaleTier: this.getScaleTier(rps),
      recommendations: this.getRecommendations(rps, totalStoragePerYearTB),
    };
  }

  private getScaleTier(rps: number): string {
    if (rps < 50) return 'Startup';
    if (rps < 500) return 'Growth';
    if (rps < 5000) return 'Scale';
    return 'Hyper-scale';
  }

  private getRecommendations(rps: number, storageTB: number): string[] {
    const recommendations: string[] = [];

    // Compute recommendations
    if (rps > 1000) {
      recommendations.push('Implement command-query separation (CQRS)');
      recommendations.push('Use read replicas for database');
      recommendations.push('Implement aggressive caching (Redis/Memcached)');
    } else if (rps > 100) {
      recommendations.push('Use standard load balancing');
      recommendations.push('Basic caching strategy required');
    }

    // Storage recommendations
    if (storageTB > 100) {
      recommendations.push('Consider data lake or icy storage for older data');
      recommendations.push('Database sharding likely required');
    } else if (storageTB > 10) {
      recommendations.push('Implement database partitioning/archival strategy');
    }

    return recommendations;
  }
}
