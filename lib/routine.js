// Stage 2 (version 4.3): the children's daily routine and rewards, and the parents' spending register.
// Pure functions over the app's data object, so they run in the window, on the phone, in the main
// process (reminders) and in Node tests. Points are always counted here, never guessed.
//
// Points live in one ledger (data.points). Points the app gives by itself (habits, check-ins,
// challenge days, finished challenges, a clean week under an agreement) have fixed ids, so two
// devices that give the same points make the same record and nothing is counted twice. When such
// points no longer apply (a habit is unticked) the record is kept with "void", because a removed id
// could never come back after sync.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else { root.KH = root.KH || {}; root.KH.routine = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DAY = 864e5;
  const iso = d => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const parse = s => new Date(String(s).slice(0, 10) + 'T00:00:00Z');
  const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * DAY));
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
  const dow = s => parse(s).getUTCDay(); // 0 Sunday ... 6 Saturday
  const weekStart = s => addDays(s, -dow(s)); // weeks run Sunday to Saturday (the school week)
  const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const r1 = x => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDay = s => (s ? `${Number(String(s).slice(8, 10))} ${MON[Number(String(s).slice(5, 7)) - 1]}` : '');
  const num = v => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

  // ---------- settings ----------
  function settings(data) {
    return Object.assign({ allowNegative: false, eveningHour: 18, checkinPoints: 1, reminder: true }, ((data && data.settings) || {}).routine || {});
  }
  const featureOn = (data, key) => (((data.settings || {}).features || {})[key]) !== false;

  // ---------- habits ----------
  const SUGGESTED_HABITS = ['Read for 20 minutes', 'Study', 'Sleep on time', 'Prepare the school bag', 'Homework done', 'Brush teeth', 'Drink enough water', 'Exercise', 'Help at home', 'Tidy my room', 'Prayers on time'];
  const forChild = (rec, childId) => !rec.childIds || !rec.childIds.length || rec.childIds.includes(childId);
  function habitsFor(data, childId) {
    return (data.habits || []).filter(x => x.active !== false && forChild(x, childId)).sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99) || String(a.title).localeCompare(String(b.title)));
  }

  // ---------- check-ins ----------
  const checkinId = (childId, date) => `ci-${childId}-${date}`;
  function checkin(data, childId, date) { return (data.checkins || []).find(c => c.id === checkinId(childId, date)) || (data.checkins || []).find(c => c.childId === childId && c.date === date) || null; }
  const toMin = t => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  // Hours slept the night before: bedtime in the evening (or after midnight) to the wake-up time.
  function sleepHours(c) {
    if (!c) return null;
    const b = toMin(c.bed), w = toMin(c.wake);
    if (b === null || w === null) return null;
    let mins = b >= 12 * 60 ? 24 * 60 - b + w : w - b;
    if (mins <= 0 || mins > 16 * 60) return null;
    return r1(mins / 60);
  }
  // bedtime as minutes after 18:00, so 21:30 < 23:00 < 00:30 sort the right way
  const bedLate = t => { const b = toMin(t); return b === null ? null : (b >= 12 * 60 ? b - 18 * 60 : b + 6 * 60); };
  const screenOf = c => (c && (num(c.screen) !== null || num(c.gaming) !== null) ? (num(c.screen) || 0) + (num(c.gaming) || 0) : null);
  const activeOf = c => (c && (num(c.play) !== null || num(c.sport) !== null) ? (num(c.play) || 0) + (num(c.sport) || 0) : null);
  const morningDone = c => !!(c && (c.bed || c.wake));
  const eveningDone = c => !!(c && c.eveningAt);

  // ---------- challenges ----------
  const KINDS = {
    habit: { label: 'A habit from the check-in', auto: true },
    reading: { label: 'Reading (minutes a day)', auto: true, unit: 'min' },
    study: { label: 'Study (minutes a day)', auto: true, unit: 'min' },
    homework: { label: 'Homework done on time', auto: true },
    screen: { label: 'Screen and gaming time within a limit (minutes)', auto: true, unit: 'min' },
    sleep: { label: 'Sleep (hours a night)', auto: true, unit: 'h' },
    checkin: { label: 'Evening check-in filled in', auto: true },
    custom: { label: 'Something else', auto: false },
  };
  function endOf(ch) {
    if (ch.end) return ch.end;
    const weeks = Math.max(1, Number(ch.weeks) || 1);
    return addDays(ch.start || ch.createdAt || '2000-01-01', weeks * 7 - 1);
  }
  function required(ch) {
    const total = daysBetween(ch.start, endOf(ch)) + 1;
    if (ch.frequency === 'weekly') return Math.max(1, Math.min(total, (Number(ch.daysPerWeek) || 1) * Math.ceil(total / 7)));
    return Math.max(1, total - Math.max(0, Number(ch.freeDays) || 0));
  }
  // How a challenge is confirmed: automatic only where the app knows (else the child's tick).
  const confirmOf = ch => (ch.confirm === 'auto' && !(KINDS[ch.kind] || {}).auto ? 'child' : ch.confirm || 'child');
  const tickId = (chId, childId, date) => `tk-${chId}-${childId}-${date}`;
  function tick(data, chId, childId, date) { return (data.ticks || []).find(t => t.id === tickId(chId, childId, date)) || null; }

  // Did the child do it on that day, by what the app already knows?
  function autoDay(data, ch, childId, date) {
    const target = num(ch.target);
    const c = checkin(data, childId, date);
    switch (ch.kind) {
      case 'habit': return !!(c && (c.habits || []).includes(ch.habitId));
      case 'checkin': return eveningDone(c);
      case 'reading': { const m = (data.readingLog || []).filter(r => r.childId === childId && r.date === date).reduce((s, r) => s + (Number(r.minutes) || 0), 0); return m > 0 && m >= (target || 1); }
      case 'study': { const m = (data.studyLog || []).filter(r => r.childId === childId && r.date === date).reduce((s, r) => s + (Number(r.hours) || 0) * 60, 0); return m > 0 && m >= (target || 1); }
      case 'homework': { const hw = (data.homework || []).filter(x => x.childId === childId && x.due === date); return hw.length > 0 && hw.every(x => x.done); }
      case 'screen': { const s = screenOf(c); return s !== null && eveningDone(c) && s <= (target === null ? 120 : target); }
      case 'sleep': { const s = sleepHours(c); return s !== null && s >= (target || 9); }
      default: return false;
    }
  }
  // the state of one day: 'done' (counts), 'pending' (waits for a parent), 'declined' or ''
  function dayState(data, ch, childId, date) {
    const how = confirmOf(ch);
    if (how === 'auto') return autoDay(data, ch, childId, date) ? 'done' : '';
    const t = tick(data, ch.id, childId, date);
    if (!t || t.state === 'undone') return '';
    if (how === 'parent') return t.state === 'approved' ? 'done' : t.state === 'declined' ? 'declined' : 'pending';
    return 'done';
  }
  const kidsOf = ch => (ch.childIds && ch.childIds.length ? ch.childIds : ch.childId ? [ch.childId] : []);
  const isLive = ch => !ch.status || ch.status === 'active';

  function progress(data, ch, childId, today) {
    const start = ch.start || today, end = endOf(ch), req = required(Object.assign({}, ch, { start }));
    const last = today < end ? today : end;
    const days = [];
    for (let d = start; d <= last; d = addDays(d, 1)) days.push({ date: d, state: dayState(data, ch, childId, d) });
    const done = days.filter(d => d.state === 'done').length;
    const pending = days.filter(d => d.state === 'pending').length;
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) { if (days[i].state === 'done') streak++; else if (i === days.length - 1 && days[i].date === today) continue; else break; }
    const left = today < start ? daysBetween(start, end) + 1 : Math.max(0, daysBetween(today, end));
    const todayState = today >= start && today <= end ? dayState(data, ch, childId, today) : '';
    const finished = done >= req;
    const ended = !finished && today > end;
    const toGo = Math.max(0, req - done);
    const reachable = done + left + (todayState === 'done' || today > end || today < start ? 0 : 1) >= req;
    const thisWeek = days.filter(d => d.date >= weekStart(today) && d.state === 'done').length;
    let cheer = '';
    if (finished) cheer = 'Challenge complete. Well done!';
    else if (!ended && toGo <= 2) cheer = toGo === 1 ? 'Only 1 more day to go!' : 'Only 2 more days to go!';
    else if (!ended && done / req >= 0.75) cheer = 'Nearly there. Keep going!';
    else if (!ended && streak >= 3) cheer = `${streak} days in a row. Great streak!`;
    return { childId, start, end, required: req, done, pending, pct: Math.min(100, Math.round(done / req * 100)), streak, left, toGo, finished, ended, reachable, todayState, thisWeek, days, cheer,
      upcoming: today < start };
  }

  // ---------- points ----------
  const AUTO = ['habit', 'checkin', 'challenge', 'challenge-done', 'clean-week'];
  const liveEntry = p => p && !p.void && Number(p.amount);
  function ledger(data, childId) {
    return (data.points || []).filter(p => p.childId === childId && liveEntry(p)).sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.at || b.updatedAt || '').localeCompare(String(a.at || a.updatedAt || '')));
  }
  function balance(data, childId) {
    const s = (data.points || []).filter(p => p.childId === childId && liveEntry(p)).reduce((x, p) => x + Number(p.amount), 0);
    return settings(data).allowNegative ? s : Math.max(0, s);
  }
  function totals(data, childId) {
    let earned = 0, spent = 0, taken = 0;
    for (const p of (data.points || []).filter(x => x.childId === childId && liveEntry(x))) {
      const a = Number(p.amount);
      if (a > 0) earned += a; else if (p.source === 'reward') spent -= a; else taken -= a;
    }
    return { earned, spent, taken, balance: balance(data, childId) };
  }
  // points promised to rewards the child asked for but a parent has not answered yet
  const reserved = (data, childId) => (data.redemptions || []).filter(r => r.childId === childId && r.status === 'requested').reduce((s, r) => s + (Number(r.points) || 0), 0);
  const available = (data, childId) => Math.max(0, balance(data, childId) - reserved(data, childId));
  // a deduction never takes the balance below zero, unless the parents allow it
  function capTake(data, childId, want) {
    const w = Math.abs(Number(want) || 0);
    return settings(data).allowNegative ? w : Math.min(w, balance(data, childId));
  }

  // Everything the app gives by itself, as ledger entries with fixed ids.
  function autoAwards(data, today) {
    const out = new Map();
    const S = settings(data);
    const add = (id, childId, date, amount, reason, source, refId) => { if (amount > 0 && date <= today) out.set(id, { id, childId, date, amount, reason, source, refId: refId || '' }); };
    const kids = (data.children || []).map(c => c.id);
    if (featureOn(data, 'routine')) {
      for (const c of data.checkins || []) {
        if (!kids.includes(c.childId) || !c.date) continue;
        if (eveningDone(c) && Number(S.checkinPoints) > 0) add(`pt-ci-${c.childId}-${c.date}`, c.childId, c.date, Number(S.checkinPoints), 'Evening check-in', 'checkin', c.id);
        for (const hid of c.habits || []) {
          const hb = (data.habits || []).find(x => x.id === hid);
          if (hb && Number(hb.points) > 0) add(`pt-h-${c.childId}-${c.date}-${hid}`, c.childId, c.date, Number(hb.points), `Habit: ${hb.title}`, 'habit', hid);
        }
      }
      for (const ch of data.challenges || []) {
        if (!isLive(ch) || !ch.start) continue;
        for (const kid of kidsOf(ch)) {
          if (!kids.includes(kid)) continue;
          const p = progress(data, ch, kid, today);
          if (Number(ch.pointsPerDay) > 0) for (const d of p.days) if (d.state === 'done') add(`pt-cd-${ch.id}-${kid}-${d.date}`, kid, d.date, Number(ch.pointsPerDay), `Challenge day: ${ch.title}`, 'challenge', ch.id);
          if (p.finished && Number(ch.finalPoints) > 0) {
            const doneOn = p.days.filter(d => d.state === 'done')[p.required - 1];
            add(`pt-cc-${ch.id}-${kid}`, kid, doneOn ? doneOn.date : today, Number(ch.finalPoints), `Challenge complete: ${ch.title}`, 'challenge-done', ch.id);
          }
        }
      }
      for (const ag of data.agreements || []) {
        if (ag.active === false || !(Number(ag.bonus) > 0) || !ag.start) continue;
        for (const kid of (kidsOf(ag).length ? kidsOf(ag) : kids)) {
          if (!kids.includes(kid)) continue;
          for (let w = weekStart(ag.start); addDays(w, 6) < today; w = addDays(w, 7)) {
            if (w < ag.start) continue; // a part week (the agreement started mid-week) does not count
            if (ag.end && addDays(w, 6) > ag.end) break;
            const broke = (ag.breaches || []).some(b => !b.void && (b.childIds || []).includes(kid) && b.date >= w && b.date <= addDays(w, 6));
            if (!broke) add(`pt-aw-${ag.id}-${kid}-${w}`, kid, addDays(w, 6), Number(ag.bonus), `Clean week: ${ag.title}`, 'clean-week', ag.id);
          }
        }
      }
    }
    return out;
  }
  // What to write so the ledger matches: new or changed automatic entries (and ones to void).
  function settle(data, today) {
    const want = autoAwards(data, today);
    const have = new Map((data.points || []).filter(p => AUTO.includes(p.source)).map(p => [p.id, p]));
    const write = [];
    for (const [id, e] of want) {
      const cur = have.get(id);
      if (!cur || cur.void || Number(cur.amount) !== e.amount || cur.reason !== e.reason) write.push(Object.assign({}, cur || {}, e, { void: false }));
    }
    for (const [id, p] of have) if (!want.has(id) && !p.void) write.push(Object.assign({}, p, { void: true }));
    return write;
  }

  // ---------- consequences ----------
  function consequenceActive(x, today) {
    if (x.endedAt) return false;
    if (x.kind === 'ground') return !x.until || x.until >= today;
    if (x.kind === 'task') return kidsOf(x).some(k => !((x.taskDone || {})[k]));
    return daysBetween(String(x.date || x.createdAt || today).slice(0, 10), today) <= 3;
  }
  function consequencesFor(data, childId, today, all) {
    return (data.consequences || []).filter(x => kidsOf(x).includes(childId) && (all || consequenceActive(x, today)))
      .sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt)));
  }

  // ---------- wishes ----------
  function wishProgress(data, w, today) {
    if (w.challengeId) {
      const ch = (data.challenges || []).find(c => c.id === w.challengeId);
      if (ch) { const p = progress(data, ch, w.childId, today); return { pct: p.pct, text: p.finished ? 'Challenge complete' : `${p.done} of ${p.required} days in "${ch.title}"`, reached: p.finished }; }
    }
    const t = Number(w.targetPoints);
    if (t > 0) { const b = available(data, w.childId); return { pct: Math.min(100, Math.round(b / t * 100)), text: b >= t ? 'Enough points to ask for it' : `${t - b} more points to go`, reached: b >= t }; }
    return null;
  }

  // ---------- trackers ----------
  function daily(data, childId, today, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const c = checkin(data, childId, d);
      const hab = habitsFor(data, childId);
      const read = (data.readingLog || []).filter(r => r.childId === childId && r.date === d).reduce((s, r) => s + (Number(r.minutes) || 0), 0);
      const study = (data.studyLog || []).filter(r => r.childId === childId && r.date === d).reduce((s, r) => s + (Number(r.hours) || 0), 0);
      const l = (data.lunch || []).find(r => r.childId === childId && r.date === d);
      out.push({ date: d, checkin: c, sleep: sleepHours(c), bed: c ? c.bed || '' : '', bedLate: c ? bedLate(c.bed) : null, screen: screenOf(c), gaming: c ? num(c.gaming) : null, active: activeOf(c), mood: c ? num(c.mood) : null,
        habits: c && hab.length ? Math.round((c.habits || []).filter(id => hab.some(x => x.id === id)).length / hab.length * 100) : null,
        reading: read || null, study: study ? r1(study) : null, lunch: l ? l.eaten || l.kind || '' : '', schoolDay: dow(d) <= 4 });
    }
    return out;
  }
  function trackerSummary(data, childId, today, n) {
    const days = daily(data, childId, today, n || 14);
    const avg = (key, pick) => r1(mean(days.filter(pick || (() => true)).map(d => d[key]).filter(v => v !== null && v !== undefined)));
    const school = d => d.schoolDay, weekend = d => !d.schoolDay;
    const bedAvg = (pick) => { const m = mean(days.filter(pick).map(d => d.bedLate).filter(v => v !== null)); if (m === null) return ''; const t = (Math.round(m) + 18 * 60) % (24 * 60); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
    const filled = days.filter(d => d.checkin).length;
    return { days, filled, sleep: avg('sleep'), sleepSchool: avg('sleep', school), sleepWeekend: avg('sleep', weekend), bedSchool: bedAvg(school), bedWeekend: bedAvg(weekend),
      screen: avg('screen'), active: avg('active'), habits: avg('habits'), mood: avg('mood'), reading: avg('reading'), study: avg('study') };
  }

  // ---------- patterns: what the evidence shows and where it stops ----------
  // Marks with a date: marked exams, and report marks whose column has a date.
  function datedMarks(data, childId) {
    const out = [];
    for (const e of data.examDetails || []) {
      if (e.childId !== childId || !e.date || num(e.score) === null) continue;
      const of = num(e.outOf) || 100;
      out.push({ date: e.date, v: r1(num(e.score) / of * 100) });
    }
    for (const rep of data.reports || []) {
      if (rep.childId !== childId || rep.superseded) continue;
      for (const col of rep.columns || []) {
        if (!col.date || col.kind === 'average') continue;
        for (const row of rep.rows || []) {
          const cell = ((rep.cells || {})[row.id] || {})[col.id];
          if (cell && num(cell.v) !== null) out.push({ date: col.date, v: num(cell.v) });
        }
      }
    }
    return out;
  }
  // Split the pairs at the median of the first value and compare the second between the halves.
  function compareHalves(pairs) {
    if (pairs.length < 6) return null;
    const xs = pairs.map(p => p[0]).slice().sort((a, b) => a - b);
    const med = xs[Math.floor(xs.length / 2)];
    let lo = pairs.filter(p => p[0] < med), hi = pairs.filter(p => p[0] >= med);
    if (lo.length < 3 || hi.length < 3) { lo = pairs.filter(p => p[0] <= med); hi = pairs.filter(p => p[0] > med); }
    if (lo.length < 3 || hi.length < 3) return null;
    return { med, lo: mean(lo.map(p => p[1])), hi: mean(hi.map(p => p[1])), nLo: lo.length, nHi: hi.length, n: pairs.length };
  }
  const fmtClock = m => { const t = (Math.round(m) + 18 * 60) % (24 * 60); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  function patterns(data, childId, today) {
    const days = daily(data, childId, today, 60);
    const by = new Map(days.map(d => [d.date, d]));
    const out = [];
    const say = (key, c, show, words) => {
      if (!c) return;
      const diff = c.hi - c.lo;
      const clear = Math.abs(diff) >= words.min;
      out.push({ key, n: c.n, clear, text: clear ? show(c, diff) : words.none(c) });
    };
    // screen and gaming in the evening vs that night's bedtime (written in the next morning's check-in)
    say('screen-bed', compareHalves(days.map(d => { const nx = by.get(addDays(d.date, 1)); return d.screen !== null && nx && nx.bedLate !== null ? [d.screen, nx.bedLate] : null; }).filter(Boolean)),
      (c, diff) => `On days with ${Math.round(c.med)} minutes or more of screens and gaming, bedtime was ${Math.abs(Math.round(diff))} minutes ${diff > 0 ? 'later' : 'earlier'} on average (${fmtClock(c.hi)} against ${fmtClock(c.lo)}, ${c.n} days).`,
      { min: 20, none: c => `Screen time and bedtime: no clear difference yet (${c.n} days).` });
    // sleep the night before vs how the day felt
    say('sleep-mood', compareHalves(days.filter(d => d.sleep !== null && d.mood !== null).map(d => [d.sleep, d.mood])),
      (c, diff) => `After nights of ${c.med} hours or more of sleep, the day felt ${diff > 0 ? 'better' : 'worse'} on average (${r1(c.hi)} against ${r1(c.lo)} out of 5, ${c.n} days).`,
      { min: 0.4, none: c => `Sleep and how the day felt: no clear difference yet (${c.n} days).` });
    // sleep vs study that day
    say('sleep-study', compareHalves(days.filter(d => d.sleep !== null && d.study !== null).map(d => [d.sleep, d.study])),
      (c, diff) => `After nights of ${c.med} hours or more of sleep, study time was ${r1(Math.abs(diff))} hours ${diff > 0 ? 'longer' : 'shorter'} on average (${c.n} days).`,
      { min: 0.3, none: c => `Sleep and study time: no clear difference yet (${c.n} days).` });
    // marks vs the week before them
    const marks = datedMarks(data, childId);
    const weekBefore = (date, key) => { const vals = []; for (let i = 1; i <= 7; i++) { const d = by.get(addDays(date, -i)); if (d && d[key] !== null) vals.push(d[key]); } return vals.length >= 3 ? mean(vals) : null; };
    const markPairs = key => marks.map(m => { const w = weekBefore(m.date, key); return w === null ? null : [w, m.v]; }).filter(Boolean);
    say('sleep-marks', compareHalves(markPairs('sleep')),
      (c, diff) => `Marks after weeks with ${r1(c.med)} hours of sleep or more averaged ${r1(c.hi)}; after weeks with less sleep, ${r1(c.lo)} (${c.n} marks).`,
      { min: 3, none: c => `Sleep in the week before a test and the mark: no clear difference yet (${c.n} marks).` });
    say('screen-marks', compareHalves(markPairs('screen')),
      (c, diff) => `Marks after weeks with ${Math.round(c.med)} minutes or more of screens a day averaged ${r1(c.hi)}; after weeks with less, ${r1(c.lo)} (${c.n} marks).`,
      { min: 3, none: c => `Screen time in the week before a test and the mark: no clear difference yet (${c.n} marks).` });
    say('study-marks', compareHalves(markPairs('study')),
      (c, diff) => `Marks after weeks with ${r1(c.med)} hours of study a day or more averaged ${r1(c.hi)}; after weeks with less, ${r1(c.lo)} (${c.n} marks).`,
      { min: 3, none: c => `Study in the week before a test and the mark: no clear difference yet (${c.n} marks).` });
    return out;
  }
  const PATTERN_LIMITS = ['These only show what happened together, not that one causes the other.', 'Illness, exams, holidays and the subject itself also change sleep, screens and marks.', 'Patterns need at least 6 days (or 6 dated marks) with both values filled in; more check-ins make them more reliable.'];

  // ---------- spending register ----------
  function spendingShares(data, rec) {
    const kids = (rec.childIds && rec.childIds.length ? rec.childIds : (data.children || []).map(c => c.id));
    const amt = Number(rec.amount) || 0;
    if (!kids.length) return [];
    const each = Math.round(amt / kids.length * 100) / 100;
    return kids.map((k, i) => ({ childId: k, amount: i === kids.length - 1 ? Math.round((amt - each * (kids.length - 1)) * 100) / 100 : each }));
  }
  function spendingTotals(data, year) {
    const kids = (data.children || []).map(c => c.id);
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0, byChild: Object.fromEntries(kids.map(k => [k, 0])) }));
    const byChild = Object.fromEntries(kids.map(k => [k, 0]));
    const byCategory = {};
    let total = 0, count = 0;
    const years = new Set();
    for (const r of data.spending || []) {
      if (!r.date) continue;
      const y = String(r.date).slice(0, 4);
      years.add(y);
      if (String(y) !== String(year)) continue;
      const m = months[Number(String(r.date).slice(5, 7)) - 1];
      const amt = Number(r.amount) || 0;
      total += amt; count++; m.total += amt;
      byCategory[r.category || 'Other'] = (byCategory[r.category || 'Other'] || 0) + amt;
      for (const s of spendingShares(data, r)) { if (byChild[s.childId] === undefined) continue; byChild[s.childId] += s.amount; m.byChild[s.childId] += s.amount; }
    }
    const rnd = x => Math.round(x * 100) / 100;
    months.forEach(m => { m.total = rnd(m.total); for (const k of kids) m.byChild[k] = rnd(m.byChild[k]); });
    for (const k of kids) byChild[k] = rnd(byChild[k]);
    return { year: String(year), total: rnd(total), count, months, byChild, byCategory, years: Array.from(years).sort().reverse() };
  }

  // ---------- things to look at (reminders on the PC and the phone) ----------
  function alerts(data, today, opts = {}) {
    const out = [];
    if (!featureOn(data, 'routine')) return out;
    const nm = id => { const c = (data.children || []).find(k => k.id === id); return c ? c.name : 'Unknown'; };
    const only = opts.childId;
    const parent = opts.parent !== undefined ? !!opts.parent : !only;
    const kids = (data.children || []).map(c => c.id).filter(k => !only || k === only);
    const recent = s => daysBetween(String(s || '').slice(0, 10) || today, today) <= 3;
    if (parent) {
      for (const r of data.redemptions || []) if (r.status === 'requested' && kids.includes(r.childId)) out.push({ key: `rw:${r.id}`, kind: 'routine', severity: 'medium', date: String(r.createdAt || today).slice(0, 10), title: `${nm(r.childId)} asked for a reward: ${r.title}`, body: `${r.points} points. Open Routine & rewards to approve or decline.` });
      for (const ch of data.challenges || []) if (ch.status === 'proposed') { const k = kidsOf(ch)[0]; if (!only || kidsOf(ch).includes(only)) out.push({ key: `fa:${ch.id}`, kind: 'routine', severity: 'medium', date: String(ch.createdAt || today).slice(0, 10), title: `${nm(k)} proposed a family agreement: ${ch.title}`, body: ch.finalReward ? `Asks for: ${ch.finalReward}` : '' }); }
      const waiting = (data.ticks || []).filter(t => t.state === 'pending' && kids.includes(t.childId) && recent(t.date)).filter(t => { const ch = (data.challenges || []).find(c => c.id === t.challengeId); return ch && isLive(ch) && confirmOf(ch) === 'parent'; });
      for (const k of kids) { const n = waiting.filter(t => t.childId === k).length; if (n) out.push({ key: `tk:${k}:${today}:${n}`, kind: 'routine', severity: 'info', date: today, title: `${nm(k)}: ${n} challenge day${n === 1 ? '' : 's'} to approve`, body: '' }); }
      for (const w of data.wishes || []) if ((!w.status || w.status === 'waiting') && kids.includes(w.childId) && recent(w.createdAt)) out.push({ key: `wish:${w.id}`, kind: 'routine', severity: 'info', date: String(w.createdAt).slice(0, 10), title: `${nm(w.childId)} added a wish: ${w.title}`, body: '' });
      for (const ch of data.challenges || []) {
        if (!isLive(ch) || !ch.start) continue;
        for (const k of kidsOf(ch).filter(x => kids.includes(x))) { const p = progress(data, ch, k, today); if (p.finished && daysBetween(p.days.filter(d => d.state === 'done')[p.required - 1].date, today) <= 3) out.push({ key: `chd:${ch.id}:${k}`, kind: 'routine', severity: 'positive', date: today, title: `${nm(k)} completed a challenge: ${ch.title}`, body: ch.finalReward ? `Reward: ${ch.finalReward}` : '' }); }
      }
    } else if (only) {
      const S = settings(data);
      const hour = opts.hour !== undefined ? opts.hour : new Date().getHours();
      const c = checkin(data, only, today);
      if (S.reminder !== false && hour >= Number(S.eveningHour || 18) && !eveningDone(c)) out.push({ key: `ci:${only}:${today}`, kind: 'routine', severity: 'info', date: today, title: 'Your evening check-in', body: 'Less than a minute: screens, play, habits and how the day felt. Missing a day is fine.' });
      for (const p of data.points || []) if (p.childId === only && !p.void && Number(p.amount) < 0 && p.source !== 'reward' && recent(p.date)) out.push({ key: `pt:${p.id}`, kind: 'routine', severity: 'medium', date: p.date, title: `${Math.abs(p.amount)} points taken`, body: p.reason || '' });
      for (const x of consequencesFor(data, only, today)) if (x.kind !== 'points' && recent(x.date || x.createdAt)) out.push({ key: `cq:${x.id}`, kind: 'routine', severity: 'medium', date: String(x.date || x.createdAt).slice(0, 10), title: x.kind === 'ground' ? (x.until ? `No ${String(x.from || 'treats').toLowerCase()} until ${fmtDay(x.until)}` : `No ${String(x.from || 'treats').toLowerCase()}`) : `Task to do: ${x.task || ''}`, body: x.reason ? `Why: ${x.reason}` : '' });
      for (const r of data.redemptions || []) if (r.childId === only && (r.status === 'approved' || r.status === 'declined') && recent(r.decidedAt)) out.push({ key: `rwd:${r.id}:${r.status}`, kind: 'routine', severity: r.status === 'approved' ? 'positive' : 'info', date: String(r.decidedAt).slice(0, 10), title: r.status === 'approved' ? `Reward approved: ${r.title}` : `Reward not approved this time: ${r.title}`, body: r.note || '' });
      for (const ch of data.challenges || []) {
        if (!isLive(ch) || !ch.start || !kidsOf(ch).includes(only)) continue;
        const p = progress(data, ch, only, today);
        if (p.cheer && !p.finished && !p.upcoming && p.toGo <= 2) out.push({ key: `cheer:${ch.id}:${only}:${p.toGo}`, kind: 'routine', severity: 'positive', date: today, title: `${ch.title}: ${p.cheer}`, body: '' });
      }
    }
    return out;
  }

  return { settings, SUGGESTED_HABITS, habitsFor, checkinId, checkin, sleepHours, screenOf, activeOf, morningDone, eveningDone, bedLate, toMin,
    KINDS, endOf, required, confirmOf, tickId, tick, autoDay, dayState, kidsOf, isLive, progress,
    ledger, balance, totals, reserved, available, capTake, autoAwards, settle, AUTO,
    consequenceActive, consequencesFor, wishProgress, daily, trackerSummary, datedMarks, patterns, PATTERN_LIMITS,
    spendingShares, spendingTotals, alerts, addDays, daysBetween, weekStart, dow };
});
