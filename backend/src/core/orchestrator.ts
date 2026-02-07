/**
 * Deterministic orchestration engine
 * Production-safe, idempotent, dependency-aware
 */

import { Queue } from 'bullmq';
import { prisma } from '../db/client';
import { getLogger } from '../utils/logger';
import { projectRepository } from '../db/repositories/project-repository';
import { getRedisConnection } from '../queue/connection';
import { AgentContext, AgentType, SharedMemory, AGENTS } from './contracts';

const logger = getLogger();



/**
 * Core execution order (hard dependencies)
 */
const CORE_AGENTS: AgentType[] = [
  AGENTS.REQUIREMENT_ANALYZER,
  AGENTS.SYSTEM_DESIGN,
  AGENTS.TECH_STACK,
  AGENTS.DIAGRAM_GENERATOR,
  AGENTS.API_DESIGN,
  AGENTS.COST_ESTIMATION,
  AGENTS.DEPLOYMENT_STRATEGY,
  AGENTS.FAILURE_MODE_ANALYZER,
];

/**
 * Optional agents (soft dependencies)
 */
export const OPTIONAL_AGENTS: AgentType[] = [
  AGENTS.API_DESIGN,
  AGENTS.COST_ESTIMATION,
  AGENTS.DEPLOYMENT_STRATEGY,
  AGENTS.FAILURE_MODE_ANALYZER,
];

export class Orchestrator {
  private agentQueues = new Map<AgentType, Queue>();
  private userPlanCache = new Map<string, string>(); // designVersionId -> userPlan

  constructor() {
    const agentTypes: AgentType[] = [...CORE_AGENTS];

    for (const agentType of agentTypes) {
      this.agentQueues.set(
        agentType,
        new Queue(`agent-${agentType}`, {
          connection: getRedisConnection() as any,
        })
      );
    }
  }

  /* ----------------------------- PUBLIC API ----------------------------- */

  async startDesignWorkflow(
    projectId: string,
    prompt: string,
    userPlan: string = 'FREE'
  ): Promise<string> {
    logger.info('Starting workflow', { projectId, userPlan });

    const designVersion = await projectRepository.createDesignVersion({
      projectId,
      prompt,
    });

    await projectRepository.updateDesignVersionStatus(designVersion.id, 'processing');

    await projectRepository.createAuditLog({
      designVersionId: designVersion.id,
      action: 'workflow_started',
      details: { prompt, userPlan },
    });

    // Store user plan in context for agent filtering
    this.userPlanCache.set(designVersion.id, userPlan);

    await this.enqueueAgentIfNeeded(designVersion.id, AGENTS.REQUIREMENT_ANALYZER);

    return designVersion.id;
  }

  async updateDesign(
    projectId: string,
    change: string,
    targetAgentType?: AgentType
  ): Promise<string> {
    logger.info('Updating design', { projectId, targetAgentType });

    // 1. Get latest version to base upon
    const latestVersion = await projectRepository.getDesignVersion(projectId);
    if (!latestVersion) {
      throw new Error('Project has no design version to update');
    }

    // 2. Create new version
    const newPrompt = `${latestVersion.prompt}\n\n[Version Update]\n${change}`;

    const newVersion = await projectRepository.createDesignVersion({
      projectId,
      prompt: newPrompt,
    });

    await projectRepository.updateDesignVersionStatus(newVersion.id, 'processing');

    // 3. Partial Execution Logic
    if (targetAgentType) {
      // Check plan limits for target agent
      const plan = await this.resolveEffectivePlan(newVersion.id);
      const { isAgentAllowed } = await import('../utils/plans');
      if (!isAgentAllowed(plan, targetAgentType)) {
        throw new Error(`Agent ${targetAgentType} is not allowed on plan ${plan}`);
      }

      // Identify upstream dependencies
      const upstreamAgents = this.getUpstreamAgents(targetAgentType);
      logger.info('Partial execution requested', { targetAgentType, upstreamAgents });

      // Copy outputs from previous version
      for (const agent of upstreamAgents) {
        const previousOutput = latestVersion.agentOutputs.find((o) => o.agentType === agent);
        if (previousOutput && previousOutput.status === 'completed' && previousOutput.output) {
          await projectRepository.createAgentOutput({
            designVersionId: newVersion.id,
            agentType: previousOutput.agentType as AgentType,
            status: 'completed',
            output: previousOutput.output as any,
            error: null as any,
          });
        } else {
          logger.error('Missing upstream output for partial execution', {
            agent,
            previousVersionId: latestVersion.id,
          });
          throw new Error(
            `Cannot perform partial update: Upstream dependency '${agent}' is missing or failed in the previous version.`
          );
        }
      }

      // Start from target agent
      await this.enqueueAgentIfNeeded(newVersion.id, targetAgentType);
    } else {
      // Standard full re-run from start
      await this.enqueueAgentIfNeeded(newVersion.id, AGENTS.REQUIREMENT_ANALYZER);
    }

    return newVersion.id;
  }

