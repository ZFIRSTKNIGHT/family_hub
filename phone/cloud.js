// The family cloud for the phone (the family's own sync service on Cloudflare). It replaces the
// OneDrive layer and offers the same calls (meta, download, upload, list, remove), so the phone's
// data code works unchanged. Files travel already encrypted with the family key; parts are sent
// as base64 text. This phone's sign-in to the cloud is a device token from a join code, kept in
// the phone's own storage (IndexedDB), so the service worker can use it for notifications.
(function () {
  'use strict';
  const C = window.FHCrypto, DB = window.FHdb;
  const PART = 1024 * 1024;
  const KEY = 'cloud';
  let base = '';
  let state = null;

  class CloudError extends Error {
    constructor(message, status, code, data) { super(message); this.status = status || 0; this.code = code || ''; this.data = data; }
  }
  const offline = () => new CloudError('No connection. The phone will try again when it is online.', 0, 'offline');
  const enc = encodeURIComponent;

  async function load() {
    if (!state) { try { state = (await DB.get('kv', KEY)) || null; } catch (e) { state = null; } }
    return state;
  }
  async function keep(s) { state = s; if (s) await DB.set('kv', KEY, s); else await DB.del('kv', KEY); return s; }

  async function call(method, p, opts) {
    opts = opts || {};
    const s = await load();
    const headers = {};
    const token = opts.token !== undefined ? opts.token : s && s.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    let body;
    if (opts.json !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(opts.json); }
    if (opts.text !== undefined) { headers['Content-Type'] = 'text/plain'; body = opts.text; }
    let res;
    try { res = await fetch(`${(opts.base || (s && s.url) || base).replace(/\/+$/, '')}${p}`, { method, headers, body, cache: 'no-store' }); } catch (e) { throw offline(); }
    if (opts.raw) return res;
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const code = res.status === 412 ? 'conflict' : (data && data.code) || `http-${res.status}`;
      if (data && data.code === 'revoked' && s) await keep(Object.assign({}, s, { revoked: true }));
      throw new CloudError((data && data.error) || `The family cloud answered ${res.status}.`, res.status, code, data);
    }
    return data;
  }

  // ---------------- files, the same shape the phone's data code used with OneDrive ----------------
  const item = f => ({ name: f.p.split('/').pop(), path: f.p, eTag: f.v, v: f.v, n: f.n, size: f.s, file: {}, lastModified: f.t });
  async function meta(rel) {
    try { return item(await call('GET', `/v1/meta?path=${enc(rel)}`)); } catch (e) { if (e.status === 404) return null; throw e; }
  }
  async function bytesOf(it) {
    const parts = [];
    for (let n = 0; n < (it.n || 1); n++) {
      const res = await call('GET', `/v1/part?path=${enc(it.path)}&n=${n}&v=${enc(it.v)}`, { raw: true });
      if (res.status === 409 || res.status === 404) throw new CloudError('The file changed while it was being read.', res.status, 'changed');
      if (!res.ok) throw new CloudError(`The family cloud answered ${res.status}.`, res.status, `http-${res.status}`);
      parts.push(C.b64.from(await res.text()));
    }
    const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
  async function download(rel, knownETag) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const m = await meta(rel);
      if (!m) return null;
      if (knownETag && m.eTag === knownETag) return { notModified: true, meta: m };
      try { return { bytes: await bytesOf(m), meta: m }; } catch (e) { if (e.code !== 'changed') throw e; }
    }
    throw new CloudError('The file keeps changing. Try again.', 0, 'changed');
  }
  async function upload(rel, bytes, opts) {
    opts = opts || {};
    const ifMatch = opts.ifMatch || '';
    let r;
    if (bytes.length <= PART) {
      r = await call('PUT', `/v1/blob?path=${enc(rel)}&size=${bytes.length}${ifMatch ? `&ifMatch=${enc(ifMatch)}` : ''}`, { text: C.b64.to(bytes) });
    } else {
      const up = await call('POST', '/v1/upload', { json: { path: rel, size: bytes.length } });
      for (let n = 0; n < up.parts; n++) await call('PUT', `/v1/part?upload=${enc(up.upload)}&n=${n}`, { text: C.b64.to(bytes.subarray(n * up.partSize, (n + 1) * up.partSize)) });
      r = await call('POST', '/v1/commit', { json: { upload: up.upload, ifMatch } });
    }
    return { name: rel.split('/').pop(), path: rel, eTag: r.v, v: r.v, n: r.n, size: r.s };
  }
  // what is directly inside a folder: its files, and its sub-folders by name
  async function list(relFolder) {
    const prefix = relFolder ? `${String(relFolder).replace(/\/+$/, '')}/` : '';
    const out = [], folders = new Set();
    let after = '';
    for (let round = 0; round < 50; round++) {
      const r = await call('GET', `/v1/list?prefix=${enc(prefix)}${after ? `&after=${enc(after)}` : ''}`);
      for (const f of r.items) {
        const rest = f.p.slice(prefix.length);
        const slash = rest.indexOf('/');
        if (slash < 0) out.push(item(f));
        else if (!folders.has(rest.slice(0, slash))) { folders.add(rest.slice(0, slash)); out.push({ name: rest.slice(0, slash), folder: {} }); }
      }
      if (!r.more || !r.items.length) break;
      after = r.items[r.items.length - 1].p;
    }
    return out;
  }
  async function remove(rel) {
    try { await call('DELETE', `/v1/blob?path=${enc(rel)}`); } catch (e) { if (e.status !== 404) throw e; }
    return true;
  }

  // ---------------- this phone in the family cloud ----------------
  async function join(code, name) {
    const r = await call('POST', '/v1/join', { json: { code, name, platform: 'phone' }, token: '', base });
    await keep({ url: base, token: r.token, deviceId: r.device.id, deviceName: r.device.name, role: r.device.role, status: r.device.status, familyName: r.family.name, approval: r.approval || null, joinedAt: Date.now() });
    return state;
  }
  async function me() {
    const r = await call('GET', '/v1/me');
    const s = await load();
    await keep(Object.assign({}, s, { deviceName: r.device.name, role: r.device.role, status: r.device.status, familyName: r.family ? r.family.name : s.familyName, owner: r.owner, email: r.email }));
    return r;
  }
  async function approve(code) {
    const s = await load();
    if (!s || !s.approval) throw new CloudError('Ask for a new approval code.', 0, 'no-code');
    await call('POST', '/v1/codes/verify', { json: { id: s.approval.id, code } });
    await keep(Object.assign({}, s, { status: 'active', approval: null }));
    return state;
  }
  async function signOut() {
    try { await call('POST', '/v1/devices/signout', { json: {} }); } catch (e) { /* offline: the organiser can sign it out */ }
    await keep(null);
  }

  // ---------------- notifications ----------------
  const urlKey = s => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return C.b64.from(s); };
  async function subscribePush(reg) {
    if (!reg || !reg.pushManager || typeof Notification === 'undefined') return false;
    if (Notification.permission === 'denied') return false;
    if (Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') return false;
    }
    const { key } = await call('GET', '/v1/push/key');
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlKey(key) });
    await call('PUT', '/v1/push', { json: { subscription: sub.toJSON() } });
    return true;
  }
  async function pushReady(reg) {
    try { return !!(reg && reg.pushManager && Notification.permission === 'granted' && await reg.pushManager.getSubscription()); } catch (e) { return false; }
  }

  window.FHCloud = {
    CloudError, PART,
    setBase(url) { base = String(url || '').replace(/\/+$/, ''); },
    base: () => base,
    state: load, keep, call,
    meta, bytesOf, download, upload, list, remove,
    join, me, approve, signOut, subscribePush, pushReady,
    notify: (to, kind, body) => call('POST', '/v1/notify', { json: { to, kind, body } }),
  };
})();
