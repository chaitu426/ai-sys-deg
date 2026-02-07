'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      if (!token) {
        // Should be handled by layout/middleware, but safe check
        return;
      }

      try {
        // 1. Fetch user projects
        const data = await api.get<{ success: boolean; projects: Project[] }>(
          '/api/projects',
          token
        );

        if (data.success && data.projects.length > 0) {
          // 2. Redirect to the most recently updated project
          const sorted = data.projects.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          router.replace(`/dashboard/${sorted[0].id}`);
        } else {
          // 3. No projects? Create a new one or show onboarding.
          // For now, we generate a client-side ID for a "New Workspace"
          // which will become a real project when they submit a prompt.
          // Using a distinct "new" keyword or random ID is fine, but
          // using "new" allows us to show a clean state explicitly.
          const tempId = crypto.randomUUID();
          router.replace(`/dashboard/${tempId}?new=true`);
        }
      } catch (error) {
        console.error('Failed to init dashboard:', error);
        toast.error('Failed to load projects');
        // Fallback to a new workspace so they aren't stuck
        const tempId = crypto.randomUUID();
        router.replace(`/dashboard/${tempId}?new=true`);
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [router, token]);

  return (
    <div className="bg-background flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <p className="text-muted-foreground animate-pulse text-sm">Loading workspace...</p>
    </div>
  );
}
