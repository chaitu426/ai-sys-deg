'use client';

import { useAgentStore } from '../../stores/agent.store';
import { AGENT_DISPLAY_NAMES } from '../../types/agent';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, CheckCircle2, AlertCircle, Loader2, Cpu, Sparkles } from 'lucide-react';

export function ToolActivity() {
    const { activeTool, currentAgent } = useAgentStore();

    if (!activeTool) return null;

    const { toolName, status, agentType } = activeTool;

    // Format tool name: deep_research -> Deep Research
    const formattedToolName = toolName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    // Get agent display name
    const agentName = AGENT_DISPLAY_NAMES[agentType] || agentType;

    const getStatusConfig = () => {
        switch (status) {
            case 'started':
                return {
                    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
                    bgColor: 'bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20',
                    borderColor: 'border-violet-500/40',
                    textColor: 'text-violet-300',
                    iconColor: 'text-violet-400',
                    pulseColor: 'bg-violet-500',
                    label: 'Running'
                };
            case 'completed':
                return {
                    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                    bgColor: 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20',
                    borderColor: 'border-emerald-500/40',
                    textColor: 'text-emerald-300',
                    iconColor: 'text-emerald-400',
                    pulseColor: 'bg-emerald-500',
                    label: 'Complete'
                };
            case 'failed':
                return {
                    icon: <AlertCircle className="h-3.5 w-3.5" />,
                    bgColor: 'bg-gradient-to-r from-rose-500/20 to-red-500/20',
                    borderColor: 'border-rose-500/40',
                    textColor: 'text-rose-300',
                    iconColor: 'text-rose-400',
                    pulseColor: 'bg-rose-500',
                    label: 'Failed'
                };
            default:
                return {
                    icon: <Wrench className="h-3.5 w-3.5" />,
                    bgColor: 'bg-zinc-800/50',
                    borderColor: 'border-zinc-700',
                    textColor: 'text-zinc-300',
                    iconColor: 'text-zinc-400',
                    pulseColor: 'bg-zinc-500',
                    label: ''
                };
        }
    };

    const config = getStatusConfig();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${toolName}-${status}`}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`
                    relative flex items-center gap-3 rounded-xl border px-4 py-2
                    backdrop-blur-md shadow-lg
                    ${config.bgColor} ${config.borderColor}
                `}
            >
                {/* Pulse indicator for running state */}
                {status === 'started' && (
                    <motion.div
                        className={`absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${config.pulseColor}`}
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                {/* Agent Icon */}
                <div className={`flex items-center justify-center rounded-lg bg-zinc-800/60 p-1.5 ${config.iconColor}`}>
                    <Cpu className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-0.5">
                    {/* Tool Name */}
                    <div className="flex items-center gap-2">
                        <span className={config.iconColor}>
                            {config.icon}
                        </span>
                        <span className={`text-xs font-semibold tracking-tight ${config.textColor}`}>
                            {formattedToolName}
                        </span>
                        {status === 'started' && (
                            <motion.span
                                className="text-[10px] text-violet-400/80"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                •••
                            </motion.span>
                        )}
                    </div>

                    {/* Agent Name */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>{agentName}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`
                    ml-2 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider
                    ${status === 'started' ? 'bg-violet-500/30 text-violet-300' : ''}
                    ${status === 'completed' ? 'bg-emerald-500/30 text-emerald-300' : ''}
                    ${status === 'failed' ? 'bg-rose-500/30 text-rose-300' : ''}
                `}>
                    {config.label}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
