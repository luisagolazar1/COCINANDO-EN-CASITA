const CACHE_NAME = "cocinando-en-casita-v1";
const ARCHIVOS_BASE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./recetas.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_BASE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          return res;
        })
        .catch(() => cached);
    })
  );
});
