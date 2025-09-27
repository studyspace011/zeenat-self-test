// Cache का नाम बदलकर v5 कर दें ताकि ब्राउज़र इसे अपडेट करे
const CACHE_NAME = 'mcq-test-v6'; 
const urlsToCache = [
    'index.html',
    'style.css',
    'script.js',
    'manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching essential files');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // अगर रिक्वेस्ट कैश में है, तो उसे लौटा दो
                if (cachedResponse) {
                    return cachedResponse;
                }

                // अगर कैश में नहीं है, तो नेटवर्क से लाने की कोशिश करो
                return fetch(event.request).catch((error) => {
                    // यहाँ एरर को हैंडल किया जा रहा है
                    // ऑफ़लाइन होने पर गूगल फ़ॉन्ट्स जैसी चीज़ों के लिए यह ज़रूरी है
                    console.error('Fetch failed; user is likely offline.', event.request.url, error);
                    // हम कोई फ़ॉलबैक नहीं दे रहे हैं, बस सर्विस वर्कर को क्रैश होने से बचा रहे हैं
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
