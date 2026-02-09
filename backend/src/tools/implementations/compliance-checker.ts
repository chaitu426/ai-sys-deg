import { Tool } from '../core/tool';
import { AgentContext } from '../../core/contracts';
import { z } from 'zod';

export class ComplianceChecker implements Tool {
  name = 'compliance_checker';
  description =
    'Analyzes text for sensitive data (PII, PHI, PCI) and suggests compliance standards.';
  category = 'compliance' as const;
  timeoutMs = 10000;

  parameters = {
    type: 'object' as const,
    properties: {
      text: {
        type: 'string',
        description: 'The text or requirements to analyze for compliance risks',
      },
      region: { type: 'string', description: 'Target region (e.g., "EU", "US", "Global")' },
    },
    required: ['text'],
  };

  schema = z.object({
    text: z.string().min(1, 'Text cannot be empty'),
    region: z.string().optional().default('Global'),
  });

  async validate(args: any) {
    const result = this.schema.safeParse(args);
    return {
      valid: result.success,
      error: result.success ? undefined : result.error.message,
    };
  }

  async execute(args: { text: string; region?: string }) {
    const input = this.schema.parse(args);
    const text = input.text.toLowerCase();
    const region = input.region?.toUpperCase() || 'GLOBAL';

    const risks: Array<{ type: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical' }> = [];
    const standards = new Set<string>();

    // PII Detection
    if (text.match(/email|phone|name|address|user data|profile|identity/)) {
      risks.push({
        type: 'PII',
        description: 'Potential Personal Identifiable Information detected',
        severity: 'high'
      });
      standards.add('GDPR');
      standards.add('CCPA');
    }

    // PHI Detection
    if (text.match(/health|medical|patient|doctor|diagnosis|treatment|clinical/)) {
      risks.push({
        type: 'PHI',
        description: 'Potential Protected Health Information detected',
        severity: 'critical'
      });
      standards.add('HIPAA');
      standards.add('HITECH');
    }

    // PCI Detection
    if (text.match(/payment|card|credit|transaction|bank|cvv|billing/)) {
      risks.push({
        type: 'PCI',
        description: 'Potential Payment Card Information detected',
        severity: 'critical'
      });
      standards.add('PCI-DSS');
    }

    // Regional checks
    if (region === 'EU') {
      standards.add('GDPR');
      if (risks.length > 0) standards.add('EU Data Protection Directive');
    }
    if (region === 'US') {
      if (risks.some(r => r.type === 'PHI')) standards.add('HIPAA');
      standards.add('CCPA'); // Assume California as baseline for US privacy
    }

    const requiresDataEncryption = risks.some(r => ['high', 'critical'].includes(r.severity));

    return {
      analysisTimestamp: new Date().toISOString(),
      region,
      riskLevel: risks.length === 0 ? 'low' : risks.some(r => r.severity === 'critical') ? 'critical' : 'high',
      risks,
      suggestedStandards: Array.from(standards),
      requirements: {
        encryptionAtRest: requiresDataEncryption,
        encryptionInTransit: true, // Always recommended
        auditLogging: true,
        dataRetentionPolicy: true
      }
    };
  }
}
