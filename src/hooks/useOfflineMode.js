import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status and manage offline cache
 */
export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}

/**
 * Hook to sync pending data when online
 */
export function useSyncPendingData() {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const { isOnline } = useOfflineMode();

  useEffect(() => {
    if (isOnline) {
      syncData();
    }
  }, [isOnline]);

  const syncData = async () => {
    try {
      setSyncing(true);
      setSyncError(null);

      const { getPendingSyncs, markSyncComplete } = await import('@/lib/cacheService');
      const pending = await getPendingSyncs();

      if (!pending.length) {
        setSyncing(false);
        return;
      }

      // Sync each pending item
      for (const item of pending) {
        try {
          // You can implement custom sync logic per store here
          // For now, just mark as synced
          await markSyncComplete(item.id);
        } catch (err) {
          console.error(`Failed to sync ${item.storeName}:`, err);
        }
      }

      setSyncing(false);
    } catch (err) {
      setSyncError(err.message);
      setSyncing(false);
    }
  };

  return { syncing, syncError, syncData };
}