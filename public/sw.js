// Network-first with cache fallback: online loads always refresh the cache (automatic updates),
// offline loads are served from the cache. Install precaches the page and the built assets it references.
const CACHE_NAME = 'workout-timer-v1'

self.addEventListener('install', (installEvent) => {
  installEvent.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const indexResponse = await fetch('./', { cache: 'reload' })
      if (!indexResponse.ok) throw new Error(`Precache failed: index returned ${indexResponse.status}`)
      const indexHtml = await indexResponse.clone().text()
      await cache.put('./', indexResponse)
      const referencedAssetUrls = [...indexHtml.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((match) => match[1])
      await cache.addAll([...referencedAssetUrls, './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (activateEvent) => {
  activateEvent.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (fetchEvent) => {
  const request = fetchEvent.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  fetchEvent.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      try {
        const networkResponse = await fetch(request)
        if (networkResponse.ok) await cache.put(request, networkResponse.clone())
        return networkResponse
      } catch (networkError) {
        const cachedResponse = await cache.match(request, { ignoreSearch: true })
        if (cachedResponse) return cachedResponse
        if (request.mode === 'navigate') {
          const cachedIndex = await cache.match('./')
          if (cachedIndex) return cachedIndex
        }
        throw networkError
      }
    })(),
  )
})
