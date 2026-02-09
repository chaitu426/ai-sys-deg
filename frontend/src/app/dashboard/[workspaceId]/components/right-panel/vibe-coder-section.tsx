'use client';

import { useState } from 'react';
import { useVibePrompts } from '../../hooks/use-vibe-prompts';
import { Lock, Terminal, Sparkles, Check, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plan } from '@/lib/plans';
import { useAuthStore } from '@/lib/stores/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface VibeCoderSectionProps {
  workspaceId: string;
  open: boolean;
  onToggle: () => void;
}

export function VibeCoderSection({ workspaceId, open, onToggle }: VibeCoderSectionProps) {
  const { user } = useAuthStore();
  const { prompts, isLoading, isPremiumLocked: apiLocked } = useVibePrompts(workspaceId, open);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const userPlan = (user?.plan as Plan) || Plan.FREE;
  const canAccess = userPlan === Plan.PRO || userPlan === Plan.PREMIUM;
  const isPremiumLocked = apiLocked || !canAccess;

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast.success('Prompt copied to clipboard', {
      description: 'You can now paste this into your IDE or terminal.',
      icon: <Check size={14} className="text-emerald-500" />,
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'group flex w-full items-center justify-between transition-all',
          'text-xs font-bold tracking-wider uppercase'
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-500/10 text-violet-500 transition-colors group-hover:bg-violet-500/20">
            <Terminal size={12} />
          </div>
          <span
            className={cn(
              'transition-all duration-300',
              open
                ? 'bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent'
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            Vibe Coder
          </span>
        </div>
        {open ? (
          <ChevronDown size={14} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-4">
              {isPremiumLocked ? (
                <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-5 text-center shadow-sm">
                  <div className="bg-grid-white/5 absolute inset-0 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-2.5 ring-1 ring-violet-500/20">
                      <Lock className="h-5 w-5 text-violet-500" />
                    </div>

                    <h4 className="text-foreground mb-1 text-sm font-semibold">
                      Unlock Vibe Coder
                    </h4>

                    <p className="text-muted-foreground mb-4 text-[11px] leading-relaxed">
                      AI-optimized, step-by-step coding prompts for your system.
                    </p>

                    <button className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider">
                        <Sparkles size={12} className="fill-white" />
                        <span>Ready to Go Pro?</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border-border/40 bg-muted/5 h-10 animate-pulse rounded-lg border"
                    />
                  ))}
                </div>
              ) : prompts.length === 0 ? (
                <div className="border-border text-muted-foreground bg-muted/5 rounded-xl border border-dashed py-8 text-center text-[10px] font-medium uppercase tracking-tight">
                  Awaiting system design...
                </div>
              ) : (
                <div className="space-y-3">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.step}
                      className={cn(
                        "group overflow-hidden rounded-xl border transition-all duration-300",
                        expandedStep === prompt.step
                          ? "border-violet-500/30 bg-violet-500/[0.03] shadow-sm"
                          : "border-border/40 bg-card/40 hover:border-violet-500/20 hover:bg-card/60"
                      )}
                    >
                      <button
                        onClick={() =>
                          setExpandedStep(expandedStep === prompt.step ? null : prompt.step)
                        }
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                      >
                        <div
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold transition-all duration-300',
                            expandedStep === prompt.step
                              ? 'border-violet-500/50 bg-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                              : 'border-border bg-muted/5 text-muted-foreground group-hover:border-violet-500/30 group-hover:text-violet-400'
                          )}
                        >
                          {prompt.step}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div
                            className={cn(
                              'truncate text-[11px] font-semibold transition-colors',
                              expandedStep === prompt.step
                                ? 'text-foreground'
                                : 'text-muted-foreground group-hover:text-foreground'
                            )}
                          >
                            {prompt.title}
                          </div>
                        </div>
                        <ChevronDown
                          size={12}
                          className={cn(
                            'text-muted-foreground transition-transform duration-500',
                            expandedStep === prompt.step && 'rotate-180 text-violet-500'
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {expandedStep === prompt.step && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          >
                            <div className="px-3 pb-3 pt-0">
                              <p className="text-muted-foreground/70 mb-3 px-1 text-[10px] leading-relaxed">
                                {prompt.description}
                              </p>
                              <div className="group/code relative outline-none">
                                <div className="scrollbar-none max-h-48 overflow-y-auto rounded-lg bg-[#0a0a0a] p-3 font-mono text-[10px] leading-relaxed text-zinc-300 ring-1 ring-white/5 shadow-2xl">
                                  <pre className="font-mono whitespace-pre-wrap">
                                    {prompt.promptContent}
                                  </pre>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(prompt.promptContent, prompt.step)}
                                  className={cn(
                                    'absolute top-2 right-2 rounded-md border border-white/10 bg-white/5 p-1.5 text-zinc-400 opacity-0 backdrop-blur-sm transition-all group-hover/code:opacity-100 hover:bg-white/10 hover:text-white',
                                    copiedStep === prompt.step &&
                                    'border-green-500/30 bg-green-500/20 text-green-400 opacity-100'
                                  )}
                                >
                                  {copiedStep === prompt.step ? (
                                    <Check size={12} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
