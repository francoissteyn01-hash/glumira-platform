/**
 * GluMira V7 — Offline Sync
 * Block 24: IndexedDB helper for offline data queuing.
 *
 * Queues failed API requests when the user is offline and
 * replays them when connectivity is restored.
 */

export interface QueuedEntry {
  id: string;
  endpoint: string;
  method: string;
  body: string;
  timestamp: string;
  synced: boolean;
}

export interface OfflineStatus {
  pendingCount: number;
  lastSyncAttempt: string | null;
}

const DB_NAME = "glumira-offline";
const STORE_NAME = "pending-sync";
const DB_VERSION = 1;

// Track the last sync attempt in memory (persisted via localStorage as backup)
const LAST_SYNC_KEY = "glumira_last_sync_attempt";

/**
 * Open (or create) the IndexedDB database.
 * Creates the `pending-sync` object store on first run.
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate a unique ID for a queued entry.
 */
function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Add a new entry to the offline queue.
 *
 * @param endpoint - The API URL the request was targeting
 * @param method   - HTTP method (POST, PUT, PATCH, DELETE)
 * @param body     - Serialised request body (JSON string)
 * @returns The created QueuedEntry
 */
export async function queueEntry(
  endpoint: string,
  method: string,
  body: string
): Promise<QueuedEntry> {
  const db = await openDB();
  const entry: QueuedEntry = {
    id: generateId(),
    endpoint,
    method,
    body,
    timestamp: new Date().toISOString(),
    synced: false,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = () => resolve(entry);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve all entries that have not yet been synced.
 */
export async function getPendingEntries(): Promise<QueuedEntry[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result as QueuedEntry[];
      resolve(all.filter((e) => !e.synced));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark a single entry as successfully synced.
 */
export async function markSynced(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const entry = getReq.result as QueuedEntry | undefined;
      if (!entry) {
        resolve();
        return;
      }
      entry.synced = true;
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Attempt to sync all pending entries by replaying them against the server.
 *
 * @param token - Bearer token for authenticated API requests
 * @returns Number of entries that were successfully synced
 */
export async function syncAll(token: string): Promise<number> {
  const pending = await getPendingEntries();
  let syncedCount = 0;

  const now = new Date().toISOString();
  try {
    localStorage.setItem(LAST_SYNC_KEY, now);
  } catch {
    // localStorage may be unavailable in some contexts
  }

  for (const entry of pending) {
    try {
      const response = await fetch(entry.endpoint, {
        method: entry.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: entry.body,
      });

      if (response.ok) {
        await markSynced(entry.id);
        syncedCount++;
      }
      // Non-OK responses leave the entry for retry (server error, etc.)
    } catch {
      // Network still unavailable — stop trying remaining entries
      break;
    }
  }

  return syncedCount;
}

/**
 * Get a summary of the current offline queue status.
 */
export async function getOfflineStatus(): Promise<OfflineStatus> {
  const pending = await getPendingEntries();
  let lastSyncAttempt: string | null = null;

  try {
    lastSyncAttempt = localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    // localStorage may be unavailable
  }

  return {
    pendingCount: pending.length,
    lastSyncAttempt,
  };
}
