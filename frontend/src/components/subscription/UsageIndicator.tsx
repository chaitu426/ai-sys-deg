'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';

interface UsageIndicatorProps {
  current: number;
  max: number;
  label?: string;
  showUpgrade?: boolean;
  className?: string;
}

export function UsageIndicator({
  current,
  max,
  label = 'projects',
  showUpgrade = true,
  className,
}: UsageIndicatorProps) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= max;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-400">
          {isUnlimited ? (
            <>∞ unlimited {label}</>
          ) : (
            <>
              {current} of {max} {label}
            </>
          )}
        </span>
        {showUpgrade && isNearLimit && !isAtLimit && (
          <Link href="/#pricing" className="text-amber-400 transition-colors hover:text-amber-300">
            Upgrade
          </Link>
        )}
        {showUpgrade && isAtLimit && (
          <Link
            href="/#pricing"
            className="font-medium text-red-400 transition-colors hover:text-red-300"
          >
            Limit reached
          </Link>
        )}
      </div>

      {!isUnlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-blue-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
