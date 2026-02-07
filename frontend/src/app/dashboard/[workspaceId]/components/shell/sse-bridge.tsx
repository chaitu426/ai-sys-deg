'use client';

import { useDesignSSE } from '../../hooks/use-design-sse';

interface SSEBridgeProps {
  workspaceId: string;
}

export function SSEBridge({ workspaceId }: SSEBridgeProps) {
  useDesignSSE(workspaceId);
  return null;
}
