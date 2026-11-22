// Microsoft sign-in for the phone: the standard "authorization code with PKCE" flow for
// single-page apps (no secret in the app). The sign-in is kept on this phone, encrypted with a
// key the phone cannot export, so the app opens straight away. Microsoft lets such a sign-in
// last a day; after that the app goes to Microsoft and straight back (no typing while the
// phone is still signed in to Microsoft there).
(function () {
  'use strict';
  const C = window.FHCrypto, DB = window.FHdb;
  const CFG = window.FH_CONFIG = window.FH_CONFIG || {};
  // tests on this machine sign in against the local stand-in for Microsoft
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && localStorage.getItem('fh.graphTest') === '1') {
    CFG.authority = new URL('oauth/v2.0', location.href).href;
    CFG.clientId = CFG.clientId || 'test-client';
  }
  const SCOPES = 'openid profile offline_access User.Read Files.ReadWrite.All';
  const authority = () => (CFG.authority || 'https://login.microsoftonline.com/common/oauth2/v2.0').replace(/\/$/, '');
  const redirectUri = () => new URL('auth.html', location.href).href;
  const b64url = u8 => C.b64.to(u8).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const random = n => crypto.getRandomValues(new Uint8Array(n));
  let mem = null; // { access, expires, refresh, account }

  async function storeKey() {
    let k = await DB.get('kv', 'authKey');
    if (!k) { k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await DB.set('kv', 'authKey', k); }
    return k;
  }
  async function keep(s) {
    mem = s;
    await DB.set('kv', 'auth', await C.seal(await storeKey(), C.te.encode(JSON.stringify(s))));
  }
  async function restore() {
    if (mem) return mem;
    try {
      const sealed = await DB.get('kv', 'auth');
      if (sealed) mem = JSON.parse(C.td.decode(await C.open(await storeKey(), sealed)));
    } catch (e) { mem = null; }
    return mem;
  }
  function accountFrom(idToken) {
    try {
      const part = String(idToken).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const p = JSON.parse(decodeURIComponent(escape(atob(part + '==='.slice((part.length + 3) % 4)))));
      return { name: p.name || '', username: p.preferred_username || p.email || p.upn || '', id: p.oid || p.sub || '' };
    } catch (e) { return null; }
  }
  async function tokenRequest(params) {
    const body = new URLSearchParams(Object.assign({ client_id: CFG.clientId, scope: SCOPES }, params));
    let res;
    try { res = await fetch(`${authority()}/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }); } catch (e) { throw Object.assign(new Error('No connection. The phone will try again when it is online.'), { code: 'offline' }); }
    let j = {};
    try { j = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok || !j.access_token) throw Object.assign(new Error(j.error_description || j.error || `Microsoft answered ${res.status}`), { code: j.error || 'token' });
    return j;
  }
  async function keepTokens(j, account) {
    const prev = await restore();
    await keep({ access: j.access_token, expires: Date.now() + Math.max(60, (Number(j.expires_in) || 3600) - 120) * 1000,
      refresh: j.refresh_token || (prev && prev.refresh) || '', account: accountFrom(j.id_token) || account || (prev && prev.account) || null });
    try { localStorage.setItem('fh.lastAccount', JSON.stringify(mem.account || {})); } catch (e) { /* ignore */ }
  }

  // ---- going to Microsoft ----
  async function begin(opts) {
    opts = opts || {};
    const verifier = b64url(random(48));
    const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', C.te.encode(verifier))));
    const state = b64url(random(18));
    sessionStorage.setItem('fh.pkce', JSON.stringify({ verifier, state, back: opts.back || new URL('./', location.href).href, silent: opts.prompt === 'none' }));
    const q = new URLSearchParams({ client_id: CFG.clientId, response_type: 'code', redirect_uri: redirectUri(), response_mode: 'query', scope: SCOPES, state,
      code_challenge: challenge, code_challenge_method: 'S256' });
    if (opts.prompt) q.set('prompt', opts.prompt);
    if (opts.loginHint) q.set('login_hint', opts.loginHint);
    location.assign(`${authority()}/authorize?${q}`);
    return new Promise(() => {}); // the page is leaving
  }
  // ---- back from Microsoft (auth.html) ----
  async function finish() {
    const p = new URLSearchParams(location.search);
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem('fh.pkce') || 'null'); } catch (e) { saved = null; }
    sessionStorage.removeItem('fh.pkce');
    const back = (saved && saved.back) || new URL('./', location.href).href;
    const fail = (error, text) => { sessionStorage.setItem('fh.authError', JSON.stringify({ error, text: text || '', silent: !!(saved && saved.silent), at: Date.now() })); location.replace(back); };
    if (p.get('error')) return fail(p.get('error'), p.get('error_description'));
    if (!saved || !p.get('code') || p.get('state') !== saved.state) return fail('state', 'The sign-in did not match. Try again.');
    try {
      await keepTokens(await tokenRequest({ grant_type: 'authorization_code', code: p.get('code'), redirect_uri: redirectUri(), code_verifier: saved.verifier }));
      localStorage.removeItem('fh.authRetry');
      location.replace(back);
    } catch (e) { fail(e.code || 'token', e.message); }
  }

  // ---- a token for OneDrive ----
  async function token(force) {
    const s = await restore();
    if (!s || !s.refresh) throw Object.assign(new Error('Sign in to Microsoft again (Settings → This phone).'), { code: 'signin' });
    if (!force && s.access && Date.now() < s.expires) return s.access;
    try {
      await keepTokens(await tokenRequest({ grant_type: 'refresh_token', refresh_token: s.refresh }), s.account);
      return mem.access;
    } catch (e) {
      if (e.code === 'offline') throw e;
      // the day's sign-in is over: back through Microsoft, usually without any typing
      const last = Number(localStorage.getItem('fh.authRetry') || 0);
      if (Date.now() - last > 2 * 60 * 1000) {
        localStorage.setItem('fh.authRetry', String(Date.now()));
        return begin({ prompt: 'none', loginHint: (s.account || {}).username, back: location.href });
      }
      throw Object.assign(new Error('Sign in to Microsoft again (Settings → This phone).'), { code: 'signin' });
    }
  }

  window.FHAuth = {
    begin, finish, token,
    async account() { const s = await restore(); return (s && s.account) || null; },
    async signedIn() { const s = await restore(); return !!(s && s.refresh); },
    lastAccount() { try { return JSON.parse(localStorage.getItem('fh.lastAccount') || 'null'); } catch (e) { return null; } },
    takeError() { try { const e = JSON.parse(sessionStorage.getItem('fh.authError') || 'null'); sessionStorage.removeItem('fh.authError'); return e; } catch (e) { return null; } },
    async signOut() { mem = null; await DB.del('kv', 'auth'); localStorage.removeItem('fh.lastAccount'); },
  };
})();