  async continueWorkflow(designVersionId: string, force = false): Promise<void> {
    const context = await this.buildContext(designVersionId);
    if (!context) return;

    // Check if workflow is paused
    const designVersion = await projectRepository.getDesignVersionById(designVersionId);
    if (!designVersion) return;

    // Check if workflow is paused or failed
    if (designVersion.status === 'paused' && !force) {
      logger.info('Workflow is paused, skipping continuation', { designVersionId });
      return;
    }
    if (designVersion.status === 'failed' && !force) {
      logger.info('Workflow is failed, aborting continuation', { designVersionId });
      return;
    }

    const nextAgents = await this.determineNextAgents(context, designVersionId);
    if (!nextAgents || nextAgents.length === 0) {
      // Check if all parallel agents are done before completing
      const isActuallyComplete = this.checkIfWorkflowComplete(context, nextAgents || []);
      if (isActuallyComplete) {
        await this.completeWorkflow(designVersionId);
      }
      return;
    }

    // Parallel Execution: Enqueue all next agents
    logger.info('Triggering next agents', { designVersionId, agents: nextAgents });
    await Promise.all(nextAgents.map(agent => this.enqueueAgentIfNeeded(designVersionId, agent)));
  }

  async triggerOptionalAgent(
    designVersionId: string,
    agentType: Extract<AgentType, (typeof OPTIONAL_AGENTS)[number]>
  ): Promise<void> {
    const context = await this.buildContext(designVersionId);
    if (!context) throw new Error('Context unavailable');

    // Strict Plan Check
    const plan = await this.resolveEffectivePlan(designVersionId);
    const { isAgentAllowed } = await import('../utils/plans');
    if (!isAgentAllowed(plan, agentType)) {
      throw new Error(`Agent ${agentType} is not allowed on plan ${plan}`);
    }

    this.assertDependencies(agentType, context);

    await this.enqueueAgentIfNeeded(designVersionId, agentType);
  }

  async pauseWorkflow(designVersionId: string): Promise<void> {
    logger.info('Pausing workflow', { designVersionId });
    await projectRepository.updateDesignVersionStatus(designVersionId, 'paused');
    await projectRepository.createAuditLog({
      designVersionId,
      action: 'workflow_paused',
    });
  }

  async resumeWorkflow(designVersionId: string): Promise<void> {
    logger.info('Resuming workflow', { designVersionId });
    await projectRepository.updateDesignVersionStatus(designVersionId, 'processing');
    await projectRepository.createAuditLog({
      designVersionId,
      action: 'workflow_resumed',
    });
    // Continue from where it left off
    await this.continueWorkflow(designVersionId, true);
  }

