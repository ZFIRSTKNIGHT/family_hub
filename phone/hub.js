// window.hub for the phone: the same calls the PC's preload.js offers, so every screen works
// unchanged. Instead of the PC's main process it uses the family cloud (FHCloud), the family key
// kept on this phone (FHCrypto + FHdb), and the same rules as the PC: storage.js (merge, via the
// generated FHMerge), messages.js and diary.js.
(function () {
  'use strict';
  const C = window.FHCrypto, G = window.FHCloud, DB = window.FHdb, M = window.FHMerge;
  const te = C.te, td = C.td;
  const CFG = window.FH_CONFIG || {};
  const DATA = 'family-hub-data.enc', KEYRING = 'family-hub-keys.json';
  const PC_ONLY = 'This is done on the family PC.';
  const MAX_FILE = 25 * 1024 * 1024;
  const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.heic': 'image/heic', '.epub': 'application/epub+zip', '.webm': 'audio/webm', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4', '.txt': 'text/plain', '.json': 'application/json', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  const extOf = name => { const m = String(name).toLowerCase().match(/\.[a-z0-9]+$/); return m ? m[0] : ''; };
  const kindOf = name => MIME[extOf(name)] || 'application/octet-stream';
  const safe = s => String(s || '').replace(/[^\w-]/g, '').slice(0, 80);
  const safeId = s => String(s || '').replace(/[^\w-]/g, '').slice(0, 64);
  const randHex = n => C.hex(crypto.getRandomValues(new Uint8Array(n)));
  const pcOnly = () => Promise.reject(new Error(PC_ONLY));
  async function mapLimit(list, n, fn) {
    const out = new Array(list.length);
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) { const k = i++; out[k] = await fn(list[k], k); } }));
    return out;
  }

  let dek = null;                 // the family key (non-extractable CryptoKey)
  let data = null;                // the records as last read or saved
  let dataETag = null;            // the OneDrive version those records were merged with
  let session = { role: null, childId: null, userId: null };
  let saving = Promise.resolve(), inFlight = 0;
  const L = { external: [], lock: [], nav: [], message: [] };
  const emit = (k, v) => L[k].forEach(cb => { try { cb(v); } catch (e) { console.error(e); } });

  // ================= the family key on this phone =================
  async function restoreKey() {
    if (!dek) { try { dek = (await DB.get('kv', 'dek')) || null; } catch (e) { dek = null; } }
    return !!dek;
  }
  async function keepKey(raw) {
    dek = await C.importKey(raw, false); // the phone can use it but never read it back out
    raw.fill(0);
    await DB.set('kv', 'dek', dek);
  }
  async function forgetKey() {
    dek = null; data = null; dataETag = null;
    await DB.del('kv', 'dek'); await DB.del('kv', 'pending'); await DB.clear('files');
    MSG.reset(); DIARY.lockAll();
  }
  async function readKeyring() {
    const r = await G.download(KEYRING);
    if (!r) throw new Error('There is no family data in the family cloud yet. Set it up on the family PC first.');
    const k = JSON.parse(td.decode(r.bytes));
    if (!Array.isArray(k.wraps)) k.wraps = [];
    return k;
  }
  async function unlockWithPassword(username, password) {
    const k = await readKeyring();
    const user = String(username || '').toLowerCase();
    for (const w of k.wraps.filter(x => x.kind === 'parent' && x.user === user)) {
      try { await keepKey(await C.unwrap(await C.vaultKek(password, w.salt), w.w)); return true; } catch (e) { /* wrong password */ }
    }
    return false;
  }
  async function unlockWithRecovery(code) {
    const k = await readKeyring();
    const w = k.wraps.find(x => x.kind === 'recovery');
    if (!w) return false;
    try { await keepKey(await C.unwrap(await C.vaultKek(C.normCode(code), w.salt), w.w)); return true; } catch (e) { return false; }
  }

  // ================= records =================
  const decryptData = async bytes => M.ensureShape(JSON.parse(td.decode(await C.open(dek, bytes))));
  async function cachedData() {
    const c = await DB.get('files', DATA);
    if (!c || !c.bytes) return null;
    dataETag = c.eTag || null;
    return decryptData(c.bytes);
  }
  // the latest records from OneDrive (unchanged ones come from this phone's copy)
  async function pull() {
    const c = await DB.get('files', DATA);
    const r = await G.download(DATA, c && c.bytes ? c.eTag : null);
    if (!r) throw new Error('The family data is not in the family cloud yet. Set it up on the family PC first.');
    if (r.notModified) { dataETag = r.meta.eTag; return decryptData(c.bytes); }
    const d = await decryptData(r.bytes);
    await DB.putFile(DATA, { bytes: r.bytes, eTag: r.meta.eTag, keep: true });
    dataETag = r.meta.eTag;
    return d;
  }
  // Save: if another PC or phone saved since we last read, merge record by record (the PC's
  // own rule), then write only if OneDrive still has the version we merged with.
  async function saveNow(d) {
    let mine = M.ensureShape(d), merged = false;
    for (let attempt = 0; attempt < 6; attempt++) {
      const m = await G.meta(DATA);
      if (m && m.eTag !== dataETag) {
        mine = M.merge(mine, await decryptData(await G.bytesOf(m)));
        merged = true;
        dataETag = m.eTag;
      }
      const sealed = await C.seal(dek, te.encode(JSON.stringify(mine)));
      try {
        const item = await G.upload(DATA, sealed, { ifMatch: m ? m.eTag : undefined });
        dataETag = item.eTag;
        await DB.putFile(DATA, { bytes: sealed, eTag: item.eTag, keep: true });
        await DB.del('kv', 'pending');
        data = mine;
        return { data: mine, merged };
      } catch (e) {
        if (e.code === 'conflict') continue; // someone saved in between: merge again
        throw e;
      }
    }
    throw new Error('The family data kept changing on another device. Try again.');
  }
  let pendingTimer = null;
  function schedulePending() {
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => pushPending().catch(() => schedulePending()), 20000);
  }
  async function pushPending() {
    const p = await DB.get('kv', 'pending');
    if (!p || !dek) return;
    const mine = await decryptData(p);
    const res = await save(mine);
    if (res && res.merged && res.data) emit('external', res.data);
  }
  function save(d) {
    const run = async () => {
      inFlight++;
      try { return await saveNow(d); } catch (e) {
        if (e.code !== 'offline') throw e;
        // no connection: keep the change on this phone (encrypted) and send it when back online
        await DB.set('kv', 'pending', await C.seal(dek, te.encode(JSON.stringify(M.ensureShape(d)))));
        data = d;
        schedulePending();
        return { merged: false, data: null, offline: true };
      } finally { inFlight--; }
    };
    saving = saving.then(run, run);
    return saving;
  }
  // another device changed the records: read them and tell the screens
  async function pollData() {
    if (!dek || inFlight || document.hidden) return;
    try {
      const m = await G.meta(DATA);
      if (!m || m.eTag === dataETag || inFlight) { if (m) { lastSync = Date.now(); syncError = null; } return; }
      const bytes = await G.bytesOf(m);
      const d = await decryptData(bytes);
      if (inFlight) return;
      await DB.putFile(DATA, { bytes, eTag: m.eTag, keep: true });
      dataETag = m.eTag;
      data = d;
      lastSync = Date.now(); syncError = null;
      emit('external', d);
    } catch (e) { syncError = { message: e.message, code: e.code || '' }; /* offline or mid-sync: next time */ }
  }

  // ================= files =================
  async function fileBytes(rel) {
    const key = `${rel}.enc`;
    const c = await DB.get('files', key);
    if (c && c.bytes) { DB.set('files', key, Object.assign(c, { at: Date.now() })).catch(() => {}); return C.open(dek, c.bytes); }
    let r = await G.download(key);
    if (r) { DB.putFile(key, { bytes: r.bytes, eTag: r.meta.eTag }).catch(() => {}); return C.open(dek, r.bytes); }
    r = await G.download(rel); // version 1 kept some files unencrypted
    if (r) return C.isSealed(r.bytes) ? C.open(dek, r.bytes) : r.bytes;
    throw new Error('File not found: ' + rel);
  }
  async function exists(rel) { return !!(await G.meta(`${rel}.enc`)) || !!(await G.meta(rel)); }
  async function uniqueRel(folder, name) {
    const ext = extOf(name);
    const stem = ext ? name.slice(0, name.length - ext.length) : name;
    const base = stem.replace(/[^\w\-. ()؀-ۿ]+/g, '').trim().slice(0, 80) || 'file';
    let file = `${base}${ext}`, i = 1;
    while (await exists(`${folder}/${file}`)) file = `${base}-${++i}${ext}`;
    return `${folder}/${file}`;
  }
  async function storeBuffer(bytes, kind, name) {
    const folder = String(kind || 'documents').split('/').filter(s => s && s !== '..').join('/') || 'documents';
    const rel = await uniqueRel(folder, String(name || 'file'));
    const sealed = await C.seal(dek, bytes);
    await G.upload(`${rel}.enc`, sealed);
    DB.putFile(`${rel}.enc`, { bytes: sealed }).catch(() => {});
    return { rel, name: rel.split('/').pop() };
  }
  const FOLDERS = ['reports', 'photos', 'documents', 'books', 'receipts', 'exports'];

  // Files chosen on the phone: the screens pass "paths" around, so each chosen file gets one.
  const picked = new Map();
  let pickSeq = 0;
  const register = file => { const id = `phone-file:${++pickSeq}/${file.name}`; picked.set(id, file); return id; };
  async function pickedFile(src) {
    const f = picked.get(src);
    if (!f) throw new Error('That file is no longer available. Choose it again.');
    return { bytes: new Uint8Array(await f.arrayBuffer()), name: f.name, size: f.size, type: f.type };
  }
  function pick(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = !!opts.multi;
      const exts = [].concat(...(opts.filters || []).map(f => f.extensions || [])).filter(e => e && e !== '*');
      if (exts.length) input.accept = exts.map(e => `.${e}`).concat(exts.some(e => /^(jpe?g|png|gif|webp|heic|bmp)$/i.test(e)) ? ['image/*'] : []).join(',');
      let done = false;
      const finish = list => { if (done) return; done = true; input.remove(); resolve(list); };
      input.addEventListener('change', () => finish(Array.from(input.files || []).map(register)));
      input.addEventListener('cancel', () => finish([]));
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();
    });
  }
  // open a stored file: the phone's share sheet (Files, Books, Photos…) or a download
  async function openFile(rel) {
    const bytes = await fileBytes(rel);
    const name = rel.split('/').pop();
    const file = new File([bytes], name, { type: kindOf(name) });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return true; } catch (e) { if (e && e.name === 'AbortError') return true; }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }
  // printing (and "save as PDF" from the print screen)
  function printHtml(html) {
    return new Promise(resolve => {
      const f = document.createElement('iframe');
      f.setAttribute('aria-hidden', 'true');
      f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
      f.srcdoc = String(html || '');
      f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { /* ignore */ } setTimeout(() => { f.remove(); resolve(true); }, 2000); };
      document.body.appendChild(f);
    });
  }
  // the service worker asks for a file it is serving as fhfile/<path>
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', e => {
      const m = e.data || {};
      if (m.type !== 'fh-file' || !e.ports || !e.ports[0]) return;
      const port = e.ports[0];
      if (!dek) { port.postMessage({ ok: false, error: 'locked' }); return; }
      fileBytes(m.rel).then(bytes => port.postMessage({ ok: true, bytes, type: kindOf(m.rel) }, [bytes.buffer]),
        err => port.postMessage({ ok: false, error: String((err && err.message) || err) }));
    });
  }
  const fileUrl = rel => `fhfile/${encodeURIComponent(rel)}`;

  // ================= messages (as messages.js on the PC) =================
  // one message per id (a sync tool's copy never shows twice; a deletion wins)
  const dedupe = list => {
    const by = new Map();
    for (const m of list) {
      const cur = by.get(m.id);
      if (!cur) { by.set(m.id, m); continue; }
      const better = (m.deleted && !cur.deleted) || (!!m.deleted === !!cur.deleted && String(m.editedAt || '') > String(cur.editedAt || ''));
      if (better) by.set(m.id, m);
    }
    return Array.from(by.values());
  };
  const monthsBack = () => { const now = new Date(); return [new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 7), now.toISOString().slice(0, 7)]; };
  // other members learn about a new message even when their app is closed (the text travels encrypted)
  async function sealNote(note) { return C.b64.to(await C.seal(dek, te.encode(JSON.stringify(note)))); }
  async function notifyMessage(msgs, m) {
    const chat = msgs.chat(m.chat);
    const to = msgs.members(chat).filter(id => id !== m.from).map(id => `user:${id}`);
    if (!to.length) return;
    const from = msgs.users().find(x => x.id === m.from) || {};
    const group = chat.kind !== 'direct' ? ` · ${chat.kind === 'family' ? 'Family' : chat.kind === 'parents' ? 'Parents' : chat.kind === 'kids' ? 'Kids' : (chat.name || 'Group')}` : '';
    const what = m.text ? m.text.slice(0, 140) : (m.files || []).some(f => f.kind === 'voice') ? 'Voice note' : (m.files || []).some(f => f.kind === 'image') ? 'Picture' : (m.files || []).length ? 'File' : m.card ? m.card.title : '';
    await G.notify(to, 'message', await sealNote({ title: `${from.displayName || from.username || 'Message'}${group}`, body: what, nav: `#/messages/${m.chat}`, tag: `chat:${m.chat}` }));
  }

  const MSG = {
    cache: new Map(), monthCache: new Map(), known: null,
    reset() { this.cache.clear(); this.monthCache.clear(); this.known = null; },
    users() { return (data && data.users) || []; },
    me() { return this.users().find(x => x.id === session.userId) || null; },
    chat(id) {
      const builtIn = { 'chat-family': { id: 'chat-family', kind: 'family' }, 'chat-parents': { id: 'chat-parents', kind: 'parents' }, 'chat-kids': { id: 'chat-kids', kind: 'kids' } };
      if (builtIn[id]) return builtIn[id];
      if (/^dm-/.test(id)) return { id, kind: 'direct', members: id.slice(3).split('--') };
      return ((data && data.chats) || []).find(c => c.id === id) || null;
    },
    members(chat) {
      const us = this.users();
      if (!chat) return [];
      if (chat.kind === 'family') return us.map(x => x.id);
      if (chat.kind === 'parents') return us.filter(x => x.role === 'parent').map(x => x.id);
      if (chat.kind === 'kids') return us.filter(x => x.role === 'child').map(x => x.id);
      return (chat.members || []).filter(id => us.some(x => x.id === id));
    },
    canRead(chatId, user) {
      if (!user) return false;
      const chat = this.chat(chatId);
      if (!chat) return false;
      const m = this.members(chat);
      if (m.includes(user.id)) return true;
      if (user.role === 'parent') { const us = this.users(); return m.length > 0 && m.every(id => (us.find(x => x.id === id) || {}).role === 'child'); }
      return false;
    },
    canWrite(chatId, user) { const chat = this.chat(chatId); return !!user && !!chat && this.members(chat).includes(user.id); },
    async months(chatId) {
      const hit = this.monthCache.get(chatId);
      if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.list;
      const list = (await G.list(`messages/${safe(chatId)}`)).filter(i => i.folder && /^\d{4}-\d{2}$/.test(i.name)).map(i => i.name).sort();
      this.monthCache.set(chatId, { at: Date.now(), list });
      return list;
    },
    async readItem(rel, item) {
      const hit = this.cache.get(rel);
      if (hit && hit.eTag === item.eTag) return hit.msg;
      const c = await DB.get('files', rel).catch(() => null);
      let bytes = c && c.bytes && c.eTag === item.eTag ? c.bytes : null;
      if (!bytes) { bytes = await G.bytesOf(item); DB.putFile(rel, { bytes, eTag: item.eTag }).catch(() => {}); }
      try { const msg = JSON.parse(td.decode(await C.open(dek, bytes))); this.cache.set(rel, { eTag: item.eTag, msg }); return msg; } catch (e) { return null; }
    },
    async folderItems(chatId, month) {
      const dir = `messages/${safe(chatId)}/${month}`;
      return { dir, items: (await G.list(dir)).filter(i => i.file && /\.json\.enc$/.test(i.name)) };
    },
    async readMonth(chatId, month) {
      const { dir, items } = await this.folderItems(chatId, month);
      return (await mapLimit(items, 6, it => this.readItem(`${dir}/${it.name}`, it))).filter(Boolean);
    },
    async list(chatId, months) {
      const user = this.me();
      if (!this.canRead(chatId, user)) throw new Error('This chat is not yours.');
      const all = await this.months(chatId);
      const use = all.slice(-Math.max(1, months || 3));
      const out = [];
      for (const m of use) out.push(...await this.readMonth(chatId, m));
      const one = dedupe(out);
      one.sort((a, b) => String(a.at).localeCompare(String(b.at)) || String(a.id).localeCompare(String(b.id)));
      return { messages: one, more: all.length > use.length };
    },
    async send(chatId, payload) {
      const user = this.me();
      if (!this.canWrite(chatId, user)) throw new Error('You are not in this chat.');
      const { text, files, card, replyTo } = payload || {};
      const body = String(text || '').slice(0, 4000);
      const att = (files || []).slice(0, 10).map(f => ({ rel: String(f.rel), name: String(f.name || 'file'), size: Number(f.size) || 0, type: String(f.type || ''), kind: f.kind === 'voice' ? 'voice' : /^image\//.test(f.type || '') ? 'image' : 'file', duration: Number(f.duration) || 0 }));
      if (!body.trim() && !att.length && !card) throw new Error('Nothing to send.');
      const at = new Date().toISOString();
      const id = 'm' + Date.now().toString(36) + randHex(3);
      const msg = { id, chat: chatId, from: user.id, at, text: body, files: att, card: card ? { type: String(card.type || ''), id: String(card.id || ''), title: String(card.title || '').slice(0, 200), sub: String(card.sub || '').slice(0, 300), route: String(card.route || '') } : null, replyTo: replyTo ? String(replyTo) : null };
      const rel = `messages/${safe(chatId)}/${at.slice(0, 7)}/${id}.json.enc`;
      const sealed = await C.seal(dek, te.encode(JSON.stringify(msg)));
      const item = await G.upload(rel, sealed);
      if (this.known) this.known.add(rel);
      this.cache.set(rel, { eTag: item.eTag, msg });
      DB.putFile(rel, { bytes: sealed, eTag: item.eTag }).catch(() => {});
      const mc = this.monthCache.get(chatId);
      if (mc && !mc.list.includes(at.slice(0, 7))) mc.list.push(at.slice(0, 7));
      notifyMessage(this, msg).catch(() => {});
      return msg;
    },
    async remove(chatId, id, month) {
      const user = this.me();
      const rel = `messages/${safe(chatId)}/${String(month || '').replace(/[^\d-]/g, '')}/${safe(id)}.json.enc`;
      const r = await G.download(rel);
      if (!r) throw new Error('Message not found.');
      const msg = JSON.parse(td.decode(await C.open(dek, r.bytes)));
      if (!user || msg.from !== user.id) throw new Error('You can only delete your own messages.');
      const gone = Object.assign({}, msg, { text: '', files: [], card: null, deleted: true, editedAt: new Date().toISOString() });
      const item = await G.upload(rel, await C.seal(dek, te.encode(JSON.stringify(gone))));
      this.cache.set(rel, { eTag: item.eTag, msg: gone });
      return gone;
    },
    async attachBytes(bytes, name) {
      if (bytes.length > MAX_FILE) throw new Error(`${name} is larger than 25 MB.`);
      return Object.assign(await storeBuffer(bytes, 'messages/files', name), { size: bytes.length });
    },
    async readMarkers() {
      const items = (await G.list('messages/_read')).filter(i => i.file && /\.json\.enc$/.test(i.name));
      const out = {};
      await mapLimit(items, 6, async it => {
        try { out[it.name.replace(/\.json\.enc$/, '')] = JSON.parse(td.decode(await C.open(dek, await G.bytesOf(it)))); } catch (e) { /* skip */ }
      });
      return out;
    },
    async setRead(chatId, at) {
      const user = this.me();
      if (!user) return {};
      const rel = `messages/_read/${safe(user.id)}.json.enc`;
      let cur = {};
      try { const r = await G.download(rel); if (r) cur = JSON.parse(td.decode(await C.open(dek, r.bytes))); } catch (e) { cur = {}; }
      if (String(cur[chatId] || '') >= String(at || '')) return cur;
      cur[chatId] = at;
      await G.upload(rel, await C.seal(dek, te.encode(JSON.stringify(cur))));
      return cur;
    },
    async overview(chatIds) {
      const user = this.me();
      if (!user) return {};
      const marks = (await this.readMarkers())[user.id] || {};
      const out = {};
      await mapLimit((chatIds || []).filter(id => this.canRead(id, user)), 3, async id => {
        const months = (await this.months(id)).slice(-2);
        const all = [];
        for (const m of months) all.push(...await this.readMonth(id, m));
        let last = null, unread = 0;
        for (const msg of dedupe(all)) {
          if (!last || msg.at > last.at) last = msg;
          if (msg.from !== user.id && !msg.deleted && String(msg.at) > String(marks[id] || '')) unread++;
        }
        out[id] = { last, unread };
      });
      return out;
    },
    // new message files from other devices (the PC's scan, over OneDrive)
    async scan() {
      const user = this.me();
      if (!user || !dek) return [];
      const chats = await this.chatFolders();
      const first = !this.known;
      if (first) this.known = new Set();
      const fresh = [];
      for (const c of chats.filter(id => this.canRead(id, user))) {
        for (const month of monthsBack()) {
          let got;
          try { got = await this.folderItems(c, month); } catch (e) { continue; }
          const names = got.items.map(i => i.name);
          for (const it of got.items) {
            const rel = `${got.dir}/${it.name}`;
            if (this.known.has(rel)) continue;
            if (first) { this.known.add(rel); continue; }
            const msg = await this.readItem(rel, it);
            if (!msg) continue;
            this.known.add(rel);
            const own = `${safe(msg.id)}.json.enc`;
            if (it.name !== own && names.includes(own)) continue; // a copy of a message already here
            if (fresh.some(x => x.id === msg.id)) continue;
            fresh.push(msg);
          }
        }
      }
      return fresh;
    },
    async chatFolders() {
      if (this._folders && Date.now() - this._folders.at < 2 * 60 * 1000) return this._folders.list;
      const list = (await G.list('messages')).filter(i => i.folder && !/^(_read|files)$/.test(i.name)).map(i => i.name);
      this._folders = { at: Date.now(), list };
      return list;
    },
  };

  // ================= a child's private diary (as diary.js on the PC) =================
  const DIARY = {
    open: {}, oldKeys: {}, fails: {},
    dir: id => `diary/${safeId(id)}`,
    kidOnly() { if (session.role !== 'child' || !session.childId) throw new Error('Only the child can open their diary.'); return session.childId; },
    checkPin(pin) { if (!/^\d{6}$/.test(String(pin || ''))) throw new Error('The PIN is 6 digits.'); },
    async readKeys(id) {
      const r = await G.download(`${this.dir(id)}/keys.json`);
      if (!r) return { volumes: [], active: null };
      try { const k = JSON.parse(td.decode(r.bytes)); if (!Array.isArray(k.volumes)) k.volumes = []; return k; } catch (e) { return { volumes: [], active: null }; }
    },
    writeKeys(id, k) { return G.upload(`${this.dir(id)}/keys.json`, te.encode(JSON.stringify(k, null, 1))); },
    statusOf(id, k) {
      const active = k.volumes.find(v => v.id === k.active) || null;
      const older = k.volumes.filter(v => v.id !== k.active).map(v => ({ id: v.id, created: v.created, open: !!(this.oldKeys[id] || {})[v.id] }));
      const f = this.fails[id];
      return { hasPin: !!active, unlocked: !!(this.open[id] && active && this.open[id].vol === active.id), resetAt: k.resetAt || null, older, waitSeconds: f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0 };
    },
    async status(childId) {
      const id = session.role === 'child' ? session.childId : childId;
      if (!id) throw new Error('No child chosen.');
      const st = this.statusOf(id, await this.readKeys(id));
      return session.role === 'child' ? st : { hasPin: st.hasPin, resetAt: st.resetAt, hasOlder: st.older.length > 0 };
    },
    async setup(pin) {
      const id = this.kidOnly();
      this.checkPin(pin);
      const k = await this.readKeys(id);
      if (k.active && k.volumes.some(v => v.id === k.active)) throw new Error('This diary already has a PIN.');
      const raw = crypto.getRandomValues(new Uint8Array(32)), salt = crypto.getRandomValues(new Uint8Array(16));
      const vol = 'v' + Date.now().toString(36);
      const kek = await C.importKey(await C.diaryKek(pin, C.b64.to(salt)));
      const wrapped = await C.seal(kek, raw, C.FHD);
      k.volumes.push({ id: vol, created: new Date().toISOString(), salt: C.b64.to(salt), wrapped: C.b64.to(wrapped) });
      k.active = vol;
      delete k.resetAt;
      await this.writeKeys(id, k);
      this.open[id] = { vol, key: await C.importKey(raw), at: Date.now() };
      raw.fill(0);
      return this.statusOf(id, k);
    },
    async tryVolume(v, pin) {
      try {
        const kek = await C.importKey(await C.diaryKek(pin, v.salt));
        const raw = await C.open(kek, C.b64.from(v.wrapped), C.FHD);
        const key = await C.importKey(raw);
        raw.fill(0);
        return key;
      } catch (e) { return null; }
    },
    async unlock(pin) {
      const id = this.kidOnly();
      this.checkPin(pin);
      const f = this.fails[id] || (this.fails[id] = { n: 0, until: 0 });
      if (f.until > Date.now()) throw new Error(`Too many tries. Wait ${Math.ceil((f.until - Date.now()) / 1000)} seconds.`);
      const k = await this.readKeys(id);
      const v = k.volumes.find(x => x.id === k.active);
      if (!v) throw new Error('Make a PIN first.');
      const key = await this.tryVolume(v, pin);
      if (!key) {
        f.n++;
        if (f.n >= 5) { f.until = Date.now() + 60000; f.n = 0; }
        throw new Error('Wrong PIN.');
      }
      f.n = 0;
      this.open[id] = { vol: v.id, key, at: Date.now() };
      for (const o of k.volumes.filter(x => x.id !== v.id)) { const ok = await this.tryVolume(o, pin); if (ok) (this.oldKeys[id] = this.oldKeys[id] || {})[o.id] = ok; }
      return this.statusOf(id, k);
    },
    async unlockOld(volId, pin) {
      const id = this.kidOnly();
      this.checkPin(pin);
      const k = await this.readKeys(id);
      const v = k.volumes.find(x => x.id === volId && x.id !== k.active);
      if (!v) throw new Error('Not found.');
      const key = await this.tryVolume(v, pin);
      if (!key) throw new Error('That is not the old PIN.');
      (this.oldKeys[id] = this.oldKeys[id] || {})[v.id] = key;
      return this.statusOf(id, k);
    },
    lock(id) { delete this.open[id]; delete this.oldKeys[id]; return true; },
    lockAll() { this.open = {}; this.oldKeys = {}; },
    session(id) {
      const s = this.open[id];
      if (!s) throw new Error('The diary is locked.');
      if (Date.now() - s.at > 10 * 60 * 1000) { this.lock(id); throw new Error('The diary locked itself. Type your PIN again.'); }
      s.at = Date.now();
      return s;
    },
    async list() {
      const id = this.kidOnly();
      const s = this.session(id);
      const out = [];
      const readVol = async (vol, key, locked) => {
        const dir = `${this.dir(id)}/${vol}`;
        const items = (await G.list(dir)).filter(i => i.file && /\.dz$/.test(i.name));
        await mapLimit(items, 6, async it => {
          try { const e = JSON.parse(td.decode(await C.open(key, await G.bytesOf(it), C.FHD))); e.volume = vol; e.old = !!locked; out.push(e); } catch (err) { /* another volume or damaged */ }
        });
      };
      await readVol(s.vol, s.key, false);
      for (const [vol, key] of Object.entries(this.oldKeys[id] || {})) await readVol(vol, key, true);
      return out.sort((a, b) => String(b.date + b.createdAt).localeCompare(String(a.date + a.createdAt)));
    },
    async save(entry) {
      const id = this.kidOnly();
      const s = this.session(id);
      entry = entry || {};
      const now = new Date().toISOString();
      const pid = safeId(entry.id) || ('p' + Date.now().toString(36) + randHex(3));
      const rec = { id: pid, date: String(entry.date || now.slice(0, 10)).slice(0, 10), title: String(entry.title || '').slice(0, 200), text: String(entry.text || '').slice(0, 100000),
        mood: String(entry.mood || '').slice(0, 20), photo: entry.photo && String(entry.photo).length < 3e6 ? String(entry.photo) : null, createdAt: entry.createdAt || now, updatedAt: now };
      await G.upload(`${this.dir(id)}/${s.vol}/${pid}.dz`, await C.seal(s.key, te.encode(JSON.stringify(rec)), C.FHD));
      return rec;
    },
    async remove(pid) {
      const id = this.kidOnly();
      const s = this.session(id);
      await G.remove(`${this.dir(id)}/${s.vol}/${safeId(pid)}.dz`);
      return true;
    },
    async reset(childId) {
      if (session.role !== 'parent') throw new Error('Only a parent can reset a diary PIN.');
      const k = await this.readKeys(childId);
      if (!k.volumes.length) return true;
      k.active = null;
      k.resetAt = new Date().toISOString();
      k.resetBy = 'parent';
      await this.writeKeys(childId, k);
      this.lock(childId);
      return true;
    },
  };

  // ================= background: other devices' changes, locking =================
  let scanTimer = null, dataTimer = null, hiddenAt = 0;
  const onChat = () => /^#\/messages\/.+/.test(location.hash);
  async function scanLoop() {
    clearTimeout(scanTimer);
    if (dek && session.userId && !document.hidden) {
      try { for (const m of await MSG.scan()) emit('message', m); } catch (e) { /* offline */ }
    }
    scanTimer = setTimeout(scanLoop, onChat() ? 5000 : 20000);
  }
  async function dataLoop() {
    clearTimeout(dataTimer);
    await pollData();
    dataTimer = setTimeout(dataLoop, 15000);
  }
  window.addEventListener('hashchange', () => { if (onChat()) { clearTimeout(scanTimer); scanTimer = setTimeout(scanLoop, 800); } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      DIARY.lockAll();
      emit('lock'); // like minimising on the PC: the money PIN locks
    } else {
      pollData(); clearTimeout(scanTimer); scanTimer = setTimeout(scanLoop, 300);
      if (navigator.onLine) pushPending().catch(() => {});
    }
  });
  window.addEventListener('online', () => { pushPending().catch(() => {}); pollData(); });
  void hiddenAt;

  // ================= the bridge =================
  const info = () => ({ version: CFG.version || '', platform: 'phone', phone: true, dataDir: (CFG.folderName || 'family cloud'), cloud: 'family-cloud', loginItem: false, unlocked: !!dek, sabisRunning: false });
  const settings = () => (data && data.settings) || {};

  let lastSync = 0, syncError = null;
  const cloudApi = {
    async status() {
      const st = (await G.state()) || {};
      return { connected: !!st.token && !st.revoked, family: st.familyName || '', deviceId: st.deviceId || '', deviceName: st.deviceName || '', role: st.role || '', deviceStatus: st.status || '',
        revoked: !!st.revoked, lastSync, busy: inFlight > 0, progress: null, error: syncError, owner: st.owner || '', email: !!st.email, phone: true };
    },
    me: () => G.me(),
    async joinCode(opts) {
      const r = await G.call('POST', '/v1/join-codes', { json: { role: (opts && opts.role) || 'member' } });
      const link = `${location.origin}${location.pathname}#join=${encodeURIComponent(r.code)}`;
      let qr = '';
      if (window.qrcode) { const q = window.qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 6, margin: 3, scalable: true }); }
      return Object.assign(r, { link, qr });
    },
    devices: () => G.call('GET', '/v1/devices'),
    signout: id => G.call('POST', '/v1/devices/signout', { json: { id } }),
    role: (id, role) => G.call('POST', '/v1/devices/role', { json: { id, role } }),
    approveDevice: id => G.call('POST', '/v1/devices/approve', { json: { id } }),
    pending: () => G.call('GET', '/v1/approvals/pending'),
    grant: (deviceId, subject) => G.call('POST', '/v1/approvals/grant', { json: { deviceId, subject } }),
    alerts: () => G.call('GET', '/v1/alerts?limit=60'),
    alertsSeen: upTo => G.call('POST', '/v1/alerts/seen', { json: { upTo } }),
    usage: () => G.call('GET', '/v1/usage'),
    rename: name => G.call('PUT', '/v1/devices/me', { json: { name } }).then(() => G.me()),
    async syncNow() { await pollData(); return cloudApi.status(); },
    codeRequest: b => G.call('POST', '/v1/codes', { json: { purpose: b.purpose, subject: b.subject, label: b.label } }),
    codeVerify: b => G.call('POST', '/v1/codes/verify', { json: { id: b.id, code: b.code } }),
    async approved(subject) {
      const st = (await G.state()) || {};
      if (!st.token || st.status !== 'active') return { approved: true, notConnected: true };
      try { return await G.call('GET', `/v1/approvals?subject=${encodeURIComponent(subject)}`); } catch (e) { if (e.code === 'offline') return { approved: false, offline: true }; throw e; }
    },
    enablePush: () => (window.FHPhone ? window.FHPhone.enablePush() : Promise.resolve(false)),
    pushReady: () => (window.FHPhone ? window.FHPhone.pushReady() : Promise.resolve(false)),
    leave: () => (window.FHPhone ? window.FHPhone.leave() : Promise.resolve()),
    onStatus: () => {}, onAlert: () => {},
  };

  window.hub = {
    cloud: cloudApi,
    info: async () => info(),
    async boot() {
      if (!(await restoreKey())) return { state: 'locked', info: info(), where: 'family-cloud' };
      let d = null;
      try { d = await pull(); } catch (e) {
        if (e instanceof DOMException || /operation-specific|decrypt|OperationError/i.test(String(e && (e.name + e.message)))) {
          // this phone's key no longer opens the folder (new family data?): join again
          await forgetKey();
          return { state: 'locked', info: info(), where: 'family-cloud' };
        }
        d = await cachedData().catch(() => null);
        if (!d) throw e;
      }
      data = d;
      const p = await DB.get('kv', 'pending');
      if (p) { try { data = (await saveNow(M.merge(await decryptData(p), data))).data; } catch (e) { /* still offline */ } }
      dataLoop(); setTimeout(scanLoop, 1500);
      return { state: 'ready', info: info(), data };
    },
    roots: async () => [],
    setupCreate: pcOnly, useFound: pcOnly,
    async unlock(username, password) {
      if (!(await unlockWithPassword(username, password))) throw new Error('That username and password do not open this family data.');
      data = await pull();
      dataLoop(); setTimeout(scanLoop, 1500);
      return data;
    },
    async recover(code) {
      if (!(await unlockWithRecovery(code))) throw new Error('That recovery key does not match.');
      data = await pull();
      dataLoop(); setTimeout(scanLoop, 1500);
      return data;
    },
    migrate: pcOnly, migrateReset: pcOnly,
    plainCount: async () => 0, encryptOld: pcOnly, onEncryptProgress: () => {},
    vaultSetPassword: () => Promise.reject(new Error('Change parent passwords on the family PC.')),
    vaultRemoveParent: () => Promise.reject(new Error('Remove parent logins on the family PC.')),
    newRecovery: pcOnly,
    forgetPC: async () => { await forgetKey(); return true; },
    vaultStatus: async () => ({ unlocked: !!dek, remembered: !!dek, protectedByWindows: false }),
    load: async () => { if (!data) data = await pull().catch(() => cachedData()); return data; },
    save: d => save(d),
    onExternal: cb => { L.external.push(cb); },
    onLock: cb => { L.lock.push(cb); },
    hash: pw => C.hashPassword(pw),
    verify: (password, salt, hash) => C.verifyPassword(password, salt, hash),
    async session(s) {
      s = s || {};
      if (session.childId && (session.role !== s.role || session.childId !== s.childId)) DIARY.lockAll();
      const changed = session.userId !== (s.role ? s.userId || null : null);
      session = { role: s.role || null, childId: s.role === 'child' ? s.childId : null, userId: s.role ? (s.userId || null) : null };
      if (changed) {
        MSG.known = null;
        if (session.userId) setTimeout(scanLoop, 500);
        G.call('PUT', '/v1/devices/me', { json: { users: session.userId ? [session.userId] : [], app: CFG.version || '' } }).catch(() => {});
        if (session.userId && window.FHPhone) window.FHPhone.pushReady().then(on => { if (on) window.FHPhone.enablePush().catch(() => {}); }).catch(() => {});
      }
      return true;
    },
    resetOptions: async () => ({ email: false, parents: ((data && data.users) || []).filter(x => x.role === 'parent').map(p => ({ id: p.id, name: p.displayName || p.username, masked: '' })) }),
    resetSend: pcOnly, resetVerify: pcOnly, mailTest: pcOnly,
    msgList: (chat, months) => MSG.list(chat, months || 3),
    msgSend: (chat, payload) => MSG.send(chat, payload),
    msgDelete: (chat, id, month) => MSG.remove(chat, id, month),
    async msgAttach(src) { const f = await pickedFile(src); return MSG.attachBytes(f.bytes, f.name); },
    msgAttachData: (base64, name) => MSG.attachBytes(C.b64.from(base64), String(name || 'file').split(/[\\/]/).pop()),
    msgRead: (chat, at) => MSG.setRead(chat, at),
    msgMarkers: () => MSG.readMarkers(),
    msgOverview: chats => MSG.overview(chats || []),
    onMessage: cb => { L.message.push(cb); },
    // the notification centre's history: the service worker keeps every notification it showed
    async notifyLog() {
      try { const c = await caches.open('fh-notes'); const r = await c.match('log'); const l = r ? await r.json() : []; return (Array.isArray(l) ? l : []).reverse(); } catch (e) { return []; }
    },
    async notifyClear(ids) {
      try {
        const c = await caches.open('fh-notes'); const r = await c.match('log'); const l = r ? await r.json() : [];
        const drop = Array.isArray(ids) ? new Set(ids) : null;
        await c.put('log', new Response(JSON.stringify(drop ? l.filter(x => !drop.has(x.id)) : []), { headers: { 'Content-Type': 'application/json' } }));
      } catch (e) { /* nothing kept */ }
      return true;
    },
    notifyPending: async () => null,
    onNotifyLogged: cb => { if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', e => { const m = e.data || {}; if (m.type === 'fh-note') cb(m); }); },
    // this phone's own choices: the chat tone (played while the app is open) and the notification picture
    async soundGet() {
      let cur = {};
      try { cur = JSON.parse(localStorage.getItem('kh.sound') || '{}') || {}; } catch (e) { cur = {}; }
      return Object.assign({ sound: 'phone', chat: 'same', icon: 'logo', volume: 0.8, quiet: false, from: '22:00', to: '06:30' }, cur, { phone: true });
    },
    async soundSet(b) {
      const cur = await this.soundGet();
      const next = { chat: b.chat || cur.chat, icon: b.icon || cur.icon, volume: Math.max(0, Math.min(1, Number(b.volume != null ? b.volume : cur.volume))) };
      try { localStorage.setItem('kh.sound', JSON.stringify(next)); } catch (e) { /* not kept */ }
      try { const c = await caches.open('fh-notes'); await c.put('prefs', new Response(JSON.stringify({ icon: next.icon }), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { /* the service worker keeps the logo */ }
      return Object.assign({}, cur, next);
    },
    onNav: cb => { L.nav.push(cb); },
    diaryStatus: childId => DIARY.status(childId),
    diarySetup: pin => DIARY.setup(pin),
    diaryUnlock: pin => DIARY.unlock(pin),
    diaryUnlockOld: (vol, pin) => DIARY.unlockOld(vol, pin),
    diaryLock: async () => DIARY.lock(DIARY.kidOnly()),
    diaryList: () => DIARY.list(),
    diarySave: entry => DIARY.save(entry),
    diaryDelete: id => DIARY.remove(id),
    diaryReset: childId => DIARY.reset(childId),
    async seal(text) { return C.b64.to(await C.seal(dek, te.encode(String(text || '')))); },
    async unseal(sealed) { return sealed ? td.decode(await C.open(dek, C.b64.from(sealed))) : ''; },
    async copy(text) {
      try { await navigator.clipboard.writeText(String(text || '')); } catch (e) { /* not allowed */ }
      setTimeout(() => { navigator.clipboard.writeText('').catch(() => {}); }, 30000);
      return true;
    },
    // opens the site; signing in there is done by hand on a phone
    async launchLogin(id) {
      const c = ((data && data.credentials) || []).find(x => x.id === id);
      const url = (c && c.url) || (c && /^sabis/.test(c.kind) ? 'https://digitalplatform.sabis.net' : '');
      if (!url) throw new Error('This login has no web address.');
      window.open(url, '_blank', 'noopener');
      return true;
    },
    sabisRun: () => Promise.reject(new Error('SABIS updates run on the family PC.')),
    sabisStatus: async () => ({ running: false, last: (settings().sabis || {}).last || null }),
    onSabis: () => {},
    pick: opts => pick(opts),
    async store(src, kind) {
      const f = await pickedFile(src);
      const folder = FOLDERS.includes(kind) ? kind : 'documents';
      return Object.assign(await storeBuffer(f.bytes, folder, f.name), { name: f.name });
    },
    pickBookFolder: async () => { const paths = await pick({ multi: true, filters: [{ name: 'Books', extensions: ['pdf', 'epub'] }] }); return paths.length ? { root: '', files: paths.map(p => ({ path: p, folder: '' })) } : null; },
    storeData: (base64, kind, name) => storeBuffer(C.b64.from(base64), kind, String(name || 'file').split(/[\\/]/).pop()),
    pathForFile: file => register(file),
    url: async rel => fileUrl(rel),
    fileUrl,
    open: rel => openFile(rel),
    saveAs: async rel => { await openFile(rel); return null; },
    showFolder: pcOnly,
    ocr: pcOnly, learn: pcOnly, ocrReset: pcOnly, ocrCount: async () => 0,
    portalOpen: pcOnly, portalTables: pcOnly, portalCapture: pcOnly,
    pdf: async html => { await printHtml(html); return null; },
    print: html => printHtml(html),
    notifyCheck: async () => 0, notifyTest: pcOnly, loginItem: pcOnly, moveTo: pcOnly,
    backupNow: pcOnly, backups: async () => [], restore: pcOnly, exportJson: pcOnly, importJson: pcOnly,
  };
  // for the phone's own screens (Settings → This phone)
  window.FHPhoneHub = { syncNow: async () => { await pushPending().catch(() => {}); await pollData(); }, lastETag: () => dataETag, pending: async () => !!(await DB.get('kv', 'pending')), forgetKey };
})();
