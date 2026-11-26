// Routine & rewards (version 4.3, stage 2): morning and evening check-ins, trackers and patterns,
// challenges (with free days and three ways to confirm a day), family agreements the children
// propose, agreements that cover several children, consequences set by parents, points that never
// leave the app, the rewards catalog with requests, and wishlists. Counting is in lib/routine.js.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const R = () => KH.routine;
  const D = () => KH.store.data;
  const isParent = () => KH.app.isParent();
  const me = () => KH.store.user;
  const nm = id => KH.store.childName(id);
  const MOODS = [[5, '😄', 'Great'], [4, '🙂', 'Good'], [3, '😐', 'OK'], [2, '😕', 'Not great'], [1, '😢', 'Bad']];
  const MINUTES = [0, 15, 30, 45, 60, 90, 120, 180];

  // ---------------- points: writing to the ledger ----------------
  function addEntry(childId, amount, reason, source, refId, id) {
    return KH.store.upsert('points', { id: id || undefined, childId, date: u.today(), amount: Number(amount), reason, source, refId: refId || '', by: me().id, at: u.now() });
  }
  // takes up to "want" points (never below zero unless the parents allow it); returns what was taken
  function take(childId, want, reason, source, refId, id) {
    const n = R().capTake(D(), childId, want);
    if (n > 0) addEntry(childId, -n, reason, source, refId, id);
    return n;
  }
  const voidEntry = id => { const p = (D().points || []).find(x => x.id === id); if (p && !p.void) KH.store.upsert('points', Object.assign({}, p, { void: true })); };

  // the points the app gives by itself, and entries whose consequence or request is gone
  let settling = false;
  function settle() {
    if (settling || !KH.store.user || !KH.features.on('routine')) return;
    settling = true;
    try {
      for (const w of R().settle(D(), u.today())) KH.store.upsert('points', w);
      const has = (coll, id) => (D()[coll] || []).some(x => x.id === id);
      for (const p of D().points || []) {
        if (p.void) continue;
        if (p.source === 'consequence' && p.refId && !has('consequences', p.refId)) voidEntry(p.id);
        if (p.source === 'reward' && p.refId && !has('redemptions', p.refId)) voidEntry(p.id);
      }
    } finally { settling = false; }
  }
  KH.routineSettle = settle;

  // ---------------- small pieces ----------------
  const pointsBadge = (n, big) => h('span', { class: `rt-points ${big ? 'big' : ''}` }, '⭐ ', h('b', null, n === 1 ? '1 point' : `${n} points`));
  const kidHead = (c, extra) => h('div', { class: 'row', style: { gap: '10px', marginBottom: '10px', flexWrap: 'nowrap' } }, KH.avatar(c, 36), h('b', { 'data-noi18n': '1', style: { fontSize: '16px' } }, c.name), h('div', { class: 'spacer' }), extra || null);
  const kidsFor = () => (isParent() ? (KH.app.filterChild ? [KH.store.child(KH.app.filterChild)].filter(Boolean) : KH.store.children()) : [KH.store.child(me().childId)].filter(Boolean));
  const childPicker = () => (isParent() ? h('select', { style: { width: '180px' }, onchange: e => { KH.app.filterChild = e.target.value; KH.app.refresh(); } },
    h('option', { value: '' }, 'All children'), KH.store.children().map(c => h('option', { value: c.id, selected: c.id === KH.app.filterChild }, c.name))) : null);
  const moodFace = v => { const m = MOODS.find(x => x[0] === Number(v)); return m ? m[1] : ''; };
  const mins = v => (v === null || v === undefined || v === '' ? '-' : Number(v) >= 60 ? `${Math.floor(v / 60)} h${v % 60 ? ' ' + (v % 60) + ' min' : ''}` : `${v} min`);
  const forKid = (rec, kid) => !rec.childIds || !rec.childIds.length || rec.childIds.includes(kid);

  function minutesField(label, value) {
    const inp = h('input', { type: 'number', min: '0', step: '5', value: value === null || value === undefined ? '' : value, style: { width: '90px' } });
    const chips = h('div', { class: 'rt-chips' }, MINUTES.map(m => h('button', { type: 'button', class: Number(inp.value) === m && inp.value !== '' ? 'on' : '', onclick: e => {
      inp.value = String(m); chips.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on');
    } }, m === 0 ? '0' : m >= 60 ? `${m / 60} h` : `${m}`)));
    inp.addEventListener('input', () => chips.querySelectorAll('button').forEach(b => b.classList.remove('on')));
    return { el: h('label', { class: 'f full' }, h('span', null, label), h('div', { class: 'row', style: { gap: '8px', alignItems: 'center' } }, chips, inp, h('span', { class: 'small muted' }, 'min'))), get: () => (inp.value === '' ? null : Number(inp.value)) };
  }

  // ---------------- the check-in ----------------
  // part: 'morning' (bedtime and wake-up, about 10 seconds) or 'evening' (under a minute)
  function checkinDialog(childId, part, date) {
    date = date || u.today();
    const old = R().checkin(D(), childId, date) || {};
    const prev = (D().checkins || []).filter(c => c.childId === childId && c.date < date).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || {};
    const body = h('div');
    const dateIn = h('input', { type: 'date', value: date, max: u.today(), min: isParent() ? '' : R().addDays(u.today(), -2), onchange: e => { m.close(); checkinDialog(childId, part, e.target.value || u.today()); } });
    body.appendChild(h('div', { class: 'row', style: { marginBottom: '10px', gap: '10px' } }, h('span', { class: 'muted' }, isParent() ? nm(childId) : ''), h('div', { class: 'spacer' }), dateIn));
    let get;
    if (part === 'morning') {
      const bed = h('input', { type: 'time', value: old.bed || prev.bed || '' });
      const wake = h('input', { type: 'time', value: old.wake || prev.wake || '' });
      body.appendChild(h('div', { class: 'form-grid' },
        h('label', { class: 'f' }, h('span', null, 'Went to bed last night'), bed),
        h('label', { class: 'f' }, h('span', null, 'Woke up'), wake)));
      body.appendChild(h('div', { class: 'small muted' }, 'Filled in from the last check-in: change only what was different.'));
      get = () => ({ bed: bed.value, wake: wake.value, morningAt: u.now() });
    } else {
      const fields = {
        screen: minutesField('Screens (phone, tablet, TV, not school work)', old.screen),
        gaming: minutesField('Gaming', old.gaming),
        play: minutesField('Outdoor play', old.play),
        sport: minutesField('Sport or training', old.sport),
      };
      Object.values(fields).forEach(f => body.appendChild(f.el));
      const habits = R().habitsFor(D(), childId);
      const ticked = new Set(old.habits || []);
      if (habits.length) body.appendChild(h('div', { class: 'f full' }, h('span', null, 'Habits done today'),
        h('div', { class: 'rt-chips habits' }, habits.map(hb => h('button', { type: 'button', class: ticked.has(hb.id) ? 'on' : '', onclick: e => {
          if (ticked.has(hb.id)) ticked.delete(hb.id); else ticked.add(hb.id); e.currentTarget.classList.toggle('on');
        } }, h('span', null, hb.title), Number(hb.points) > 0 ? h('small', { 'data-noi18n': '1' }, ` +${hb.points}`) : null)))));
      let mood = old.mood || null;
      const moods = h('div', { class: 'rt-moods' }, MOODS.map(([v, face, label]) => h('button', { type: 'button', class: Number(mood) === v ? 'on' : '', title: label, onclick: e => {
        mood = v; moods.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on');
      } }, h('span', { class: 'face' }, face), h('span', { class: 'small' }, label))));
      body.appendChild(h('div', { class: 'f full' }, h('span', null, 'How did the day feel?'), moods));
      const note = h('input', { type: 'text', value: old.note || '', placeholder: 'Anything to remember (optional)' });
      body.appendChild(h('label', { class: 'f full' }, h('span', null, 'Note'), note));
      get = () => ({ screen: fields.screen.get(), gaming: fields.gaming.get(), play: fields.play.get(), sport: fields.sport.get(), habits: Array.from(ticked), mood, note: note.value.trim(), eveningAt: u.now() });
    }
    const m = u.modal({ title: part === 'morning' ? 'Morning check-in' : 'Evening check-in', body, actions: [{ label: 'Cancel' }, { label: 'Save', primary: true, onClick: () => {
      const cur = R().checkin(D(), childId, date) || {};
      const rec = Object.assign({}, cur, get(), { id: cur.id || R().checkinId(childId, date), childId, date });
      if (isParent()) rec.correctedBy = me().id; else rec.by = me().id;
      KH.store.upsert('checkins', rec);
      settle();
      u.toast(part === 'morning' ? 'Good morning! Saved.' : 'Saved. Well done for checking in!', 'good');
      KH.app.refresh();
      return true;
    } }] });
  }
  KH.checkinDialog = checkinDialog;

  function checkinSummary(c) {
    if (!c) return h('span', { class: 'muted small' }, 'Nothing filled in yet.');
    const parts = [];
    if (R().morningDone(c)) parts.push(h('span', null, '🌙 ', h('span', { 'data-noi18n': '1' }, `${c.bed || '?'} → ${c.wake || '?'}`), R().sleepHours(c) !== null ? h('span', { class: 'muted' }, ` (${R().sleepHours(c)} h)`) : null));
    if (R().eveningDone(c)) {
      const hb = R().habitsFor(D(), c.childId);
      parts.push(h('span', null, '📱 ', mins(R().screenOf(c))));
      parts.push(h('span', null, '⚽ ', mins(R().activeOf(c))));
      if (hb.length) parts.push(h('span', null, '✅ ', h('span', { 'data-noi18n': '1' }, `${(c.habits || []).filter(id => hb.some(x => x.id === id)).length}/${hb.length}`), ' habits'));
      if (c.mood) parts.push(h('span', { title: (MOODS.find(x => x[0] === Number(c.mood)) || [])[2] || '' }, moodFace(c.mood)));
    }
    return h('div', { class: 'rt-sum' }, parts);
  }

  function checkinButtons(childId) {
    const c = R().checkin(D(), childId, u.today());
    const mDone = R().morningDone(c), eDone = R().eveningDone(c);
    return h('div', { class: 'rt-checkins' },
      h('button', { class: `rt-ci ${mDone ? 'done' : ''}`, type: 'button', onclick: () => checkinDialog(childId, 'morning') },
        h('span', { class: 'ico' }, mDone ? '✓' : '☀️'), h('span', null, h('b', null, 'Morning check-in'), h('small', null, mDone ? 'Done. Tap to change.' : 'Bedtime and wake-up, 10 seconds'))),
      h('button', { class: `rt-ci ${eDone ? 'done' : ''}`, type: 'button', onclick: () => checkinDialog(childId, 'evening') },
        h('span', { class: 'ico' }, eDone ? '✓' : '🌙'), h('span', null, h('b', null, 'Evening check-in'), h('small', null, eDone ? 'Done. Tap to change.' : 'Screens, play, habits, how the day felt'))));
  }

  // ---------------- challenges ----------------
  function dayDots(p) {
    const last = p.days.slice(-14);
    return h('div', { class: 'rt-dots' }, last.map(d => h('i', { class: d.state || 'miss', title: `${u.fmtShort(d.date)}: ${d.state === 'done' ? 'done' : d.state === 'pending' ? 'waiting for a parent' : d.state === 'declined' ? 'not approved' : 'not done (free day)'}` })));
  }
  async function tickToday(ch, childId) {
    const how = R().confirmOf(ch);
    const id = R().tickId(ch.id, childId, u.today());
    const cur = (D().ticks || []).find(t => t.id === id);
    if (cur && cur.state !== 'undone') { KH.store.upsert('ticks', Object.assign({}, cur, { state: 'undone' })); settle(); KH.app.refresh(); return; }
    let photo = null;
    if (how === 'parent') {
      const pic = KH.crud.input({ type: 'file', accept: 'image', folder: 'photos' }, null);
      const ok = await new Promise(res => u.modal({ title: 'Done today?', body: h('div', null, h('p', { class: 'muted', style: { marginTop: 0 } }, 'A parent approves this one. You can add a photo (optional).'), pic.el),
        onClose: () => res(false), actions: [{ label: 'Cancel', onClick: () => res(false) }, { label: 'Send for approval', primary: true, onClick: () => { photo = pic.get(); res(true); } }] }));
      if (!ok) return;
    }
    KH.store.upsert('ticks', { id, challengeId: ch.id, childId, date: u.today(), state: how === 'parent' ? (isParent() ? 'approved' : 'pending') : 'done', photo: photo || null, by: me().id, at: u.now() });
    settle();
    u.toast(how === 'parent' && !isParent() ? 'Sent. A parent will approve it.' : 'Ticked. Well done!', 'good');
    KH.app.refresh();
  }
  function decideTick(t, state) {
    KH.store.upsert('ticks', Object.assign({}, t, { state, decidedBy: me().id, decidedAt: u.now() }));
    settle(); KH.app.refresh();
  }

  function challengeCard(ch, kids, opts = {}) {
    const parent = isParent();
    const rows = kids.filter(k => R().kidsOf(ch).includes(k.id)).map(k => {
      const p = R().progress(D(), ch, k.id, u.today());
      const how = R().confirmOf(ch);
      const canTick = !p.upcoming && !p.ended && !p.finished && how !== 'auto' && (parent || k.id === me().childId);
      const tickBtn = canTick ? h('button', { class: `btn small ${p.todayState ? '' : 'primary'}`, onclick: () => tickToday(ch, k.id) },
        p.todayState === 'done' ? '✓ Done today (undo)' : p.todayState === 'pending' ? 'Waiting for approval (undo)' : 'Done today') : null;
      return h('div', { class: 'rt-prog' },
        kids.length > 1 || parent ? h('div', { class: 'row small', style: { marginBottom: '4px' } }, h('b', { 'data-noi18n': '1' }, k.name)) : null,
        h('div', { class: 'row', style: { gap: '10px', flexWrap: 'nowrap', alignItems: 'center' } },
          h('div', { style: { flex: 1 }, html: KH.charts.progress(p.pct, p.finished ? 'var(--good)' : null) }),
          h('b', { class: 'nowrap', 'data-noi18n': '1' }, `${p.done}/${p.required}`)),
        h('div', { class: 'row small muted', style: { gap: '10px', marginTop: '4px' } },
          p.upcoming ? h('span', null, `Starts ${u.fmtShort(p.start)}`) : h('span', null, p.ended ? `Ended ${u.fmtShort(p.end)}` : `Until ${u.fmtShort(p.end)}`),
          p.streak > 1 ? h('span', null, `🔥 ${p.streak}-day streak`) : null,
          p.pending ? h('span', null, `${p.pending} waiting for a parent`) : null,
          ch.frequency === 'weekly' ? h('span', null, `${p.thisWeek} of ${ch.daysPerWeek || 1} this week`) : null),
        p.days.length ? dayDots(p) : null,
        p.cheer ? h('div', { class: `rt-cheer ${p.finished ? 'done' : ''}` }, p.cheer) : null,
        p.ended && parent ? h('div', { class: 'small muted' }, p.reachable ? '' : 'The full target was not reached. Points for each day done are kept. A shorter or easier target may work better next time.') : null,
        tickBtn ? h('div', { style: { marginTop: '6px' } }, tickBtn) : null);
    });
    const how = { auto: 'Checked by the app', child: 'Ticked by the child', parent: 'Approved by a parent' }[R().confirmOf(ch)];
    return h('div', { class: 'card rt-card' },
      h('div', { class: 'row', style: { alignItems: 'flex-start', flexWrap: 'nowrap', gap: '10px' } },
        h('span', { class: 'goal-ico' }, u.icon('flag')),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { class: 'ux', style: { fontWeight: 800 } }, ch.title),
          h('div', { class: 'small muted' }, [ch.frequency === 'weekly' ? `${ch.daysPerWeek || 1} days a week` : 'Every day', `${ch.weeks || 1} week${Number(ch.weeks) === 1 ? '' : 's'}`,
            ch.frequency !== 'weekly' && Number(ch.freeDays) ? `${ch.freeDays} free day${Number(ch.freeDays) === 1 ? '' : 's'}` : '', how].filter(Boolean).join(' · '))),
        parent && !opts.noEdit ? h('button', { class: 'btn small', onclick: () => KH.crud.edit('challenges', ch) }, 'Edit') : null),
      h('div', { class: 'row small', style: { gap: '8px', margin: '6px 0 10px' } },
        Number(ch.pointsPerDay) ? u.chip(`+${ch.pointsPerDay} a day`, 'accent') : null,
        Number(ch.finalPoints) ? u.chip(`+${ch.finalPoints} when complete`, 'good') : null,
        ch.finalReward ? h('span', { class: 'ux', style: { fontWeight: 600 } }, `Reward: ${ch.finalReward}`) : null),
      rows);
  }

  function proposalDialog() {
    const kid = me().childId;
    const f = { title: h('input', { type: 'text', placeholder: 'e.g. Practise piano 15 minutes' }), days: h('select', null, h('option', { value: '7' }, 'Every day'), [6, 5, 4, 3, 2].map(n => h('option', { value: String(n) }, `${n} days a week`))),
      weeks: h('input', { type: 'number', min: '1', max: '12', value: '2' }), reward: h('input', { type: 'text', placeholder: 'e.g. A new football' }), why: h('textarea') };
    u.modal({ title: 'Propose a family agreement', body: h('div', null, h('p', { class: 'muted', style: { marginTop: 0 } }, 'Suggest a goal and a reward. A parent can agree, change it or say no.'),
      h('div', { class: 'form-grid' },
        h('label', { class: 'f full' }, h('span', null, 'My goal'), f.title), h('label', { class: 'f' }, h('span', null, 'How often'), f.days),
        h('label', { class: 'f' }, h('span', null, 'For how many weeks'), f.weeks), h('label', { class: 'f full' }, h('span', null, 'The reward I would like'), f.reward),
        h('label', { class: 'f full' }, h('span', null, 'Why (optional)'), f.why))),
    actions: [{ label: 'Cancel' }, { label: 'Send to my parents', primary: true, onClick: () => {
      if (!f.title.value.trim()) { u.toast('Please write your goal', 'bad'); return false; }
      const d = Number(f.days.value);
      KH.store.upsert('challenges', { title: f.title.value.trim(), childIds: [kid], kind: 'custom', frequency: d === 7 ? 'daily' : 'weekly', daysPerWeek: d === 7 ? '' : d, weeks: Math.max(1, Number(f.weeks.value) || 1), freeDays: d === 7 ? 1 : 0,
        pointsPerDay: 1, finalPoints: 10, finalReward: f.reward.value.trim(), confirm: 'child', status: 'proposed', proposedBy: kid, notes: f.why.value.trim(), start: '', createdBy: me().id });
      u.toast('Sent to your parents', 'good'); KH.app.refresh(); return true;
    } }] });
  }

  function proposalCard(ch) {
    const kid = R().kidsOf(ch)[0];
    const parent = isParent();
    const st = { proposed: ['waiting for a parent', 'warn'], refused: ['not agreed', 'bad'] }[ch.status] || ['', ''];
    return h('div', { class: 'card rt-card' },
      h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '10px' } }, h('span', { class: 'goal-ico' }, '🤝'),
        h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { class: 'ux', style: { fontWeight: 800 } }, ch.title),
          h('div', { class: 'small muted' }, [parent ? nm(kid) : '', ch.frequency === 'weekly' ? `${ch.daysPerWeek} days a week` : 'Every day', `${ch.weeks} week${Number(ch.weeks) === 1 ? '' : 's'}`].filter(Boolean).join(' · '))),
        u.chip(st[0], st[1])),
      ch.finalReward ? h('div', { style: { margin: '8px 0', fontWeight: 600 }, class: 'ux' }, `Reward asked for: ${ch.finalReward}`) : null,
      ch.notes ? h('div', { class: 'small muted ux' }, ch.notes) : null,
      ch.parentNote ? h('div', { class: 'small ux', style: { marginTop: '6px' } }, h('b', null, 'Parent: '), ch.parentNote) : null,
      parent && ch.status === 'proposed' ? h('div', { class: 'row', style: { marginTop: '10px', gap: '8px' } },
        h('button', { class: 'btn small primary', onclick: () => { KH.store.upsert('challenges', Object.assign({}, ch, { status: 'active', start: ch.start || u.today(), agreedBy: me().id, agreedAt: u.now() })); u.toast('Agreed. The challenge has started.', 'good'); KH.app.refresh(); } }, u.icon('check'), 'Agree'),
        h('button', { class: 'btn small', onclick: () => KH.crud.edit('challenges', Object.assign({}, ch, { start: ch.start || u.today() }), { onSaved: s => { if (s) { KH.store.upsert('challenges', Object.assign({}, s, { status: 'active', agreedBy: me().id, agreedAt: u.now() })); KH.app.refresh(); } } }) }, 'Change and agree'),
        h('button', { class: 'btn small danger', onclick: async () => { const r = await u.prompt('Not this time', [{ key: 'note', label: 'A short reason for the child (optional)' }]); if (!r) return; KH.store.upsert('challenges', Object.assign({}, ch, { status: 'refused', parentNote: r.note || '', decidedBy: me().id })); KH.app.refresh(); } }, 'Say no')) : null);
  }

  // ---------------- agreements across children ----------------
  async function logBreach(ag) {
    const kids = KH.store.children().filter(c => forKid(ag, c.id));
    const boxes = kids.map(c => { const cb = h('input', { type: 'checkbox' }); cb.dataset.v = c.id; return h('label', null, cb, c.name); });
    const date = h('input', { type: 'date', value: u.today(), max: u.today() });
    const note = h('input', { type: 'text', placeholder: 'What happened (the children see this)' });
    const pts = h('input', { type: 'number', min: '0', value: String(ag.points || 5) });
    u.modal({ title: `Log a breach: ${ag.title}`, body: h('div', { class: 'form-grid' },
      h('div', { class: 'f full' }, h('span', null, 'Who was involved'), h('div', { class: 'checks' }, boxes)),
      h('label', { class: 'f' }, h('span', null, 'Date'), date), h('label', { class: 'f' }, h('span', null, 'Points taken from each'), pts),
      h('label', { class: 'f full' }, h('span', null, 'What happened'), note)),
    actions: [{ label: 'Cancel' }, { label: 'Log it', primary: true, danger: true, onClick: () => {
      const who = boxes.map(b => b.querySelector('input')).filter(x => x.checked).map(x => x.dataset.v);
      if (!who.length) { u.toast('Choose who was involved', 'bad'); return false; }
      const id = u.uid('br');
      const taken = {};
      for (const k of who) taken[k] = take(k, Number(pts.value) || 0, `${ag.title}${note.value.trim() ? ': ' + note.value.trim() : ''}`, 'agreement', ag.id, `pt-b-${id}-${k}`);
      const cur = (D().agreements || []).find(x => x.id === ag.id) || ag;
      KH.store.upsert('agreements', Object.assign({}, cur, { breaches: (cur.breaches || []).concat([{ id, date: date.value || u.today(), childIds: who, note: note.value.trim(), taken, by: me().id }]) }));
      settle();
      u.toast('Logged. Each child sees why.', 'good'); KH.app.refresh(); return true;
    } }] });
  }
  function undoBreach(ag, b) {
    for (const k of b.childIds || []) voidEntry(`pt-b-${b.id}-${k}`);
    const cur = (D().agreements || []).find(x => x.id === ag.id) || ag;
    KH.store.upsert('agreements', Object.assign({}, cur, { breaches: (cur.breaches || []).map(x => (x.id === b.id ? Object.assign({}, x, { void: true }) : x)) }));
    settle(); KH.app.refresh();
  }
  function agreementCard(ag, kids) {
    const parent = isParent();
    const today = u.today(), ws = R().weekStart(today);
    const live = (ag.breaches || []).filter(b => !b.void);
    const covered = kids.filter(k => forKid(ag, k.id));
    return h('div', { class: 'card rt-card' },
      h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '10px' } }, h('span', { class: 'goal-ico' }, '🤝'),
        h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { class: 'ux', style: { fontWeight: 800 } }, ag.title),
          h('div', { class: 'small muted' }, [(ag.childIds || []).length ? ag.childIds.map(nm).join(', ') : 'All children', Number(ag.points) ? `−${ag.points} for a breach` : '', Number(ag.bonus) ? `+${ag.bonus} for a clean week` : ''].filter(Boolean).join(' · '))),
        parent ? h('button', { class: 'btn small', onclick: () => KH.crud.edit('agreements', ag) }, 'Edit') : null),
      ag.notes ? h('div', { class: 'small ux', style: { margin: '8px 0' } }, ag.notes) : null,
      h('div', { class: 'row', style: { gap: '8px', margin: '8px 0' } }, covered.map(k => {
        const n = live.filter(b => (b.childIds || []).includes(k.id) && b.date >= ws).length;
        return u.chip(`${k.name}: ${n ? `${n} this week` : 'clean week so far'}`, n ? 'bad' : 'good');
      })),
      live.length ? h('details', null, h('summary', { class: 'small', style: { cursor: 'pointer' } }, `History (${live.length})`),
        live.slice().reverse().slice(0, 20).map(b => h('div', { class: 'row small', style: { gap: '8px', padding: '4px 0' } },
          h('span', { class: 'muted nowrap' }, u.fmtShort(b.date)), h('span', { 'data-noi18n': '1' }, (b.childIds || []).map(nm).join(', ')), h('span', { class: 'ux' }, b.note || ''),
          h('div', { class: 'spacer' }), parent ? h('a', { onclick: () => undoBreach(ag, b) }, 'undo') : null))) : null,
      parent && ag.active !== false ? h('button', { class: 'btn small danger', style: { marginTop: '8px' }, onclick: () => logBreach(ag) }, 'Log a breach') : null);
  }

  // ---------------- consequences ----------------
  function applyConsequence(x) {
    if (!x || x.kind !== 'points') return;
    for (const k of x.childIds || []) {
      const id = `pt-x-${x.id}-${k}`;
      if ((D().points || []).some(p => p.id === id && !p.void)) continue;
      take(k, Number(x.points) || 0, `Consequence: ${x.reason || ''}`, 'consequence', x.id, id);
    }
  }
  function newConsequence(preset) {
    KH.crud.edit('consequences', null, { preset, onSaved: s => { if (s) { applyConsequence(s); u.toast('Saved. The child sees what, why and until when.', 'good'); } } });
  }
  function consequenceCard(x) {
    const parent = isParent();
    const today = u.today();
    const active = R().consequenceActive(x, today);
    const what = x.kind === 'ground' ? `No ${String(x.from || 'treats').toLowerCase()}${x.until ? ` until ${u.fmtDate(x.until)}` : ''}`
      : x.kind === 'task' ? `Extra task: ${x.task || ''}`
      : `${x.points || 0} points taken`;
    const kids = parent ? (x.childIds || []) : [me().childId];
    return h('div', { class: `finding ${active ? 'medium' : ''}` },
      h('div', { class: 'row', style: { gap: '8px' } }, h('b', { class: 'ux' }, what), h('div', { class: 'spacer' }), active ? u.chip('now', 'warn') : u.chip(x.endedAt ? 'ended early' : 'over', '')),
      h('div', { class: 'small ux' }, [parent ? (x.childIds || []).map(nm).join(', ') : '', `Why: ${x.reason || ''}`, u.fmtShort(x.date || String(x.createdAt).slice(0, 10))].filter(Boolean).join(' · ')),
      x.kind === 'points' && x.earnBack ? h('div', { class: 'small ux' }, `Earn them back: ${x.earnBackHow || 'ask a parent how'}`) : null,
      parent ? h('div', { class: 'row', style: { gap: '6px', marginTop: '6px' } },
        x.kind === 'task' ? kids.map(k => ((x.taskDone || {})[k] ? u.chip(`${nm(k)}: done`, 'good') : h('button', { class: 'btn small', onclick: () => { KH.store.upsert('consequences', Object.assign({}, x, { taskDone: Object.assign({}, x.taskDone, { [k]: today }) })); KH.app.refresh(); } }, `${nm(k)} did the task`))) : null,
        x.kind === 'points' && x.earnBack ? kids.map(k => ((D().points || []).some(p => p.id === `pt-xb-${x.id}-${k}` && !p.void) ? u.chip(`${nm(k)}: earned back`, 'good')
          : h('button', { class: 'btn small', onclick: () => { const t = (D().points || []).find(p => p.id === `pt-x-${x.id}-${k}` && !p.void); addEntry(k, t ? Math.abs(t.amount) : Number(x.points) || 0, `Earned back: ${x.reason || ''}`, 'earnback', x.id, `pt-xb-${x.id}-${k}`); KH.app.refresh(); } }, `${nm(k)} earned them back`))) : null,
        active && x.kind !== 'points' ? h('button', { class: 'btn small', onclick: () => { KH.store.upsert('consequences', Object.assign({}, x, { endedAt: u.now(), endedBy: me().id })); KH.app.refresh(); } }, 'End early') : null,
        h('button', { class: 'btn small', onclick: () => KH.crud.edit('consequences', x, { onSaved: s => { if (s) applyConsequence(s); else settle(); } }) }, 'Edit')) : null);
  }

  // ---------------- rewards ----------------
  function askReward(rw, kid) {
    const free = R().available(D(), kid);
    if (free < Number(rw.points)) { u.toast(`You need ${Number(rw.points) - free} more points`, 'bad'); return; }
    KH.store.upsert('redemptions', { childId: kid, rewardId: rw.id, title: rw.title, points: Number(rw.points) || 0, status: 'requested', createdBy: me().id });
    u.toast('Asked. A parent will answer soon.', 'good'); KH.app.refresh();
  }
  function decide(r, ok) {
    if (ok) {
      const n = Number(r.points) || 0;
      if (n > R().balance(D(), r.childId)) { u.toast(`${nm(r.childId)} does not have enough points any more`, 'bad'); return; }
      if (n) addEntry(r.childId, -n, `Reward: ${r.title}`, 'reward', r.id, `pt-r-${r.id}`);
    }
    KH.store.upsert('redemptions', Object.assign({}, r, { status: ok ? 'approved' : 'declined', decidedBy: me().id, decidedAt: u.now() }));
    if (ok && r.wishId) { const w = (D().wishes || []).find(x => x.id === r.wishId); if (w) KH.store.upsert('wishes', Object.assign({}, w, { status: 'got' })); }
    u.toast(ok ? 'Approved' : 'Declined'); KH.app.refresh();
  }
  const reqChip = st => u.chip({ requested: 'waiting', approved: 'approved', declined: 'not this time', given: 'given' }[st] || st, { requested: 'warn', approved: 'good', declined: 'bad', given: 'good' }[st] || '');
  function requestRow(r) {
    const parent = isParent();
    return h('div', { class: 'row rt-req', style: { gap: '8px' } },
      parent ? h('b', { 'data-noi18n': '1' }, nm(r.childId)) : null, h('span', { class: 'ux', style: { fontWeight: 600 } }, r.title), h('span', { class: 'small muted', 'data-noi18n': '1' }, `${r.points} ⭐`),
      h('span', { class: 'small muted' }, u.fmtShort(String(r.createdAt || '').slice(0, 10))), h('div', { class: 'spacer' }), reqChip(r.status),
      parent && r.status === 'requested' ? h('button', { class: 'btn small primary', onclick: () => decide(r, true) }, 'Approve') : null,
      parent && r.status === 'requested' ? h('button', { class: 'btn small', onclick: () => decide(r, false) }, 'Decline') : null,
      parent && r.status === 'approved' ? h('button', { class: 'btn small', onclick: () => { KH.store.upsert('redemptions', Object.assign({}, r, { status: 'given', givenAt: u.now() })); KH.app.refresh(); } }, 'Mark as given') : null,
      !parent && r.status === 'requested' ? h('a', { class: 'small', onclick: () => { KH.store.remove('redemptions', r.id); KH.app.refresh(); } }, 'cancel') : null);
  }

  // ---------------- wishes ----------------
  async function wishPicture(w) {
    if (!(w.photo && w.photo.rel)) return null;
    const img = h('img', { class: 'rt-wish-img', alt: '' });
    try { img.src = await window.hub.url(w.photo.rel); } catch (e) { return null; }
    return img;
  }
  function wishCard(w) {
    const parent = isParent();
    const p = R().wishProgress(D(), w, u.today());
    const pic = h('div', { class: 'rt-wish-pic' }, '🎁');
    wishPicture(w).then(img => { if (img) { pic.innerHTML = ''; pic.appendChild(img); } });
    const st = { waiting: ['waiting for a parent', 'warn'], approved: ['approved', 'good'], declined: ['not now', 'bad'], got: ['got it', 'good'] }[w.status || 'waiting'];
    const asked = (D().redemptions || []).some(r => r.wishId === w.id && r.status === 'requested');
    return h('div', { class: 'card rt-wish' }, pic,
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { class: 'row', style: { gap: '8px', flexWrap: 'nowrap' } }, h('b', { class: 'ux' }, w.title), h('div', { class: 'spacer' }), u.chip(st[0], st[1])),
        h('div', { class: 'small muted' }, [parent ? nm(w.childId) : '', w.price ? `about ${u.money(w.price)} ${KH.store.settings().currency || 'SAR'}` : '', w.giftIdea && parent ? 'gift idea' : ''].filter(Boolean).join(' · ')),
        w.link && /^https?:\/\//i.test(w.link) ? h('a', { class: 'small', onclick: () => window.open(w.link, '_blank', 'noopener') }, 'Open the link') : null,
        p ? h('div', { style: { marginTop: '8px' } }, h('div', { html: KH.charts.progress(p.pct, p.reached ? 'var(--good)' : null) }), h('div', { class: 'small muted' }, p.text)) : null,
        w.parentNote ? h('div', { class: 'small ux', style: { marginTop: '4px' } }, h('b', null, 'Parent: '), w.parentNote) : null,
        h('div', { class: 'row', style: { gap: '6px', marginTop: '8px' } },
          parent && (!w.status || w.status === 'waiting') ? h('button', { class: 'btn small primary', onclick: () => { KH.store.upsert('wishes', Object.assign({}, w, { status: 'approved' })); KH.app.refresh(); } }, 'Approve') : null,
          parent && (!w.status || w.status === 'waiting') ? h('button', { class: 'btn small', onclick: () => { KH.store.upsert('wishes', Object.assign({}, w, { status: 'declined' })); KH.app.refresh(); } }, 'Decline') : null,
          parent && w.status === 'approved' ? h('button', { class: 'btn small', onclick: () => { KH.store.upsert('wishes', Object.assign({}, w, { status: 'got' })); KH.app.refresh(); } }, 'Mark as got') : null,
          !parent && w.status === 'approved' && p && p.reached && !asked ? h('button', { class: 'btn small primary', onclick: () => {
            KH.store.upsert('redemptions', { childId: w.childId, wishId: w.id, title: w.title, points: w.challengeId ? 0 : Number(w.targetPoints) || 0, status: 'requested', createdBy: me().id });
            u.toast('Asked. A parent will answer soon.', 'good'); KH.app.refresh();
          } }, 'Ask for it') : null,
          asked ? u.chip('asked', 'warn') : null,
          h('div', { class: 'spacer' }),
          KH.crud.mayEdit(KH.schema.wishes, w) ? h('button', { class: 'btn small', onclick: () => KH.crud.edit('wishes', w) }, parent ? 'Set a target or edit' : 'Edit') : null)));
  }

  // ---------------- charts ----------------
  function dayBars(days, key, opts = {}) {
    const vals = days.map(d => d[key]);
    if (!vals.some(v => v !== null && v !== undefined)) return null;
    const max = Math.max(opts.min || 1, ...vals.map(v => Number(v) || 0), opts.target || 0);
    const W = 360, H = 130, n = days.length, gap = 3, bw = Math.max(6, (W - 10 - gap * n) / n), ph = 84, y0 = 16;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" font-size="10" role="img" aria-label="${u.esc(opts.label || key)}" font-family="inherit">`;
    if (opts.target) { const ty = y0 + ph - opts.target / max * ph; s += `<line x1="0" x2="${W}" y1="${ty}" y2="${ty}" stroke="var(--muted)" stroke-dasharray="4 3"/>`; }
    days.forEach((d, i) => {
      const v = d[key], x = 5 + i * (bw + gap);
      if (v === null || v === undefined) { s += `<rect x="${x}" y="${y0 + ph - 2}" width="${bw}" height="2" rx="1" fill="var(--border)"/>`; }
      else {
        const hg = Math.max(2, Number(v) / max * ph);
        const bad = opts.over ? Number(v) > opts.over : opts.under ? Number(v) < opts.under : false;
        s += `<rect class="colbar" x="${x}" y="${y0 + ph - hg}" width="${bw}" height="${hg}" rx="3" fill="${bad ? 'var(--warn)' : opts.color || 'var(--accent)'}" data-tip="${u.esc(`${u.fmtShort(d.date)}: ${opts.fmt ? opts.fmt(v) : v}`)}"></rect>`;
      }
      if (i === 0 || i === n - 1 || i % 7 === 0) s += `<text x="${x + bw / 2}" y="${H - 14}" text-anchor="middle" fill="var(--muted)">${u.esc(u.fmtShort(d.date))}</text>`;
    });
    return u.svg(s + '</svg>');
  }

  // ---------------- tabs ----------------
  function waitingForYou(kids) {
    const ids = kids.map(k => k.id);
    const reqs = (D().redemptions || []).filter(r => r.status === 'requested' && ids.includes(r.childId));
    const props = (D().challenges || []).filter(c => c.status === 'proposed' && R().kidsOf(c).some(k => ids.includes(k)));
    const ticks = (D().ticks || []).filter(t => t.state === 'pending' && ids.includes(t.childId)).filter(t => { const ch = (D().challenges || []).find(c => c.id === t.challengeId); return ch && R().isLive(ch); });
    const wishes = (D().wishes || []).filter(w => (!w.status || w.status === 'waiting') && ids.includes(w.childId));
    if (!reqs.length && !props.length && !ticks.length && !wishes.length) return null;
    return u.section('Waiting for you',
      reqs.map(requestRow),
      props.map(proposalCard),
      ticks.map(t => {
        const ch = (D().challenges || []).find(c => c.id === t.challengeId);
        return h('div', { class: 'row rt-req', style: { gap: '8px' } }, h('b', { 'data-noi18n': '1' }, nm(t.childId)), h('span', { class: 'ux' }, ch.title), h('span', { class: 'small muted' }, u.fmtShort(t.date)),
          t.photo && t.photo.rel ? h('button', { class: 'btn small', onclick: () => window.hub.open(t.photo.rel) }, 'Photo') : null, h('div', { class: 'spacer' }),
          h('button', { class: 'btn small primary', onclick: () => decideTick(t, 'approved') }, 'Approve'), h('button', { class: 'btn small', onclick: () => decideTick(t, 'declined') }, 'Not this time'));
      }),
      wishes.length ? h('div', { class: 'small muted', style: { marginTop: '8px' } }, h('a', { href: '#/routine/wishes' }, `New wishes: ${wishes.map(w => `${nm(w.childId)} - ${w.title}`).join(', ')}`)) : null);
  }

  function todayTab(kids) {
    const parent = isParent();
    const wrap = h('div');
    if (parent) { const w = waitingForYou(kids); if (w) wrap.appendChild(w); }
    wrap.appendChild(h('div', { class: `grid ${kids.length > 1 ? 'g2' : ''}`, style: { alignItems: 'start' } }, kids.map(k => {
      const c = R().checkin(D(), k.id, u.today());
      const y = R().checkin(D(), k.id, R().addDays(u.today(), -1));
      const cons = R().consequencesFor(D(), k.id, u.today());
      const live = (D().challenges || []).filter(ch => R().isLive(ch) && ch.start && R().kidsOf(ch).includes(k.id)).map(ch => ({ ch, p: R().progress(D(), ch, k.id, u.today()) })).filter(x => !x.p.ended && !x.p.upcoming && !x.p.finished);
      return h('div', { class: 'card' },
        kidHead(k, pointsBadge(R().balance(D(), k.id), true)),
        checkinButtons(k.id),
        h('div', { class: 'small muted', style: { margin: '10px 0 4px' } }, 'Today'), checkinSummary(c),
        h('div', { class: 'small muted', style: { margin: '10px 0 4px' } }, 'Yesterday'), checkinSummary(y),
        parent ? h('div', { class: 'row', style: { gap: '6px', marginTop: '8px' } },
          h('button', { class: 'btn small', onclick: () => checkinDialog(k.id, 'evening', R().addDays(u.today(), -1)) }, 'Fill in or correct a day')) : null,
        live.length ? h('div', { style: { marginTop: '12px' } }, h('div', { class: 'small muted', style: { marginBottom: '4px' } }, 'Challenges today'), live.map(({ ch, p }) => {
          const can = R().confirmOf(ch) !== 'auto';
          return h('div', { class: 'row rt-req', style: { gap: '8px', flexWrap: 'nowrap' } },
            h('span', { class: 'ux', style: { flex: 1, minWidth: 0 } }, ch.title), h('span', { class: 'small muted nowrap', 'data-noi18n': '1' }, `${p.done}/${p.required}`),
            p.todayState === 'done' ? u.chip('done today', 'good') : p.todayState === 'pending' ? u.chip('waiting', 'warn') : can ? h('button', { class: 'btn small primary', onclick: () => tickToday(ch, k.id) }, 'Done today') : u.chip('the app checks', ''));
        })) : null,
        cons.length ? h('div', { style: { marginTop: '12px' } }, cons.map(consequenceCard)) : null);
    })));
    return wrap;
  }

  function challengesTab(kids) {
    const parent = isParent();
    const ids = kids.map(k => k.id);
    const mine = ch => R().kidsOf(ch).some(k => ids.includes(k));
    const all = (D().challenges || []).filter(mine);
    const live = all.filter(ch => R().isLive(ch) && ch.start);
    const state = ch => { const ps = R().kidsOf(ch).filter(k => ids.includes(k)).map(k => R().progress(D(), ch, k, u.today())); return ps.every(p => p.finished || p.ended) ? 'past' : 'now'; };
    const now = live.filter(ch => state(ch) === 'now'), past = live.filter(ch => state(ch) === 'past');
    const props = all.filter(ch => ch.status === 'proposed' || ch.status === 'refused');
    const ags = (D().agreements || []).filter(a => a.active !== false && kids.some(k => forKid(a, k.id)));
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '12px', gap: '8px' } }, h('div', { class: 'spacer' }),
        parent ? h('button', { class: 'btn primary', onclick: () => KH.crud.edit('challenges', null, { preset: KH.app.filterChild ? { childIds: [KH.app.filterChild] } : null, onSaved: s => { if (s && !s.status) KH.store.upsert('challenges', Object.assign({}, s, { status: 'active' })); } }) }, '+ New challenge')
          : h('button', { class: 'btn primary', onclick: proposalDialog }, '+ Propose a family agreement')),
      now.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, now.map(ch => challengeCard(ch, kids))) : h('div', { class: 'card empty' }, parent ? 'No challenges running. Press "+ New challenge" to set one.' : 'No challenges right now. You can propose one!'),
      props.length ? h('h3', { style: { margin: '22px 0 10px' } }, 'Family agreements proposed by the children') : null,
      props.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, props.map(proposalCard)) : null,
      !parent && ags.length ? h('h3', { style: { margin: '22px 0 10px' } }, 'Family agreements') : null,
      !parent && ags.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, ags.map(a => agreementCard(a, kids))) : null,
      past.length ? h('h3', { style: { margin: '22px 0 10px' } }, 'Finished') : null,
      past.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, past.map(ch => challengeCard(ch, kids))) : null);
  }

  function agreementsTab(kids) {
    const ags = (D().agreements || []).filter(a => kids.some(k => forKid(a, k.id)));
    const cons = (D().consequences || []).filter(x => kids.some(k => (x.childIds || []).includes(k.id))).sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
    const active = cons.filter(x => R().consequenceActive(x, u.today())), old = cons.filter(x => !R().consequenceActive(x, u.today()));
    return h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Agreements can cover one, two or all the children. When you log a breach, the points of those involved drop and each sees why. A clean week can earn a bonus.'),
      h('div', { class: 'row', style: { marginBottom: '12px' } }, h('div', { class: 'spacer' }), h('button', { class: 'btn primary', onclick: () => KH.crud.edit('agreements') }, '+ New agreement')),
      ags.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, ags.map(a => agreementCard(a, kids))) : h('div', { class: 'card empty' }, 'No agreements yet. Example: "No fighting", for all three, 5 points for a breach and a 5-point bonus for a clean week.'),
      h('h3', { style: { margin: '22px 0 6px' } }, 'Consequences'),
      h('p', { class: 'muted small', style: { marginTop: 0 } }, 'Set by parents only, never automatic. The child sees what, why and until when. Points do not go below zero unless you allow it in Setup.'),
      h('div', { class: 'row', style: { marginBottom: '12px' } }, h('div', { class: 'spacer' }), h('button', { class: 'btn', onclick: () => newConsequence(KH.app.filterChild ? { childIds: [KH.app.filterChild] } : null) }, '+ New consequence')),
      active.length ? u.section('Now', active.map(consequenceCard)) : h('div', { class: 'card empty' }, 'No consequences now.'),
      old.length ? h('details', { class: 'card' }, h('summary', { style: { cursor: 'pointer', fontWeight: 700 } }, `Earlier (${old.length})`), old.slice(0, 40).map(consequenceCard)) : null);
  }

  function rewardsTab(kids) {
    const parent = isParent();
    const ids = kids.map(k => k.id);
    const cat = (D().rewards || []).filter(r => r.active !== false && kids.some(k => forKid(r, k.id))).sort((a, b) => (Number(a.points) || 0) - (Number(b.points) || 0));
    const reqs = (D().redemptions || []).filter(r => ids.includes(r.childId)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const kid = !parent ? me().childId : null;
    const free = kid ? R().available(D(), kid) : 0;
    return h('div', null,
      !parent ? h('div', { class: 'card rt-wallet' }, pointsBadge(R().balance(D(), kid), true), R().reserved(D(), kid) ? h('div', { class: 'small muted' }, `${R().reserved(D(), kid)} of them are kept for rewards you asked for`) : null,
        h('div', { class: 'small muted' }, 'Points only, no money. Spend them on a reward below.')) : null,
      h('div', { class: 'row', style: { margin: '6px 0 12px' } }, h('h3', { style: { margin: 0 } }, 'Rewards'), h('div', { class: 'spacer' }),
        parent ? h('button', { class: 'btn primary', onclick: () => KH.crud.edit('rewards') }, '+ New reward') : null),
      cat.length ? h('div', { class: 'grid g3', style: { alignItems: 'start' } }, cat.map(rw => h('div', { class: 'card rt-reward' },
        h('div', { class: 'row', style: { gap: '8px', flexWrap: 'nowrap' } }, h('b', { class: 'ux', style: { flex: 1 } }, rw.title), h('span', { class: 'rt-cost', 'data-noi18n': '1' }, `${rw.points} ⭐`)),
        rw.kind ? h('div', { class: 'small muted' }, rw.kind) : null,
        parent ? h('div', { class: 'small muted' }, (rw.childIds || []).length ? rw.childIds.map(nm).join(', ') : 'All children') : null,
        !parent ? h('div', { style: { marginTop: '8px' } }, free >= Number(rw.points)
          ? h('button', { class: 'btn small primary', onclick: () => askReward(rw, kid) }, 'Ask for it')
          : h('div', null, h('div', { html: KH.charts.progress(free / (Number(rw.points) || 1) * 100) }), h('div', { class: 'small muted' }, `${Number(rw.points) - free} more points to go`))) : null,
        parent ? h('button', { class: 'btn small', style: { marginTop: '8px' }, onclick: () => KH.crud.edit('rewards', rw) }, 'Edit') : null)))
        : h('div', { class: 'card empty' }, parent ? 'No rewards yet. Add books, outings, extra free time or anything you like, each with its points.' : 'No rewards yet. Ask a parent to add some.'),
      reqs.length ? u.section(parent ? 'Requests' : 'What I asked for', reqs.slice(0, 40).map(requestRow)) : null);
  }

  function wishesTab(kids) {
    const parent = isParent();
    const ids = kids.map(k => k.id);
    let list = (D().wishes || []).filter(w => ids.includes(w.childId));
    const gifts = parent && KH.pages.routineGifts;
    if (gifts) list = list.filter(w => w.status !== 'declined' && w.status !== 'got').sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '12px', gap: '8px' } },
        parent ? h('button', { class: `btn ${gifts ? 'primary' : ''}`, onclick: () => { KH.pages.routineGifts = !gifts; KH.app.refresh(); } }, gifts ? 'Show every wish' : 'Gift ideas (birthday and Eid)') : null,
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: () => KH.crud.edit('wishes', null, { preset: parent ? (KH.app.filterChild ? { childId: KH.app.filterChild } : null) : { childId: me().childId } }) }, '+ Add a wish')),
      gifts ? h('p', { class: 'muted small', style: { marginTop: 0 } }, 'Every wish not yet got or declined, cheapest first.') : null,
      list.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, list.map(wishCard)) : h('div', { class: 'card empty' }, parent ? 'No wishes yet.' : 'Your wishlist is empty. Add something you would love, with a picture or link and a price.'));
  }

  function pointsTab(kids) {
    const parent = isParent();
    return h('div', null,
      parent ? h('div', { class: 'row', style: { marginBottom: '12px', gap: '8px' } }, h('div', { class: 'spacer' }),
        h('button', { class: 'btn', onclick: () => manualPoints(true) }, '+ Give points'), h('button', { class: 'btn', onclick: () => manualPoints(false) }, '− Take points')) : null,
      h('div', { class: `grid ${kids.length > 1 ? 'g3' : ''}`, style: { alignItems: 'start' } }, kids.map(k => {
        const t = R().totals(D(), k.id);
        const led = R().ledger(D(), k.id);
        return h('div', { class: 'card' }, kidHead(k, pointsBadge(t.balance, true)),
          h('div', { class: 'row small muted', style: { gap: '12px', marginBottom: '8px' } }, h('span', null, `Earned ${t.earned}`), h('span', null, `Spent ${t.spent}`), t.taken ? h('span', null, `Taken ${t.taken}`) : null),
          led.length ? h('table', { class: 'list' }, h('tbody', null, led.slice(0, 60).map(p => h('tr', null,
            h('td', { class: 'nowrap small muted' }, u.fmtShort(p.date)), h('td', { class: 'small ux' }, p.reason || ''),
            h('td', { class: 'right nowrap', style: { fontWeight: 800, color: p.amount > 0 ? 'var(--good)' : 'var(--bad)' }, 'data-noi18n': '1' }, p.amount > 0 ? `+${p.amount}` : `−${Math.abs(p.amount)}`))))) : h('div', { class: 'muted small' }, 'No points yet.'));
      })));
  }
  async function manualPoints(give) {
    const kids = KH.store.children();
    const sel = h('select', null, kids.map(c => h('option', { value: c.id, selected: c.id === KH.app.filterChild }, c.name)));
    const n = h('input', { type: 'number', min: '1', value: '5' });
    const why = h('input', { type: 'text', placeholder: give ? 'e.g. Helped Grandma all afternoon' : 'e.g. Was rude at dinner' });
    u.modal({ title: give ? 'Give points' : 'Take points', body: h('div', { class: 'form-grid' }, h('label', { class: 'f' }, h('span', null, 'Child'), sel), h('label', { class: 'f' }, h('span', null, 'Points'), n),
      h('label', { class: 'f full' }, h('span', null, 'Why (the child sees this)'), why)),
    actions: [{ label: 'Cancel' }, { label: give ? 'Give' : 'Take', primary: true, onClick: () => {
      if (!why.value.trim()) { u.toast('Please write why', 'bad'); return false; }
      if (give) addEntry(sel.value, Math.abs(Number(n.value) || 0), why.value.trim(), 'manual');
      else { const t = take(sel.value, Number(n.value) || 0, why.value.trim(), 'manual'); if (!t) u.toast('No points to take: the balance is already zero.'); }
      KH.app.refresh(); return true;
    } }] });
  }

  function trackersTab(kids) {
    const parent = isParent();
    return h('div', null, kids.map(k => {
      const s = R().trackerSummary(D(), k.id, u.today(), 14);
      const pats = parent ? R().patterns(D(), k.id, u.today()) : [];
      const charts = [
        ['Sleep (hours)', dayBars(s.days, 'sleep', { label: 'Sleep', min: 10, under: 8, fmt: v => `${v} h` })],
        ['Screens and gaming (minutes)', dayBars(s.days, 'screen', { label: 'Screens', min: 60, over: 120, color: 'var(--info)', fmt: v => `${v} min` })],
        ['Outdoor play and sport (minutes)', dayBars(s.days, 'active', { label: 'Play and sport', min: 30, color: 'var(--good)', fmt: v => `${v} min` })],
        ['Habits done (%)', dayBars(s.days, 'habits', { label: 'Habits', min: 100, color: 'var(--accent)', fmt: v => `${v}%` })],
        ['How the day felt', dayBars(s.days, 'mood', { label: 'Mood', min: 5, color: 'var(--gold, #D99A1E)', fmt: v => moodFace(v) })],
        ['Reading (minutes)', dayBars(s.days, 'reading', { label: 'Reading', min: 20, color: 'var(--good)', fmt: v => `${v} min` })],
        ['Study (hours)', dayBars(s.days, 'study', { label: 'Study', min: 1, fmt: v => `${v} h` })],
      ].filter(x => x[1]);
      return h('div', { class: 'card', style: { marginBottom: '16px' } },
        kidHead(k, h('span', { class: 'small muted' }, `${s.filled} of 14 days filled in`)),
        h('div', { class: 'grid g4' },
          u.stat('Sleep, school nights', s.sleepSchool === null ? '-' : `${s.sleepSchool} h`, s.bedSchool ? `bed about ${s.bedSchool}` : ''),
          u.stat('Sleep, weekend', s.sleepWeekend === null ? '-' : `${s.sleepWeekend} h`, s.bedWeekend ? `bed about ${s.bedWeekend}` : ''),
          u.stat('Screens and gaming', s.screen === null ? '-' : mins(Math.round(s.screen)), 'a day on average'),
          u.stat('Play and sport', s.active === null ? '-' : mins(Math.round(s.active)), 'a day on average')),
        charts.length ? h('div', { class: 'grid g2' }, charts.map(([t, c]) => h('div', null, h('div', { class: 'small muted', style: { fontWeight: 700 } }, t), c)))
          : h('div', { class: 'empty' }, 'The charts fill in from the check-ins, the reading log and study hours.'),
        h('div', { class: 'small muted', style: { marginTop: '6px' } }, h('a', { href: '#/reading' }, 'Reading log'), ' · ', h('a', { href: '#/study' }, 'Study hours'), ' · ', h('a', { href: '#/lunch' }, 'Lunch box')),
        parent ? h('div', { style: { marginTop: '14px' } }, h('h3', { style: { margin: '0 0 8px' } }, 'Patterns'),
          pats.length ? pats.map(p => h('div', { class: `finding ${p.clear ? 'medium' : ''}` }, p.text)) : h('div', { class: 'muted small' }, 'Patterns appear after about a week of check-ins.'),
          h('ul', { class: 'small muted', style: { margin: '8px 0 0', paddingInlineStart: '18px' } }, R().PATTERN_LIMITS.map(t => h('li', null, t)))) : null);
    }));
  }

  function setupTab() {
    const S = R().settings(D());
    const set = (k, v) => { KH.store.setSetting('routine', Object.assign({}, R().settings(D()), { [k]: v })); KH.app.refresh(); };
    const have = new Set((D().habits || []).map(x => String(x.title).toLowerCase()));
    const sugg = R().SUGGESTED_HABITS.filter(t => !have.has(t.toLowerCase()));
    return h('div', null,
      u.section('Habits in the evening check-in',
        h('p', { class: 'muted small', style: { marginTop: 0 } }, 'Choose the habits for each child. Each ticked habit can earn points.'),
        KH.crud.list('habits', { noBar: false }),
        sugg.length ? h('div', { style: { marginTop: '10px' } }, h('div', { class: 'small muted', style: { marginBottom: '6px' } }, 'Add a suggested habit (for all the children; edit it to choose who):'),
          h('div', { class: 'rt-chips' }, sugg.map(t => h('button', { type: 'button', onclick: () => { KH.store.upsert('habits', { title: t, childIds: [], points: 1, active: true, order: (D().habits || []).length + 1, createdBy: me().id }); KH.app.refresh(); } }, `+ ${t}`)))) : null),
      u.section('Check-ins and points',
        h('label', { class: 'row', style: { gap: '8px' } }, h('input', { type: 'checkbox', checked: S.reminder !== false, onchange: e => set('reminder', e.target.checked) }), h('span', null, 'One gentle reminder for the evening check-in')),
        h('label', { class: 'f', style: { maxWidth: '260px' } }, h('span', null, 'Reminder from (hour of the day)'), h('input', { type: 'number', min: '12', max: '23', value: String(S.eveningHour), onchange: e => set('eveningHour', Math.min(23, Math.max(12, Number(e.target.value) || 18))) })),
        h('label', { class: 'f', style: { maxWidth: '260px' } }, h('span', null, 'Points for each evening check-in'), h('input', { type: 'number', min: '0', value: String(S.checkinPoints), onchange: e => set('checkinPoints', Math.max(0, Number(e.target.value) || 0)) })),
        h('label', { class: 'row', style: { gap: '8px', marginTop: '8px' } }, h('input', { type: 'checkbox', checked: !!S.allowNegative, onchange: e => set('allowNegative', e.target.checked) }), h('span', null, 'Allow points to go below zero')),
        h('div', { class: 'small muted', style: { marginTop: '8px' } }, 'Wallets hold points only. No money goes to the children.')));
  }

  // ---------------- the page ----------------
  const TABS_PARENT = [['', 'Today'], ['challenges', 'Challenges'], ['agreements', 'Agreements & consequences'], ['rewards', 'Rewards'], ['wishes', 'Wishlists'], ['points', 'Points'], ['trackers', 'Trackers & patterns'], ['setup', 'Setup']];
  const TABS_CHILD = [['', 'My day'], ['challenges', 'Challenges'], ['rewards', 'Rewards'], ['wishes', 'My wishlist'], ['points', 'My points'], ['trackers', 'My week']];
  KH.pages.routine = function (route) {
    settle();
    const parent = isParent();
    const tab = (String(route || '').match(/^#\/routine\/(\w+)/) || [])[1] || '';
    const tabs = parent ? TABS_PARENT : TABS_CHILD;
    const kids = kidsFor();
    if (!KH.store.children().length) return h('div', { class: 'card empty' }, 'Add the children in Child profiles first.');
    const body = tab === 'challenges' ? challengesTab(kids) : tab === 'agreements' && parent ? agreementsTab(kids) : tab === 'rewards' ? rewardsTab(kids)
      : tab === 'wishes' ? wishesTab(kids) : tab === 'points' ? pointsTab(kids) : tab === 'trackers' ? trackersTab(kids) : tab === 'setup' && parent ? setupTab() : todayTab(kids);
    return h('div', null,
      h('div', { class: 'tabs' }, tabs.map(([k, label]) => h('a', { class: tab === k ? 'active' : '', href: k ? `#/routine/${k}` : '#/routine' }, label))),
      parent && tab !== 'setup' ? h('div', { class: 'row', style: { marginBottom: '12px' } }, childPicker()) : null,
      body);
  };

  // the Routine tab on a child's page: that child's day, challenges and trackers
  KH.pages.routineChild = function (child) {
    settle();
    const kids = [child];
    const live = (D().challenges || []).filter(ch => R().isLive(ch) && ch.start && R().kidsOf(ch).includes(child.id));
    return h('div', null, todayTab(kids),
      live.length ? h('div', { class: 'grid g2', style: { alignItems: 'start' } }, live.map(ch => challengeCard(ch, kids, { noEdit: true }))) : null,
      trackersTab(kids),
      h('a', { href: '#/routine', onclick: () => { if (isParent()) KH.app.filterChild = child.id; } }, 'Open Routine & rewards'));
  };

  // ---------------- on other pages ----------------
  // the child's own page: check-ins, points and today's challenges at a glance
  KH.routineStrip = function (child) {
    if (!KH.features.on('routine') || !KH.access.allows('#/routine')) return null;
    settle();
    const live = (D().challenges || []).filter(ch => R().isLive(ch) && ch.start && R().kidsOf(ch).includes(child.id)).map(ch => R().progress(D(), ch, child.id, u.today())).filter(p => !p.ended && !p.upcoming && !p.finished);
    const cons = R().consequencesFor(D(), child.id, u.today()).filter(x => x.kind !== 'points');
    return h('div', { class: 'card rt-strip' },
      h('div', { class: 'row', style: { gap: '10px', marginBottom: '10px' } }, h('b', null, isParent() ? 'Routine & points' : 'My day'), h('div', { class: 'spacer' }),
        h('a', { href: '#/routine/rewards', style: { textDecoration: 'none' } }, pointsBadge(R().balance(D(), child.id), true))),
      checkinButtons(child.id),
      h('div', { class: 'row small', style: { gap: '10px', marginTop: '10px' } },
        live.length ? h('a', { href: '#/routine/challenges' }, `${live.length} challenge${live.length === 1 ? '' : 's'} running`) : null,
        live.filter(p => p.todayState === 'done').length ? u.chip(`${live.filter(p => p.todayState === 'done').length} done today`, 'good') : null,
        cons.map(x => u.chip(x.kind === 'ground' ? `No ${String(x.from || 'treats').toLowerCase()}${x.until ? ` until ${u.fmtShort(x.until)}` : ''}` : `Task: ${x.task || ''}`, 'warn')),
        h('div', { class: 'spacer' }), h('a', { href: '#/routine' }, 'Open Routine & rewards')));
  };
  // the parents' Home: each child's points and check-ins today, and what waits for an answer
  KH.routineHome = function () {
    if (!KH.features.on('routine') || !KH.access.allows('#/routine')) return null;
    const kids = KH.store.children();
    if (!kids.length) return null;
    settle();
    const ids = kids.map(k => k.id);
    const waiting = (D().redemptions || []).filter(r => r.status === 'requested' && ids.includes(r.childId)).length
      + (D().challenges || []).filter(c => c.status === 'proposed').length
      + (D().ticks || []).filter(t => t.state === 'pending' && ids.includes(t.childId)).length
      + (D().wishes || []).filter(w => (!w.status || w.status === 'waiting') && ids.includes(w.childId)).length;
    return u.section('Routine & rewards',
      waiting ? h('div', { class: 'finding medium', style: { cursor: 'pointer' }, onclick: () => KH.app.go('#/routine') }, `${waiting} waiting for you`) : null,
      h('table', { class: 'list' }, h('tbody', null, kids.map(k => {
        const c = R().checkin(D(), k.id, u.today());
        return h('tr', { class: 'click', onclick: () => { KH.app.filterChild = k.id; KH.app.go('#/routine'); } },
          h('td', { class: 'nowrap' }, h('span', { class: 'dot', style: { background: KH.kidColor(k), marginInlineEnd: '6px' } }), h('span', { 'data-noi18n': '1' }, k.name)),
          h('td', null, R().morningDone(c) ? u.chip('morning ✓', 'good') : u.chip('morning', ''), ' ', R().eveningDone(c) ? u.chip('evening ✓', 'good') : u.chip('evening', '')),
          h('td', { class: 'right' }, pointsBadge(R().balance(D(), k.id))));
      }))));
  };
})();
