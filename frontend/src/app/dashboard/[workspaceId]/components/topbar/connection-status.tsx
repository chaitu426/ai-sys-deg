'use client';

import { useSSEStore } from '../../stores/sse.store';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function ConnectionStatus() {
  const { isConnected, lastError } = useSSEStore();
  const isReconnecting = lastError?.includes('Reconnecting');

  return (
    <div
      className={`ml-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${isConnected
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : isReconnecting
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            : 'border-zinc-700 bg-zinc-800/50 text-zinc-400'
        } `}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Live</span>
        </>
      ) : isReconnecting ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="h-3 w-3" />
          </motion.div>
          <span>Reconnecting</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}

