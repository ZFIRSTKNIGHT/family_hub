// Home page for the parent: SABIS update, each child at a glance, what needs attention,
// news from school, homework, patterns across the children and what is coming up.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;

  function avatar(c, size) {
    const s = size || 38;
    if (c.photo && c.photo.rel) return h('img', { class: 'avatar', style: { width: s + 'px', height: s + 'px', objectFit: 'cover' }, src: window.hub.fileUrl(c.photo.rel), alt: '' });
    return h('div', { class: 'avatar', style: { background: KH.kidGradient ? KH.kidGradient(c) : KH.kidColor(c), width: s + 'px', height: s + 'px', fontSize: Math.round(s * 0.4) + 'px' } }, u.initials(c.name));
  }
  KH.avatar = avatar;

  const KIND_LABEL = { analysis: 'Analysis', payment: 'Payment', birthday: 'Birthday', health: 'Health', lunch: 'Lunch', homework: 'Homework', upcoming: 'Coming up', goal: 'Goal', kid: 'From the children', routine: 'Routine' };
  function alertList(list, limit) {
    if (!list.length) return h('div', { class: 'empty' }, 'Nothing needs your attention right now.');
    return h('div', null, list.slice(0, limit || 12).map((a, i) => h('div', { class: 'alert-item', style: { animationDelay: `${Math.min(i, 8) * 0.04}s` } },
      u.chip(KIND_LABEL[a.kind] || 'Coming up', a.severity),
      h('div', null, h('div', { class: 'ux', style: { fontWeight: 600 } }, a.title), a.body ? h('div', { class: 'small muted ux' }, a.body) : null))));
  }
  KH.alertList = alertList;

  // The biggest rise and fall in the latest update (or the last four weeks of marks).
  function movedLine(c, s) {
    if (!s) return null;
    const mv = A.movers(KH.store.data, c.id, s.year, s.term);
    if (!mv || !mv.items.length) return null;
    const ups = mv.items.filter(x => x.change > 0).slice(0, 2), downs = mv.items.filter(x => x.change < 0).slice(-2).reverse();
    const fmt = v => (v > 0 ? `+${v}` : `−${Math.abs(v)}`);
    return h('span', { class: 'moved-line' },
      ups.map(x => h('span', { class: 'up' }, `▲ ${x.course} ${fmt(x.change)}`)),
      downs.map(x => h('span', { class: 'down' }, `▼ ${x.course} ${fmt(x.change)}`)));
  }

  function kidCard(c, i) {
    const data = KH.store.data;
    const S = KH.store.settings();
    const s = A.latestSummary(data, c.id);
    const st = A.studyStats(data, c.id, u.today());
    const nb = A.nextBirthday(c.dob, u.today());
    const next = A.calendarItems(data, { childId: c.id }).find(x => x.type === 'exam' && x.date >= u.today());
    const downs = s ? s.subjects.filter(x => x.direction === 'down') : [];
    const ups = s ? s.subjects.filter(x => x.direction === 'up') : [];
    const lows = s ? s.courses.filter(x => x.avg < S.lowMark) : [];
    const hwDue = (data.homework || []).filter(x => x.childId === c.id && !x.done && x.due && x.due >= u.today() && A.daysBetween(u.today(), x.due) <= 2).length;
    const sick = A.sickStats(data, c.id, u.today()).current;
    const line = [c.grade ? `Grade ${c.grade}` : '', c.school].filter(Boolean).join(' · ') || 'Add school details in the profile';
    const card = h('button', { class: 'kcard', type: 'button', style: { animationDelay: `${i * 0.08}s` }, onclick: () => KH.app.go(`#/child/${c.id}`) },
      h('span', { class: 'top', style: { background: KH.kidGradient(c) } },
        h('span', { class: 'row', style: { gap: '10px', flexWrap: 'nowrap' } },
          c.photo && c.photo.rel ? h('img', { class: 'ini', src: window.hub.fileUrl(c.photo.rel), alt: '', style: { objectFit: 'cover' } }) : h('span', { class: 'ini' }, u.initials(c.name).slice(0, 1)),
          h('span', { style: { display: 'flex', flexDirection: 'column', minWidth: 0 } }, h('span', { style: { fontWeight: 800, fontSize: '17px' } }, c.name), h('span', { style: { fontSize: '12px', fontWeight: 600, opacity: 0.92 } }, line))),
        s ? h('span', { class: 'row', style: { alignItems: 'baseline', gap: '8px' } }, h('span', { class: 'big' }, u.counter(s.overall, { dec: String(s.overall).includes('.') ? 1 : 0 })),
          h('span', { style: { fontSize: '12.5px', fontWeight: 600, opacity: 0.95 } }, `${s.overallSource === 'school' ? 'overall' : 'average'} · ${s.term} ${s.year}`))
          : h('span', { style: { fontWeight: 600, opacity: 0.95 } }, 'No marks yet'),
        s ? h('span', { style: { display: 'block', height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,.25)', overflow: 'hidden' } },
          h('span', { class: 'bar-fg', style: { display: 'block', width: `${Math.max(4, Math.min(100, s.overall))}%`, background: `var(--${u.band(s.overall)})`, height: '6px' } })) : null),
      h('span', { class: 'chips' },
        lows.length ? u.chip(`${lows.length} below ${S.lowMark}`, 'bad') : null,
        downs.length ? u.chip(`${downs.length} sliding`, 'warn') : null,
        ups.length ? u.chip(`${ups.length} rising`, 'good') : null,
        sick ? u.chip('sick now', 'bad') : null,
        hwDue ? u.chip(`${hwDue} homework due`, 'medium') : null,
        u.chip(`${st.last7} h study this week`, 'info'),
        next ? u.chip(`next exam ${u.fmtShort(next.date)}`, '') : null,
        nb && nb.inDays <= 30 ? u.chip(nb.inDays === 0 ? 'birthday today' : `birthday in ${nb.inDays} days`, 'accent') : null),
      movedLine(c, s));
    card.style.setProperty('--kid', KH.kidColor(c));
    return card;
  }

  function schoolNews() {
    const anns = (KH.store.data.announcements || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 4);
    const last = (KH.store.settings().sabis || {}).last;
    if (!anns.length && !last) return null;
    return u.section('From school',
      last ? h('div', { class: 'small muted', style: { marginTop: '-6px', marginBottom: '10px' } }, `Last SABIS update: ${u.when(last.at)}${last.ok ? '' : ' (did not finish)'}`) : null,
      anns.length ? h('div', null, anns.map(a => h('div', { class: 'news-item', style: { cursor: 'pointer' }, onclick: () => KH.app.go('#/school/announcements') },
        a.important ? u.chip('Important', 'high') : u.chip(a.general ? 'Everyone' : (a.forKids || []).map(id => KH.store.childName(id)).join(', ') || 'School', 'info'),
        h('div', { style: { minWidth: 0 } }, h('div', { class: 'ux', style: { fontWeight: 600 } }, a.title), h('div', { class: 'small muted ux', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, String(a.text || '').replace(/\s+/g, ' ').slice(0, 120)), h('div', { class: 'small muted' }, u.fmtShort(a.date))))))
        : h('div', { class: 'muted small' }, 'No announcements yet.'),
      h('a', { class: 'small', href: '#/school/announcements' }, 'All announcements'));
  }

  function homeworkDue() {
    const today = u.today();
    const list = (KH.store.data.homework || []).filter(x => !x.done && x.due && x.due >= today && A.daysBetween(today, x.due) <= 3).sort((a, b) => String(a.due).localeCompare(String(b.due)));
    if (!list.length) return null;
    return u.section('Homework due soon', h('table', { class: 'list' }, h('tbody', null, list.slice(0, 8).map(x => h('tr', { class: 'click', onclick: () => KH.app.go('#/school/homework') },
      h('td', { class: 'nowrap' }, h('span', { class: 'dot', style: { background: KH.kidColor(KH.store.child(x.childId)), marginInlineEnd: '6px' } }), KH.store.childName(x.childId)),
      h('td', null, `${x.subject ? x.subject + ': ' : ''}${x.title || ''}`),
      h('td', { class: 'right nowrap' }, A.daysBetween(today, x.due) === 0 ? u.chip('today', 'high') : A.daysBetween(today, x.due) === 1 ? u.chip('tomorrow', 'medium') : u.fmtShort(x.due)))))));
  }

  KH.pages.dashboard = function () {
    const data = KH.store.data;
    const kids = KH.store.children();
    const hide = KH.lock.hidden();
    const alerts = A.alerts(data, u.today(), { hideAmounts: hide, noMoney: KH.access.noMoney() });
    const trends = A.commonTrends(data);
    const upcoming = A.calendarItems(data, { hideAmounts: hide, noMoney: KH.access.noMoney() }).filter(i => i.date >= u.today() && A.daysBetween(u.today(), i.date) <= 21).slice(0, 14);
    const first = String(KH.store.user.displayName || KH.store.user.username || '').split(/\s+/)[0];
    const latest = kids.map(c => A.latestSummary(data, c.id)).filter(Boolean)[0];
    const wrap = h('div');
    // the date, the time and a greeting for the time of day, with the term and the children
    const termLine = [latest ? `${latest.term} · ${latest.year}` : u.academicYear(), kids.map(k => k.name).join(', ')].filter(Boolean).join(' · ');
    if (KH.shell) wrap.appendChild(KH.shell.hero(first, termLine));
    else wrap.appendChild(h('div', { class: 'row', style: { marginBottom: '16px', alignItems: 'flex-end' } },
      h('div', null, h('div', { style: { fontSize: '22px', fontWeight: 800, letterSpacing: '-.02em' } }, `Welcome back, ${first}`),
        h('div', { class: 'muted', style: { fontWeight: 500 } }, termLine))));
    if (!kids.length) wrap.appendChild(h('div', { class: 'note', style: { marginBottom: '16px' } }, 'Start by adding the children in Child profiles.'));
    wrap.appendChild(KH.sabisPanel());
    wrap.appendChild(h('div', { class: 'kid-grid' }, kids.map(kidCard)));
    wrap.appendChild(h('div', { class: 'grid g2' },
      h('div', null,
        u.section('Needs attention', alertList(alerts, 14)),
        trends.length ? u.section('Patterns across the children', h('div', null, trends.map(t => h('div', { class: `finding ${t.severity}` }, t.text)))) : null),
      h('div', null,
        KH.routineHome ? KH.routineHome() : null,
        schoolNews(),
        homeworkDue(),
        u.section('Coming up (next 3 weeks)', upcoming.length ? h('table', { class: 'list' }, h('tbody', null, upcoming.map(i => h('tr', null,
          h('td', { class: 'nowrap' }, u.fmtShort(i.date)), h('td', null, h('span', { class: `ev ${i.type}`, style: { display: 'inline-block' } }, i.type)), h('td', null, i.title))))) : h('div', { class: 'empty' }, 'Nothing on the calendar.')),
        u.section('Quick actions', h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => KH.app.go('#/add') }, '+ Add marks'),
          h('button', { class: 'btn', onclick: () => KH.crud.edit('exams') }, '+ Exam date'),
          h('button', { class: 'btn', onclick: () => KH.pages.pasteSchedule() }, 'Paste exam schedule'),
          KH.access.noMoney() ? null : h('button', { class: 'btn', onclick: () => KH.crud.edit('payments') }, '+ Payment'),
          h('button', { class: 'btn', onclick: () => KH.crud.edit('meetings') }, '+ School meeting'),
          h('button', { class: 'btn', onclick: () => KH.crud.edit('achievements') }, '+ Achievement'))))));
    return wrap;
  };
})();
