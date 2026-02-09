/**
 * Production-Grade Tool Runner
 * Implements the agentic tool execution loop:
 * 1. Send prompt + tools to LLM
 * 2. If LLM requests tool calls → execute them
 * 3. Feed tool results back to LLM
 * 4. Repeat until LLM returns final answer (no more tool calls)
 */

import { AgentContext } from '../core/contracts';
import { getGeminiClient, GeminiMessage, ToolCall } from '../llm/gemini-client';
import { getLogger } from '../utils/logger';
import { toolRegistry } from '../tools/registry';
import { Tool } from '../tools/core/tool';
import { toolAuditService } from '../tools/tool-audit';
import { designEvents } from '../utils/event-emitter';

const logger = getLogger();

// Configuration
const MAX_TOOL_ITERATIONS = 3; // Prevent infinite loops
const TOOL_EXECUTION_TIMEOUT_MS = 30000; // 30 seconds per tool

/**
 * Tool execution result for audit logging
 */
interface ToolExecutionResult {
  toolName: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Run agent with tools and proper execution loop
 * @param context Agent execution context
 * @param systemInstruction System prompt for the agent
 * @param parser Function to parse and validate LLM output
 * @returns Parsed agent output
 */
export async function runAgentWithTools<T>(
  context: AgentContext,
  systemInstruction: string,
  parser: (text: string) => T
): Promise<T> {
  const gemini = getGeminiClient();

  // Resolve allowed tools from strings to Tool objects
  const tools = (context.allowedTools || [])
    .map((name) => toolRegistry.getTool(name))
    .filter((t): t is Tool => !!t);

  // Log tool availability
  if (tools.length > 0) {
    logger.info('Agent tools available', {
      agentType: context.agentType,
      designVersionId: context.designVersionId,
      tools: tools.map((t) => t.name),
    });
  }

  // Build initial message history
  let contextContent = `---\nUser Prompt:\n${context.prompt}`;

  // Add context from previous agents if available
  if (context.previousOutputs && Object.keys(context.previousOutputs).length > 0) {
    let previousOutputsStr = JSON.stringify(context.previousOutputs, null, 2);

    // Context Safety: Trim if it's too large for models with small windows (e.g. Groq 8k models)
    // 30,000 chars is roughly 7,500 tokens. 
    if (previousOutputsStr.length > 30000) {
      logger.warn('Previous outputs too large, trimming for performance', {
        designVersionId: context.designVersionId,
        originalLength: previousOutputsStr.length
      });
      // Simple strategy: take the last 30k characters, or we could be smarter and 
      // focus on critical agents like RequirementAnalyzer/SystemDesign.
      previousOutputsStr = previousOutputsStr.substring(0, 30000) + '\n... (truncated for context limit)';
    }

    contextContent += `\n\n---\nPrevious Analysis Results:\n${previousOutputsStr}`;
  }

  const messages: GeminiMessage[] = [
    {
      role: 'user',
      content: contextContent,
    },
  ];

  // Track all tool executions for audit
  const toolExecutions: ToolExecutionResult[] = [];

  // Agentic loop - keep going until LLM stops requesting tools
  let iteration = 0;
  let finalResponse: string | null = null;

  // Track executed tools to prevent loops (hash of name + args)
  const executedTools = new Set<string>();

  while (iteration < MAX_TOOL_ITERATIONS) {
    iteration++;

    logger.debug('Tool loop iteration', {
      iteration,
      agentType: context.agentType,
      messageCount: messages.length,
    });

    // Call LLM with current message history
    const response = await gemini.generateFromHistory(messages, systemInstruction, tools);

    // Check if LLM is done (no tool calls, has text response)
    if (!response.toolCalls || response.toolCalls.length === 0) {
      finalResponse = response.text;
      logger.info('Agent completed without more tool calls', {
        agentType: context.agentType,
        iterations: iteration,
        totalToolExecutions: toolExecutions.length,
      });
      break;
    }

    // LLM requested tool calls - execute them
    logger.info('LLM requested tool calls', {
      agentType: context.agentType,
      iteration,
      toolCalls: response.toolCalls.map((tc) => tc.name),
    });

    // Add assistant message with tool calls to history
    messages.push({
      role: 'model',
      content: response.text || '',
      toolCalls: response.toolCalls,
    });

    // Execute each tool call
    for (const toolCall of response.toolCalls) {
      // 1. DUPLICATE DETECTION
      const callSignature = `${toolCall.name}:${JSON.stringify(toolCall.arguments)}`;
      if (executedTools.has(callSignature)) {
        logger.warn('Duplicate tool call detected, intercepting', {
          agentType: context.agentType,
          toolName: toolCall.name,
        });

        const duplicateError = `Tool Check: You have ALREADY executed '${toolCall.name}' with these exact arguments. Do not do it again. Proceed with the information you have.`;

        messages.push({
          role: 'tool',
          toolCallId: toolCall.id,
          content: JSON.stringify({ error: duplicateError }),
        });
        continue; // Skip actual execution
      }

      executedTools.add(callSignature);

      // 2. EXECUTION
      const executionResult = await executeToolCall(toolCall, tools, context);
      toolExecutions.push(executionResult);

      // Add tool result to message history
      messages.push({
        role: 'tool',
        toolCallId: toolCall.id,
        content: JSON.stringify(executionResult.output),
      });
    }
  }

  // 3. FORCE FINAL ANSWER
  // If we hit the limit and still have no final response, force the LLM to wrap up.
  if (iteration >= MAX_TOOL_ITERATIONS && !finalResponse) {
    logger.warn('Agent hit max tool iterations, forcing final answer', {
      agentType: context.agentType,
      iterations: iteration,
    });

    messages.push({
      role: 'user',
      content: `SYSTEM ALERT: You have reached the maximum number of tool executions (${MAX_TOOL_ITERATIONS}). You MUST STOP calling tools now. 
      
      Based on the information you have already gathered, provide your BEST COMPLETE FINAL ANSWER in valid JSON format directly. 
      Do not complain. Do not ask for more tools. Just output the JSON.`,
    });

    // One last generation attempt, WITHOUT tools (forces text only)
    try {
      const finalTry = await gemini.generateFromHistory(messages, systemInstruction, []); // No tools passed
      finalResponse = finalTry.text;
    } catch (error) {
      logger.error('Failed to force final response', { error });
      // Fallback to last model message if even this fails
      const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'model');
      finalResponse = lastAssistantMsg?.content || '';
    }
  }

