'use client';

import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeBannerProps {
  message: string;
  targetPlan?: 'PRO' | 'PREMIUM';
  dismissible?: boolean;
  variant?: 'inline' | 'floating';
  className?: string;
}

export function UpgradeBanner({
  message,
  targetPlan = 'PRO',
  dismissible = true,
  variant = 'inline',
  className,
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const planLabel = targetPlan === 'PREMIUM' ? 'Architect' : 'Builder';
  const isPremium = targetPlan === 'PREMIUM';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: variant === 'floating' ? 20 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: variant === 'floating' ? 20 : 0 }}
        className={cn(
          'relative overflow-hidden',
          variant === 'inline' && 'rounded-xl p-4',
          variant === 'floating' &&
            'fixed right-6 bottom-6 z-50 max-w-sm rounded-2xl p-5 shadow-2xl',
          isPremium
            ? 'border border-purple-500/20 bg-gradient-to-r from-purple-900/90 to-indigo-900/90'
            : 'border border-blue-500/20 bg-gradient-to-r from-blue-900/90 to-cyan-900/90',
          className
        )}
      >
        {/* Background glow effect */}
        <div
          className={cn(
            'absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-30 blur-3xl',
            isPremium ? 'bg-purple-500' : 'bg-blue-500'
          )}
        />

        <div className="relative flex items-center gap-4">
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              isPremium ? 'bg-purple-500/20' : 'bg-blue-500/20'
            )}
          >
            <Sparkles className={cn('h-5 w-5', isPremium ? 'text-purple-400' : 'text-blue-400')} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-white/90">{message}</p>
          </div>

          <Link
            href="/#pricing"
            className={cn(
              'flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              isPremium
                ? 'bg-purple-500 text-white hover:bg-purple-400'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            )}
          >
            Upgrade
          </Link>

          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 p-1 text-white/40 transition-colors hover:text-white/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
