'use client';

import { useAgentStore } from '../../stores/agent.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import { ORDERED_AGENTS, AGENT_DISPLAY_NAMES, AgentType, OPTIONAL_AGENTS } from '../../types/agent';
import { CheckCircle2, Circle, Loader2, XCircle, Lock, Sparkles, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { useDesign } from '../../hooks/use-design';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plan, PLAN_LIMITS } from '@/lib/plans';
import Link from 'next/link';

export function AgentControlPanel() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { agentStatuses, currentAgent, isPaused, setIsPaused } = useAgentStore();
  const { user } = useAuthStore();
  const { pauseWorkflow, resumeWorkflow } = useDesign(workspaceId);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const userPlan = (user?.plan as Plan) || Plan.FREE;
  const allowedAgents = (PLAN_LIMITS[userPlan]?.agents || []) as string[];

  const isStarted = Object.values(agentStatuses).some((s) => s !== 'pending');
  const isWorkflowComplete = allowedAgents.every(
    (agent) => agentStatuses[agent as AgentType] === 'completed'
  );

  const handlePause = async () => {
    setIsActionLoading(true);
    try {
      await pauseWorkflow();
      setIsPaused(true);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResume = async () => {
    setIsActionLoading(true);
    try {
      await resumeWorkflow();
      setIsPaused(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="relative space-y-1">
      {/* Header and Controls */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isStarted && !isWorkflowComplete && (
            <div className="flex h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          )}
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Pipeline
          </span>
        </div>

        {isStarted && !isWorkflowComplete && (
          <div className="flex items-center gap-1">
            {isPaused ? (
              <button
                onClick={handleResume}
                disabled={isActionLoading}
                className="flex h-6 items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold text-white uppercase transition-all hover:bg-white/20 disabled:opacity-50 border border-white/5"
              >
                <Play size={10} fill="currentColor" />
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={isActionLoading}
                className="flex h-6 items-center gap-1.5 rounded-md bg-zinc-800/50 px-2 py-1 text-[9px] font-bold text-zinc-400 uppercase transition-all hover:bg-zinc-800 disabled:opacity-50 border border-white/5"
              >
                <Pause size={10} fill="currentColor" />
                Wait
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vertical Line */}
      <div className="absolute top-10 bottom-2 left-[9px] w-[2px] bg-border/40" />

      {ORDERED_AGENTS.map((agent, index) => {
        const status = agentStatuses[agent];
        const isRunning = currentAgent === agent && status === 'processing';
        const isOptional = OPTIONAL_AGENTS.includes(agent);
        const isLocked = !allowedAgents.includes(agent);

        return (
          <motion.div
            key={agent}
            layout
            className={cn(
              'group relative flex items-start gap-4 pb-4 last:pb-0',
              isLocked && "opacity-50 grayscale-[0.5]"
            )}
          >
            {/* Status Indicator Point */}
            <div className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
              {isLocked ? (
                <div className="flex h-3 w-3 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/10 flex items-center justify-center">
                  <Lock className="h-2 w-2 text-muted-foreground/40" />
                </div>
              ) : status === 'completed' ? (
                <div className="flex h-4 w-4 items-center justify-center rounded-full">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                </div>
              ) : status === 'processing' ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-black shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                  <Loader2 className="h-3 w-3 animate-spin text-white" />
                </div>
              ) : status === 'failed' ? (
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900",
                  isOptional ? "text-zinc-500" : "text-zinc-300"
                )}>
                  {isOptional ? (
                    <span className="text-[10px] font-bold">!</span>
                  ) : (
                    <XCircle className="h-2.5 w-2.5" />
                  )}
                </div>
              ) : (
                <div className="h-3 w-3 rounded-full border-2 border-border/60 bg-muted/20" />
              )}
            </div>

            {/* Content Body */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[11px] font-semibold transition-colors',
                  status === 'processing' ? 'text-foreground' : 'text-muted-foreground/80 group-hover:text-foreground',
                  isLocked && "text-muted-foreground/40"
                )}>
                  {AGENT_DISPLAY_NAMES[agent]}
                </span>

                {isRunning && (
                  <span className="inline-flex h-3 items-center rounded-full bg-primary/10 px-1.5 text-[8px] font-bold text-primary uppercase">
                    Live
                  </span>
                )}

                {isLocked && (
                  <Lock size={10} className="text-muted-foreground/30" />
                )}
              </div>

              <p className={cn(
                "mt-0.5 text-[10px] leading-tight transition-colors",
                status === 'processing' ? "text-primary/70" : "text-muted-foreground/60",
                isLocked && "text-muted-foreground/30"
              )}>
                {isLocked
                  ? 'Premium Agent'
                  : status === 'processing'
                    ? 'Processing now...'
                    : status === 'completed'
                      ? 'Done'
                      : status === 'failed'
                        ? isOptional ? 'Skipped' : 'Error'
                        : 'Pending'}
              </p>
            </div>
          </motion.div>
        );
      })}

      {/* Footer / Info */}
      <div className="mt-6 space-y-3 pt-2">
        {userPlan !== Plan.PREMIUM && (
          <Link
            href="/#pricing"
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-zinc-900/50 border border-white/10 p-2 text-[9px] font-bold tracking-wider text-zinc-300 uppercase transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <Sparkles size={10} />
            Upgrade to Pro
          </Link>
        )}
      </div>
    </div>
  );
}
