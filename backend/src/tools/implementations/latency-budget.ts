import { Tool } from '../core/tool';
import { z } from 'zod';
import { AgentContext } from '../../core/contracts';

export class LatencyBudgetCalculator implements Tool {
    name = 'latency_budget_calculator';
    description = 'Estimates end-to-end latency for a request path and checks against SLA budgets.';
    category = 'analysis' as const;
    timeoutMs = 5000;

    parameters = {
        type: 'object' as const,
        properties: {
            budgetMs: { type: 'number', description: 'Target max latency in milliseconds (e.g., 200)' },
            hops: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['network', 'database', 'service', 'cache', 'compute'] },
                        latencyMs: { type: 'number' },
                    },
                },
            },
        },
        required: ['budgetMs', 'hops'],
    };

    schema = z.object({
        budgetMs: z.number().positive(),
        hops: z.array(
            z.object({
                name: z.string(),
                type: z.enum(['network', 'database', 'service', 'cache', 'compute']),
                latencyMs: z.number().nonnegative(),
                probability: z.number().min(0).max(1).optional().default(1), // Executed 100% of time by default
            })
        ),
    });

    async validate(args: any) {
        const result = this.schema.safeParse(args);
        return {
            valid: result.success,
            error: result.success ? undefined : result.error.message,
        };
    }
    async execute(args: any, context?: AgentContext) {
        const input = this.schema.parse(args);
        const budget = input.budgetMs;

        // Estimates
        let p50Total = 0;
        let p95Total = 0;
        let p99Total = 0;

        const breakdown = input.hops.map((hop) => {
            // Variance multipliers based on component type
            // Databases and networks have higher tail latency than in-memory compute
            let p95Multiplier = 1.5;
            let p99Multiplier = 2.0;

            switch (hop.type) {
                case 'network':
                    p95Multiplier = 2.0; // Network jitter
                    p99Multiplier = 4.0;
                    break;
                case 'database':
                    p95Multiplier = 3.0; // Lock contention, disk I/O
                    p99Multiplier = 10.0;
                    break;
                case 'cache':
                    p95Multiplier = 1.2;
                    p99Multiplier = 1.5;
                    break;
            }

            const p50 = hop.latencyMs * hop.probability;
            const p95 = hop.latencyMs * p95Multiplier * hop.probability;
            const p99 = hop.latencyMs * p99Multiplier * hop.probability;

            p50Total += p50;
            p95Total += p95;
            p99Total += p99;

            return {
                ...hop,
                p50: Math.round(p50),
                p95: Math.round(p95),
                p99: Math.round(p99)
            };
        });

        const passed = p95Total <= budget;

        return {
            budgetMs: budget,
            estimatedLatency: {
                p50: Math.round(p50Total),
                p95: Math.round(p95Total),
                p99: Math.round(p99Total)
            },
            breakdown,
            status: passed ? 'PASSED' : 'FAILED',
            bottleneck: passed ? undefined : this.findBottleneck(breakdown),
            recommendation: passed ? 'Latency is within budget.' : 'Optimize the bottleneck component or relax the budget.'
        };
    }

    private findBottleneck(breakdown: any[]) {
        return breakdown.sort((a, b) => b.p95 - a.p95)[0]?.name;
    }
}
