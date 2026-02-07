'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Loader2 } from 'lucide-react';

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, checkAuth, isLoading, isHydrated } = useAuthStore();

  useEffect(() => {
    if (isHydrated) {
      checkAuth();
    }
  }, [checkAuth, isHydrated]);

  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isHydrated, router]);

  if (!isHydrated || isLoading) {
    return (
      <div className="bg-background flex h-screen w-full flex-col items-center justify-center gap-4">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">Loading workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
