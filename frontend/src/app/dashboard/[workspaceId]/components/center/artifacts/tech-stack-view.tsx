import { Globe, Server, Database, Activity, Cpu, ExternalLink, Microscope } from 'lucide-react';

import { TechStack, TechSection } from '../../../types/design';
import { SectionHeader, ResearchSources, SafeRender } from './common';

export function TechStackView({ data }: { data: TechStack }) {
  if (!data) return null;

  const sections = [
    { key: 'frontend', label: 'Frontend', icon: Globe },
    { key: 'backend', label: 'Backend', icon: Server },
    { key: 'database', label: 'Database', icon: Database },
    { key: 'messaging', label: 'Messaging', icon: Activity },
    { key: 'infrastructure', label: 'Infrastructure', icon: Cpu },
  ] as const;

  return (
    <div className="space-y-12">
      <SectionHeader
        title="Technology Stack"
        subtitle="Comprehensive breakdown of the selected architectural tools."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {sections.map(({ key, label, icon: Icon }) => {
          const sectionData = data[key];
          if (!sectionData) return null;

          const isNested = typeof sectionData === 'object' && sectionData !== null;

          const nestedData = isNested ? (sectionData as TechSection) : null;

          return (
            <div
              key={key}
              className="group border-border bg-card hover:border-primary/50 relative overflow-hidden rounded-xl border p-6 shadow-sm transition-all"
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="bg-muted/30 group-hover:bg-primary/10 rounded-lg p-3 transition-colors">
                  <Icon
                    size={24}
                    className="text-foreground group-hover:text-primary transition-colors"
                  />
                </div>

                <span className="text-muted-foreground/50 text-[10px] font-bold tracking-[0.2em] uppercase">
                  {label}
                </span>
              </div>

              {/* Nested (structured) tech data */}
              {isNested && nestedData ? (
                <div className="space-y-4">
                  {/* Primary Highlight */}
                  <div>
                    <h4 className="text-foreground text-xl font-bold">
                      {nestedData.framework ||
                        nestedData.runtime ||
                        nestedData.primary ||
                        nestedData.compute ||
                        nestedData.queue ||
                        'Standard Selection'}
                    </h4>
                  </div>

                  {/* Breakdown */}
                  <div className="grid grid-cols-1 gap-2 pt-2">
                    {Object.entries(nestedData).map(([subKey, value]) => {
                      if (
                        [
                          'framework',
                          'runtime',
                          'primary',
                          'compute',
                          'queue',
                          'justification',
                          'reason',
                          'tradeOffAnalysis',
                        ].includes(subKey)
                      )
                        return null;

                      if (typeof value !== 'string') return null;

                      return (
                        <div
                          key={subKey}
                          className="border-border/50 flex items-center justify-between border-b py-1 text-xs last:border-0"
                        >
                          <span className="text-muted-foreground font-medium capitalize">
                            {subKey.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-foreground font-bold">{value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Justification */}
                  {(nestedData.justification || nestedData.reason) && (
                    <div className="border-border/50 mt-4 border-t pt-4">
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        <span className="text-foreground/50 decoration-primary/20 mr-2 font-bold underline">
                          WHY:
                        </span>
                        {nestedData.justification || nestedData.reason}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Flat value fallback */
                <div>
                  <h4 className="text-foreground mb-4 text-xl font-bold">
                    {sectionData as string}
                  </h4>
                  <p className="text-muted-foreground text-xs italic">
                    No further technical breakdown available.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trade-off Analysis & Research Sources */}
      {data.tradeOffAnalysis && data.tradeOffAnalysis.length > 0 && (
        <div className="mt-8 space-y-8">
          <SectionHeader
            title="Research & Trade-offs"
            subtitle="Deep analysis of key technology decisions and sources of truth."
          />

          <div className="grid grid-cols-1 gap-6">
            {data.tradeOffAnalysis.map((item, idx) => (
              <div
                key={idx}
                className="bg-muted/10 border-border/40 overflow-hidden rounded-xl border p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Microscope className="text-primary h-5 w-5" />
                    <h4 className="text-lg font-bold">{item.category}: {item.selected}</h4>
                  </div>
                  <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-bold uppercase">
                    Match Score: {item.score}%
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.researchSummary}
                    </p>

                    <div className="pt-2">
                      <ResearchSources
                        sources={item.sources}
                        title="Decision Evidence"
                        subtitle="Web research used for this tradeoff."
                      />
                    </div>
                  </div>

                  <div className="bg-card/50 border-border/40 rounded-lg border p-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Alternatives Considered</span>
                    <div className="space-y-2">
                      {item.alternatives.map((alt, aIdx) => (
                        <div key={aIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-zinc-700" />
                          <SafeRender value={alt} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
