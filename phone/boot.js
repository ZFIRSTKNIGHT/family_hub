// Phone start-up: checks this browser can run the app, starts the service worker, connects this
// phone to the family cloud (a code or QR from a family device, once), then loads the app itself
// (the PC's screens). The family data stays encrypted: a parent unlocks it once on this phone.
(function () {
  'use strict';
  const KH = window.KH = window.KH || {};
  KH.phoneApp = true;
  const CFG = window.FH_CONFIG || {};
  const u = KH.u, h = u.h, I = () => KH.i18n;
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const TEST_CLOUD = LOCAL ? localStorage.getItem('fh.cloudTest') : '';
  const Cloud = () => window.FHCloud;
  let swReg = null;

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
  // iPadOS reports itself as a Mac, so a touch screen counts too
  const apple = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  function installTip() {
    if (standalone() || !installEvent) return null;
    return h('button', { class: 'btn', style: Object.assign({ marginTop: '10px' }, wide), onclick: async () => { installEvent.prompt(); installEvent = null; } }, u.icon('plus'), 'Install the app on this phone');
  }
  // On an iPhone the Home Screen app keeps its own data, apart from Safari: a phone that joins in
  // Safari and is added to the Home Screen afterwards would need a second code. So: Home Screen first.
  function appleFirst() {
    if (standalone() || !apple()) return null;
    return h('div', { class: 'note small', style: { margin: '0 0 12px' } }, 'On an iPhone, first add the app to the Home Screen: tap Share, then "Add to Home Screen". Then open Family Hub from the Home Screen and join there. The Home Screen app keeps its own data, apart from Safari, and iPhone notifications need it.');
  }
  const errLine = () => h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px', margin: '4px 0 8px' } });

  function joinScreen(code, message) {
    redraw = () => joinScreen(codeIn.value, message);
    const codeIn = h('input', { type: 'text', value: code || '', placeholder: 'ABCD-EFGH', maxlength: '9', autocapitalize: 'characters', style: { fontSize: '22px', letterSpacing: '.15em', textAlign: 'center', textTransform: 'uppercase' } });
    const nameIn = h('input', { type: 'text', placeholder: 'For example: My phone' });
    const msg = errLine();
    if (message) msg.textContent = I().t(message);
    async function go() {
      msg.textContent = '';
      const c = codeIn.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (c.length !== 8) { msg.textContent = I().t('The code has 8 letters and numbers, like ABCD-EFGH.'); return; }
      if (!nameIn.value.trim()) { msg.textContent = I().t('Give this phone a name, so it can be recognised in the list of devices.'); return; }
      try {
        const st = await Cloud().join(c, nameIn.value.trim());
        history.replaceState(null, '', location.pathname + location.search);
        if (st.status === 'pending') return approvalScreen();
        return start();
      } catch (e) { msg.textContent = I().t(e.message); }
    }
    screen(h('div', { class: 'login' }, langPick(), logo(),
      h('h1', null, 'Join your family'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'On a family device, the organiser opens Family cloud > Add a device. Scan the square shown there with this phone\'s camera, or type its code here.'),
      appleFirst(),
      h('label', { class: 'f' }, h('span', null, 'Code from the family device'), codeIn),
      h('label', { class: 'f' }, h('span', null, 'Name of this phone'), nameIn),
      msg,
      h('button', { class: 'btn primary', style: wide, onclick: go }, 'Join'),
      installTip()));
    setTimeout(() => (code ? nameIn : codeIn).focus(), 60);
  }
  function approvalScreen(message) {
    redraw = () => approvalScreen(message);
    const codeIn = h('input', { type: 'text', inputmode: 'numeric', placeholder: '123 456', style: { fontSize: '22px', letterSpacing: '.2em', textAlign: 'center' } });
    const msg = errLine();
    if (message) msg.textContent = I().t(message);
    screen(h('div', { class: 'login' }, langPick(), logo(),
      h('h1', null, 'Waiting for approval'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, "The family organiser approves new devices. A code was sent to the organiser's e-mail: type it here. Or the organiser approves this phone in Family cloud > Devices, then tap Check again."),
      h('label', { class: 'f' }, h('span', null, 'Approval code'), codeIn), msg,
      h('button', { class: 'btn primary', style: wide, onclick: async () => {
        try { await Cloud().approve(codeIn.value.replace(/\D/g, '')); start(); } catch (e) { msg.textContent = I().t(e.message); }
      } }, 'Approve'),
      h('button', { class: 'btn', style: Object.assign({ marginTop: '8px' }, wide), onclick: async () => {
        try { const r = await Cloud().me(); if (r.device.status === 'active') start(); else msg.textContent = I().t('Not approved yet.'); } catch (e) { msg.textContent = I().t(e.message); }
      } }, 'Check again')));
  }
  function signedOutScreen() {
    redraw = signedOutScreen;
    screen(h('div', { class: 'login' }, langPick(), logo(), h('h1', null, 'This phone was signed out'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'The family organiser signed this phone out of the family cloud. To use it again, ask for a new code.'),
      h('button', { class: 'btn primary', style: wide, onclick: async () => { await Cloud().keep(null); joinScreen(''); } }, 'Join again with a new code')));
  }
  function unsupported() {
    redraw = unsupported;
    screen(h('div', { class: 'login' }, langPick(), logo(), h('h1', null, 'Open this page in Safari or Chrome'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'This browser cannot keep the app on the phone (it may be the browser inside another app). Open the link in Safari on an iPhone or in Chrome on Android, then add it to the Home Screen.')));
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
  // a notification tapped while the app was closed opens it on the right page
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', ev => { const d = ev.data || {}; if (d.type === 'fh-nav' && d.nav) location.hash = d.nav; });

  window.FHPhone = {
    registration: () => swReg,
    enablePush: () => Cloud().subscribePush(swReg),
    pushReady: () => Cloud().pushReady(swReg),
    async leave() { await Cloud().signOut(); location.reload(); },
  };

  let loaded = false;
  async function start() {
    I().setLang(localStorage.getItem('kh.lang') === 'ar' ? 'ar' : 'en');
    if (!('serviceWorker' in navigator) || !window.crypto || !crypto.subtle || !window.indexedDB) return unsupported();
    try { swReg = await serviceWorker(); } catch (e) { return unsupported(); }
    Cloud().setBase(TEST_CLOUD || CFG.cloudUrl || '');
    const code = (location.hash.match(/join=([A-Za-z0-9-]{8,9})/) || [])[1] || '';
    let st = await Cloud().state();
    if (!st || !st.token) return joinScreen(code);
    if (code) history.replaceState(null, '', location.pathname + location.search);
    if (st.revoked) return signedOutScreen();
    if (st.status === 'pending') {
      try { await Cloud().me(); } catch (e) { if (e.code === 'revoked') return signedOutScreen(); }
      st = await Cloud().state();
      if (st.status === 'pending') return approvalScreen();
    }
    CFG.folderName = st.familyName || 'family cloud';
    redraw = null;
    if (loaded) return;
    loaded = true;
    await loadScripts(CFG.appScripts || []);
  }
  start().catch(e => joinScreen('', String((e && e.message) || e)));
})();
