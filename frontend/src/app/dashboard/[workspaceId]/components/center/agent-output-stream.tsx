import { useAgentStore } from '../../stores/agent.store';
import { useDesignStore } from '../../stores/design.store';
import { AGENT_DISPLAY_NAMES } from '../../types/agent';
import { Terminal, Cpu, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function AgentOutputStream() {
  const { currentAgent, logs, activeTool } = useAgentStore();
  const { activeVersion } = useDesignStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, activeTool]);

  if (!currentAgent) return null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0a0a0b] font-mono text-[11px] selection:bg-primary/30">
      {/* Scanline Effect Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden opacity-[0.03]">
        <div className="h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* Terminal Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-white/20" />
            <div className="h-2 w-2 rounded-full bg-white/20" />
            <div className="h-2 w-2 rounded-full bg-white/20" />
          </div>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-2 text-white/50">
            <Terminal size={12} className="text-primary" />
            <span className="font-bold tracking-tighter uppercase opacity-80">
              System Console v4.0.2
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group">
            <div className="relative h-2 w-2">
              <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
              <div className="relative rounded-full h-2 w-2 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </div>
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">
              Active: {AGENT_DISPLAY_NAMES[currentAgent]}
            </span>
          </div>
        </div>
      </div>

      {/* Main Console Body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-2 scroll-smooth no-scrollbar"
      >
        <div className="mb-6 opacity-40 leading-relaxed">
          <div>[SYSTEM INITIALIZED: KERNEL_LOAD_SUCCESS]</div>
          <div>[ENCRYPTION_LAYER: ACTIVE]</div>
          <div>[AGENT_HANDSHAKE: ESTABLISHED]</div>
          <div className="text-primary/60 mt-2">Connecting to neural pipeline...</div>
        </div>

        <AnimatePresence initial={false}>
          {logs.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 leading-6"
            >
              <span className="shrink-0 opacity-20 text-[9px] mt-0.5 select-none">
                [{log.timestamp}]
              </span>
              <span className={cn(
                "flex-1 break-all",
                log.type === 'info' && "text-zinc-400",
                log.type === 'tool' && "text-white font-bold",
                log.type === 'success' && "text-white font-medium",
                log.type === 'error' && "text-zinc-500 font-black animate-pulse"
              )}>
                {log.type === 'tool' && <Zap size={10} className="inline mr-2 mb-0.5 text-white" />}
                {log.type === 'success' && <ShieldCheck size={10} className="inline mr-2 mb-0.5 text-white" />}
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Floating Cursor/Active indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className="h-4 w-2 bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          <span className="text-zinc-500 text-[9px] uppercase tracking-tighter">Awaiting system instructions...</span>
        </div>
      </div>

      {/* Console Footer Stats */}
      <div className="border-t border-white/5 bg-black/40 px-6 py-2 flex items-center justify-between text-[9px] text-white/20 uppercase tracking-widest font-bold">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Cpu size={10} /> Load: {(Math.random() * 40 + 20).toFixed(1)}%</span>
          <span>Buffer: 1024KB</span>
        </div>
        <div>
          Secure Session: design_v.{activeVersion?.id?.slice(0, 8) || 'unknown'}
        </div>
      </div>
    </div>
  );
}

