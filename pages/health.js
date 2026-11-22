// Lunch box (what was packed and what came back) and Sick records (days off,
// doctor visits, medicine, the medical note for school and missed tests).
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  const EATEN = ['All', 'Most', 'Half', 'Little', 'None'];
  const EATEN_COLOR = { All: '#16A34A', Most: '#86C99A', Half: '#E5B54A', Little: '#E58A4A', None: '#DC2626' };
  let draft = null;

  function seg(options, value, onPick) {
    return h('div', { class: 'seg' }, options.map(o => h('button', { type: 'button', class: o === value ? 'on' : '', onclick: () => onPick(o) }, o)));
  }

  function lunchStrip(childId) {
    const today = u.today();
    const byDay = new Map((KH.store.data.lunch || []).filter(r => r.childId === childId).map(r => [r.date, r]));
    const cells = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = u.iso(d);
      const r = byDay.get(iso);
      const col = r && r.eaten ? EATEN_COLOR[r.eaten] : r ? 'var(--border)' : 'var(--track)';
      const tip = `${u.fmtDate(iso)}: ${r ? `${r.kind || 'Lunch'}${r.eaten ? ', ate ' + r.eaten.toLowerCase() : ''}${r.leftovers ? ', back: ' + r.leftovers : ''}` : 'nothing logged'}`;
      cells.push(h('div', { title: tip, style: { width: '18px', height: '18px', borderRadius: '4px', background: col, outline: iso === today ? '2px solid var(--text)' : '', outlineOffset: '1px' } }));
    }
    return h('div', null, h('div', { class: 'row', style: { gap: '3px', flexWrap: 'nowrap' } }, cells), h('div', { class: 'small muted', style: { marginTop: '4px' } }, 'Last 14 days, today on the right'));
  }

  function lunchCard(c) {
    const ls = A.lunchStats(KH.store.data, c.id, u.today());
    const cur = KH.store.settings().currency || 'SAR';
    return h('div', { class: 'card' },
      h('div', { class: 'kid-head' }, KH.avatar(c, 32), h('div', null, h('b', null, c.name), h('div', { class: 'small muted' }, `${ls.days} day${ls.days === 1 ? '' : 's'} logged in the last 30 days`))),
      ls.eatenPct === null ? h('div', { class: 'muted small' }, 'Log a few days to see how much gets eaten.')
        : h('div', null, h('div', { class: 'row', style: { alignItems: 'baseline', gap: '6px' } }, h('span', { class: 'stat' }, `${ls.eatenPct}%`), h('span', { class: 'small muted' }, 'of the lunch box eaten on average')),
          u.svg(KH.charts.progress(ls.eatenPct, ls.eatenPct >= 75 ? 'var(--good)' : ls.eatenPct >= 50 ? null : 'var(--bad)'))),
      h('div', { style: { margin: '8px 0' } }, lunchStrip(c.id)),
      ls.finished.length ? h('div', { class: 'small' }, h('b', null, 'Always finished: '), ls.finished.map(i => i.name).join(', ')) : null,
      ls.returned.length ? h('div', { class: 'small' }, h('b', null, 'Often comes back: '), ls.returned.map(i => `${i.name} (${i.back}×)`).join(', ')) : null,
      ls.canteenMonth ? h('div', { class: 'small muted', style: { marginTop: '4px' } }, `Canteen this month: ${u.money(ls.canteenMonth)} ${cur}`) : null);
  }

  function lunchForm(kids) {
    const isParent = KH.app.isParent();
    if (!draft || !kids.some(k => k.id === draft.childId)) draft = { childId: kids[0].id, date: u.today(), kind: 'Lunch box', items: '', eaten: '', leftovers: '', canteen: '' };
    const ls = A.lunchStats(KH.store.data, draft.childId, u.today());
    const existing = (KH.store.data.lunch || []).find(r => r.childId === draft.childId && r.date === draft.date);
    const listId = 'lunch-items';
    const box = draft.kind !== 'Canteen' && draft.kind !== 'None';
    const canteen = draft.kind === 'Canteen' || draft.kind === 'Lunch box + canteen';
    const items = h('input', { type: 'text', list: listId, value: draft.items, placeholder: 'e.g. cheese sandwich, apple, juice', oninput: e => { draft.items = e.target.value; } });
    const left = h('input', { type: 'text', list: listId, value: draft.leftovers, placeholder: 'what came back, if anything', oninput: e => { draft.leftovers = e.target.value; } });
    const save = () => {
      if (box && !draft.items.trim()) return u.toast('Write what was packed', 'bad');
      const rec = Object.assign({}, existing || {}, { childId: draft.childId, date: draft.date, kind: draft.kind,
        items: box ? draft.items.trim() : '', eaten: box ? draft.eaten : '', leftovers: box ? draft.leftovers.trim() : '', canteen: canteen && draft.canteen !== '' ? Number(draft.canteen) : '' });
      KH.store.upsert('lunch', rec);
      u.toast(existing ? 'Updated' : 'Saved');
      draft = Object.assign({}, draft, { items: '', eaten: '', leftovers: '', canteen: '' });
      KH.app.refresh();
    };
    return u.section(existing ? `Lunch on ${u.fmtDate(draft.date)} (already logged - saving updates it)` : 'Log a lunch',
      h('datalist', { id: listId }, ls.common.map(n => h('option', { value: n }))),
      h('div', { class: 'row', style: { marginBottom: '10px' } },
        isParent ? h('select', { style: { width: '150px' }, onchange: e => { draft.childId = e.target.value; KH.app.refresh(); } }, kids.map(c => h('option', { value: c.id, selected: c.id === draft.childId }, c.name))) : null,
        h('input', { type: 'date', value: draft.date, style: { width: '160px' }, onchange: e => {
          draft.date = e.target.value;
          const ex = (KH.store.data.lunch || []).find(r => r.childId === draft.childId && r.date === draft.date);
          if (ex) Object.assign(draft, { kind: ex.kind || 'Lunch box', items: ex.items || '', eaten: ex.eaten || '', leftovers: ex.leftovers || '', canteen: ex.canteen === undefined ? '' : ex.canteen });
          KH.app.refresh();
        } }),
        seg(['Lunch box', 'Canteen', 'Lunch box + canteen', 'None'], draft.kind, v => { draft.kind = v; KH.app.refresh(); })),
      box ? h('div', null,
        h('label', { class: 'f' }, h('span', null, 'Packed'), h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, items,
          ls.lastEntry && ls.lastEntry.items ? h('button', { class: 'btn small', type: 'button', style: { whiteSpace: 'nowrap' }, onclick: () => { draft.items = ls.lastEntry.items; KH.app.refresh(); } }, 'Same as last time') : null)),
        h('label', { class: 'f' }, h('span', null, 'How much was eaten'), seg(EATEN, draft.eaten, v => { draft.eaten = v; if (v === 'All') draft.leftovers = ''; KH.app.refresh(); })),
        h('label', { class: 'f' }, h('span', null, 'Came back'), left)) : null,
      canteen ? h('label', { class: 'f', style: { maxWidth: '220px' } }, h('span', null, `Canteen money (${KH.store.settings().currency || 'SAR'})`),
        h('input', { type: 'number', step: 'any', value: draft.canteen, oninput: e => { draft.canteen = e.target.value; } })) : null,
      h('button', { class: 'btn primary', onclick: save }, existing ? 'Update' : 'Save'));
  }

  function todayCard(kids) {
    const today = u.today();
    const rows = kids.map(c => {
      const r = (KH.store.data.lunch || []).find(x => x.childId === c.id && x.date === today);
      return h('div', { class: 'row', style: { padding: '7px 0', borderBottom: '1px solid var(--border)', flexWrap: 'nowrap' } }, KH.avatar(c, 28),
        h('div', { style: { minWidth: 0 } }, h('b', null, c.name),
          h('div', { class: 'small muted' }, r ? `${r.kind || 'Lunch box'}${r.items ? ': ' + r.items : ''}${r.eaten ? ` · ate ${r.eaten.toLowerCase()}` : ''}${r.canteen ? ` · canteen ${u.money(r.canteen)}` : ''}` : 'Not logged yet')),
        h('div', { class: 'spacer' }),
        r ? u.chip('logged', 'good') : h('button', { class: 'btn small', onclick: () => { draft = Object.assign({}, draft || {}, { childId: c.id, date: today, kind: 'Lunch box', items: '', eaten: '', leftovers: '', canteen: '' }); KH.app.refresh(); } }, 'Log'));
    });
    return u.section('Today', rows,
      h('div', { class: 'row small', style: { gap: '10px', marginTop: '12px' } }, EATEN.map(e => h('span', { class: 'row', style: { gap: '4px' } }, h('span', { style: { width: '12px', height: '12px', borderRadius: '3px', background: EATEN_COLOR[e], display: 'inline-block' } }), `ate ${e.toLowerCase()}`)),
        h('span', { class: 'row', style: { gap: '4px' } }, h('span', { style: { width: '12px', height: '12px', borderRadius: '3px', background: 'var(--border)', display: 'inline-block' } }), 'canteen / not rated')),
      h('p', { class: 'small muted', style: { marginBottom: 0 } }, 'Write the items the same way each time, separated by commas, so the app can tell which ones get finished and which keep coming back.'));
  }

  KH.pages.lunch = function () {
    const isParent = KH.app.isParent();
    const kids = isParent ? KH.store.children() : [KH.store.child(KH.store.user.childId)].filter(Boolean);
    if (!kids.length) return h('div', { class: 'empty' }, 'Add the children first.');
    return h('div', null,
      h('div', { class: 'grid g2' }, lunchForm(kids), todayCard(kids)),
      h('div', { class: `grid ${kids.length >= 3 ? 'g3' : 'g2'}` }, kids.map(lunchCard)),
      u.section('History', KH.crud.list('lunch', { noBar: !isParent })));
  };

  // ---------------- sick records ----------------
  function backToSchool(rec) {
    const today = u.today();
    const y = new Date(); y.setDate(y.getDate() - 1);
    const end = rec.start >= today ? today : (u.iso(y) < rec.start ? rec.start : u.iso(y));
    KH.store.upsert('sick', Object.assign({}, rec, { end }));
    u.toast('Glad they are better');
    KH.app.refresh();
  }

  function sickCard(c) {
    const ss = A.sickStats(KH.store.data, c.id, u.today());
    const cur = KH.store.settings().currency || 'SAR';
    const pending = ss.missedExams.filter(m => !m.rec.makeUp);
    return h('div', { class: 'card' },
      h('div', { class: 'kid-head' }, KH.avatar(c, 32), h('div', null, h('b', null, c.name), h('div', { class: 'small muted' }, `School year ${ss.year}`)),
        ss.current ? h('span', { style: { marginLeft: 'auto' } }, u.chip('sick now', 'bad')) : null),
      h('div', { class: 'grid g2', style: { gap: '8px', marginBottom: '8px' } },
        h('div', null, h('div', { class: 'stat-label' }, 'Times sick'), h('div', { class: 'stat' }, ss.episodes)),
        h('div', null, h('div', { class: 'stat-label' }, 'School days missed'), h('div', { class: 'stat' }, ss.daysOff))),
      h('div', { class: 'small muted' }, [ss.doctorVisits ? `${ss.doctorVisits} doctor visit${ss.doctorVisits === 1 ? '' : 's'}` : '', ss.cost ? `${u.money(ss.cost)} ${cur} spent` : ''].filter(Boolean).join(' · ') || 'No doctor visits recorded this year'),
      ss.last ? h('div', { class: 'small', style: { marginTop: '6px' } }, h('b', null, 'Last: '), `${u.fmtDate(ss.last.start)} - ${ss.last.illness || 'sick'}`) : h('div', { class: 'small', style: { marginTop: '6px' } }, 'Nothing recorded.'),
      pending.length ? h('div', { class: 'small', style: { marginTop: '6px', color: 'var(--bad)' } }, `Missed while sick: ${pending.map(m => `${m.exam.subject || 'exam'} (${u.fmtShort(m.exam.date)})`).join(', ')}`) : null);
  }

  // A child can say they are not feeling well; the parents get a notification and add the rest.
  function kidSick() {
    const me = KH.store.child(KH.store.user.childId);
    const ss = A.sickStats(KH.store.data, me.id, u.today());
    const cur = ss.current;
    return h('div', null,
      cur ? h('div', { class: 'card sick-now row' }, KH.avatar(me, 36),
        h('div', null, h('b', null, 'You are marked as sick'), h('div', { class: 'small muted ux' }, `${cur.illness || ''} · since ${u.fmtDate(cur.start)}${cur.temperature ? ` · up to ${cur.temperature}°C` : ''}`)),
        h('div', { class: 'spacer' }),
        KH.crud.mayEdit(KH.schema.sick, cur) ? h('button', { class: 'btn', onclick: () => KH.crud.edit('sick', cur) }, 'Update') : null,
        h('button', { class: 'btn primary', onclick: () => backToSchool(cur) }, 'I feel better'))
        : h('div', { class: 'card', style: { textAlign: 'center', padding: '28px' } },
          h('h2', { style: { marginTop: 0 } }, 'Not feeling well?'),
          h('p', { class: 'muted' }, 'Tell your parents here. Write how you feel and, if you know it, your temperature. They get a message straight away.'),
          h('button', { class: 'btn primary', onclick: () => KH.crud.edit('sick', null, { onSaved: () => u.toast('Your parents will see it. Get well soon!') }) }, u.icon('heart'), "I'm not feeling well")),
      u.section('My sick reports', KH.crud.list('sick', { noBar: true })));
  }

  KH.pages.sick = function () {
    if (!KH.app.isParent()) return kidSick();
    const kids = KH.store.children();
    const today = u.today();
    const now = kids.map(c => ({ c, ss: A.sickStats(KH.store.data, c.id, today) })).filter(x => x.ss.current);
    const todo = A.alerts(KH.store.data, today).filter(a => a.kind === 'health');
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '12px' } },
        h('p', { class: 'muted', style: { margin: 0 } }, 'The children can report feeling unwell from their own login; you add the doctor, medicine and school days missed. Days missed are counted without weekends and recorded holidays, unless you type the number.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: () => KH.crud.edit('sick') }, '+ Record sickness')),
      now.map(({ c, ss }) => {
        const r = ss.current;
        const n = A.daysBetween(r.start, today) + 1;
        return h('div', { class: 'card sick-now row' },
          KH.avatar(c, 36),
          h('div', null, h('b', null, `${c.name} is sick`), h('div', { class: 'small muted' }, `${r.illness || ''} · since ${u.fmtDate(r.start)} (day ${n})${r.temperature ? ` · up to ${r.temperature}°C` : ''}${r.medicine ? ' · ' + r.medicine.split('\n')[0] : ''}`)),
          h('div', { class: 'spacer' }),
          h('button', { class: 'btn', onclick: () => KH.crud.edit('sick', r) }, 'Update'),
          h('button', { class: 'btn primary', onclick: () => backToSchool(r) }, 'Back to school today'));
      }),
      h('div', { class: `grid ${kids.length >= 3 ? 'g3' : 'g2'}` }, kids.map(sickCard)),
      todo.length ? u.section('To do', KH.alertList(todo, 10)) : null,
      u.section('All sick records', KH.crud.list('sick')));
  };

  // Small block for a child's profile page.
  KH.pages.healthBlock = function (child) {
    const isParent = KH.app.isParent();
    const ls = A.lunchStats(KH.store.data, child.id, u.today());
    const parts = [];
    if (isParent) {
      const ss = A.sickStats(KH.store.data, child.id, u.today());
      parts.push(h('div', { class: 'small', style: { marginBottom: '8px' } },
        ss.current ? h('div', { style: { color: 'var(--bad)' } }, `Sick now: ${ss.current.illness || ''} (since ${u.fmtDate(ss.current.start)})`) : null,
        h('div', null, `This school year: sick ${ss.episodes} time${ss.episodes === 1 ? '' : 's'}, ${ss.daysOff} school day${ss.daysOff === 1 ? '' : 's'} missed.`),
        ss.last && !ss.current ? h('div', { class: 'muted' }, `Last: ${u.fmtDate(ss.last.start)} - ${ss.last.illness || ''}`) : null,
        h('a', { href: '#/sick' }, 'Sick records')));
    }
    parts.push(h('div', { class: 'small' },
      ls.eatenPct === null ? h('div', { class: 'muted' }, 'No lunches logged in the last 30 days.') : h('div', null, `Lunch box: ${ls.eatenPct}% eaten on average over the last 30 days.`),
      ls.returned.length ? h('div', { class: 'muted' }, `Often comes back: ${ls.returned.map(i => i.name).join(', ')}`) : null,
      h('a', { href: '#/lunch' }, 'Lunch box')));
    return u.section(isParent ? 'Health & lunch' : 'Lunch', parts);
  };
})();
