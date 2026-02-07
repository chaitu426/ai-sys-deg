'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft, PanelRight } from 'lucide-react';
import { useUIStore } from '../../stores/uistore';

interface WorkspaceShellProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  topBar?: ReactNode;
}

export function WorkspaceShell({ children, leftPanel, rightPanel, topBar }: WorkspaceShellProps) {
  const { leftSidebarOpen, rightSidebarOpen, toggleLeftSidebar, toggleRightSidebar } = useUIStore();

  return (
    <div className="bg-background text-foreground selection:bg-primary/20 flex h-screen w-full overflow-hidden font-sans">
      {/* Background Ambient Glow - Refined for Subtlety */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-[20%] -left-[10%] h-[60%] w-[60%] rounded-full opacity-60 mix-blend-screen blur-[150px]" />
        <div className="absolute -right-[10%] -bottom-[20%] h-[60%] w-[60%] rounded-full bg-indigo-900/10 opacity-60 mix-blend-screen blur-[150px]" />
        <div className="bg-accent/5 absolute top-[40%] left-[40%] h-[40%] w-[40%] rounded-full opacity-40 blur-[180px]" />
      </div>

      {/* Left Sidebar */}
      <AnimatePresence initial={false} mode="wait">
        {leftSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0, x: -20 }}
            animate={{ width: 280, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: -20 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
              opacity: { duration: 0.2 },
            }}
            className="border-sidebar-border bg-sidebar/50 z-30 flex h-full flex-shrink-0 flex-col border-r shadow-xl shadow-black/5 backdrop-blur-2xl"
          >
            {leftPanel}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="border-border/40 bg-background/40 sticky top-0 z-20 flex h-14 flex-shrink-0 items-center justify-between border-b px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLeftSidebar}
              className="hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md p-2 transition-all duration-200 active:scale-95"
              aria-label="Toggle Left Sidebar"
            >
              <PanelLeft
                className={`h-5 w-5 transition-transform duration-300 ${!leftSidebarOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {topBar}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleRightSidebar}
              className="hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-md p-2 transition-all duration-200 active:scale-95"
              aria-label="Toggle Right Sidebar"
            >
              <PanelRight
                className={`h-5 w-5 transition-transform duration-300 ${!rightSidebarOpen ? '-rotate-180' : ''}`}
              />
            </button>
          </div>
        </header>

        <main className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <div className="animate-in fade-in zoom-in-95 mx-auto h-full w-full max-w-[1600px] duration-500">
            {children}
          </div>
        </main>
      </div>

      {/* Right Sidebar */}
      <AnimatePresence initial={false} mode="wait">
        {rightSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0, x: 20 }}
            animate={{ width: 340, opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 20 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 40,
              opacity: { duration: 0.2 },
            }}
            className="border-sidebar-border bg-sidebar/50 z-30 flex h-full flex-shrink-0 flex-col border-l shadow-xl shadow-black/5 backdrop-blur-2xl"
          >
            {rightPanel}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
