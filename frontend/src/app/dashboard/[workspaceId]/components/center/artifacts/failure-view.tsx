import { FailureModeAnalysis } from '../../../types/design';
import { SectionHeader, JsonFallback, ResearchSources, SafeRender } from './common';
import { Shield, AlertTriangle, Lightbulb, CheckCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FailureView({ data }: { data: FailureModeAnalysis }) {
  if (!data) return null;
  // Handle different data structures safely
  const risks = data.failureScenarios || data.risks || data.failureModes || [];

  return (
    <div className="space-y-12">
      <SectionHeader
        title="Failure Mode Analysis"
        subtitle="Resilience scoring and risk mitigation."
      />

      {/* Scoreboard */}
      {typeof data.resilienceScore === 'number' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="border-border bg-card col-span-1 flex flex-col items-center justify-center rounded-xl border p-6 text-center">
            <div className="relative mb-4">
              <Shield
                size={48}
                className={
                  data.resilienceScore > 80
                    ? 'text-white'
                    : data.resilienceScore > 50
                      ? 'text-zinc-400'
                      : 'text-zinc-600'
                }
              />
              <span className="text-background absolute inset-0 mt-1 flex items-center justify-center text-[10px] font-bold">
                {data.resilienceScore}
              </span>
            </div>
            <p className="text-foreground text-3xl font-bold">{data.resilienceScore}/100</p>
            <p className="text-muted-foreground mt-1 text-xs tracking-widest uppercase">
              Resilience Score
            </p>
          </div>
          <div className="col-span-2 space-y-4">
            {data.singlePointsOfFailure && data.singlePointsOfFailure.length > 0 && (
              <div className="rounded-lg border border-white/20 bg-white/5 p-5">
                <h5 className="mb-3 flex items-center gap-2 text-xs font-bold text-white uppercase">
                  <AlertTriangle size={14} /> Single Points of Failure
                </h5>
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {data.singlePointsOfFailure.map((spof, i) => (
                    <li key={i} className="text-foreground/80 flex gap-2 text-xs">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white" /> <SafeRender value={spof} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendations && (
              <div className="border-border bg-card rounded-lg border p-5">
                <h5 className="text-primary mb-3 flex items-center gap-2 text-xs font-bold uppercase">
                  <Lightbulb size={14} /> Key Recommendations
                </h5>
                <ul className="space-y-2">
                  {data.recommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="text-muted-foreground flex gap-2 text-xs">
                      <CheckCircle size={12} className="text-primary mt-0.5 shrink-0" /> <SafeRender value={rec} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(risks) && risks.length > 0 ? (
        <div className="space-y-6">
          <h4 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Activity size={16} /> Failure Scenarios
          </h4>
          {risks.map((risk: any, i: number) => {
            const impact = String(risk.impact || 'medium').toLowerCase();
            const isHighImpact = impact === 'high' || impact === 'critical';

            return (
              <div
                key={i}
                className="group bg-card border-border overflow-hidden rounded-xl border shadow-sm transition-all hover:border-white/30"
              >
                <div className="divide-border flex flex-col divide-y md:flex-row md:divide-x md:divide-y-0">
                  <div className="bg-muted/10 p-6 md:w-1/3">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertTriangle
                        size={14}
                        className={cn(isHighImpact ? 'text-white' : 'text-zinc-400')}
                      />
                      <span className="text-muted-foreground/60 text-[10px] font-bold tracking-[0.2em] uppercase">
                        Risk Source
                      </span>
                    </div>
                    <h4 className="text-foreground mb-2 text-lg font-bold">
                      {risk.scenario || risk.component || risk.source || 'Unknown Risk'}
                    </h4>
                    <div className="mt-4 flex items-center gap-4">
                      <div>
                        <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">
                          Impact
                        </p>
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                            isHighImpact
                              ? 'bg-white/10 text-white'
                              : 'bg-zinc-500/10 text-zinc-400'
                          )}
                        >
                          {impact}
                        </span>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">
                          Probability
                        </p>
                        <span className="bg-muted text-foreground/70 rounded px-2 py-0.5 text-[10px] font-bold uppercase">
                          {risk.probability || 'low'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 p-6">
                    <div>
                      <h5 className="text-muted-foreground mb-1 text-[10px] font-bold tracking-wider uppercase">
                        Description
                      </h5>
                      <p className="text-foreground/80 text-sm leading-relaxed font-medium">
                        {risk.description || risk.mode || risk.failureMode}
                      </p>
                    </div>
                    <div className="border-border/50 border-t pt-4">
                      <h5 className="text-primary mb-2 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                        <Shield size={12} />
                        Mitigation Strategy
                      </h5>
                      <div className="text-muted-foreground text-sm leading-relaxed italic">
                        {Array.isArray(risk.mitigation) ? (
                          <ul className="list-disc space-y-1 pl-4">
                            {risk.mitigation.map((m: string, idx: number) => (
                              <li key={idx}><SafeRender value={m} /></li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            {risk.mitigation || risk.strategy || 'No mitigation strategy provided.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <JsonFallback data={data} />
      )
      }

      <ResearchSources
        sources={data.researchSources}
        title="Resilience Research"
        subtitle="Web research on common failure modes and mitigation best practices for this stack."
      />
    </div >
  );
}
