const CACHE_NAME = "browsercalc-cache-v3";
const SCOPE_URL = new URL(self.registration.scope);
const APP_SHELL_URL = new URL("index.html", SCOPE_URL).toString();
const STATIC_URLS = ["manifest.webmanifest", "icon-192.png", "icon-512.png"].map((path) =>
  new URL(path, SCOPE_URL).toString(),
);

function getAppAssetUrls(html) {
  return Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g), ([, path]) =>
    new URL(path, SCOPE_URL),
  )
    .filter((url) => url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname))
    .map((url) => url.toString());
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const indexResponse = await fetch(APP_SHELL_URL, { cache: "reload" });
      if (!indexResponse.ok) throw new Error("Unable to fetch app shell");

      const html = await indexResponse.clone().text();
      const assetUrls = getAppAssetUrls(html);
      await cache.put(APP_SHELL_URL, indexResponse);
      await cache.addAll([...new Set([...STATIC_URLS, ...assetUrls])]);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null))),
    ).then(() => self.clients.claim()),
  );
});

// Cache-first for navigation and scoped GET requests; fallback to the app shell when offline.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isInScope = url.pathname.startsWith(SCOPE_URL.pathname);

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(APP_SHELL_URL).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(APP_SHELL_URL, clone)));
          }
          return response;
        }).catch(() => caches.match(APP_SHELL_URL)),
      ),
    );
    return;
  }

  if (isSameOrigin && isInScope) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)));
            }
            return response;
          });
      }),
    );
  }
});
