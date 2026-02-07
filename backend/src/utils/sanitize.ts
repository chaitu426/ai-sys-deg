/**
 * Input sanitization utilities
 * Production-ready input validation and sanitization
 */

import { getLogger } from './logger';

const logger = getLogger();

/**
 * Sanitize user prompt to prevent injection attacks
 * Removes potentially dangerous patterns while preserving legitimate content
 */
export function sanitizePrompt(prompt: string): string {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }

  let sanitized = prompt;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove excessive newlines (more than 3 consecutive)
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Detect and log suspicious patterns (but don't block - LLM can handle)
  const suspiciousPatterns = [
    /(<script|<iframe|javascript:)/gi,
    /(DROP TABLE|DELETE FROM|INSERT INTO|UPDATE.*SET)/gi,
    /(eval\(|Function\(|setTimeout\()/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      logger.warn('Suspicious pattern detected in prompt', {
        pattern: pattern.source,
        promptPreview: sanitized.substring(0, 100),
      });
    }
  }

  // Trim and limit length (defensive)
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Remove all whitespace and convert to lowercase
  return email.trim().toLowerCase().replace(/\s/g, '');
}

/**
 * Sanitize general text input
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim and limit length
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize agent type enum
 */
export function validateAgentType(agentType: string): boolean {
  const VALID_AGENTS = [
    'requirement_analyzer',
    'system_design',
    'tech_stack',
    'diagram_generator',
    'api_design',
    'cost_estimation',
    'deployment_strategy',
    'failure_mode_analyzer',
  ];

  return VALID_AGENTS.includes(agentType);
}

/**
 * Sanitize arrays from agent outputs that are expected to be string arrays.
 * Handles cases where agents return objects instead of strings.
 */
export function sanitizeAgentArray(items: any[] | undefined): string[] {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    if (typeof item === 'object' && item !== null) {
      return item.title || item.description || item.name || item.text || item.scenario || JSON.stringify(item);
    }
    return String(item);
  });
}
