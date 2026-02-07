import { Tool } from '../core/tool';
import { z } from 'zod';

export class DatabaseSelector implements Tool {
    name = 'database_selector';
    description = 'Recommends a database system based on structured requirements and theoretical trade-offs.';
    category = 'analysis' as const;
    timeoutMs = 5000;

    parameters = {
        type: 'object' as const,
        properties: {
            dataModel: { type: 'string', description: 'relational, document, wide-column, graph, key-value' },
            consistency: { type: 'string', description: 'strong, eventual, causal' },
            writeVolume: { type: 'string', description: 'low, medium, high, extreme' },
            queryPatterns: { type: 'array', items: { type: 'string' } }
        },
        required: ['dataModel', 'consistency'],
    };

    schema = z.object({
        dataModel: z.enum(['relational', 'document', 'wide-column', 'graph', 'key-value', 'time-series', 'vector']),
        consistency: z.enum(['strong', 'eventual', 'causal']),
        writeVolume: z.enum(['low', 'medium', 'high', 'extreme']).default('medium'),
        queryPatterns: z.array(z.string()).optional()
    });

    async validate(args: any) {
        const result = this.schema.safeParse(args);
        return {
            valid: result.success,
            error: result.success ? undefined : result.error.message,
        };
    }

    async execute(args: any) {
        const input = this.schema.parse(args);

        const candidates = this.getCandidates(input.dataModel);

        // Filter and score candidates
        const scored = candidates.map(db => {
            let score = 10;
            const reasons: string[] = [];

            // Consistency check
            if (input.consistency === 'strong' && !db.strongConsistency) {
                score -= 5;
                reasons.push('Does not support native strong consistency');
            }

            // Write volume check
            if (input.writeVolume === 'extreme' && !db.highWriteThroughput) {
                score -= 4;
                reasons.push('May struggle with extreme write pressure');
            }

            return { ...db, score, warnings: reasons };
        }).sort((a, b) => b.score - a.score);

        const winner = scored[0];

        return {
            bestFit: winner.name,
            category: input.dataModel,
            candidates: scored.map(s => ({
                name: s.name,
                score: s.score,
                warnings: s.warnings
            })),
            tradeOffAnalysis: {
                consistency: input.consistency,
                capTheorem: winner.capType,
                scalingCharacteristics: winner.scaling
            }
        };
    }

    private getCandidates(model: string): any[] {
        const dbKnowledge: Record<string, any[]> = {
            'relational': [
                { name: 'PostgreSQL', strongConsistency: true, highWriteThroughput: false, capType: 'CA/CP', scaling: 'Vertical (Read Replicas)' },
                { name: 'MySQL/Aurora', strongConsistency: true, highWriteThroughput: true, capType: 'CA/CP', scaling: 'Vertical (Read Replicas)' },
                { name: 'CockroachDB', strongConsistency: true, highWriteThroughput: true, capType: 'CP', scaling: 'Horizontal' }
            ],
            'document': [
                { name: 'MongoDB', strongConsistency: true, highWriteThroughput: true, capType: 'CP', scaling: 'Horizontal' },
                { name: 'DynamoDB', strongConsistency: true, highWriteThroughput: true, capType: 'AP', scaling: 'Horizontal' }
            ],
            'key-value': [
                { name: 'Redis', strongConsistency: true, highWriteThroughput: true, capType: 'CP', scaling: 'Horizontal (Cluster)' },
                { name: 'DynamoDB', strongConsistency: false, highWriteThroughput: true, capType: 'AP', scaling: 'Horizontal' }
            ],
            'wide-column': [
                { name: 'Cassandra', strongConsistency: false, highWriteThroughput: true, capType: 'AP', scaling: 'Horizontal' },
                { name: 'ScyllaDB', strongConsistency: false, highWriteThroughput: true, capType: 'AP', scaling: 'Horizontal' }
            ],
            'graph': [
                { name: 'Neo4j', strongConsistency: true, highWriteThroughput: false, capType: 'CA', scaling: 'Vertical/Causal Cluster' }
            ],
            'vector': [
                { name: 'Pinecone', strongConsistency: false, highWriteThroughput: true, capType: 'AP', scaling: 'Horizontal' },
                { name: 'Milvus', strongConsistency: false, highWriteThroughput: true, capType: 'AP', scaling: 'Horizontal' }
            ]
        };

        return dbKnowledge[model] || [];
    }
}
