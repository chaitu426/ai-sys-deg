'use client';

import { useParams } from 'next/navigation';
import { SSEBridge } from './components/shell/sse-bridge';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  return (
    <>
      <SSEBridge workspaceId={workspaceId} />
      {children}
    </>
  );
}
