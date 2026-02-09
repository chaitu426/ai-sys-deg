'use client';

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Diagrams } from '../../../types/design';
import { SectionHeader } from './common';
import { useRouter, useParams } from 'next/navigation';
import { useDesignStore } from '../../../stores/design.store';
import {
  BadgeCheck,
  History,
  MousePointer2,
  Sparkles,
  MoreVertical,
  Download,
  Maximize2,
  ExternalLink,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function DiagramsView({ data }: { data: Diagrams }) {
  if (!data) return null;
  const [rendered, setRendered] = useState(false);
  const [fullViewDiagram, setFullViewDiagram] = useState<{ title: string; content: string } | null>(null);
  const { whiteboardData } = useDesignStore();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      fontFamily: 'var(--font-sans)',
      securityLevel: 'loose',
    });
    const renderDiagrams = () => {
      setTimeout(() => {
        mermaid.contentLoaded();
        setRendered(true);
      }, 500);
    };

    renderDiagrams();
  }, [data]);

  useEffect(() => {
    if (fullViewDiagram) {
      setTimeout(() => {
        mermaid.contentLoaded();
      }, 100);
    }
  }, [fullViewDiagram]);

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
          <DiagramSection
            title="High Level Architecture"
            type="architecture"
            content={data.highLevelSystem}
            hasChanges={hasChanges('architecture')}
            onOpenWhiteboard={() => openWhiteboard('architecture')}
            onFullView={() => setFullViewDiagram({ title: 'High Level Architecture', content: data.highLevelSystem })}
          />
        )}

        {data.requestFlow && (
          <DiagramSection
            title="Request Flow"
            type="flow"
            content={data.requestFlow}
            hasChanges={hasChanges('flow')}
            onOpenWhiteboard={() => openWhiteboard('flow')}
            onFullView={() => setFullViewDiagram({ title: 'Request Flow', content: data.requestFlow })}
          />
        )}

        {data.scalingView && (
          <DiagramSection
            title="Scaling Strategy"
            type="scaling"
            content={data.scalingView}
            hasChanges={hasChanges('scaling')}
            onOpenWhiteboard={() => openWhiteboard('scaling')}
            onFullView={() => setFullViewDiagram({ title: 'Scaling Strategy', content: data.scalingView })}
          />
        )}

        {data.cloudArchitecture && (
          <DiagramSection
            title="Cloud Architecture"
            type="cloud"
            content={data.cloudArchitecture}
            hasChanges={hasChanges('cloud')}
            onOpenWhiteboard={() => openWhiteboard('cloud')}
            onFullView={() => setFullViewDiagram({ title: 'Cloud Architecture', content: data.cloudArchitecture })}
          />
        )}

        {data.apiArchitecture && (
          <DiagramSection
            title="API Architecture"
            type="api"
            content={data.apiArchitecture}
            hasChanges={hasChanges('api')}
            onOpenWhiteboard={() => openWhiteboard('api')}
            onFullView={() => setFullViewDiagram({ title: 'API Architecture', content: data.apiArchitecture })}
          />
        )}
      </div>

      {/* Full View Modal */}
      <AnimatePresence>
        {fullViewDiagram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md md:p-10"
          >
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl">
              <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-8 py-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">{fullViewDiagram.title}</h2>
                  <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Full System View</p>
                </div>
                <button
                  onClick={() => setFullViewDiagram(null)}
                  className="rounded-full bg-white/5 p-2 text-white transition-colors hover:bg-white/10"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-8">
                <div key={fullViewDiagram.title} className="mermaid flex min-h-full items-center justify-center">
                  {fullViewDiagram.content}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DiagramSection({
  title,
  type,
  content,
  hasChanges,
  onOpenWhiteboard,
  onFullView,
}: {
  title: string;
  type: string;
  content: string;
  hasChanges: boolean;
  onOpenWhiteboard: () => void;
  onFullView: () => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    const mermaidEl = containerRef.current.querySelector('.mermaid');
    if (!mermaidEl) return;

    const toastId = toast.loading(`Preparing ${title} for download...`);

    try {
      const dataUrl = await toPng(mermaidEl as HTMLElement, {
        backgroundColor: '#0a0a0a',
        style: {
          padding: '40px',
        },
      });
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      setIsDropdownOpen(false);
      toast.success('Architecture exported successfully', { id: toastId });
    } catch (err) {
      console.error('Failed to download diagram', err);
      toast.error('Failed to export architecture', { id: toastId });
    }
  };

  return (
    <div className="group space-y-4" ref={containerRef}>
      <div className="border-border flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-3">
          <h4 className="text-foreground text-sm font-bold tracking-widest uppercase">{title}</h4>
          {hasChanges && (
            <div className="bg-primary/10 border-primary/20 flex animate-pulse items-center gap-1.5 rounded-full border px-2 py-0.5">
              <Sparkles size={10} className="text-primary" />
              <span className="text-primary text-[9px] font-bold tracking-tighter uppercase">Modified in Whiteboard</span>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors hover:bg-white/5"
          >
            <MoreVertical size={18} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="bg-card border-border absolute right-0 top-full z-20 mt-2 min-w-[200px] overflow-hidden rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl"
                >
                  <DropdownItem
                    icon={ExternalLink}
                    label="Launch Whiteboard"
                    onClick={() => {
                      onOpenWhiteboard();
                      setIsDropdownOpen(false);
                    }}
                  />
                  <DropdownItem icon={Maximize2} label="View Full Screen" onClick={onFullView} />
                  <div className="bg-border my-1 h-px" />
                  <DropdownItem icon={Download} label="Download as PNG" onClick={handleDownload} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="mermaid bg-card border-border flex justify-center overflow-x-auto rounded-xl border p-8 shadow-sm transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-primary/5">
        {content}
      </div>
    </div>
  );
}

function DropdownItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-primary/10 hover:text-primary flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[11px] font-bold tracking-tight text-neutral-400 transition-all hover:pl-4 focus:outline-none"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

