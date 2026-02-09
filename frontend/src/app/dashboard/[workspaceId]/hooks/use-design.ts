import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useDesignStore } from '../stores/design.store';
import { useAgentStore } from '../stores/agent.store';
import { AgentType } from '../types/agent';
import { toast } from 'sonner';

export const useDesign = (workspaceId: string) => {
  const router = useRouter();
  const { token } = useAuthStore();
  const { setProjectId } = useDesignStore();
  const { reset: resetAgents } = useAgentStore();

  const createDesign = useCallback(
    async (prompt: string, githubRepoFullName?: string) => {
      if (!token) throw new Error('Not authenticated');

      const toastId = toast.loading('Architecting your system...');
      try {
        const data = await api.post<{ success: true; projectId: string; designVersionId: string }>(
          '/api/design',
          { prompt, githubRepoFullName },
          token
        );

        toast.success('Architecture pipeline initialized', { id: toastId });

        if (data.projectId !== workspaceId) {
          router.push(`/dashboard/${data.projectId}`);
          return data;
        }

        resetAgents();
        return data;
      } catch (error) {
        toast.error('Failed to initialize architecture', { id: toastId });
        throw error;
      }
    },
    [token, workspaceId, resetAgents, router]
  );

  const updateDesign = useCallback(
    async (change: string, agentType?: AgentType) => {
      if (!token) throw new Error('Not authenticated');

      const toastId = toast.loading(
        agentType === 'requirement_analyzer'
          ? 'Incorporating feedback into requirements...'
          : 'Updating architectural strategy...'
      );
      try {
        const data = await api.put<{ success: true; projectId: string; designVersionId: string }>(
          `/api/design/${workspaceId}`,
          { change, agentType },
          token
        );
        toast.success(
          agentType === 'requirement_analyzer'
            ? 'Feedback incorporated successfully'
            : 'System strategy updated',
          { id: toastId }
        );
        return data;
      } catch (error) {
        toast.error('Failed to update system strategy', { id: toastId });
        throw error;
      }
    },
    [token, workspaceId]
  );

  const submitAnswers = useCallback(
    async (answers: { question: string; answer: string }[]) => {
      if (!token) throw new Error('Not authenticated');

      const toastId = toast.loading('Processing answers and refining context...');
      try {
        const data = await api.post<{ success: true }>(
          `/api/design/${workspaceId}/answer`,
          { answers },
          token
        );
        toast.success('Context refined successfully', { id: toastId });
        return data;
      } catch (error) {
        toast.error('Failed to submit answers', { id: toastId });
        throw error;
      }
    },
    [token, workspaceId]
  );

  const approveRequirements = useCallback(
    async (approvedRequirements: any) => {
      if (!token) throw new Error('Not authenticated');

      const toastId = toast.loading('Formalizing requirements...');
      try {
        const data = await api.post<{ success: true }>(
          `/api/design/${workspaceId}/approve`,
          { approvedRequirements },
          token
        );
        toast.success('Requirements confirmed. Architecture pipeline resuming.', { id: toastId });
        return data;
      } catch (error) {
        toast.error('Failed to approve requirements', { id: toastId });
        throw error;
      }
    },
    [token, workspaceId]
  );

  const pauseWorkflow = useCallback(async () => {
    if (!token) throw new Error('Not authenticated');
    const toastId = toast.loading('Pausing architecture pipeline...');
    try {
      const res = await api.post<{ success: true }>(`/api/design/${workspaceId}/pause`, {}, token);
      toast.success('Pipeline paused', { id: toastId });
      return res;
    } catch (error) {
      toast.error('Failed to pause pipeline', { id: toastId });
      throw error;
    }
  }, [token, workspaceId]);

  const resumeWorkflow = useCallback(async () => {
    if (!token) throw new Error('Not authenticated');
    const toastId = toast.loading('Resuming architecture pipeline...');
    try {
      const res = await api.post<{ success: true }>(`/api/design/${workspaceId}/resume`, {}, token);
      toast.success('Pipeline resumed', { id: toastId });
      return res;
    } catch (error) {
      toast.error('Failed to resume pipeline', { id: toastId });
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

  const saveWhiteboard = useCallback(
    async (type: string, data: any) => {
      if (!token) return;
      try {
        return await api.post<{ success: true }>(
          `/api/whiteboard/${workspaceId}`,
          { type, data },
          token
        );
      } catch (error) {
        console.error('Failed to save whiteboard:', error);
      }
    },
    [token, workspaceId]
  );

  const getWhiteboards = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await api.get<{ success: true; whiteboards: any[] }>(
        `/api/whiteboard/${workspaceId}`,
        token
      );
      if (resp.success) {
        return resp.whiteboards;
      }
    } catch (error) {
      console.error('Failed to fetch whiteboards:', error);
    }
  }, [token, workspaceId]);

  return {
    createDesign,
    updateDesign,
    submitAnswers,
    approveRequirements,
    pauseWorkflow,
    resumeWorkflow,
    retryAgent,
    saveWhiteboard,
    getWhiteboards,
  };
};
