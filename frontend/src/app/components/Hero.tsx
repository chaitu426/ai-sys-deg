'use client';

import React from 'react';
import { motion } from 'motion/react';
import { DottedGlowBackground } from '../../components/ui/dotted-glow-background';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  const { isAuthenticated, user } = useAuthStore();
  const userName = user?.name || user?.email?.split('@')[0];

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <DottedGlowBackground
        className="pointer-events-none absolute inset-0 mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-neutral-200"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto mt-10 max-w-5xl px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm text-zinc-300 backdrop-blur"
        >
          {isAuthenticated ? `Welcome back, ${userName}` : 'The Future of AI System Architecture'}
        </motion.div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-3xl font-bold tracking-tight text-neutral-800 md:text-5xl lg:text-7xl dark:text-neutral-100">
          {(isAuthenticated
            ? `Systemly: Your Design Command Center.`
            : 'Architect Complex Systems at the Speed of AI.'
          )
            .split(' ')
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.12,
                  ease: 'easeOut',
                }}
                className="mr-3 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mx-auto mt-6 max-w-2xl text-lg font-medium text-neutral-600 dark:text-neutral-400"
        >
          {isAuthenticated
            ? 'Your workspace is ready. Fame Systemly orchestrates specialized AI agents to refine your architecture, stack, and deployment strategies.'
            : 'From high-level intent to production-ready blueprints. Fame Systemly leverages a swarm of AI architects to design, validate, and optimize your entire technical ecosystem.'}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {isAuthenticated ? (
            <Link href="/dashboard">
              <button className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-white px-8 py-3 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20">
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                Enter Workspace
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <button className="group relative overflow-hidden rounded-xl bg-white px-8 py-3 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-white/20">
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                  Start Designing Free
                </button>
              </Link>
              <button className="rounded-xl border border-neutral-300 bg-white/50 px-8 py-3 text-sm font-bold text-neutral-900 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white dark:border-neutral-700 dark:bg-black/50 dark:text-white dark:hover:bg-neutral-900">
                Book a Demo
              </button>
            </>
          )}
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mx-auto mt-20 max-w-6xl rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-300 dark:border-neutral-700">
            <img
              src="/image1.png"
              alt="Product preview"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
