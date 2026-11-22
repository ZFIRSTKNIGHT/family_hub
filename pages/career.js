// Future path: career fields from cumulative marks and interests, qualification paths
// (IGCSE, SAT, IELTS/TOEFL, Qudurat/Tahsili, SABIS) and advice on recorded qualifications.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis, K = KH.knowledge;

  function interestsEditor(child) {
    const set = new Set(child.interests || []);
    const canEdit = KH.app.isParent() || (KH.store.user && KH.store.user.childId === child.id);
    return h('div', { class: 'checks' }, K.INTERESTS.map(i => h('label', null, h('input', { type: 'checkbox', checked: set.has(i), disabled: !canEdit, onchange: e => {
      if (e.target.checked) set.add(i); else set.delete(i);
      KH.store.upsert('children', Object.assign({}, child, { interests: Array.from(set) }));
      KH.app.refresh();
    } }), i)));
  }

  KH.pages.career = function (id) {
    const child = KH.store.child(id);
    if (!child) return h('div', { class: 'empty' }, 'Child not found.');
    const pa = A.pathAdvice(KH.store.data, id);
    const cd = pa.careers;
    const doms = Object.entries(cd.domains).sort((a, b) => b[1].avg - a[1].avg);
    const wrap = h('div');
    wrap.appendChild(h('div', { class: 'tabs' }, h('a', { href: `#/child/${id}` }, 'Overview'), h('a', { href: `#/child/${id}/profile` }, 'Profile & milestones'), h('a', { class: 'active', href: `#/career/${id}` }, 'Future path')));
    wrap.appendChild(h('div', { class: 'note', style: { marginBottom: '16px' } },
      `Reliability: ${cd.reliability}. Based on ${cd.years} school year${cd.years === 1 ? '' : 's'} of marks${cd.grade ? ` (Grade ${cd.grade})` : ''}, newer years counting more, plus the interests ticked below. Treat it as a conversation starter, not a verdict; it firms up as more years are added.`));
    if (!cd.fields.length) { wrap.appendChild(u.section(null, h('div', { class: 'empty' }, 'Add marks to see suggestions.'))); return wrap; }
    wrap.appendChild(h('div', { class: 'grid g2' },
      u.section('Career fields that fit best', u.svg(KH.charts.bars(cd.fields.slice(0, 6).map((f, i) => ({ label: f.label, value: f.score, sub: f.enoughData ? f.why.join(', ') : 'not enough subjects yet', color: i === 0 ? 'var(--accent)' : 'var(--muted)' })), { showGap: false })),
        h('div', null, cd.fields.slice(0, 3).map(f => h('div', { class: 'finding info' }, h('b', null, f.label), h('div', { class: 'small' }, `Examples: ${f.examples}.`),
          h('div', { class: 'small muted' }, `Usually needs: ${f.needs.join(', ')}.${f.weakest ? ` Weakest related subject now: ${f.weakest}.` : ''}${f.matched.length ? ` Matches interests: ${f.matched.join(', ')}.` : ''}`))))),
      h('div', null,
        u.section('Interests', h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Tick what genuinely interests them; it nudges the suggestions.'), interestsEditor(child)),
        u.section('Cumulative averages by subject area', h('table', { class: 'list' }, h('tbody', null, doms.map(([d, v]) => { const i = A.international(v.avg);
          return h('tr', null, h('td', null, K.domainLabel(d)), h('td', null, h('b', null, v.avg)), h('td', { class: 'small muted' }, `${v.terms} term${v.terms === 1 ? '' : 's'}`), h('td', { class: 'small' }, `IGCSE ${i.igcse} · US ${i.us}`)); }))))))) ;
    wrap.appendChild(h('div', { class: 'grid g2' }, pa.items.map(it => u.section(it.title, h('ul', { style: { margin: 0, paddingLeft: '18px' } }, it.lines.map(l => h('li', { style: { marginBottom: '4px' } }, l)))))));
    const qa = A.qualificationAdvice(KH.store.data, id);
    wrap.appendChild(u.section('Recorded qualifications',
      qa.length ? h('div', null, qa.map(q => h('div', { class: 'finding info' }, h('b', null, q.title), h('ul', { style: { margin: '4px 0 0', paddingLeft: '18px' } }, q.lines.map(l => h('li', { class: 'small' }, l))))))
        : h('div', { class: 'muted small' }, 'Record IGCSE subjects, SAT dates, IELTS and others in Qualifications to get advice on each.'),
      h('div', { style: { marginTop: '10px' } }, KH.crud.list('qualifications', { childId: id, noBar: !KH.app.isParent(), preset: { childId: id } }))));
    return wrap;
  };

  KH.pages.careers = function () {
    const kids = KH.store.children();
    return h('div', null, h('p', { class: 'muted', style: { marginTop: 0 } }, 'Each child\'s leading career fields and path advice. Open a child for details.'),
      h('div', { class: 'grid g3' }, kids.map(c => {
        const cd = A.careerDirection(KH.store.data, c.id);
        return h('div', { class: 'card kid-card', onclick: () => KH.app.go(`#/career/${c.id}`) },
          h('div', { class: 'kid-head' }, KH.avatar(c), h('div', null, h('b', null, c.name), h('div', { class: 'small muted' }, cd.reliability))),
          cd.fields.slice(0, 3).map((f, i) => h('div', { class: 'row', style: { marginBottom: '4px' } }, h('span', null, `${i + 1}. ${f.label}`), h('div', { class: 'spacer' }), h('b', null, f.score))));
      })));
  };
})();
