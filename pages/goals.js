// Goals: what each child is working towards. Children add their own goals; parents can
// add goals too, mark them as agreed and note a reward. Marks, reading minutes, study
// hours and finished books fill the progress in by themselves.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  const ICON = { 'Subject mark': 'star', 'Reading minutes a week': 'book', 'Study hours a week': 'chart', 'Books to finish': 'book', 'My own goal': 'flag' };

  const raw = id => (KH.store.data.goals || []).find(x => x.id === id);
  const saveRaw = (id, patch) => { const r = raw(id); if (!r) return; KH.store.upsert('goals', Object.assign({}, r, patch)); KH.app.refresh(); };

  function statusChip(g) {
    if (g.status === 'met') return u.chip('reached', 'good');
    if (g.status === 'no data') return u.chip('no marks yet', '');
    if (g.kind === 'Subject mark') return u.chip(`${Math.round(g.gap * 10) / 10} to go`, g.status === 'close' ? 'warn' : 'bad');
    return u.chip(g.status === 'close' ? 'nearly there' : 'on the way', g.status === 'close' ? 'warn' : 'info');
  }
  function valueText(g) {
    if (g.current === null) return '-';
    if (g.kind === 'Subject mark') return `${g.current} / ${g.target}`;
    return `${g.current} / ${g.target}${g.unit ? ' ' + g.unit : ''}`;
  }

  function goalCard(g, opts = {}) {
    const parent = KH.app.isParent();
    const mine = KH.crud.mayEdit(KH.schema.goals, raw(g.id));
    const canTick = mine || parent || (g.childId === (KH.store.user || {}).childId);
    const child = KH.store.child(g.childId);
    const barColour = g.status === 'met' ? 'var(--good)' : g.kind === 'Subject mark' && g.current !== null ? `var(--${u.band(g.current)})` : null;
    const steps = (g.steps || []).length ? h('div', { class: 'goal-steps' }, g.steps.map(st => {
      const done = (raw(g.id).ticks || []).includes(st);
      return h('label', { class: `goal-step ${done ? 'done' : ''}` },
        h('input', { type: 'checkbox', checked: done, disabled: !canTick, onchange: e => { const t = new Set(raw(g.id).ticks || []); if (e.target.checked) t.add(st); else t.delete(st); saveRaw(g.id, { ticks: Array.from(t) }); } }),
        h('span', null, st));
    })) : null;
    const counter = g.kind === 'My own goal' && !(g.steps || []).length && canTick ? h('div', { class: 'row', style: { gap: '6px' } },
      h('button', { class: 'btn small', type: 'button', 'aria-label': 'One less', onclick: () => saveRaw(g.id, { count: Math.max(0, (Number(raw(g.id).count) || 0) - 1) }) }, '−'),
      h('button', { class: 'btn small primary', type: 'button', onclick: () => saveRaw(g.id, { count: (Number(raw(g.id).count) || 0) + 1 }) }, '+1 done')) : null;
    return h('div', { class: `card goal ${g.status === 'met' ? 'met' : ''}` },
      h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '12px', flexWrap: 'nowrap' } },
        h('span', { class: 'goal-ico', style: child ? { background: `color-mix(in srgb, ${KH.kidColor(child)} 14%, transparent)`, color: KH.kidColor(child) } : null }, u.icon(ICON[g.kind] || 'flag')),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'ux', style: { fontWeight: 800 } }, g.label),
          h('div', { class: 'small muted' }, [opts.showChild && child ? child.name : '', g.kind, g.due ? `by ${u.fmtDate(g.due)}` : ''].filter(Boolean).join(' · '))),
        statusChip(g)),
      h('div', { class: 'row', style: { alignItems: 'center', gap: '12px', margin: '12px 0 6px', flexWrap: 'nowrap' } },
        h('div', { style: { flex: 1 }, html: KH.charts.progress(g.pct, barColour) }), h('b', { class: 'nowrap' }, valueText(g))),
      steps, counter,
      h('div', { class: 'row', style: { marginTop: '10px', gap: '8px' } },
        g.agreed ? u.chip('✓ agreed by a parent', 'good') : parent ? h('button', { class: 'btn small', onclick: () => saveRaw(g.id, { agreed: true, agreedBy: KH.store.user.id, agreedAt: u.now() }) }, u.icon('check'), 'Agree') : u.chip('not agreed yet', ''),
        g.reward ? h('span', { class: 'small ux', style: { fontWeight: 600 } }, `Reward: ${g.reward}`) : null,
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn small', onclick: () => KH.crud.edit('goals', raw(g.id)) }, mine ? 'Edit' : 'Details')));
  }
  KH.goalCard = goalCard;

  KH.pages.goals = function () {
    const parent = KH.app.isParent();
    const kids = parent ? (KH.app.filterChild ? [KH.store.child(KH.app.filterChild)].filter(Boolean) : KH.store.children()) : [KH.store.child(KH.store.user.childId)].filter(Boolean);
    const all = kids.flatMap(c => A.goalsProgress(KH.store.data, c.id, u.today()));
    const open = all.filter(g => g.status !== 'met'), done = all.filter(g => g.status === 'met');
    const bar = h('div', { class: 'row', style: { marginBottom: '14px' } },
      parent ? h('select', { style: { width: '180px' }, onchange: e => { KH.app.filterChild = e.target.value; KH.app.refresh(); } },
        h('option', { value: '' }, 'All children'), KH.store.children().map(c => h('option', { value: c.id, selected: c.id === KH.app.filterChild }, c.name))) : null,
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: () => KH.crud.edit('goals', null, { preset: parent ? (KH.app.filterChild ? { childId: KH.app.filterChild } : null) : { childId: KH.store.user.childId } }) }, '+ New goal'));
    const grid = list => h('div', { class: 'grid g2', style: { alignItems: 'start' } }, list.map(g => goalCard(g, { showChild: parent && kids.length > 1 })));
    return h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, parent
        ? 'Goals the children set themselves and goals you set with them. Marks, reading minutes, study hours and finished books fill the progress in by themselves.'
        : 'Set a target and watch it fill up. Your marks, reading minutes, study hours and finished books count by themselves. For your own goal, tick the steps as you go.'),
      bar,
      all.length ? null : h('div', { class: 'card empty' }, parent ? 'No goals yet.' : 'No goals yet. Press "+ New goal" to set your first one.'),
      open.length ? grid(open) : null,
      done.length ? h('h3', { style: { margin: '22px 0 10px' } }, 'Reached') : null,
      done.length ? grid(done) : null);
  };
})();
