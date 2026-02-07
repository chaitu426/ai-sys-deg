import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';

export interface VibePrompt {
  step: number;
  title: string;
  description: string;
  promptContent: string;
}

export function useVibePrompts(workspaceId: string, shouldFetch: boolean) {
  const { token } = useAuthStore();
  const [prompts, setPrompts] = useState<VibePrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId || !token || !shouldFetch) return;

    const fetchPrompts = async () => {
      setIsLoading(true);
      setError(null);
      setIsPremiumLocked(false);
      try {
        const data = await api.get<{ success: true; prompts: VibePrompt[]; error?: string }>(
          `/api/design/${workspaceId}/prompts`,
          token
        );
        if (data.success) {
          setPrompts(data.prompts);
        } else {
          setError(data.error || 'Failed to fetch prompts');
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          setIsPremiumLocked(true);
        } else {
          setError(err.message || 'Failed to fetch prompts');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [workspaceId, token, shouldFetch]);

  return { prompts, isLoading, isPremiumLocked, error };
}
