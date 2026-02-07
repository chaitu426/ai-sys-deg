import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useDesignStore } from '../stores/design.store';
import { useAgentStore } from '../stores/agent.store';
import { AgentType } from '../types/agent';

export const useDesign = (workspaceId: string) => {
  const router = useRouter();
  const { token } = useAuthStore();
  const { setProjectId } = useDesignStore();
  const { reset: resetAgents } = useAgentStore();

  const createDesign = useCallback(
    async (prompt: string) => {
      if (!token) throw new Error('Not authenticated');

      try {
        const data = await api.post<{ success: true; projectId: string; designVersionId: string }>(
          '/api/design',
          { prompt },
          token
        );

        // If we get a new projectId, we might need to redirect or update state
        // Currently we assume workspaceId IS the projectId
        if (data.projectId !== workspaceId) {
          console.log('Redirecting to real project ID', data.projectId);
          router.push(`/dashboard/${data.projectId}`);
          return data;
        }

        // Reset agent states for new run
        resetAgents();

        return data;
      } catch (error) {
        console.error('Failed to create design:', error);
        throw error;
      }
    },
    [token, workspaceId, resetAgents, router]
  );

  const updateDesign = useCallback(
    async (change: string, agentType?: AgentType) => {
      if (!token) throw new Error('Not authenticated');

      try {
        const data = await api.put<{ success: true; projectId: string; designVersionId: string }>(
          `/api/design/${workspaceId}`,
          { change, agentType },
          token
        );
        return data;
      } catch (error) {
        console.error('Failed to update design:', error);
        throw error;
      }
    },
    [token, workspaceId]
  );

  const submitAnswers = useCallback(
    async (answers: { question: string; answer: string }[]) => {
      if (!token) throw new Error('Not authenticated');

      try {
        const data = await api.post<{ success: true }>(
          `/api/design/${workspaceId}/answer`,
          { answers },
          token
        );
        return data;
      } catch (error) {
        console.error('Failed to submit answers:', error);
        throw error;
      }
    },
    [token, workspaceId]
  );

  const approveRequirements = useCallback(
    async (approvedRequirements: any) => {
      if (!token) throw new Error('Not authenticated');

      try {
        const data = await api.post<{ success: true }>(
          `/api/design/${workspaceId}/approve`,
          { approvedRequirements },
          token
        );
        return data;
      } catch (error) {
        console.error('Failed to approve requirements:', error);
        throw error;
      }
    },
    [token, workspaceId]
  );

  const pauseWorkflow = useCallback(async () => {
    if (!token) throw new Error('Not authenticated');
    try {
      return await api.post<{ success: true }>(`/api/design/${workspaceId}/pause`, {}, token);
    } catch (error) {
      console.error('Failed to pause workflow:', error);
      throw error;
    }
  }, [token, workspaceId]);

  const resumeWorkflow = useCallback(async () => {
    if (!token) throw new Error('Not authenticated');
    try {
      return await api.post<{ success: true }>(`/api/design/${workspaceId}/resume`, {}, token);
    } catch (error) {
      console.error('Failed to resume workflow:', error);
      throw error;
    }
  }, [token, workspaceId]);

  const retryAgent = useCallback(
    async (agentType: AgentType) => {
      if (!token) throw new Error('Not authenticated');
      try {
        return await api.post<{ success: true }>(
          `/api/design/${workspaceId}/retry/${agentType}`,
          {},
          token
        );
      } catch (error) {
        console.error('Failed to retry agent:', error);
        throw error;
      }
    },
    [token, workspaceId]
  );

  return {
    createDesign,
    updateDesign,
    submitAnswers,
    approveRequirements,
    pauseWorkflow,
    resumeWorkflow,
    retryAgent,
  };
};
