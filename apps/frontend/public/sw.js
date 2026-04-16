// ─────────────────────────────────────────────────────────────
// PILA Service Worker
// Estrategia:
//   - HTML/navegación → Network first (siempre trae el index.html nuevo)
//   - Assets con hash (/assets/*.js, /assets/*.css) → Cache first (el hash garantiza frescura)
//   - API → Network only con fallback offline
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'pila-v3'
const OFFLINE_SHELL = '/index.html'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([OFFLINE_SHELL, '/manifest.json']))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API: network only, respuesta offline si falla
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ success: false, error: 'OFFLINE' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Assets con hash (/assets/...): cache first
  // Vite genera hashes en el nombre → si cambia el hash es un archivo nuevo,
  // no estará en cache y se pedirá a la red automáticamente
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // HTML / navegación: network first
  // Siempre intenta traer el index.html fresco → garantiza que los nuevos deploys
  // se carguen de inmediato. Si no hay red, sirve el del cache (offline).
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(OFFLINE_SHELL))
    )
    return
  }

  // Resto (imágenes, fuentes, iconos): cache first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).catch(() =>
      new Response('', { status: 503 })
    ))
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'PILA', {
      body: data.body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'))
})
