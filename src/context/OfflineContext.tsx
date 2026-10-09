import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PendingSyncItem {
  id: string;
  type: 'PATIENT_REGISTRATION' | 'TRIAGE_ASSESSMENT' | 'MEDICATION_LOG' | 'DONOR_STATUS';
  timestamp: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
}

interface OfflineContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingSyncQueue: PendingSyncItem[];
  queueOfflineAction: (type: PendingSyncItem['type'], payload: Record<string, unknown>) => void;
  syncPendingQueue: () => Promise<number>;
  lastSyncedAt: string;
  clearQueue: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [browserOnline, setBrowserOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<PendingSyncItem[]>(() => {
    const saved = localStorage.getItem('mart_pending_sync');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(() => {
    return localStorage.getItem('mart_last_synced') || new Date().toISOString();
  });

  const isOnline = browserOnline && !isSimulatedOffline;

  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('mart_pending_sync', JSON.stringify(pendingSyncQueue));
  }, [pendingSyncQueue]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const queueOfflineAction = (type: PendingSyncItem['type'], payload: Record<string, unknown>) => {
    const item: PendingSyncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      timestamp: new Date().toISOString(),
      payload,
      status: 'PENDING',
      retryCount: 0,
    };
    setPendingSyncQueue((prev) => [...prev, item]);
  };

  const syncPendingQueue = async (): Promise<number> => {
    if (pendingSyncQueue.length === 0) return 0;
    const count = pendingSyncQueue.length;
    // Simulate background server reconciliation
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPendingSyncQueue([]);
    const now = new Date().toISOString();
    setLastSyncedAt(now);
    localStorage.setItem('mart_last_synced', now);
    return count;
  };

  const clearQueue = () => {
    setPendingSyncQueue([]);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        toggleSimulatedOffline,
        pendingSyncQueue,
        queueOfflineAction,
        syncPendingQueue,
        lastSyncedAt,
        clearQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
