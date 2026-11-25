// The window's frame (version 4.1): the left menu in groups that open and close, the children
// side by side, "Find a page", "Arrange my menu" (drag groups and links; saved per person), the
// playful menu for children, the buttons at the top right (sync, themes, messages, notification
// centre), the home screen's date and time, and the extra colour themes.
(function () {
  'use strict';
  const KH = window.KH;
  const u = KH.u, h = u.h;
  const t = s => (KH.i18n ? KH.i18n.t(s) : s);
  const app = () => KH.app, store = () => KH.store;
  const isParent = () => !!store().user && store().user.role === 'parent';

  // ---------------- what the menu holds ----------------
  // [route, label, icon, badge]  badge: 'msg' unread messages, 'ann' unread school news
  function layout() {
    const me = store().user.childId;
    if (!isParent()) {
      return {
        top: [[`#/child/${me}`, 'My page', 'home'], ['#/calendar', 'Calendar', 'calendar']],
        groups: [
          { key: 'school', label: 'School', icon: 'school', color: '#FF8A3D', items: [['#/school', 'School (SABIS)', 'school', 'ann'], [`#/child/${me}/subjects`, 'My subjects', 'chart'], ['#/c/exams', 'Exam dates', 'flag'], ['#/c/examDetails', 'Exam right & wrong', 'check'], ['#/c/qualifications', 'Qualifications', 'doc'], ['#/c/diary', 'School diary', 'book']] },
          { key: 'study', label: 'Study', icon: 'chart', color: '#2EB8A6', items: [['#/study', 'Study hours', 'chart'], ['#/reading', 'Reading & books', 'book']] },
          { key: 'goals', label: 'Goals & rewards', icon: 'star', color: '#F5B82E', items: [['#/goals', 'My goals', 'flag'], ['#/c/achievements', 'Achievements', 'star'], [`#/career/${me}`, 'My future path', 'path']] },
          { key: 'me', label: 'Me', icon: 'heart', color: '#F0567A', items: [['#/mydiary', 'My diary', 'lock'], ['#/sick', 'Not feeling well', 'heart'], ['#/lunch', 'Lunch box', 'lunch']] },
          { key: 'comm', label: 'Chat', icon: 'chat', color: '#9B6BFF', items: [['#/messages', 'Messages', 'chat', 'msg']] },
        ],
        setup: [['#/me', 'My password', 'key']],
      };
    }
    return {
      top: [['#/home', 'Home', 'home'], ['#/calendar', 'Calendar', 'calendar']],
      groups: [
        { key: 'school', label: 'School', icon: 'school', items: [['#/school', 'School (SABIS)', 'school', 'ann'], ['#/add', 'Add marks', 'plus'], ['#/subjects', 'Subject analysis', 'chart'], ['#/c/exams', 'Exam dates', 'flag'], ['#/c/examDetails', 'Exam right & wrong', 'check'], ['#/c/homework', 'Homework', 'check'], ['#/c/holidays', 'Holidays & school events', 'star'], ['#/c/qualifications', 'Qualifications', 'doc'], ['#/c/diary', 'School diary', 'book'], ['#/c/meetings', 'School meetings', 'users']] },
        { key: 'study', label: 'Study', icon: 'chart', items: [['#/study', 'Study hours', 'chart'], ['#/reading', 'Reading & books', 'book']] },
        { key: 'goals', label: 'Goals & rewards', icon: 'flag', items: [['#/goals', 'Goals', 'flag'], ['#/c/achievements', 'Achievements', 'star'], ['#/careers', 'Careers & paths', 'path']] },
        { key: 'health', label: 'Health & daily', icon: 'heart', items: [['#/sick', 'Sick records', 'heart'], ['#/lunch', 'Lunch box', 'lunch']] },
        { key: 'activities', label: 'Activities', icon: 'star', items: [['#/c/courses', 'Private courses', 'book']] },
        { key: 'money', label: 'Money', icon: 'wallet', items: [['#/c/payments', 'Payments', 'wallet'], ['#/reimburse', 'Company reimbursement', 'lock']] },
        { key: 'comm', label: 'Communication', icon: 'chat', items: [['#/messages', 'Messages', 'chat', 'msg'], ['#/c/contacts', 'Contacts', 'user']] },
        { key: 'family', label: 'Family', icon: 'users', items: [['#/c/events', 'Family events', 'star'], ['#/photos', 'Photos', 'photo'], ['#/c/documents', 'Documents', 'doc']] },
      ],
      setup: [['#/c/children', 'Child profiles', 'users'], ['#/accounts', 'Accounts', 'user'], ['#/credentials', 'Credentials', 'key'], ['#/cloud', 'Family cloud', 'sync'], ['#/control', 'Control', 'eye'], ['#/settings', 'Settings', 'gear']],
    };
  }

  // the person's own order (groups, and which links sit in which group), kept on their account
  function myOrder() { return (store().user && store().user.navOrder) || null; }
  function saveOrder(order) {
    const me = (store().data.users || []).find(x => x.id === store().user.id);
    const rec = Object.assign({}, me || store().user, { navOrder: order });
    if (me) store().user = store().upsert('users', rec); else store().user = rec;
  }
  function arranged() {
    const L = layout();
    const allowed = it => KH.access.allows(it[0]);
    const o = myOrder();
    let groups = L.groups.map(g => Object.assign({}, g, { items: g.items.slice() }));
    if (o && o.role === store().user.role && o.items) {
      const pool = new Map(), home = new Map();
      groups.forEach(g => g.items.forEach(it => { pool.set(it[0], it); home.set(it[0], g.key); }));
      const placed = new Set();
      for (const g of groups) g.items = (o.items[g.key] || []).filter(r => pool.has(r) && !placed.has(r) && placed.add(r)).map(r => pool.get(r));
      // links the saved order does not know (new in a later version) stay in their usual group
      for (const [r, it] of pool) if (!placed.has(r)) groups.find(g => g.key === home.get(r)).items.push(it);
      if (o.groups) groups.sort((a, b) => idx(o.groups, a.key) - idx(o.groups, b.key));
    }
    groups.forEach(g => { g.items = g.items.filter(allowed); });
    return { top: L.top.filter(allowed), groups: groups.filter(g => g.items.length || state.arrange), setup: L.setup.filter(allowed) };
  }
  const idx = (arr, k) => { const i = arr.indexOf(k); return i < 0 ? 999 : i; };

  const state = { open: null, route: null, arrange: false, drag: null };
  try { state.open = localStorage.getItem('kh.navopen'); } catch (e) { /* ignore */ }
  const setOpen = k => { state.open = k; try { localStorage.setItem('kh.navopen', k || ''); } catch (e) { /* ignore */ } };

  const isOn = hash => { const r = app().route; return r === hash || (hash !== '#/home' && r.startsWith(hash + '/')) || (hash === '#/school' && r.startsWith('#/school')); };
  function badgeOf(kind) {
    const n = kind === 'msg' ? (KH.msg && KH.msg.unread) || 0 : kind === 'ann' ? (KH.annUnread ? KH.annUnread() : 0) : 0;
    return n ? h('span', { class: 'badge', 'data-noi18n': '1' }, String(n)) : null;
  }
  const countOf = items => items.reduce((a, it) => a + (it[3] === 'msg' ? (KH.msg && KH.msg.unread) || 0 : it[3] === 'ann' ? (KH.annUnread ? KH.annUnread() : 0) : 0), 0);

  function link(it, opts = {}) {
    const [hash, label, icon, badge] = it;
    const a = h('a', { class: `${isOn(hash) ? 'active' : ''} ${opts.cls || ''}`, href: hash }, state.arrange && opts.drag ? u.icon('grip', 'grip') : null, opts.noIcon ? null : u.icon(icon), h('span', null, label), badgeOf(badge));
    if (state.arrange && opts.drag) { a.draggable = true; a.dataset.drag = 'item'; a.dataset.route = hash; a.dataset.group = opts.group; a.addEventListener('click', e => e.preventDefault()); }
    return a;
  }

  // ---------------- the menu ----------------
  function nav() {
    if (!store().user) return [];
    const A = arranged();
    if (state.route !== app().route) {
      state.route = app().route;
      const g = A.groups.find(x => x.items.some(it => isOn(it[0])));
      if (g) setOpen(g.key);
    }
    return isParent() ? parentNav(A) : childNav(A);
  }

  function findBox(A) {
    const all = [].concat(A.top, ...A.groups.map(g => g.items), A.setup, isParent() ? store().children().map(c => [`#/child/${c.id}`, c.name, 'user']) : []);
    const results = h('div', { class: 'find-results' });
    const input = h('input', { type: 'search', class: 'find-input', placeholder: t('Find a page'), 'aria-label': t('Find a page') });
    const matches = () => { const q = input.value.trim().toLowerCase(); return q ? all.filter(it => t(it[1]).toLowerCase().includes(q) || it[1].toLowerCase().includes(q)).slice(0, 8) : []; };
    const paint = () => {
      results.innerHTML = '';
      const m = matches();
      m.forEach((it, i) => results.appendChild(h('a', { href: it[0], class: i === 0 ? 'first' : '', onclick: () => { input.value = ''; results.innerHTML = ''; } }, u.icon(it[2]), h('span', null, t(it[1])))));
      if (input.value.trim() && !m.length) results.appendChild(h('div', { class: 'none' }, t('Nothing found')));
    };
    input.addEventListener('input', paint);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const m = matches(); if (m[0]) { input.value = ''; results.innerHTML = ''; app().go(m[0][0]); } }
      if (e.key === 'Escape') { input.value = ''; results.innerHTML = ''; input.blur(); }
    });
    return h('div', { class: 'find' }, u.icon('search'), input, h('kbd', { 'data-noi18n': '1' }, 'Ctrl K'), results);
  }

  function kidsRow() {
    const kids = store().children();
    if (!kids.length) return null;
    return h('div', { class: 'kids-row' }, kids.map(c => {
      const hash = `#/child/${c.id}`;
      const n = KH.analysis.alerts(store().data, u.today(), { childId: c.id, parent: true, noMoney: KH.access.noMoney() }).filter(a => a.severity === 'high').length;
      return h('a', { class: `kid-pick ${app().route === hash || app().route.startsWith(hash + '/') || app().route === `#/career/${c.id}` ? 'active' : ''}`, href: hash, style: { '--kc': KH.kidColor(c) }, title: c.name },
        KH.avatar ? KH.avatar(c, 44) : h('span', { class: 'avatar' }, u.initials(c.name)),
        h('span', { class: 'kid-name', 'data-noi18n': '1' }, c.name), n ? h('span', { class: 'kid-n', 'data-noi18n': '1' }, String(n)) : null);
    }));
  }

  function arrangeBar() {
    return h('div', { class: 'arrange-bar' },
      h('button', { type: 'button', class: `arrange-btn ${state.arrange ? 'on' : ''}`, onclick: e => { state.arrange = !state.arrange; repaint(e.currentTarget); } }, u.icon('pen'), h('span', null, state.arrange ? 'Done arranging' : 'Arrange my menu')),
      state.arrange ? h('button', { type: 'button', class: 'arrange-reset', onclick: e => { saveOrder(null); repaint(e.currentTarget); } }, 'Reset to default') : null,
      state.arrange ? h('div', { class: 'arrange-tip' }, isParent() ? 'Drag a group or a link to a new place.' : 'Drag the tiles into your own order.') : null);
  }

  function setupRow(A) {
    return h('div', { class: 'setup-row' }, A.setup.map(it => h('a', { href: it[0], class: isOn(it[0]) ? 'active' : '', title: t(it[1]), 'aria-label': t(it[1]) }, u.icon(it[2]))));
  }

  function parentNav(A) {
    const out = [findBox(A), kidsRow()];
    A.top.forEach(it => out.push(link(it)));
    for (const g of A.groups) {
      const open = state.arrange || state.open === g.key;
      const sum = countOf(g.items);
      const head = h('button', { type: 'button', class: 'ng-head', 'aria-expanded': String(open), onclick: e => { if (state.arrange) return; setOpen(state.open === g.key ? '' : g.key); repaint(e.currentTarget); } },
        state.arrange ? u.icon('grip', 'grip') : null, u.icon(g.icon), h('span', null, g.label), sum && !open ? h('span', { class: 'badge', 'data-noi18n': '1' }, String(sum)) : null, state.arrange ? null : u.icon('back', 'ico chev'));
      const box = h('div', { class: `ngroup ${open ? 'open' : ''}`, 'data-group': g.key }, head, h('div', { class: 'ng-items' }, g.items.map(it => link(it, { drag: true, group: g.key, noIcon: false, cls: 'sub' }))));
      if (state.arrange) { box.draggable = true; box.dataset.drag = 'group'; }
      out.push(box);
    }
    out.push(arrangeBar(), setupRow(A));
    return out;
  }

  function childNav(A) {
    const me = store().user, kid = store().child(me.childId) || {};
    const first = String(me.displayName || kid.name || me.username || '').split(/\s+/)[0];
    const open = A.groups.find(g => g.key === state.open);
    const out = [
      h('div', { class: 'kid-hello' }, h('span', { class: 'kid-big' }, u.initials(first)),
        h('div', null, h('div', { class: 'kid-hi' }, h('span', null, 'Hi'), ' ', h('span', { 'data-noi18n': '1' }, first + '!'), h('span', { class: 'wave', 'aria-hidden': 'true' }, '\u{1F44B}')),
          h('div', { class: 'kid-date' }, fmtDay(new Date())))),
      findBox(A),
      h('div', { class: 'kid-top' }, A.top.map(it => link(it, { cls: 'kid-btn' }))),
      h('div', { class: 'kid-tiles' }, A.groups.map((g, i) => {
        const sum = countOf(g.items);
        const tile = h('button', { type: 'button', class: `kid-tile ${state.open === g.key ? 'open' : ''}`, 'data-group': g.key, style: { '--tc': g.color, animationDelay: `${i * 60}ms` },
          onclick: e => { if (state.arrange) return; setOpen(state.open === g.key ? '' : g.key); repaint(e.currentTarget); } },
          state.arrange ? u.icon('grip', 'grip') : null, h('span', { class: 'kt-ico' }, u.icon(g.icon)), h('span', null, g.label), sum ? h('span', { class: 'kt-n', 'data-noi18n': '1' }, String(sum)) : null);
        if (state.arrange) { tile.draggable = true; tile.dataset.drag = 'group'; }
        return tile;
      })),
      // every group's links are in the page (so they can be found and read aloud); only the open one shows
      h('div', { class: 'kid-chips-wrap' }, A.groups.map(g => h('div', { class: `kid-chips ${open && open.key === g.key ? 'open' : ''}`, style: { '--tc': g.color } }, g.items.map(it => link(it, { cls: 'kid-chip', noIcon: true }))))),
      arrangeBar(), setupRow(A),
    ];
    return out;
  }

  // redraw only the menu that holds this element (the window's side menu or the phone's "More" sheet)
  function repaint(el) {
    const navEl = (el && el.closest && el.closest('nav')) || document.querySelector('.side .nav');
    if (!navEl) return;
    const side = navEl.closest('.side, .more-sheet');
    const keep = side ? side.scrollTop : 0;
    navEl.innerHTML = '';
    [].concat(nav()).flat(Infinity).forEach(k => { if (k) navEl.appendChild(k); });
    if (KH.i18n) KH.i18n.apply(navEl);
    if (side) side.scrollTop = keep;
  }

  // ---------------- dragging (in "Arrange my menu") ----------------
  document.addEventListener('dragstart', e => {
    const el = e.target.closest && e.target.closest('.nav [data-drag]');
    if (!el || !state.arrange) return;
    state.drag = el.dataset.drag === 'item' ? { kind: 'item', route: el.dataset.route, from: el.dataset.group } : { kind: 'group', key: el.dataset.group };
    el.classList.add('dragging');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'menu'); } catch (err) { /* ignore */ }
  });
  document.addEventListener('dragover', e => {
    if (!state.drag) return;
    const over = e.target.closest && e.target.closest('.nav [data-group]');
    if (!over) return;
    e.preventDefault();
    document.querySelectorAll('.nav .drop-over').forEach(x => x.classList.remove('drop-over'));
    (e.target.closest('.nav [data-drag="item"]') || over).classList.add('drop-over');
  });
  document.addEventListener('dragend', () => { document.querySelectorAll('.nav .dragging, .nav .drop-over').forEach(x => x.classList.remove('dragging', 'drop-over')); state.drag = null; });
  document.addEventListener('drop', e => {
    const d = state.drag; state.drag = null;
    if (!d) return;
    const navEl = e.target.closest && e.target.closest('.nav');
    const overItem = e.target.closest && e.target.closest('.nav [data-drag="item"]');
    const overGroup = e.target.closest && e.target.closest('.nav [data-group]');
    if (!navEl || !overGroup) return;
    e.preventDefault();
    const A = arranged();
    const order = { role: store().user.role, groups: A.groups.map(g => g.key), items: {} };
    // keep links this account cannot see where they were, so the order is the same on every device
    const full = layout(); const prev = myOrder();
    for (const g of full.groups) order.items[g.key] = (prev && prev.role === store().user.role && prev.items && prev.items[g.key]) ? prev.items[g.key].slice() : g.items.map(it => it[0]);
    for (const g of full.groups) for (const it of g.items) if (!Object.values(order.items).some(l => l.includes(it[0]))) order.items[g.key].push(it[0]);
    if (d.kind === 'group') {
      const target = overGroup.dataset.group;
      if (target && target !== d.key) { order.groups.splice(order.groups.indexOf(d.key), 1); order.groups.splice(order.groups.indexOf(target), 0, d.key); }
      for (const g of full.groups) if (!order.groups.includes(g.key)) order.groups.push(g.key);
    } else {
      const to = overGroup.dataset.group;
      for (const k of Object.keys(order.items)) order.items[k] = order.items[k].filter(r => r !== d.route);
      const list = order.items[to] || (order.items[to] = []);
      const at = overItem ? list.indexOf(overItem.dataset.route) : -1;
      if (at >= 0) list.splice(at, 0, d.route); else list.push(d.route);
      if (!order.groups.includes(to)) order.groups.push(to);
    }
    saveOrder(order);
    repaint(navEl);
  });
  // Ctrl+K: find a page
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      const i = document.querySelector('.side .find-input');
      if (i && i.offsetParent !== null) { e.preventDefault(); i.focus(); }
    }
  });

  // ---------------- top right: sync, themes, messages, notification centre ----------------
  let cloudState = null;
  const C = () => window.hub && window.hub.cloud;
  if (C() && C().onStatus) C().onStatus(st => { cloudState = st; paintSync(); });
  function syncLook() {
    const st = cloudState || (KH.cloudUI && KH.cloudUI.last && KH.cloudUI.last());
    if (!st || !st.connected) return { cls: 'off', text: 'Family cloud is not set up on this device. Open to set it up.' };
    if (st.busy) return { cls: 'busy', text: 'Syncing…' };
    if (st.error) return { cls: 'warn', text: st.error.code === 'offline' ? 'No internet connection. Changes are kept here and sent when it is back.' : 'Sync needs a look. Open Family cloud.' };
    return { cls: 'ok', text: st.lastSync ? `Everything is in sync (${u.ago(new Date(st.lastSync).toISOString())}). Click to sync now.` : 'Connected. Click to sync now.' };
  }
  function paintSync() {
    document.querySelectorAll('.tb-sync').forEach(b => {
      const l = syncLook();
      b.className = `btn icon tb-sync ${l.cls}`;
      b.title = t(l.text);
    });
  }
  function syncButton() {
    const l = syncLook();
    const b = h('button', { class: `btn icon tb-sync ${l.cls}`, title: t(l.text), 'aria-label': t('Sync'), onclick: async () => {
      const st = cloudState || (KH.cloudUI && KH.cloudUI.last && KH.cloudUI.last());
      if (!C() || !st || !st.connected) { app().go('#/cloud'); return; }
      b.classList.add('busy');
      try { await C().syncNow(); u.toast('Synced'); } catch (e) { u.toast(e.message, 'bad'); }
      try { cloudState = await C().status(); } catch (e) { /* keep the last */ }
      paintSync();
    } }, u.icon('sync'), h('span', { class: 'tb-dot' }));
    if (C() && !cloudState) C().status().then(st => { cloudState = st; paintSync(); }).catch(() => {});
    return b;
  }

  // the colour themes: parents' themes are colourings of the Premium look; children's colour their menu and home
  const PARENT_THEMES = [
    { key: '', label: 'Premium navy', sw: ['#0F1B33', '#C9A24E', '#E9E4D6'], style: 'premium' },
    { key: '', label: 'Modern & colourful', sw: ['#4F46E5', '#7C3AED', '#ECEBFF'], style: 'modern' },
    { key: '', label: 'Clean & calm', sw: ['#2C3E50', '#7FB3A8', '#F4F6F5'], style: 'calm' },
    { key: 'desert', label: 'Desert sand', sw: ['#4A3322', '#E0B872', '#F6EBDD'], style: 'premium', fresh: true },
    { key: 'emerald', label: 'Emerald', sw: ['#0E3B2E', '#3FBF8A', '#E5F4EC'], style: 'premium', fresh: true },
    { key: 'rose', label: 'Midnight rose', sw: ['#2A1730', '#E58FB0', '#F5E6EE'], style: 'premium', fresh: true },
    { key: 'ocean', label: 'Ocean', sw: ['#0B2E4A', '#3FB0E8', '#E3F2FA'], style: 'premium', fresh: true },
  ];
  const KID_THEMES = [
    { key: '', label: 'My colour', sw: null },
    { key: 'galaxy', label: 'Galaxy', sw: 'linear-gradient(160deg,#5B3CC4,#8E5CF7 55%,#C77DFF)' },
    { key: 'sea', label: 'Ocean', sw: 'linear-gradient(160deg,#005F8F,#0096C7 60%,#48CAE4)' },
    { key: 'jungle', label: 'Jungle', sw: 'linear-gradient(160deg,#17692F,#2E9E4F 60%,#7BC96F)' },
    { key: 'candy', label: 'Candy', sw: 'linear-gradient(160deg,#C2305F,#E8508A 60%,#FF8FB8)' },
    { key: 'sunset', label: 'Sunset', sw: 'linear-gradient(160deg,#C2410C,#E8590C 55%,#F59F00)' },
    { key: 'pitch', label: 'Football pitch', sw: 'repeating-linear-gradient(180deg,#22823F 0 36px,#2A9149 36px 72px)' },
  ];
  const paletteOf = () => { const p = (store().user && store().user.palette) || ''; return (isParent() ? PARENT_THEMES : KID_THEMES).some(x => x.key === p) ? p : ''; };
  function applyPalette() {
    const root = document.documentElement;
    const p = store().user ? paletteOf() : '';
    if (p) root.dataset.palette = p; else delete root.dataset.palette;
    const kid = store().user && !isParent() ? store().child(store().user.childId) : null;
    if (kid) root.style.setProperty('--kidc', KH.kidColor(kid)); else root.style.removeProperty('--kidc');
  }
  function savePalette(p) {
    const me = (store().data.users || []).find(x => x.id === store().user.id);
    if (me) store().user = store().upsert('users', Object.assign({}, me, { palette: p }));
    else store().user = Object.assign({}, store().user, { palette: p });
  }

  let popEl = null;
  function closePop() { if (popEl) { popEl.remove(); popEl = null; } document.removeEventListener('mousedown', outside, true); }
  function outside(e) { if (popEl && !popEl.contains(e.target) && !e.target.closest('.tb-pop-btn')) closePop(); }
  function openPop(btn, body, cls) {
    const same = popEl && popEl.dataset.for === cls;
    closePop();
    if (same) return;
    popEl = h('div', { class: `tb-pop ${cls}`, role: 'dialog' }, body);
    popEl.dataset.for = cls;
    const bar = btn.closest('.topbar') || document.body;
    bar.appendChild(popEl);
    if (KH.i18n) KH.i18n.apply(popEl);
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
  }

  function themeButton() {
    const b = h('button', { class: 'btn icon tb-pop-btn pc-only', title: t('Themes'), 'aria-label': t('Themes'), onclick: () => openPop(b, themeBody(), 'pop-theme') }, u.icon('palette'));
    return b;
  }
  function themeBody() {
    const parent = isParent();
    const cur = paletteOf(), curStyle = app().styleOf ? app().styleOf() : 'premium';
    const list = parent ? PARENT_THEMES : KID_THEMES;
    const kid = !parent ? store().child(store().user.childId) : null;
    return h('div', null, h('div', { class: 'pop-h' }, parent ? 'Themes' : 'Pick your theme'),
      h('div', { class: 'theme-grid' }, list.map(th => {
        const on = parent ? (th.key ? cur === th.key : !cur && curStyle === th.style) : cur === th.key;
        const sw = parent ? h('div', { class: 'sw' }, th.sw.map(c => h('span', { style: { background: c } })))
          : h('div', { class: 'sw', style: { background: th.sw || (kid ? KH.kidColor(kid) : 'var(--accent)') } });
        return h('button', { type: 'button', class: `theme-pick ${on ? 'on' : ''}`, onclick: () => {
          savePalette(th.key);
          if (parent && app().setStyle) app().setStyle(th.style); else app().refresh();
          applyPalette(); closePop();
        } }, sw, h('span', null, th.label), th.fresh || (!parent && th.key) ? h('em', null, 'new') : null);
      })),
      h('div', { class: 'small muted', style: { marginTop: '10px' } }, 'Light and dark, Arabic and English all stay. Each person chooses their own.'));
  }

  function messagesButton() {
    const n = (KH.msg && KH.msg.unread) || 0;
    if (!KH.access.allows('#/messages')) return null;
    return h('span', { class: 'tb-comm pc-only' },
      h('a', { class: 'btn icon', href: '#/messages', title: t('Messages'), 'aria-label': t('Messages') }, u.icon('chat'), n ? h('span', { class: 'tb-n', 'data-noi18n': '1' }, String(n)) : null));
  }

  // notification centre: what needs a look, new messages and school news, for this person only
  const seenKey = () => `kh.seen.${store().user.id}`;
  const seen = () => { try { return new Set(JSON.parse(localStorage.getItem(seenKey()) || '[]')); } catch (e) { return new Set(); } };
  function notes() {
    const parent = isParent();
    const opts = parent ? {} : { childId: store().user.childId, parent: false };
    const list = [];
    const msgs = (KH.msg && KH.msg.unread) || 0;
    if (msgs && KH.access.allows('#/messages')) list.push({ key: `msg:${msgs}`, cat: 'Messages', title: msgs === 1 ? '1 new message' : `${msgs} new messages`, href: '#/messages', sev: 'high' });
    const ann = KH.annUnread ? KH.annUnread() : 0;
    if (ann && KH.access.allows('#/school')) list.push({ key: `ann:${ann}`, cat: 'School', title: ann === 1 ? '1 new announcement from school' : `${ann} new announcements from school`, href: '#/school/announcements', sev: 'medium' });
    const al = KH.analysis.alerts(store().data, u.today(), Object.assign({}, opts, { hideAmounts: KH.lock && KH.lock.hidden(), noMoney: KH.access.noMoney() }));
    const rank = { high: 0, medium: 1, low: 2 };
    al.sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
    for (const a of al) list.push({ key: a.key || a.title, cat: CAT[a.kind] || 'Coming up', title: a.title, body: a.body, href: hrefFor(a), sev: a.severity });
    return list;
  }
  const CAT = { analysis: 'School', payment: 'Money', birthday: 'Family', health: 'Health', lunch: 'Health', homework: 'School', upcoming: 'Coming up', goal: 'Goals', kid: 'From the children' };
  function hrefFor(a) {
    const me = isParent() ? null : store().user.childId;
    if (a.kind === 'payment') return '#/c/payments';
    if (a.kind === 'homework') return '#/school/homework';
    if (a.kind === 'upcoming') return '#/calendar';
    if (a.kind === 'goal') return '#/goals';
    if (a.kind === 'health') return '#/sick';
    if (a.kind === 'lunch') return '#/lunch';
    return me ? `#/child/${me}` : '#/home';
  }
  // the notification history (every popup shown on this device, with its date and time), newest first
  const NS = () => KH.notes;
  function logged() {
    if (!NS()) return [];
    return NS().recent(14).map(n => ({ key: n.id, id: n.id, cat: NS().catOf(n), title: n.title, body: n.body, href: `#/notifications/${n.id}`, sev: n.sev || 'low', at: n.at, kind: n.kind }));
  }
  // what the bell lists: what needs a look (with the time it was first noticed), then the history
  function allNotes() {
    const live = notes().map(n => Object.assign(n, { at: NS() ? NS().firstSeen(n.key) : null }));
    return live.concat(logged());
  }
  const unseenCount = () => {
    const s = seen();
    const live = notes().filter(n => (n.sev === 'high' || n.sev === 'medium') && !s.has(n.key)).length;
    const log = logged().filter(n => n.kind !== 'chat' && Date.now() - Date.parse(n.at) < 3 * 86400000 && !s.has(n.key)).length; // chats count under Messages
    return live + log;
  };
  function repaintBell() {
    document.querySelectorAll('.tb-bell').forEach(old => { if (popEl) return; const b = bellButton(); if (KH.i18n) KH.i18n.apply(b); old.replaceWith(b); });
  }
  if (NS() && window.hub && window.hub.notifyLog) setTimeout(() => NS().load().then(() => { if (store().user) repaintBell(); }), 1500);
  let filter = 'All';
  function bellButton() {
    const n = unseenCount();
    const b = h('button', { class: 'btn icon tb-pop-btn tb-bell', title: t('Notifications'), 'aria-label': t('Notifications'), onclick: () => { filter = 'All'; openPop(b, bellBody(), 'pop-bell'); } },
      u.icon('bell'), n ? h('span', { class: 'tb-n', 'data-noi18n': '1' }, String(n)) : null);
    return b;
  }
  function bellBody() {
    const list = allNotes(), s = seen();
    const cats = ['All'].concat(Array.from(new Set(list.map(n => n.cat))));
    const body = h('div');
    const paint = () => {
      body.innerHTML = '';
      body.appendChild(h('div', { class: 'pop-h' }, h('span', null, 'Notifications'),
        list.length ? h('button', { type: 'button', class: 'linkish', onclick: () => {
          const all = seen(); list.forEach(n => all.add(n.key));
          try { localStorage.setItem(seenKey(), JSON.stringify(Array.from(all).slice(-400))); } catch (e) { /* ignore */ }
          closePop(); app().refresh();
        } }, 'Mark all read') : null));
      if (cats.length > 2) body.appendChild(h('div', { class: 'n-tabs' }, cats.map(c => h('button', { type: 'button', class: filter === c ? 'on' : '', onclick: () => { filter = c; paint(); if (KH.i18n) KH.i18n.apply(body); } }, c))));
      const shown = list.filter(n => filter === 'All' || n.cat === filter);
      body.appendChild(shown.length ? h('div', { class: 'n-list' }, shown.slice(0, 30).map(n => h('a', { class: `n-row ${s.has(n.key) ? '' : 'unread'}`, href: n.href, onclick: () => closePop() },
        h('span', { class: `n-sev ${n.sev || 'low'}` }), h('div', null, h('div', { class: 'n-t ux' }, n.title), h('div', { class: 'n-c small muted' }, h('span', null, n.cat), n.body ? h('span', { class: 'ux' }, ' · ' + n.body) : null),
          n.at && NS() ? h('div', { class: 'n-time small muted', 'data-noi18n': '1' }, NS().fmtShort(n.at)) : null))))
        : h('div', { class: 'empty' }, 'Nothing new.'));
      body.appendChild(h('a', { class: 'n-all', href: '#/notifications', onclick: () => closePop() }, 'See all notifications'));
    };
    paint();
    return body;
  }

  function tools() {
    if (!store().user) return [];
    return [syncButton(), themeButton(), messagesButton(), bellButton()];
  }

  // ---------------- date and time on the home screen ----------------
  function fmtDay(d) {
    const ar = document.documentElement.lang === 'ar';
    try { return d.toLocaleDateString(ar ? 'ar-SA-u-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (e) { return d.toDateString(); }
  }
  function clockParts(d) {
    const ar = document.documentElement.lang === 'ar';
    const loc = ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
    let hijri = '';
    try { hijri = d.toLocaleDateString(ar ? 'ar-SA-u-ca-islamic-umalqura-nu-latn' : 'en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { /* no Hijri calendar */ }
    const hr = d.getHours();
    return {
      time: d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', hour12: true }),
      date: d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      hijri, greet: hr < 5 ? 'Good evening' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening',
    };
  }
  function hero(name, extra) {
    const p = clockParts(new Date());
    const time = h('div', { class: 'hero-time', 'data-noi18n': '1' }, p.time);
    const date = h('div', { class: 'hero-date', 'data-noi18n': '1' }, p.date);
    const hij = h('div', { class: 'hero-hijri', 'data-noi18n': '1' }, p.hijri);
    const el = h('div', { class: `hero-clock ${isParent() ? '' : 'kid'}` },
      h('div', null, h('div', { class: 'hero-greet' }, h('span', null, p.greet), h('span', { 'data-noi18n': '1' }, name ? `${document.documentElement.lang === 'ar' ? '،' : ','} ${name}` : '')), time, date, p.hijri ? hij : null),
      extra ? h('div', { class: 'hero-extra' }, extra) : null);
    const tick = setInterval(() => {
      if (!document.body.contains(el)) { clearInterval(tick); return; }
      const q = clockParts(new Date());
      if (time.textContent !== q.time) time.textContent = q.time;
      if (date.textContent !== q.date) { date.textContent = q.date; hij.textContent = q.hijri; }
    }, 1000);
    return el;
  }

  KH.shell = { nav, tools, hero, applyPalette, closePop, fmtDay, repaint, state, liveNotes: notes, repaintBell };
})();
