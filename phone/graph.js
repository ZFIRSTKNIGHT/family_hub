// OneDrive for the phone, through Microsoft Graph. Every path is inside the family folder
// (the same folder the PCs keep in their OneDrive), addressed as
//   /drives/{driveId}/items/{folderId}:/{path}
// Downloads use the short-lived pre-signed link Graph gives for each file. Writes can carry
// If-Match, so a save never overwrites a version it has not seen (the caller merges and retries).
(function () {
  'use strict';
  let base = 'https://graph.microsoft.com/v1.0';
  let getToken = async () => { throw new Error('Not signed in to Microsoft'); };
  let where = null; // { driveId, folderId }
  const SIMPLE_MAX = 60 * 1024 * 1024;
  const CHUNK = 10 * 320 * 1024;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  class GraphError extends Error {
    constructor(message, status, code) { super(message); this.status = status || 0; this.code = code || ''; }
  }
  const offline = e => Object.assign(new GraphError('No connection. The phone will try again when it is online.', 0, 'offline'), { cause: e });

  const encPath = rel => String(rel).split('/').filter(Boolean).map(encodeURIComponent).join('/');
  const folderPath = () => {
    if (!where) throw new GraphError('The family folder is not chosen yet.', 0, 'nofolder');
    return `/drives/${encodeURIComponent(where.driveId)}/items/${encodeURIComponent(where.folderId)}`;
  };
  const itemPath = rel => (rel ? `${folderPath()}:/${encPath(rel)}:` : folderPath());

  async function errorFrom(res) {
    let msg = `OneDrive answered ${res.status}`, code = '';
    try { const j = await res.json(); if (j && j.error) { msg = j.error.message || msg; code = j.error.code || ''; } } catch (e) { /* not JSON */ }
    if (res.status === 412) code = 'conflict';
    if (res.status === 404) code = code || 'itemNotFound';
    if (res.status === 401 || res.status === 403) msg = res.status === 403 ? 'This Microsoft account cannot open the family folder.' : 'The Microsoft sign-in has expired.';
    return new GraphError(msg, res.status, code);
  }

  // One request with the sign-in token; waits and tries again when OneDrive is busy.
  async function raw(method, url, opts) {
    opts = opts || {};
    let tries = 0, forced = false;
    for (;;) {
      const token = await getToken(forced);
      let res;
      try {
        res = await fetch(/^https?:/.test(url) ? url : base + url, {
          method, body: opts.body, cache: 'no-store',
          headers: Object.assign({ Authorization: `Bearer ${token}` }, opts.headers || {}),
        });
      } catch (e) { throw offline(e); }
      if (res.status === 401 && !forced) { forced = true; continue; }
      if ((res.status === 429 || res.status === 503 || res.status === 504 || res.status === 500) && tries < 4) {
        const after = Number(res.headers.get('Retry-After'));
        await sleep(after > 0 ? Math.min(after, 30) * 1000 : 800 * Math.pow(2, tries));
        tries++;
        continue;
      }
      return res;
    }
  }
  async function json(method, url, opts) {
    const res = await raw(method, url, opts);
    if (!res.ok) throw await errorFrom(res);
    return res.status === 204 ? null : res.json();
  }

  // ---- files in the family folder ----
  async function meta(rel) {
    const res = await raw('GET', rel ? `${folderPath()}:/${encPath(rel)}` : folderPath());
    if (res.status === 404) return null;
    if (!res.ok) throw await errorFrom(res);
    return res.json();
  }
  // the bytes of an item we already have the metadata for (one request, no token needed)
  async function bytesOf(item) {
    const link = item && item['@microsoft.graph.downloadUrl'];
    let res;
    try { res = link ? await fetch(link, { cache: 'no-store' }) : null; } catch (e) { throw offline(e); }
    if (!res || !res.ok) {
      // the link can expire; ask Graph for the content directly
      res = await raw('GET', `/drives/${encodeURIComponent(item.parentReference.driveId)}/items/${encodeURIComponent(item.id)}/content`);
      if (!res.ok) throw await errorFrom(res);
    }
    return new Uint8Array(await res.arrayBuffer());
  }
  // null when the file is not there; { notModified } when the eTag matches what we have
  async function download(rel, knownETag) {
    const m = await meta(rel);
    if (!m) return null;
    if (knownETag && m.eTag === knownETag) return { notModified: true, meta: m };
    return { bytes: await bytesOf(m), meta: m };
  }
  async function upload(rel, bytes, opts) {
    opts = opts || {};
    const headers = { 'Content-Type': 'application/octet-stream' };
    if (opts.ifMatch) headers['If-Match'] = opts.ifMatch;
    if (bytes.length <= SIMPLE_MAX) {
      const res = await raw('PUT', `${itemPath(rel)}/content`, { body: bytes, headers });
      if (res.ok) return res.json();
      if (res.status !== 413) throw await errorFrom(res);
    }
    // large files: an upload session, sent in pieces
    const sh = { 'Content-Type': 'application/json' };
    if (opts.ifMatch) sh['If-Match'] = opts.ifMatch;
    const s = await json('POST', `${itemPath(rel)}/createUploadSession`, { headers: sh, body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'replace' } }) });
    for (let start = 0; start < bytes.length; start += CHUNK) {
      const end = Math.min(bytes.length, start + CHUNK);
      let res;
      try { res = await fetch(s.uploadUrl, { method: 'PUT', headers: { 'Content-Range': `bytes ${start}-${end - 1}/${bytes.length}` }, body: bytes.subarray(start, end) }); } catch (e) { throw offline(e); }
      if (res.status === 200 || res.status === 201) return res.json();
      if (res.status !== 202) throw await errorFrom(res);
    }
    throw new GraphError('The upload did not finish.', 0, 'upload');
  }
  // the files in a folder (empty when the folder is not there yet)
  async function list(relFolder) {
    const out = [];
    let url = `${itemPath(relFolder)}/children?$top=500`;
    while (url) {
      const res = await raw('GET', url);
      if (res.status === 404) return out;
      if (!res.ok) throw await errorFrom(res);
      const j = await res.json();
      out.push(...(j.value || []));
      url = j['@odata.nextLink'] || null;
    }
    return out;
  }
  async function remove(rel) {
    const res = await raw('DELETE', `${folderPath()}:/${encPath(rel)}`);
    if (!res.ok && res.status !== 404) throw await errorFrom(res);
    return true;
  }

  window.FHGraph = {
    GraphError,
    configure(o) { if (o.baseUrl) base = o.baseUrl.replace(/\/$/, ''); if (o.getToken) getToken = o.getToken; },
    useFolder(f) { where = f ? { driveId: f.driveId, folderId: f.folderId } : null; },
    folder: () => where,
    raw, json, meta, bytesOf, download, upload, list, remove, encPath,
  };
})();
