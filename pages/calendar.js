// Calendar: exams, holidays, payment due dates, birthdays, meetings, qualification exams
// and private-course sessions on one month view, plus a quick way to paste a whole exam schedule.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  let month = null; // Date of the 1st of the shown month
  let only = '';

  KH.pages.pasteSchedule = function () {
    const kids = KH.store.children();
    const childSel = h('select', null, kids.map(c => h('option', { value: c.id }, c.name)));
    const text = h('textarea', { style: { minHeight: '200px', fontFamily: 'Consolas, monospace' }, placeholder: '2026-12-06, Science, Unit 3 test\n08/12/2026, Mathematics, Algebra test\n10 Dec 2026 - English - Mid-term' });
    const preview = h('div', { class: 'small muted' });
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const parse = () => {
      const out = [];
      for (const line of text.value.split(/\n+/)) {
        const t = line.trim(); if (!t) continue;
        let date = null, rest = t;
        let m = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (m) date = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
        if (!date && (m = t.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/))) { const y = m[3].length === 2 ? '20' + m[3] : m[3]; date = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
        if (!date && (m = t.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/))) { const mo = months[m[2].toLowerCase()]; if (mo) date = `${m[3]}-${String(mo).padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
        if (!date) continue;
        rest = t.replace(m[0], '').replace(/^[\s,;:\-|]+/, '');
        const parts = rest.split(/\s*[,;|\t]\s*|\s+-\s+/).filter(Boolean);
        let childId = childSel.value;
        if (parts.length >= 2) { const k = kids.find(c => c.name.toLowerCase() === parts[0].toLowerCase()); if (k) { childId = k.id; parts.shift(); } }
        out.push({ date, childId, subject: parts[0] || 'Exam', title: parts.slice(1).join(' - ') || '' });
      }
      return out;
    };
    text.addEventListener('input', () => { const p = parse(); preview.textContent = `${p.length} exam date${p.length === 1 ? '' : 's'} recognised.`; });
    u.modal({ title: 'Paste an exam schedule', wide: true, body: h('div', null,
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'One exam per line: date, subject, what. Dates like 2026-12-06, 06/12/2026 or 6 Dec 2026. Start a line with a child\'s name to set the child for that line.'),
      h('label', { class: 'f' }, h('span', null, 'Child (unless the line names one)'), childSel), text, preview),
      actions: [{ label: 'Cancel' }, { label: 'Add to calendar', primary: true, onClick: () => {
        const list = parse();
        if (!list.length) { u.toast('No dates recognised', 'bad'); return false; }
        for (const e of list) KH.store.upsert('exams', Object.assign({ type: 'Test', revisionDays: 3 }, e));
        u.toast(`${list.length} exam dates added`); KH.app.refresh(); return true;
      } }] });
  };

  KH.pages.calendar = function () {
    const isParent = KH.app.isParent();
    const childId = isParent ? only : KH.store.user.childId;
    if (!month) { const t = new Date(); month = new Date(t.getFullYear(), t.getMonth(), 1); }
    const items = A.calendarItems(KH.store.data, { childId: childId || undefined, year: month.getFullYear(), parent: isParent, today: u.today(), hideAmounts: KH.lock.hidden() });
    const byDay = new Map();
    for (const it of items) {
      const start = u.parseDate(it.date), end = it.end ? u.parseDate(it.end) : start;
      for (let d = new Date(start); d <= end && (end - start) / 86400000 < 120; d.setDate(d.getDate() + 1)) {
        const k = u.iso(d); const arr = byDay.get(k) || []; arr.push(it); byDay.set(k, arr);
      }
    }
    const first = new Date(month);
    const startOffset = first.getDay(); // Sunday first (Saudi school week)
    const gridStart = new Date(first); gridStart.setDate(1 - startOffset);
    const cal = h('div', { class: 'cal' }, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => h('div', { class: 'dh' }, new Date(2026, 10, 1 + i).toLocaleDateString(u.locale(), { weekday: 'short' }))));
    const today = u.today();
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      const key = u.iso(d);
      const evs = byDay.get(key) || [];
      cal.appendChild(h('div', { class: `day ${d.getMonth() !== month.getMonth() ? 'other' : ''} ${key === today ? 'today' : ''}` },
        h('div', { class: 'num' }, d.getDate()), evs.slice(0, 5).map(e => h('span', { class: `ev ${e.type}`, title: e.title, style: e.childId && e.type !== 'payment' ? { borderInlineStart: `3px solid ${KH.kidColor(KH.store.child(e.childId))}` } : null }, e.title)), evs.length > 5 ? h('span', { class: 'small muted' }, `+${evs.length - 5} more`) : null));
    }
    const upcoming = items.filter(i => i.date >= today).slice(0, 25);
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '12px' } },
        h('button', { class: 'btn icon', 'aria-label': 'Previous month', onclick: () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); KH.app.refresh(); } }, document.documentElement.dir === 'rtl' ? '›' : '‹'),
        h('h2', { style: { margin: 0, minWidth: '170px', textAlign: 'center' }, 'data-noi18n': '1' }, month.toLocaleDateString(u.locale(), { month: 'long', year: 'numeric' })),
        h('button', { class: 'btn icon', 'aria-label': 'Next month', onclick: () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); KH.app.refresh(); } }, document.documentElement.dir === 'rtl' ? '‹' : '›'),
        h('button', { class: 'btn small', onclick: () => { month = null; KH.app.refresh(); } }, 'Today'),
        isParent ? h('select', { style: { width: '160px' }, onchange: e => { only = e.target.value; KH.app.refresh(); } }, h('option', { value: '' }, 'Everyone'), KH.store.children().map(c => h('option', { value: c.id, selected: c.id === only }, c.name))) : null,
        h('div', { class: 'spacer' }),
        isParent ? h('button', { class: 'btn', onclick: () => KH.crud.edit('exams') }, '+ Exam date') : null,
        isParent ? h('button', { class: 'btn', onclick: KH.pages.pasteSchedule }, 'Paste exam schedule') : null,
        isParent ? h('button', { class: 'btn', onclick: () => KH.crud.edit('holidays') }, '+ Holiday or event') : null),
      h('div', { class: 'card', style: { padding: 0, overflow: 'hidden' } }, cal),
      h('div', { class: 'row small', style: { margin: '-6px 0 16px', gap: '6px' } }, (isParent ? ['exam', 'homework', 'holiday', 'event', 'payment', 'birthday', 'meeting', 'qualification', 'course', 'sick'] : ['exam', 'homework', 'holiday', 'event', 'birthday', 'qualification', 'course']).map(t => h('span', { class: `ev ${t}`, style: { display: 'inline-block' } }, t))),
      u.section('Coming up', upcoming.length ? h('table', { class: 'list' }, h('tbody', null, upcoming.map(i => h('tr', null, h('td', { class: 'nowrap' }, u.fmtDate(i.date)), h('td', null, h('span', { class: `ev ${i.type}`, style: { display: 'inline-block' } }, i.type)), h('td', null, i.title))))) : h('div', { class: 'empty' }, 'Nothing coming up.')));
  };
})();
