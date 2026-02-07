'use client';

import { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDesign } from '../../hooks/use-design';
import { useAgentStore } from '../../stores/agent.store';
import { DottedGlowBackground } from '../../../../../components/ui/dotted-glow-background';
import { cn } from '@/lib/utils';

interface PromptEditorProps {
  workspaceId: string;
}

export function PromptEditor({ workspaceId }: PromptEditorProps) {
  const { createDesign } = useDesign(workspaceId);
  const { setAgentStatus } = useAgentStore();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      setAgentStatus('requirement_analyzer', 'processing');
      await createDesign(prompt);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4">
      {/* Background (same as Hero) */}
      <DottedGlowBackground
        className="pointer-events-none absolute inset-0 mask-radial-to-90% mask-radial-at-center"
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
      <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-4 py-1 text-sm text-neutral-700 backdrop-blur dark:border-neutral-800 dark:bg-black/40 dark:text-neutral-300"
        >
          ⚙️ AI System Design Workspace
        </motion.div>

        {/* Heading */}
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-neutral-800 md:text-5xl dark:text-neutral-100">
          Design your system.
          <br />
          <span className="text-neutral-500 dark:text-neutral-400">
            We handle the architecture.
          </span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-6 max-w-xl text-lg text-neutral-600 dark:text-neutral-400"
        >
          Describe your idea once. Specialized AI agents generate requirements, architecture, APIs,
          scaling strategy, and failure modes.
        </motion.p>

        {/* Prompt Box */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="relative rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Build a video streaming platform like YouTube for 10M users…"
              disabled={isSubmitting}
              className="w-full resize-none bg-transparent px-5 py-4 text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
              rows={4}
            />

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500 dark:border-neutral-800">
              <span>Press Enter to submit · Shift + Enter for new line</span>

              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isSubmitting}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all',
                  !prompt.trim() || isSubmitting
                    ? 'cursor-not-allowed bg-neutral-200 text-neutral-500 dark:bg-neutral-800'
                    : 'bg-black text-white hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-black'
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Generate Design
                    <ArrowUp className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mx-auto mt-6 flex flex-wrap justify-center gap-2 text-sm text-neutral-500"
        >
          {[
            'E-commerce platform',
            'Video streaming system',
            'Realtime chat application',
            'Ride sharing backend',
          ].map((idea) => (
            <button
              key={idea}
              onClick={() => setPrompt(`Build a ${idea}`)}
              className="rounded-full border border-neutral-300 px-3 py-1 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              {idea}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
