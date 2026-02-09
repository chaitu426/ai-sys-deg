import { Tool } from '../core/tool';
import { z } from 'zod';
import { AgentContext } from '../../core/contracts';

export class SecurityThreatModeler implements Tool {
    name = 'threat_modeler';
    description = 'Analyzes architecture components using STRIDE methodology to identify security threats.';
    category = 'analysis' as const;
    timeoutMs = 5000;

    parameters = {
        type: 'object' as const,
        properties: {
            componentType: { type: 'string', description: 'API, Database, Client, Worker, Queue' },
            isPublicFacing: { type: 'boolean' },
            sensitiveData: { type: 'boolean' }
        },
        required: ['componentType'],
    };

    schema = z.object({
        componentType: z.enum(['API', 'Database', 'Client', 'Worker', 'Queue', 'Storage']),
        isPublicFacing: z.boolean().default(false),
        sensitiveData: z.boolean().default(false)
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
        const threats: Array<{
            category: string; // Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
            threat: string;
            mitigation: string;
            severity: 'Low' | 'Medium' | 'High' | 'Critical';
        }> = [];

        // STRIDE Logic
        // S - Spoofing
        if (input.componentType === 'API' || input.componentType === 'Client') {
            threats.push({
                category: 'Spoofing',
                threat: 'Attacker impersonating a legitimate user',
                mitigation: 'Implement strong authentication (OIDC/JWT) and MFA',
                severity: input.isPublicFacing ? 'Critical' : 'High'
            });
        }

        // T - Tampering
        if (input.componentType === 'API' || input.componentType === 'Database' || input.componentType === 'Storage') {
            threats.push({
                category: 'Tampering',
                threat: 'Modification of data in transit or at rest',
                mitigation: 'Use TLS for transit and integrity checks (HMAC/Signatures)',
                severity: input.sensitiveData ? 'Critical' : 'Medium'
            });
        }

        // R - Repudiation
        if (input.componentType === 'API' || input.componentType === 'Database') {
            threats.push({
                category: 'Repudiation',
                threat: 'User denies performing an action',
                mitigation: 'Comprehensive audit logging with non-repudiation guarantees',
                severity: 'Medium'
            });
        }

        // I - Information Disclosure
        if (input.sensitiveData) {
            threats.push({
                category: 'Information Disclosure',
                threat: 'Exposure of sensitive data to unauthorized parties',
                mitigation: 'Encryption at rest (AES-256) and strict field-level access control',
                severity: 'Critical'
            });
        }

        // D - Denial of Service
        if (input.isPublicFacing && (input.componentType === 'API' || input.componentType === 'Client')) {
            threats.push({
                category: 'Denial of Service',
                threat: 'Resource exhaustion attack',
                mitigation: 'Rate limiting, WAF, and auto-scaling limits',
                severity: 'High'
            });
        }

        // E - Elevation of Privilege
        if (input.componentType === 'API') {
            threats.push({
                category: 'Elevation of Privilege',
                threat: 'User gaining admin rights',
                mitigation: 'Strict RBAC/ABAC checks on every endpoint',
                severity: 'High'
            });
        }

        return {
            component: input.componentType,
            riskScore: this.calculateRiskScore(threats),
            identifiedThreats: threats,
            summary: `Identified ${threats.length} potential threats using STRIDE methodology.`
        };
    }

    private calculateRiskScore(threats: any[]): number {
        const weights = { Low: 1, Medium: 3, High: 7, Critical: 10 };
        return threats.reduce((acc, t) => acc + (weights[t.severity as keyof typeof weights] || 1), 0);
    }
}
