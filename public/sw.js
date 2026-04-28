// Minimal app-shell service worker. Caches the shell + static assets, lets
// API/MCP requests hit the network always.
const CACHE = "cats-shell-v1";
const SHELL = ["/", "/login", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Don't cache API or MCP routes — always live.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/mcp/") || url.pathname.startsWith("/auth/")) return;
  // Stale-while-revalidate for shell.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fetched = fetch(req)
        .then((res) => {
          if (res.ok && (req.url.startsWith(self.location.origin))) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
