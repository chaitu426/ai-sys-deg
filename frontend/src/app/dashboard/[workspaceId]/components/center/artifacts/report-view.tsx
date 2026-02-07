'use client';

import { useState, useEffect } from 'react';
import { useDesignStore } from '../../../stores/design.store';
import {
  Requirements,
  SystemDesign,
  TechStack,
  Diagrams,
  ApiDesign,
  CostEstimation,
  DeploymentStrategy,
  FailureModeAnalysis,
} from '../../../types/design';
import { SectionHeader } from './common';
import { RequirementsView } from './requirements-view';
import { ArchitectureView } from './architecture-view';
import { TechStackView } from './tech-stack-view';
import { DiagramsView } from './diagrams-view';
import { ApiView } from './api-view';
import { CostView } from './cost-view';
import { DeploymentView } from './deployment-view';
import { FailureView } from './failure-view';
import { createPortal } from 'react-dom';

export function ReportView() {
  const { activeVersion, project } = useDesignStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!activeVersion || !project || !mounted) return null;

  return createPortal(
    <div
      id="professional-report"
      className="hidden w-full space-y-16 bg-white p-12 text-black print:block"
    >
      {/* Cover Page */}
      <div className="border-primary/20 flex h-[90vh] flex-col items-center justify-center space-y-8 border-b-2 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-black tracking-tighter text-black uppercase">
            System Design Specification
          </h1>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-600">{project.title}</h2>
        </div>

        <div className="bg-primary h-1 w-24" />

        <div className="mt-20 grid w-full max-w-2xl grid-cols-2 gap-12 text-left">
          <div>
            <p className="mb-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Project ID
            </p>
            <p className="font-mono text-sm font-bold">{project.id}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Version
            </p>
            <p className="text-sm font-bold">Release v{activeVersion.version}.0</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Date Generated
            </p>
            <p className="text-sm font-bold">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Status
            </p>
            <p className="text-sm font-bold text-emerald-600 uppercase">{activeVersion.status}</p>
          </div>
        </div>

        <div className="mt-auto pt-20 text-sm font-medium text-zinc-400 italic">
          {project.description}
        </div>
      </div>

      {/* Table of Contents - Simple List */}
      <div className="page-break-after">
        <h3 className="mb-8 border-b pb-4 text-xl font-bold tracking-widest uppercase">
          Table of Contents
        </h3>
        <ul className="space-y-4 text-sm font-medium">
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>1. Requirement Analysis</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>2. System Architecture</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>3. Technology Stack</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>4. System Visualizations</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>5. API Design Spec</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>6. Cost Projection</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>7. Cloud Strategy</span>
          </li>
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span>8. Failure Mode Analysis</span>
          </li>
        </ul>
      </div>

      {/* Content Sections */}
      <div className="space-y-24">
        {activeVersion.requirements && (
          <section className="page-break-before">
            <RequirementsView data={activeVersion.requirements as Requirements} />
          </section>
        )}

        {activeVersion.systemDesign && (
          <section className="page-break-before">
            <ArchitectureView data={activeVersion.systemDesign as SystemDesign} />
          </section>
        )}

        {activeVersion.techStack && (
          <section className="page-break-before">
            <TechStackView data={activeVersion.techStack as TechStack} />
          </section>
        )}

        {activeVersion.diagrams && (
          <section className="page-break-before">
            <DiagramsView data={activeVersion.diagrams as Diagrams} />
          </section>
        )}

        {activeVersion.apiDesign && (
          <section className="page-break-before">
            <ApiView data={activeVersion.apiDesign as ApiDesign} />
          </section>
        )}

        {activeVersion.costEstimation && (
          <section className="page-break-before">
            <CostView data={activeVersion.costEstimation as CostEstimation} />
          </section>
        )}

        {activeVersion.deploymentStrategy && (
          <section className="page-break-before">
            <DeploymentView data={activeVersion.deploymentStrategy as DeploymentStrategy} />
          </section>
        )}

        {activeVersion.failureModeAnalysis && (
          <section className="page-break-before">
            <FailureView data={activeVersion.failureModeAnalysis as FailureModeAnalysis} />
          </section>
        )}
      </div>

      {/* Footer for Print */}
      <div className="pointer-events-none fixed right-12 bottom-8 left-12 flex justify-between border-t pt-4 text-[8px] font-bold tracking-widest text-zinc-300 uppercase">
        <span>{project.title} - Confidential Technical Specification</span>
        <span>Page Draft</span>
      </div>
    </div>,
    document.body
  );
}
