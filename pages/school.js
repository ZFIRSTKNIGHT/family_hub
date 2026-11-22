// School (SABIS): the "Update from SABIS" button and progress, what the last update
// brought in, announcements, homework, class timetables, study files and the
// contact details SABIS holds. Everything here is read from SABIS; nothing is sent back.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const hub = window.hub;
  const tr = n => { if (KH.i18n) KH.i18n.apply(n); return n; };

  // ---------------- update state (shared by the button and the panels) ----------------
  const S = KH.sabis = { running: false, text: '', pct: 0, kid: null, kidsDone: [], summary: null };
  const live = { buttons: new Set(), panels: new Set() };

  function sabisLogin() { return (KH.store.data.credentials || []).find(c => c.kind === 'sabis-parent' && c.username); }
  KH.sabisLogin = sabisLogin;

  function onProgress(p) {
    if (!p) return;
    if (p.running && !S.running) { S.kidsDone = []; S.summary = null; }
    S.running = !!p.running;
    S.text = p.text || S.text;
    S.pct = Math.max(p.running ? S.pct : 0, Number(p.pct) || 0);
    if (p.kid && p.kid !== S.kid) {
      if (S.kid && S.kid !== 'done' && !S.kidsDone.includes(S.kid)) S.kidsDone.push(S.kid);
      S.kid = p.kid;
    }
    if (!p.running) {
      S.pct = 100;
      S.finishedAt = Date.now();
      S.summary = p.summary || null;
      S.kid = null;
      setTimeout(() => { if (!S.running && KH.store.user) KH.app.refresh(); }, 50);
    }
    paint();
  }
  hub.onSabis(onProgress);

  function paint() {
    for (const b of Array.from(live.buttons)) { if (!b.isConnected) { live.buttons.delete(b); continue; } drawButton(b); }
    for (const p of Array.from(live.panels)) { if (!p.isConnected) { live.panels.delete(p); continue; } drawPanel(p); }
  }

  async function start() {
    if (S.running) return;
    if (!sabisLogin()) {
      u.modal({ title: 'Add your SABIS login first', body: h('p', null, 'The update signs in to SABIS with your parent username and password. Save them once in Credentials (protected by your PIN), then press Update again.'),
        actions: [{ label: 'Not now' }, { label: 'Open Credentials', primary: true, onClick: () => { KH.app.go('#/credentials'); } }] });
      return;
    }
    S.running = true; S.text = 'Starting…'; S.pct = 1; S.kid = null; S.kidsDone = []; S.summary = null;
    paint();
    try {
      const summary = await hub.sabisRun();
      if (summary && summary.fatal) u.toast(summary.fatal, 'bad');
      else if (summary) {
        const n = (summary.news || []).length;
        u.toast(n ? `SABIS update finished: ${n} new update${n === 1 ? '' : 's'}` : 'SABIS update finished: nothing new', 'good');
      }
    } catch (e) {
      S.running = false; S.text = e.message; S.pct = 0;
      u.toast(e.message, 'bad');
      paint();
    }
  }
  KH.sabisStart = start;

  function drawButton(b) {
    b.innerHTML = '';
    b.disabled = S.running;
    b.appendChild(u.icon('sync', S.running ? 'spin' : ''));
    b.appendChild(h('span', null, S.running ? `Updating… ${Math.round(S.pct)}%` : 'Update from SABIS'));
    tr(b);
  }
  KH.sabisButton = function () {
    const b = h('button', { class: 'btn primary', onclick: start, title: 'Bring in marks, exams, reports, announcements, homework and files from SABIS' });
    live.buttons.add(b);
    drawButton(b);
    return b;
  };

  function kidChips() {
    const kids = KH.store.children();
    const map = ((KH.store.settings().sabis || {}).children) || {};
    return h('div', { class: 'row', style: { gap: '8px' } }, kids.filter(c => !Object.keys(map).length || map[c.id]).map(c => {
      const done = S.kidsDone.includes(c.id) || S.kid === 'done' || (!S.running && S.summary && !S.summary.fatal);
      const now = S.kid === c.id && S.running;
      return h('span', { class: `chip ${done ? 'good' : now ? 'accent' : ''}` }, done ? '✓' : now ? h('span', { class: 'pulse' }, '●') : '○', ` ${c.name}`);
    }));
  }

  function drawPanel(p) {
    p.innerHTML = '';
    const show = S.running || (S.summary && (p.dataset.sticky || Date.now() - (S.finishedAt || 0) < 90000));
    p.style.display = show ? '' : 'none';
    if (!show) return;
    const pct = Math.round(S.pct);
    p.append(
      h('div', { class: 'row', style: { fontWeight: 700 } }, h('span', { class: S.running ? 'pulse' : '' }, S.running ? S.text : (S.summary && S.summary.fatal ? 'The update did not finish' : 'Update finished')), h('span', { class: 'muted', style: { marginInlineStart: 'auto' } }, `${pct}%`)),
      h('div', { class: 'progress' }, h('div', { style: { width: `${pct}%` } })),
      kidChips());
    if (!S.running && S.summary) {
      const sm = S.summary;
      if (sm.fatal) p.appendChild(h('div', { class: 'errbox' }, sm.fatal));
      else p.appendChild(h('div', { class: 'small muted' }, countsLine(sm.counts) || 'Nothing new since the last update.'));
      if ((sm.unmatched || []).length) p.appendChild(h('div', { class: 'warnbox small' }, `SABIS also lists ${sm.unmatched.join(', ')}, who is not in Child profiles, so they were skipped.`));
      // new marks: the overall over the term, with this update highlighted
      if (!sm.fatal && sm.counts && sm.counts.marks) {
        const A = KH.analysis;
        const ids = Array.from(new Set((sm.news || []).filter(n => n.kind === 'marks' && n.childId).map(n => n.childId)))
          .filter(id => isParent() || id === me());
        for (const id of ids) {
          const ls = A.latestSummary(KH.store.data, id);
          if (!ls) continue;
          const tl = A.overallTimeline(KH.store.data, id, ls.year, ls.term);
          const chart = KH.charts.overTime(tl, { compact: true, highlightLast: true, ref: KH.store.settings().lowMark, refLabel: 'Low mark' });
          if (!chart) continue;
          const mv = A.movers(KH.store.data, id, ls.year, ls.term);
          const head = mv && mv.basis === 'update' ? `${kidName(id)}: overall ${mv.overallBefore} → ${mv.overallAfter}` : `${kidName(id)}: overall ${tl.now}`;
          p.appendChild(h('div', { class: 'upd-chart' }, h('div', { style: { fontWeight: 700, marginTop: '10px' } }, head), u.svg(chart),
            h('div', { class: 'chart-key' }, h('span', null, h('i', { class: 'dot' }), 'overall by week'), h('span', null, h('i', { class: 'dia' }), 'SABIS update (gold = this one)'))));
        }
      }
    }
    tr(p);
  }
  KH.sabisPanel = function (opts) {
    const p = h('div', { class: 'card sync-box', 'data-sticky': opts && opts.sticky ? '1' : null });
    live.panels.add(p);
    drawPanel(p);
    return p;
  };

  function countsLine(c) {
    if (!c) return '';
    const parts = [];
    const add = (n, one, many) => { if (n) parts.push(`${n} ${n === 1 ? one : many}`); };
    add(c.marks, 'new mark', 'new marks'); add(c.exams, 'exam with question details', 'exams with question details'); add(c.reports, 'term report', 'term reports');
    add(c.homework, 'homework', 'homework'); add(c.docs, 'file', 'files'); add(c.announcements, 'announcement', 'announcements'); add(c.events, 'calendar date', 'calendar dates');
    return parts.join(' · ');
  }

  // ---------------- helpers ----------------
  const isParent = () => KH.app.isParent();
  const me = () => KH.store.user.childId;
  const kidName = id => KH.store.childName(id);
  const forMe = a => a.general || (a.forKids || []).includes(me());
  // read / unread is kept per login, so a child opening a message does not mark it read for a parent
  const isRead = a => !!(a.readBy && a.readBy[KH.store.user.id]);
  const markRead = a => KH.store.upsert('announcements', Object.assign({}, a, { readBy: Object.assign({}, a.readBy || {}, { [KH.store.user.id]: u.today() }) }));
  KH.annUnread = () => (KH.store.data.announcements || []).filter(a => !isRead(a) && (isParent() || forMe(a))).length;
  const ago = u.when;
  KH.ago = u.when;
  const SUBJECT_ICON = s => (/math/i.test(s) ? '∑' : /science|physics|chem|bio/i.test(s) ? '⚗' : /english|arabic|french|language|reading/i.test(s) ? '✎' : /islam|quran/i.test(s) ? '☪' : /social|history|geo/i.test(s) ? '⌖' : /comput|ict/i.test(s) ? '⌨' : '•');

  function sabisPagePath(kidId, category) {
    const m = ((KH.store.settings().sabis || {}).children || {})[kidId];
    if (!m) return null;
    const q = `a=${encodeURIComponent(decodeURIComponent(m.acc))}&scid=${encodeURIComponent(decodeURIComponent(m.scid || ''))}`;
    if (/prep\s*list|grid/i.test(category || '')) return `/Pages/Grid/Grid?${q}`;
    if (/course/i.test(category || '')) return `/Pages/ExamPreparation/ExamPreparation?${q}#/56`;
    return `/Pages/ExamPreparation/ExamPreparation?${q}`;
  }
  function openOnSabis(path) {
    const c = sabisLogin();
    if (!c) { u.toast('Save your SABIS login in Credentials first', 'bad'); return; }
    hub.launchLogin(c.id, path || undefined).catch(e => u.toast(e.message, 'bad'));
  }
  KH.openOnSabis = openOnSabis;

  // ---------------- tabs ----------------
  function tabs(cur) {
    const t = (id, label, n) => h('a', { class: cur === id ? 'active' : '', href: id === 'updates' ? '#/school' : `#/school/${id}` }, label, n ? h('span', { class: 'chip bad', style: { marginInlineStart: '6px', padding: '0 7px' } }, String(n)) : null);
    const unread = KH.annUnread();
    return h('div', { class: 'tabs' },
      t('updates', isParent() ? 'Updates' : 'What\'s new'), t('announcements', 'Announcements', unread), t('homework', 'Homework'), t('timetable', 'Timetable'), t('files', 'Study files'),
      isParent() ? t('contact', 'My contact details') : null);
  }

  function updatesTab() {
    const sab = KH.store.settings().sabis || {};
    const last = sab.last;
    const wrap = h('div');
    if (isParent() && KH.phoneApp) {
      // the phone app shows what the family PC brought in; SABIS itself is only opened from the PC
      wrap.appendChild(h('div', { class: 'card' },
        h('h2', null, 'SABIS updates'),
        h('p', { class: 'muted', style: { marginTop: 0 } }, 'Marks, reports, announcements and homework come in on the family PC and reach this phone through OneDrive.'),
        h('div', { class: 'row' }, last ? u.chip(last.ok ? 'Up to date' : 'Last update did not finish', last.ok ? 'good' : 'bad') : u.chip('Not updated yet', 'medium'),
          h('span', { class: 'small muted' }, last ? `Last update: ${ago(last.at)}` : 'Open the app on the PC and press "Update from SABIS".'))));
    } else if (isParent()) {
      const login = sabisLogin();
      wrap.appendChild(h('div', { class: 'grid g2' },
        h('div', { class: 'card' },
          h('h2', null, 'Update from SABIS'),
          h('p', { class: 'muted', style: { marginTop: 0 } }, 'One click signs in with your saved parent login, goes through the children, and brings in marks, exam questions, absences and behaviour notes, term reports, the school calendar, announcements, homework, timetables and study files. It only reads SABIS and never changes anything there.'),
          h('div', { class: 'row' }, KH.sabisButton(),
            login ? h('button', { class: 'btn', onclick: () => openOnSabis() }, u.icon('out'), 'Open SABIS') : h('button', { class: 'btn', onclick: () => KH.app.go('#/credentials') }, u.icon('key'), 'Add SABIS login')),
          h('div', { class: 'small muted', style: { marginTop: '10px' } },
            last ? `Last update: ${ago(last.at)}${last.ok ? '' : ' (did not finish)'}` : 'Not updated yet.',
            sab.auto === false ? ' · Daily update is off' : ` · Updates by itself every day after ${sab.time || '15:00'} while the app is running`,
            h('a', { style: { marginInlineStart: '8px' }, href: '#/settings' }, 'Change'))),
        h('div', null, KH.sabisPanel({ sticky: true }),
          last && !last.ok && !S.running && !S.summary ? h('div', { class: 'errbox', style: { marginBottom: '18px' } }, last.fatal || (last.errors || [])[0] || 'The last update did not finish.') : null)));
    }
    const news = sab.recent || ((last && last.news) || []).map(n => Object.assign({ at: last.at }, n));
    const mine = (isParent() ? news : news.filter(n => !n.childId || n.childId === me())).slice(0, 30);
    const byRun = new Map();
    for (const n of mine) { if (!byRun.has(n.at)) byRun.set(n.at, []); byRun.get(n.at).push(n); }
    wrap.appendChild(u.section('Recent from SABIS',
      last && !(last.news || []).length ? h('div', { class: 'small muted', style: { marginTop: '-6px', marginBottom: '10px' } }, `Nothing new in the last update (${ago(last.at)}).`) : null,
      mine.length ? Array.from(byRun.entries()).map(([at, list]) => h('div', { style: { marginBottom: '8px' } },
        h('div', { class: 'small muted', style: { fontWeight: 700, margin: '4px 0 8px' } }, `Update of ${ago(at)}`),
        list.map(n => h('div', { class: 'news-item' }, u.chip(newsLabel(n.kind), n.severity === 'high' ? 'high' : n.severity === 'medium' ? 'medium' : 'info'),
          h('div', null, h('div', { class: 'ux', style: { fontWeight: 600 } }, n.title), n.body ? h('div', { class: 'small muted ux' }, n.body) : null)))))
        : h('div', { class: 'empty' }, last ? 'Nothing new yet.' : 'Press "Update from SABIS" to bring everything in.')));
    if (isParent() && last && (last.errors || []).length && last.ok) {
      wrap.appendChild(h('details', { class: 'card' }, h('summary', { style: { cursor: 'pointer', fontWeight: 700 } }, `${last.errors.length} part${last.errors.length === 1 ? '' : 's'} could not be read`),
        h('ul', { class: 'small muted' }, last.errors.map(e => h('li', null, e))),
        h('p', { class: 'small muted' }, 'Everything else was saved. These parts are tried again next time.')));
    }
    return wrap;
  }
  function newsLabel(kind) {
    return { marks: 'Marks', exams: 'Exam questions', docs: 'Files', calendar: 'Calendar', announcement: 'Announcement', homework: 'Homework', report: 'Report', absence: 'Absence', discipline: 'Behaviour' }[kind] || 'Update';
  }

  let annKid = '', annSearch = '';
  function announcementsTab() {
    const all = (KH.store.data.announcements || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    let list = isParent() ? all : all.filter(forMe);
    if (isParent() && annKid === 'general') list = list.filter(a => a.general);
    else if (isParent() && annKid) list = list.filter(a => a.general || (a.forKids || []).includes(annKid));
    if (annSearch) { const q = annSearch.toLowerCase(); list = list.filter(a => `${a.title} ${a.text}`.toLowerCase().includes(q)); }
    const unread = list.filter(a => !isRead(a));
    const search = h('input', { type: 'search', placeholder: 'Search announcements', value: annSearch, style: { maxWidth: '260px' } });
    search.addEventListener('input', u.debounce(() => { annSearch = search.value; KH.app.refresh(); setTimeout(() => { const s = document.querySelector('input[type=search]'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 300));
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '14px' } },
        isParent() ? h('div', { class: 'seg' }, [['', 'All'], ...KH.store.children().map(c => [c.id, c.name]), ['general', 'Everyone']].map(([v, l]) =>
          h('button', { class: annKid === v ? 'on' : '', onclick: () => { annKid = v; KH.app.refresh(); } }, l))) : null,
        search, h('div', { class: 'spacer' }),
        unread.length ? h('button', { class: 'btn small', onclick: () => { for (const a of unread) markRead(a); KH.app.refresh(); } }, `Mark ${unread.length} as read`) : null),
      list.length ? h('div', null, list.map(annCard)) : h('div', { class: 'card empty' }, all.length ? 'No announcements match.' : 'No announcements yet. They arrive with "Update from SABIS".'));
  }
  function annCard(a) {
    const body = h('div', { class: 'ux', style: { whiteSpace: 'pre-line', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, a.text || '');
    let open = false;
    const more = h('a', { class: 'small', onclick: () => {
      open = !open;
      body.style.webkitLineClamp = open ? 'unset' : '3';
      body.style.display = open ? 'block' : '-webkit-box';
      more.textContent = KH.i18n.t(open ? 'Show less' : 'Show more');
      if (open && !isRead(a)) { markRead(a); a.readBy = Object.assign({}, a.readBy || {}, { [KH.store.user.id]: u.today() }); dot.remove(); }
    } }, 'Show more');
    const dot = h('span', { class: 'dot', style: { background: 'var(--accent)' }, title: 'Unread' });
    const who = a.general ? u.chip('Everyone', 'info') : (a.forKids || []).map(id => h('span', { class: 'chip', style: { background: `color-mix(in srgb, ${KH.kidColor(KH.store.child(id))} 16%, transparent)`, color: KH.kidColor(KH.store.child(id)) } }, kidName(id)));
    const card = h('div', { class: 'card tight', style: { marginBottom: '12px' } },
      h('div', { class: 'row' }, isRead(a) ? null : dot, h('b', { class: 'ux', style: { fontSize: '15px' } }, a.title), a.important ? u.chip('Important', 'high') : null, h('div', { class: 'spacer' }), h('span', { class: 'small muted nowrap' }, u.fmtDate(a.date))),
      h('div', { class: 'row', style: { marginTop: '6px', gap: '6px' } }, who, a.attachments ? u.chip('Attachment on SABIS', '') : null),
      body,
      h('div', { class: 'row', style: { marginTop: '6px' } }, (a.text || '').length > 220 ? more : null, a.attachments && isParent() ? h('a', { class: 'small', onclick: () => openOnSabis(`/Pages/GeneralInformation/GeneralInformation?scid=${encodeURIComponent(decodeURIComponent(firstScid()))}`) }, 'Open on SABIS') : null));
    return card;
  }
  function firstScid() { const m = Object.values(((KH.store.settings().sabis || {}).children) || {})[0]; return (m && m.scid) || ''; }

  let hwShowDone = false;
  function homeworkTab() {
    const kids = isParent() ? KH.store.children() : [KH.store.child(me())].filter(Boolean);
    const today = u.today();
    const all = (KH.store.data.homework || []).filter(x => kids.some(k => k.id === x.childId));
    const wrap = h('div', null, h('div', { class: 'row', style: { marginBottom: '12px' } },
      h('label', { class: 'row small' }, h('input', { type: 'checkbox', checked: hwShowDone, onchange: e => { hwShowDone = e.target.checked; KH.app.refresh(); } }), 'Show finished homework'), h('div', { class: 'spacer' }),
      KH.app.isParent() ? h('button', { class: 'btn small', onclick: () => KH.crud.edit('homework') }, '+ Homework') : null));
    if (!all.length) { wrap.appendChild(h('div', { class: 'card empty' }, 'No homework yet. SABIS homework arrives with "Update from SABIS"; you can also add it by hand.')); return wrap; }
    wrap.appendChild(h('div', { class: `grid ${kids.length > 1 ? 'g3' : ''}` }, kids.map(k => {
      const mine = all.filter(x => x.childId === k.id && (hwShowDone || !x.done)).sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')));
      return h('div', { class: 'card' }, h('div', { class: 'row', style: { marginBottom: '8px' } }, h('span', { class: 'dot', style: { background: KH.kidColor(k) } }), h('h2', { style: { margin: 0 } }, k.name)),
        mine.length ? mine.map(x => {
          const d = x.due ? KH.analysis.daysBetween(today, x.due) : null;
          const tag = d === null ? null : d < 0 ? u.chip(`was due ${u.fmtShort(x.due)}`, x.done ? '' : 'bad') : d === 0 ? u.chip('due today', 'high') : d === 1 ? u.chip('due tomorrow', 'medium') : u.chip(`due ${u.fmtShort(x.due)}`, 'info');
          return h('div', { class: `task ${x.done ? 'done' : ''}` },
            h('input', { type: 'checkbox', checked: !!x.done, title: 'Finished (kept in this app only)', onchange: e => { KH.store.upsert('homework', Object.assign({}, x, { done: e.target.checked })); KH.app.refresh(); } }),
            h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { class: 't ux', style: { fontWeight: 600 } }, `${x.subject ? x.subject + ': ' : ''}${x.title || 'Homework'}`), x.details && !x.details.includes(x.title) ? h('div', { class: 'small muted ux' }, x.details.slice(0, 220)) : null),
            tag);
        }) : h('div', { class: 'muted small' }, 'Nothing to do.'));
    })));
    return wrap;
  }

  function timetableTab() {
    const kids = isParent() ? KH.store.children() : [KH.store.child(me())].filter(Boolean);
    const withTt = kids.filter(k => k.timetable && k.timetable.days);
    if (!withTt.length) return h('div', { class: 'card empty' }, 'No timetable yet. It arrives with "Update from SABIS".');
    const order = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = order[new Date().getDay()];
    return h('div', null, withTt.map(k => {
      const days = order.filter(d => k.timetable.days[d]);
      const periods = [];
      for (const d of days) for (const p of k.timetable.days[d]) if (!periods.some(x => x.name === p.name)) periods.push({ name: p.name, time: p.time });
      return h('div', { class: 'card' },
        h('div', { class: 'row', style: { marginBottom: '10px' } }, h('span', { class: 'dot', style: { background: KH.kidColor(k) } }), h('h2', { style: { margin: 0 } }, k.name), h('span', { class: 'small muted' }, `from SABIS, ${ago(k.timetable.at)}`)),
        h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'list' },
          h('thead', null, h('tr', null, h('th', null, ''), days.map(d => h('th', { style: d === todayName ? { color: 'var(--accent)' } : null }, d)))),
          h('tbody', null, periods.map(p => h('tr', null,
            h('td', { class: 'nowrap' }, h('b', null, p.name), h('div', { class: 'small muted', 'data-noi18n': '1' }, p.time)),
            days.map(d => { const x = (k.timetable.days[d] || []).find(y => y.name === p.name); return h('td', { style: d === todayName ? { background: 'var(--accentsoft)' } : null }, x && x.subject ? h('span', null, h('span', { class: 'muted', 'aria-hidden': 'true' }, SUBJECT_ICON(x.subject) + ' '), x.subject) : h('span', { class: 'muted' }, '-')); })))))));
    }));
  }

  let fileKid = '', fileSubject = '';
  function filesTab() {
    const docs = KH.store.data.documents || [];
    const kids = isParent() ? KH.store.children() : [KH.store.child(me())].filter(Boolean);
    if (!fileKid || !kids.some(k => k.id === fileKid)) fileKid = kids[0] ? kids[0].id : '';
    const study = docs.filter(d => d.study && d.childId === fileKid);
    const subjects = Array.from(new Set(study.map(d => d.subject || 'Other'))).sort();
    const shown = study.filter(d => !fileSubject || (d.subject || 'Other') === fileSubject).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const school = isParent() ? docs.filter(d => d.source === 'sabis' && !d.study && !d.childId) : [];
    const groups = new Map();
    for (const d of shown) { const k = d.category || 'SABIS'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(d); }
    const row = d => h('tr', null,
      h('td', null, h('div', { class: 'ux', style: { fontWeight: 600 } }, d.title), h('div', { class: 'small muted' }, [d.subject, d.week, d.size].filter(Boolean).join(' · '))),
      h('td', { class: 'nowrap small muted' }, u.fmtDate(d.date)),
      h('td', { class: 'right' }, h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        d.file && d.file.rel ? h('button', { class: 'btn small', onclick: () => hub.open(d.file.rel).catch(e => u.toast(e.message, 'bad')) }, 'Open') : h('span', { class: 'small muted' }, 'Not downloaded'),
        d.file && d.file.rel && isParent() ? h('button', { class: 'btn small', onclick: async () => { const p = await hub.saveAs(d.file.rel); if (p) u.toast('Saved'); } }, 'Save a copy') : null,
        isParent() ? h('button', { class: 'btn small', onclick: () => openOnSabis(sabisPagePath(d.childId, d.category)) }, 'On SABIS') : null)));
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '14px' } },
        kids.length > 1 ? h('div', { class: 'seg' }, kids.map(k => h('button', { class: fileKid === k.id ? 'on' : '', onclick: () => { fileKid = k.id; fileSubject = ''; KH.app.refresh(); } }, k.name))) : null,
        subjects.length > 1 ? h('select', { style: { width: '200px' }, onchange: e => { fileSubject = e.target.value; KH.app.refresh(); } }, h('option', { value: '' }, 'All subjects'), subjects.map(s => h('option', { value: s, selected: s === fileSubject }, s))) : null,
        h('div', { class: 'spacer' }), h('span', { class: 'small muted' }, `${shown.length} file${shown.length === 1 ? '' : 's'}`)),
      study.length ? Array.from(groups.entries()).map(([g, list]) => u.section(g, h('table', { class: 'list' }, h('tbody', null, list.map(row)))))
        : h('div', { class: 'card empty' }, 'No study files yet. Exam preparation, PrepList and course practice files arrive with "Update from SABIS".'),
      school.length ? u.section('School forms and letters', h('table', { class: 'list' }, h('tbody', null, school.map(row)))) : null,
      isParent() ? h('p', { class: 'small muted' }, 'Downloading a file from SABIS marks it as read on SABIS, the same as opening it there.') : null);
  }

  function contactTab() {
    const c = (KH.store.settings().sabis || {}).contact;
    if (!c || !(c.fields || []).length) return h('div', { class: 'card empty' }, 'Your contact details arrive with "Update from SABIS".');
    return h('div', { style: { maxWidth: '720px' } }, u.section('Contact details on SABIS',
      h('p', { class: 'small muted', style: { marginTop: 0 } }, `A read-only copy, ${ago(c.at)}. To change anything, use SABIS itself.`),
      h('table', { class: 'list' }, h('tbody', null, c.fields.map(f => h('tr', null, h('td', { class: 'muted', style: { width: '200px' } }, f.label), h('td', { 'data-noi18n': '1' }, f.value))))),
      h('button', { class: 'btn', style: { marginTop: '12px' }, onclick: () => openOnSabis(`/Pages/Profile/ContactConfirmation?scid=${encodeURIComponent(decodeURIComponent(firstScid()))}`) }, u.icon('out'), 'Open on SABIS')));
  }

  KH.pages.school = function (route) {
    const tab = (route.match(/^#\/school\/(\w+)/) || [])[1] || 'updates';
    const body = tab === 'announcements' ? announcementsTab() : tab === 'homework' ? homeworkTab() : tab === 'timetable' ? timetableTab() : tab === 'files' ? filesTab() : tab === 'contact' && isParent() ? contactTab() : updatesTab();
    return h('div', null, tabs(tab), body);
  };
})();
