import { useState, useEffect } from 'react';
import { useDesignStore } from '../../stores/design.store';
import { useAgentStore } from '../../stores/agent.store';
import { useAuthStore } from '@/lib/stores/auth.store';
import {
  Box,
  Layers,
  Globe,
  Server,
  Activity,
  DollarSign,
  FileText,
  AlertTriangle,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plan, PLAN_LIMITS } from '@/lib/plans';
import Link from 'next/link';
import { toast } from 'sonner';
import { AgentType } from '../../types/agent';
import {
  Requirements,
  SystemDesign,
  TechStack,
  Diagrams,
  ApiDesign,
  CostEstimation,
  DeploymentStrategy,
  FailureModeAnalysis,
} from '../../types/design';

import { RequirementsView } from './artifacts/requirements-view';
import { ArchitectureView } from './artifacts/architecture-view';
import { TechStackView } from './artifacts/tech-stack-view';
import { DiagramsView } from './artifacts/diagrams-view';
import { ApiView } from './artifacts/api-view';
import { CostView } from './artifacts/cost-view';
import { DeploymentView } from './artifacts/deployment-view';
import { FailureView } from './artifacts/failure-view';
import { ReportView } from './artifacts/report-view';
import { ArtifactSkeleton } from './artifacts/artifact-skeleton';
import { useDesign } from '../../hooks/use-design';
import { useParams } from 'next/navigation';

