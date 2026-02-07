'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth.store';
import { PlanBadge } from '@/components/subscription';

export function ProjectHeader() {
  // For now, we'll use a placeholder. In production, this should come from user data.
  // The user's plan should be fetched and stored in auth store or a separate subscription store.
  const { user } = useAuthStore();

  // Default to FREE - in production, get this from user profile API
  const userPlan = (user as any)?.plan || 'FREE';

  return (
    <div className="flex items-center gap-3">
      <Link href="/" className="group flex items-center gap-1 transition-opacity hover:opacity-90">
        {/* Brand Text */}
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">Systemly</span>
        </div>

        {/* Beta Badge */}
        <span className="ml-1 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
          BETA
        </span>
      </Link>

      {/* Plan Badge */}
      <div className="hidden sm:block">
        <PlanBadge plan={userPlan} size="sm" />
      </div>
    </div>
  );
}
