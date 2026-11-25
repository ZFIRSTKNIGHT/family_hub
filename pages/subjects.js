// Subject analysis (version 4.2): every subject of a child across all terms (the child page's
// "Subjects" tab), and every subject of all the children side by side (#/subjects, parents only).
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  const pick = {};   // childId -> course key shown alone ('' = all)
  const sortBy = {}; // childId -> 'attention' | 'name' | 'high'

  const STATUS = {
    help: ['Needs help', 'bad'], watch: ['Keep an eye on it', 'warn'], good: ['Good', 'info'], strong: ['Strong', 'good'], past: ['Earlier terms only', ''],
  };
  const statusChip = st => u.chip(STATUS[st][0], STATUS[st][1]);
  const arrow = s => (s.direction === 'up' ? '▲' : s.direction === 'down' ? '▼' : s.direction === 'uneven' ? '↕' : '');
  const sgn = v => (v === null || v === undefined ? '-' : v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');

  function keyNumbers(s) {
    const cell = (label, value, tone) => h('div', { class: 'subj-num' }, h('div', { class: 'stat-label' }, label), h('div', { class: `subj-v ${tone || ''}` }, value));
    const tr = s.trend;
    return h('div', { class: 'subj-nums' },
      cell('This term', u.grade(s.avg)),
      cell('Rank', s.rank ? `${s.rank} / ${s.of}` : '-'),
      cell('Vs overall', sgn(s.vsOverall), s.vsOverall > 0 ? 'good' : s.vsOverall < 0 ? 'bad' : ''),
      cell('Vs last term', s.termChange === null ? '-' : sgn(s.termChange), s.termChange > 0 ? 'good' : s.termChange < 0 ? 'bad' : ''),
      cell('Range', s.termMin !== null ? `${s.termMin}-${s.termMax}` : '-'),
      cell('Trend', tr ? (tr.kind === 'steady' ? 'steady' : `${tr.per > 0 ? '+' : '−'}${Math.abs(tr.per)} / ${tr.unit}`) : '-', tr && tr.kind === 'rising' ? 'good' : tr && tr.kind === 'sliding' ? 'bad' : ''));
  }

  function subjectCard(child, s, low) {
    const chart = KH.charts.journey(s, { ref: low });
    const head = h('div', { class: 'row subj-head' },
      h('h2', { style: { margin: 0 } }, s.course), s.current ? u.grade(s.avg) : null,
      h('span', { class: `subj-arrow ${s.direction}` }, arrow(s)),
      h('div', { class: 'spacer' }), statusChip(s.status));
    return h('div', { class: 'card subj-card', id: `subj-${child.id}-${s.key.replace(/[^\w]+/g, '-')}` },
      head,
      s.current ? keyNumbers(s) : null,
      chart ? u.svg(chart) : null,
      chart ? h('div', { class: 'chart-key' }, h('span', null, h('i', { class: 'dot' }), 'each mark'), h('span', null, h('i', { class: 'bar-k' }), 'term average'),
        s.trend ? h('span', null, h('i', { class: 'dash' }), 'trend') : null, s.next !== null ? h('span', null, '○ likely next mark') : null,
        h('span', null, u.isPhone() ? 'tap for details' : 'hover for details')) : null,
      s.parts.length >= 2 ? h('div', { style: { marginTop: '10px' } }, h('div', { class: 'stat-label' }, 'Parts of the subject'), u.svg(KH.charts.parts(s.parts, { ref: s.avg, refLabel: 'Subject' }))) : null,
      h('div', { class: 'stat-label', style: { marginTop: '12px' } }, 'What it shows'),
      h('div', null, s.lines.map(l => h('div', { class: `finding ${l.kind}` }, l.text))),
      s.advice.length ? h('div', null, h('div', { class: 'stat-label', style: { marginTop: '12px' } }, 'What to do next'),
        h('ul', { class: 'subj-advice' }, s.advice.map(a => h('li', null, a)))) : null,
      s.exams.length ? h('details', { style: { marginTop: '8px' } }, h('summary', { class: 'small', style: { cursor: 'pointer' } }, `Marked exams (${s.exams.length})`),
        h('table', { class: 'list' }, h('tbody', null, s.exams.map(e => h('tr', null, h('td', null, e.title), h('td', { class: 'small muted' }, e.date ? u.fmtShort(e.date) : ''),
          h('td', { class: 'right' }, e.total ? `${e.right} / ${e.total}` : (e.score !== null ? String(e.score) : ''))))))) : null);
  }

  function tiles(child, list) {
    return h('div', { class: 'subj-tiles' }, list.map(s => h('button', { class: `subj-tile ${s.status}`, title: STATUS[s.status][0], onclick: () => { pick[child.id] = s.key; KH.app.refresh(); } },
      h('span', { class: 'subj-tname' }, s.course),
      h('span', { class: 'row', style: { gap: '6px' } }, s.current ? u.grade(s.avg) : h('span', { class: 'small muted' }, String(s.allTimeAvg)), h('span', { class: `subj-arrow ${s.direction}` }, s.current ? arrow(s) : '')))));
  }

  function pdfHtml(child, a) {
    const esc = u.esc, low = KH.store.settings().lowMark;
    const cards = a.subjects.map(s => `<div class="page"><h2>${esc(s.course)} ${s.current ? `· ${s.avg}` : ''} <span class="muted">(${esc(STATUS[s.status][0])})</span></h2>
      ${KH.charts.journey(s, { ref: low, print: true })}
      ${s.parts.length >= 2 ? KH.charts.parts(s.parts, { ref: s.avg, refLabel: 'Subject', print: true }) : ''}
      ${s.lines.map(l => `<div class="f ${l.kind}">${esc(l.text)}</div>`).join('')}
      ${s.advice.length ? `<ul>${s.advice.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>
      body{font-family:"Segoe UI",Arial,sans-serif;color:#151B2E;font-size:12px;margin:0 6px} h1{font-size:20px;margin:0} h2{font-size:15px;margin:18px 0 6px;color:#4F46E5}
      .muted{color:#556078} svg{max-width:100%} .page{page-break-inside:avoid;border-bottom:1px solid #E3E7F1;padding-bottom:8px}
      .f{border-left:3px solid #ccc;padding:3px 8px;margin:4px 0} .high{border-color:#C2371F}.medium{border-color:#9A5B00}.positive{border-color:#11744A}.info{border-color:#2852C9}</style></head><body>
      <h1>${esc(child.name)} - subject analysis</h1>
      <div class="muted">${esc(a.term)} ${esc(a.year)} · Overall ${a.overall} · ${a.terms.length} term${a.terms.length === 1 ? '' : 's'} of marks · M. Ebrahim Family Hub, ${u.fmtDate(u.today())}</div>
      ${cards}</body></html>`;
  }

  // ---------------- one child: the "Subjects" tab ----------------
  KH.pages.subjectsTab = function (child) {
    const a = A.subjectAnalysis(KH.store.data, child.id, { byName: sortBy[child.id] === 'name' });
    if (!a.subjects.length) {
      return u.section(null, h('div', { class: 'empty' }, `No marks yet for ${child.name}.`),
        KH.app.isParent() ? h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn primary', onclick: () => KH.app.go('#/add') }, '+ Add marks')) : null);
    }
    const low = KH.store.settings().lowMark;
    let list = a.subjects.slice();
    if (sortBy[child.id] === 'high') list.sort((x, y) => (y.avg ?? -1) - (x.avg ?? -1));
    const only = pick[child.id] && list.find(s => s.key === pick[child.id]) ? pick[child.id] : '';
    const hl = a.highlights;
    const wrap = h('div');
    wrap.appendChild(h('div', { class: 'row', style: { marginBottom: '14px', flexWrap: 'wrap' } },
      h('select', { style: { width: '220px' }, onchange: e => { pick[child.id] = e.target.value; KH.app.refresh(); } },
        h('option', { value: '' }, 'All subjects'),
        list.map(s => h('option', { value: s.key, selected: s.key === only }, s.course))),
      h('select', { style: { width: '200px' }, onchange: e => { sortBy[child.id] = e.target.value; KH.app.refresh(); } },
        [['attention', 'Needs attention first'], ['high', 'Highest first'], ['name', 'A to Z']].map(([v, l]) => h('option', { value: v, selected: (sortBy[child.id] || 'attention') === v }, l))),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn', onclick: async () => { const rel = await window.hub.pdf(pdfHtml(child, a), `${child.name} subject analysis ${a.term} ${a.year}`); if (rel) u.toast('PDF saved in the exports folder'); return rel; } }, u.icon('print'), 'Export PDF')));

    const c = hl.counts;
    wrap.appendChild(h('div', { class: 'grid g4 subj-hl' },
      u.stat('Strongest subject', hl.strongest ? hl.strongest.course : '-', hl.strongest ? `average ${hl.strongest.avg}` : ''),
      u.stat('Needs the most work', hl.weakest ? hl.weakest.course : '-', hl.weakest ? `average ${hl.weakest.avg}` : ''),
      u.stat('Most improved', hl.mostImproved ? hl.mostImproved.course : '-', hl.mostImproved ? (hl.mostImproved.termChange > 0 ? `up ${hl.mostImproved.termChange} on last term` : `${hl.mostImproved.first} → ${hl.mostImproved.last} this term`) : 'nothing yet'),
      u.stat(`${a.term} ${a.year}`, `${c.strong + c.good} / ${c.strong + c.good + c.watch + c.help}`, `${c.help} need help · ${c.watch} to watch`)));

    if (!only) {
      wrap.appendChild(u.section(KH.app.isParent() ? `${child.name}'s subjects at a glance` : 'Your subjects at a glance',
        h('div', { class: 'small muted', style: { marginTop: '-6px', marginBottom: '8px' } }, 'Tap a subject to see it alone. ▲ rising, ▼ sliding, ↕ uneven this term.'),
        tiles(child, list), u.gradeLegend()));
    } else {
      wrap.appendChild(h('div', { style: { marginBottom: '10px' } }, h('button', { class: 'btn', onclick: () => { pick[child.id] = ''; KH.app.refresh(); } }, '← All subjects')));
    }
    const shown = only ? list.filter(s => s.key === only) : list;
    wrap.appendChild(h('div', { class: only ? '' : 'grid g2' }, shown.map(s => subjectCard(child, s, low))));
    if (a.terms.length < 2 && !only) wrap.appendChild(h('div', { class: 'small muted', style: { marginTop: '8px' } }, 'The term-by-term comparison appears once there is a second term of marks. Earlier years can be added in Add marks.'));
    return wrap;
  };

  // ---------------- all the children ----------------
  KH.pages.subjects = function () {
    const data = KH.store.data;
    const X = A.subjectsAcrossKids(data);
    if (!X.kids.length) return u.section(null, h('div', { class: 'empty' }, 'No marks yet.'), h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn primary', onclick: () => KH.app.go('#/add') }, '+ Add marks')));
    const kids = X.kids.map(k => Object.assign({}, k, { c: KH.store.child(k.childId) }));
    const open = (id, key) => { if (key) pick[id] = key; KH.app.go(`#/child/${id}/subjects`); };
    const wrap = h('div');

    wrap.appendChild(h('div', { class: `grid ${kids.length >= 3 ? 'g3' : 'g2'}` }, kids.map(k => h('div', { class: 'card subj-kid', style: { borderTop: `4px solid ${KH.kidColor(k.c)}` } },
      h('div', { class: 'row', style: { gap: '10px' } }, KH.avatar(k.c, 40), h('div', null, h('div', { style: { fontWeight: 800 } }, k.name), h('div', { class: 'small muted' }, `${k.term} ${k.year}`)),
        h('div', { class: 'spacer' }), h('div', { style: { textAlign: 'end' } }, h('div', { class: 'stat-label' }, 'Overall'), u.grade(k.overall))),
      h('div', { class: 'small', style: { marginTop: '10px' } }, h('b', null, 'Strongest: '), k.strongest ? `${k.strongest.course} (${k.strongest.avg})` : '-'),
      h('div', { class: 'small' }, h('b', null, 'Needs the most work: '), k.weakest ? `${k.weakest.course} (${k.weakest.avg})` : '-'),
      h('div', { class: 'row', style: { gap: '6px', marginTop: '8px', flexWrap: 'wrap' } },
        k.counts.help ? u.chip(`${k.counts.help} need help`, 'bad') : null, k.counts.watch ? u.chip(`${k.counts.watch} to watch`, 'warn') : null,
        u.chip(`${k.counts.strong + k.counts.good} good or strong`, 'good')),
      h('button', { class: 'btn', style: { marginTop: '10px' }, onclick: () => open(k.childId) }, u.icon('chart'), 'Open subjects')))));

    // the table: a row per subject, a column per child
    const table = h('table', { class: 'list subj-matrix' },
      h('thead', null, h('tr', null, h('th', null, 'Subject'), kids.map(k => h('th', { class: 'center', 'data-noi18n': '1' }, k.name)))),
      h('tbody', null, X.rows.map(r => h('tr', null, h('td', { style: { fontWeight: 600 } }, r.course),
        kids.map(k => {
          const c = r.cells[k.childId];
          if (!c) return h('td', { class: 'center muted' }, '-');
          return h('td', { class: 'center' }, h('button', { class: 'subj-cell', title: `${k.name}: ${c.avg} (${sgn(c.vsOverall)} vs own overall)`, onclick: () => open(k.childId, r.key) },
            u.grade(c.avg), h('span', { class: `subj-arrow ${c.direction}` }, arrow(c)),
            h('span', { class: `small ${c.vsOverall > 0 ? 'good-t' : c.vsOverall < 0 ? 'bad-t' : 'muted'}` }, sgn(c.vsOverall))));
        })))));
    wrap.appendChild(u.section('Every subject, every child',
      h('div', { class: 'small muted', style: { marginTop: '-6px', marginBottom: '8px' } }, 'Latest term of each child. The small number is the gap to that child\'s own overall: the children are in different grades, so this is the fair comparison. Tap a mark to open that subject.'),
      h('div', { style: { overflowX: 'auto' } }, table), u.gradeLegend()));

    const notes = X.notes.concat(A.commonTrends(data).map(t => ({ kind: t.severity, text: t.text })));
    const seen = new Set();
    wrap.appendChild(u.section('Patterns across the children', notes.length ? h('div', null, notes.filter(n => !seen.has(n.text) && seen.add(n.text)).map(n => h('div', { class: `finding ${n.kind}` }, n.text)))
      : h('div', { class: 'muted' }, 'No shared pattern at the moment.')));

    const shared = X.rows.filter(r => r.kids >= 2);
    if (shared.length) {
      wrap.appendChild(h('h2', { class: 'subj-h' }, 'Subject by subject'));
      wrap.appendChild(h('div', { class: 'small muted', style: { marginBottom: '10px' } }, 'Bars in each child\'s colour. The black tick is that child\'s own overall.'));
      wrap.appendChild(h('div', { class: 'grid g3' }, shared.map(r => u.section(r.course,
        u.svg(KH.charts.kidCompare(kids.filter(k => r.cells[k.childId]).map(k => ({ label: k.name, value: r.cells[k.childId].avg, ref: k.overall, color: KH.kidColor(k.c) })), { title: r.course })),
        r.notes.length ? h('div', null, r.notes.map(n => h('div', { class: `finding ${n.kind} small` }, n.text))) : null))));
    }
    return wrap;
  };
})();
