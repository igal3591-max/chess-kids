// Chess Kids - Service Worker

const CACHE_NAME = "chess-kids-v7";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./chess.min.js",
    "./chess_app_database.json",
    "./manifest.webmanifest",
    "./icons/chess-icon-192.png",
    "./icons/chess-icon-512.png",
        "./pieces/wK.svg",
    "./pieces/wQ.svg",
    "./pieces/wR.svg",
    "./pieces/wB.svg",
    "./pieces/wN.svg",
    "./pieces/wP.svg",
    "./pieces/bK.svg",
    "./pieces/bQ.svg",
    "./pieces/bR.svg",
    "./pieces/bB.svg",
    "./pieces/bN.svg",
    "./pieces/bP.svg"
];

// Install: cache application files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
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
    fetch(event.request)
        .then(response => {
            if (response.ok && event.request.method === "GET") {
                const copy = response.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, copy);
                });
            }

            return response;
        })
        .catch(() => caches.match(event.request))
);
});