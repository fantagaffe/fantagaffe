// FantaGaffe Service Worker
// Versione: aggiorna questo numero ogni volta che modifichi i file
const CACHE_VERSION = 'fantagaffe-v1';

// File da mettere in cache per uso offline
const FILES_DA_CACHARE = [
  '/fantagaffe/',
  '/fantagaffe/login.html',
  '/fantagaffe/dashboard.html',
  '/fantagaffe/invito.html',
  '/fantagaffe/manifest.json',
  '/fantagaffe/icons/icon-192.png',
  '/fantagaffe/icons/icon-512.png'
];

// Installazione: metti in cache i file principali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(FILES_DA_CACHARE).catch(err => {
        // Se un file non esiste non bloccare l'installazione
        console.log('Cache parziale:', err);
      });
    })
  );
  self.skipWaiting();
});

// Attivazione: cancella cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: rete prima, cache come fallback
// Strategia "network first" — mostra sempre dati aggiornati se c'è connessione
self.addEventListener('fetch', event => {
  // Ignora richieste non GET e richieste a Supabase (sempre rete)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva una copia in cache
        const copia = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, copia));
        return response;
      })
      .catch(() => {
        // Niente rete? Usa la cache
        return caches.match(event.request);
      })
  );
});
