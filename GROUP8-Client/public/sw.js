/**
 * GluMira™ Service Worker
 * Version: 7.0.0
 *
 * Caching strategy:
 *  - App shell (HTML, CSS, JS): Cache-first, background revalidate
 *  - API routes: Network-first, fallback to cache
 *  - Nightscout/external: Network-only (real-time data)
 *  - Offline fallback: /offline for navigation requests
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

const CACHE_NAME = "glumira-v7";
const OFFLINE_URL = "/offline";

const APP_SHELL = [
  "/",
  "/offline",
  "/pricing",
  "/manifest.json",
];

// ─── Install ──────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API routes: network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(cacheFirst(request));
});

// ─── Strategies ───────────────────────────────────────────────

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
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Offline — cached data unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ─── Background Sync (meal logging) ──────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-meals") {
    event.waitUntil(syncPendingMeals());
  }
});

async function syncPendingMeals() {
  // Retrieve pending meals from IndexedDB and POST to /api/meals/log
  // Implementation: use idb-keyval or raw IndexedDB
  // This is a stub — full implementation in meals-sync.ts
  console.log("[GluMira SW] Background sync: meals");
}

// ─── Push notifications (hypo alerts) ────────────────────────

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "GluMira™ Alert";
  const options = {
    body: data.body || "Check your glucose levels.",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: data.tag || "glumira-alert",
    data: { url: data.url || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(clients.openWindow(url));
});
