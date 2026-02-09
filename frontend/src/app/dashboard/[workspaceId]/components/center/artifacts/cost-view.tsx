import { CostEstimation, InfrastructureCost } from '../../../types/design';
import { SectionHeader, ResearchSources } from './common';
import {
  DollarSign,
  TrendingUp,
  Server,
  Database,
  Network,
  Box,
  Lightbulb,
  CheckCircle,
  Cpu,
} from 'lucide-react';

export function CostView({ data }: { data: CostEstimation }) {
  if (!data) return null;
  return (
    <div className="space-y-12">
      <SectionHeader
        title="Cost Estimation"
        subtitle="Projected infrastructure and operational costs."
      />

      {/* Top Cards */}
      <div className="grid grid-cols-2 gap-8">
        <div className="border-border bg-card relative overflow-hidden rounded-xl border p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={64} />
          </div>
          <p className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
            Estimated Monthly
          </p>
          <p className="text-foreground text-4xl font-bold tracking-tight">
            ${data.totalMonthly?.toLocaleString()}
          </p>
          <p className="text-muted-foreground mt-4 text-xs">Base infrastructure cost</p>
        </div>
        <div className="border-border bg-card relative overflow-hidden rounded-xl border p-6">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} />
          </div>
          <p className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
            Estimated Yearly
          </p>
          <p className="text-foreground text-4xl font-bold tracking-tight">
            ${data.totalYearly?.toLocaleString()}
          </p>
          <p className="text-muted-foreground mt-4 text-xs">Assuming stable usage</p>
        </div>
      </div>

      {/* Infrastructure Breakdown */}
      {data.infrastructure && (
        <div className="space-y-6">
          <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
            <Server size={16} /> Infrastructure Breakdown
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(data.infrastructure).map(([key, category]) => {
              if (!category) return null;
              const cat = category as InfrastructureCost;

              return (
                <div key={key} className="bg-muted/5 border-border rounded-lg border p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h5 className="text-foreground flex items-center gap-2 font-bold capitalize">
                      {key === 'compute' ? (
                        <Cpu size={14} />
                      ) : key === 'storage' ? (
                        <Database size={14} />
                      ) : key === 'networking' ? (
                        <Network size={14} />
                      ) : (
                        <Box size={14} />
                      )}
                      {key}
                    </h5>
                    <span className="text-foreground text-sm font-bold">
                      ${cat.estimatedMonthly}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {cat.breakdown?.map((item, i) => (
                      <div
                        key={i}
                        className="text-muted-foreground border-border/50 flex justify-between border-b pb-1 text-xs last:border-0"
                      >
                        <span>
                          {item.component || item.type || item.service}{' '}
                          {item.quantity ? `(x${item.quantity})` : ''}
                        </span>
                        <span>${item.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scaling & Optimization */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {data.scalingProjection && (
          <div className="space-y-4">
            <h4 className="text-primary flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
              <TrendingUp size={16} /> Growth Projection
            </h4>
            <div className="bg-card border-border rounded-lg border p-5">
              {Object.entries(data.scalingProjection).map(([scale, cost]) => (
                <div
                  key={scale}
                  className="border-border flex items-center justify-between border-b py-3 last:border-0"
                >
                  <span className="text-muted-foreground text-xs font-bold uppercase">
                    {scale.replace(/at|Users/g, '')} Users
                  </span>
                  <span className="text-foreground font-mono text-sm font-bold">
                    ${(cost as number)?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.costOptimization && (
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-white uppercase">
              <Lightbulb size={16} /> Optimization
            </h4>
            <ul className="space-y-2 rounded-lg border border-white/20 bg-white/5 p-5">
              {data.costOptimization.map((opt, i) => (
                <li key={i} className="text-foreground/80 flex gap-2 text-xs">
                  <CheckCircle size={12} className="mt-0.5 shrink-0 text-white" />
                  {typeof opt === 'string' ? opt : (opt as any).title || (opt as any).description || JSON.stringify(opt)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ResearchSources
        sources={data.researchSources}
        title="Pricing Sources"
        subtitle="Web research used to validate infrastructure and third-party service costs."
      />
    </div>
  );
}
