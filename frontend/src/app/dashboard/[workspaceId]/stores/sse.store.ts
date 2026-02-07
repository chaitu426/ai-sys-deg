import { create } from 'zustand';

interface SSEState {
  isConnected: boolean;
  lastError: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSSEStore = create<SSEState>((set) => ({
  isConnected: false,
  lastError: null,

  setConnected: (isConnected) =>
    set((state) => ({ isConnected, lastError: isConnected ? null : state.lastError })),
  setError: (lastError) => set({ lastError, isConnected: false }),
}));
