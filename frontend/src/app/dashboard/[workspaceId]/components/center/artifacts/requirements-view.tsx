import { Requirements } from '../../../types/design';
import { SectionHeader, ResearchSources } from './common';
import { Target, Shield, Lightbulb, CheckCircle2, Info } from 'lucide-react';

export function RequirementsView({ data }: { data: Requirements }) {
  if (!data) return null;
  if (data) {
    console.log(data)
  }
  return (
    <div className="space-y-16 pb-10 font-sans">
      <SectionHeader
        title="Requirement Analysis"
        subtitle="Core functional objectives and secondary system constraints."
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Functional Requirements */}
        <div className="space-y-6">
          <div className="border-border flex items-center gap-3 border-b pb-4">
            <div className="bg-white/10 rounded-lg p-2 border border-white/20">
              <Target className="text-white h-5 w-5" />
            </div>
            <div>
              <h4 className="text-foreground text-sm font-black tracking-[0.2em] uppercase">
                Functional
              </h4>
              <p className="text-muted-foreground text-[10px] font-bold uppercase">
                Capabilities & Features
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {data.functionalRequirements?.map((req: string, i: number) => (
              <div
                key={i}
                className="bg-muted/5 border-border/50 hover:border-primary/30 group flex gap-4 rounded-xl border p-4 transition-all"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-white/50 transition-colors group-hover:text-white" />
                </div>
                <p className="text-foreground/85 text-sm leading-relaxed font-medium">
                  {typeof req === 'string' ? req : (req as any).title || (req as any).description || JSON.stringify(req)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Functional Requirements */}
        <div className="space-y-6">
          <div className="border-border flex items-center gap-3 border-b pb-4">
            <div className="rounded-lg bg-white/10 p-2 border border-white/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-foreground text-sm font-black tracking-[0.2em] uppercase">
                Non-Functional
              </h4>
              <p className="text-muted-foreground text-[10px] font-bold uppercase">
                Quality Attributes
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {data.nonFunctionalRequirements?.map((req: string, i: number) => (
              <div
                key={i}
                className="bg-muted/5 border-border/50 group flex gap-4 rounded-xl border p-4 transition-all hover:border-white/30"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/40 transition-all group-hover:scale-125 group-hover:bg-white" />
                </div>
                <p className="text-foreground/85 text-sm leading-relaxed font-medium italic">
                  {typeof req === 'string' ? req : (req as any).title || (req as any).description || JSON.stringify(req)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assumptions & Constraints */}
      {data.assumptions && data.assumptions.length > 0 && (
        <div className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-800/50 px-6 py-4">
              <Lightbulb className="h-4 w-4 text-white" />
              <h4 className="text-[10px] font-black tracking-widest text-zinc-100 uppercase">
                Assumptions & Strategic Constraints
              </h4>
            </div>
            <div className="p-8">
              <ul className="grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
                {data.assumptions.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-4 text-sm text-zinc-400">
                    <Info size={14} className="mt-1 shrink-0 text-zinc-600" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics - Visual touch */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="bg-muted/5 border-border/50 rounded-xl border p-4 text-center">
          <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">Functional</p>
          <p className="text-foreground text-xl font-black">
            {data.functionalRequirements?.length || 0}
          </p>
        </div>
        <div className="bg-muted/5 border-border/50 rounded-xl border p-4 text-center">
          <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">Attributes</p>
          <p className="text-foreground text-xl font-black">
            {data.nonFunctionalRequirements?.length || 0}
          </p>
        </div>
        <div className="bg-muted/5 border-border/50 col-span-2 rounded-xl border p-4 text-center">
          <p className="text-muted-foreground mb-1 text-[10px] font-bold uppercase">
            <p className="text-base font-bold tracking-widest text-white uppercase">
              High Reliability
            </p>
          </p>
        </div>
      </div>

      <ResearchSources
        sources={data.researchSources}
        title="Objective Evidence"
        subtitle="Industry benchmarks and requirement standards used for this analysis."
      />
    </div >
  );
}
