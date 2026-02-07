export function Footer() {
  return (
    <footer className="text-muted-foreground relative w-full px-6 pt-14 pb-20 text-sm md:px-16 lg:px-24">
      {/* Content */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
        {/* Brand */}
        <div className="space-y-4">
          <h2 className="text-foreground text-lg font-semibold">Systemly</h2>
          <p className="max-w-sm leading-relaxed">
            A production-grade AI agent platform where each agent has a responsibility — planning,
            system design, stack decisions, execution, and validation — all running with background
            workflows.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-foreground text-xs font-medium tracking-wider uppercase">Platform</h3>
          <ul className="space-y-2">
            {['Docs', 'Agent Architecture', 'System Design', 'API Reference'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-foreground transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal / Trust */}
        <div className="space-y-4 md:text-right">
          <h3 className="text-foreground text-xs font-medium tracking-wider uppercase">Trust</h3>
          <ul className="space-y-2">
            {['Security', 'Privacy Policy', 'Terms', 'Responsible AI'].map((item) => (
              <li key={item}>
                <a href="#" className="hover:text-foreground transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom row */}
      <div className="text-muted-foreground mx-auto mt-1 flex max-w-6xl flex-col gap-3 pt-3 text-xs md:flex-row md:items-center md:justify-between">
        <p>© 2026 Systemly. Built for real systems.</p>
      </div>

      {/* System status */}
      <div className="text-muted-foreground mx-auto mt-6 flex max-w-6xl flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-foreground">All agents operational</span>
        </div>
      </div>

      {/* Floating brand signature */}
      <div className="pointer-events-none absolute -bottom-20 left-1/2 -translate-x-1/2 select-none">
        <span className="bg-gradient-to-b from-zinc-700 to-transparent bg-clip-text text-[7rem] font-semibold tracking-[0.25em] text-transparent opacity-70 blur-[0.3px] md:text-[9rem]">
          Systemly
        </span>
      </div>
    </footer>
  );
}
