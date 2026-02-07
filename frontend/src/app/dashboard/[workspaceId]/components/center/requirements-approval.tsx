'use client';

import { useState } from 'react';
import { useDesignStore } from '../../stores/design.store';
import { useDesign } from '../../hooks/use-design';
import {
  Check,
  X,
  Shield,
  Zap,
  Target,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeRender } from './artifacts/common';

interface RequirementsApprovalProps {
  workspaceId: string;
}

export function RequirementsApproval({ workspaceId }: RequirementsApprovalProps) {
  const { requirements } = useDesignStore();
  const { approveRequirements, updateDesign } = useDesign(workspaceId);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!requirements) return null;

  // Only show if we don't have questions (if we have questions, we are in QA mode)
  if (requirements.questions && requirements.questions.length > 0) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveRequirements(requirements as any);
    } catch (error) {
      console.error(error);
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!feedback.trim()) return;
    setIsRejecting(true);
    try {
      // Re-run requirement analysis with user feedback
      await updateDesign(feedback, 'requirement_analyzer');
      setShowRejectInput(false);
      setFeedback('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsRejecting(false);
    }
  };

  const sections = [
    {
      title: 'Functional Requirements',
      icon: <Target className="h-4 w-4" />,
      items: requirements.functionalRequirements || [],
    },
    {
      title: 'Non-Functional Requirements',
      icon: <Shield className="h-4 w-4" />,
      items: requirements.nonFunctionalRequirements || [],
    },
    {
      title: 'Assumptions & Constraints',
      icon: <Lightbulb className="h-4 w-4" />,
      items: requirements.assumptions || [],
    },
  ];

  return (
    <div className="animate-in fade-in zoom-in mx-auto w-full max-w-4xl space-y-6 pb-20 duration-500">
      <div className="border-border bg-card mb-8 rounded-lg border p-6 shadow-sm">
        <h2 className="text-foreground mb-2 flex items-center gap-2 text-xl font-bold tracking-tight">
          <Zap className="text-foreground h-5 w-5" />
          Requirements Analysis Complete
        </h2>
        <p className="text-muted-foreground text-sm">
          Review the generated requirements before proceeding to system design.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-card border-border hover:border-foreground/30 overflow-hidden rounded-lg border shadow-sm transition-colors"
          >
            <div className="border-border bg-muted/20 flex items-center gap-3 border-b p-4">
              <div className="text-foreground">{section.icon}</div>
              <h3 className="text-foreground text-sm font-bold tracking-wide uppercase">
                {section.title}
              </h3>
            </div>
            <ul className="space-y-3 p-4">
              {section.items.length > 0 ? (
                section.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-muted-foreground flex gap-3 text-sm leading-relaxed"
                  >
                    <div className="bg-foreground/40 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                    <SafeRender value={item} />
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground p-2 text-sm italic">No items generated</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Rejection Feedback Input */}
      {showRejectInput && (
        <div className="bg-background/40 animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border-border w-full max-w-lg space-y-4 overflow-hidden rounded-2xl border p-6 shadow-2xl">
            <div className="text-foreground flex items-center gap-3">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-bold">What should we change?</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Describe the adjustments needed for these requirements. The AI will regenerate them
              based on your feedback.
            </p>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Add support for offline mode, or emphasize security over speed..."
              className="border-border bg-muted/30 focus:ring-foreground/20 h-32 w-full resize-none rounded-xl border p-4 text-sm focus:ring-2 focus:outline-none"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRejectInput(false)}
                className="text-muted-foreground hover:text-foreground px-4 py-2 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!feedback.trim() || isRejecting}
                className="bg-foreground text-background hover:bg-foreground/90 flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Regenerate Requirements
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-background/80 border-border fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border p-2 pr-2 pl-6 shadow-2xl backdrop-blur-md">
        <span className="text-muted-foreground mr-2 text-xs font-bold tracking-wider uppercase">
          Action Required
        </span>

        {!showRejectInput && (
          <button
            onClick={() => setShowRejectInput(true)}
            className="border-border hover:bg-muted text-foreground flex items-center gap-2 rounded-full border px-6 py-2 text-xs font-bold transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Reject & Retry
          </button>
        )}

        <button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="bg-foreground hover:bg-foreground/90 text-background flex items-center gap-2 rounded-full px-6 py-2 text-xs font-bold shadow-lg transition-colors"
        >
          {isApproving ? 'Processing...' : 'Approve & Continue'}
          {!isApproving && <Check className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
