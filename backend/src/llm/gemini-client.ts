/**
 * Groq API client abstraction
 * Gemini-compatible, production-grade
 */

import { Groq } from 'groq-sdk';
import { getConfig } from '../utils/config';
import { getLogger } from '../utils/logger';
import { retry } from '../utils/retry';
import { Tool } from '../tools/core/tool';

export interface GeminiMessage {
  role: 'user' | 'model' | 'tool';
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}

export interface GeminiResponse {
  text: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export class GeminiClient {
  private client: Groq;
  private logger = getLogger();
  private model = 'openai/gpt-oss-120b';

  constructor() {
    const config = getConfig();
    this.client = new Groq({
      apiKey: config.GROQ_API_KEY,
    });
  }

  /**
   * Single prompt generation
   * (Simplified wrapper, doesn't handle tool history interaction)
   */
  async generate(
    prompt: string,
    systemInstruction?: string,
    tools?: Tool[]
  ): Promise<GeminiResponse> {
    return retry(async () => {
      this.logger.debug('Calling Groq API', {
        promptLength: prompt.length,
        toolCount: tools?.length ?? 0,
      });

      const messages: any[] = [];

      if (systemInstruction) {
        messages.push({
          role: 'system',
          content: systemInstruction,
        });
      }

      messages.push({
        role: 'user',
        content: prompt,
      });

      const groqTools = this.mapToolsToGroq(tools);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: groqTools,
        tool_choice: groqTools ? 'auto' : undefined,
        temperature: 0.2,
        top_p: 0.95,
        max_completion_tokens: 16384,
      });

      return this.parseResponse(completion);
    }, this.retryConfig());
  }

  /**
   * Multi-message generation with tool history support
   */
  async generateFromHistory(
    messages: GeminiMessage[],
    systemInstruction?: string,
    tools?: Tool[]
  ): Promise<GeminiResponse> {
    if (messages.length === 0) {
      throw new Error('Messages array cannot be empty');
    }

    return retry(async () => {
      const groqMessages: any[] = [];

      if (systemInstruction) {
        groqMessages.push({
          role: 'system',
          content: systemInstruction,
        });
      }

      // Map internal message format to Groq format
      groqMessages.push(
        ...messages.map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'tool',
              tool_call_id: m.toolCallId,
              content: m.content,
            };
          }
          if (m.role === 'model') {
            return {
              role: 'assistant',
              content: m.content,
              tool_calls: m.toolCalls
                ? m.toolCalls.map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
                  }))
                : undefined,
            };
          }
          return { role: 'user', content: m.content };
        })
      );

      const groqTools = this.mapToolsToGroq(tools);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: groqMessages,
        tools: groqTools,
        tool_choice: groqTools ? 'auto' : undefined,
        temperature: 0.2,
        top_p: 0.95,
        max_completion_tokens: 16384,
      });

      return this.parseResponse(completion);
    }, this.retryConfig());
  }

  private mapToolsToGroq(tools?: Tool[]): any[] | undefined {
    if (!tools || tools.length === 0) return undefined;

    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  private parseResponse(completion: any): GeminiResponse {
    const choice = completion.choices[0];
    const message = choice?.message;

    let toolCalls: ToolCall[] | undefined;

    if (message?.tool_calls) {
      toolCalls = message.tool_calls
        .map((tc: any) => {
          try {
            return {
              id: tc.id,
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments),
            };
          } catch (e) {
            this.logger.error('Failed to parse tool arguments', {
              error: e,
              args: tc.function.arguments,
            });
            return null;
          }
        })
        .filter(Boolean);
    }

    return {
      text: message?.content ?? '',
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };
  }

  private retryConfig() {
    return {
      maxAttempts: 3,
      retryableErrors: (error: unknown) => {
        if (error instanceof Error) {
          const msg = error.message.toLowerCase();
          return (
            msg.includes('rate') ||
            msg.includes('quota') ||
            msg.includes('timeout') ||
            msg.includes('network')
          );
        }
        return false;
      },
    };
  }
}

// Singleton
let instance: GeminiClient | null = null;
export function getGeminiClient(): GeminiClient {
  if (!instance) instance = new GeminiClient();
  return instance;
}
