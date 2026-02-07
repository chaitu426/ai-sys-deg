'use client';

import { useState } from 'react';
import { Share2, ChevronDown, Code, Zap, Loader2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';

export function ExportDropdown({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { token, user } = useAuthStore();

  // Get user plan - default to FREE
  const userPlan = (user as any)?.plan || 'FREE';
  const canExport = userPlan === 'PREMIUM';

  const handleExport = async (type: 'markdown' | 'openapi') => {
    if (!canExport) {
      toast.error('Export is exclusive to the Architect plan');
      return;
    }

    setIsExporting(type);
    setIsOpen(false);

    try {
      if (type === 'markdown') {
        const data = await api.get<any>(`/api/design/${projectId}/doc`, token);

        if (data.success) {
          downloadFile(data.markdown, `${data.title}.md`, 'text/markdown');
          toast.success('Markdown exported');
        }
      }

      if (type === 'openapi') {
        const data = await api.get<any>(`/api/design/${projectId}/openapi`, token);

        if (data.success) {
          downloadFile(
            JSON.stringify(data.spec, null, 2),
            `${data.title}.json`,
            'application/json'
          );
          toast.success('OpenAPI spec exported');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="relative">
      {/* ===== Toggle Pill ===== */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`ml-2 flex items-center gap-1.5 rounded-md border border-l border-zinc-800 px-2.5 py-1 pl-4 text-[11px] font-medium transition-colors ${
          isOpen
            ? 'border-zinc-700 bg-zinc-800 text-zinc-200'
            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
        } `}
      >
        {isExporting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Share2 className="h-3 w-3" />
        )}
        <span>Export</span>
        {!canExport && <Lock className="h-2.5 w-2.5 text-amber-500" />}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ===== Dropdown ===== */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl ring-1 ring-white/5 duration-150">
            <div className="mb-2 border-b border-zinc-800 px-3 py-2">
              <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                Exporter Hub
              </p>
            </div>

            {canExport ? (
              <>
                <ExportItem
                  icon={Zap}
                  label="System Blueprint"
                  description="Best for Notion, GitHub & Wikis"
                  onClick={() => handleExport('markdown')}
                />

                <ExportItem
                  icon={Code}
                  label="OpenAPI 3.0 Spec"
                  description="Import into Postman or Swagger"
                  onClick={() => handleExport('openapi')}
                />
              </>
            ) : (
              <div className="p-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <p className="mb-1 text-sm text-zinc-300">Export to PDF, Markdown & more</p>
                <p className="mb-4 text-xs text-zinc-500">Available on Architect plan</p>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Upgrade to Architect
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ===== Export Item ===== */

function ExportItem({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: any;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-4 rounded-xl p-3 text-left transition-all hover:bg-zinc-800"
    >
      <div className="rounded-xl border border-zinc-700/30 bg-zinc-800/50 p-2.5 group-hover:border-zinc-600/50">
        <Icon className="h-4 w-4 text-zinc-300 transition-transform group-hover:scale-110" />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-zinc-100">{label}</span>
        <span className="text-[10px] leading-tight text-zinc-500">{description}</span>
      </div>
    </button>
  );
}

/* ===== Utils ===== */

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
