// Chess Kids - Service Worker

const CACHE_NAME = "chess-kids-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./chess.min.js",
    "./chess_app_database.json",
    "./manifest.webmanifest",
    "./icons/chess-icon-192.png",
    "./icons/chess-icon-512.png"
];

// Install: cache application files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// Activate: remove old caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

// Fetch: use cache when available
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    // Only handle files from this application
    if (new URL(event.request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request);
        })
    );
});