  async retryAgent(designVersionId: string, agentType: AgentType): Promise<void> {
    logger.info('Retrying agent', { designVersionId, agentType });

    // Strict Plan Check
    const plan = await this.resolveEffectivePlan(designVersionId);
    const { isAgentAllowed } = await import('../utils/plans');
    if (!isAgentAllowed(plan, agentType)) {
      throw new Error(`Cannot retry agent: Agent ${agentType} is not allowed on plan ${plan}`);
    }

    // 1. Reset the failed agent output to pending (instead of hard delete)
    const existing = await projectRepository.getAgentOutput(designVersionId, agentType);
    if (existing) {
      await projectRepository.updateAgentOutput(existing.id, {
        status: 'pending',
        error: undefined, // Clear previous error
      });
    }

    // 2. Set version status back to processing
    await projectRepository.updateDesignVersionStatus(designVersionId, 'processing');

    // 3. Enqueue the agent again
    // We can't use enqueueAgentIfNeeded because it skips 'pending' status.
    // We need to forcefully re-queue since we just set it to pending above.
    const partialContext = await this.buildContext(designVersionId);
    if (!partialContext) return;

    const context: AgentContext = {
      ...partialContext,
      agentType,
    };

    const queue = this.agentQueues.get(agentType);
    if (!queue) throw new Error(`Queue missing for ${agentType}`);

    await queue.add(
      `job-${designVersionId}-${agentType}`,
      { designVersionId, agentType, context },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    await projectRepository.createAuditLog({
      designVersionId,
      action: 'agent_retried',
      details: { agentType },
    });
  }

  /* ----------------------------- CORE LOGIC ----------------------------- */

  private async resolveEffectivePlan(designVersionId: string): Promise<string> {
    // Get user plan from cache
    let userPlan = this.userPlanCache.get(designVersionId) || 'FREE';

    // If plan is FREE, let's double check the DB just in case they upgraded recently
    if (userPlan === 'FREE') {
      try {
        const designVersion = await projectRepository.getDesignVersionById(designVersionId);
        if (designVersion) {
          const project = await prisma.project.findUnique({
            where: { id: designVersion.projectId },
            select: { userId: true },
          });

          const user = await prisma.user.findUnique({
            where: { id: project!.userId },
            select: { plan: true, currentPeriodEnd: true },
          });

          if (user) {
            const { resolveUserPlan } = await import('../utils/plans');
            const accuratePlan = resolveUserPlan(user);

            if (accuratePlan !== userPlan) {
              userPlan = accuratePlan;
              this.userPlanCache.set(designVersionId, userPlan); // Update cache
              logger.info('Accurate user plan detected in orchestrator', {
                designVersionId,
                userPlan,
              });
            }
          }
        }
      } catch (err) {
        logger.error('Failed to re-fetch user plan in orchestrator', err);
      }
    }
    return userPlan;
  }

  private getUpstreamAgents(target: AgentType): AgentType[] {
    const allAgents = [...CORE_AGENTS];
    const targetIndex = allAgents.indexOf(target);
    if (targetIndex === -1) return []; // Should not happen or is optional agent

    return allAgents.slice(0, targetIndex);
  }

  // Check if ALL CORE agents are done
  private checkIfWorkflowComplete(context: Omit<AgentContext, 'agentType'>, nextAgents: AgentType[]): boolean {
    // If we have next agents, we aren't done
    if (nextAgents.length > 0) return false;

    // Check if any agent is currently running
    const anyRunning = Object.values(context.agentStatuses).some(
      (status) => status === 'processing' || status === 'pending'
    );
    if (anyRunning) return false;

    // Check specific core agents that must be present
    // REQUIRED: The sequential phase + essential parallel agents
    // We treat diagram/api/cost/deployment/failure as OPTIONAL for the sake of "Blocking" the workflow.
    // However, we still "Require" them to have been attempted.
    // Using OPTIONAL_AGENTS from constant to consistency.

    // Core (Strictly Required) - effectively the sequential ones + System Design + Tech Stack
    // Logic: Required means "If this is missing, the design is incomplete".
    const strictlyRequired = [
      AGENTS.REQUIREMENT_ANALYZER,
      AGENTS.SYSTEM_DESIGN,
      AGENTS.TECH_STACK,
    ];

    for (const agent of strictlyRequired) {
      if (context.agentStatuses[agent] !== 'completed') {
        return false;
      }
    }

    return true;
  }

  private async buildContext(
    designVersionId: string
  ): Promise<Omit<AgentContext, 'agentType'> | null> {
    const designVersion = await projectRepository.getDesignVersionById(designVersionId);
    if (!designVersion) return null;

    const previousOutputs: AgentContext['previousOutputs'] = {};

    for (const output of designVersion.agentOutputs) {
      if (output.status !== 'completed' || !output.output) continue;

      previousOutputs[this.getOutputKey(output.agentType as AgentType)] = output.output as any;
    }

    return {
      designVersionId,
      projectId: (designVersion as any).projectId,
      prompt: designVersion.prompt,
      sharedMemory: (designVersion.sharedMemory as unknown as SharedMemory) || {
        decisions: [],
        constraints: [],
        risks: [],
        insights: {},
      },
      previousOutputs,
      agentStatuses: designVersion.agentOutputs.reduce((acc, curr) => {
        acc[curr.agentType] = curr.status as any;
        return acc;
      }, {} as Record<string, 'pending' | 'processing' | 'completed' | 'failed'>),
    };
  }

  private async determineNextAgents(
    context: Omit<AgentContext, 'agentType'>,
    designVersionId: string
  ): Promise<AgentType[]> {
    const userPlan = await this.resolveEffectivePlan(designVersionId);

    // Import plan helper (dynamic to avoid circular deps)
    const { isAgentAllowed } = await import('../utils/plans');

    const nextAgents: AgentType[] = [];

    // PHASE 1: Sequential Foundation
    if (!context.previousOutputs.requirementAnalyzer) {
      if (isAgentAllowed(userPlan, AGENTS.REQUIREMENT_ANALYZER)) {
        nextAgents.push(AGENTS.REQUIREMENT_ANALYZER);
      }
      return nextAgents; // Only run one sequential agent at a time
    }
    if (!context.previousOutputs.systemDesign) {
      if (isAgentAllowed(userPlan, AGENTS.SYSTEM_DESIGN)) {
        nextAgents.push(AGENTS.SYSTEM_DESIGN);
      }
      return nextAgents;
    }
    if (!context.previousOutputs.techStack) {
      if (isAgentAllowed(userPlan, AGENTS.TECH_STACK)) {
        nextAgents.push(AGENTS.TECH_STACK);
      }
      return nextAgents;
    }

    // PHASE 2: Parallel Execution
    // Once Tech Stack is done, we can run all specific agents in parallel
    // CHECK: For each agent, if it's NOT completed AND NOT failed (if optional), queue it.

    const parallelAgents = [
      AGENTS.DIAGRAM_GENERATOR,
      AGENTS.API_DESIGN,
      AGENTS.COST_ESTIMATION,
      AGENTS.DEPLOYMENT_STRATEGY,
      AGENTS.FAILURE_MODE_ANALYZER
    ];

    for (const agent of parallelAgents) {
      // Skip if already completed
      if (context.agentStatuses[agent] === 'completed') continue;

      // Skip if currently processing/pending
      if (context.agentStatuses[agent] === 'pending' || context.agentStatuses[agent] === 'processing') continue;

      // Skip if failed AND optional (Retry logic in worker handles transient, so this is final failure)
      // Diagram Generator is also implicitly optional in this logic if we want.
      // Let's check against OPTIONAL_AGENTS list + Diagram Generator
      const isOptional = OPTIONAL_AGENTS.includes(agent) || agent === AGENTS.DIAGRAM_GENERATOR;

      if (context.agentStatuses[agent] === 'failed' && isOptional) {
        continue; // Give up on this agent
      }

      // If not failed (or failed but required/retryable? No, worker handles retries), 
      // effectively: if we are here, it's either unrepresented (undefined) OR failed-but-required.
      // If it logic failed-but-required, we probably should re-try? 
      // But worker marks DB as failed. If we add it here, we infinitely retry?
      // NO, we rely on the manual "retryAgent" action for required failures?
      // OR we fatal error the workflow.
      // If Required agent fails, 'checkIfWorkflowComplete' won't return true (it checks statuses), 
      // and determineNextAgents will return it here IF it's not checked?
      // Wait, if it failed, it's in the list.
      // If we return it here, 'enqueueAgentIfNeeded' will see it as 'failed', reset to 'pending' and re-run.
      // That IS an infinite loop for required agents.
      // BUT `workers.ts` sets DesignVersion status to 'failed' for required agents.
      // So the whole workflow stops processing agents because `continueWorkflow` ... 
      // `continueWorkflow` logic: gets context. 
      // Does `continueWorkflow` check for 'failed' design version?
      // No. 
      // But `workers.ts` sets status 'failed'. 
      // We probably should check designVersion.status in `continueWorkflow`.

      if (isAgentAllowed(userPlan, agent)) {
        nextAgents.push(agent);
      } else {
        logger.debug('Agent skipped due to plan limits', {
          designVersionId,
          agentType: agent,
          userPlan
        });
      }
    }

    // If there are parallel agents to run, return them
    if (nextAgents.length > 0) {
      return nextAgents;
    }

    return [];
  }

  private async enqueueAgentIfNeeded(designVersionId: string, agentType: AgentType): Promise<void> {
    const existing = await projectRepository.getAgentOutput(designVersionId, agentType);

    if (
      existing?.status === 'completed' ||
      existing?.status === 'pending' ||
      existing?.status === 'processing'
    ) {
      logger.debug('Skipping agent (already handled)', {
        designVersionId,
        agentType,
        status: existing.status,
      });
      return;
    }

    const partialContext = await this.buildContext(designVersionId);
    if (!partialContext) return;

    this.assertDependencies(agentType, partialContext);

    const context: AgentContext = {
      ...partialContext,
      agentType,
    };

    // Use atomic upsert to prevent race conditions
    try {
      if (existing) {
        // Update existing failed/pending output
        await projectRepository.updateAgentOutput(existing.id, {
          status: 'pending',
          error: undefined,
        });
      } else {
        // Create new output
        await projectRepository.createAgentOutput({
          designVersionId,
          agentType,
          status: 'pending',
        });
      }
    } catch (error: any) {
      // P2002 is Prisma's unique constraint violation code
      if (error.code === 'P2002') {
        logger.warn('Race condition detected: Agent already enqueued by another process', {
          designVersionId,
          agentType,
          status: 'race_condition'
        });
        return;
      }
      throw error;
    }

    const queue = this.agentQueues.get(agentType);
    if (!queue) throw new Error(`Queue missing for ${agentType}`);

    await queue.add(
      `job-${designVersionId}-${agentType}`,
      { designVersionId, agentType, context },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    await projectRepository.createAuditLog({
      designVersionId,
      action: 'agent_enqueued',
      details: { agentType },
    });
  }

  private assertDependencies(agentType: AgentType, context: Omit<AgentContext, 'agentType'>) {
    if (OPTIONAL_AGENTS.includes(agentType)) {
      if (!context.previousOutputs.systemDesign) {
        throw new Error(`${agentType} requires system_design output`);
      }
    }
  }

  private getOutputKey(agentType: AgentType): keyof AgentContext['previousOutputs'] {
    const map: Record<string, keyof AgentContext['previousOutputs']> = {
      [AGENTS.REQUIREMENT_ANALYZER]: 'requirementAnalyzer',
      [AGENTS.SYSTEM_DESIGN]: 'systemDesign',
      [AGENTS.TECH_STACK]: 'techStack',
      [AGENTS.DIAGRAM_GENERATOR]: 'diagramGenerator',
      [AGENTS.API_DESIGN]: 'apiDesign',
      [AGENTS.COST_ESTIMATION]: 'costEstimation',
      [AGENTS.DEPLOYMENT_STRATEGY]: 'deploymentStrategy',
      [AGENTS.FAILURE_MODE_ANALYZER]: 'failureModeAnalyzer',
    };
    return map[agentType];
  }

  private async completeWorkflow(designVersionId: string): Promise<void> {
    await projectRepository.updateDesignVersionStatus(designVersionId, 'completed');

    await projectRepository.createAuditLog({
      designVersionId,
      action: 'workflow_completed',
    });

    // Emit workflow completed event
    const designVersion = await projectRepository.getDesignVersionById(designVersionId);
    if (designVersion) {
      const { designEvents } = await import('../utils/event-emitter');
      designEvents.emitWorkflowCompleted({
        projectId: designVersion.projectId,
        designVersionId,
        status: 'completed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  async close(): Promise<void> {
    for (const queue of this.agentQueues.values()) {
      await queue.close();
    }
  }
}

/* ----------------------------- SINGLETON ----------------------------- */

let instance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!instance) instance = new Orchestrator();
  return instance;
}
