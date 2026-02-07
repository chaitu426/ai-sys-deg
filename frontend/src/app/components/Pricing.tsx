'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plan } from '@/lib/plans';
import { useAuthStore } from '@/lib/stores/auth.store';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/* -------------------- Agents -------------------- */
const AGENTS = [
  'Requirement Analyzer Agent',
  'Architecture Design Agent',
  'Tech Stack Decision Agent',
  'Scalability & Load Agent',
  'Data Flow & API Agent',
  'Failure & Reliability Agent',
  'Security & Auth Agent',
  'Cost & Trade-off Agent',
];

/* -------------------- Pricing -------------------- */
export function PricingSection() {
  const { isAuthenticated, token, user } = useAuthStore();
  const [loading, setLoading] = useState<Plan | null>(null);

  const plans = [
    {
      id: Plan.FREE,
      name: 'Starter',
      price: '₹0',
      description: 'Explore system design fundamentals with limited AI assistance.',
      meta: 'Best for students & early exploration',
      projects: '3 projects / month',
      agents: AGENTS.slice(0, 4),
      cta: 'Get started',
    },
    {
      id: Plan.PRO,
      name: 'Builder',
      price: '₹899 / month',
      description: 'Design complete, real-world architectures with full agent collaboration.',
      meta: 'Best for developers & solo builders',
      projects: '50 projects / month',
      agents: AGENTS,
      emphasized: true,
      cta: 'Upgrade to Pro',
    },
    {
      id: Plan.PREMIUM,
      name: 'Architect',
      price: '₹1999 / month',
      description: 'Production-ready outputs with export and upcoming advanced capabilities.',
      meta: 'Best for teams & serious delivery',
      projects: 'Unlimited projects',
      agents: AGENTS,
      extras: ['Export diagrams & documents', 'Early access to new agents'],
      cta: 'Go Premium',
    },
  ];

  async function handleSubscribe(plan: Plan) {
    if (plan === Plan.FREE) return;

    if (!isAuthenticated || !token) {
      toast.error('Please login to continue');
      return;
    }

    try {
      setLoading(plan);
      const res = await api.post<{ checkout_url: string }>(
        '/api/payments/checkout-session',
        {
          product_id:
            plan === Plan.PRO
              ? process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PRO
              : process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_PREMIUM,
          customer: { email: user?.email, name: user?.name },
          payment_link: true,
        },
        token
      );

      window.location.href = res.checkout_url;
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="relative z-20 mx-auto max-w-7xl py-20">
      {/* Header */}
      <div className="mb-14 px-8">
        <h4 className="text-center text-3xl font-medium tracking-tight text-black lg:text-5xl dark:text-white">
          Pricing
        </h4>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-neutral-500 lg:text-base dark:text-neutral-300">
          Clear limits. Predictable pricing. Scale when your system demands it.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 rounded-md border lg:grid-cols-3 dark:border-neutral-800">
        {plans.map((plan, idx) => {
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                'border-b p-6 sm:p-10 lg:border-b-0 dark:border-neutral-800',
                idx !== plans.length - 1 && 'lg:border-r',
                plan.emphasized && 'bg-neutral-50 dark:bg-neutral-900/40'
              )}
            >
              <div className="flex h-full flex-col">
                {/* Title */}
                <div>
                  <p className="text-xl font-medium text-black dark:text-white">{plan.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">{plan.meta}</p>

                  <p className="mt-4 text-3xl font-medium text-black dark:text-white">
                    {plan.price}
                  </p>

                  <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-300">
                    {plan.description}
                  </p>
                </div>

                {/* Limits */}
                <div className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">
                  <p>• {plan.projects}</p>
                </div>

                {/* Agents */}
                <div className="mt-6">
                  <p className="mb-2 text-xs tracking-wide text-neutral-400 uppercase">
                    Included Agents
                  </p>
                  <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {plan.agents.map((agent) => (
                      <li key={agent}>• {agent}</li>
                    ))}
                  </ul>
                </div>

                {/* Extras */}
                {plan.extras && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs tracking-wide text-neutral-400 uppercase">Extras</p>
                    <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {plan.extras.map((e) => (
                        <li key={e}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-auto pt-8">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    className={cn(
                      'w-full rounded-md border px-4 py-2 text-sm transition',
                      'border-neutral-300 dark:border-neutral-700',
                      'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                      'disabled:opacity-60'
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
