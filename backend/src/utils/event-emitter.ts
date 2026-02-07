/**
 * Event emitter for design workflow events
 * Uses Redis Pub/Sub for horizontal scalability
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { AgentType } from '../core/contracts';
import { getConfig } from './config';
import { getLogger } from './logger';

const logger = getLogger();

export interface DesignProgressEvent {
  projectId: string;
  designVersionId: string;
  agentType: AgentType;
  status: 'started' | 'completed' | 'failed';
  output?: any;
  error?: string;
  progress: {
    total: number;
    completed: number;
    percentage: number;
  };
  timestamp: string;
}

export interface ToolExecutionEvent {
  projectId: string;
  designVersionId: string;
  agentType: AgentType;
  toolName: string;
  status: 'started' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  timestamp: string;
}

export interface WorkflowCompletedEvent {
  projectId: string;
  designVersionId: string;
  status: 'completed' | 'failed';
  timestamp: string;
}

type EventPayload =
  | { type: 'agent_progress'; data: DesignProgressEvent }
  | { type: 'tool_execution'; data: ToolExecutionEvent }
  | { type: 'workflow_completed'; data: WorkflowCompletedEvent };

class DesignEventEmitter extends EventEmitter {
  private static instance: DesignEventEmitter;
  private pubClient: Redis;
  private subClient: Redis;
  private readonly CHANNEL = 'system-design-events';

  private constructor() {
    super();
    this.setMaxListeners(100);

    const config = getConfig();

    // Publisher client
    this.pubClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    // Subscriber client
    this.subClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    this.setupSubscriber();
  }

  private setupSubscriber() {
    this.subClient.subscribe(this.CHANNEL, (err) => {
      if (err) {
        logger.error('Failed to subscribe to Redis channel', err);
      } else {
        logger.info('Subscribed to system design events channel');
      }
    });

    this.subClient.on('message', (channel, message) => {
      if (channel !== this.CHANNEL) return;

      try {
        const payload = JSON.parse(message) as EventPayload;
        this.handleRemoteEvent(payload);
      } catch (error) {
        logger.error('Failed to parse Redis message', { error, message });
      }
    });
  }

  private handleRemoteEvent(payload: EventPayload) {
    // Re-emit events locally so SSE handlers can pick them up
    if (payload.type === 'agent_progress') {
      const event = payload.data;
      this.emit('agent_progress', event);
      this.emit(`project:${event.projectId}`, event);
    } else if (payload.type === 'tool_execution') {
      const event = payload.data;
      this.emit('tool_execution', event);
      this.emit(`project:${event.projectId}`, event);
    } else if (payload.type === 'workflow_completed') {
      const event = payload.data;
      this.emit('workflow_completed', event);
      this.emit(`project:${event.projectId}`, event);
    }
  }

  static getInstance(): DesignEventEmitter {
    if (!DesignEventEmitter.instance) {
      DesignEventEmitter.instance = new DesignEventEmitter();
    }
    return DesignEventEmitter.instance;
  }

  /**
   * Publish agent progress event
   */
  async emitAgentProgress(event: DesignProgressEvent): Promise<void> {
    // Publish to Redis instead of local emit
    const payload: EventPayload = { type: 'agent_progress', data: event };
    await this.pubClient.publish(this.CHANNEL, JSON.stringify(payload));
  }

  /**
   * Publish tool execution event
   */
  async emitToolExecution(event: ToolExecutionEvent): Promise<void> {
    const payload: EventPayload = { type: 'tool_execution', data: event };
    await this.pubClient.publish(this.CHANNEL, JSON.stringify(payload));
  }

  /**
   * Publish workflow completion event
   */
  async emitWorkflowCompleted(event: WorkflowCompletedEvent): Promise<void> {
    const payload: EventPayload = { type: 'workflow_completed', data: event };
    await this.pubClient.publish(this.CHANNEL, JSON.stringify(payload));
  }

  /**
   * Listen to agent progress events
   */
  onAgentProgress(callback: (event: DesignProgressEvent) => void): void {
    this.on('agent_progress', callback);
  }

  /**
   * Listen to workflow completion events
   */
  onWorkflowCompleted(callback: (event: WorkflowCompletedEvent) => void): void {
    this.on('workflow_completed', callback);
  }

  /**
   * Listen to events for a specific project
   */
  onProjectEvent(
    projectId: string,
    callback: (event: DesignProgressEvent | ToolExecutionEvent | WorkflowCompletedEvent) => void
  ): void {
    this.on(`project:${projectId}`, callback);
  }

  /**
   * Remove listener for a specific project
   */
  offProjectEvent(
    projectId: string,
    callback: (event: DesignProgressEvent | ToolExecutionEvent | WorkflowCompletedEvent) => void
  ): void {
    this.off(`project:${projectId}`, callback);
  }

  /**
   * Cleanup connections
   */
  async close(): Promise<void> {
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}

// Export singleton instance
export const designEvents = DesignEventEmitter.getInstance();
