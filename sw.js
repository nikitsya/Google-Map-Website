const CACHE_NAME = "wc2026-mexico-v1"
const ASSETS = [
    "./",
    "./index.html",
    "./index.js",
    "./css/style.css",
    "./manifest.json",
    "./icon.svg",
    "./images/icons/icon-192.png",
    "./images/icons/icon-512.png",
    "./images/search.png",
    "./images/markers/stadium.png",
    "./images/markers/hotel.png",
    "./images/markers/caffe.png",
    "./images/markers/restaurant.png",
    "./images/markers/attractions.png",
    "./images/markers/bar.png",
    "./images/markers/parking.png",
    "./js/map/MapManager.js",
    "./js/planner/DayPlanner.js",
    "./js/services/WeatherService.js",
    "./js/services/CurrencyService.js",
    "./js/data/locations.js"
]

// Install: cache all static assets
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    )
    self.skipWaiting()
})

// Activate: remove old caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    )
    self.clients.claim()
})

// Fetch: serve from cache, fall back to network
self.addEventListener("fetch", event => {
    // Let Google Maps API requests go straight to the network
    if (event.request.url.includes("maps.googleapis.com")) return

    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    )
})
