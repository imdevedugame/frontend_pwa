/* Simple PWA Service Worker */
const CACHE_NAME = 'secondhand-cache-v1'
const PRECACHE_URLS = [
  '/',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

// Network-first for navigation, SWR for static assets, passthrough for API
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Avoid caching API calls (backend) by default
  if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) {
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(req, copy))
        return res
      }).catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // For static assets use stale-while-revalidate
  const isStatic = ['style', 'script', 'image', 'font'].includes(req.destination)
  if (isStatic) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((networkRes) => {
          const copy = networkRes.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          return networkRes
        }).catch(() => cached)
        return cached || fetchPromise
      })
    )
  }
})

// Allow page to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
