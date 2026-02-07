'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceShell } from './components/shell/workspace-shell';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useDesignStore } from './stores/design.store';
import { useAgentStore } from './stores/agent.store';
import { useUIStore } from './stores/uistore';
import { useDesignSSE } from './hooks/use-design-sse';
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Panels
import { ProjectList } from './components/left-sidebar/project-list';
import { RightSidebar } from './components/right-panel/right-sidebar';
import { ProjectHeader } from './components/topbar/project-header';
import { ConnectionStatus } from './components/topbar/connection-status';
import { ExportDropdown } from './components/topbar/export-dropdown';
import { ToolActivity } from './components/topbar/tool-activity';
import { LiveMonitor } from './components/topbar/live-monitor';

// Center Content
import { PromptEditor } from './components/center/prompt-editor';
import { AgentOutputStream } from './components/center/agent-output-stream';
import { QAPanel } from './components/center/qa-panel';
import { RequirementsApproval } from './components/center/requirements-approval';
import { ArtifactsViewer } from './components/center/artifacts-viewer';

export default function DashboardPage() {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const { token } = useAuthStore();
  const { setProject, setActiveVersion, requirements, activeVersion } = useDesignStore();
  const { agentStatuses } = useAgentStore();
  const { setLeftSidebarOpen, setRightSidebarOpen } = useUIStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Enable Real-time Updates via SSE - Handled in Layout/Bridge
  // useDesignSSE(workspaceId);

  useEffect(() => {
    if (workspaceId) {
      const fetchProject = async () => {
        try {
          const data = await api.get<any>(`/api/design/${workspaceId}`, token);
          if (data.success && data.project) {
            const {
              requirements,
              systemDesign,
              techStack,
              diagrams,
              apiDesign,
              costEstimation,
              deploymentStrategy,
              failureModeAnalysis,
              ...projectMeta
            } = data.project;

            setProject(projectMeta);

            setActiveVersion({
              id: data.project.versionId || 'v1',
              projectId: projectMeta.id,
              version: data.project.version || 1,
              status: data.project.status,
              createdAt: data.project.updatedAt,
              requirements,
              systemDesign,
              techStack,
              diagrams,
              apiDesign,
              costEstimation,
              deploymentStrategy,
              failureModeAnalysis,
            });

            // Synchronize paused state
            if (data.project.status === 'paused') {
              useAgentStore.getState().setIsPaused(true);
            } else {
              useAgentStore.getState().setIsPaused(false);
            }
          } else {
            useDesignStore.getState().reset();
            useAgentStore.getState().reset();
          }
        } catch (error) {
          console.error('Failed to fetch project:', error);
          useDesignStore.getState().reset();
          useAgentStore.getState().reset();
        } finally {
          setIsInitialLoading(false);
        }
      };
      fetchProject();
    }
  }, [workspaceId, token, setProject, setActiveVersion]);

  // View Logic
  const isProcessing = Object.values(agentStatuses).some((s) => s === 'processing');
  const hasStarted = Object.values(agentStatuses).some((s) => s !== 'pending');
  const hasQuestions = requirements?.questions && requirements.questions.length > 0;

  const isReqAnalyzerCompleted = agentStatuses.requirement_analyzer === 'completed';
  const isSystemDesignPending = !agentStatuses.system_design || agentStatuses.system_design === 'pending';
  const needsApproval = isReqAnalyzerCompleted && isSystemDesignPending && !hasQuestions && !requirements?.isApproved;

  // Sidebar Automation
  useEffect(() => {
    if (!isInitialLoading) {
      if (!hasStarted) {
        // Prompt Mode: Focus View (Close Sidebars)
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        // Workflow Mode: Orchestration View (Open Right Sidebar)
        // We keep Left Sidebar manual or as is, but ensuring Right is open for agent status
        setRightSidebarOpen(true);
      }
    }
  }, [hasStarted, setLeftSidebarOpen, setRightSidebarOpen, isInitialLoading]);

  // Panel Composition
  const LeftPanel = <ProjectList />;
  const RightPanel = <RightSidebar workspaceId={workspaceId} />;

  const TopBar = (
    <div className="flex min-w-0 flex-1 items-center justify-between px-2">
      <div className="flex-shrink-0">
        <ProjectHeader />
      </div>

      <div className="ml-4 flex items-center gap-2 md:gap-4">
        <ExportDropdown projectId={workspaceId} />
      </div>

      <div className="hidden items-center gap-4 xl:flex">
        <LiveMonitor />
      </div>
    </div>
  );

  if (isInitialLoading) {
    return (
      <WorkspaceShell leftPanel={LeftPanel} rightPanel={RightPanel} topBar={TopBar}>
        <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
          <div className="relative">
            <Loader2 className="text-primary/80 h-10 w-10 animate-spin" />
          </div>
          <div className="text-muted-foreground animate-pulse text-sm font-medium tracking-wide">
            Synchronizing Workspace...
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell leftPanel={LeftPanel} rightPanel={RightPanel} topBar={TopBar}>
      <div className="relative mx-auto w-full max-w-7xl py-4 md:py-8">
        <AnimatePresence mode="wait">
          {/* Initial State */}
          {!hasStarted && (
            <motion.div
              key="prompt-editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="pt-10 md:pt-20"
            >
              <PromptEditor workspaceId={workspaceId} />
            </motion.div>
          )}

          {/* Processing State removed from main flow to prevent interruption - handled by LiveMonitor in TopBar */}

          {/* Interaction States */}
          {hasQuestions && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4 md:py-8"
            >
              <QAPanel workspaceId={workspaceId} />
            </motion.div>
          )}

          {needsApproval && (
            <motion.div
              key="approval"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4 md:py-8"
            >
              <RequirementsApproval workspaceId={workspaceId} />
            </motion.div>
          )}

          {/* Result View - Shown even while processing after initial start */}
          {activeVersion && !needsApproval && !hasQuestions && hasStarted && (
            <motion.div
              key="artifacts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full"
            >
              <ArtifactsViewer />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </WorkspaceShell>
  );
}
