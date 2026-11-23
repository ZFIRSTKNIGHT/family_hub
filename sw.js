// The phone app's service worker.
//  - keeps the app's own files on the phone, so it opens without a connection
//  - serves the family's files as fhfile/<path>: the open app page downloads and decrypts them
//    (it holds the family key), the worker hands them to <img>, <audio> and the book reader,
//    including the byte ranges iPhones ask for when playing audio
const VERSION = '4.0.0-febc178b0f';
const SHELL = ["./","app.js","assets/apple-touch-icon.png","assets/favicon-96.png","assets/icon-192.png","assets/icon-512.png","assets/icon.png","assets/logo.png","assets/maskable-512.png","fonts/dm-sans-latin-400-normal.woff2","fonts/dm-sans-latin-500-normal.woff2","fonts/dm-sans-latin-600-normal.woff2","fonts/dm-sans-latin-700-normal.woff2","fonts/dm-serif-display-latin-400-normal.woff2","fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2","fonts/ibm-plex-sans-arabic-arabic-500-normal.woff2","fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2","fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2","fonts/manrope-latin-400-normal.woff2","fonts/manrope-latin-500-normal.woff2","fonts/manrope-latin-600-normal.woff2","fonts/manrope-latin-700-normal.woff2","fonts/manrope-latin-800-normal.woff2","fonts/plus-jakarta-sans-latin-400-normal.woff2","fonts/plus-jakarta-sans-latin-500-normal.woff2","fonts/plus-jakarta-sans-latin-600-normal.woff2","fonts/plus-jakarta-sans-latin-700-normal.woff2","fonts/plus-jakarta-sans-latin-800-normal.woff2","index.html","lib/analysis.js","lib/charts.js","lib/crud.js","lib/i18n.js","lib/knowledge.js","lib/schema.js","lib/theme-boot.js","lib/util.js","manifest.webmanifest","pages/calendar.js","pages/career.js","pages/child.js","pages/cloud.js","pages/credentials.js","pages/dashboard.js","pages/goals.js","pages/health.js","pages/importer.js","pages/library.js","pages/media.js","pages/messages.js","pages/money.js","pages/mydiary.js","pages/school.js","pages/settings.js","pages/study.js","phone/boot.js","phone/cloud.js","phone/fhcrypto.js","phone/hub.js","phone/idb.js","phone/merge.gen.js","phone/phone.css","styles-phone.css","styles-themes.css","styles.css","vendor/jszip.min.js","vendor/pdf-fonts/FoxitDingbats.pfb","vendor/pdf-fonts/FoxitFixed.pfb","vendor/pdf-fonts/FoxitFixedBold.pfb","vendor/pdf-fonts/FoxitFixedBoldItalic.pfb","vendor/pdf-fonts/FoxitFixedItalic.pfb","vendor/pdf-fonts/FoxitSerif.pfb","vendor/pdf-fonts/FoxitSerifBold.pfb","vendor/pdf-fonts/FoxitSerifBoldItalic.pfb","vendor/pdf-fonts/FoxitSerifItalic.pfb","vendor/pdf-fonts/FoxitSymbol.pfb","vendor/pdf-fonts/LiberationSans-Bold.ttf","vendor/pdf-fonts/LiberationSans-BoldItalic.ttf","vendor/pdf-fonts/LiberationSans-Italic.ttf","vendor/pdf-fonts/LiberationSans-Regular.ttf","vendor/pdf.min.js","vendor/pdf.worker.min.js","vendor/qrcode.js","vendor/scrypt.js","config.js"];
const CACHE = `fh-shell-${VERSION}`;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(p => new Request(p, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('fh-shell-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Microsoft and OneDrive go straight through
  const scope = self.registration.scope;
  if (!url.href.startsWith(scope)) return;
  const path = url.href.slice(scope.length).split('#')[0].split('?')[0];
  if (path.startsWith('fhfile/')) { e.respondWith(serveFile(e, decodeURIComponent(path.slice(7)))); return; }
  if (/^(graph|dl|upload|oauth)\//.test(path)) return; // the test server's stand-ins
  if (req.mode === 'navigate') {
    // the app's two pages open from the phone even without a connection; anything else is the network's
    const page = path === '' || path === 'index.html' ? 'index.html' : path === 'auth.html' ? 'auth.html' : null;
    if (page) e.respondWith(caches.match(scope + page, { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});

// decrypted files stay in memory a few minutes (the book reader and audio ask for many pieces)
const mem = new Map();
let memBytes = 0;
function remember(rel, rec) {
  mem.set(rel, Object.assign(rec, { at: Date.now() }));
  memBytes += rec.bytes.length;
  for (const [k, v] of mem) {
    if (memBytes <= 80 * 1024 * 1024 && Date.now() - v.at < 5 * 60 * 1000) break;
    mem.delete(k); memBytes -= v.bytes.length;
  }
}
async function pickClient(id) {
  if (id) { try { const c = await self.clients.get(id); if (c && c.type === 'window') return c; } catch (e) { /* ignore */ } }
  const all = await self.clients.matchAll({ type: 'window' });
  return all.find(c => c.focused) || all.find(c => c.visibilityState === 'visible') || all[0] || null;
}
async function serveFile(e, rel) {
  let rec = mem.get(rel);
  if (rec && Date.now() - rec.at < 5 * 60 * 1000) rec.at = Date.now();
  else {
    const client = await pickClient(e.clientId || e.resultingClientId);
    if (!client) return new Response('The app is not open', { status: 503 });
    const reply = await new Promise(resolve => {
      const ch = new MessageChannel();
      const t = setTimeout(() => resolve({ ok: false, error: 'timeout' }), 120000);
      ch.port1.onmessage = ev => { clearTimeout(t); resolve(ev.data || {}); };
      client.postMessage({ type: 'fh-file', rel }, [ch.port2]);
    });
    if (!reply.ok) return new Response(reply.error || 'Not found', { status: 404 });
    rec = { bytes: new Uint8Array(reply.bytes), type: reply.type || 'application/octet-stream' };
    remember(rel, rec);
  }
  return ranged(e.request, rec.bytes, rec.type);
}
function ranged(req, bytes, type) {
  const headers = { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('Range') || '');
  if (m && (m[1] !== '' || m[2] !== '')) {
    let start, end;
    if (m[1] === '') { start = Math.max(0, bytes.length - Number(m[2])); end = bytes.length - 1; } else { start = Number(m[1]); end = m[2] === '' ? bytes.length - 1 : Math.min(Number(m[2]), bytes.length - 1); }
    if (start >= bytes.length || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${bytes.length}` } });
    return new Response(bytes.slice(start, end + 1), { status: 206, headers: Object.assign(headers, { 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': String(end - start + 1) }) });
  }
  return new Response(bytes, { status: 200, headers: Object.assign(headers, { 'Content-Length': String(bytes.length) }) });
}

// ---- notifications from the family cloud (Web Push) ----
// The message text arrives encrypted with the family key; the worker opens it with the key this
// phone keeps (the app stored it in IndexedDB as a key that can be used but not read out).
function idbGet(store, key) {
  return new Promise(resolve => {
    const req = indexedDB.open('family-hub-phone', 1);
    req.onerror = () => resolve(null);
    req.onupgradeneeded = () => { try { req.transaction.abort(); } catch (e) { /* nothing stored yet */ } resolve(null); };
    req.onsuccess = () => {
      try {
        const g = req.result.transaction(store).objectStore(store).get(key);
        g.onsuccess = () => resolve(g.result || null);
        g.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    };
  });
}
function fromB64(s) { const bin = atob(String(s || '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
async function openNote(sealedB64) {
  try {
    const key = await idbGet('kv', 'dek');
    if (!key) return null;
    const blob = fromB64(sealedB64);
    if (blob.length < 33 || blob[0] !== 70 || blob[1] !== 72 || blob[2] !== 69 || blob[3] !== 49) return null; // "FHE1"
    const ct = new Uint8Array(blob.length - 32);
    ct.set(blob.subarray(32), 0);
    const both = new Uint8Array(ct.length + 16);
    both.set(ct, 0); both.set(blob.subarray(16, 32), ct.length);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.subarray(4, 16) }, key, both);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (e) { return null; }
}
async function fromInbox(id) {
  try {
    const st = await idbGet('kv', 'cloud');
    if (!st || !st.token) return null;
    const r = await fetch(`${st.url}/v1/inbox?after=${Math.max(0, Number(id) - 1)}`, { headers: { Authorization: `Bearer ${st.token}` }, cache: 'no-store' });
    const j = await r.json();
    const it = (j.items || []).find(x => x.id === id) || (j.items || [])[0];
    return it ? (it.kind === 'alert' ? alertNote(it.body) : openNote(it.body)) : null;
  } catch (e) { return null; }
}
function alertNote(body) { let a = {}; try { a = JSON.parse(body); } catch (e) { a = {}; } return { title: 'Family Hub security', body: a.text || 'Something changed in the family cloud.', nav: '#/cloud', tag: 'security' }; }
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let msg = {};
    try { msg = e.data ? e.data.json() : {}; } catch (err) { msg = {}; }
    let note = null;
    if (msg.kind === 'alert' && msg.body) note = alertNote(msg.body);
    else if (msg.body) note = await openNote(msg.body);
    else if (msg.more || msg.id) note = await fromInbox(msg.id);
    if (!note) note = { title: 'Family Hub', body: 'Something new in the family.' };
    await self.registration.showNotification(note.title || 'Family Hub', {
      body: note.body || '', tag: note.tag || undefined, renotify: !!note.tag, icon: 'assets/icon-192.png',
      data: { nav: note.nav || '#/home' },
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const nav = (e.notification.data && e.notification.data.nav) || '#/home';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = all.find(x => x.url.startsWith(self.registration.scope));
    if (c) { await c.focus(); c.postMessage({ type: 'fh-nav', nav }); return; }
    await self.clients.openWindow(`${self.registration.scope}${nav}`);
  })());
});
