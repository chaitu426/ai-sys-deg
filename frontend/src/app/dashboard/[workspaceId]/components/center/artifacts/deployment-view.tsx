import { DeploymentStrategy } from '../../../types/design';
import { SectionHeader, ResearchSources } from './common';
import { Globe, Server, Cpu, Zap, Activity, CheckCircle2 } from 'lucide-react';

export function DeploymentView({ data }: { data: DeploymentStrategy }) {
  if (!data) return null;

  return (
    <div className="space-y-14">
      <SectionHeader
        title="Cloud Strategy"
        subtitle="Infrastructure model, CI/CD pipelines, and environment configuration."
      />

      {/* Model & Release */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Deployment Model */}
        <div className="border-border bg-card rounded-xl border p-6">
          <div className="border-border mb-6 flex items-center gap-3 border-b pb-4">
            <Globe className="text-primary h-5 w-5" />
            <h4 className="text-sm font-bold tracking-widest uppercase">Infrastructure Model</h4>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] font-black uppercase">
                Deployment Model
              </p>
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                {data.deploymentModel}
              </p>
            </div>

            {data.disasterRecovery && (
              <div>
                <p className="text-muted-foreground mb-1 text-[10px] font-black uppercase">
                  Disaster Recovery
                </p>
                <p className="text-foreground/80 text-xs leading-relaxed whitespace-pre-line">
                  {data.disasterRecovery}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Release Strategy */}
        <div className="border-border bg-card rounded-xl border p-6">
          <div className="border-border mb-6 flex items-center gap-3 border-b pb-4">
            <Zap className="h-5 w-5 text-white" />
            <h4 className="text-sm font-bold tracking-widest uppercase">Release Strategy</h4>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] font-black uppercase">
                Rollback Policy
              </p>
              <p className="text-foreground text-xs leading-relaxed whitespace-pre-line">
                {data.rollbackStrategy}
              </p>
            </div>

            <div className="flex gap-3">
              {data.canaryDeployment && (
                <div className="bg-muted/20 border-border flex-1 rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-[9px] font-bold uppercase">Canary</p>
                  <p className="text-foreground text-[10px] font-medium">Enabled</p>
                </div>
              )}

              {data.blueGreenDeployment && (
                <div className="bg-muted/20 border-border flex-1 rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-[9px] font-bold uppercase">
                    Blue / Green
                  </p>
                  <p className="text-foreground text-[10px] font-medium">Supported</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Environments */}
      {data.environments?.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Server size={16} /> Environment Configuration
          </h4>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {data.environments.map((env, i) => (
              <div
                key={i}
                className="border-border bg-muted/5 flex flex-col gap-4 rounded-xl border p-6"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-foreground text-xs font-bold tracking-wider uppercase">
                    {env.name}
                  </h5>
                  <Cpu size={14} className="text-primary" />
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed">{env.purpose}</p>

                <div className="border-border/50 mt-auto border-t pt-4">
                  <p className="text-foreground/80 font-mono text-[11px] whitespace-pre-line">
                    {env.infrastructure}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CI/CD Pipeline */}
      {data.ciCd && (
        <div className="space-y-6">
          <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Activity size={16} /> Automated Pipeline (CI/CD)
          </h4>

          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-6 py-4">
              <Activity className="h-4 w-4 text-white" />
              <h5 className="text-[10px] font-black tracking-widest text-zinc-100 uppercase">
                {data.ciCd.pipeline}
              </h5>
            </div>

            {/* Stages */}
            <div className="overflow-x-auto p-6">
              <div className="flex min-w-max gap-4">
                {data.ciCd.stages.map((stage, i) => (
                  <div
                    key={i}
                    className="flex w-[140px] flex-col items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-4"
                  >
                    <div className="text-primary flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-center text-[10px] leading-tight font-semibold text-zinc-400 uppercase">
                      {typeof stage === 'string' ? stage : (stage as any).name || (stage as any).title || JSON.stringify(stage)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="flex flex-wrap gap-2 border-t border-zinc-800 px-6 py-5">
              {data.ciCd.tools.map((tool, i) => (
                <span
                  key={i}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-[10px] font-medium text-zinc-300"
                >
                  {typeof tool === 'string' ? tool : (tool as any).name || (tool as any).title || JSON.stringify(tool)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <ResearchSources
        sources={data.researchSources}
        title="Infrastructure Standards"
        subtitle="Whitepapers and release engineering patterns used for this deployment strategy."
      />
    </div>
  );
}
