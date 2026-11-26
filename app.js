// App shell: data store, start-up (setup / unlock / sign-in), navigation, theme,
// language, the money PIN and page routing.
(function () {
  'use strict';
  const KH = window.KH;
  const u = KH.u, h = u.h, A = KH.analysis;
  const hub = window.hub;
  const I = () => KH.i18n;

  // ---------------- store ----------------
  const store = KH.store = {
    data: null, user: null, info: {},
    children() { return (this.data.children || []).slice().sort((a, b) => (Number(a.order) || 9) - (Number(b.order) || 9) || String(a.name).localeCompare(String(b.name))); },
    child(id) { return (this.data.children || []).find(c => c.id === id); },
    childName(id) { const c = this.child(id); return c ? c.name : ''; },
    settings() {
      return Object.assign({ lowMark: 70, dropPoints: 8, reminderDays: 3, currency: 'SAR', notifications: true, familyName: 'M. Ebrahim Family Hub', keepRunning: true,
        reimburseLimit: 100000, reimburseShare: 66.67, reimbursePeriod: 'academic-year' }, this.data.settings || {});
    },
    upsert(coll, rec) {
      rec = Object.assign({}, rec);
      const now = u.now();
      if (!rec.id) { rec.id = u.uid(coll.slice(0, 3)); rec.createdAt = now; }
      rec.updatedAt = now;
      const arr = this.data[coll] || (this.data[coll] = []);
      const i = arr.findIndex(r => r.id === rec.id);
      if (i >= 0) arr[i] = rec; else arr.push(rec);
      this.save();
      return rec;
    },
    remove(coll, id) {
      this.data[coll] = (this.data[coll] || []).filter(r => r.id !== id);
      this.data.deleted = this.data.deleted || {};
      this.data.deleted[id] = u.now();
      this.save();
    },
    setSetting(key, value) {
      this.data.settings = this.data.settings || {};
      this.data.settings[key] = value;
      this.data.settings.updatedAt = u.now();
      this.save();
    },
    save: null,
  };
  let saving = Promise.resolve();
  const doSave = async () => {
    saving = saving.then(async () => {
      try {
        const res = await hub.save(store.data);
        if (res && res.merged && res.data) { store.data = res.data; app.refresh(); u.toast('Merged with changes from another PC'); }
      } catch (e) { u.toast('Could not save: ' + e.message, 'bad'); }
    });
    return saving;
  };
  store.save = u.debounce(doSave, 350);
  store.flush = doSave;
  window.addEventListener('beforeunload', () => { doSave(); });

  // Children's own colours (purple, pink, teal) so they never look like grade colours.
  const NEW_COLOURS = { 'c6523dbe': '#6D4AE0', '3bab2397': '#B8326F', 'd000c225': '#0B7F80' }; const kidKey = s => { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); };
  const OLD_COLOURS = ['#2f6fd6', '#c2410c', '#0f766e', '', undefined, null];
  KH.kidColor = c => (c && c.color && !OLD_COLOURS.includes(c.color) ? c.color : (c && NEW_COLOURS[kidKey(c.id)]) || '#6D4AE0');
  KH.kidGradient = c => { const col = KH.kidColor(c); return `linear-gradient(135deg, ${col} 0%, color-mix(in srgb, ${col} 72%, white) 100%)`; };

  // ---------------- money PIN ----------------
  // Company reimbursement and Credentials need the PIN; amounts on Home and the
  // calendar stay hidden until it is entered. Locks again after 5 minutes without
  // activity, or when the window is minimised.
  const lock = KH.lock = {
    until: 0,
    unlocked() { return Date.now() < this.until; },
    hidden() { return !this.unlocked(); },
    touch() { if (this.unlocked()) this.until = Date.now() + 5 * 60 * 1000; },
    lockNow() { if (!this.until) return; this.until = 0; if (store.user) app.refresh(); },
    pinSet() { return !!(store.settings().pin && store.settings().pin.hash); },
    asking: null,
    async require() {
      if (this.unlocked()) return true;
      if (!app.isParent()) return false;
      if (this.asking) return this.asking;
      this.asking = (this.pinSet() ? pinPad() : createPin()).then(ok => {
        this.asking = null;
        if (ok) { this.until = Date.now() + 5 * 60 * 1000; app.refresh(); }
        return ok;
      });
      return this.asking;
    },
  };
  ['mousemove', 'keydown', 'mousedown', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, () => lock.touch(), { passive: true }));
  setInterval(() => { if (lock.until && Date.now() >= lock.until) lock.lockNow(); }, 15000);
  hub.onLock(() => lock.lockNow());

  function pinPad(title) {
    return new Promise(done => {
      let settled = false, handedOff = false;
      const resolve = v => { if (!settled) { settled = true; done(v); } };
      let digits = '', fails = 0, waitUntil = 0;
      const dots = h('div', { class: 'pin-dots' });
      const msg = h('div', { class: 'small', style: { minHeight: '20px', textAlign: 'center', color: 'var(--bad)' } });
      const pin = store.settings().pin;
      const draw = () => { dots.innerHTML = ''; for (let i = 0; i < (pin.length || 6); i++) dots.appendChild(h('i', { class: i < digits.length ? 'on' : '' })); };
      const tryIt = async () => {
        if (Date.now() < waitUntil) { msg.textContent = I().t('Too many tries. Wait a minute.'); return; }
        if (await hub.verify(digits, pin.salt, pin.hash)) { resolve(true); m.close(); return; }
        fails++; digits = ''; draw();
        m.box.classList.remove('shake'); void m.box.offsetWidth; m.box.classList.add('shake');
        if (fails >= 5) { waitUntil = Date.now() + 60000; fails = 0; msg.textContent = I().t('Too many tries. Wait a minute.'); } else msg.textContent = I().t('Wrong PIN');
      };
      const press = k => {
        if (k === '⌫') digits = digits.slice(0, -1);
        else if (k === 'OK') { if (digits.length >= 4) tryIt(); return; }
        else if (digits.length < 6) digits += k;
        draw();
        if (digits.length === (pin.length || 6) || (digits.length === 6)) tryIt();
      };
      const pad = h('div', { class: 'pin-pad' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map(k => h('button', { type: 'button', onclick: () => press(k) }, k)));
      const onKey = e => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Enter') press('OK'); };
      draw();
      const m = u.modal({ title: title || 'Enter your PIN', body: h('div', null, h('p', { class: 'muted', style: { textAlign: 'center', marginTop: 0 } }, 'Needed for company reimbursement, credentials and amounts.'), dots, msg, pad,
        h('div', { style: { textAlign: 'center', marginTop: '14px' } }, h('a', { onclick: async () => { handedOff = true; m.close(); resolve(await forgotPin()); } }, 'Forgot the PIN?'))),
        onClose: () => { window.removeEventListener('keydown', onKey); lock.closePad = null; if (!handedOff) resolve(false); } });
      lock.closePad = () => m.close();
      window.addEventListener('keydown', onKey);
    });
  }

  function createPin() {
    return new Promise(resolve => {
      const a = h('input', { type: 'password', inputmode: 'numeric', maxlength: '6', placeholder: '4 to 6 digits' });
      const b = h('input', { type: 'password', inputmode: 'numeric', maxlength: '6' });
      const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px' } });
      u.modal({ title: 'Create a PIN', body: h('div', null, h('p', { class: 'muted', style: { marginTop: 0 } }, 'This PIN protects company reimbursement, credentials and the amounts on Home and the calendar. It works on every PC that uses this family data.'),
        h('label', { class: 'f' }, h('span', null, 'New PIN'), a), h('label', { class: 'f' }, h('span', null, 'Repeat PIN'), b), msg),
      onClose: () => resolve(false),
      actions: [{ label: 'Cancel', onClick: () => resolve(false) }, { label: 'Save PIN', primary: true, onClick: async () => {
        if (!/^\d{4,6}$/.test(a.value)) { msg.textContent = I().t('Use 4 to 6 digits.'); return false; }
        if (a.value !== b.value) { msg.textContent = I().t('The two PINs do not match.'); return false; }
        const hp = await hub.hash(a.value);
        store.setSetting('pin', { salt: hp.salt, hash: hp.hash, length: a.value.length });
        u.toast('PIN saved', 'good');
        resolve(true); return true;
      } }] });
    });
  }
  KH.createPin = createPin;

  async function forgotPin() {
    // with the family cloud, the only way to reset the PIN is a code e-mailed to the organiser
    let st = null;
    try { st = hub.cloud ? await hub.cloud.status() : null; } catch (e) { st = null; }
    if (st && st.connected && st.deviceStatus === 'active') {
      let req;
      try { req = await hub.cloud.codeRequest({ purpose: 'pin-reset', subject: 'pin', label: 'the PIN for money and credentials' }); } catch (e) { u.toast(e.message, 'bad'); return false; }
      if (!req.sent) { u.toast('The e-mail for codes is not set up yet, so the PIN cannot be reset now.', 'bad'); return false; }
      const c = await u.prompt('Reset the PIN', [{ key: 'code', label: `${I().t('Code sent to')} ${req.to}` }]);
      if (!c) return false;
      try { await hub.cloud.codeVerify({ id: req.id, code: String(c.code || '').replace(/\D/g, '') }); } catch (e) { u.toast(e.message, 'bad'); return false; }
      return createPin();
    }
    const r = await u.prompt('Reset the PIN', [{ key: 'pw', label: 'Your password', type: 'password' }]);
    if (!r) return false;
    if (!(await hub.verify(r.pw, store.user.salt, store.user.hash))) { u.toast('Wrong password', 'bad'); return false; }
    return createPin();
  }

  // ---------------- app ----------------
  const app = KH.app = { filterChild: '', route: '#/home', pages: KH.pages || {} };
  KH.pages = app.pages;
  const root = document.getElementById('app');
  const PROTECTED = ['#/reimburse', '#/credentials', '#/c/payments', '#/spending'];

  // ---------------- what other parent accounts see (the organiser's Control section) ----------------
  const SECTIONS = [
    { key: 'children', label: 'Children pages', routes: ['#/child/'] },
    { key: 'school', label: 'School: records, marks, exams, goals and careers', routes: ['#/school', '#/subjects', '#/add', '#/c/examDetails', '#/goals', '#/c/qualifications', '#/careers', '#/career/', '#/c/achievements', '#/c/diary', '#/c/meetings', '#/c/contacts', '#/read/'] },
    { key: 'messages', label: 'Messages', routes: ['#/messages'] },
    { key: 'plan', label: 'Calendar, exam dates and holidays', routes: ['#/calendar', '#/c/exams', '#/c/holidays'] },
    { key: 'study', label: 'Study hours and reading', routes: ['#/study', '#/reading'] },
    { key: 'health', label: 'Sick records and lunch box', routes: ['#/sick', '#/lunch'] },
    { key: 'money', label: 'Money: payments and private courses', routes: ['#/c/payments', '#/c/courses'], off: true },
    { key: 'routine', label: 'Routine & rewards: check-ins, challenges, points and wishlists', routes: ['#/routine'] },
    { key: 'spending', label: 'Spending register', routes: ['#/spending', '#/c/spending'], off: true },
    { key: 'family', label: 'Family events, photos and documents', routes: ['#/c/events', '#/photos', '#/c/documents'] },
    { key: 'profiles', label: 'Child profiles and accounts', routes: ['#/c/children', '#/accounts'] },
    { key: 'credentials', label: 'Credentials (saved logins)', routes: ['#/credentials'], off: true },
  ];
  const OWNER_ONLY = ['#/reimburse', '#/settings', '#/cloud', '#/control'];
  // Settings > Features: parts of the app the family can switch off (they leave the menus, pages,
  // Home and reminders). Encryption, backups and locking are always on.
  const FEATURES = [
    { key: 'school', label: 'School connection (updates, announcements, homework)', routes: ['#/school'] },
    { key: 'messages', label: 'Messages', routes: ['#/messages'] },
    { key: 'calendar', label: 'Calendar', routes: ['#/calendar'] },
    { key: 'study', label: 'Study hours', routes: ['#/study'] },
    { key: 'reading', label: 'Reading and the family library', routes: ['#/reading', '#/read/'] },
    { key: 'goals', label: 'Goals', routes: ['#/goals'] },
    { key: 'careers', label: 'Careers and future paths', routes: ['#/careers', '#/career/'] },
    { key: 'health', label: 'Sick records', routes: ['#/sick'] },
    { key: 'lunch', label: 'Lunch box', routes: ['#/lunch'] },
    { key: 'money', label: 'Payments and private courses', routes: ['#/c/payments', '#/c/courses'] },
    { key: 'reimburse', label: 'Company reimbursement', routes: ['#/reimburse'] },
    { key: 'photos', label: 'Photos', routes: ['#/photos'] },
    { key: 'documents', label: 'Documents', routes: ['#/c/documents'] },
    { key: 'diary', label: "Children's private diaries", routes: ['#/mydiary'] },
    { key: 'credentials', label: 'Credentials (saved logins)', routes: ['#/credentials'] },
    { key: 'routine', label: 'Daily routine and rewards (check-ins, challenges, points, wishlists)', routes: ['#/routine'] },
    { key: 'spending', label: 'Spending register', routes: ['#/spending', '#/c/spending'] },
  ];
  const features = KH.features = {
    list: FEATURES,
    on(key) { return ((store.settings().features || {})[key]) !== false; },
    routeOff(route) { return FEATURES.some(f => !features.on(f.key) && f.routes.some(r => (r.endsWith('/') ? route.startsWith(r) : route === r || route.startsWith(r + '/')))); },
  };
  const matches = (route, r) => (r.endsWith('/') ? route.startsWith(r) : route === r || route.startsWith(r + '/'));
  const access = KH.access = {
    SECTIONS, OWNER_ONLY,
    ownerId() {
      const s = store.settings();
      return ((s.cloud || {}).ownerUserId) || ((store.data.users || []).find(x => x.role === 'parent') || {}).id || null;
    },
    isOwner() { return !!store.user && store.user.role === 'parent' && store.user.id === access.ownerId(); },
    // money stays out of reminders and the calendar for a parent account that does not see it
    noMoney() { return !features.on('money') || (!!store.user && store.user.role === 'parent' && !access.isOwner() && !access.shown('money')); },
    shown(key) {
      const c = store.settings().control || {};
      const sec = SECTIONS.find(x => x.key === key);
      return c[key] !== undefined ? !!c[key] : !(sec && sec.off);
    },
    allows(route) {
      if (features.routeOff(route)) return false;
      if (!store.user || store.user.role !== 'parent' || access.isOwner()) return true;
      if (OWNER_ONLY.some(r => matches(route, r))) return false;
      for (const sec of SECTIONS) if (sec.routes.some(r => matches(route, r))) return access.shown(sec.key);
      return true;
    },
  };
  // the menu without the parts this account does not see (and without headings left empty)
  function allowedNav(items) {
    const flat = [].concat(...items.map(x => (Array.isArray(x) ? x : [x]))).filter(Boolean);
    const kept = flat.filter(el => !(el.tagName === 'A' && el.getAttribute('href') && !access.allows(el.getAttribute('href'))));
    return kept.filter((el, i) => !(el.classList && el.classList.contains('group') && (!kept[i + 1] || (kept[i + 1].classList && kept[i + 1].classList.contains('group')))));
  }

  app.go = hash => { if (location.hash === hash) app.refresh(); else location.hash = hash; };
  app.isParent = () => store.user && store.user.role === 'parent';

  function navLink(hash, label, icon, extra) {
    const active = app.route === hash || (hash !== '#/home' && app.route.startsWith(hash + '/'));
    return h('a', { class: active ? 'active' : '', href: hash }, icon && icon.nodeType ? icon : (icon ? u.icon(icon) : null), h('span', null, label), extra || null);
  }

  const msgBadge = () => (KH.msg && KH.msg.unread ? h('span', { class: 'badge' }, String(KH.msg.unread)) : null);
  // the menu (groups, the children side by side, find a page, arrange by dragging) is built in lib/shell.js
  function nav() { return KH.shell.nav(); }

  function titleFor(route) {
    const m = route.match(/^#\/c\/(\w+)/);
    if (m && KH.schema[m[1]]) return KH.schema[m[1]].title;
    const map = { '#/home': 'Home', '#/add': 'Add marks', '#/calendar': 'Calendar', '#/study': 'Study hours', '#/reading': 'Reading & books', '#/reimburse': 'Company reimbursement',
      '#/photos': 'Photos', '#/settings': 'Settings', '#/cloud': 'Family cloud', '#/control': 'Control', '#/accounts': 'Accounts', '#/careers': 'Careers & paths', '#/me': 'My password', '#/lunch': 'Lunch box', '#/sick': 'Sick records',
      '#/school': 'School (SABIS)', '#/subjects': 'Subject analysis', '#/spending': 'Spending register', '#/credentials': 'Credentials', '#/goals': app.isParent() ? 'Goals' : 'My goals', '#/mydiary': 'My diary', '#/messages': 'Messages' };
    if (route.startsWith('#/messages')) return 'Messages';
    if (route.startsWith('#/notifications')) return 'Notifications';
    if (route.startsWith('#/routine')) return app.isParent() ? 'Routine & rewards' : 'My routine & rewards';
    if (route === '#/sick' && !app.isParent()) return 'Not feeling well';
    if (route.startsWith('#/read/')) { const b = KH.lib && KH.lib.book(route.slice(7)); return b ? b.title : 'Reader'; }
    if (map[route]) return map[route];
    if (route.startsWith('#/add')) return 'Add marks';
    if (route.startsWith('#/school')) return 'School (SABIS)';
    const c = route.match(/^#\/(child|career)\/([\w-]+)/);
    if (c) return (c[1] === 'career' ? 'Future path: ' : '') + store.childName(c[2]);
    return '';
  }

  // Pages a child login may open; anything else sends them to their own page.
  function childMayOpen(route, me) {
    let m;
    if ((m = route.match(/^#\/(child|career)\/([\w-]+)/))) return m[2] === me;
    if ((m = route.match(/^#\/c\/(\w+)/))) { const sc = KH.schema[m[1]]; return !!sc && !sc.parentOnly; }
    return ['#/calendar', '#/study', '#/reading', '#/lunch', '#/me', '#/school', '#/goals', '#/sick', '#/mydiary'].includes(route) || route.startsWith('#/school/') || route.startsWith('#/read/') || route.startsWith('#/messages') || route.startsWith('#/notifications')
      || route === '#/routine' || route.startsWith('#/routine/');
  }

  function themeOf() { return (store.user && store.user.theme) || localStorage.getItem('kh.theme') || 'light'; }
  function applyTheme(t) { document.documentElement.dataset.theme = t; try { localStorage.setItem('kh.theme', t); } catch (e) { /* ignore */ } }
  function langOf() { return (store.user && store.user.lang) || localStorage.getItem('kh.lang') || 'en'; }
  // the look: Premium & elegant by default, Modern & colourful or Clean & calm by choice (per login)
  function styleOf() { const s = (store.user && store.user.style) || localStorage.getItem('kh.style') || 'premium'; return ['premium', 'modern', 'calm'].includes(s) ? s : 'premium'; }
  function applyStyle(s) { document.documentElement.dataset.style = s; try { localStorage.setItem('kh.style', s); } catch (e) { /* ignore */ } }
  app.styleOf = styleOf;
  function applyLang(l) { I().setLang(l); try { localStorage.setItem('kh.lang', l); } catch (e) { /* ignore */ } }
  function savePref(key, value) {
    const me = (store.data.users || []).find(x => x.id === store.user.id);
    if (me) { store.user = store.upsert('users', Object.assign({}, me, { [key]: value })); }
  }
  const pushSession = () => hub.session({ role: store.user.role, childId: store.user.childId || null, userId: store.user.id, lang: langOf(), theme: themeOf() }).catch(() => {});
  app.setTheme = t => { applyTheme(t); if (store.user) { savePref('theme', t); pushSession(); } app.refresh(); };
  app.setLang = l => { applyLang(l); if (store.user) { savePref('lang', l); pushSession(); } app.refresh(); };
  app.setStyle = st => { applyStyle(st); if (store.user) savePref('style', st); app.refresh(); };

  function topTools() {
    const tools = h('div', { class: 'tools' });
    if (['#/home', '#/calendar'].includes(app.route) && app.isParent()) {
      const hidden = lock.hidden();
      tools.appendChild(h('button', { class: 'btn icon', 'aria-label': hidden ? 'Show amounts' : 'Hide amounts', title: hidden ? 'Show amounts' : 'Hide amounts',
        onclick: async () => { if (lock.hidden()) await lock.require(); else lock.lockNow(); } }, u.icon(hidden ? 'eyeoff' : 'eye')));
    }
    const lang = langOf();
    tools.appendChild(h('div', { class: 'lang-switch pc-only', role: 'group', 'aria-label': 'Language' },
      h('button', { class: lang === 'en' ? 'on' : '', 'data-noi18n': '1', title: 'English', onclick: () => app.setLang('en') }, 'EN'),
      h('button', { class: lang === 'ar' ? 'on' : '', 'data-noi18n': '1', title: 'العربية', onclick: () => app.setLang('ar') }, 'ع')));
    const dark = themeOf() === 'dark';
    tools.appendChild(h('button', { class: 'btn icon pc-only', 'aria-label': dark ? 'Switch to light mode' : 'Switch to dark mode', title: dark ? 'Light mode' : 'Dark mode',
      onclick: () => app.setTheme(dark ? 'light' : 'dark') }, u.icon(dark ? 'sun' : 'moon')));
    // sync, themes, messages and the notification centre (which also holds "things to look at")
    KH.shell.tools().forEach(el => { if (el) tools.appendChild(el); });
    if (app.isParent() && KH.sabisButton && !app.route.startsWith('#/school')) tools.appendChild(h('span', { class: 'pc-only' }, KH.sabisButton()));
    return tools;
  }

  // ---- phones: four tabs and "More" (the whole menu, the language and the light/dark switch) ----
  const tabOn = hash => app.route === hash || (hash !== '#/home' && app.route.startsWith(hash + '/'))
    || (hash === '#/home' && app.isParent() && /^#\/(child|career)\//.test(app.route));
  const tabRoots = () => app.isParent() ? ['#/home', '#/calendar', '#/messages', '#/school'] : [`#/child/${store.user.childId}`, '#/calendar', '#/messages', '#/goals'];
  const isTabRoot = route => tabRoots().some(t => route === t || (t === '#/school' && route.startsWith('#/school')));
  function backButton() {
    if (isTabRoot(app.route)) return null;
    return h('button', { class: 'btn icon small phone-only top-back', 'aria-label': 'Back', onclick: () => {
      if (history.length > 1 && app._navCount > 1) history.back(); else app.go(tabRoots()[0]);
    } }, u.icon('back', 'ico-back'));
  }
  function phoneTabs() {
    const me = store.user.childId;
    const tabs = app.isParent()
      ? [['#/home', 'Home', 'home'], ['#/calendar', 'Calendar', 'calendar'], ['#/messages', 'Messages', 'chat', true], ['#/school', 'School', 'school']]
      : [[`#/child/${me}`, 'My page', 'home'], ['#/calendar', 'Calendar', 'calendar'], ['#/messages', 'Messages', 'chat', true], ['#/goals', 'Goals', 'flag']];
    const anyOn = tabs.some(t => tabOn(t[0]));
    const unread = KH.msg && KH.msg.unread;
    return h('nav', { class: 'tabbar', 'aria-label': 'Main' },
      tabs.map(([hash, label, icon, msg]) => h('a', { class: `tab ${tabOn(hash) ? 'on' : ''}`, href: hash },
        h('span', { class: 'tab-ico' }, u.icon(icon), msg && unread ? h('span', { class: 'tab-badge', 'data-noi18n': '1' }, String(unread)) : null), h('span', { class: 'tab-label' }, label))),
      h('button', { class: `tab ${anyOn ? '' : 'on'}`, type: 'button', onclick: openMore }, h('span', { class: 'tab-ico' }, u.icon('menu')), h('span', { class: 'tab-label' }, 'More')));
  }
  function closeMore() { document.querySelectorAll('.more-back').forEach(x => x.remove()); }
  function openMore() {
    closeMore();
    const s = store.settings(), me = store.user;
    const lang = langOf(), dark = themeOf() === 'dark';
    const back = h('div', { class: 'more-back' });
    back.addEventListener('click', e => { if (e.target === back) closeMore(); });
    const sheet = h('div', { class: 'more-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Menu' },
      h('div', { class: 'more-grab' }),
      h('div', { class: 'more-head' },
        h('img', { src: 'assets/icon.png', alt: '' }),
        h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'name', 'data-noi18n': '1' }, s.familyName && s.familyName !== 'M. Ebrahim Family Hub' ? s.familyName : 'M. Ebrahim'), h('div', { class: 'kids' }, 'Family Hub')),
        h('button', { class: 'btn icon small', 'aria-label': 'Close', onclick: closeMore }, '✕')),
      h('div', { class: 'more-who' },
        h('span', { class: 'avatar', style: { width: '38px', height: '38px', background: me.role === 'child' ? KH.kidColor(store.child(me.childId)) : 'linear-gradient(135deg,#5B6CFF,#9B4DFF)' } }, u.initials(me.displayName || me.username)),
        h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'nm' }, me.displayName || me.username), h('div', { class: 'rl small muted' }, me.role === 'parent' ? 'Parent' : 'Child')),
        h('button', { class: 'btn small', onclick: () => { closeMore(); logout(); } }, u.icon('logout'), 'Sign out')),
      h('div', { class: 'more-prefs' },
        h('div', { class: 'lang-switch', role: 'group', 'aria-label': 'Language' },
          h('button', { class: lang === 'en' ? 'on' : '', 'data-noi18n': '1', onclick: () => { closeMore(); app.setLang('en'); } }, 'English'),
          h('button', { class: lang === 'ar' ? 'on' : '', 'data-noi18n': '1', onclick: () => { closeMore(); app.setLang('ar'); } }, 'العربية')),
        h('button', { class: 'btn small', onclick: () => { closeMore(); app.setTheme(dark ? 'light' : 'dark'); } }, u.icon(dark ? 'sun' : 'moon'), dark ? 'Light mode' : 'Dark mode')),
      h('nav', { class: 'nav more-nav' }, nav()));
    sheet.addEventListener('click', e => { if (e.target.closest('a[href]')) setTimeout(closeMore, 0); });
    back.appendChild(sheet);
    document.body.appendChild(back);
    I().apply(back);
  }
  app.openMore = openMore;
  u.onPhoneChange(() => { closeMore(); if (store.user) app.refresh(); });

  app.render = function render() {
    if (!store.user) return;
    closeMore();
    app.route = location.hash || (app.isParent() ? '#/home' : `#/child/${store.user.childId}`);
    if (!app.isParent() && !childMayOpen(app.route, store.user.childId)) { location.replace(`#/child/${store.user.childId}`); return; }
    const s = store.settings();
    const prevMain = document.querySelector('.main');
    const same = !!prevMain && app._sameRoute === app.route;
    const keepScroll = same ? prevMain.scrollTop : 0;
    // the left menu keeps its place when you open a page lower down (e.g. Payments)
    const prevSide = document.querySelector('.layout > .side');
    const keepSideScroll = prevSide ? prevSide.scrollTop : 0;
    app._sameRoute = app.route;
    // animations play when a page opens, not every time it redraws after a change
    const content = h('div', { class: `content ${same ? 'no-anim' : ''}` });
    const main = h('div', { class: 'main', onscroll: e => e.currentTarget.classList.toggle('scrolled', e.currentTarget.scrollTop > 4) },
      h('div', { class: 'topbar' }, backButton(), h('h1', null, titleFor(app.route)), topTools()), content);
    const me = store.user;
    app._navCount = (app._navCount || 0) + (same ? 0 : 1);
    // on a phone an open chat uses the whole screen, like other messaging apps
    const layout = h('div', { class: `layout ${/^#\/messages\/.+/.test(app.route) ? 'in-chat' : ''}` },
      h('aside', { class: `side ${me.role === 'child' ? 'kid-side' : ''}` },
        h('div', { class: 'brand' }, h('img', { src: 'assets/icon.png', alt: '' }),
          h('div', null, h('div', { class: 'name', 'data-noi18n': '1' }, s.familyName && s.familyName !== 'M. Ebrahim Family Hub' ? s.familyName : 'M. Ebrahim'), h('div', { class: 'kids' }, 'Family Hub'))),
        h('nav', { class: 'nav' }, nav()),
        h('div', { class: 'who' }, h('span', { class: 'avatar', style: { width: '34px', height: '34px', background: me.role === 'child' ? KH.kidColor(store.child(me.childId)) : 'linear-gradient(135deg,#5B6CFF,#9B4DFF)' } }, u.initials(me.displayName || me.username)),
          h('div', { style: { minWidth: 0 } }, h('div', { class: 'nm' }, me.displayName || me.username), h('div', { class: 'rl' }, me.role === 'parent' ? 'Parent' : 'Child')),
          h('button', { class: 'btn icon small', style: { marginInlineStart: 'auto' }, title: 'Sign out', 'aria-label': 'Sign out', onclick: logout }, u.icon('logout')))),
      main, phoneTabs());
    if (KH.shell.closePop) KH.shell.closePop();
    KH.shell.applyPalette();
    root.innerHTML = '';
    root.appendChild(layout);
    try {
      if (PROTECTED.includes(app.route) && access.allows(app.route) && !lock.unlocked()) content.appendChild(lockedView());
      else content.appendChild(routeTo(app.route));
    } catch (e) {
      console.error(e);
      content.appendChild(h('div', { class: 'warnbox' }, 'Something went wrong on this page: ' + e.message));
    }
    I().apply(root);
    u.animateCounts(root, same);
    if (keepSideScroll) { const side = layout.querySelector('.side'); if (side) side.scrollTop = keepSideScroll; }
    if (keepScroll) { main.scrollTop = keepScroll; main.classList.toggle('scrolled', keepScroll > 4); }
  };
  app.refresh = () => app.render();
  // only the menu (for unread counts) without redrawing the page
  app.refreshNav = () => {
    const n = document.querySelector('.side .nav'); if (!n || !store.user) return;
    n.innerHTML = ''; const kids = nav(); (Array.isArray(kids) ? kids : [kids]).flat(Infinity).forEach(k => { if (k) n.appendChild(k); }); I().apply(n);
    const t = document.querySelector('.tabbar'); if (t) { const nt = phoneTabs(); t.replaceWith(nt); I().apply(nt); }
  };

  function lockedView() {
    setTimeout(() => { if (PROTECTED.includes(app.route) && access.allows(app.route) && !lock.unlocked()) { lock.padFor = app.route; lock.require(); } }, 120);
    return h('div', { class: 'card', style: { maxWidth: '460px', textAlign: 'center', padding: '40px 30px' } },
      h('div', { style: { width: '64px', height: '64px', margin: '0 auto 14px', borderRadius: '20px', background: 'var(--accentsoft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, u.icon('lock')),
      h('h2', null, 'This page is locked'), h('p', { class: 'muted' }, 'Enter your PIN to open it. It locks again after 5 minutes or when the app is minimised.'),
      h('button', { class: 'btn primary', onclick: () => lock.require() }, lock.pinSet() ? 'Enter PIN' : 'Create a PIN'));
  }

  function routeTo(route) {
    const P = app.pages;
    let m;
    if (route === '#/home') return P.dashboard();
    if (features.routeOff(route)) return u.section('Switched off', h('p', { class: 'muted', style: { marginTop: 0 } }, 'This part of the app is switched off in Settings > Features.'));
    if (!access.allows(route)) return u.section('Not on your account', h('p', { class: 'muted', style: { marginTop: 0 } }, 'This section is not shown on your account. The family organiser chooses what each parent account sees.'));
    if (route === '#/control') return P.control();
    if ((m = route.match(/^#\/child\/([\w-]+)(?:\/(.*))?/))) return P.child(m[1], m[2]);
    if ((m = route.match(/^#\/career\/([\w-]+)/))) return P.career(m[1]);
    if (route === '#/careers') return P.careers();
    if (route === '#/subjects') return P.subjects();
    if (route.startsWith('#/add')) return P.importer(route);
    if (route.startsWith('#/school')) return P.school(route);
    if (route === '#/calendar') return P.calendar();
    if (route === '#/study') return P.study();
    if (route === '#/reading') return P.reading();
    if (route === '#/reimburse') return P.reimburse();
    if (route === '#/credentials') return P.credentials();
    if (route === '#/photos') return P.photos();
    if (route === '#/settings') return P.settings();
    if (route === '#/cloud' || route === '#/settings/cloud') return P.cloud();
    if (route === '#/accounts') return P.accounts();
    if (route === '#/me') return P.me();
    if (route === '#/lunch') return P.lunch();
    if (route === '#/sick') return P.sick();
    if (route === '#/goals') return P.goals();
    if (route === '#/routine' || route.startsWith('#/routine/')) return P.routine(route);
    if (route === '#/spending') return P.spending();
    if (route === '#/mydiary') return app.isParent() ? P.dashboard() : P.mydiary();
    if (route.startsWith('#/messages')) return P.messages(route);
    if (route === '#/notifications' || route.startsWith('#/notifications/')) return P.notifications(route);
    if ((m = route.match(/^#\/read\/([\w-]+)/))) return P.reader(m[1]);
    if ((m = route.match(/^#\/c\/(\w+)/)) && KH.schema[m[1]]) return KH.crud.page(m[1]);
    return P.dashboard();
  }

  window.addEventListener('hashchange', () => {
    // a PIN pad opened by a locked page goes away when you leave that page
    if (lock.padFor && lock.padFor !== location.hash && lock.closePad) lock.closePad();
    lock.padFor = null;
    u.closeModals();
    app.render();
  });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());

  // ---------------- sign-in and start-up screens ----------------
  function logout() {
    try { localStorage.removeItem('kh.remember'); } catch (e) { /* ignore */ }
    hub.session({ role: null, childId: null }).catch(() => {});
    store.user = null;
    lock.until = 0;
    KH.shell.applyPalette();
    showLogin();
  }

  async function signIn(user, remember) {
    store.user = user;
    applyTheme(user.theme || themeOf());
    applyStyle(user.style || styleOf());
    applyLang(user.lang || langOf());
    try { if (remember) localStorage.setItem('kh.remember', user.id); else localStorage.removeItem('kh.remember'); } catch (e) { /* ignore */ }
    await pushSession();
    if (user.role === 'parent') upgradeData();
    if (KH.msg && KH.msg.refreshOverview) setTimeout(() => KH.msg.refreshOverview(), 800);
    // a click on a notification opened the app: show that notification in the notification centre
    const want = KH.notes ? await KH.notes.takePending() : null;
    location.hash = want || (user.role === 'parent' ? '#/home' : `#/child/${user.childId}`);
    app.render();
  }

  // One-off changes for this version.
  function upgradeData() {
    const s = store.settings();
    if (!s.v2) {
      for (const c of store.data.children || []) if (OLD_COLOURS.includes(c.color) && NEW_COLOURS[kidKey(c.id)]) store.upsert('children', Object.assign({}, c, { color: NEW_COLOURS[kidKey(c.id)] }));
      if (store.data.settings.keepRunning === undefined) store.data.settings.keepRunning = true;
      store.setSetting('v2', true);
    }
    if (KH.upgradeLibrary) KH.upgradeLibrary();
  }

  function screen(...kids) {
    root.innerHTML = '';
    const el = h('div', { class: 'login-wrap' }, ...kids);
    root.appendChild(el);
    I().apply(root);
    return el;
  }
  const logo = () => h('img', { class: 'logo', src: 'assets/logo.png', alt: '' });
  const err = () => h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px', margin: '4px 0 8px' } });
  const langPick = () => h('div', { class: 'lang-switch', style: { float: 'inline-end' } },
    h('button', { class: langOf() === 'en' ? 'on' : '', 'data-noi18n': '1', onclick: () => { applyLang('en'); boot(); } }, 'EN'),
    h('button', { class: langOf() === 'ar' ? 'on' : '', 'data-noi18n': '1', onclick: () => { applyLang('ar'); boot(); } }, 'ع'));

  // Sign-in: first "Parent or child?", then pick the name and type the password.
  function showLogin(message, startRole) {
    const users = store.data.users || [];
    const parents = users.filter(x => x.role === 'parent');
    const kidLogins = store.children().map(c => ({ c, u: users.find(x => x.role === 'child' && x.childId === c.id) })).filter(x => x.u);
    let role = store.legacy ? 'parent' : (startRole || null);
    let picked = role === 'parent' && parents.length === 1 && !store.legacy ? parents[0] : null;
    const userIn = h('input', { type: 'text', placeholder: 'Username', autocomplete: 'username', onkeydown: e => { if (e.key === 'Enter') passIn.focus(); } });
    const passIn = h('input', { type: 'password', placeholder: 'Password', autocomplete: 'current-password', onkeydown: e => { if (e.key === 'Enter') go(); } });
    const remember = h('input', { type: 'checkbox' });
    const msg = err();
    const info = message ? h('div', { class: 'note small', style: { marginBottom: '12px' } }, message) : null;
    async function go() {
      msg.className = 'small'; msg.style.color = 'var(--bad)'; msg.textContent = '';
      const user = picked || findLogin(userIn.value);
      if (!user) {
        // version 1 records are not encrypted yet, so naming the parent login here gives nothing away
        msg.textContent = store.legacy && parents.length ? I().t(`There is no login called "${userIn.value.trim()}". The parent login is: ${parents.map(p => p.username).join(', ')}`) : I().t(role === 'child' ? 'Pick your name first.' : 'Wrong username or password.');
        return;
      }
      if (!(await hub.verify(passIn.value, user.salt, user.hash))) {
        msg.textContent = I().t(store.legacy ? 'Wrong password. Check Caps Lock, or use "Forgot the password?" below.' : 'Wrong password. Check Caps Lock, or use "Forgot password?" below.');
        passIn.select(); return;
      }
      if (store.legacy) {
        if (user.role !== 'parent') { msg.textContent = I().t('A parent needs to sign in once to finish updating the app.'); return; }
        try {
          const r = await hub.migrate(user.username, passIn.value);
          store.data = r.data; store.legacy = false;
          return showRecovery(r.recovery, () => signIn((store.data.users || []).find(x => x.id === user.id) || user, remember.checked), true);
        } catch (e) { msg.textContent = KH.i18n.t(e.message); return; }
      }
      if (KH.cloudUI && !(await KH.cloudUI.gate(user))) return;
      signIn(user, remember.checked);
    }
    const body = h('div');
    function draw() {
      body.innerHTML = '';
      if (!role) {
        body.appendChild(h('div', null,
          h('p', { class: 'muted', style: { marginTop: 0 } }, 'Who is signing in?'),
          h('div', { class: 'role-pick' },
            h('button', { class: 'role-btn', type: 'button', onclick: () => { role = 'parent'; picked = parents.length === 1 ? parents[0] : null; draw(); } },
              h('span', { class: 'role-ico' }, u.icon('users')), h('b', null, 'Parent'), h('span', { class: 'small muted' }, parents.map(p => p.displayName || p.username).join(', '))),
            h('button', { class: 'role-btn', type: 'button', disabled: !kidLogins.length, onclick: () => { role = 'child'; picked = null; draw(); } },
              h('span', { class: 'role-ico kid' }, u.icon('star')), h('b', null, 'Child'), h('span', { class: 'small muted' }, kidLogins.length ? kidLogins.map(x => x.c.name).join(', ') : 'No child logins yet')))));
        I().apply(body);
        return;
      }
      const choices = role === 'parent' ? parents.map(p => ({ u: p, name: p.displayName || p.username })) : kidLogins.map(x => ({ u: x.u, name: x.c.name, child: x.c }));
      const showChoices = !store.legacy && (role === 'child' || choices.length > 1);
      body.appendChild(h('div', null,
        store.legacy ? null : h('div', { class: 'row', style: { marginBottom: '12px' } },
          h('a', { class: 'small', onclick: () => { role = null; picked = null; msg.textContent = ''; draw(); } }, '← Parent or child'), h('div', { class: 'spacer' }), u.chip(role === 'parent' ? 'Parent' : 'Child', role === 'parent' ? 'info' : 'accent')),
        showChoices ? h('div', { class: 'who-pick' }, choices.map(x => h('button', { class: `who-btn ${picked && picked.id === x.u.id ? 'on' : ''}`, type: 'button', onclick: () => { picked = x.u; msg.textContent = ''; draw(); setTimeout(() => passIn.focus(), 30); } },
          x.child && KH.avatar ? KH.avatar(x.child, 44) : h('span', { class: 'avatar', style: { width: '44px', height: '44px', background: 'linear-gradient(135deg,#5B6CFF,#9B4DFF)' } }, u.initials(x.name)),
          h('span', null, x.name)))) : null,
        store.legacy || (role === 'parent' && !choices.length) ? h('label', { class: 'f' }, h('span', null, 'Username'), userIn) : null,
        picked && !showChoices ? h('div', { class: 'small muted', style: { marginBottom: '8px' } }, `Signing in as ${picked.displayName || picked.username}`) : null,
        h('label', { class: 'f' }, h('span', null, 'Password'), passIn),
        h('label', { class: 'row small', style: { marginBottom: '6px' } }, remember, 'Keep me signed in on this PC'),
        msg,
        h('button', { class: 'btn primary', style: { width: '100%', justifyContent: 'center' }, onclick: go }, 'Sign in'),
        h('p', { class: 'small', style: { textAlign: 'center', marginBottom: 0 } },
          store.legacy && parents.length ? h('a', { onclick: () => resetLegacy(parents, remember) }, 'Forgot the password?')
            : h('a', { onclick: () => forgotPassword(role, picked) }, 'Forgot password?'))));
      I().apply(body);
      if (role && (picked || store.legacy || !showChoices)) setTimeout(() => (store.legacy || (role === 'parent' && !choices.length) ? userIn : passIn).focus(), 60);
    }
    draw();
    screen(h('div', { class: 'login' }, langPick(), logo(),
      h('h1', null, 'M. Ebrahim Family Hub'),
      info, body));
  }
  KH.showLogin = showLogin;

  // Forgotten password: a 6-digit code by email (a child's code goes to the parents), or for a
  // parent the recovery key. Email is set up by a parent in Settings → Security.
  async function forgotPassword(role, user) {
    let opt = { email: false, parents: [] };
    try { opt = await hub.resetOptions(); } catch (e) { /* locked */ }
    const users = store.data.users || [];
    const parents = users.filter(x => x.role === 'parent');
    const kids = store.children().map(c => ({ c, u: users.find(x => x.role === 'child' && x.childId === c.id) })).filter(x => x.u);
    if (KH.phoneApp) {
      u.modal({ title: role === 'child' ? 'Forgot your password?' : 'Forgot the password?', body: h('div', null, h('p', null, role === 'child'
        ? 'Ask Mum or Dad. They can give you a new password in a minute: they open Accounts and press "New password" next to your name.'
        : 'Use "Forgot password?" on the family PC: it sends a code by email, or takes the recovery key. The new password then works here too.')), actions: [{ label: 'OK', primary: true }] });
      return;
    }
    if (role === 'child' && !opt.email) {
      u.modal({ title: 'Forgot your password?', body: h('div', null, h('p', null, 'Ask Mum or Dad. They can give you a new password in a minute: they sign in, open Accounts and press "New password" next to your name.')), actions: [{ label: 'OK', primary: true }] });
      return;
    }
    if (role !== 'child' && !opt.email) return recoveryReset(user);
    // ---- by email ----
    const list = role === 'child' ? kids.map(x => ({ id: x.u.id, name: x.c.name })) : parents.map(p => ({ id: p.id, name: p.displayName || p.username, masked: (opt.parents.find(o => o.id === p.id) || {}).masked }));
    const who = h('select', null, list.map(x => h('option', { value: x.id, selected: user && user.id === x.id }, x.name)));
    const code = h('input', { type: 'text', inputmode: 'numeric', maxlength: '6', placeholder: '6-digit code', style: { letterSpacing: '.3em', fontWeight: 800, fontSize: '18px' } });
    const p1 = h('input', { type: 'password', placeholder: role === 'child' ? 'New password (4+ characters)' : 'New password (6+ characters)' });
    const p2 = h('input', { type: 'password', placeholder: 'Type it again' });
    const msg = err();
    const sentNote = h('div', { class: 'small muted', style: { minHeight: '18px' } });
    const step2 = h('div', { style: { display: 'none' } },
      h('label', { class: 'f' }, h('span', null, 'Code from the email'), code),
      h('label', { class: 'f' }, h('span', null, 'New password'), p1),
      h('label', { class: 'f' }, h('span', null, 'New password again'), p2));
    const sendBtn = h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      msg.textContent = ''; sendBtn.disabled = true; sendBtn.textContent = I().t('Sending…');
      try {
        const r = await hub.resetSend(who.value);
        sentNote.textContent = I().t(role === 'child' ? `Code sent to ${r.sentTo.join(', ')}. Ask Mum or Dad for it.` : `Code sent to ${r.sentTo.join(', ')}. Check the inbox (and the spam folder).`);
        step2.style.display = ''; code.focus(); sendBtn.textContent = I().t('Send again');
      } catch (e) { msg.textContent = KH.i18n.t(e.message); sendBtn.textContent = I().t('Send the code'); }
      sendBtn.disabled = false;
    } }, role === 'child' ? 'Send the code to Mum or Dad' : 'Send the code');
    u.modal({ title: role === 'child' ? 'Forgot your password?' : 'Forgot the password?', body: h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, role === 'child' ? 'A code goes to Mum or Dad by email. When they give it to you, type it here with your new password.' : 'A code goes to your email address. Type it here with your new password.'),
      list.length > 1 ? h('label', { class: 'f' }, h('span', null, role === 'child' ? 'Who are you?' : 'Parent'), who) : null,
      h('div', { class: 'row', style: { marginBottom: '8px' } }, sendBtn), sentNote, step2, msg,
      role !== 'child' ? h('p', { class: 'small', style: { marginBottom: 0 } }, h('a', { onclick: () => { document.querySelectorAll('.modal-back').forEach(m => m.remove()); recoveryReset(user); } }, 'Use the recovery key instead')) : null),
      actions: [{ label: 'Cancel' }, { label: 'Set new password', primary: true, onClick: async () => {
        msg.textContent = '';
        if (step2.style.display === 'none') { msg.textContent = I().t('Send the code first.'); return false; }
        if (p1.value !== p2.value) { msg.textContent = I().t('The two passwords are different.'); return false; }
        try {
          await hub.resetVerify(who.value, code.value, p1.value);
          store.data = await hub.load();
          u.toast('New password saved. Sign in with it now.', 'good');
          showLogin(null, role === 'child' ? 'child' : 'parent');
          return true;
        } catch (e) { msg.textContent = KH.i18n.t(e.message); return false; }
      } }] });
  }

  // A parent's password with the recovery key printed or saved at setup.
  function recoveryReset(user) {
    const parents = (store.data.users || []).filter(x => x.role === 'parent');
    const who = h('select', null, parents.map(p => h('option', { value: p.id, selected: user && user.id === p.id }, p.displayName || p.username)));
    const code = h('input', { type: 'text', placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX', style: { fontFamily: 'monospace', letterSpacing: '.06em' } });
    const p1 = h('input', { type: 'password', placeholder: 'New password (6+ characters)' });
    const p2 = h('input', { type: 'password', placeholder: 'Type it again' });
    const msg = err();
    u.modal({ title: 'Reset a parent password', body: h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Use the recovery key you printed or saved when the app was set up. It proves you are a parent, then you choose a new password.'),
      parents.length > 1 ? h('label', { class: 'f' }, h('span', null, 'Parent'), who) : null,
      h('label', { class: 'f' }, h('span', null, 'Recovery key'), code),
      h('label', { class: 'f' }, h('span', null, 'New password'), p1),
      h('label', { class: 'f' }, h('span', null, 'New password again'), p2), msg,
      h('p', { class: 'small muted', style: { marginBottom: 0 } }, 'Tip: a parent can set up password codes by email in Settings → Security.')),
      actions: [{ label: 'Cancel' }, { label: 'Set new password', primary: true, onClick: async () => {
        msg.textContent = '';
        if (p1.value.length < 6) { msg.textContent = I().t('Choose a password of at least 6 characters.'); return false; }
        if (p1.value !== p2.value) { msg.textContent = I().t('The two passwords are different.'); return false; }
        const parent = parents.find(p => p.id === who.value) || parents[0];
        try {
          store.data = await hub.recover(code.value.trim());
          await hub.vaultSetPassword(parent.username, p1.value);
          const hp = await hub.hash(p1.value);
          const fresh = (store.data.users || []).find(x => x.id === parent.id) || parent;
          store.upsert('users', Object.assign({}, fresh, { salt: hp.salt, hash: hp.hash }));
          await store.flush();
          u.toast('New password saved. Sign in with it now.', 'good');
          showLogin(null, 'parent');
          return true;
        } catch (e) { msg.textContent = KH.i18n.t(e.message); return false; }
      } }] });
  }

  // A login can be typed as its username or as the name shown for it (when that name is unique).
  function findLogin(typed) {
    const t = String(typed || '').trim().toLowerCase();
    if (!t) return null;
    const users = store.data.users || [];
    const byName = users.find(x => String(x.username).toLowerCase() === t);
    if (byName) return byName;
    const byShown = users.filter(x => String(x.displayName || '').trim().toLowerCase() === t);
    return byShown.length === 1 ? byShown[0] : null;
  }

  // Version 1 kept you signed in after the first day, so its password is easy to forget. Its
  // records are not encrypted yet, so a parent password can be chosen again once, before encrypting.
  function resetLegacy(parents, remember) {
    const who = h('select', null, parents.map(p => h('option', { value: p.username }, `${p.username}${p.displayName && p.displayName !== p.username ? ` (${p.displayName})` : ''}`)));
    const p1 = h('input', { type: 'password', autocomplete: 'new-password' });
    const p2 = h('input', { type: 'password', autocomplete: 'new-password' });
    const msg = err();
    u.modal({ title: 'Choose a new password', body: h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Your records from version 1 are not encrypted yet, so you can choose a new parent password here. The app then encrypts everything with it and shows your recovery key.'),
      h('label', { class: 'f' }, h('span', null, 'Parent login'), who),
      h('label', { class: 'f' }, h('span', null, 'New password'), p1, h('div', { class: 'small muted', style: { marginTop: '3px' } }, 'At least 6 characters. It also opens the family data on a new PC.')),
      h('label', { class: 'f' }, h('span', null, 'Repeat new password'), p2), msg),
    actions: [{ label: 'Cancel' }, { label: 'Save and continue', primary: true, onClick: async () => {
      if (p1.value.length < 6) { msg.textContent = I().t('Choose a password of at least 6 characters.'); return false; }
      if (p1.value !== p2.value) { msg.textContent = I().t('The two passwords do not match.'); return false; }
      try {
        const r = await hub.migrateReset(who.value, p1.value);
        store.data = r.data; store.legacy = false;
        const user = (store.data.users || []).find(x => x.role === 'parent' && x.username === who.value);
        showRecovery(r.recovery, () => signIn(user, remember.checked), true);
        return true;
      } catch (e) { msg.textContent = KH.i18n.t(e.message); return false; }
    } }] });
  }

  function showUnlock(where) {
    const userIn = h('input', { type: 'text', placeholder: 'Username' });
    const passIn = h('input', { type: 'password', placeholder: 'Password', onkeydown: e => { if (e.key === 'Enter') go(); } });
    const msg = err();
    const place = where === 'family-cloud' ? 'the family cloud' : where === 'gdrive' ? 'Google Drive' : where === 'onedrive' ? 'OneDrive' : 'the data folder';
    async function go() {
      msg.textContent = '';
      try {
        store.data = await hub.unlock(userIn.value.trim(), passIn.value);
        const user = (store.data.users || []).find(x => String(x.username).toLowerCase() === userIn.value.trim().toLowerCase());
        if (user) signIn(user, true); else showLogin();
      } catch (e) { msg.textContent = KH.i18n.t(e.message); }
    }
    screen(h('div', { class: 'login' }, langPick(), logo(),
      h('h1', null, 'Open your family data'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, KH.phoneApp
        ? `Your family data is in ${place}. It is encrypted, so the first time on this phone a parent signs in to unlock it. After that, this phone remembers it.`
        : `Your family data is in ${place}. It is encrypted, so the first time on this PC a parent signs in to unlock it. After that, this PC remembers it (protected by Windows).`),
      h('label', { class: 'f' }, h('span', null, "Parent's username"), userIn),
      h('label', { class: 'f' }, h('span', null, 'Password'), passIn),
      msg,
      h('button', { class: 'btn primary', style: { width: '100%', justifyContent: 'center' }, onclick: go }, 'Unlock'),
      h('p', { class: 'small', style: { textAlign: 'center', marginBottom: 0 } }, h('a', { onclick: async () => {
        const r = await u.prompt('Use the recovery key', [{ key: 'code', label: 'Recovery key (for example K7Q2-9HXM-…)' }]);
        if (!r) return;
        try { store.data = await hub.recover(r.code); showLogin('Unlocked with the recovery key. Sign in now; a parent can set a new password in Accounts.'); } catch (e) { msg.textContent = KH.i18n.t(e.message); }
      } }, 'Forgot the password? Use the recovery key'))));
    setTimeout(() => userIn.focus(), 60);
  }

  function showFound(found) {
    let pick = found[0];
    const list = h('div');
    const draw = () => {
      list.innerHTML = '';
      for (const f of found) {
        list.appendChild(h('div', { class: `choice ${f === pick ? 'on' : ''}`, onclick: () => { pick = f; draw(); } },
          u.icon(f.kind === 'local' ? 'home' : 'school'),
          h('div', null, h('b', null, f.label), h('div', { class: 'small muted', 'data-noi18n': '1', style: { wordBreak: 'break-all' } }, f.dir),
            h('div', { class: 'small muted' }, `${f.encrypted ? 'Encrypted' : 'Older version'} · last saved ${new Date(f.mtime).toLocaleString(u.locale())}`))));
      }
      I().apply(list);
    };
    draw();
    screen(h('div', { class: 'login wide' }, langPick(), logo(),
      h('h1', null, 'We found your family data'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'M. Ebrahim Family Hub data is already in your cloud folder. Use it on this PC, or start fresh.'),
      list,
      h('div', { class: 'row', style: { marginTop: '12px' } },
        h('button', { class: 'btn', onclick: async () => { const r = await hub.boot(); showSetup(r.roots || await hub.roots()); } }, 'Start fresh instead'),
        hub.cloud ? h('button', { class: 'btn', onclick: () => KH.cloudUI.showJoin(cloudKit()) }, u.icon('sync'), 'Join my family instead') : null,
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: async () => { const r = await hub.useFound(pick.dir); handleBoot(r); } }, 'Use this data'))));
  }

  function showSetup(roots) {
    roots = roots || [];
    let root = roots.find(r => r.kind === 'gdrive') || roots.find(r => r.kind === 'onedrive') || roots[0];
    let step = 1;
    const name = h('input', { type: 'text', value: '' });
    const user = h('input', { type: 'text', value: '' });
    const pass = h('input', { type: 'password' });
    const pass2 = h('input', { type: 'password' });
    const starter = h('input', { type: 'checkbox', checked: true });
    const msg = err();
    const box = h('div', { class: 'login wide' });
    const draw = () => {
      box.innerHTML = '';
      box.append(langPick(), logo(), h('div', { class: 'steps' }, [1, 2, 3].map(i => h('i', { class: i <= step ? 'on' : '' }))));
      if (step === 1) {
        box.appendChild(h('div', null, h('h1', null, 'Where should the family data live?'),
          h('p', { class: 'muted', style: { marginTop: 0 } }, 'Pick a cloud folder so every PC can use the same records. Everything is encrypted before it is saved, so Microsoft or Google only see scrambled files.'),
          roots.map(r => h('div', { class: `choice ${r === root ? 'on' : ''}`, onclick: () => { root = r; draw(); } }, u.icon(r.kind === 'local' ? 'home' : 'school'),
            h('div', null, h('b', null, r.label), h('div', { class: 'small muted', 'data-noi18n': '1', style: { wordBreak: 'break-all' } }, r.path)))),
          !roots.some(r => r.kind !== 'local') ? h('div', { class: 'warnbox', style: { marginBottom: '10px' } }, 'No OneDrive or Google Drive folder was found on this PC. Install one of them and sign in to use the same data on several PCs, or keep the data on this PC for now.') : null,
          h('div', { class: 'row' },
            hub.cloud ? h('button', { class: 'btn', onclick: () => KH.cloudUI.showJoin(cloudKit()) }, u.icon('sync'), 'Join my family (code from a family device)') : null,
            h('div', { class: 'spacer' }), h('button', { class: 'btn primary', onclick: () => { step = 2; draw(); } }, 'Next'))));
      } else if (step === 2) {
        box.appendChild(h('div', null, h('h1', null, 'Create the parent account'),
          h('p', { class: 'muted', style: { marginTop: 0 } }, 'This password also unlocks the encrypted data on a new PC. Logins for the children can be added afterwards.'),
          h('div', { class: 'form-grid' },
            h('label', { class: 'f full' }, h('span', null, 'Your name'), name),
            h('label', { class: 'f full' }, h('span', null, 'Username'), user),
            h('label', { class: 'f' }, h('span', null, 'Password'), pass),
            h('label', { class: 'f' }, h('span', null, 'Repeat password'), pass2)),
          h('label', { class: 'row small', style: { margin: '2px 0 8px' } }, starter, "Start with the children's Term 1 2026-27 reports already loaded"),
          msg,
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { step = 1; draw(); } }, 'Back'), h('div', { class: 'spacer' }),
            h('button', { class: 'btn primary', onclick: create }, 'Create and continue'))));
      }
      I().apply(box);
    };
    async function create() {
      if (!user.value.trim() || pass.value.length < 6) { msg.textContent = I().t('Choose a username and a password of at least 6 characters.'); return; }
      if (pass.value !== pass2.value) { msg.textContent = I().t('The two passwords do not match.'); return; }
      try {
        const r = await hub.setupCreate({ root: root.path, username: user.value.trim().toLowerCase(), displayName: name.value.trim() || 'Parent', password: pass.value, starter: starter.checked });
        store.data = r.data;
        store.info = await hub.info();
        showRecovery(r.recovery, () => signIn(r.user, true), false);
      } catch (e) { msg.textContent = KH.i18n.t(e.message); }
    }
    draw();
    screen(box);
  }

  function showRecovery(code, next, upgraded) {
    const ok = h('input', { type: 'checkbox' });
    const go = h('button', { class: 'btn primary', disabled: true, onclick: () => next() }, 'Continue');
    ok.addEventListener('change', () => { go.disabled = !ok.checked; });
    const card = h('div', { class: 'code', 'data-noi18n': '1' }, code);
    screen(h('div', { class: 'login wide' }, logo(),
      h('div', { class: 'steps' }, [1, 2, 3].map(() => h('i', { class: 'on' }))),
      h('h1', null, upgraded ? 'Your data is now encrypted' : 'Save your recovery key'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'If every parent password is ever forgotten, this key is the only way to open the family data. Print it or write it down and keep it somewhere safe, away from the PC.'),
      card,
      h('div', { class: 'row', style: { margin: '12px 0' } },
        h('button', { class: 'btn', onclick: () => { hub.copy(code); u.toast('Copied - it clears from the clipboard in 30 seconds'); } }, u.icon('copy'), 'Copy'),
        h('button', { class: 'btn', onclick: () => hub.print(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font-family:Segoe UI,Arial;padding:40px}h1{font-size:20px}.c{font:700 26px Consolas,monospace;letter-spacing:.08em;border:2px dashed #4F46E5;padding:18px;text-align:center;margin:20px 0}</style></head><body><h1>M. Ebrahim Family Hub - recovery key</h1><p>Keep this safe. It opens the family data if every parent password is forgotten.</p><div class="c">${u.esc(code)}</div><p>Created ${new Date().toLocaleDateString('en-GB')}</p></body></html>`) }, u.icon('print'), 'Print')),
      h('label', { class: 'row', style: { marginBottom: '12px' } }, ok, "I've saved the recovery key"),
      h('div', { class: 'row' }, h('div', { class: 'spacer' }), go)));
  }
  KH.showRecovery = showRecovery;

  // the pieces the family cloud's start-up screens use
  function cloudKit() { return { screen, logo, langPick, err, back: () => boot(), done: () => boot() }; }
  KH.cloudKit = cloudKit;

  function handleBoot(r) {
    store.info = r.info || {};
    store.legacy = r.state === 'legacy';
    if (r.state === 'cloud' && KH.cloudUI) return KH.cloudUI.showWait(cloudKit(), r.cloud);
    if (r.state === 'setup') return showSetup(r.roots);
    if (r.state === 'found') return showFound(r.found);
    if (r.state === 'locked') return showUnlock(r.where);
    store.data = r.data;
    if (!store.data || !(store.data.users || []).length) return showSetup(r.roots || []);
    let remembered = null;
    try { remembered = localStorage.getItem('kh.remember'); } catch (e) { /* ignore */ }
    const user = !store.legacy && remembered && (store.data.users || []).find(x => x.id === remembered);
    if (user && KH.cloudUI) return KH.cloudUI.gate(user).then(okd => (okd ? signIn(user, true) : showLogin()));
    if (user) return signIn(user, true);
    showLogin(store.legacy ? 'This version encrypts the family data. A parent signs in once to finish.' : '');
  }

  async function boot() {
    applyTheme(themeOf());
    applyLang(langOf());
    let r = null;
    try { r = await hub.boot(); } catch (e) { r = { state: 'setup', roots: [] }; u.toast('Could not start: ' + e.message, 'bad'); }
    handleBoot(r);
  }

  // notification sounds chosen in Settings (the PC plays them; a phone uses its own sound)
  if (hub.onSound) hub.onSound(sd => {
    if (KH.notes) { KH.notes.play(sd.name, sd.volume); return; }
    try { const a = new Audio(`../assets/sounds/${String(sd.name).replace(/[^a-z]/g, '')}.wav`); a.volume = Math.max(0, Math.min(1, Number(sd.volume) || 0.8)); a.play().catch(() => {}); } catch (e) { /* no sound */ }
  });

  hub.onExternal(d => {
    if (!d) return;
    store.data = d;
    if (store.user) {
      const still = (d.users || []).find(x => x.id === store.user.id);
      if (still) { store.user = still; if (!document.querySelector('.modal-back')) app.refresh(); } else logout();
    }
  });
  boot();
})();
