// Imports removed

import { AgentType, AgentStatus } from './agent';
import { DesignVersion } from './design';

export interface Progress {
  total: number;
  completed: number;
  percentage: number;
}

export interface InitialStateEvent {
  projectId: string;
  designVersionId: string;
  status: string;
  progress: Progress;
  agentOutputs: { agentType: AgentType; status: AgentStatus; completedAt?: string }[];
}

export interface AgentStartedEvent {
  agentType: AgentType;
  timestamp: string;
}

export interface AgentCompletedEvent {
  agentType: AgentType;
  output: any;
  progress: Progress;
  timestamp: string;
}

export interface AgentFailedEvent {
  agentType: AgentType;
  error: string;
  timestamp: string;
}

export interface ToolExecutionEvent {
  agentType: AgentType;
  toolName: string;
  status: 'started' | 'completed' | 'failed';
  input?: any;
  output?: any;
  error?: string;
  timestamp: string;
}

export interface WorkflowCompletedEvent {
  status: 'completed' | 'failed';
  timestamp: string;
}

// Union of all possible SSE data payloads
export type SSEEventData =
  | InitialStateEvent
  | AgentStartedEvent
  | AgentCompletedEvent
  | AgentFailedEvent
  | ToolExecutionEvent
  | WorkflowCompletedEvent;

