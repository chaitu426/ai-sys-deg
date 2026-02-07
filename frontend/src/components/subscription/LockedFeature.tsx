'use client';

import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LockedFeatureProps {
  featureName: string;
  requiredPlan: 'PRO' | 'PREMIUM';
  children?: React.ReactNode;
  className?: string;
  showPreview?: boolean;
}

export function LockedFeature({
  featureName,
  requiredPlan,
  children,
  className,
  showPreview = true,
}: LockedFeatureProps) {
  const planLabel = requiredPlan === 'PREMIUM' ? 'Architect' : 'Builder';
  const planColor = requiredPlan === 'PREMIUM' ? 'purple' : 'blue';

  return (
    <div className={cn('relative', className)}>
      {/* Blurred preview content */}
      {showPreview && children && (
        <div className="pointer-events-none opacity-60 blur-sm select-none">{children}</div>
      )}

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center',
          'bg-gradient-to-b from-transparent via-black/60 to-black/80',
          'rounded-xl backdrop-blur-[2px]'
        )}
      >
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              planColor === 'purple'
                ? 'border border-purple-500/30 bg-purple-500/20'
                : 'border border-blue-500/30 bg-blue-500/20'
            )}
          >
            <Lock
              className={cn(
                'h-6 w-6',
                planColor === 'purple' ? 'text-purple-400' : 'text-blue-400'
              )}
            />
          </div>

          <div>
            <h3 className="mb-1 text-lg font-semibold text-white">{featureName}</h3>
            <p className="max-w-xs text-sm text-neutral-400">
              This feature is available on the {planLabel} plan
            </p>
          </div>

          <Link
            href="/#pricing"
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-5 py-2.5',
              'text-sm font-medium transition-all duration-200',
              planColor === 'purple'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
            )}
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to {planLabel}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
