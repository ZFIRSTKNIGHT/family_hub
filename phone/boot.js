// Phone start-up: checks this browser can run the app, starts the service worker, signs in to
// Microsoft, finds the family folder in OneDrive, then loads the app itself (the PC's screens).
(function () {
  'use strict';
  const KH = window.KH = window.KH || {};
  KH.phoneApp = true;
  const CFG = window.FH_CONFIG || {};
  const u = KH.u, h = u.h, I = () => KH.i18n;
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const TEST = LOCAL && localStorage.getItem('fh.graphTest') === '1';
  const here = p => new URL(p, location.href).href;
  const FOLDER_KEY = 'fh.folder';

  // ---------------- Microsoft sign-in (msauth.js) ----------------
  const Auth = window.FHAuth;
  let account = null;
  const SIGNIN_HINT = () => (account || Auth.lastAccount() || {}).username || undefined;

  // ---------------- the family folder in OneDrive ----------------
  const readFolder = () => { try { return JSON.parse(localStorage.getItem(FOLDER_KEY) || 'null'); } catch (e) { return null; } };
  const keepFolder = f => localStorage.setItem(FOLDER_KEY, JSON.stringify(f));
  const G = () => window.FHGraph;
  async function describe(driveId, folderId) {
    const m = await G().json('GET', `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}`);
    const owner = ((m.shared && m.shared.owner && m.shared.owner.user) || (m.createdBy && m.createdBy.user) || {}).displayName || '';
    return { driveId, folderId, name: m.name, owner, modified: m.lastModifiedDateTime || '' };
  }
  async function hasKeys(driveId, folderId) {
    const kids = await G().json('GET', `/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(folderId)}/children?$top=200`);
    return (kids.value || []).some(k => k.name === 'family-hub-keys.json');
  }
  // the family data in this account's OneDrive, and folders others shared with it
  async function findFolders() {
    const out = [];
    const add = async (driveId, folderId) => {
      if (!driveId || !folderId || out.some(f => f.driveId === driveId && f.folderId === folderId)) return;
      try { out.push(await describe(driveId, folderId)); } catch (e) { /* not reachable */ }
    };
    try {
      const s = await G().json('GET', "/me/drive/root/search(q='family-hub-keys.json')?$top=50");
      for (const it of (s.value || [])) if (it.name === 'family-hub-keys.json' && it.parentReference) await add(it.parentReference.driveId, it.parentReference.id);
    } catch (e) { if (e.code === 'offline') throw e; }
    try {
      const sh = await G().json('GET', '/me/drive/sharedWithMe');
      for (const it of (sh.value || [])) {
        const r = it.remoteItem || it;
        if (!r.folder || !r.parentReference) continue;
        try { if (await hasKeys(r.parentReference.driveId, r.id)) await add(r.parentReference.driveId, r.id); } catch (e) { /* skip */ }
      }
    } catch (e) { /* not offered for this account */ }
    return out;
  }
  async function folderFromLink(link) {
    const b64 = btoa(unescape(encodeURIComponent(String(link).trim()))).replace(/=+$/, '').replace(/\//g, '_').replace(/\+/g, '-');
    const it = await G().json('GET', `/shares/u!${b64}/driveItem`);
    if (!it.folder) throw new Error('That link is not to a folder.');
    const driveId = (it.parentReference || {}).driveId;
    if (!(await hasKeys(driveId, it.id))) throw new Error('That folder has no Family Hub data in it.');
    return describe(driveId, it.id);
  }

  // ---------------- start-up screens (the PC's sign-in look) ----------------
  function screen(card) {
    const root = document.getElementById('app');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'login-wrap' }, card));
    I().apply(root);
  }
  let redraw = null;
  function langPick() {
    const lang = I().lang;
    const set = l => { I().setLang(l); try { localStorage.setItem('kh.lang', l); } catch (e) { /* ignore */ } if (redraw) redraw(); };
    return h('div', { class: 'lang-switch', style: { float: 'inline-end' } },
      h('button', { class: lang === 'en' ? 'on' : '', 'data-noi18n': '1', onclick: () => set('en') }, 'EN'),
      h('button', { class: lang === 'ar' ? 'on' : '', 'data-noi18n': '1', onclick: () => set('ar') }, 'ع'));
  }
  const logo = () => h('img', { class: 'logo', src: 'assets/logo.png', alt: '' });
  const wide = { width: '100%', justifyContent: 'center' };
  const standalone = () => window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  let installEvent = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e; if (redraw) redraw(); });
  function installTip() {
    if (standalone()) return null;
    if (installEvent) return h('button', { class: 'btn', style: Object.assign({ marginTop: '10px' }, wide), onclick: async () => { installEvent.prompt(); installEvent = null; } }, u.icon('plus'), 'Install the app on this phone');
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return h('p', { class: 'small muted', style: { textAlign: 'center', marginBottom: 0 } }, 'Tip: tap Share, then "Add to Home Screen", to keep the app on this iPhone.');
    return null;
  }

  function connectScreen(message) {
    redraw = () => connectScreen(message);
    screen(h('div', { class: 'login' }, langPick(), logo(),
      h('h1', null, 'M. Ebrahim Family Hub'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Sign in with the Microsoft account that keeps the family data in its OneDrive. Everything stays encrypted: this phone can read it only after a parent unlocks it once.'),
      message ? h('div', { class: 'errbox', style: { marginBottom: '12px' } }, message) : null,
      h('button', { class: 'btn primary', style: wide, onclick: () => Auth.begin({ prompt: 'select_account', loginHint: SIGNIN_HINT() }) }, u.icon('key'), 'Sign in with Microsoft'),
      installTip()));
  }
  function waiting(title, text) {
    redraw = () => waiting(title, text);
    screen(h('div', { class: 'login' }, langPick(), logo(), h('h1', null, title), h('p', { class: 'muted', style: { marginTop: 0 } }, text), h('div', { class: 'spinner' })));
  }
  function chooseFolder() {
    return new Promise(resolve => {
      const done = f => { keepFolder(f); resolve(f); };
      async function look() {
        waiting('Finding your family data', 'Looking in OneDrive…');
        let found = [], err = '';
        try { found = await findFolders(); } catch (e) { err = e.message; }
        if (found.length === 1) return done(found[0]);
        show(found, err);
      }
      function show(found, err) {
        redraw = () => show(found, err);
        let pick = found[0] || null;
        const link = h('input', { type: 'url', placeholder: 'https://1drv.ms/f/…', autocomplete: 'off' });
        const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px', margin: '6px 0' } }, err || '');
        const list = h('div');
        const drawList = () => {
          list.innerHTML = '';
          for (const f of found) {
            list.appendChild(h('div', { class: `choice ${f === pick ? 'on' : ''}`, onclick: () => { pick = f; drawList(); } }, u.icon('school'),
              h('div', null, h('b', { 'data-noi18n': '1' }, f.name), h('div', { class: 'small muted' }, f.owner ? `OneDrive of ${f.owner}` : 'OneDrive'),
                f.modified ? h('div', { class: 'small muted' }, `Changed ${new Date(f.modified).toLocaleString(u.locale())}`) : null)));
          }
          I().apply(list);
        };
        drawList();
        const who = account || {};
        screen(h('div', { class: 'login' }, langPick(), logo(),
          h('h1', null, found.length ? 'Which family data?' : 'No family data found'),
          found.length ? list : h('div', null,
            h('p', { class: 'muted', style: { marginTop: 0 } }, `The OneDrive of ${who.name || who.username || 'this account'} has no M. Ebrahim Family Hub folder.`),
            h('p', { class: 'small muted' }, 'If the data is in another person\'s OneDrive, they share the "M. Ebrahim Family Hub" folder with this Microsoft account (Share, Can edit). Then paste the folder\'s link here, or open the invitation and choose "Add shortcut to My files".')),
          found.length ? h('button', { class: 'btn primary', style: Object.assign({ marginTop: '6px' }, wide), onclick: () => pick && done(pick) }, 'Use this folder') : null,
          h('label', { class: 'f', style: { marginTop: '14px' } }, h('span', null, 'Link to the folder (optional)'), link), msg,
          h('button', { class: 'btn', style: wide, onclick: async () => {
            if (!link.value.trim()) { look(); return; }
            msg.textContent = '';
            try { done(await folderFromLink(link.value)); } catch (e) { msg.textContent = I().t(e.message); }
          } }, 'Look again'),
          h('p', { class: 'small', style: { textAlign: 'center', marginBottom: 0 } }, h('a', { onclick: async () => { await Auth.signOut(); Auth.begin({ prompt: 'select_account' }); } }, 'Use another Microsoft account'))));
      }
      look();
    });
  }
  function unsupported() {
    redraw = unsupported;
    screen(h('div', { class: 'login' }, langPick(), logo(), h('h1', null, 'Open this page in Safari or Chrome'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'This browser cannot keep the app on the phone (it may be the browser inside another app). Open the link in Safari on an iPhone or in Chrome on Android, then add it to the Home Screen.')));
  }
  function notConfigured() {
    redraw = notConfigured;
    screen(h('div', { class: 'login' }, langPick(), logo(), h('h1', null, 'Almost ready'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'This copy of the app does not have its Microsoft app ID yet, so it cannot reach OneDrive.')));
  }

  // ---------------- the app ----------------
  function loadScripts(list) {
    return new Promise((resolve, reject) => {
      if (!list.length) return resolve();
      let n = 0;
      for (const src of list) {
        const s = document.createElement('script');
        s.src = src;
        s.async = false; // in order, like the PC's page
        s.onload = () => { if (++n === list.length) resolve(); };
        s.onerror = () => reject(new Error(`Could not load ${src}`));
        document.body.appendChild(s);
      }
    });
  }
  async function serviceWorker() {
    const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => { navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }); setTimeout(resolve, 8000); });
    }
    if (!navigator.serviceWorker.controller && !sessionStorage.getItem('fh.swReload')) { sessionStorage.setItem('fh.swReload', '1'); location.reload(); return new Promise(() => {}); }
    reg.update().catch(() => {});
    return reg;
  }

  window.FHPhone = {
    account: () => account,
    folder: readFolder,
    signIn: () => Auth.begin({ prompt: 'select_account', loginHint: SIGNIN_HINT(), back: location.href }),
    async signOut() { await Auth.signOut(); localStorage.removeItem(FOLDER_KEY); location.reload(); },
    changeFolder: () => { localStorage.removeItem(FOLDER_KEY); location.reload(); },
  };

  async function start() {
    I().setLang(localStorage.getItem('kh.lang') === 'ar' ? 'ar' : 'en');
    if (!('serviceWorker' in navigator) || !window.crypto || !crypto.subtle || !window.indexedDB) return unsupported();
    try { await serviceWorker(); } catch (e) { return unsupported(); }
    if (!CFG.clientId) return notConfigured();
    G().configure(Object.assign(TEST ? { baseUrl: here('graph/v1.0') } : {}, { getToken: force => Auth.token(force) }));
    const err = Auth.takeError();
    if (!(await Auth.signedIn())) {
      // signed in on this phone before: straight back in, without typing while Microsoft still knows the phone
      const last = Auth.lastAccount();
      if (last && last.username && !err && Date.now() - Number(localStorage.getItem('fh.authRetry') || 0) > 2 * 60 * 1000) {
        localStorage.setItem('fh.authRetry', String(Date.now()));
        return Auth.begin({ prompt: 'none', loginHint: last.username });
      }
      return connectScreen(err && !err.silent && err.error !== 'access_denied' ? I().t(err.text || 'The Microsoft sign-in did not finish. Try again.') : '');
    }
    account = await Auth.account();
    let folder = readFolder();
    if (!folder) folder = await chooseFolder();
    G().useFolder(folder);
    CFG.folderName = folder.name;
    redraw = null;
    await loadScripts(CFG.appScripts || []);
  }
  start().catch(e => connectScreen(String((e && e.message) || e)));
})();
