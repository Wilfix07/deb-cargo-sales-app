const CACHE_NAME = 'deb-cargo-sales-v1';
const DEV_MODE = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Static assets to cache (only for production)
const urlsToCache = [
  '/',
  '/images/logo.jpg',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  if (DEV_MODE) {
    // In development, skip aggressive caching to avoid conflicts with Vite HMR
    console.log('Service Worker: Development mode detected, skipping asset caching');
    self.skipWaiting();
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets...');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache assets', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for Vite development server requests
  if (DEV_MODE) {
    // Don't interfere with Vite's HMR and development requests
    if (url.pathname.includes('/@vite/') || 
        url.pathname.includes('/@fs/') ||
        url.pathname.includes('/src/') ||
        url.pathname.includes('/__vite') ||
        url.pathname.includes('.tsx') ||
        url.pathname.includes('.ts') ||
        url.pathname.includes('.jsx') ||
        url.pathname.includes('.js') ||
        url.pathname.includes('.css') ||
        url.searchParams.has('t')) {
      console.log('Service Worker: Passing through dev request:', url.pathname);
      return;
    }
  }
  
  // For production or non-development requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Serving from cache:', url.pathname);
          return response;
        }
        
        console.log('Service Worker: Fetching from network:', url.pathname);
        return fetch(request).catch((error) => {
          console.error('Service Worker: Network fetch failed:', error);
          throw error;
        });
      })
      .catch((error) => {
        console.error('Service Worker: Fetch event error:', error);
        return fetch(request);
      })
  );
});

// Message event - handle commands from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Skipping waiting and taking control');
    self.skipWaiting();
  }
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
  
  console.log('Service Worker: Activated and controlling all clients');
});