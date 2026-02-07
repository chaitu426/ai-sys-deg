'use client';

import { useState } from 'react';
import { useDesign } from '../../hooks/use-design';
import { useDesignStore } from '../../stores/design.store';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeRender } from './artifacts/common';

interface QAPanelProps {
  workspaceId: string;
}

export function QAPanel({ workspaceId }: QAPanelProps) {
  const { requirements } = useDesignStore();
  const { submitAnswers } = useDesign(workspaceId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Requirements artifact might contain questions if standard flow
  // Ideally this would be passed explicitly or found in a specific "pending questions" state
  // For this implementation we check the requirements object for questions field
  const questions = requirements?.questions || [];

  if (!questions || questions.length === 0) return null;

  const handleAnswerChange = (question: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) return;

    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([q, a]) => ({
        question: q,
        answer: a,
      }));
      await submitAnswers(formattedAnswers);
      // UI update handled by SSE/Store
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const allAnswered = questions.every((q) => answers[q]?.trim());

  return (
    <div className="bg-card border-border animate-in slide-in-from-bottom-5 mx-auto w-full max-w-2xl space-y-8 rounded-lg border p-8 shadow-2xl duration-500">
      <div className="flex items-center gap-4">
        <div className="bg-muted rounded-full p-3">
          <MessageSquare className="text-foreground h-5 w-5" />
        </div>
        <div>
          <h3 className="text-foreground text-xl font-bold tracking-tight">Clarifying Questions</h3>
          <p className="text-muted-foreground text-sm">
            The AI architect needs more context to proceed.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, idx) => (
          <div key={idx} className="space-y-3">
            <label className="text-foreground/90 block text-sm font-semibold">
              {idx + 1}. <SafeRender value={question} />
            </label>
            <input
              type="text"
              value={answers[question] || ''}
              onChange={(e) => handleAnswerChange(question, e.target.value)}
              placeholder="Type a detailed answer..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-foreground focus:border-foreground w-full rounded-md border p-3 transition-all outline-none focus:ring-1"
              disabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <div className="border-border/50 flex justify-end border-t pt-4">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className={cn(
            'flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-bold tracking-wide transition-all',
            !allAnswered || isSubmitting
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-foreground/10 shadow-lg'
          )}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          {!isSubmitting && <Send className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
