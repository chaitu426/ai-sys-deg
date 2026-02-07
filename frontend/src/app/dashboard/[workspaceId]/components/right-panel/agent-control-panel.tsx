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
  const [isLocked, setIsLocked] = useState(false);

  const userPlan = (user?.plan as Plan) || Plan.FREE;
  const allowedAgents = PLAN_LIMITS[userPlan]?.agents || [];

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
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
          AI Pipeline
        </p>

        {isStarted && !isWorkflowComplete && (
          <div className="flex items-center gap-2">
            {isPaused ? (
              <button
                onClick={handleResume}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-500 uppercase transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Play size={10} fill="currentColor" />
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                disabled={isActionLoading}
                className="flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-500 uppercase transition-colors hover:bg-amber-500/20 disabled:opacity-50"
              >
                <Pause size={10} fill="currentColor" />
                Pause
              </button>
            )}
          </div>
        )}
      </div>

      {ORDERED_AGENTS.map((agent) => {
        const status = agentStatuses[agent];
        const isRunning = currentAgent === agent && status === 'processing';
        const isOptional = OPTIONAL_AGENTS.includes(agent);

        return (
          <motion.div
            key={agent}
            layout
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'flex items-center gap-3 rounded-md border px-3 py-2 text-left',
              'transition-colors',
              isRunning
                ? 'border-primary/60 bg-primary/5'
                : isLocked
                  ? 'border-border/20 bg-muted/5 opacity-60'
                  : 'border-border/40 bg-background hover:bg-muted/30'
            )}
          >
            {/* Status Icon */}
            <div className="flex h-5 w-5 shrink-0 items-center justify-center">
              {isLocked ? (
                <Lock className="text-muted-foreground/60 h-3 w-3" />
              ) : status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : status === 'processing' ? (
                <Loader2 className="text-primary h-4 w-4 animate-spin" />
              ) : status === 'failed' ? (
                isOptional ? (
                  <div className="relative">
                    <Circle className="h-4 w-4 text-amber-500/50" />
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-amber-500">!</div>
                  </div>
                ) : (
                  <XCircle className="text-destructive h-4 w-4" />
                )
              ) : (
                <Circle className="text-muted-foreground/40 h-3 w-3" />
              )}
            </div>

            {/* Label */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'truncate text-xs font-medium',
                    isLocked && 'text-muted-foreground'
                  )}
                >
                  {AGENT_DISPLAY_NAMES[agent]}
                </span>

                {isRunning && (
                  <span className="text-primary text-[9px] font-bold tracking-wider uppercase">
                    Running
                  </span>
                )}

                {isLocked && (
                  <span className="text-[9px] font-bold tracking-wider text-amber-500/70 uppercase">
                    Pro
                  </span>
                )}
              </div>

              <span className="text-muted-foreground text-[11px]">
                {isLocked
                  ? 'Upgrade plan to unlock'
                  : status === 'processing'
                    ? 'AI is working on this step'
                    : status === 'completed'
                      ? 'Completed successfully'
                      : status === 'failed'
                        ? isOptional ? 'Skipped (Issue detected)' : 'Critical failure'
                        : 'Queued'}
              </span>
            </div>
          </motion.div>
        );
      })}

      {/* Footer hint */}
      <div className="space-y-3 px-1 pt-2">
        {userPlan !== Plan.PREMIUM && (
          <Link
            href="/#pricing"
            className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 flex w-full items-center gap-2 rounded-lg border p-2 text-[10px] font-bold tracking-wider uppercase transition-colors"
          >
            <Sparkles size={12} />
            Unlock full potential
          </Link>
        )}
        <p className="text-muted-foreground text-[10px]">
          Pipeline is automatically orchestrated by AI.
        </p>
      </div>
    </div>
  );
}
