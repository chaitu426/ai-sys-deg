'use client';

import { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDesign } from '../../hooks/use-design';
import { useAgentStore } from '../../stores/agent.store';
import { DottedGlowBackground } from '../../../../../components/ui/dotted-glow-background';
import { cn } from '@/lib/utils';
import { Github, Check, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useGitHubRepos } from '../../hooks/use-github-repos';

interface PromptEditorProps {
  workspaceId: string;
}

export function PromptEditor({ workspaceId }: PromptEditorProps) {
  const { createDesign } = useDesign(workspaceId);
  const { setAgentStatus } = useAgentStore();
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [isRepoMenuOpen, setIsRepoMenuOpen] = useState(false);

  const { repos, isLoading: isLoadingRepos } = useGitHubRepos();

  const handleConnectGitHub = () => {
    const token = useAuthStore.getState().token;
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/github?token=${token}&returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const initialAgent = selectedRepo ? 'repository_analyzer' : 'requirement_analyzer';
      setAgentStatus(initialAgent, 'processing');
      await createDesign(prompt, selectedRepo || undefined);
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
              <div className="flex items-center gap-4">
                <span>Press Enter to submit · Shift + Enter for new line</span>

                <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

                {/* GitHub Selector */}
                {!user?.githubId ? (
                  <button
                    onClick={handleConnectGitHub}
                    className="flex items-center gap-1.5 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    <Github className="h-3.5 w-3.5" />
                    Connect GitHub for Context
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsRepoMenuOpen(!isRepoMenuOpen)}
                      className="flex items-center gap-1.5 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" />
                      {selectedRepo ? (
                        <span className="max-w-[120px] truncate underline decoration-dotted">
                          {selectedRepo.split('/')[1]}
                        </span>
                      ) : (
                        "Select Repo"
                      )}
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {isRepoMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsRepoMenuOpen(false)} />
                        <div className="absolute bottom-full left-0 z-50 mb-2 w-64 max-h-60 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900">
                          {isLoadingRepos ? (
                            <div className="flex items-center justify-center p-3">
                              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            </div>
                          ) : repos.length === 0 ? (
                            <div className="p-3 text-center text-neutral-500">No repositories found</div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRepo(null);
                                  setIsRepoMenuOpen(false);
                                }}
                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <span>No Repository</span>
                                {!selectedRepo && <Check className="h-3.5 w-3.5" />}
                              </button>
                              {repos.map((repo) => (
                                <button
                                  key={repo.id}
                                  onClick={() => {
                                    setSelectedRepo(repo.fullName);
                                    setIsRepoMenuOpen(false);
                                  }}
                                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="truncate">{repo.name}</span>
                                    <span className="text-[10px] text-neutral-400 truncate">{repo.fullName}</span>
                                  </div>
                                  {selectedRepo === repo.fullName && <Check className="h-3.5 w-3.5" />}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

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
