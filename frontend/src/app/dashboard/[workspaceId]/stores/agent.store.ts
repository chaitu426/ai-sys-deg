import { create } from 'zustand';
import { AgentType, AgentStatus, ORDERED_AGENTS, AGENT_DISPLAY_NAMES } from '../types/agent';
import { Progress } from '../types/events';

export interface AgentLog {
  id: string;
  message: string;
  type: 'info' | 'tool' | 'error' | 'success';
  timestamp: string;
}

interface AgentState {
  agentStatuses: Record<AgentType, AgentStatus>;
  currentAgent: AgentType | null;
  progress: Progress;
  isPaused: boolean;
  activeTool: {
    toolName: string;
    status: 'started' | 'completed' | 'failed';
    agentType: AgentType;
  } | null;
  logs: AgentLog[];

  // Actions
  setAgentStatus: (agent: AgentType, status: AgentStatus) => void;
  setAllStatuses: (statuses: Partial<Record<AgentType, AgentStatus>>) => void;
  setProgress: (progress: Progress) => void;
  setIsPaused: (paused: boolean) => void;
  setActiveTool: (tool: { toolName: string; status: 'started' | 'completed' | 'failed'; agentType: AgentType } | null) => void;
  addLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void;
  resetFrom: (agent: AgentType) => void;
  reset: () => void;
}

const INITIAL_STATUSES = ORDERED_AGENTS.reduce(
  (acc, agent) => {
    acc[agent] = 'pending';
    return acc;
  },
  {} as Record<AgentType, AgentStatus>
);

export const useAgentStore = create<AgentState>((set) => ({
  agentStatuses: { ...INITIAL_STATUSES },
  currentAgent: null,
  progress: { total: ORDERED_AGENTS.length, completed: 0, percentage: 0 },
  isPaused: false,
  activeTool: null,
  logs: [],

  setAgentStatus: (agent, status) =>
    set((state) => {
      const newLogs = [...state.logs];
      const timestamp = new Date().toLocaleTimeString();

      if (status === 'processing') {
        newLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          message: `Initializing ${AGENT_DISPLAY_NAMES[agent]}...`,
          type: 'info',
          timestamp,
        });
      } else if (status === 'completed') {
        newLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          message: `${AGENT_DISPLAY_NAMES[agent]} successfully synchronized.`,
          type: 'success',
          timestamp,
        });
      } else if (status === 'failed') {
        newLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          message: `CRITICAL FAILURE: ${AGENT_DISPLAY_NAMES[agent]} execution interrupted.`,
          type: 'error',
          timestamp,
        });
      }

      return {
        agentStatuses: { ...state.agentStatuses, [agent]: status },
        currentAgent: status === 'processing' ? agent : state.currentAgent,
        logs: newLogs,
      };
    }),

  setAllStatuses: (statuses) =>
    set((state) => ({
      agentStatuses: { ...state.agentStatuses, ...statuses },
    })),

  setProgress: (progress) => set({ progress }),

  setIsPaused: (paused) => set({ isPaused: paused }),

  setActiveTool: (tool) =>
    set((state) => {
      const newLogs = [...state.logs];
      if (tool) {
        const timestamp = new Date().toLocaleTimeString();
        if (tool.status === 'started') {
          newLogs.push({
            id: Math.random().toString(36).substr(2, 9),
            message: `Invoking system tool: [${tool.toolName}]`,
            type: 'tool',
            timestamp,
          });
        } else if (tool.status === 'completed') {
          newLogs.push({
            id: Math.random().toString(36).substr(2, 9),
            message: `Tool [${tool.toolName}] returned valid data.`,
            type: 'success',
            timestamp,
          });
        }
      }
      return { activeTool: tool, logs: newLogs };
    }),

  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...log,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    })),

  resetFrom: (agent) =>
    set((state) => {
      const startIndex = ORDERED_AGENTS.indexOf(agent);
      if (startIndex === -1) return state;

      const updatedStatuses = { ...state.agentStatuses };
      for (let i = startIndex; i < ORDERED_AGENTS.length; i++) {
        updatedStatuses[ORDERED_AGENTS[i]] = 'pending';
      }

      return {
        agentStatuses: updatedStatuses,
        currentAgent: state.currentAgent === agent ? null : state.currentAgent,
        activeTool: null,
        logs: [], // Reset logs on retry/reset
      };
    }),

  reset: () =>
    set({
      agentStatuses: { ...INITIAL_STATUSES },
      currentAgent: null,
      progress: { total: ORDERED_AGENTS.length, completed: 0, percentage: 0 },
      isPaused: false,
      activeTool: null,
      logs: [],
    }),
}));
