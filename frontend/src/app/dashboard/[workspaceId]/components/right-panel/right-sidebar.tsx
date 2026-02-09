'use client';

import { useState } from 'react';
import { AgentControlPanel } from './agent-control-panel';
import { VibeCoderSection } from './vibe-coder-section';
import { PartialRestart } from './partial-restart';
import { ChevronDown, ChevronRight, CircuitBoard, Layers, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  workspaceId: string;
}

export function RightSidebar({ workspaceId }: RightSidebarProps) {
  const [pipelineOpen, setPipelineOpen] = useState(true);
  const [vibeOpen, setVibeOpen] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);

  return (
    <aside className="border-border bg-card/30 flex h-full flex-col border-l font-sans backdrop-blur-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 text-white">
            <CircuitBoard size={14} />
          </div>
          <h2 className="text-xs font-bold tracking-widest text-foreground uppercase">
            Orchestration
          </h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="divide-y divide-border/40">
          {/* Pipeline Section */}
          <section className="px-4 py-5">
            <SectionToggle
              label="Execution Stages"
              icon={<Layers size={14} className="text-white" />}
              open={pipelineOpen}
              onToggle={() => setPipelineOpen((v) => !v)}
            />

            {pipelineOpen && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <AgentControlPanel />
              </div>
            )}
          </section>

          {/* Vibe Coder Section */}
          <div className="px-4 py-5">
            <VibeCoderSection
              workspaceId={workspaceId}
              open={vibeOpen}
              onToggle={() => setVibeOpen((v) => !v)}
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </div>

      {/* Sticky Controls */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => setControlsOpen(!controlsOpen)}
          className="flex w-full items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition-all hover:bg-muted/50 hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Sliders size={12} />
            Quick Controls
          </div>
          {controlsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        {controlsOpen && (
          <div className="mt-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PartialRestart workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </aside>
  );
}

/* ---------------------------------- */
/* Section Toggle */
/* ---------------------------------- */

function SectionToggle({
  label,
  icon,
  open,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'group flex w-full items-center justify-between',
        'text-xs font-bold tracking-wider uppercase',
        'text-muted-foreground hover:text-foreground transition-colors'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground/70 group-hover:text-foreground">{icon}</span>
        {label}
      </div>

      {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
    </button>
  );
}
