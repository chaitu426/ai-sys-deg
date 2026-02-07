'use client';

import { useState, useEffect } from 'react';
import mermaid from 'mermaid';
import { Diagrams } from '../../../types/design';
import { SectionHeader } from './common';
import { useRouter, useParams } from 'next/navigation';
import { useDesignStore } from '../../../stores/design.store';
import { BadgeCheck, History, MousePointer2, Sparkles } from 'lucide-react';

export function DiagramsView({ data }: { data: Diagrams }) {
  if (!data) return null;
  const [rendered, setRendered] = useState(false);
  const { whiteboardData } = useDesignStore();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      fontFamily: 'var(--font-sans)',
    });
    setTimeout(() => {
      mermaid.contentLoaded();
      setRendered(true);
    }, 500);
  }, []);

  const hasChanges = (type: string) => {
    return !!whiteboardData[`${workspaceId}_${type}`];
  };

  const openWhiteboard = (type: string) => {
    router.push(`/dashboard/${workspaceId}/whiteboard?type=${type}`);
  };

  return (
    <div className="space-y-12">
      <div className="border-border flex items-end justify-between border-b pb-6">
        <SectionHeader
          title="System Architecture"
          subtitle="Static visual representations of your system design."
        />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-16 duration-500">
        {data.highLevelSystem && (
          <div className="group space-y-4">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-foreground text-sm font-bold tracking-widest uppercase">
                  High Level Architecture
                </h4>
                {hasChanges('architecture') && (
                  <div className="bg-primary/10 border-primary/20 flex animate-pulse items-center gap-1.5 rounded-full border px-2 py-0.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-primary text-[9px] font-bold tracking-tighter uppercase">
                      Modified in Whiteboard
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => openWhiteboard('architecture')}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-0 transition-all group-hover:opacity-100"
              >
                <MousePointer2 size={12} /> Launch Interactive Editor
              </button>
            </div>
            <div className="mermaid bg-card border-border flex justify-center overflow-x-auto rounded-xl border p-8 shadow-sm">
              {data.highLevelSystem}
            </div>
          </div>
        )}

        {data.requestFlow && (
          <div className="group space-y-4">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-foreground text-sm font-bold tracking-widest uppercase">
                  Request Flow
                </h4>
                {hasChanges('flow') && (
                  <div className="bg-primary/10 border-primary/20 flex animate-pulse items-center gap-1.5 rounded-full border px-2 py-0.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-primary text-[9px] font-bold tracking-tighter uppercase">
                      Modified in Whiteboard
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => openWhiteboard('flow')}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-0 transition-all group-hover:opacity-100"
              >
                <MousePointer2 size={12} /> Launch Interactive Editor
              </button>
            </div>
            <div className="mermaid bg-card border-border flex justify-center overflow-x-auto rounded-xl border p-8 shadow-sm">
              {data.requestFlow}
            </div>
          </div>
        )}

        {data.scalingView && (
          <div className="group space-y-4">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-foreground text-sm font-bold tracking-widest uppercase">
                  Scaling Strategy
                </h4>
                {hasChanges('scaling') && (
                  <div className="bg-primary/10 border-primary/20 flex animate-pulse items-center gap-1.5 rounded-full border px-2 py-0.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-primary text-[9px] font-bold tracking-tighter uppercase">
                      Modified in Whiteboard
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => openWhiteboard('scaling')}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-0 transition-all group-hover:opacity-100"
              >
                <MousePointer2 size={12} /> Launch Interactive Editor
              </button>
            </div>
            <div className="mermaid bg-card border-border flex justify-center overflow-x-auto rounded-xl border p-8 shadow-sm">
              {data.scalingView}
            </div>
          </div>
        )}

        {data.cloudArchitecture && (
          <div className="group space-y-4">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-foreground text-sm font-bold tracking-widest uppercase">
                  Cloud Architecture
                </h4>
                {hasChanges('cloud') && (
                  <div className="bg-primary/10 border-primary/20 flex animate-pulse items-center gap-1.5 rounded-full border px-2 py-0.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-primary text-[9px] font-bold tracking-tighter uppercase">
                      Modified in Whiteboard
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => openWhiteboard('cloud')}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-0 transition-all group-hover:opacity-100"
              >
                <MousePointer2 size={12} /> Launch Interactive Editor
              </button>
            </div>
            <div className="mermaid bg-card border-border flex justify-center overflow-x-auto rounded-xl border p-8 shadow-sm">
              {data.cloudArchitecture}
            </div>
          </div>
        )}

        {data.apiArchitecture && (
          <div className="group space-y-4">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-3">
                <h4 className="text-foreground text-sm font-bold tracking-widest uppercase">
                  API Architecture
                </h4>
                {hasChanges('api') && (
                  <div className="bg-primary/10 border-primary/20 flex animate-pulse items-center gap-1.5 rounded-full border px-2 py-0.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-primary text-[9px] font-bold tracking-tighter uppercase">
                      Modified in Whiteboard
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => openWhiteboard('api')}
                className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center gap-2 rounded-md px-3 py-1 text-[10px] font-bold tracking-wider uppercase opacity-0 transition-all group-hover:opacity-100"
              >
                <MousePointer2 size={12} /> Launch Interactive Editor
              </button>
            </div>
            <div className="mermaid bg-card border-border flex justify-center overflow-x-auto rounded-xl border p-8 shadow-sm">
              {data.apiArchitecture}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