export function ArtifactsViewer() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { activeVersion } = useDesignStore();
  const { agentStatuses } = useAgentStore();
  const { retryAgent } = useDesign(workspaceId);
  const { user } = useAuthStore();
  const { getWhiteboards, saveWhiteboard } = useDesign(workspaceId);
  const { whiteboardData, loadWhiteboards } = useDesignStore();
  const [activeTab, setActiveTab] = useState('requirement_analyzer');

  // Load whiteboards once
  useEffect(() => {
    if (Object.keys(whiteboardData).length === 0) {
      getWhiteboards().then(wbs => {
        if (wbs) loadWhiteboards(wbs);
      });
    }
  }, [workspaceId, getWhiteboards, loadWhiteboards, whiteboardData]);

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const userPlan = (user?.plan as Plan) || Plan.FREE;
  const allowedAgents = PLAN_LIMITS[userPlan]?.agents || [];
  const isPremium = userPlan === Plan.PREMIUM;

  // Helper to determine if content exists
  const hasContent = (content: any) => content && Object.keys(content).length > 0;

  const tabs = [
    {
      id: 'requirement_analyzer',
      label: 'Requirement Analysis',
      icon: FileText,
      content: activeVersion?.requirements,
      agentType: 'requirement_analyzer' as AgentType,
    },
    {
      id: 'system_design',
      label: 'Architecture',
      icon: Box,
      content: activeVersion?.systemDesign,
      agentType: 'system_design' as AgentType,
    },
    {
      id: 'tech_stack',
      label: 'Tech Stack',
      icon: Layers,
      content: activeVersion?.techStack,
      agentType: 'tech_stack' as AgentType,
    },
    {
      id: 'api_design',
      label: 'API Specifications',
      icon: Server,
      content: activeVersion?.apiDesign,
      agentType: 'api_design' as AgentType,
    },
    {
      id: 'cost_estimation',
      label: 'Cost Projection',
      icon: DollarSign,
      content: activeVersion?.costEstimation,
      agentType: 'cost_estimation' as AgentType,
    },
    {
      id: 'deployment_strategy',
      label: 'Cloud Strategy',
      icon: Globe,
      content: activeVersion?.deploymentStrategy,
      agentType: 'deployment_strategy' as AgentType,
    },
    {
      id: 'failure_mode_analyzer',
      label: 'Failure Analysis',
      icon: AlertTriangle,
      content: activeVersion?.failureModeAnalysis,
      agentType: 'failure_mode_analyzer' as AgentType,
    },
    {
      id: 'diagram_generator',
      label: 'System Diagrams',
      icon: Activity,
      content: activeVersion?.diagrams,
      agentType: 'diagram_generator' as AgentType,
    },
  ].filter((tab) => allowedAgents.includes(tab.agentType));

  // Pipeline finish state
  const isProcessing = Object.values(agentStatuses).some((s) => s === 'processing');
  const isWorkflowComplete =
    !isProcessing &&
    allowedAgents.every((agent) => agentStatuses[agent as AgentType] === 'completed');
  const showUpgradePrompts = isWorkflowComplete && !isPremium;

  // Intelligent auto-switching: Follows the "Live" agent unless the user has manually picked a tab
  useEffect(() => {
    if (activeVersion && tabs.length > 0 && !hasInteracted) {
      const processingAgent = Object.entries(agentStatuses).find(
        ([, status]) => status === 'processing'
      );

      if (processingAgent) {
        const agentId = processingAgent[0];
        const targetTab = tabs.find((t) => t.id === agentId);
        if (targetTab && targetTab.id !== activeTab) {
          setActiveTab(targetTab.id);
        }
      }
    }
  }, [agentStatuses, tabs, activeTab, hasInteracted, activeVersion]);

  // Ensure current tab is valid if version changes
  useEffect(() => {
    if (activeVersion && tabs.length > 0) {
      const currentTabValid = tabs.some((t) => t.id === activeTab);
      if (!currentTabValid) {
        setActiveTab(tabs[0].id);
        setHasInteracted(false); // Reset interaction state on new version
      }
    }
  }, [activeVersion?.id, tabs, activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setHasInteracted(true);
    const label = tabs.find(t => t.id === tabId)?.label;
    toast(`Viewing ${label}`, {
      duration: 1500,
      position: 'bottom-center',
    });
  };


  const handleRetry = async (agentType: string) => {
    const label = tabs.find(t => t.id === agentType)?.label || agentType;
    const toastId = toast.loading(`Restarting ${label}...`);
    setIsActionLoading(true);
    try {
      await retryAgent(agentType as AgentType);
      toast.success(`${label} back in progress`, { id: toastId });
    } catch (err) {
      toast.error(`Failed to restart ${label}`, { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (tabs.length === 0) return null;

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;
  const isContentReady = hasContent(activeContent) && agentStatuses[activeTab as AgentType] !== 'processing';

  if (!activeVersion) return null;
  if (tabs.length === 0) return null;

  return (
    <div className="border-border bg-card animate-in fade-in slide-in-from-bottom-4 mb-6 flex h-full flex-col overflow-hidden rounded-2xl border shadow-xl duration-700">
      {/* Header */}
      <div className="border-border bg-muted/5 flex flex-col justify-between gap-4 border-b px-6 py-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2">
          <div className="bg-foreground/5 rounded-md p-1.5">
            <LayoutGrid size={14} className="text-foreground" />
          </div>
          <h2 className="text-foreground text-[10px] font-black tracking-[0.2em] uppercase">
            System Blueprint
          </h2>
        </div>

        {/* Scrollable Tabs Container */}
        <div className="no-scrollbar -mx-2 flex items-center gap-1 overflow-x-auto px-2 pb-2 sm:pb-0">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isProcessing = agentStatuses[tab.id as AgentType] === 'processing';
              const isCompleted = agentStatuses[tab.id as AgentType] === 'completed';

              return (
                <div key={tab.id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-[10px] font-black tracking-widest whitespace-nowrap uppercase transition-all',
                      activeTab === tab.id
                        ? 'bg-foreground text-background shadow-foreground/10 shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {isProcessing && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                    <Icon size={12} className={cn(isProcessing && 'animate-pulse text-white')} />
                    {tab.label}
                    {isCompleted && <CheckCircle2 size={10} className="text-white ml-1" />}
                  </button>
                  {agentStatuses[tab.id as AgentType] === 'failed' && (
                    <button
                      onClick={() => handleRetry(tab.id)}
                      disabled={isActionLoading}
                      className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                      title="Retry this agent"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-background/30 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-y-auto p-4 md:p-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mx-auto max-w-6xl"
        >
          {!isContentReady ? (
            <ArtifactSkeleton />
          ) : (
            <>
              {activeTab === 'requirement_analyzer' && (
                <RequirementsView data={activeContent as Requirements} />
              )}
              {activeTab === 'system_design' && (
                <ArchitectureView data={activeContent as SystemDesign} />
              )}
              {activeTab === 'tech_stack' && <TechStackView data={activeContent as TechStack} />}
              {activeTab === 'diagram_generator' && <DiagramsView data={activeContent as Diagrams} />}
              {activeTab === 'api_design' && <ApiView data={activeContent as ApiDesign} />}
              {activeTab === 'cost_estimation' && <CostView data={activeContent as CostEstimation} />}
              {activeTab === 'deployment_strategy' && (
                <DeploymentView data={activeContent as DeploymentStrategy} />
              )}
              {activeTab === 'failure_mode_analyzer' && (
                <FailureView data={activeContent as FailureModeAnalysis} />
              )}
            </>
          )}

          {/* Plan Completion Callout */}
          {showUpgradePrompts && (
            <div className="border-primary/20 from-primary/5 group relative mt-20 overflow-hidden rounded-3xl border bg-gradient-to-br via-transparent to-transparent p-8 backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20">
                <Sparkles size={120} className="text-primary rotate-12" />
              </div>

              <div className="relative z-10 max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase border border-white/20">
                  <CheckCircle2 size={12} />
                  Design Stage Complete
                </div>

                <h3 className="text-foreground mb-3 text-2xl font-bold">
                  {userPlan === Plan.FREE
                    ? "You've reached the limits of your Explorer plan."
                    : "You've completed the Builder pipeline."}
                </h3>

                <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                  {userPlan === Plan.FREE
                    ? 'The AI has generated the initial architecture and requirements. Upgrade to unlock specialized agents like API Design, Cost Estimation, and Failure Analysis.'
                    : 'All architectural agents have completed. To unlock advanced features like iterations (Update System) and professional exports (PDF, OpenAPI), upgrade to the Architect plan.'}
                </p>

                <Link
                  href="/#pricing"
                  className="bg-primary text-primary-foreground shadow-primary/20 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  {userPlan === Plan.FREE ? 'Upgrade to Builder' : 'Upgrade to Architect'}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <ReportView />
    </div>
  );
}
