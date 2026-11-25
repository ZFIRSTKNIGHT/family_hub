// The notification centre (version 4.2): every notification this device showed, each with its date
// and time, the details of one notification (a click on a popup opens it here), what needs a look
// now, and each person's choice of sounds (a separate tone for chat messages, including the
// messenger-style "uh-oh" and "ding-ding") and of the picture shown on notifications (6 choices).
(function () {
  'use strict';
  const KH = window.KH;
  const u = KH.u, h = u.h;
  const t = s => (KH.i18n ? KH.i18n.t(s) : s);
  const hub = window.hub || {};
  const store = () => KH.store;
  const app = () => KH.app;
  let bootHash = location.hash; // a phone opened by a notification starts on it

  const N = KH.notes = { log: [], loaded: false };
  N.asset = rel => (KH.phoneApp ? 'assets/' : 'assets/') + rel;

  // ---------------- date and time ----------------
  const loc = () => (KH.i18n && KH.i18n.lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB');
  // "Wednesday 25 November 2026 at 3:15 pm"
  N.fmtFull = iso => {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return '';
    const day = d.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const time = d.toLocaleTimeString(loc(), { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${day}${KH.i18n && KH.i18n.lang === 'ar' ? '، ' : ', '}${time}`;
  };
  // "Wed 25 Nov 2026, 3:15 pm" (always with the date and the time)
  N.fmtShort = iso => {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return '';
    return d.toLocaleString(loc(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const dayKey = iso => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  function dayLabel(iso) {
    const d = new Date(iso), now = new Date();
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (dayKey(iso) === dayKey(now.toISOString())) return t('Today');
    if (dayKey(iso) === dayKey(y.toISOString())) return t('Yesterday');
    return d.toLocaleDateString(loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  // "Things to look at" are worked out live, so each gets the time this person first saw it.
  const firstKey = () => `kh.firstSeen.${(store().user || {}).id || ''}`;
  N.firstSeen = key => {
    let map = {};
    try { map = JSON.parse(localStorage.getItem(firstKey()) || '{}') || {}; } catch (e) { map = {}; }
    if (!map[key]) {
      map[key] = new Date().toISOString();
      const keys = Object.keys(map);
      if (keys.length > 500) keys.sort((a, b) => String(map[a]).localeCompare(String(map[b]))).slice(0, keys.length - 500).forEach(k => delete map[k]);
      try { localStorage.setItem(firstKey(), JSON.stringify(map)); } catch (e) { /* ignore */ }
    }
    return map[key];
  };

  // ---------------- the history ----------------
  const CATS = { chat: 'Messages', reminder: 'Coming up', school: 'School', security: 'Security', test: 'Family Hub', note: 'Family' };
  N.catOf = n => CATS[n.kind] || 'Family';
  N.load = async () => {
    try { N.log = (hub.notifyLog ? await hub.notifyLog() : []) || []; } catch (e) { N.log = []; }
    N.loaded = true;
    return N.log;
  };
  N.find = id => N.log.find(x => x.id === id) || null;
  N.recent = days => N.log.filter(x => Date.now() - Date.parse(x.at) < days * 86400000);

  // the route a notification click asked for (a PC window opened by a click, or a phone opened by one)
  N.takePending = async () => {
    if (/^#\/notifications/.test(bootHash)) { const b = bootHash; bootHash = ''; return b; }
    bootHash = '';
    try { return hub.notifyPending ? await hub.notifyPending() : null; } catch (e) { return null; }
  };

  // a new notification: the bell's number and, if it is open, this page
  if (hub.onNotifyLogged) hub.onNotifyLogged(() => N.load().then(() => {
    if (!store() || !store().user) return;
    if (/^#\/notifications/.test(location.hash) && !document.querySelector('.modal-back')) app().refresh();
    else if (KH.shell && KH.shell.repaintBell) KH.shell.repaintBell();
  }));

  // ---------------- sounds and the notification picture ----------------
  N.SOUNDS = [['chime', 'Chime'], ['bell', 'Bell'], ['twotone', 'Two tones'], ['harp', 'Harp'], ['pop', 'Soft pop'],
    ['uhoh', 'Uh-oh (ICQ style)'], ['ding', 'Ding-ding (MSN Messenger style)'], ['knock', 'Knock knock'], ['windows', "Windows' own sound"], ['none', 'No sound']];
  N.ICONS = [['logo', 'Family logo'], ['bell', 'Bell'], ['chat', 'Chat bubble'], ['star', 'Star'], ['heart', 'Heart'], ['house', 'House']];
  N.iconSrc = k => (k && k !== 'logo' && N.ICONS.some(x => x[0] === k) ? N.asset(`notify/${k}.png`) : N.asset('notify/logo.png'));
  N.play = (name, volume) => {
    name = String(name || '').replace(/[^a-z]/g, '');
    if (!name || name === 'none' || name === 'windows' || name === 'same' || name === 'phone') return;
    try { const a = new Audio(N.asset(`sounds/${name}.wav`)); a.volume = Math.max(0, Math.min(1, Number(volume) || 0.8)); a.play().catch(() => {}); } catch (e) { /* no sound */ }
  };
  N.prefs = null;
  N.getPrefs = async () => { try { N.prefs = hub.soundGet ? await hub.soundGet() : null; } catch (e) { N.prefs = null; } return N.prefs; };

  // On a phone the chosen chat tone plays for a new message while the app is open
  // (with the app closed, the phone plays its own notification sound: iPhones do not let web apps choose it).
  if (hub.onMessage) hub.onMessage(m => {
    if (!KH.phoneApp || !store() || !store().user || !m || m.from === store().user.id || m.deleted) return;
    if (document.visibilityState !== 'visible') return;
    (N.prefs ? Promise.resolve(N.prefs) : N.getPrefs()).then(p => { if (p && p.chat && p.chat !== 'same') N.play(p.chat, p.volume); }).catch(() => {});
  });

  // the choices: used in Settings and on the notification centre page (so every person can choose)
  N.prefsCard = function prefsCard(opts) {
    opts = opts || {};
    const box = h('div', { class: 'n-prefs' });
    if (!hub.soundGet) return box;
    N.getPrefs().then(cur => {
      if (!cur) return;
      const phone = !!cur.phone;
      const save = async b => { try { cur = await hub.soundSet(Object.assign({}, cur, b)); N.prefs = cur; } catch (e) { u.toast(e.message, 'bad'); } };
      const list = phone ? N.SOUNDS.filter(([v]) => v !== 'windows') : N.SOUNDS;
      const sel = h('select', { onchange: async e => { await save({ sound: e.target.value }); N.play(cur.sound, cur.volume); } }, list.map(([v, l]) => h('option', { value: v, selected: cur.sound === v }, l)));
      const chatSel = h('select', { class: 'n-chat-tone', onchange: async e => { await save({ chat: e.target.value }); N.play(cur.chat === 'same' ? cur.sound : cur.chat, cur.volume); } },
        [['same', phone ? "The phone's own sound" : 'Same as above']].concat(list).map(([v, l]) => h('option', { value: v, selected: (cur.chat || 'same') === v }, l)));
      const vol = h('input', { type: 'range', min: '0', max: '100', value: String(Math.round(cur.volume * 100)), style: { width: '140px' }, onchange: async e => { await save({ volume: Number(e.target.value) / 100 }); N.play(cur.chat !== 'same' ? cur.chat : cur.sound, cur.volume); } });
      const icons = h('div', { class: 'n-icons' });
      const drawIcons = () => {
        icons.innerHTML = '';
        N.ICONS.forEach(([k, l]) => icons.appendChild(h('button', { type: 'button', class: `n-icon-pick ${(cur.icon || 'logo') === k ? 'on' : ''}`, title: t(l), 'aria-label': t(l), onclick: async () => { await save({ icon: k }); drawIcons(); } },
          h('img', { src: N.iconSrc(k), alt: '' }), h('span', null, t(l)))));
      };
      drawIcons();
      const rows = [];
      if (!phone) {
        rows.push(h('div', { class: 'n-pref-row' }, h('span', { class: 'n-pref-l' }, 'Reminders and news'), sel, h('button', { class: 'btn small', type: 'button', onclick: () => N.play(cur.sound, cur.volume) }, 'Play')));
      }
      rows.push(h('div', { class: 'n-pref-row' }, h('span', { class: 'n-pref-l' }, 'Chat messages'), chatSel,
        h('button', { class: 'btn small', type: 'button', onclick: () => N.play(cur.chat === 'same' ? cur.sound : cur.chat, cur.volume) }, 'Play')));
      rows.push(h('div', { class: 'n-pref-row' }, h('span', { class: 'n-pref-l' }, 'Volume'), vol));
      if (!phone && opts.quiet !== false) {
        const from = h('input', { type: 'time', value: cur.from, onchange: e => save({ from: e.target.value }) });
        const to = h('input', { type: 'time', value: cur.to, onchange: e => save({ to: e.target.value }) });
        const quiet = h('input', { type: 'checkbox', checked: cur.quiet, onchange: e => save({ quiet: e.target.checked }) });
        rows.push(h('label', { class: 'row small', style: { marginTop: '4px', gap: '8px', flexWrap: 'wrap' } }, quiet, h('span', null, 'Quiet hours: no sound from'), from, h('span', null, 'to'), to));
      }
      box.appendChild(KH.i18n.apply(h('div', null,
        opts.title === false ? null : h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, phone ? 'Sounds and picture on this phone' : 'Notification sound on this PC'),
        ...rows,
        h('div', { class: 'small muted', style: { margin: '4px 0 12px' } }, phone
          ? 'The chat tone plays while the app is open. With the app closed, the phone uses its own notification sound (iPhones do not let web apps choose it).'
          : 'During quiet hours notifications still appear, without sound. Phones use their own notification sound.'),
        h('h3', { style: { margin: '6px 0 6px', fontSize: '14px' } }, 'Picture on notifications'),
        icons)));
    }).catch(() => {});
    return box;
  };

  // ---------------- the page: #/notifications and #/notifications/<id> ----------------
  const seenKey = () => `kh.seen.${store().user.id}`;
  N.seen = () => { try { return new Set(JSON.parse(localStorage.getItem(seenKey()) || '[]')); } catch (e) { return new Set(); } };
  N.markSeen = keys => {
    const all = N.seen(); keys.forEach(k => all.add(k));
    try { localStorage.setItem(seenKey(), JSON.stringify(Array.from(all).slice(-600))); } catch (e) { /* ignore */ }
  };
  const PAGE_NAMES = [[/^#\/messages/, 'Open the chat'], [/^#\/school/, 'Open School'], [/^#\/c\/payments/, 'Open Payments'], [/^#\/calendar/, 'Open the calendar'],
    [/^#\/goals/, 'Open Goals'], [/^#\/sick/, 'Open Sick records'], [/^#\/lunch/, 'Open Lunch box'], [/^#\/(settings\/cloud|cloud)/, 'Open Family cloud'], [/^#\/child\//, 'Open the page'], [/^#\/home/, 'Open Home']];
  const openLabel = nav => (PAGE_NAMES.find(([re]) => re.test(nav)) || [null, 'Open the page'])[1];
  let filter = 'All';

  KH.pages = KH.pages || {};
  KH.pages.notifications = function (route) {
    const sel = decodeURIComponent((route.match(/^#\/notifications\/(.+)$/) || [])[1] || '');
    const wrap = h('div', { class: 'n-page' });
    const draw = () => {
      const live = (KH.shell && KH.shell.liveNotes ? KH.shell.liveNotes() : []).map(n => Object.assign({}, n, { id: `live:${n.key}`, at: N.firstSeen(n.key), live: true }));
      const log = N.log.map(n => Object.assign({}, n, { cat: N.catOf(n) }));
      const s = N.seen();
      const cats = ['All'].concat(Array.from(new Set(live.map(n => n.cat).concat(log.map(n => n.cat)))));
      if (!cats.includes(filter)) filter = 'All';
      const pick = sel ? (log.find(n => n.id === sel) || live.find(n => n.id === sel)) : null;
      if (pick) N.markSeen([pick.live ? pick.key : pick.id]);
      const row = n => h('a', { class: `n-row ${s.has(n.live ? n.key : n.id) || (pick && pick.id === n.id) ? '' : 'unread'} ${pick && pick.id === n.id ? 'sel' : ''}`, href: `#/notifications/${encodeURIComponent(n.id)}` },
        h('span', { class: `n-sev ${n.sev || 'low'}` }),
        h('div', { style: { minWidth: 0, flex: 1 } },
          h('div', { class: 'n-t ux' }, n.title),
          n.body ? h('div', { class: 'n-b small muted ux' }, n.body) : null,
          h('div', { class: 'n-c small muted' }, h('span', null, n.cat), h('span', { 'data-noi18n': '1' }, ` · ${N.fmtShort(n.at)}`))));
      wrap.innerHTML = '';
      // details of the chosen notification
      if (sel && !pick) wrap.appendChild(h('div', { class: 'note small' }, N.loaded ? 'That notification is no longer in the history.' : 'Loading…'));
      if (pick) {
        wrap.appendChild(h('div', { class: 'card n-detail' },
          h('div', { class: 'row', style: { gap: '14px', flexWrap: 'nowrap', alignItems: 'flex-start' } },
            h('img', { class: 'n-detail-ic', src: N.iconSrc((N.prefs || {}).icon), alt: '' }),
            h('div', { style: { minWidth: 0, flex: 1 } },
              h('div', { class: 'small muted' }, pick.cat),
              h('h2', { class: 'ux', style: { margin: '2px 0 6px' } }, pick.title),
              pick.body ? h('p', { class: 'ux', style: { margin: '0 0 10px', whiteSpace: 'pre-wrap' } }, pick.body) : null,
              h('div', { class: 'n-when' }, u.icon('calendar'), h('span', null, pick.live ? 'First noticed' : 'Received'), h('b', { 'data-noi18n': '1' }, N.fmtFull(pick.at)),
                h('span', { class: 'small muted', 'data-noi18n': '1' }, `(${t(u.ago(pick.at))})`)))),
          h('div', { class: 'row', style: { marginTop: '12px', gap: '8px' } },
            (pick.nav || pick.href) ? h('a', { class: 'btn primary', href: pick.nav || pick.href }, openLabel(pick.nav || pick.href)) : null,
            h('a', { class: 'btn', href: '#/notifications' }, 'All notifications'),
            pick.live ? null : h('button', { class: 'btn danger', type: 'button', onclick: async () => { await hub.notifyClear([pick.id]); await N.load(); app().go('#/notifications'); } }, 'Delete'))));
      }
      // filters and actions
      wrap.appendChild(h('div', { class: 'row n-bar' },
        cats.length > 2 ? h('div', { class: 'n-tabs' }, cats.map(c => h('button', { type: 'button', class: filter === c ? 'on' : '', onclick: () => { filter = c; draw(); KH.i18n.apply(wrap); } }, c))) : null,
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn small', type: 'button', onclick: () => { N.markSeen(live.map(n => n.key).concat(log.map(n => n.id))); app().refresh(); } }, 'Mark all read'),
        log.length && hub.notifyClear ? h('button', { class: 'btn small', type: 'button', onclick: async () => {
          if (!(await u.confirm('Clear the notification history on this device? Reminders that still need a look stay.', 'Clear'))) return;
          await hub.notifyClear(null); await N.load(); app().go('#/notifications');
        } }, 'Clear history') : null));
      const showLive = live.filter(n => filter === 'All' || n.cat === filter);
      const showLog = log.filter(n => filter === 'All' || n.cat === filter);
      if (showLive.length) wrap.appendChild(u.section('Needs a look now', h('div', { class: 'n-list' }, showLive.slice(0, 40).map(row))));
      const groups = [];
      for (const n of showLog) { const k = dayKey(n.at); const g = groups[groups.length - 1]; if (g && g.k === k) g.items.push(n); else groups.push({ k, at: n.at, items: [n] }); }
      wrap.appendChild(u.section('History',
        groups.length ? groups.map(g => h('div', { class: 'n-day' }, h('div', { class: 'n-day-h', 'data-noi18n': '1' }, dayLabel(g.at)), h('div', { class: 'n-list' }, g.items.map(row))))
          : h('div', { class: 'empty' }, N.loaded ? 'No notifications yet. Each one shown on this device is kept here for 90 days, with its date and time.' : 'Loading…')));
      const prefs = h('details', { class: 'card n-prefs-card' }, h('summary', null, h('b', null, 'Sounds and picture')), N.prefsCard({ title: false }));
      if (hub.soundGet) wrap.appendChild(prefs);
      KH.i18n.apply(wrap);
    };
    draw();
    if (!N.loaded || sel) N.load().then(() => { if (document.body.contains(wrap)) { draw(); if (KH.shell && KH.shell.repaintBell) KH.shell.repaintBell(); } });
    if (!N.prefs) N.getPrefs().then(() => { if (document.body.contains(wrap) && sel) draw(); });
    return wrap;
  };
})();
