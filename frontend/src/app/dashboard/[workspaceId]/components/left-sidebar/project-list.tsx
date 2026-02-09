'use client';

import { useEffect, useState } from 'react';
import { Search, LogOut, Plus, FolderGit2, Loader2 } from 'lucide-react';
import { useDesignStore } from '../../stores/design.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ProjectSummary } from '../../types/design';
import { UsageIndicator } from '@/components/subscription';
import { PLAN_LIMITS, Plan } from '@/lib/plans';

export function ProjectList() {
  const { projectId, projects, setProjects } = useDesignStore();
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(projects.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  // Get user plan and limits
  const userPlan = ((user as any)?.plan as Plan) || Plan.FREE;
  const userPlanLimits = PLAN_LIMITS[userPlan] || PLAN_LIMITS[Plan.FREE];

  useEffect(() => {
    if (!token) return;

    // If we already have projects, don't show loading state
    if (projects.length > 0) {
      setLoading(false);
    }

    const fetchProjects = async () => {
      try {
        const data = await api.get<{ projects: ProjectSummary[] }>('/api/projects', token);
        if (data && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      } catch (e) {
        console.error('Failed to fetch projects', e);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have projects or if we want to ensure freshness (e.g. background revalidation could be added here)
    // For now, to stop the "reload on click" feel, we trust the cache if it exists, but we can still fetch in background
    fetchProjects();
  }, [token, setProjects]); // removed projects dependency to avoid loops, though it shouldn't allow loops with setProjects

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNewProject = () => {
    if (projects.length >= userPlanLimits.maxProjects && userPlanLimits.maxProjects !== -1) {
      toast.error('Project limit reached', {
        description: 'Upgrade your plan to create more architectural designs.',
      });
      return;
    }
    const newId = crypto.randomUUID();
    router.push(`/dashboard/${newId}?new=true`);
    toast.success('New workspace initialized', {
      description: 'Describe your system to start the architecture pipeline.',
    });
  };

  const isLimitReached =
    userPlanLimits.maxProjects !== -1 && projects.length >= userPlanLimits.maxProjects;

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-sidebar/30 flex h-full flex-col font-sans">
      {/* User Section */}
      <div className="border-sidebar-border/50 border-b p-4">
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="group hover:bg-sidebar-accent/50 flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors"
        >
          <div className="relative">
            <div className="from-primary to-primary/60 text-primary-foreground shadow-primary/20 group-hover:ring-primary/20 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold shadow-lg ring-2 ring-transparent transition-all">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="bg-background absolute -right-1 -bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded-full">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">
              {user?.name || 'User'}
            </h3>
            <p className="text-muted-foreground truncate text-[11px]">
              {userPlanLimits.label} Plan
            </p>
          </div>
        </button>
      </div>

      {/* Search & Actions */}
      <div className="space-y-4 px-4 py-4">
        <button
          onClick={handleNewProject}
          disabled={isLimitReached}
          className={cn(
            'group relative flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold shadow-lg transition-all active:scale-95',
            isLimitReached
              ? 'bg-muted text-muted-foreground border-border/50 cursor-not-allowed border'
              : 'bg-foreground text-background shadow-foreground/5 hover:bg-foreground/90'
          )}
        >
          {!isLimitReached && (
            <div className="via-background/10 absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
          )}
          <Plus size={14} strokeWidth={3} />
          {isLimitReached ? 'LIMIT REACHED' : 'NEW PROJECT'}
        </button>

        <div className="group relative">
          <Search className="text-muted-foreground group-focus-within:text-foreground absolute top-2.5 left-3 h-3.5 w-3.5 transition-colors" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="bg-muted/20 text-foreground placeholder:text-muted-foreground/70 hover:border-border/50 focus:border-primary/50 focus:bg-background w-full rounded-lg border border-transparent py-2 pr-4 pl-9 text-xs transition-all focus:outline-none"
          />
          <div className="border-border/50 bg-muted/30 text-muted-foreground absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded border text-[9px]">
            ⌘K
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 space-y-1 overflow-y-auto px-3">
        {/* Usage Indicator */}
        <div className="border-border/30 mb-2 border-b px-2 py-3">
          <UsageIndicator
            current={projects.length}
            max={userPlanLimits.maxProjectsPerMonth}
            label="projects this month"
          />
        </div>

        <div className="text-muted-foreground/60 flex items-center justify-between px-2 py-2 text-[10px] font-bold tracking-widest uppercase">
          <span>Your Projects</span>
          <span className="bg-muted text-foreground/70 min-w-[20px] rounded px-1.5 py-0.5 text-center">
            {filteredProjects.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="text-muted-foreground animate-spin" />
          </div>
        ) : (
          filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/dashboard/${p.id}`)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-xs transition-all',
                projectId === p.id
                  ? 'border-white/10 bg-white/10 text-white font-medium'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              {projectId === p.id && (
                <motion.div
                  layoutId="active-project-indicator"
                  className="bg-white absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                />
              )}

              <FolderGit2
                className={cn(
                  'h-4 w-4 transition-colors',
                  projectId === p.id
                    ? 'text-white'
                    : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                )}
              />

              <div className="min-w-0 flex-1 text-left">
                <span className="block truncate">{p.title || 'Untitled Project'}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-border/50 bg-background/30 mt-auto border-t p-3 backdrop-blur-sm">
        <button
          onClick={handleLogout}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
        >
          <LogOut size={14} />
          Log Out
        </button>
      </div>
    </div>
  );
}
