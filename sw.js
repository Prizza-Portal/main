const CACHE = 'prizza-v9';
const SHELL = ['index.html','login.html','css/styles.css','js/app.js','js/portal.js','js/config.js','js/auth.js','js/i18n.js','js/files.js','js/sessions.js','js/quizzes.js','js/users.js','js/setup.js','js/whatsapp.js','js/voice.js','manifest.webmanifest','icons/icon-192.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => clients.claim())));

// Network-first for our own files, cache fallback when offline. Supabase calls are never cached.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});

// Push notifications — work even when the app is closed
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch { d = { title: 'Prizza', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Prizza', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png',
    tag: d.tag, data: { url: d.url || 'index.html' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data.url;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('navigate' in c) return c.navigate(url).then(x => x && x.focus());
    return clients.openWindow(url);
  }));
});
