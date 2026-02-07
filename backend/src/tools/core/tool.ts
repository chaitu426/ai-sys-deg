/**
 * Base interface for all tools
 */
import { z } from 'zod';

/**
 * Base interface for all tools
 * Production-grade with validation and metadata
 */
export interface Tool {
  /**
   * Unique identifier for the tool
   */
  name: string;

  /**
   * clear description for the LLM to understand when to use it
   */
  description: string;

  /**
   * JSON Schema definition for tool parameters (compatible with OpenAI/Gemini)
   */
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };

  /**
   * Zod schema for runtime validation of arguments
   */
  schema?: z.ZodType<any>;

  /**
   * Optional category for grouping tools
   */
  category?: 'infrastructure' | 'compliance' | 'cost' | 'analysis' | 'other';

  /**
   * Estimated execution time in ms (for timeouts)
   */
  timeoutMs?: number;

  /**
   * Execute the tool with given arguments
   */
  execute(args: any): Promise<any>;

  /**
   * Validate arguments before execution (optional but recommended)
   */
  validate?(args: any): Promise<{ valid: boolean; error?: string }>;
}

