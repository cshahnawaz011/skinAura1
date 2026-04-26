/**
 * IndexedDB Cache Service
 * Stores all AI outputs offline, syncs when online
 */

const DB_NAME = 'SkinAuraCache';
const DB_VERSION = 1;

const STORES = {
  skinAnalysis: 'skinAnalysis',
  skinRoutine: 'skinRoutine',
  lifestyleInsights: 'lifestyleInsights',
  dietLogs: 'dietLogs',
  skinFeedback: 'skinFeedback',
  glowChallenge: 'glowChallenge',
  cycleData: 'cycleData',
  syncQueue: 'syncQueue', // Pending syncs
};

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initializeCache() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Create object stores for each entity type
      Object.values(STORES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('user_email', 'user_email', { unique: false });
          store.createIndex('created_date', 'created_date', { unique: false });
        }
      });
    };
  });
}

/**
 * Save AI output to cache
 */
export async function cacheOutput(storeName, data) {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put({
      ...data,
      cached_at: new Date().toISOString(),
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Retrieve cached output
 */
export async function getCachedOutput(storeName, id) {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get all cached outputs for user (paginated)
 */
export async function getCachedUserData(storeName, userEmail, limit = 50) {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index('user_email');
    const range = IDBKeyRange.only(userEmail);
    const request = index.getAll(range, limit);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const results = request.result.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      resolve(results);
    };
  });
}

/**
 * Queue output for sync (when offline)
 */
export async function queueForSync(storeName, data) {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.syncQueue], 'readwrite');
    const store = transaction.objectStore(STORES.syncQueue);
    const request = store.put({
      id: `${storeName}_${data.id}_${Date.now()}`,
      storeName,
      data,
      queued_at: new Date().toISOString(),
      synced: false,
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Get pending syncs
 */
export async function getPendingSyncs() {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.syncQueue], 'readonly');
    const store = transaction.objectStore(STORES.syncQueue);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const pending = request.result.filter(item => !item.synced);
      resolve(pending);
    };
  });
}

/**
 * Mark sync as complete
 */
export async function markSyncComplete(syncId) {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.syncQueue], 'readwrite');
    const store = transaction.objectStore(STORES.syncQueue);
    const getRequest = store.get(syncId);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.synced = true;
        item.synced_at = new Date().toISOString();
        const updateRequest = store.put(item);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve(item);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Clear all cache
 */
export async function clearCache() {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    
    Object.values(STORES).forEach(storeName => {
      const store = transaction.objectStore(storeName);
      store.clear();
    });

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}

/**
 * Clear store
 */
export async function clearStore(storeName) {
  if (!db) await initializeCache();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get cache stats
 */
export async function getCacheStats() {
  if (!db) await initializeCache();

  const stats = {};

  for (const storeName of Object.values(STORES)) {
    const count = await new Promise((resolve) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
    });
    stats[storeName] = count;
  }

  return stats;
}

export const CACHE_STORES = STORES;