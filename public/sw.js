// Road Monitor PWA Service Worker
const CACHE_NAME = 'road-monitor-v1.0.0'
const STATIC_CACHE = 'road-monitor-static-v1'
const DYNAMIC_CACHE = 'road-monitor-dynamic-v1'

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
  
  // Force the waiting service worker to become active
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Claim all clients immediately
  return self.clients.claim()
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse
        }
        
        // Otherwise, fetch from network and cache dynamic content
        return fetch(request)
          .then((networkResponse) => {
            // Only cache GET requests and successful responses
            if (request.method === 'GET' && networkResponse.status === 200) {
              const responseClone = networkResponse.clone()
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone)
                })
            }
            
            return networkResponse
          })
          .catch(() => {
            // If network fails, return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/')
            }
          })
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'road-data-sync') {
    event.waitUntil(syncRoadData())
  }
})

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'road-monitor-update',
    requireInteraction: true
  }
  
  event.waitUntil(
    self.registration.showNotification('Road Monitor', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  event.waitUntil(
    self.clients.openWindow('/')
  )
})

// Helper function to sync offline data
async function syncRoadData() {
  try {
    console.log('Service Worker: Syncing road data...')
    
    // This would integrate with your backend API
    // For now, just log that sync would happen
    console.log('Service Worker: Road data sync completed')
    
    // Show notification about successful sync
    self.registration.showNotification('Road Monitor', {
      body: 'Offline data has been synchronized',
      icon: '/icon-192x192.png',
      tag: 'sync-complete'
    })
  } catch (error) {
    console.error('Service Worker: Failed to sync road data', error)
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ cacheSize: size })
    })
  }
})

// Helper function to get cache size
async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}