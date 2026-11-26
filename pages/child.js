// Child page: term overview with charts, findings, action plan, goals, weak topics,
// international comparison, term archive, report list; the SABIS school tab
// (absences, behaviour, exam questions, homework, timetable, files) and the profile.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  const termSel = {};

  function actionState(key) { return (KH.store.data.actions || []).find(a => a.key === key); }
  function toggleAction(childId, a, done) {
    const ex = actionState(a.key);
    KH.store.upsert('actions', Object.assign({}, ex || {}, { key: a.key, childId, text: a.text, done, doneAt: done ? u.today() : '' }));
  }

  function actionPlan(child, s) {
    const box = h('div');
    const manual = (KH.store.data.actions || []).filter(a => a.source === 'manual' && a.childId === child.id && a.year === s.year && a.term === s.term);
    const all = s.actions.map(a => Object.assign({}, a, { done: !!(actionState(a.key) || {}).done })).concat(manual.map(m => ({ key: m.key, text: m.text, done: !!m.done, manual: m })));
    const doneCount = all.filter(a => a.done).length;
    box.appendChild(h('div', { class: 'row small muted', style: { marginBottom: '8px' } }, h('span', null, `${doneCount} of ${all.length} done`), h('div', { style: { flex: 1 } }, u.svg(KH.charts.progress(all.length ? doneCount / all.length * 100 : 0)))));
    for (const a of all) {
      const cb = h('input', { type: 'checkbox', checked: a.done, onchange: e => {
        if (a.manual) KH.store.upsert('actions', Object.assign({}, a.manual, { done: e.target.checked, doneAt: e.target.checked ? u.today() : '' }));
        else toggleAction(child.id, a, e.target.checked);
        KH.app.refresh();
      } });
      box.appendChild(h('label', { class: `task ${a.done ? 'done' : ''}`, style: { cursor: 'pointer' } }, cb, h('div', null, h('div', { class: 't' }, a.text), a.why ? h('div', { class: 'small muted' }, a.why) : null),
        a.manual && KH.app.isParent() ? h('a', { class: 'small', style: { marginInlineStart: 'auto' }, onclick: e => { e.preventDefault(); KH.store.remove('actions', a.manual.id); KH.app.refresh(); } }, 'remove') : null));
    }
    box.appendChild(h('button', { class: 'btn small', style: { marginTop: '8px' }, onclick: async () => {
      const r = await u.prompt('Add your own action', [{ key: 'text', label: 'Action' }]);
      if (r && r.text.trim()) { KH.store.upsert('actions', { key: u.uid('manual'), source: 'manual', childId: child.id, year: s.year, term: s.term, text: r.text.trim(), done: false }); KH.app.refresh(); }
    } }, '+ Add action'));
    return box;
  }

  function intlTable(s) {
    return h('table', { class: 'list' },
      h('thead', null, h('tr', null, ['Subject', 'Average', 'IGCSE', 'US grade', 'IB', 'Saudi'].map(t => h('th', null, t)))),
      h('tbody', null, s.courses.slice().sort((a, b) => b.avg - a.avg).map(c => { const i = A.international(c.avg); return h('tr', null, h('td', null, c.course), h('td', null, u.grade(c.avg)), h('td', null, i.igcse), h('td', null, i.us), h('td', null, i.ib), h('td', null, i.saudi)); })),
      h('caption', { style: { captionSide: 'bottom', textAlign: 'start', paddingTop: '8px' }, class: 'small muted' }, 'Approximate conversions for comparison only; exam boards set their own grade boundaries each session.'));
  }

  function goalsBox(child) {
    const goals = A.goalsProgress(KH.store.data, child.id, u.today());
    const add = h('button', { class: 'btn small', onclick: () => KH.crud.edit('goals', null, { preset: { childId: child.id } }) }, '+ New goal');
    if (!goals.length) return h('div', null, h('div', { class: 'muted small', style: { marginBottom: '8px' } }, KH.app.isParent() ? 'No goals yet.' : 'No goals yet. Set one and watch it fill up.'), add);
    return h('div', null, goals.slice(0, 5).map(g => h('div', { style: { marginBottom: '12px' } },
      h('div', { class: 'row' }, h('b', { class: 'ux' }, g.label), h('div', { class: 'spacer' }),
        u.chip(g.status === 'met' ? 'reached' : g.status === 'no data' ? 'no marks yet' : g.kind === 'Subject mark' ? `${Math.round(g.gap * 10) / 10} to go` : `${g.pct}%`, g.status === 'met' ? 'good' : g.status === 'close' ? 'warn' : g.status === 'behind' ? 'bad' : 'info')),
      u.svg(KH.charts.progress(g.pct, g.status === 'met' ? 'var(--good)' : g.kind === 'Subject mark' && g.current !== null ? `var(--${u.band(g.current)})` : null)),
      h('div', { class: 'small muted' }, [g.current === null ? '' : `now ${g.current}${g.unit ? ' ' + g.unit : ''}`, g.agreed ? 'agreed' : '', g.reward ? `reward: ${g.reward}` : ''].filter(Boolean).join(' · ')))),
      h('div', { class: 'row' }, add, h('a', { href: '#/goals', class: 'small' }, goals.length > 5 ? `All ${goals.length} goals` : 'Open goals')));
  }

  function weakTopics(child) {
    const list = A.examWeakTopics(KH.store.data, child.id);
    if (!list.length) {
      const any = (KH.store.data.examDetails || []).some(e => e.childId === child.id);
      return h('div', { class: 'muted small' }, any ? 'No topic has been missed more than once yet.' : 'Exam question details arrive with "Update from SABIS", or enter marked exams in "Exam right & wrong".');
    }
    return h('div', null, list.slice(0, 10).map(t => h('div', { class: 'finding medium' }, h('b', null, `${t.subject} - ${t.topic}`), h('div', { class: 'small' }, t.advice))));
  }

  function reportList(child, s) {
    const reps = A.reportsFor(KH.store.data, child.id).filter(r => r.year === s.year && r.term === s.term);
    const superseded = (KH.store.data.reports || []).filter(r => r.childId === child.id && r.year === s.year && r.term === s.term && r.superseded);
    if (!reps.length) return h('div', { class: 'muted small' }, 'No reports for this term.');
    return h('div', null, h('table', { class: 'list' }, h('tbody', null, reps.map(r => h('tr', null,
      h('td', null, r.source === 'sabis' ? h('span', null, u.chip('SABIS', 'accent'), ' ', r.note || '') : (r.note || r.source || 'Report')),
      h('td', { class: 'small muted' }, r.source === 'sabis' && r.syncedAt ? `updated ${u.when(r.syncedAt)}` : u.fmtDate(String(r.importedAt || '').slice(0, 10))),
      h('td', { class: 'right' }, h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        r.photo ? h('button', { class: 'btn small', onclick: () => window.hub.open(r.photo) }, 'Picture') : null,
        KH.app.isParent() && r.source !== 'sabis' ? h('button', { class: 'btn small', onclick: () => KH.pages.editReport(r) }, 'Edit marks') : null,
        KH.app.isParent() ? h('button', { class: 'btn small danger', onclick: async () => { if (await u.confirm(r.source === 'sabis' ? 'Delete the SABIS marks for this term? They will not come back with the next update.' : 'Delete this report and its marks?', 'Delete')) { KH.store.remove('reports', r.id); KH.app.refresh(); } } }, 'Delete') : null)))))),
      superseded.length ? h('div', { class: 'small muted', style: { marginTop: '8px' } }, `${superseded.length} report${superseded.length === 1 ? '' : 's'} typed in or read from a picture for this term ${superseded.length === 1 ? 'is' : 'are'} kept but no longer counted, because SABIS has the marks.`) : null);
  }

  function archive(child, current) {
    const ts = A.terms(KH.store.data, child.id);
    return h('table', { class: 'list' }, h('thead', null, h('tr', null, ['Year', 'Term', 'Overall', 'Marks', ''].map(t => h('th', null, t)))),
      h('tbody', null, ts.slice().reverse().map(t => { const s = A.termSummary(KH.store.data, child.id, t.year, t.term); const cur = t.year === current.year && t.term === current.term;
        return h('tr', { class: 'click', onclick: () => { termSel[child.id] = t; KH.app.refresh(); } }, h('td', null, t.year), h('td', null, t.term), h('td', null, u.grade(s.overall)), h('td', null, s.marksCount), h('td', null, cur ? u.chip('showing', 'info') : '')); })));
  }

  const BAND_HEX = { g95: '#15803D', g90: '#4ADE80', g85: '#1D4ED8', g80: '#60A5FA', g75: '#CA8A04', g70: '#FACC15', g65: '#EA580C', g60: '#FB923C', g55: '#B91C1C', g50: '#F87171', g0: '#7F1D1D' };
  const BAND_INK = { g90: '#0B3B1F', g80: '#0B2556', g75: '#2E2100', g70: '#3A2B00', g60: '#3A1A00', g50: '#3B0B0B' };
  function pdfHtml(child, s) {
    const esc = u.esc;
    const bars = KH.charts.bars(s.courses.map(c => ({ label: c.course, value: c.avg, sub: `${c.marks} mark${c.marks === 1 ? '' : 's'}` })), { ref: s.overall, refLabel: 'Overall', title: `${child.name}: subject averages, ${s.term} ${s.year}`, width: 720, print: true });
    const mult = KH.charts.multiples(s.subjects, { ref: s.overall, print: true });
    const badge = v => { const b = u.band(v); return `<span style="display:inline-block;min-width:30px;text-align:center;padding:1px 6px;border-radius:6px;font-weight:700;background:${BAND_HEX[b] || '#ccc'};color:${BAND_INK[b] || '#fff'}">${v}</span>`; };
    const intl = s.courses.slice().sort((a, b) => b.avg - a.avg).map(c => { const i = A.international(c.avg); return `<tr><td>${esc(c.course)}</td><td>${badge(c.avg)}</td><td>${i.igcse}</td><td>${i.us}</td><td>${i.ib}</td><td>${i.saudi}</td></tr>`; }).join('');
    const att = attendanceOf(child.id, s.year, s.term);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><style>
      body{font-family:"Segoe UI",Arial,sans-serif;color:#151B2E;font-size:12px;margin:0 6px} h1{font-size:20px;margin:0} h2{font-size:14px;margin:18px 0 6px;color:#4F46E5}
      .muted{color:#556078} table{border-collapse:collapse;width:100%} td,th{border-bottom:1px solid #E3E7F1;padding:4px 6px;text-align:left}
      .f{border-left:3px solid #ccc;padding:3px 8px;margin:4px 0} .high{border-color:#C2371F}.medium{border-color:#9A5B00}.positive{border-color:#11744A}.info{border-color:#2852C9}
      svg{max-width:100%} .page{page-break-inside:avoid} .legend span{display:inline-block;margin-right:10px} .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:3px}</style></head><body>
      <h1>${esc(child.name)} - ${esc(s.term)} ${esc(s.year)}</h1>
      <div class="muted">${esc([child.grade ? 'Grade ' + child.grade : '', child.school].filter(Boolean).join(' · '))} · Overall ${s.overall} (${s.overallSource === 'school' ? 'from the school' : 'average of marks'}) · ${s.marksCount} marks · M. Ebrahim Family Hub, ${u.fmtDate(u.today())}</div>
      <div class="page">${bars}</div>
      <div class="legend muted">${[['g95', 'g90', '90-100'], ['g85', 'g80', '80-89'], ['g75', 'g70', '70-79'], ['g65', 'g60', '60-69'], ['g55', 'g50', '50-59'], ['g0', 'g0', 'below 50']].map(([a, b, l]) => `<span><i style="background:${BAND_HEX[a]}"></i>${a !== b ? `<i style="background:${BAND_HEX[b]}"></i>` : ''}${l}</span>`).join('')}</div>
      <h2>What stands out</h2>${s.findings.filter(f => f.type !== 'sick').map(f => `<div class="f ${f.severity}">${esc(f.text)}</div>`).join('')}
      ${att && (att.absences !== null || att.infractions !== null) ? `<h2>Attendance and behaviour (SABIS)</h2><div>${att.absences !== null ? `${att.absences} absence${att.absences === 1 ? '' : 's'}` : ''}${att.infractions !== null ? ` · ${att.infractions} behaviour note${att.infractions === 1 ? '' : 's'}` : ''}</div>` : ''}
      <div class="page">${mult}</div>
      <h2>Action plan</h2><ul>${s.actions.map(a => `<li>${esc(a.text)}</li>`).join('')}</ul>
      <h2>International comparison (approximate)</h2><table><tr><th>Subject</th><th>Average</th><th>IGCSE</th><th>US</th><th>IB</th><th>Saudi</th></tr>${intl}</table>
      <h2>Questions for the school</h2><ul>${s.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>
      </body></html>`;
  }

  // Rising and sliding: the overall over the term, what moved, and this term against the last.
  function changeCharts(child, s) {
    const data = KH.store.data, kid = !KH.app.isParent();
    const low = KH.store.settings().lowMark;
    const tl = A.overallTimeline(data, child.id, s.year, s.term);
    const mv = A.movers(data, child.id, s.year, s.term);
    const cmp = A.termCompare(data, child.id, s.year, s.term);
    const cards = [];
    const over = KH.charts.overTime(tl, { ref: low, refLabel: 'Low mark' });
    if (over) {
      cards.push(u.section(kid ? 'Your overall this term' : `${child.name}'s overall this term`,
        h('div', { class: 'small muted', style: { marginTop: '-6px' } }, tl.source === 'marks' ? 'Worked out again for every week that brought marks.' : 'The overall after each SABIS update.'),
        u.svg(over),
        h('div', { class: 'chart-key' }, h('span', null, h('i', { class: 'dot' }), 'overall by week'), tl.updates.length ? h('span', null, h('i', { class: 'dia' }), 'SABIS update') : null, h('span', null, u.isPhone() ? 'tap for details' : 'hover for details'))));
    }
    if (mv) {
      const basis = mv.basis === 'update' ? `In the SABIS update of ${u.fmtDateTime(mv.at)}` : 'In the last four weeks of marks';
      const body = mv.items.length ? u.svg(KH.charts.moved(mv.items)) : h('div', { class: 'muted' }, 'No subject moved.');
      const best = mv.items.filter(x => x.change > 0)[0], worst = mv.items.filter(x => x.change < 0).slice(-1)[0];
      cards.push(u.section(kid ? 'What moved for you' : 'What moved',
        h('div', { class: 'small muted', style: { marginTop: '-6px', marginBottom: '6px' } }, `${basis}. Overall ${mv.overallBefore} → ${mv.overallAfter}.`),
        body,
        kid && best ? h('div', { class: 'kid-cheer' }, `You went up ${best.change} in ${best.course}. Keep going!`) : null,
        kid && worst ? h('div', { class: 'kid-cheer push' }, `${worst.course} needs a push (${worst.change}). A goal for it can help.`) : null));
    }
    if (cmp) {
      cards.push(u.section('This term vs last term',
        h('div', { class: 'small muted', style: { marginTop: '-6px', marginBottom: '6px' } }, `${cmp.prev.term} ${cmp.prev.year} → ${s.term} ${s.year}. Overall ${cmp.overallBefore} → ${cmp.overallAfter}.`),
        u.svg(KH.charts.termVs(cmp, { prevLabel: `${cmp.prev.term} ${cmp.prev.year}`, curLabel: `${s.term} ${s.year}` }))));
    }
    return cards.length ? h('div', { class: 'grid g2' }, cards) : null;
  }

  function attendanceOf(childId, year, term) {
    const r = (KH.store.data.reports || []).find(x => x.childId === childId && x.year === year && x.term === term && x.source === 'sabis' && x.attendance);
    return r ? r.attendance : null;
  }

  function overview(child) {
    const ts = A.terms(KH.store.data, child.id);
    const wrap = h('div');
    if (!ts.length) {
      wrap.appendChild(u.section(null, h('div', { class: 'empty' }, 'No marks yet for ' + child.name + '.'),
        KH.app.isParent() ? h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn primary', onclick: () => KH.app.go('#/add') }, '+ Add marks'), KH.sabisButton()) : null));
      return wrap;
    }
    const sel = termSel[child.id] && ts.find(t => t.year === termSel[child.id].year && t.term === termSel[child.id].term) ? termSel[child.id] : ts[ts.length - 1];
    const s = A.termSummary(KH.store.data, child.id, sel.year, sel.term, { health: KH.app.isParent() });
    const st = A.studyStats(KH.store.data, child.id, u.today());
    const nb = A.nextBirthday(child.dob, u.today());
    const lows = s.courses.filter(c => c.avg < KH.store.settings().lowMark);
    const att = attendanceOf(child.id, s.year, s.term);

    wrap.appendChild(h('div', { class: 'row', style: { marginBottom: '14px' } },
      h('select', { style: { width: '220px' }, onchange: e => { const [y, t] = e.target.value.split('|'); termSel[child.id] = { year: y, term: t }; KH.app.refresh(); } },
        ts.slice().reverse().map(t => h('option', { value: `${t.year}|${t.term}`, selected: t.year === sel.year && t.term === sel.term }, `${t.term} ${t.year}`))),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn', onclick: () => KH.app.go(`#/child/${child.id}/subjects`) }, u.icon('chart'), 'Subject analysis'),
      h('button', { class: 'btn', onclick: () => KH.app.go(`#/career/${child.id}`) }, u.icon('path'), 'Future path'),
      h('button', { class: 'btn', onclick: async () => { const rel = await window.hub.pdf(pdfHtml(child, s), `${child.name} ${s.term} ${s.year}`); if (rel) u.toast('PDF saved in the exports folder'); return rel; } }, u.icon('print'), 'Export PDF'),
      KH.app.isParent() ? h('button', { class: 'btn primary', onclick: () => { KH.pages.importPreset = { childId: child.id, year: s.year, term: s.term }; KH.app.go('#/add'); } }, '+ Add marks') : null));

    const overallCard = h('div', { class: 'card tight' }, h('div', { class: 'stat-label' }, 'Overall'),
      h('div', { class: 'row', style: { gap: '10px', alignItems: 'center' } }, h('div', { class: 'stat' }, u.counter(s.overall, { dec: String(s.overall).includes('.') ? 1 : 0 })), h('span', { class: `gb ${u.band(s.overall)}`, style: { minWidth: '14px', height: '14px', padding: 0, borderRadius: '5px' } })),
      h('div', { class: 'small muted' }, s.overallSource === 'school' ? 'from the school report' : 'average of the marks'));
    wrap.appendChild(h('div', { class: 'grid g4' },
      overallCard,
      u.stat('Marks this term', s.marksCount, `${s.courses.length} subjects`),
      u.stat(`Below ${KH.store.settings().lowMark}`, lows.length, lows.map(c => c.course).join(', ') || 'none'),
      att && att.absences !== null ? u.stat('Absences this term', att.absences, att.infractions ? `${att.infractions} behaviour note${att.infractions === 1 ? '' : 's'}` : 'no behaviour notes')
        : u.stat('Study this week', `${st.last7} h`, st.streak ? `${st.streak}-day streak` : (nb && nb.inDays <= 30 ? `birthday in ${nb.inDays} days` : 'log hours in Study hours'))));

    const alerts = A.alerts(KH.store.data, u.today(), { childId: child.id, parent: KH.app.isParent(), hideAmounts: KH.lock.hidden(), noMoney: KH.access.noMoney() }).filter(a => a.kind !== 'analysis');
    if (alerts.length) wrap.appendChild(u.section('Coming up', KH.alertList(alerts, 6)));

    wrap.appendChild(h('div', { class: 'grid g2' },
      u.section('Where ' + (KH.app.isParent() ? child.name + ' stands' : 'you stand'),
        u.svg(KH.charts.bars(s.courses.map(c => ({ label: c.course, value: c.avg, sub: `${c.marks} mark${c.marks === 1 ? '' : 's'}` })), { ref: s.overall, refLabel: 'Overall' })),
        u.gradeLegend()),
      u.section('What stands out', s.findings.length ? h('div', null, s.findings.map(f => h('div', { class: `finding ${f.severity}` }, f.text))) : h('div', { class: 'muted' }, 'Nothing unusual.'))));
    const change = changeCharts(child, s);
    if (change) wrap.appendChild(change);
    const mult = KH.charts.multiples(s.subjects, { ref: s.overall, title: KH.app.isParent() ? undefined : 'Which way each of your subjects is heading' });
    if (mult) wrap.appendChild(u.section(null, u.svg(mult)));
    wrap.appendChild(h('div', { class: 'grid g2' },
      u.section('Action plan', actionPlan(child, s)),
      h('div', null,
        u.section('Goals', goalsBox(child)),
        u.section('Weak topics from marked exams', weakTopics(child)),
        KH.app.isParent() ? u.section('Questions for the school', h('ul', { style: { margin: 0, paddingInlineStart: '18px' } }, s.questions.map(q => h('li', null, q)))) : null)));
    wrap.appendChild(u.section('International comparison', intlTable(s)));
    wrap.appendChild(h('div', { class: 'grid g2' },
      u.section('Reports in this term', reportList(child, s)),
      u.section('All terms', archive(child, sel))));
    return wrap;
  }

  // ---------------- School (SABIS) tab ----------------
  function schoolTab(child) {
    const data = KH.store.data;
    const today = u.today();
    const reps = (data.reports || []).filter(r => r.childId === child.id && r.source === 'sabis' && r.attendance).sort((a, b) => String(b.year + b.term).localeCompare(String(a.year + a.term)));
    const exams = (data.examDetails || []).filter(e => e.childId === child.id && e.source === 'sabis').sort((a, b) => String(b.date || b.updatedAt).localeCompare(String(a.date || a.updatedAt)));
    const hw = (data.homework || []).filter(x => x.childId === child.id && !x.done).sort((a, b) => String(a.due || '9').localeCompare(String(b.due || '9')));
    const files = (data.documents || []).filter(d => d.childId === child.id && d.source === 'sabis').sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const tt = child.timetable && child.timetable.days;
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let showDay = dayNames[new Date().getDay()];
    if (tt && !tt[showDay]) { for (let i = 1; i < 7; i++) { const d = dayNames[(new Date().getDay() + i) % 7]; if (tt[d]) { showDay = d; break; } } }
    if (!reps.length && !exams.length && !hw.length && !files.length && !tt) {
      return h('div', { class: 'card empty' }, KH.app.isParent() ? h('div', null, h('p', null, `Nothing from SABIS for ${child.name} yet.`), KH.sabisButton()) : 'Nothing from SABIS yet.');
    }
    const attCard = reps.length ? u.section('Absences and behaviour', reps.slice(0, 3).map(r => {
      const a = r.attendance;
      return h('div', { style: { marginBottom: '14px' } },
        h('div', { class: 'row', style: { marginBottom: '6px' } }, h('b', null, `${r.term} ${r.year}`), h('div', { class: 'spacer' }),
          u.chip(`${a.absences || 0} absence${a.absences === 1 ? '' : 's'}`, a.absences ? 'warn' : 'good'), u.chip(`${a.infractions || 0} behaviour note${a.infractions === 1 ? '' : 's'}`, a.infractions ? 'bad' : 'good')),
        (a.absenceLines || []).length ? h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'Absence details'), h('ul', { class: 'small muted' }, a.absenceLines.map(l => h('li', null, l)))) : null,
        (a.disciplineLines || []).length ? h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'Behaviour notes'), h('ul', { class: 'small muted' }, a.disciplineLines.map(l => h('li', null, l)))) : null,
        a.studentLife ? h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'Student life'), h('div', { class: 'small muted', style: { whiteSpace: 'pre-line' } }, a.studentLife)) : null,
        a.remarks ? h('div', { class: 'small', style: { marginTop: '6px' } }, h('b', null, 'Remarks: '), a.remarks) : null);
    })) : null;
    const examCard = exams.length ? u.section('Exam questions from SABIS', h('table', { class: 'list' },
      h('thead', null, h('tr', null, ['Exam', 'Mark', 'Right', 'Missed topics'].map(t => h('th', null, t)))),
      h('tbody', null, exams.slice(0, 25).map(e => {
        const wrong = (e.questions || []).filter(q => !q.correct);
        const right = (e.questions || []).length - wrong.length;
        return h('tr', null, h('td', null, h('div', { style: { fontWeight: 600 } }, e.subject), h('div', { class: 'small muted' }, `${e.title}${e.date ? ' · ' + u.fmtShort(e.date) : ''}`)),
          h('td', null, e.score !== null && e.score !== undefined ? u.grade(e.score) : '-'),
          h('td', { class: 'nowrap' }, `${right}/${(e.questions || []).length}`),
          h('td', { class: 'small' }, wrong.length ? Array.from(new Set(wrong.map(q => q.topic))).slice(0, 4).join('; ') : h('span', { class: 'muted' }, 'none')));
      }))), exams.length > 25 ? h('div', { class: 'small muted' }, `Showing the latest 25 of ${exams.length}. All of them count in "Weak topics".`) : null) : null;
    const hwCard = u.section('Homework', hw.length ? hw.slice(0, 10).map(x => {
      const d = x.due ? A.daysBetween(today, x.due) : null;
      return h('div', { class: 'task' }, h('input', { type: 'checkbox', onchange: e => { KH.store.upsert('homework', Object.assign({}, x, { done: e.target.checked })); KH.app.refresh(); } }),
        h('div', { style: { flex: 1 } }, h('div', { class: 't', style: { fontWeight: 600 } }, `${x.subject ? x.subject + ': ' : ''}${x.title}`), x.details && !x.details.includes(x.title) ? h('div', { class: 'small muted' }, x.details.slice(0, 160)) : null),
        d === null ? null : u.chip(d < 0 ? `was due ${u.fmtShort(x.due)}` : d === 0 ? 'due today' : d === 1 ? 'due tomorrow' : `due ${u.fmtShort(x.due)}`, d < 0 ? 'bad' : d <= 1 ? 'medium' : 'info'));
    }) : h('div', { class: 'muted small' }, 'No homework to do.'), h('a', { class: 'small', href: '#/school/homework' }, 'All homework'));
    const ttCard = tt ? u.section(`Timetable · ${showDay}`, h('table', { class: 'list' }, h('tbody', null, (tt[showDay] || []).map(p => h('tr', null, h('td', { class: 'nowrap' }, h('b', null, p.name)), h('td', { class: 'small muted nowrap', 'data-noi18n': '1' }, p.time), h('td', null, p.subject || '-'))))),
      h('a', { class: 'small', href: '#/school/timetable' }, 'Whole week')) : null;
    const filesCard = files.length ? u.section('Files from SABIS', h('table', { class: 'list' }, h('tbody', null, files.slice(0, 12).map(d => h('tr', null,
      h('td', null, h('div', { style: { fontWeight: 600 } }, d.title), h('div', { class: 'small muted' }, [d.type === 'Report card' ? 'Report' : d.category, d.subject].filter(Boolean).join(' · '))),
      h('td', { class: 'small muted nowrap' }, u.fmtShort(d.date)),
      h('td', { class: 'right' }, d.file && d.file.rel ? h('button', { class: 'btn small', onclick: () => window.hub.open(d.file.rel).catch(e => u.toast(e.message, 'bad')) }, 'Open') : h('span', { class: 'small muted' }, 'on SABIS')))))),
      h('a', { class: 'small', href: '#/school/files' }, `All files (${files.length})`)) : null;
    return h('div', null,
      h('div', { class: 'grid g2' }, h('div', null, attCard, hwCard), h('div', null, ttCard, filesCard)),
      examCard,
      u.section('Weak topics across exams', weakTopics(child)));
  }

  function profile(child) {
    const age = u.ageOf(child.dob);
    const nb = A.nextBirthday(child.dob, u.today());
    const rows = [['Date of birth', child.dob ? `${u.fmtDate(child.dob)}${age !== null ? ` (age ${age})` : ''}` : ''], ['Next birthday', nb ? `${u.fmtDate(nb.date)} - in ${nb.inDays} days` : ''],
      ['School', child.school], ['Curriculum', child.curriculum], ['Grade / section', [child.grade, child.section].filter(Boolean).join(' / ')], ['School number', child.schoolId],
      ['Interests', (child.interests || []).join(', ')], ['Health notes', child.health], ['Notes', child.notes]];
    const diary = (KH.store.data.diary || []).filter(d => !d.childId || d.childId === child.id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const ach = (KH.store.data.achievements || []).filter(d => d.childId === child.id).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return h('div', { class: 'grid g2' },
      u.section('Profile', h('div', { class: 'row', style: { marginBottom: '12px' } }, KH.avatar(child, 56), h('div', null, h('h2', { style: { margin: 0 } }, child.name))),
        h('table', { class: 'list' }, h('tbody', null, rows.map(([k, v]) => h('tr', null, h('td', { class: 'muted', style: { width: '150px' } }, k), h('td', null, v || ''))))),
        KH.app.isParent() ? h('button', { class: 'btn', style: { marginTop: '10px' }, onclick: () => KH.crud.edit('children', child) }, 'Edit profile') : null),
      h('div', null,
        u.section('Achievements', ach.length ? h('div', null, ach.map(a => h('div', { class: 'finding positive' }, h('b', null, a.title), h('div', { class: 'small muted' }, `${u.fmtDate(a.date)} · ${a.category || ''}`)))) : h('div', { class: 'muted small' }, 'None recorded yet.')),
        KH.pages.healthBlock ? KH.pages.healthBlock(child) : null,
        KH.app.isParent() ? u.section('School diary', diary.length ? h('div', null, diary.map(d => h('div', { class: 'finding info' }, h('b', null, d.kind), h('div', { class: 'small muted' }, `${u.fmtDate(d.date)}${d.school ? ' · ' + d.school : ''}${d.notes ? ' · ' + d.notes : ''}`)))) : h('div', { class: 'muted small' }, 'No entries yet.')) : null));
  }

  KH.pages.child = function (id, tab) {
    const child = KH.store.child(id);
    if (!child) return h('div', { class: 'empty' }, 'Child not found.');
    const t = tab || 'overview';
    const line = [child.grade ? `Grade ${child.grade}` : '', child.section, child.school].filter(Boolean).join(' · ');
    const hero = h('div', { class: 'row', style: { marginBottom: '14px', gap: '12px' } }, KH.avatar(child, 44),
      h('div', { class: 'muted', style: { fontWeight: 600 } }, line || (KH.app.isParent() ? 'Add the grade and school in the profile' : '')));
    const tabs = h('div', { class: 'tabs' },
      h('a', { class: t === 'overview' ? 'active' : '', href: `#/child/${id}` }, 'Overview'),
      h('a', { class: t === 'subjects' ? 'active' : '', href: `#/child/${id}/subjects` }, 'Subjects'),
      KH.routineStrip && KH.features.on('routine') && KH.access.allows('#/routine') ? h('a', { class: t === 'routine' ? 'active' : '', href: `#/child/${id}/routine` }, 'Routine & points') : null,
      h('a', { class: t === 'school' ? 'active' : '', href: `#/child/${id}/school` }, 'School (SABIS)'),
      h('a', { class: t === 'profile' ? 'active' : '', href: `#/child/${id}/profile` }, 'Profile & milestones'),
      h('a', { href: `#/career/${id}` }, 'Future path'));
    // a child's own page opens with a big hello, the date and the time
    const clock = !KH.app.isParent() && KH.shell && t === 'overview' ? KH.shell.hero(String(KH.store.user.displayName || child.name || '').split(/\s+/)[0], line || null) : null;
    // version 4.3: the day at a glance (check-ins, points, challenges) on a child's own page
    const strip = !KH.app.isParent() && t === 'overview' && KH.routineStrip ? KH.routineStrip(child) : null;
    return h('div', null, clock, clock ? null : hero, strip, tabs, t === 'profile' ? profile(child) : t === 'school' ? schoolTab(child) : t === 'subjects' ? KH.pages.subjectsTab(child)
      : t === 'routine' && KH.pages.routineChild ? KH.pages.routineChild(child) : overview(child));
  };
})();
