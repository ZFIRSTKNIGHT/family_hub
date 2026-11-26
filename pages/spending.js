// Spending register (version 4.3, stage 2; parents only, never the children). Money a parent spends
// on one child or on all of them, with totals per child by month and by year. An expense for all the
// children (or for several) is shared equally between them in the per-child totals. It sits behind
// the money PIN, and the other parent account sees it only when the organiser turns it on in Control.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const R = () => KH.routine;
  let year = null;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  KH.pages.spending = function () {
    const data = KH.store.data;
    const kids = KH.store.children();
    const cur = KH.store.settings().currency || 'SAR';
    const first = R().spendingTotals(data, new Date().getFullYear());
    const years = Array.from(new Set([String(new Date().getFullYear())].concat(first.years))).sort().reverse();
    if (!year || !years.includes(year)) year = years[0];
    const T = R().spendingTotals(data, year);
    const money = v => (v ? u.amount(v) : '-');
    const cats = Object.entries(T.byCategory).sort((a, b) => b[1] - a[1]);
    const maxCat = cats.length ? cats[0][1] : 1;
    return h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Money spent on one child or all of them. Parents only: the children never see it. An expense for several children is shared equally between them in the totals.'),
      h('div', { class: 'row', style: { marginBottom: '12px', gap: '8px' } },
        h('select', { style: { width: '120px' }, onchange: e => { year = e.target.value; KH.app.refresh(); } }, years.map(y => h('option', { value: y, selected: y === year }, y))),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: () => KH.crud.edit('spending') }, '+ Add expense')),
      h('div', { class: `grid ${kids.length + 1 >= 4 ? 'g4' : 'g3'}` },
        u.stat(`All children, ${year}`, KH.lock.hidden() ? '•••••' : u.money(T.total), `${cur} · ${T.count} expense${T.count === 1 ? '' : 's'}`),
        kids.map(c => u.stat(c.name, KH.lock.hidden() ? '•••••' : u.money(T.byChild[c.id] || 0), cur))),
      u.section(`By month, ${year}`, h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'list' },
        h('thead', null, h('tr', null, h('th', null, 'Month'), kids.map(c => h('th', { class: 'right', 'data-noi18n': '1' }, c.name)), h('th', { class: 'right' }, 'Total'))),
        h('tbody', null, T.months.filter(m => m.total).map(m => h('tr', null, h('td', null, MONTHS[m.month - 1]),
          kids.map(c => h('td', { class: 'right nowrap' }, money(m.byChild[c.id]))), h('td', { class: 'right nowrap', style: { fontWeight: 800 } }, money(m.total)))),
          T.count ? null : h('tr', null, h('td', { colspan: kids.length + 2, class: 'empty' }, 'Nothing recorded for this year.'))),
        T.count ? h('tfoot', null, h('tr', null, h('td', { style: { fontWeight: 800 } }, 'Year'), kids.map(c => h('td', { class: 'right nowrap', style: { fontWeight: 800 } }, money(T.byChild[c.id]))),
          h('td', { class: 'right nowrap', style: { fontWeight: 800 } }, money(T.total)))) : null))),
      cats.length ? u.section(`By category, ${year}`, cats.map(([k, v]) => h('div', { style: { marginBottom: '8px' } },
        h('div', { class: 'row small' }, h('span', null, k), h('div', { class: 'spacer' }), h('b', null, money(v))),
        h('div', { html: KH.charts.progress(v / maxCat * 100) })))) : null,
      KH.crud.list('spending', { noBar: true, filter: r => String(r.date || '').slice(0, 4) === year }));
  };
})();
