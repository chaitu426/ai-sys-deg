import { SystemDesign } from '../../../types/design';
import { SectionHeader, JsonFallback, ResearchSources, SafeRender } from './common';
import {
  Box,
  Layers,
  ArrowRight,
  Activity,
  TrendingUp,
  Check,
  Shield,
  AlertOctagon,
} from 'lucide-react';

export function ArchitectureView({ data }: { data: SystemDesign }) {
  if (!data) return <JsonFallback data={data} />;

  return (
    <div className="space-y-16">
      <SectionHeader
        title="System Architecture"
        subtitle="High-level structure and component analysis."
      />

      {/* High Level Components */}
      {data.highLevelComponents && data.highLevelComponents.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Box size={16} /> High Level Components
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.highLevelComponents.map((comp, idx) => (
              <div
                key={idx}
                className="bg-card border-border group rounded-xl border p-6 transition-all hover:shadow-md"
              >
                <div className="mb-4">
                  <h5 className="text-foreground group-hover:text-primary mb-2 text-lg font-bold transition-colors">
                    {comp.name}
                  </h5>
                  <p className="text-muted-foreground line-clamp-2 h-10 text-xs leading-relaxed">
                    {comp.description}
                  </p>
                </div>
                {comp.responsibilities && (
                  <div className="border-border/50 space-y-2 border-t pt-4">
                    <span className="text-muted-foreground/60 text-[10px] font-bold tracking-wider uppercase">
                      Responsibilities
                    </span>
                    <ul className="space-y-1">
                      {comp.responsibilities.slice(0, 4).map((resp, rIdx) => (
                        <li
                          key={rIdx}
                          className="text-foreground/80 flex items-start gap-2 text-xs"
                        >
                          <ArrowRight size={10} className="text-primary/50 mt-0.5 shrink-0" />
                          <SafeRender value={resp} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Boundaries */}
      {data.serviceBoundaries && data.serviceBoundaries.length > 0 && (
        <div className="space-y-6">
          <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Layers size={16} /> Service Boundaries
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.serviceBoundaries.map((service, idx) => (
              <div
                key={idx}
                className="bg-muted/5 border-border flex flex-col rounded-lg border p-5"
              >
                <div className="mb-2 flex items-start justify-between">
                  <h5 className="text-foreground font-bold">{service.service}</h5>
                </div>
                <p className="text-muted-foreground mb-4 text-sm">{service.description}</p>
                <div className="mt-auto">
                  <div className="flex flex-wrap gap-2">
                    {service.responsibilities?.map((res, i) => (
                      <span
                        key={i}
                        className="bg-background border-border text-foreground/70 rounded border px-2 py-1 text-[10px]"
                      >
                        <SafeRender value={res} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Flow */}
      {data.dataFlow && (
        <div className="space-y-6">
          <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Activity size={16} /> Data Flow
          </h4>
          <div className="bg-card border-border rounded-xl border p-6">
            <p className="text-foreground/80 mb-6 text-sm italic">{data.dataFlow.description}</p>
            <div className="before:bg-border relative space-y-4 before:absolute before:inset-y-0 before:left-4 before:w-0.5">
              {data.dataFlow.flowSteps?.map((step, idx) => (
                <div key={idx} className="relative flex flex-col gap-1 pl-10">
                  <div className="bg-background border-primary absolute top-1.5 left-2 z-10 h-4 w-4 rounded-full border-2" />
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xs font-bold tracking-wider uppercase">
                      Step {step.step}
                    </span>
                  </div>
                  <p className="text-foreground text-sm font-medium">
                    <SafeRender value={step.description} />
                  </p>
                  {step.components && (
                    <div className="mt-1 flex gap-2">
                      {step.components.map((c, i) => (
                        <span
                          key={i}
                          className="bg-muted text-muted-foreground border-border/50 rounded border px-1.5 py-0.5 text-[10px]"
                        >
                          <SafeRender value={c} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {data.scalingStrategy && (
          <div className="space-y-4">
            <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
              <TrendingUp size={16} /> Scaling Strategy
            </h4>
            <div className="bg-muted/5 border-border space-y-4 rounded-lg border p-5">
              <div>
                <span className="text-muted-foreground mb-2 block text-[10px] font-bold uppercase">
                  Horizontal
                </span>
                <ul className="space-y-1">
                  {data.scalingStrategy.horizontalScaling?.map((s, i) => (
                    <li key={i} className="text-foreground/80 flex gap-2 text-xs">
                      <Check size={12} className="mt-0.5 text-green-500" /> <SafeRender value={s} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-muted-foreground mb-2 block text-[10px] font-bold uppercase">
                  Vertical
                </span>
                <ul className="space-y-1">
                  {data.scalingStrategy.verticalScaling?.map((s, i) => (
                    <li key={i} className="text-foreground/80 flex gap-2 text-xs">
                      <Check size={12} className="mt-0.5 text-green-500" /> <SafeRender value={s} />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-border border-t pt-2">
                <div className="mb-2">
                  <span className="text-muted-foreground mr-2 text-[10px] font-bold uppercase">
                    Database:
                  </span>
                  <span className="text-foreground text-xs">
                    <SafeRender value={data.scalingStrategy.databaseScaling} />
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground mr-2 text-[10px] font-bold uppercase">
                    Caching:
                  </span>
                  <span className="text-foreground text-xs">
                    <SafeRender value={data.scalingStrategy.cachingStrategy} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {data.faultTolerance && (
          <div className="space-y-4">
            <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
              <Shield size={16} /> Fault Tolerance
            </h4>
            <div className="bg-muted/5 border-border space-y-4 rounded-lg border p-5">
              <div>
                <span className="text-muted-foreground mb-2 block text-[10px] font-bold uppercase">
                  Redundancy
                </span>
                <p className="text-foreground/90 bg-background border-border/50 rounded border p-2 text-xs leading-relaxed">
                  <SafeRender value={data.faultTolerance.redundancyApproach} />
                </p>
              </div>
              <div>
                <span className="text-muted-foreground mb-2 block text-[10px] font-bold uppercase">
                  Failure Modes
                </span>
                <ul className="space-y-1">
                  {data.faultTolerance.failureModes?.map((s, i) => (
                    <li key={i} className="text-foreground/80 flex gap-2 text-xs">
                      <AlertOctagon size={12} className="mt-0.5 text-amber-500" /> <SafeRender value={s} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-muted-foreground mb-2 block text-[10px] font-bold uppercase">
                  Mitigation
                </span>
                <ul className="space-y-1">
                  {data.faultTolerance.mitigationStrategies?.map((s, i) => (
                    <li key={i} className="text-foreground/80 flex gap-2 text-xs">
                      <Shield size={12} className="mt-0.5 text-blue-500" /> <SafeRender value={s} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <ResearchSources
        sources={data.researchSources}
        title="Architectural Sources"
        subtitle="Web research and technical documentation used to design the high-level system."
      />
    </div>
  );
}
