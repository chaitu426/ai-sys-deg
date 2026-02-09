'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { InteractiveDiagram } from '../components/center/artifacts/interactive-diagram';
import { useDesignStore } from '../stores/design.store';
import { useDesign } from '../hooks/use-design';
import { ArrowLeft, GitBranch, Share2, Download, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

function WhiteboardContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeVersion } = useDesignStore();

  const workspaceId = params?.workspaceId as string;
  const type = searchParams.get('type') || 'architecture';
  const { getWhiteboards } = useDesign(workspaceId);
  const { loadWhiteboards } = useDesignStore();

  useEffect(() => {
    const fetchWhiteboards = async () => {
      const wbs = await getWhiteboards();
      if (wbs) loadWhiteboards(wbs);
    };
    fetchWhiteboards();
  }, [getWhiteboards, loadWhiteboards]);

  const getMermaidData = () => {
    if (!activeVersion?.diagrams) return '';
    switch (type) {
      case 'flow':
        return activeVersion.diagrams.requestFlow;
      case 'scaling':
        return activeVersion.diagrams.scalingView || '';
      case 'cloud':
        return activeVersion.diagrams.cloudArchitecture || '';
      case 'api':
        return activeVersion.diagrams.apiArchitecture || '';
      default:
        return activeVersion.diagrams.highLevelSystem;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'flow':
        return 'Request Flow Editor';
      case 'scaling':
        return 'Scaling Strategy Editor';
      case 'cloud':
        return 'Cloud Infrastructure Editor';
      case 'api':
        return 'API Architecture Editor';
      default:
        return 'Architecture Whiteboard';
    }
  };

  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden">
      {/* Whiteboard Header */}
      <header className="border-border bg-card/50 z-50 flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full p-2 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-border mx-1 h-6 w-px" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">{getTitle()}</h1>
            <p className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
              Workspace: {workspaceId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-muted/50 border-border mr-4 flex items-center gap-1 rounded-lg border p-1">
            <button className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all">
              <GitBranch size={12} /> main*
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors">
              <Share2 size={18} />
            </button>
            <button className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors">
              <Download size={18} />
            </button>
            <button className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="relative flex-1 bg-neutral-950">
        <InteractiveDiagram initialMermaid={getMermaidData()} projectId={workspaceId} type={type} />
      </main>
    </div>
  );
}

function SnapshotItem({
  time,
  label,
  active = false,
}: {
  time: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-all ${active
        ? 'bg-primary/10 border-primary/30'
        : 'bg-muted/30 hover:border-border border-transparent'
        }`}
    >
      <div className="flex flex-col">
        <span className={`text-[11px] font-bold ${active ? 'text-primary' : 'text-foreground'}`}>
          {label}
        </span>
        <span className="text-muted-foreground text-[9px]">{time}</span>
      </div>
      {active && <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />}
    </div>
  );
}

export default function WhiteboardPage() {
  return (
    <Suspense fallback={<div>Loading Whiteboard...</div>}>
      <WhiteboardContent />
    </Suspense>
  );
}
