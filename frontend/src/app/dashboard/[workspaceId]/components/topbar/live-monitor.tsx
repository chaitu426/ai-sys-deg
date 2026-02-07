'use client';

import { useAgentStore } from '../../stores/agent.store';
import { AGENT_DISPLAY_NAMES } from '../../types/agent';
import { Terminal, Cpu, Zap, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function LiveMonitor() {
    const { currentAgent, logs, activeTool, agentStatuses } = useAgentStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    const isProcessing = Object.values(agentStatuses).some((s) => s === 'processing');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isProcessing && !currentAgent) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative hidden h-8 w-64 overflow-hidden rounded-md border border-white/10 bg-black/80 font-mono text-[9px] shadow-2xl lg:flex"
        >

            {/* Left Sidebar indicator */}
            <div className="flex w-8 flex-col items-center justify-center border-r border-white/10 bg-white/5">
                <div className="relative">
                    <Activity size={12} className="text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col justify-center px-3">
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-primary shrink-0 opacity-80 uppercase font-black tracking-tighter">Live //</span>
                        <span className="truncate text-white/50 uppercase tracking-widest leading-none">
                            {currentAgent ? AGENT_DISPLAY_NAMES[currentAgent] : 'Initializing...'}
                        </span>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="h-1 w-1 rounded-full bg-emerald-500/50" />
                    </div>
                </div>

                <div className="mt-0.5 flex items-center gap-2 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={logs[logs.length - 1]?.id || 'empty'}
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -5 }}
                            className="truncate text-white/80"
                        >
                            {activeTool ? (
                                <span className="text-amber-400 font-bold">
                                    <Zap size={8} className="inline mr-1 mb-0.5" />
                                    Running {activeTool.toolName}
                                </span>
                            ) : (
                                logs[logs.length - 1]?.message || 'Awaiting system stream...'
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats overlay */}
            <div className="absolute bottom-0.5 right-1 text-[7px] text-white/10 uppercase tracking-tighter">
                load: {(Math.random() * 20 + 10).toFixed(0)}%
            </div>
        </motion.div>
    );
}
