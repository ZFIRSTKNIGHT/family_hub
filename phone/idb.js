// A small IndexedDB store for the phone: "kv" holds settings and the family key (as a
// non-extractable CryptoKey), "files" holds encrypted files exactly as they were downloaded,
// so the app starts quickly and works offline. Nothing in "files" is ever stored decrypted.
(function () {
  'use strict';
  const NAME = 'family-hub-phone', VERSION = 1;
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('files')) d.createObjectStore('files');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('The phone storage is busy. Close other copies of the app.'));
    });
    return dbp;
  }
  const tx = async (store, mode, fn) => {
    const d = await db();
    return new Promise((resolve, reject) => {
      const t = d.transaction(store, mode);
      fn(t.objectStore(store));
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Storage aborted'));
    });
  };
  const req2p = r => new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });

  const FHdb = {
    get: (store, key) => db().then(d => req2p(d.transaction(store).objectStore(store).get(key))),
    set: (store, key, value) => tx(store, 'readwrite', s => { s.put(value, key); }),
    del: (store, key) => tx(store, 'readwrite', s => { s.delete(key); }),
    keys: store => db().then(d => req2p(d.transaction(store).objectStore(store).getAllKeys())),
    clear: store => tx(store, 'readwrite', s => { s.clear(); }),
    // files cache: keep it under a size; least recently used go first
    async putFile(rel, rec) {
      rec = Object.assign({ at: Date.now(), size: rec.bytes ? rec.bytes.length : 0 }, rec);
      await FHdb.set('files', rel, rec);
      FHdb.trim();
    },
    async trim(limit) {
      const max = limit || 300 * 1024 * 1024;
      if (FHdb._trimming) return;
      FHdb._trimming = true;
      try {
        const d = await db();
        const all = await new Promise((resolve, reject) => {
          const out = [];
          const c = d.transaction('files').objectStore('files').openCursor();
          c.onsuccess = () => { const cur = c.result; if (!cur) return resolve(out); out.push({ key: cur.key, size: cur.value.size || 0, at: cur.value.at || 0, keep: !!cur.value.keep }); cur.continue(); };
          c.onerror = () => reject(c.error);
        });
        let total = all.reduce((a, b) => a + b.size, 0);
        if (total <= max) return;
        for (const f of all.filter(x => !x.keep).sort((a, b) => a.at - b.at)) {
          if (total <= max * 0.8) break;
          await FHdb.del('files', f.key);
          total -= f.size;
        }
      } catch (e) { /* trimming is best effort */ } finally { FHdb._trimming = false; }
    },
  };
  window.FHdb = FHdb;
})();
