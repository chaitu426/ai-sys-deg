import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useDesignStore } from '../stores/design.store';
import { useAgentStore } from '../stores/agent.store';
import { useSSEStore } from '../stores/sse.store';
import {
  InitialStateEvent,
  AgentStartedEvent,
  AgentCompletedEvent,
  AgentFailedEvent,
  ToolExecutionEvent,
  WorkflowCompletedEvent,
} from '../types/events';

export const useDesignSSE = (projectId: string) => {
  const { token } = useAuthStore();
  const { setActiveVersion, updateArtifact } = useDesignStore();
  const { setAgentStatus, setProgress, setAllStatuses, setActiveTool } = useAgentStore();
  const { setConnected, setError } = useSSEStore();

  const handleInitialState = useCallback(
    (data: InitialStateEvent) => {
      // Update design store with initial state
      setProgress(data.progress);

      // Convert array of agent outputs to status map
      const statusMap: Record<string, string> = {};
      data.agentOutputs.forEach((agent) => {
        statusMap[agent.agentType] = agent.status;
      });
      setAllStatuses(statusMap);

      // Synchronize paused state
      const { setIsPaused } = useAgentStore.getState();
      setIsPaused(data.status === 'paused');
    },
    [setProgress, setAllStatuses]
  );

  const handleAgentStarted = useCallback(
    (data: AgentStartedEvent) => {
      const { resetFrom } = useAgentStore.getState();
      resetFrom(data.agentType);
      setAgentStatus(data.agentType, 'processing');
    },
    [setAgentStatus]
  );

  const handleAgentCompleted = useCallback(
    (data: AgentCompletedEvent) => {
      setAgentStatus(data.agentType, 'completed');
      setProgress(data.progress);

      // If agent provides output, update the artifact in design store
      if (data.output) {
        // Map agent type to artifact key
        switch (data.agentType) {
          case 'requirement_analyzer':
            updateArtifact('requirements', data.output);
            break;
          case 'system_design':
            updateArtifact('systemDesign', data.output);
            break;
          case 'tech_stack':
            updateArtifact('techStack', data.output);
            break;
          case 'diagram_generator':
            updateArtifact('diagrams', data.output);
            break;
          case 'api_design':
            updateArtifact('apiDesign', data.output);
            break;
          case 'cost_estimation':
            updateArtifact('costEstimation', data.output);
            break;
          case 'deployment_strategy':
            updateArtifact('deploymentStrategy', data.output);
            break;
          case 'failure_mode_analyzer':
            updateArtifact('failureModeAnalysis', data.output);
            break;
        }
      }
    },
    [setAgentStatus, setProgress, updateArtifact]
  );

  const handleAgentFailed = useCallback(
    (data: AgentFailedEvent) => {
      setAgentStatus(data.agentType, 'failed');
    },
    [setAgentStatus]
  );

  useEffect(() => {
    if (!projectId || !token) return;

    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 1000;

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${BASE_URL}/api/design/${projectId}/events?token=${token}`;

    const connect = () => {
      try {
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
          setConnected(true);
          setError(null);
          reconnectAttempts = 0; // Reset on successful connection
          console.log('SSE Connected');
        };

        eventSource.onerror = (err) => {
          console.error('SSE Error:', err);
          setConnected(false);
          eventSource?.close();

          // Attempt reconnection with exponential backoff
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
            reconnectAttempts++;
            setError(`Reconnecting in ${delay / 1000}s...`);
            console.log(`SSE reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            setError('Connection lost. Please refresh the page.');
          }
        };

        eventSource.addEventListener('initial_state', (e) => {
          const data = JSON.parse(e.data);
          handleInitialState(data);
        });

        eventSource.addEventListener('agent_started', (e) => {
          const data = JSON.parse(e.data);
          handleAgentStarted(data);
        });

        eventSource.addEventListener('agent_completed', (e) => {
          const data = JSON.parse(e.data);
          handleAgentCompleted(data);
        });

        eventSource.addEventListener('agent_failed', (e) => {
          const data = JSON.parse(e.data);
          handleAgentFailed(data);
        });

        eventSource.addEventListener('tool_execution', (e) => {
          const data = JSON.parse(e.data) as ToolExecutionEvent;
          setActiveTool({
            toolName: data.toolName,
            status: data.status,
            agentType: data.agentType
          });

          // Clear active tool after a delay if completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            setTimeout(() => setActiveTool(null), 2500);
          }
        });

        eventSource.addEventListener('workflow_completed', (e) => {
          console.log('Workflow completed');
        });
      } catch (error) {
        console.error('Failed to create EventSource:', error);
        setError('Failed to connect');
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
        setConnected(false);
      }
    };
  }, [
    projectId,
    token,
    handleInitialState,
    handleAgentStarted,
    handleAgentCompleted,
    handleAgentFailed,
    setConnected,
    setError,
    setActiveTool,
  ]);
};
