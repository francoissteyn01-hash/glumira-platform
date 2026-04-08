/**
 * GluMira V7 — Service Worker
 * Block 24: Offline Mode
 *
 * Provides offline support for core logging features:
 *  - Pre-caches the app shell on install
 *  - Network-first for API calls, cache-first for static assets
 *  - Queues failed POST requests via IndexedDB for background sync
 */

const CACHE_NAME = 'glumira-v7-offline';
const OFFLINE_URLS = [
  '/',
  '/dashboard',
  '/log',
  '/insulin',
  '/glucose',
];

// Static asset extensions that use cache-first strategy
const STATIC_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.svg', '.woff2', '.woff', '.ico'];

// API path prefix
const API_PREFIX = '/api/';

// IndexedDB config for offline queue
const DB_NAME = 'glumira-offline';
const STORE_NAME = 'pending-sync';
const DB_VERSION = 1;

// ---------- Install ----------
// Pre-cache the app shell so core pages work offline.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  // Activate immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ---------- Activate ----------
// Clean up old caches when a new service worker takes over.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Claim all open clients so the SW controls them immediately
  self.clients.claim();
});

// ---------- Fetch ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // POST requests to API — attempt network, queue on failure
  if (request.method === 'POST' && url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(handleApiPost(request));
    return;
  }

  // GET API calls — network-first with cache fallback
  if (url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets — cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation / other requests — network-first, fall back to cached shell
  event.respondWith(networkFirstNavigation(request));
});

// ---------- Background Sync ----------
// When connectivity is restored the browser fires a 'sync' event.
self.addEventListener('sync', (event) => {
  if (event.tag === 'glumira-sync') {
    event.waitUntil(syncPendingEntries());
  }
});

// Listen for manual sync messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    syncPendingEntries().then((count) => {
      event.source.postMessage({ type: 'SYNC_COMPLETE', count });
    });
  }
});

// ========== Strategies ==========

/**
 * Network-first: try network, fall back to cache.
 * Used for API GET requests.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Cache successful GET responses for offline use
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Cache-first: serve from cache if available, otherwise fetch and cache.
 * Used for static assets (JS, CSS, images, fonts).
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    return new Response('', { status: 503 });
  }
}

/**
 * Network-first for navigation requests.
 * Falls back to the cached root page (SPA shell) when offline.
 */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // For navigation requests, serve the root SPA shell as fallback
    const shell = await caches.match('/');
    if (shell) return shell;
    return new Response('Offline — please reconnect.', { status: 503 });
  }
}

/**
 * Handle POST requests to API endpoints.
 * If the network call fails, queue the request in IndexedDB for later sync.
 */
async function handleApiPost(request) {
  // Clone the request body before consuming it
  const body = await request.clone().text();
  const headers = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  try {
    const response = await fetch(request);
    return response;
  } catch (_err) {
    // Network unavailable — queue for background sync
    await queueForSync(request.url, request.method, body, headers);

    // Register for background sync if available
    if (self.registration && self.registration.sync) {
      await self.registration.sync.register('glumira-sync');
    }

    // Return a synthetic 202 so the app knows the data was queued
    return new Response(
      JSON.stringify({ queued: true, message: 'Saved offline. Will sync when back online.' }),
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ========== IndexedDB helpers (service worker side) ==========

/**
 * Open the IndexedDB database used for offline sync.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Queue a failed POST request for later sync.
 */
async function queueForSync(url, method, body, headers) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      endpoint: url,
      method,
      body,
      headers: JSON.stringify(headers),
      timestamp: new Date().toISOString(),
      synced: false,
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Attempt to replay all pending (unsynced) entries.
 * Returns the number of successfully synced entries.
 */
async function syncPendingEntries() {
  const db = await openDB();
  const entries = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  let syncedCount = 0;

  for (const entry of entries) {
    if (entry.synced) continue;

    try {
      const headers = JSON.parse(entry.headers || '{}');
      const response = await fetch(entry.endpoint, {
        method: entry.method,
        headers,
        body: entry.body,
      });

      if (response.ok) {
        // Mark as synced
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          entry.synced = true;
          store.put(entry);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        syncedCount++;
      }
    } catch (_err) {
      // Still offline or server error — leave entry for next sync attempt
    }
  }

  // Notify all clients about sync completion
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_COMPLETE', count: syncedCount });
  });

  return syncedCount;
}

// ========== Utilities ==========

/**
 * Check if a path points to a static asset.
 */
function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}
