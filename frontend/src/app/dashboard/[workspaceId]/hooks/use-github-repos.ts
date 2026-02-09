import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';

export interface GitHubRepo {
    id: number;
    name: string;
    fullName: string;
    description: string;
    private: boolean;
    url: string;
}

export function useGitHubRepos() {
    const { user, token } = useAuthStore();
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRepos = async () => {
        if (!token || !user?.githubId) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await api.get<{ success: boolean; repos: GitHubRepo[] }>('/api/github/repos', token);
            if (data.success) {
                setRepos(data.repos);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
            console.error('Error fetching repos:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.githubId) {
            fetchRepos();
        }
    }, [user?.githubId, token]);

    return { repos, isLoading, error, refetch: fetchRepos };
}
