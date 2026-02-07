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
    <aside className="border-border bg-card flex h-full flex-col border-l font-sans">
      {/* Header */}
      <div className="border-border bg-muted/10 shrink-0 border-b px-4 py-3">
        <div className="text-foreground flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <CircuitBoard size={15} />
          Orchestration
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-y-auto">
        {/* Pipeline Section */}
        <section className="border-border/40 border-b px-4 py-4">
          <SectionToggle
            label="Execution Stages"
            icon={<Layers size={14} />}
            open={pipelineOpen}
            onToggle={() => setPipelineOpen((v) => !v)}
          />

          {pipelineOpen && (
            <div className="animate-in slide-in-from-top-2 mt-3 duration-300">
              <AgentControlPanel />
            </div>
          )}
        </section>

        {/* Vibe Coder Section */}
        <VibeCoderSection
          workspaceId={workspaceId}
          open={vibeOpen}
          onToggle={() => setVibeOpen((v) => !v)}
        />

        {/* Spacer so content doesn't hide behind sticky controls */}
        <div className="h-32" />
      </div>

      {/* Sticky Controls */}
      <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 border-t backdrop-blur">
        <div className="px-4 py-3">
          <SectionToggle
            label="Controls"
            icon={<Sliders size={14} />}
            open={controlsOpen}
            onToggle={() => setControlsOpen((v) => !v)}
          />

          {controlsOpen && (
            <div className="animate-in slide-in-from-top-2 mt-3 duration-300">
              <PartialRestart workspaceId={workspaceId} />
            </div>
          )}
        </div>
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
