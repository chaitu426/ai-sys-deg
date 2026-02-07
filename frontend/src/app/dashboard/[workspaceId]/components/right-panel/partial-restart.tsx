'use client';

import { useState } from 'react';
import { useDesign } from '../../hooks/use-design';
import { useAgentStore } from '../../stores/agent.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import { AGENT_DISPLAY_NAMES, AgentType } from '../../types/agent';
import { RefreshCw, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plan } from '@/lib/plans';
import Link from 'next/link';

interface PartialRestartProps {
  workspaceId: string;
}

export function PartialRestart({ workspaceId }: PartialRestartProps) {
  const { updateDesign } = useDesign(workspaceId);
  const { user } = useAuthStore();

  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInferred, setLastInferred] = useState<string | null>(null);

  const isPremium = (user as any)?.plan === Plan.PREMIUM;

  const handleRestart = async () => {
    if (!instructions.trim() || isSubmitting || !isPremium) return;

    setIsSubmitting(true);
    setLastInferred(null);

    try {
      const result = await updateDesign(instructions, undefined);

      if (result && (result as any).inferredAgent) {
        const inferred = (result as any).inferredAgent;
        setLastInferred(inferred);

        const { resetFrom } = useAgentStore.getState();
        resetFrom(inferred);

        setTimeout(() => setLastInferred(null), 5000);
      }

      setInstructions('');
    } catch (err) {
      console.error('[PartialRestart]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="space-y-1.5 opacity-90">
        <div className="flex items-center justify-between">
          <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
            Update Instructions
          </label>
          {!isPremium && (
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-purple-400 uppercase">
              Architect <Lock size={8} />
            </span>
          )}
        </div>

        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={!isPremium}
          placeholder={
            isPremium
              ? "Describe changes (e.g. 'Add Redis caching')"
              : 'Iterations are exclusive to Architecture Plan'
          }
          className={cn(
            'border-border bg-background text-foreground focus:border-foreground scrollbar-thin scrollbar-thumb-border min-h-[90px] w-full resize-none rounded-sm border p-3 text-xs transition-all focus:outline-none',
            !isPremium &&
              'bg-muted/10 placeholder:text-muted-foreground/50 cursor-not-allowed opacity-60'
          )}
        />
      </div>

      {/* Auto mode indicator */}
      <div className="border-border bg-muted/30 text-muted-foreground flex items-center justify-between rounded-sm border px-3 py-2 text-[10px] tracking-wider uppercase">
        <span>Pipeline Mode</span>
        <span className="text-foreground font-bold">✨ Smart Detect (Auto)</span>
      </div>

      {/* Submit or Upgrade */}
      {isPremium ? (
        <button
          onClick={handleRestart}
          disabled={!instructions.trim() || isSubmitting}
          className={cn(
            'bg-foreground text-background hover:bg-foreground/90 flex w-full items-center justify-center gap-2 rounded-sm py-2.5 text-xs font-bold shadow-sm transition-all',
            (!instructions.trim() || isSubmitting) && 'cursor-not-allowed opacity-50'
          )}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Analyzing system...</span>
            </>
          ) : (
            <>
              <span>Update System</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      ) : (
        <Link
          href="/#pricing"
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-purple-600 to-amber-600 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          <Sparkles className="h-3 w-3" />
          <span>Unlock Iterations</span>
        </Link>
      )}

      {/* AI feedback */}
      {lastInferred && (
        <div className="animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-1.5 rounded-sm bg-emerald-500/10 p-2 text-[10px] font-medium text-emerald-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          AI started from: {AGENT_DISPLAY_NAMES[lastInferred as AgentType] || lastInferred}
        </div>
      )}
    </div>
  );
}
