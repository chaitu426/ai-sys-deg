'use client';

import { useState } from 'react';
import { useVibePrompts } from '../../hooks/use-vibe-prompts';
import { ChevronDown, ChevronRight, Copy, Check, Lock, Terminal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VibeCoderSectionProps {
  workspaceId: string;
  open: boolean;
  onToggle: () => void;
}

export function VibeCoderSection({ workspaceId, open, onToggle }: VibeCoderSectionProps) {
  const { prompts, isLoading, isPremiumLocked } = useVibePrompts(workspaceId, open);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <section className="border-border/40 border-b px-4 py-4">
      <button
        onClick={onToggle}
        className={cn(
          'group flex w-full items-center justify-between',
          'text-xs font-bold tracking-wider uppercase',
          'text-muted-foreground hover:text-foreground transition-colors'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-violet-500 transition-colors group-hover:text-violet-400">
            <Terminal size={14} />
          </span>
          <span
            className={cn(
              'transition-all duration-300',
              open
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent'
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            Vibe Coder
          </span>
        </div>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {isPremiumLocked ? (
                <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-5 text-center shadow-sm backdrop-blur-sm">
                  <div className="bg-grid-white/5 absolute inset-0 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-3 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 ring-1 ring-violet-500/20">
                      <Lock className="h-5 w-5 text-violet-500" />
                    </div>

                    <h4 className="text-foreground mb-1 text-sm font-semibold">
                      Unlock Vibe Coder
                    </h4>

                    <p className="text-muted-foreground mb-4 text-[11px] leading-relaxed">
                      Get AI-optimized, step-by-step coding prompts tailored to your system
                      architecture.
                    </p>

                    <button className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-white">
                        <Sparkles size={12} className="fill-white" />
                        <span>Upgrade to Pro</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="space-y-3 px-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="border-border/40 bg-muted/10 h-12 animate-pulse rounded-lg border"
                    />
                  ))}
                </div>
              ) : prompts.length === 0 ? (
                <div className="border-border text-muted-foreground bg-muted/5 rounded-lg border border-dashed p-4 text-center text-xs">
                  No prompts generated yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.step}
                      className="group border-border/50 bg-card/30 hover:bg-card/60 overflow-hidden rounded-lg border transition-all hover:border-violet-500/20 hover:shadow-sm"
                    >
                      <button
                        onClick={() =>
                          setExpandedStep(expandedStep === prompt.step ? null : prompt.step)
                        }
                        className="flex w-full items-start gap-3 px-3 py-3 text-left"
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold transition-colors',
                            expandedStep === prompt.step
                              ? 'border-violet-500/50 bg-violet-500/10 text-violet-500'
                              : 'border-border text-muted-foreground group-hover:border-violet-500/30 group-hover:text-violet-400'
                          )}
                        >
                          {prompt.step}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div
                            className={cn(
                              'truncate text-xs font-medium transition-colors',
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
                            'text-muted-foreground mt-1 transition-transform duration-300',
                            expandedStep === prompt.step && 'rotate-180'
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {expandedStep === prompt.step && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-border/40 bg-muted/10 overflow-hidden border-t"
                          >
                            <div className="p-3 pt-2">
                              <p className="text-muted-foreground/80 mb-3 text-[11px] leading-relaxed">
                                {prompt.description}
                              </p>
                              <div className="group/code relative">
                                <div className="border-border/50 scrollbar-thin scrollbar-thumb-zinc-700 max-h-48 overflow-y-auto rounded-md border bg-[#0d0d0d] p-3 font-mono text-[10px] leading-relaxed text-zinc-300 shadow-inner">
                                  <pre className="font-mono whitespace-pre-wrap">
                                    {prompt.promptContent}
                                  </pre>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(prompt.promptContent, prompt.step)}
                                  className={cn(
                                    'absolute top-2 right-2 rounded-md border border-white/10 bg-white/5 p-1.5 text-zinc-400 opacity-0 backdrop-blur-sm transition-all group-hover/code:opacity-100 hover:bg-white/10 hover:text-white',
                                    copiedStep === prompt.step &&
                                      'border-green-500/20 bg-green-500/10 text-green-500 opacity-100'
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
    </section>
  );
}
