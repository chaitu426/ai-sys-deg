'use client';

import { useDesignStore } from '../../stores/design.store';
import { History, GitCommit, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VersionHistory() {
  const { project, activeVersion, setActiveVersion } = useDesignStore();

  // Mock versions if not present (in a real app these come from project)
  // Assuming project store would eventually have a list of versions
  const versions = [
    { id: 'v1', version: 1, createdAt: new Date().toISOString() },
    // Add more mocks if needed or rely on store
  ];

  if (!project) return null;

  return (
    <div className="border-border/50 bg-sidebar/40 flex h-1/3 shrink-0 flex-col border-t">
      <div className="border-border/50 text-muted-foreground/70 bg-sidebar/50 flex items-center gap-2 border-b p-3 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
        <History className="h-3 w-3" />
        Version History
      </div>

      <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 space-y-1 overflow-y-auto p-2">
        {versions.map((v) => (
          <button
            key={v.id}
            className={cn(
              'flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-all',
              activeVersion?.id === v.id
                ? 'bg-primary/5 text-foreground border-primary/10 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            <div className="relative mt-0.5">
              <GitCommit
                className={cn(
                  'h-4 w-4',
                  activeVersion?.id === v.id ? 'text-primary' : 'text-muted-foreground/60'
                )}
              />
              {activeVersion?.id === v.id && (
                <div className="bg-primary/20 absolute inset-0 animate-pulse blur-[6px]" />
              )}
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className="text-xs font-medium">Version {v.version}</span>
              <span className="text-muted-foreground/60 truncate text-[10px]">
                {new Date(v.createdAt).toLocaleTimeString()} • Auto-generated
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border-border/50 bg-sidebar/50 border-t p-2">
        <button className="text-muted-foreground hover:text-primary flex w-full items-center justify-center gap-2 py-1.5 text-[10px] font-medium transition-colors">
          <GitBranch size={12} />
          <span>View all versions</span>
        </button>
      </div>
    </div>
  );
}