  // Log tool execution summary
  if (toolExecutions.length > 0) {
    logger.info('Tool execution summary', {
      agentType: context.agentType,
      designVersionId: context.designVersionId,
      totalExecutions: toolExecutions.length,
      successfulExecutions: toolExecutions.filter((t) => t.success).length,
      failedExecutions: toolExecutions.filter((t) => !t.success).length,
      tools: toolExecutions.map((t) => ({
        name: t.toolName,
        success: t.success,
        durationMs: t.durationMs,
      })),
    });
  }

  // Parse final response
  return parseAgentResponse(finalResponse || '', context, parser);
}

/**
 * Execute a single tool call with timeout and error handling
 */
async function executeToolCall(
  toolCall: ToolCall,
  availableTools: Tool[],
  context: AgentContext
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const tool = availableTools.find((t) => t.name === toolCall.name);

  if (!tool) {
    logger.error('Tool not found for execution', { toolName: toolCall.name });
    return {
      toolName: toolCall.name,
      input: toolCall.arguments,
      output: { error: `Tool '${toolCall.name}' not found` },
      durationMs: Date.now() - startTime,
      success: false,
      error: `Tool '${toolCall.name}' not found`,
    };
  }

  try {
    logger.info('Executing tool', {
      toolName: tool.name,
      input: toolCall.arguments,
    });

    // Emit tool started event
    await designEvents.emitToolExecution({
      projectId: context.projectId,
      designVersionId: context.designVersionId,
      agentType: context.agentType,
      toolName: tool.name,
      status: 'started',
      input: toolCall.arguments,
      timestamp: new Date().toISOString(),
    });

    // Execute with timeout
    const result = await Promise.race([
      tool.execute(toolCall.arguments, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), TOOL_EXECUTION_TIMEOUT_MS)
      ),
    ]);

    const durationMs = Date.now() - startTime;

    logger.info('Tool execution completed', {
      toolName: tool.name,
      durationMs,
      outputPreview: JSON.stringify(result).substring(0, 200),
    });

    // Emit tool completed event
    await designEvents.emitToolExecution({
      projectId: context.projectId,
      designVersionId: context.designVersionId,
      agentType: context.agentType,
      toolName: tool.name,
      status: 'completed',
      input: toolCall.arguments,
      output: result,
      timestamp: new Date().toISOString(),
    });

    // Log to audit service
    await toolAuditService.logExecution({
      designVersionId: context.designVersionId,
      agentType: context.agentType,
      toolName: tool.name,
      input: toolCall.arguments,
      output: result,
      durationMs,
      success: true,
    });

    return {
      toolName: tool.name,
      input: toolCall.arguments,
      output: result,
      durationMs,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startTime;

    logger.error('Tool execution failed', {
      toolName: tool.name,
      error: errorMessage,
      durationMs,
    });

    // Emit tool failed event
    await designEvents.emitToolExecution({
      projectId: context.projectId,
      designVersionId: context.designVersionId,
      agentType: context.agentType,
      toolName: tool.name,
      status: 'failed',
      input: toolCall.arguments,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    // Log failure to audit service
    await toolAuditService.logExecution({
      designVersionId: context.designVersionId,
      agentType: context.agentType,
      toolName: tool.name,
      input: toolCall.arguments,
      output: { error: errorMessage },
      durationMs,
      success: false,
      error: errorMessage,
    });

    return {
      toolName: tool.name,
      input: toolCall.arguments,
      output: { error: errorMessage },
      durationMs,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Parse agent response with fallback JSON extraction
 */
function parseAgentResponse<T>(
  responseText: string,
  context: AgentContext,
  parser: (text: string) => T
): T {
  // Try direct parsing first
  try {
    return parser(responseText);
  } catch (parseError: any) {
    logger.warn('Initial parse failed, trying fallback extraction', {
      agentType: context.agentType,
      error: parseError.message,
    });
  }

  // Fallback: extract JSON from markdown code blocks
  try {
    let jsonText = responseText.trim();

    // Remove markdown code blocks
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    } else if (jsonText.includes('```')) {
      const match = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (match) jsonText = match[1];
    }

    const parsed = parser(jsonText.trim());
    logger.info('Recovered from parse error using fallback', {
      agentType: context.agentType,
    });
    return parsed;
  } catch (fallbackError: any) {
    // Last resort: try to find any JSON object in the response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = parser(jsonMatch[0]);
        logger.warn('Recovered using raw JSON extraction', {
          agentType: context.agentType,
        });
        return parsed;
      }
    } catch (e) {
      // Continue to error
    }

    throw new Error(
      `Agent ${context.agentType} returned invalid JSON. ` +
      `Response preview: ${responseText.substring(0, 300)}...`
    );
  }
}

/**
 * Get tool execution metrics for monitoring
 */
export function getToolMetrics() {
  return {
    maxIterations: MAX_TOOL_ITERATIONS,
    timeoutMs: TOOL_EXECUTION_TIMEOUT_MS,
  };
}
