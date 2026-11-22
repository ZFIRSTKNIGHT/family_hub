// Company reimbursement (parent only): the company pays a share of each eligible invoice
// up to a limit per period. Shows the company's share, what was received, what is pending,
// the remaining limit and what the family pays itself.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  let period = null;

  function periodOf(p, mode) {
    if (mode === 'calendar-year') return String(p.dueDate || p.paidDate || u.today()).slice(0, 4);
    if (mode === 'total') return 'All years';
    return p.year || u.academicYear(p.dueDate || p.paidDate);
  }

  // "Two thirds" is kept exact (66.67% would give 16,000.80 on a 24,000 invoice instead of 16,000).
  function shareFraction(pct) {
    const p = Number(pct);
    if (Math.abs(p - 200 / 3) < 0.01) return 2 / 3;
    if (Math.abs(p - 100 / 3) < 0.01) return 1 / 3;
    return p / 100;
  }
  const shareLabel = pct => (Math.abs(Number(pct) - 200 / 3) < 0.01 ? '2/3' : Math.abs(Number(pct) - 100 / 3) < 0.01 ? '1/3' : `${pct}%`);
  const round2 = x => Math.round(x * 100) / 100;

  function compute(mode, limit, share) {
    const pays = (KH.store.data.payments || []).filter(p => p.reimbursable).slice()
      .sort((a, b) => String(a.dueDate || a.paidDate || '').localeCompare(String(b.dueDate || b.paidDate || '')));
    const groups = new Map();
    for (const p of pays) {
      const key = periodOf(p, mode);
      const g = groups.get(key) || { key, invoices: 0, share: 0, claimable: 0, received: 0, pending: 0, notSubmitted: 0, rejected: 0, rows: [] };
      const amount = Number(p.amount) || 0;
      const wantShare = round2(amount * shareFraction(share));
      let claimable = 0;
      if (p.claimStatus !== 'rejected') claimable = round2(Math.max(0, Math.min(wantShare, limit - g.claimable)));
      g.invoices += amount; g.share += wantShare; g.claimable += claimable;
      const received = Number(p.reimbursedAmount) || 0;
      g.received += received;
      if (p.claimStatus === 'rejected') g.rejected += wantShare;
      else if (!p.claimStatus || p.claimStatus === 'not submitted') g.notSubmitted += claimable;
      else g.pending += Math.max(0, claimable - received);
      g.rows.push({ p, amount, claimable, received, capped: claimable < wantShare - 0.5 && p.claimStatus !== 'rejected' });
      groups.set(key, g);
    }
    return Array.from(groups.values()).sort((a, b) => String(b.key).localeCompare(String(a.key)));
  }

  KH.pages.reimburse = function () {
    const s = KH.store.settings();
    const limit = Number(s.reimburseLimit) || 100000;
    const share = Number(s.reimburseShare) || 66.67;
    const mode = s.reimbursePeriod || 'academic-year';
    const groups = compute(mode, limit, share);
    if (!period || !groups.find(g => g.key === period)) period = groups[0] ? groups[0].key : (mode === 'calendar-year' ? String(new Date().getFullYear()) : mode === 'total' ? 'All years' : u.academicYear());
    const g = groups.find(x => x.key === period) || { key: period, invoices: 0, share: 0, claimable: 0, received: 0, pending: 0, notSubmitted: 0, rejected: 0, rows: [] };
    const remaining = Math.max(0, limit - g.claimable);
    const outOfPocket = g.invoices - g.claimable;
    const cur = s.currency || 'SAR';
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '12px' } },
        h('span', { class: 'muted' }, `Company pays ${shareLabel(share)} of each eligible invoice, up to ${u.money(limit)} ${cur} per ${mode === 'academic-year' ? 'academic year' : mode === 'calendar-year' ? 'calendar year' : 'all years together'}, for all children together.`),
        h('div', { class: 'spacer' }),
        groups.length > 1 ? h('select', { style: { width: '160px' }, onchange: e => { period = e.target.value; KH.app.refresh(); } }, groups.map(x => h('option', { value: x.key, selected: x.key === period }, x.key))) : null,
        h('button', { class: 'btn', onclick: () => KH.app.go('#/settings') }, 'Change limit / share'),
        h('button', { class: 'btn primary', onclick: () => KH.crud.edit('payments', null, { preset: { reimbursable: true, claimStatus: 'not submitted' } }) }, '+ Eligible invoice')),
      h('div', { class: 'grid g4' },
        u.stat('Company share used', `${u.money(g.claimable)}`, `${cur} of ${u.money(limit)} limit`),
        u.stat('Remaining limit', u.money(round2(remaining)), cur),
        u.stat('Received from company', u.money(g.received), `${cur} · pending ${u.money(g.pending)}`),
        u.stat('You pay yourselves', u.money(round2(outOfPocket)), `${cur} of ${u.money(g.invoices)} invoiced`)),
      h('div', { class: 'card' }, h('div', { class: 'row small muted', style: { marginBottom: '6px' } }, h('span', null, `Limit used: ${Math.round(g.claimable / limit * 100)}%`), h('div', { class: 'spacer' }), h('span', null, `Not yet submitted: ${u.money(g.notSubmitted)} ${cur}`)),
        u.svg(KH.charts.progress(g.claimable / limit * 100))),
      u.section(`Invoices - ${g.key}`, g.rows.length ? h('table', { class: 'list' },
        h('thead', null, h('tr', null, ['Date', 'Invoice', 'Child', 'Amount', `Company ${shareLabel(share)}`, 'Claim', 'Received'].map(t => h('th', { class: /Amount|Company|Received/.test(t) ? 'right' : '' }, t)))),
        h('tbody', null, g.rows.map(r => h('tr', { class: 'click', onclick: () => KH.crud.edit('payments', r.p) },
          h('td', { class: 'nowrap' }, u.fmtDate(r.p.dueDate || r.p.paidDate)), h('td', null, r.p.description || r.p.category, r.p.invoiceNo ? h('span', { class: 'small muted' }, ` #${r.p.invoiceNo}`) : null),
          h('td', null, KH.store.childName(r.p.childId)), h('td', { class: 'right' }, u.money(r.amount)),
          h('td', { class: 'right' }, u.money(r.claimable), r.capped ? h('div', { class: 'small', style: { color: 'var(--warn)' } }, 'capped by limit') : null),
          h('td', null, u.chip(r.p.claimStatus || 'not submitted', r.p.claimStatus === 'paid' ? 'good' : r.p.claimStatus === 'rejected' ? 'bad' : r.p.claimStatus === 'approved' || r.p.claimStatus === 'submitted' ? 'info' : 'warn')),
          h('td', { class: 'right' }, r.received ? u.money(r.received) : ''))))) : h('div', { class: 'empty' }, 'No eligible invoices yet. Tick "Company reimbursement applies" on a payment, or add one here.')));
  };
})();
