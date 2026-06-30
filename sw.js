/* ════════════════════════════════════════════════════════════════
   SIGE Prepa 50 — Service Worker (modo app / sin conexión)
   Cachea los archivos del sistema para que abra aunque no haya
   internet. Los DATOS siguen viniendo de Firebase en tiempo real;
   esto solo cachea la "cáscara" de la aplicación.
   Sube el número de versión (CACHE) cada vez que actualices
   archivos del sistema, para que los dispositivos descarguen lo nuevo.
   ════════════════════════════════════════════════════════════════ */
const CACHE = 'sige-p50-v16';
const ARCHIVOS = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/nube.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARCHIVOS)).catch(()=>{}));
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const url = e.request.url;
  // Nunca interceptar Firebase ni CDNs: deben ir siempre a la red (datos en vivo).
  if(url.includes('firestore') || url.includes('firebase') || url.includes('googleapis') ||
     url.includes('gstatic') || url.includes('cloudflare') || url.includes('wa.me')){
    return; // el navegador lo maneja normalmente
  }
  if(e.request.method!=='GET') return;
  // Estrategia: red primero (para traer la versión más nueva), con respaldo al caché.
  e.respondWith(
    fetch(e.request).then(resp=>{
      const copia = resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copia)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match(e.request).then(r=>r || caches.match('./index.html')))
  );
});
