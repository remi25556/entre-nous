const CACHE_NAME = "entre-nous-v2";
const SHELL = [
  "/entre-nous/",
  "/entre-nous/index.html",
  "/entre-nous/manifest.json",
  "/entre-nous/74050-192x192.png",
  "/entre-nous/74050-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(SHELL.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("entre-nous-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })()
  );
});

// Réseau d'abord (toujours la dernière version), cache en secours hors ligne.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        return (await caches.match(request)) ||
          (request.mode === "navigate" ? await caches.match("/entre-nous/") : undefined);
      })
  );
});
