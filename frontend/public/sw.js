// Sanket Setu Service Worker — Phase 9 Offline Learning
const SW_VERSION = "sanket-setu-v1";
const SHELL_CACHE = `${SW_VERSION}-shell`;
const COURSE_CACHE = `${SW_VERSION}-courses`;
const EMERGENCY_CACHE = `${SW_VERSION}-emergency`;
const SCHEME_CACHE = `${SW_VERSION}-schemes`;

// App shell assets to always cache
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
];

// Emergency ISL content — cached offline unconditionally
const EMERGENCY_API_URLS = [
  "/api/learn/emergency-pack",
];

// ============================================================
// INSTALL — cache app shell + emergency pack
// ============================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(SHELL_ASSETS);

      // Pre-cache emergency pack (best effort)
      try {
        const emergencyCache = await caches.open(EMERGENCY_CACHE);
        for (const url of EMERGENCY_API_URLS) {
          try {
            const res = await fetch(url);
            if (res.ok) await emergencyCache.put(url, res);
          } catch (_) {
            // Network unavailable during install — will be populated on next online visit
          }
        }
      } catch (_) {}

      self.skipWaiting();
    })()
  );
});

// ============================================================
// ACTIVATE — delete stale caches
// ============================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("sanket-setu-") && k !== SHELL_CACHE && k !== COURSE_CACHE && k !== EMERGENCY_CACHE && k !== SCHEME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ============================================================
// FETCH — routing strategy
// ============================================================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Emergency pack — Cache First (always works offline)
  if (EMERGENCY_API_URLS.some((u) => url.pathname.startsWith(u))) {
    event.respondWith(cacheFirst(event.request, EMERGENCY_CACHE));
    return;
  }

  // 2. Course & lesson assets — Cache First (only if explicitly downloaded)
  if (url.pathname.startsWith("/api/learning/") || url.pathname.startsWith("/api/learn/")) {
    event.respondWith(networkFirstWithCache(event.request, COURSE_CACHE));
    return;
  }

  // 3. Scheme info — Network First, fallback to cache (with staleness warning handled in app)
  if (url.pathname.startsWith("/api/schemes/")) {
    event.respondWith(networkFirstWithCache(event.request, SCHEME_CACHE));
    return;
  }

  // 4. App shell — Cache First
  if (url.origin === self.location.origin && !url.pathname.startsWith("/api/")) {
    event.respondWith(cacheFirst(event.request, SHELL_CACHE));
    return;
  }

  // 5. Everything else — Network Only (auth, live, passport)
  // Pass through — no caching
});

// ============================================================
// BACKGROUND SYNC — progress queue
// ============================================================
self.addEventListener("sync", (event) => {
  if (event.tag === "sanket-progress-sync") {
    event.waitUntil(flushProgressQueue());
  }
});

async function flushProgressQueue() {
  try {
    // Open IndexedDB and drain the pending_progress store
    const db = await openSanketDB();
    const tx = db.transaction("pending_progress", "readwrite");
    const store = tx.objectStore("pending_progress");
    const records = await getAllRecords(store);

    for (const record of records) {
      try {
        const res = await fetch("/api/learning/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record.payload),
        });
        if (res.ok) {
          const deleteTx = db.transaction("pending_progress", "readwrite");
          deleteTx.objectStore("pending_progress").delete(record.id);
        }
      } catch (_) {
        // Will retry on next sync
      }
    }
  } catch (_) {}
}

// ============================================================
// MESSAGE — manual cache course
// ============================================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_COURSE") {
    const { urls, courseId } = event.data;
    event.waitUntil(cacheCourseAssets(urls, courseId));
  }
  if (event.data?.type === "DELETE_COURSE") {
    const { courseId } = event.data;
    event.waitUntil(deleteCourseAssets(courseId));
  }
  if (event.data?.type === "CACHE_SCHEMES") {
    const { urls } = event.data;
    event.waitUntil(cacheSchemeAssets(urls));
  }
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function cacheCourseAssets(urls, courseId) {
  const cache = await caches.open(COURSE_CACHE);
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    } catch (_) {}
  }
  // Notify all clients
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: "COURSE_CACHED", courseId }));
}

async function deleteCourseAssets(courseId) {
  const cache = await caches.open(COURSE_CACHE);
  const keys = await cache.keys();
  for (const req of keys) {
    if (req.url.includes(`course=${courseId}`) || req.url.includes(`/${courseId}/`)) {
      await cache.delete(req);
    }
  }
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: "COURSE_DELETED", courseId }));
}

async function cacheSchemeAssets(urls) {
  const cache = await caches.open(SCHEME_CACHE);
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    } catch (_) {}
  }
}

// ============================================================
// Helpers
// ============================================================
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch (_) {
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function openSanketDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("sanket_setu", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllRecords(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
