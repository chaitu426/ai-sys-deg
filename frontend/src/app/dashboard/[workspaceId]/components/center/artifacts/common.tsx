import { FileText, ExternalLink, Library } from 'lucide-react';

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-primary border-l-4 py-1 pl-6">
      <h3 className="text-foreground mb-2 text-3xl leading-none font-bold tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm font-medium">{subtitle}</p>
    </div>
  );
}

export function JsonFallback({ data }: { data: any }) {
  return (
    <div className="group relative">
      <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <FileText size={16} className="text-muted-foreground" />
      </div>
      <div className="bg-muted/5 border-border/50 text-muted-foreground scrollbar-thin scrollbar-thumb-border max-h-[600px] overflow-auto rounded-xl border p-8 font-mono text-[11px] leading-relaxed shadow-inner">
        <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}

export function SafeRender({ value, fallback = '—' }: { value: any; fallback?: string }) {
  if (value === null || value === undefined) return <span>{fallback}</span>;
  if (typeof value === 'string') return <span>{value}</span>;
  if (typeof value === 'number') return <span>{value}</span>;

  // Handle common AI object structures
  if (typeof value === 'object') {
    const text = value.title || value.description || value.name || value.text || value.scenario || JSON.stringify(value);
    return <span>{text}</span>;
  }

  return <span>{String(value)}</span>;
}

export function ResearchSources({
  sources,
  title = 'Sources of Truth',
  subtitle = 'Research data used to inform this design.',
}: {
  sources?: { title: string; url: string }[];
  title?: string;
  subtitle?: string;
}) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="border-border/40 mt-12 space-y-4 border-t pt-8">
      <div className="flex items-center gap-2 mb-4">
        <Library className="text-primary h-5 w-5" />
        <div>
          <h4 className="text-md font-bold text-foreground leading-none">{title}</h4>
          <p className="text-muted-foreground text-[11px] mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card hover:bg-muted/50 border-border border flex items-center gap-2 rounded-xl px-4 py-2 transition-all group"
          >
            <div className="bg-muted group-hover:bg-primary/10 rounded p-1 transition-colors">
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground max-w-[240px] truncate">
              {source.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
