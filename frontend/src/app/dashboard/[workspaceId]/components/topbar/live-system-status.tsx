'use client';

import { Activity } from 'lucide-react';

export function LiveSystemStatus() {
  return (
    <div className="ml-2 hidden items-center gap-4 border-l border-zinc-800 pl-4 md:flex">
      <div className="flex flex-col items-end">
        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
          System Load
        </span>
        <span className="font-mono text-xs text-zinc-300">24%</span>
      </div>
      <Activity className="h-4 w-4 text-violet-500" />
    </div>
  );
}
