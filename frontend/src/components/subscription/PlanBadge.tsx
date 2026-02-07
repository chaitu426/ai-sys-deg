'use client';

import { cn } from '@/lib/utils';
import { Crown, Zap, User } from 'lucide-react';
import Link from 'next/link';

interface PlanBadgeProps {
  plan: 'FREE' | 'PRO' | 'PREMIUM';
  showUpgrade?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function PlanBadge({ plan, showUpgrade = true, size = 'md', className }: PlanBadgeProps) {
  const config = {
    FREE: {
      label: 'Free',
      icon: User,
      bg: 'bg-neutral-700/50 border-neutral-600/50',
      text: 'text-neutral-300',
      iconColor: 'text-neutral-400',
    },
    PRO: {
      label: 'Pro',
      icon: Zap,
      bg: 'bg-blue-500/20 border-blue-500/30',
      text: 'text-blue-300',
      iconColor: 'text-blue-400',
    },
    PREMIUM: {
      label: 'Architect',
      icon: Crown,
      bg: 'bg-gradient-to-r from-purple-500/20 to-amber-500/20 border-purple-500/30',
      text: 'text-purple-200',
      iconColor: 'text-amber-400',
    },
  };

  const { label, icon: Icon, bg, text, iconColor } = config[plan];

  const badge = (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        bg,
        size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1',
        className
      )}
    >
      <Icon className={cn(iconColor, size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span className={cn('font-medium', text, size === 'sm' ? 'text-xs' : 'text-sm')}>
        {label}
      </span>
    </div>
  );

  if (showUpgrade && plan === 'FREE') {
    return (
      <Link href="/#pricing" className="group flex items-center gap-2">
        {badge}
        <span className="text-xs text-neutral-500 transition-colors group-hover:text-blue-400">
          Upgrade →
        </span>
      </Link>
    );
  }

  return badge;
}
