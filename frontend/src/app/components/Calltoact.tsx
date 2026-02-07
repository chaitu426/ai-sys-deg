'use client';

import React from 'react';
import { DottedGlowBackground } from '../../components/ui/dotted-glow-background';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CallToAction() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800">
      {/* Background */}
      <DottedGlowBackground
        className="pointer-events-none absolute inset-0 mask-radial-to-90% mask-radial-at-center opacity-30 dark:opacity-100"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-8 py-16 text-center md:flex-row md:items-center md:justify-between md:text-left">
        {/* Text */}
        <div className="max-w-xl">
          <h2 className="text-4xl font-medium tracking-tight text-neutral-900 sm:text-5xl dark:text-neutral-200">
            Ship real systems with{' '}
            <span className="font-semibold text-neutral-900 underline decoration-white underline-offset-4 dark:text-white">
              Systemly
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            From architecture diagrams to tech stack blueprints and validation. Fame Systemly
            orchestrates specialized AI agents to ensure your technical foundation is
            production-grade.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href={isAuthenticated ? '/dashboard' : '/signup'}>
            <button className="flex items-center gap-2 rounded-xl bg-neutral-900 px-8 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-xl dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
              {isAuthenticated ? 'Go to Dashboard' : 'Start Building'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>

          <button className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-8 py-3 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800">
            See Agent Workflow
          </button>
        </div>
      </div>
    </section>
  );
}
