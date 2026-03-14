const CACHE = "predenuncias-v7";

const ASSETS = [
  "./",
  "./index.html",
  "./firebase_setup.html",
  "./denunciante_patrimonio.html",   // tu “otro html” (o el que sea)
  "./firebase.js",
  "./manifest.webmanifest",
  "./icon-192.ico",
  "./icon-192.png",
  "./apple-touch-icon.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE && caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const acceptsHtml = (req.headers.get("accept") || "").includes("text/html");
  const isPageRequest = req.mode === "navigate" || acceptsHtml;

  // ❌ No tocar Firebase, Auth, Firestore, CDN
  if (
    req.url.includes("firebase") ||
    req.url.includes("googleapis") ||
    req.url.includes("gstatic") ||
    req.method !== "GET"
  ) {
    return;
  }

  // Para páginas (index y formularios): prioriza red para recibir cambios de GitHub.
  if (isSameOrigin && isPageRequest) {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
        return net;
      } catch (_) {
        const cached = await caches.match(req);
        if (cached) return cached;
        return fetch(req);
      }
    })());
    return;
  }

  // Resto de recursos locales: cache-first.
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
