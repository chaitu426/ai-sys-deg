import { ApiDesign } from '../../../types/design';
import { SectionHeader, ResearchSources } from './common';
import { cn } from '@/lib/utils';
import { GitBranch, AlertTriangle, FileText, ArrowRight, Lock, Scale } from 'lucide-react';

export function ApiView({ data }: { data: ApiDesign }) {
  if (!data) return null;
  const endpoints = data.endpoints || [];

  return (
    <div className="space-y-10">
      <SectionHeader
        title="API Specifications"
        subtitle="RESTful interface definitions and standards."
      />

      {/* Global Rules */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {data.apiVersioning && (
          <div className="bg-muted/10 border-border rounded-lg border p-4">
            <span className="text-muted-foreground mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
              <GitBranch size={12} /> Versioning
            </span>
            <p className="text-foreground text-sm font-medium">{data.apiVersioning}</p>
          </div>
        )}
        {data.errorHandling && (
          <div className="bg-muted/10 border-border rounded-lg border p-4">
            <span className="text-muted-foreground mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
              <AlertTriangle size={12} /> Error Handling
            </span>
            <p className="text-foreground text-sm font-medium">{data.errorHandling}</p>
          </div>
        )}
        {data.documentation && (
          <div className="bg-muted/10 border-border rounded-lg border p-4">
            <span className="text-muted-foreground mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
              <FileText size={12} /> Standards
            </span>
            <p className="text-foreground text-sm font-medium">{data.documentation}</p>
          </div>
        )}
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        <h4 className="text-primary mb-2 text-sm font-bold tracking-widest uppercase">Endpoints</h4>
        {endpoints.map((ep, idx) => (
          <div
            key={idx}
            className="bg-card border-border hover:border-primary/30 overflow-hidden rounded-lg border transition-all"
          >
            {/* Header */}
            <div className="bg-muted/5 flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'w-16 shrink-0 rounded border px-2.5 py-1 text-center text-[10px] font-bold tracking-wider uppercase',
                    ep.method === 'GET'
                      ? 'border-white/20 bg-white/5 text-zinc-300'
                      : ep.method === 'POST'
                        ? 'border-white/40 bg-white/10 text-white font-bold'
                        : ep.method === 'DELETE'
                          ? 'border-zinc-800 bg-zinc-900 text-zinc-500'
                          : ep.method === 'PUT'
                            ? 'border-white/10 bg-white/5 text-zinc-400'
                            : 'border-white/10 bg-white/5 text-zinc-400'
                  )}
                >
                  {ep.method}
                </span>
                <code className="text-foreground font-mono text-sm font-semibold">{ep.path}</code>
              </div>
              <span className="text-muted-foreground bg-background border-border/50 hidden rounded border px-2 py-1 text-xs md:block">
                {ep.description}
              </span>
            </div>

            {/* Details */}
            <div className="border-border/50 grid grid-cols-1 gap-8 border-t p-4 text-xs md:grid-cols-2">
              {/* Request */}
              <div className="space-y-2">
                <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                  <ArrowRight size={10} /> Request Body
                </span>
                {ep.requestBody ? (
                  <div className="bg-background border-border/50 text-foreground/80 overflow-x-auto rounded border p-3 font-mono">
                    <div className="text-muted-foreground mb-2">// {ep.requestBody.schema}</div>
                    {ep.requestBody.example && (
                      <pre>{JSON.stringify(ep.requestBody.example, null, 2)}</pre>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground/50 italic">No request body</span>
                )}
              </div>

              {/* Response */}
              <div className="space-y-2">
                <span className="text-muted-foreground flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
                  <ArrowRight size={10} className="rotate-180" /> Response Body
                </span>
                {ep.responseBody ? (
                  <div className="bg-background border-border/50 text-foreground/80 overflow-x-auto rounded border p-3 font-mono">
                    <div className="text-muted-foreground mb-2">// {ep.responseBody.schema}</div>
                    {ep.responseBody.example && (
                      <pre>{JSON.stringify(ep.responseBody.example, null, 2)}</pre>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground/50 italic">No response body</span>
                )}
              </div>

              {/* Meta */}
              {(ep.authentication || ep.rateLimiting) && (
                <div className="border-border/30 mt-2 flex gap-6 border-t pt-2 md:col-span-2">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Lock size={10} />{' '}
                    <span className="text-foreground font-medium">
                      {ep.authentication || 'None'}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Scale size={10} />{' '}
                    <span className="text-foreground font-medium">
                      {ep.rateLimiting || 'Unlimited'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ResearchSources
        sources={data.researchSources}
        title="Standards & Guidelines"
        subtitle="External API design standards and industry best practices referenced."
      />
    </div>
  );
}
