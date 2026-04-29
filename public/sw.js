// App-shell SW. Static assets are cached; HTML and any per-user data go to the
// network so a window.location.reload() after a write picks up the fresh state.
const CACHE = "cats-shell-v2";
const STATIC = ["/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).catch(() => {}));
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
  // API, MCP, auth — always live, no SW.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/mcp/") || url.pathname.startsWith("/auth/")) return;
  // Document navigations (HTML pages) and RSC requests — always live so writes
  // are reflected immediately after window.location.reload().
  if (req.mode === "navigate" || req.destination === "document") return;
  if (req.headers.get("accept")?.includes("text/html")) return;
  if (req.headers.get("rsc") || req.headers.get("next-router-state-tree")) return;
  // Cache static assets only.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const fetched = fetch(req)
        .then((res) => {
          if (res.ok && req.url.startsWith(self.location.origin)) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    }),
  );
});
