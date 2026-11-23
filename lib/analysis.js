// Analysis engine: term summaries, trends, findings, action plans, common trends,
// alerts, goals, exam weak topics, study time, career direction and path advice.
// Pure functions over the app's data object; runs in the app and in Node tests.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./knowledge'));
  else { root.KH = root.KH || {}; root.KH.analysis = factory(root.KH.knowledge); }
})(typeof self !== 'undefined' ? self : this, function (K) {
  'use strict';

  const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const r0 = x => (x === null || x === undefined ? null : Math.round(x));
  const sd = a => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
  const fmtList = arr => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);
  const termNum = t => { const m = String(t || '').match(/\d+/); return m ? Number(m[0]) : 0; };
  const yearNum = y => { const m = String(y || '').match(/\d{4}/); return m ? Number(m[0]) : 0; };

  function settingsOf(data) {
    return Object.assign({ lowMark: 70, dropPoints: 8, reminderDays: 3 }, data.settings || {});
  }

  function childName(data, id) { const c = (data.children || []).find(k => k.id === id); return c ? c.name : 'Unknown'; }

  function reportsFor(data, childId) {
    return (data.reports || []).filter(r => r.childId === childId && !r.superseded)
      .sort((a, b) => yearNum(a.year) - yearNum(b.year) || termNum(a.term) - termNum(b.term) || String(a.importedAt || '').localeCompare(String(b.importedAt || '')));
  }

  function terms(data, childId) {
    const seen = new Map();
    for (const r of reportsFor(data, childId)) seen.set(`${r.year}|${r.term}`, { year: r.year, term: r.term });
    return Array.from(seen.values());
  }

  // Combines all reports of one child for one term into rows of marks.
  function termRows(data, childId, year, term) {
    const reps = reportsFor(data, childId).filter(r => r.year === year && r.term === term);
    const subs = new Map();      // key course|sub -> {course, sub, marks:[], reported}
    const courseRows = new Map(); // course -> marks of course-level rows
    const reported = { overall: null, courses: {}, subs: {} };
    let colOrder = 0;
    for (const rep of reps) {
      const cols = (rep.columns || []).filter(c => c.kind !== 'average');
      if (rep.reported) {
        if (rep.reported.overall !== undefined && rep.reported.overall !== null && rep.reported.overall !== '') reported.overall = Number(rep.reported.overall);
        Object.assign(reported.courses, rep.reported.courses || {});
      }
      // a course with no part rows in this report (common on SABIS) is its own series
      const withParts = new Set((rep.rows || []).filter(r => r.kind !== 'course').map(r => r.course));
      for (const row of rep.rows || []) {
        const cells = (rep.cells || {})[row.id] || {};
        const marks = [];
        cols.forEach((c, i) => {
          const cell = cells[c.id];
          if (!cell || cell.v === '' || cell.v === null || cell.v === undefined || isNaN(Number(cell.v))) return;
          // "when" is for the over-time charts: the week of the mark, or else when it was first seen on SABIS
          const seen = c.seen || (rep.source === 'sabis' && rep.importedAt) || null;
          marks.push({ v: Number(cell.v), star: !!cell.star, col: c.label, date: c.date || null, when: c.date || (seen ? String(seen).slice(0, 10) : null), order: colOrder + i, reportId: rep.id });
        });
        if (row.kind === 'course') {
          const list = courseRows.get(row.course) || [];
          list.push(...marks);
          courseRows.set(row.course, list);
          if (!withParts.has(row.course) && marks.length) {
            const key = `${row.course}|${row.course}`;
            const s = subs.get(key) || { course: row.course, sub: row.course, marks: [], reported: null };
            s.marks.push(...marks);
            subs.set(key, s);
          }
        } else {
          const key = `${row.course}|${row.sub || row.course}`;
          const s = subs.get(key) || { course: row.course, sub: row.sub || row.course, marks: [], reported: null };
          s.marks.push(...marks);
          if (rep.reported && rep.reported.subs && rep.reported.subs[row.id] !== undefined && rep.reported.subs[row.id] !== '') s.reported = Number(rep.reported.subs[row.id]);
          subs.set(key, s);
        }
      }
      colOrder += cols.length;
    }
    for (const s of subs.values()) s.marks.sort((a, b) => a.order - b.order);
    return { reps, subs: Array.from(subs.values()), courseRows, reported };
  }

  function seriesStats(marks) {
    const vals = marks.map(m => m.v);
    const n = vals.length;
    if (!n) return { n: 0, direction: 'none' };
    const first = vals[0], last = vals[n - 1];
    const diffs = vals.slice(1).map((v, i) => v - vals[i]);
    const st = {
      n, first, last, min: Math.min(...vals), max: Math.max(...vals), mean: mean(vals), change: last - first,
      swing: sd(diffs), monoDown: diffs.length >= 2 && diffs.every(d => d < 0), monoUp: diffs.length >= 2 && diffs.every(d => d > 0),
    };
    let dir;
    if (n === 1) dir = 'one';
    else if (n >= 4 && st.swing >= 15) dir = 'uneven';
    else if ((st.change <= -8 && last < 90) || st.change <= -15 || (st.monoDown && st.change <= -6 && last < 90)) dir = 'down';
    else if (st.change >= 5 && first < 90) dir = 'up';
    else dir = 'steady';
    st.direction = dir;
    return st;
  }

  // Full summary of one term for one child.
  function termSummary(data, childId, year, term, opts = {}) {
    const S = settingsOf(data);
    const T = termRows(data, childId, year, term);
    const subjects = T.subs.map(s => {
      const st = seriesStats(s.marks);
      return Object.assign({}, s, st, {
        domain: K.domainOf(s.course, s.sub), skill: K.skillOf(s.sub),
        avg: s.reported !== null && s.reported !== undefined ? s.reported : r0(st.mean),
        label: s.sub && s.sub !== s.course ? `${s.course} ${s.sub}` : s.course,
      });
    });
    // course level
    const courseNames = Array.from(new Set(subjects.map(s => s.course).concat(Array.from(T.courseRows.keys()))));
    const courses = courseNames.map(name => {
      const subsOf = subjects.filter(s => s.course === name);
      const cr = T.courseRows.get(name) || [];
      let avg = T.reported.courses[name];
      let source = 'school';
      if (avg === undefined || avg === null || avg === '') {
        source = 'calculated';
        avg = cr.length ? mean(cr.map(m => m.v)) : mean(subsOf.filter(s => s.avg !== null).map(s => s.avg));
      }
      const marksCount = subsOf.reduce((n, s) => n + s.n, 0) || cr.length;
      return { course: name, avg: r0(Number(avg)), source, marks: marksCount, subs: subsOf, domain: K.domainOf(name, ''), courseMarks: cr };
    }).filter(c => c.avg !== null && !isNaN(c.avg));
    const overallCalc = mean(courses.map(c => c.avg));
    const overall = T.reported.overall !== null && !isNaN(T.reported.overall) ? T.reported.overall : r0(overallCalc);
    const allMarks = subjects.flatMap(s => s.marks);
    const starred = allMarks.filter(m => m.star), notStarred = allMarks.filter(m => !m.star);

    const findings = [];
    const add = (type, severity, text, extra) => findings.push(Object.assign({ type, severity, text }, extra || {}));

    const low = courses.filter(c => c.avg < S.lowMark).sort((a, b) => a.avg - b.avg);
    if (low.length) {
      add('low', low.some(c => c.avg < 60) ? 'high' : 'medium',
        `${fmtList(low.map(c => `${c.course} (${c.avg})`))} ${low.length > 1 ? 'are' : 'is'} below ${S.lowMark}.`, { subjects: low.map(c => c.course) });
    }
    const thin = low.filter(c => c.marks <= 2);
    if (thin.length) {
      add('thin', 'info', `${fmtList(thin.map(c => c.course))} ${thin.length > 1 ? 'rest' : 'rests'} on only one or two marks, so the next result can move ${thin.length > 1 ? 'them' : 'it'} a lot.`, { subjects: thin.map(c => c.course) });
    }
    // well below the child's own level even if not below the threshold
    if (overall !== null) {
      const gap = courses.filter(c => !low.includes(c) && overall - c.avg >= 12);
      if (gap.length) add('gap', 'medium', `${fmtList(gap.map(c => `${c.course} (${c.avg})`))} ${gap.length > 1 ? 'are' : 'is'} well below the rest (overall ${overall}).`, { subjects: gap.map(c => c.course) });
      for (const c of gap) for (const s of c.subs) if (!low.includes(c)) s._gap = true;
    }
    // course-level rows (portal style) that go down across different topics
    for (const c of courses) {
      if (c.courseMarks.length >= 2) {
        const st = seriesStats(c.courseMarks.slice().sort((a, b) => a.order - b.order));
        if (st.direction === 'down' && !subjects.some(s => s.course === c.course && s.direction === 'down')) {
          add('down', st.last < S.lowMark ? 'high' : 'medium', `${c.course} is down: ${st.first} → ${st.last}.`, { subjects: [c.course] });
        }
      }
    }
    for (const s of subjects.filter(x => x.direction === 'down')) {
      add('down', s.last < S.lowMark ? 'high' : 'medium', `${s.label} is sliding: ${s.first} → ${s.last}${s.marks[0].col ? ` since ${s.marks[0].col}` : ''}.`, { subjects: [s.label] });
    }
    const ups = subjects.filter(x => x.direction === 'up');
    if (ups.length) add('up', 'positive', `Going up: ${fmtList(ups.map(s => `${s.label} ${s.first} → ${s.last}`))}.`, { subjects: ups.map(s => s.label) });
    for (const s of subjects.filter(x => x.direction === 'uneven')) {
      add('uneven', 'medium', `${s.label} is uneven: marks swing between ${s.min} and ${s.max}, which usually points to particular topics.`, { subjects: [s.label] });
    }
    // the same skill strong in one language and weak in another
    for (const skill of ['vocabulary', 'reading', 'grammar']) {
      const bySkill = subjects.filter(s => s.skill === skill && ['english', 'arabic', 'foreign'].includes(s.domain) && s.avg !== null);
      if (bySkill.length >= 2) {
        const best = bySkill.reduce((a, b) => (b.avg > a.avg ? b : a));
        const weak = bySkill.filter(s => best.avg - s.avg >= 25);
        if (weak.length) {
          add('skill-gap', 'medium', `${K.skillLabel(skill)} is strong in ${best.course} (${best.avg}) but weak in ${fmtList(weak.map(s => `${s.course} (${s.avg})`))}. The method that works for ${best.course} can be reused.`, { subjects: weak.map(s => s.label) });
        }
      }
    }
    if (starred.length >= 3 && notStarred.length >= 3) {
      const ms = r0(mean(starred.map(m => m.v))), mo = r0(mean(notStarred.map(m => m.v)));
      add('stars', 'medium', `${starred.length} marks have a star, which on SABIS means below the passing average (they average ${ms}; the other marks average ${mo}).`);
    }
    // time off sick inside the weeks the marks cover (only when the columns carry dates)
    if (opts.health) {
      const dated = allMarks.map(m => m.date).filter(Boolean).sort();
      if (dated.length) {
        const from = addDays(dated[0], -10), to = dated[dated.length - 1];
        const eps = (data.sick || []).filter(r => r.childId === childId && r.start && r.start <= to && (r.end || r.start) >= from);
        if (eps.length) {
          const days = eps.reduce((n, r) => n + sickDays(r, data, to), 0);
          add('sick', 'info', `Off sick during this term: ${fmtList(eps.map(r => `${fmtDay(r.start)}${r.end && r.end !== r.start ? '-' + fmtDay(r.end) : ''}${r.illness ? ` (${r.illness})` : ''}`))}${days ? `, ${days} school day${days === 1 ? '' : 's'} missed` : ''}. Marks taken just after may not show their usual level.`);
        }
      }
    }
    const strong = courses.filter(c => c.avg >= 85).sort((a, b) => b.avg - a.avg);
    if (strong.length) add('strength', 'positive', `Strong: ${fmtList(strong.map(c => `${c.course} (${c.avg})`))}.`, { subjects: strong.map(c => c.course) });

    // action plan
    const actions = [];
    const seen = new Set();
    const pushAction = (subject, text, why) => {
      if (seen.has(text)) return;
      seen.add(text);
      actions.push({ key: `${childId}|${year}|${term}|${subject}|${actions.length}`, subject, text, why });
    };
    const focus = [];
    for (const c of low) for (const s of c.subs) if (!focus.includes(s)) focus.push(s);
    for (const s of subjects) if ((s.direction === 'down' || s.direction === 'uneven' || s._gap || (s.avg !== null && s.avg < S.lowMark)) && !focus.includes(s)) focus.push(s);
    for (const s of focus) {
      const list = K.actionsFor(s.domain, s.skill);
      const why = s.direction === 'down' ? `sliding ${s.first} → ${s.last}` : s.direction === 'uneven' ? `uneven ${s.min}-${s.max}` : `average ${s.avg}`;
      if (s.n <= 2 && s.avg < S.lowMark) pushAction(s.label, `${s.label}: look at the marked paper together and see where the marks went.`, why);
      list.slice(0, 2).forEach(t => pushAction(s.label, `${s.label}: ${t.replace(/\{course\}/g, s.course).replace(/\{sub\}/g, s.sub)}`, why));
    }
    if (ups.length) pushAction('Encouragement', `Tell them you noticed: ${fmtList(ups.map(s => `${s.label} ${s.first} → ${s.last}`))}.`, 'improvements');

    const questions = [];
    if (starred.length) questions.push('Which of the starred (below passing average) marks can be retaken, and when?');
    if (T.reported.overall !== null && overallCalc !== null && Math.abs(T.reported.overall - overallCalc) >= 2) questions.push(`How is the overall ${T.reported.overall} calculated? It differs from the plain average of the subjects (${r0(overallCalc)}).`);
    if (subjects.some(s => s.skill === 'weekly')) questions.push('What does AMS measure, and how much does it count?');
    if (thin.length) questions.push(`Can we see the marked papers for ${fmtList(thin.map(c => c.course))}?`);
    questions.push('Which assessments remain this term, and how much does the final count?');

    return { childId, year, term, subjects, courses, overall, overallSource: T.reported.overall !== null ? 'school' : 'calculated',
      marksCount: allMarks.length, findings, actions, questions, starred: starred.length };
  }

  function latestSummary(data, childId) {
    const t = terms(data, childId);
    if (!t.length) return null;
    const last = t[t.length - 1];
    return termSummary(data, childId, last.year, last.term);
  }

  // Patterns shared by two or more children (latest term of each).
  function commonTrends(data) {
    const kids = (data.children || []).map(c => ({ c, s: latestSummary(data, c.id) })).filter(x => x.s);
    const out = [];
    if (kids.length < 2) return out;
    const weakSkill = new Map(), lowDomain = new Map(), strongDomain = new Map(), hasDomain = new Map();
    for (const { c, s } of kids) {
      const byCourse = new Map();
      for (const sub of s.subjects) {
        const arr = byCourse.get(sub.course) || [];
        arr.push(sub); byCourse.set(sub.course, arr);
      }
      for (const sub of s.subjects) {
        if (!sub.skill || sub.avg === null) continue;
        const others = (byCourse.get(sub.course) || []).filter(o => o !== sub && o.avg !== null);
        const rel = others.length ? mean(others.map(o => o.avg)) - sub.avg : 0;
        const weak = sub.avg < 75 || sub.direction === 'down' || rel >= 12;
        const key = sub.skill === 'vocabulary' && sub.domain === 'foreign' ? 'foreign-vocabulary' : sub.skill;
        if (weak) {
          const list = weakSkill.get(key) || [];
          if (!list.some(x => x.c.id === c.id)) list.push({ c, sub });
          weakSkill.set(key, list);
        }
      }
      for (const co of s.courses) {
        const d = co.domain;
        hasDomain.set(d, (hasDomain.get(d) || 0) + 1);
        if (co.avg < 75) { const l = lowDomain.get(d) || []; l.push({ c, co }); lowDomain.set(d, l); }
        if (co.avg >= 85) { const l = strongDomain.get(d) || []; l.push({ c, co }); strongDomain.set(d, l); }
      }
    }
    const labelFor = k => (k === 'foreign-vocabulary' ? 'Foreign-language vocabulary' : K.skillLabel(k));
    for (const [k, list] of weakSkill) {
      if (list.length >= 2) out.push({ type: 'shared-weak', key: `skill:${k}`, severity: 'medium',
        text: `${labelFor(k)} is a weak or slipping area for ${fmtList(list.map(x => x.c.name))}: ${list.map(x => `${x.c.name} ${x.sub.label} ${x.sub.direction === 'down' ? `${x.sub.first} → ${x.sub.last}` : x.sub.avg}`).join('; ')}.`,
        skill: k, children: list.map(x => x.c.id) });
    }
    for (const [d, list] of lowDomain) {
      if (list.length >= 2) out.push({ type: 'shared-low', key: `domain:${d}`, severity: 'medium',
        text: `${K.domainLabel(d)} is low for ${fmtList(list.map(x => `${x.c.name} (${x.co.avg})`))}.`, domain: d, children: list.map(x => x.c.id) });
    }
    for (const [d, list] of strongDomain) {
      if (list.length >= 2 && list.length === hasDomain.get(d)) out.push({ type: 'shared-strength', key: `strong:${d}`, severity: 'positive',
        text: `${K.domainLabel(d)} is strong for ${list.length === kids.length ? 'all of them' : fmtList(list.map(x => x.c.name))} (${list.map(x => x.co.avg).join(', ')}).`, domain: d, children: list.map(x => x.c.id) });
    }
    return out;
  }

  // Cumulative averages by subject area, newer years weighted more.
  function cumulativeDomains(data, childId) {
    const t = terms(data, childId);
    if (!t.length) return {};
    const lastYear = yearNum(t[t.length - 1].year);
    const acc = {};
    for (const { year, term } of t) {
      const s = termSummary(data, childId, year, term);
      const age = lastYear - yearNum(year);
      const w = age <= 0 ? 1 : age === 1 ? 0.7 : 0.5;
      for (const c of s.courses) {
        const a = acc[c.domain] || (acc[c.domain] = { sum: 0, w: 0, terms: 0, courses: new Set() });
        a.sum += c.avg * w; a.w += w; a.terms++; a.courses.add(c.course);
      }
    }
    const out = {};
    for (const [d, a] of Object.entries(acc)) out[d] = { avg: r0(a.sum / a.w), terms: a.terms, courses: Array.from(a.courses) };
    return out;
  }

  function careerDirection(data, childId) {
    const child = (data.children || []).find(c => c.id === childId) || {};
    const dom = cumulativeDomains(data, childId);
    const interests = child.interests || [];
    const fields = K.CAREERS.map(f => {
      let sum = 0, wsum = 0, wall = 0;
      const parts = [];
      for (const [d, w] of Object.entries(f.weights)) {
        wall += w;
        if (dom[d]) { sum += dom[d].avg * w; wsum += w; parts.push({ d, avg: dom[d].avg, w }); }
      }
      const coverage = wall ? wsum / wall : 0;
      const base = wsum ? sum / wsum : null;
      const matched = f.interests.filter(i => interests.includes(i));
      const score = base === null ? null : Math.min(100, base + Math.min(6, matched.length * 3));
      const why = parts.slice().sort((a, b) => b.avg * b.w - a.avg * a.w).slice(0, 2).map(p => `${K.domainLabel(p.d)} ${p.avg}`);
      const weakest = parts.slice().sort((a, b) => a.avg - b.avg)[0];
      return { key: f.key, label: f.label, score: r0(score), base: r0(base), coverage, matched, why, weakest: weakest ? `${K.domainLabel(weakest.d)} (${weakest.avg})` : null,
        needs: f.needs, examples: f.examples, enoughData: coverage >= 0.45 };
    }).filter(f => f.score !== null).sort((a, b) => (b.enoughData - a.enoughData) || b.score - a.score);
    const grade = Number(String(child.grade || '').match(/\d+/) ? String(child.grade).match(/\d+/)[0] : 0);
    const years = new Set((data.reports || []).filter(r => r.childId === childId).map(r => r.year)).size;
    let reliability = 'early signal';
    if (years >= 3 && grade >= 9) reliability = 'fairly reliable';
    else if (years >= 2 || grade >= 9) reliability = 'developing';
    return { fields, domains: dom, reliability, grade, years };
  }

  function international(avg) {
    return { igcse: K.convert('igcse', avg), us: K.convert('us', avg), ib: K.convert('ib', avg), saudi: K.convert('saudi', avg) };
  }

  function pathAdvice(data, childId) {
    const child = (data.children || []).find(c => c.id === childId) || {};
    const cd = careerDirection(data, childId);
    const dom = cd.domains;
    const items = [];
    const avgOf = k => (dom[k] ? dom[k].avg : null);
    const english = avgOf('english'), math = avgOf('math');
    const sciences = ['physics', 'chemistry', 'biology', 'science'].filter(k => dom[k]).map(k => ({ k, avg: dom[k].avg })).sort((a, b) => b.avg - a.avg);
    const top = cd.fields.filter(f => f.enoughData).slice(0, 2);
    const tier = a => (a === null ? 'not enough marks yet' : a >= 75 ? 'Extended' : a >= 60 ? 'Extended if the next term improves, otherwise Core' : 'Core for now');

    // IGCSE
    const ranked = Object.entries(dom).filter(([k]) => !['pe', 'music'].includes(k)).sort((a, b) => b[1].avg - a[1].avg);
    const picks = [];
    for (const core of ['english', 'math']) if (dom[core]) picks.push(core);
    if (sciences[0] && !picks.includes(sciences[0].k)) picks.push(sciences[0].k);
    for (const [k] of ranked) if (!picks.includes(k) && picks.length < 7) picks.push(k);
    items.push({ key: 'igcse', title: 'IGCSE subject choices', lines: [
      `Strongest areas so far: ${ranked.slice(0, 4).map(([k, v]) => `${K.domainLabel(k)} ${v.avg}`).join(', ') || 'not enough marks yet'}.`,
      `Suggested set: ${picks.map(k => K.domainLabel(k)).join(', ') || 'add more reports first'}.`,
      `Mathematics tier: ${tier(math)}.` + (sciences[0] ? ` ${K.domainLabel(sciences[0].k)} tier: ${tier(sciences[0].avg)}.` : ''),
      top.length ? `For the leading direction (${top[0].label}), keep: ${top[0].needs.join(', ')}.` : 'Career-linked subjects appear once more subjects have marks.',
    ] });

    // SAT
    const satLine = (label, a) => (a === null ? `${label}: no marks yet.` : a >= 90 ? `${label} ${a}: strong base; start official practice tests about six months before the test.`
      : a >= 80 ? `${label} ${a}: good base; targeted practice on weak topics.` : a >= 70 ? `${label} ${a}: build school fundamentals first, then SAT practice.` : `${label} ${a}: focus on school ${label} before SAT preparation.`);
    items.push({ key: 'sat', title: 'SAT readiness', lines: [satLine('English', english), satLine('Math', math),
      'Most students take the SAT in Grade 11, with a retake option in Grade 12.'] });

    // English tests
    items.push({ key: 'english-tests', title: 'IELTS / TOEFL', lines: [english === null ? 'Add English marks to get advice.'
      : english >= 85 ? `English ${english}: likely ready for a high band with a few weeks of exam-format practice.`
      : english >= 70 ? `English ${english}: build reading and writing for a year before booking the test.` : `English ${english}: focus on school English first.`] });

    // Saudi universities
    const tahsili = ['math', 'physics', 'chemistry', 'biology'].filter(k => dom[k]).map(k => `${K.domainLabel(k)} ${dom[k].avg}`);
    items.push({ key: 'saudi', title: 'Saudi universities (Qudurat / Tahsili)', lines: [
      'Qudurat tests verbal and maths reasoning; Tahsili tests Math, Physics, Chemistry and Biology for science tracks.',
      tahsili.length ? `Current science and math averages: ${tahsili.join(', ')}.` : 'Science and math marks will show readiness here.',
    ] });

    // SABIS
    const sabis = /sabis/i.test(child.school || '') || child.curriculum === 'SABIS' ||
      (data.reports || []).some(r => r.childId === childId && (r.rows || []).some(row => /^a\.?m\.?s\.?$/i.test(row.sub || '')));
    if (sabis) items.push({ key: 'sabis', title: 'SABIS track', lines: [
      'Weekly periodic and AMS results are an early signal: a run of low weekly marks usually shows up later in term exams.',
      'Ask the school which external exams the program offers at their grade (IGCSE, AP, SAT, A-Levels) and when subject choices are made.',
    ] });
    return { items, careers: cd };
  }

  function qualificationAdvice(data, childId) {
    const quals = (data.qualifications || []).filter(q => q.childId === childId);
    const dom = cumulativeDomains(data, childId);
    return quals.map(q => {
      const d = K.domainOf(q.subject || '', q.subject || '');
      const avg = dom[d] ? dom[d].avg : null;
      const lines = [];
      if (avg !== null) lines.push(`School average in ${K.domainLabel(d)}: ${avg} (about ${K.convert('igcse', avg)} on an IGCSE-style scale).`);
      const target = q.target || q.predicted;
      const mock = q.mock;
      if (mock && target && String(mock) !== String(target)) lines.push(`Mock ${mock} vs target ${target}: plan revision on the weakest papers first.`);
      if (/igcse/i.test(q.type || '') && avg !== null) lines.push(`Suggested tier: ${avg >= 75 ? 'Extended' : avg >= 60 ? 'Extended with support, or Core' : 'Core'}.`);
      if (q.examDate) lines.push(`Exam on ${q.examDate}: start structured revision 8 weeks before.`);
      return { id: q.id, title: `${q.type || 'Exam'} ${q.subject || ''}`.trim(), lines };
    });
  }

  function examWeakTopics(data, childId) {
    const map = new Map();
    for (const e of (data.examDetails || []).filter(x => x.childId === childId)) {
      for (const q of e.questions || []) {
        if (!q.topic) continue;
        const key = `${e.subject}|${q.topic.trim().toLowerCase()}`;
        const t = map.get(key) || { subject: e.subject, topic: q.topic.trim(), total: 0, wrong: 0, exams: new Set() };
        t.total++; if (!q.correct) t.wrong++; t.exams.add(e.title || e.date);
        map.set(key, t);
      }
    }
    return Array.from(map.values()).map(t => Object.assign(t, { rate: t.wrong / t.total, exams: t.exams.size }))
      .filter(t => t.wrong >= 2 || (t.total >= 2 && t.rate >= 0.5))
      .sort((a, b) => b.wrong - a.wrong || b.rate - a.rate)
      .map(t => Object.assign(t, { advice: `${t.subject} - ${t.topic}: ${t.wrong} of ${t.total} questions wrong. Redo them, then practise five similar questions and ask the teacher for a worksheet.` }));
  }

  // Books a child finished since a day (the library shelf in version 3, the old book list before it).
  function finishedBooks(data, childId, since) {
    const ok = x => x.childId === childId && x.status === 'Finished' && (!since || !x.endDate || x.endDate >= since);
    return data.shelf ? data.shelf.filter(ok).length : (data.books || []).filter(ok).length;
  }

  const goalSteps = g => String(g.steps || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  function goalsProgress(data, childId, today) {
    today = today || isoToday();
    const goals = (data.goals || []).filter(g => g.childId === childId);
    const latest = latestSummary(data, childId);
    const weekStart = addDays(today, -6);
    const inWeek = d => d && d >= weekStart && d <= today;
    return goals.map(g => {
      const kind = g.kind || 'Subject mark';
      let target = Number(g.target) || 0, current = null, unit = '', label = '';
      if (kind === 'Subject mark') {
        let summary = latest;
        if (g.year && g.term) summary = termSummary(data, childId, g.year, g.term);
        if (summary) {
          const subj = String(g.subject || '').toLowerCase();
          const co = summary.courses.find(c => c.course.toLowerCase() === subj);
          const su = summary.subjects.find(x => x.label.toLowerCase() === subj || x.sub.toLowerCase() === subj);
          current = co ? co.avg : su ? su.avg : null;
        }
        label = `${g.subject || 'Subject'}: ${target}`;
      } else if (kind === 'Reading minutes a week') {
        current = (data.readingLog || []).filter(r => r.childId === childId && inWeek(r.date)).reduce((t, r) => t + Number(r.minutes || 0), 0);
        unit = 'min'; label = `Read ${target} minutes a week`;
      } else if (kind === 'Study hours a week') {
        current = Math.round((data.studyLog || []).filter(r => r.childId === childId && inWeek(r.date)).reduce((t, r) => t + Number(r.hours || 0), 0) * 10) / 10;
        unit = 'h'; label = `Study ${target} hours a week`;
      } else if (kind === 'Books to finish') {
        current = finishedBooks(data, childId, String(g.createdAt || '').slice(0, 10));
        unit = 'books'; label = `Finish ${target} book${target === 1 ? '' : 's'}`;
      } else {
        const steps = goalSteps(g);
        if (steps.length) { const ticks = g.ticks || []; current = steps.filter(x => ticks.includes(x)).length; target = steps.length; unit = 'steps'; }
        else current = Number(g.count) || 0;
        label = g.title || 'My goal';
      }
      const pct = target ? Math.max(0, Math.min(100, Math.round((current || 0) / target * 100))) : 0;
      const status = current === null ? 'no data' : target && current >= target ? 'met'
        : kind === 'Subject mark' ? (target - current <= 5 ? 'close' : 'behind') : pct >= 70 ? 'close' : 'on the way';
      return Object.assign({}, g, { kind, target, current, unit, label, pct, status, steps: kind === 'My own goal' ? goalSteps(g) : [], gap: current === null ? null : target - current });
    });
  }

  function studyStats(data, childId, today) {
    const logs = (data.studyLog || []).filter(l => l.childId === childId);
    const day = d => String(d).slice(0, 10);
    const now = today ? new Date(today) : new Date();
    const byDay = new Map();
    for (const l of logs) byDay.set(day(l.date), (byDay.get(day(l.date)) || 0) + Number(l.hours || 0));
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
      let total = 0;
      for (let d = 0; d < 7; d++) {
        const dt = new Date(now); dt.setDate(dt.getDate() - (w * 7 + d));
        total += byDay.get(dt.toISOString().slice(0, 10)) || 0;
      }
      weeks.push(Math.round(total * 10) / 10);
    }
    let streak = 0;
    for (let d = 0; d < 400; d++) {
      const dt = new Date(now); dt.setDate(dt.getDate() - d);
      const v = byDay.get(dt.toISOString().slice(0, 10)) || 0;
      if (v > 0) streak++; else if (d > 0) break;
    }
    const last7 = weeks[weeks.length - 1];
    return { weeks, streak, last7, avgPerDay: Math.round((last7 / 7) * 10) / 10, days: byDay.size };
  }

  // Date helpers
  function daysBetween(a, b) {
    const d1 = new Date(String(a).slice(0, 10) + 'T00:00:00'), d2 = new Date(String(b).slice(0, 10) + 'T00:00:00');
    return Math.round((d2 - d1) / 86400000);
  }
  function nextBirthday(dob, today) {
    if (!dob) return null;
    const t = new Date(String(today).slice(0, 10) + 'T00:00:00');
    const b = new Date(String(dob).slice(0, 10) + 'T00:00:00');
    let next = new Date(t.getFullYear(), b.getMonth(), b.getDate());
    if (next < t) next = new Date(t.getFullYear() + 1, b.getMonth(), b.getDate());
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    return { date: iso, age: next.getFullYear() - b.getFullYear(), inDays: daysBetween(today, iso) };
  }

  // Calendar entries from every section.
  // ---------- health & lunch ----------
  const pad2 = n => String(n).padStart(2, '0');
  const isoOf = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const isoToday = () => isoOf(new Date());
  const addDays = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + 'T00:00:00'); d.setDate(d.getDate() + n); return isoOf(d); };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmtDay = iso => { const d = new Date(String(iso).slice(0, 10) + 'T00:00:00'); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const acYear = iso => { const d = new Date(String(iso).slice(0, 10) + 'T00:00:00'); const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${pad2((y + 1) % 100)}`; };
  const isoWeek = iso => { const d = new Date(String(iso).slice(0, 10) + 'T00:00:00'); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day + 3); const first = new Date(d.getFullYear(), 0, 4); return `${d.getFullYear()}-W${pad2(1 + Math.round(((d - first) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7))}`; };
  const weekendDays = data => ((data.settings || {}).weekend === 'sat-sun' ? [6, 0] : [5, 6]); // Saudi schools: Friday-Saturday

  // School days between two dates (inclusive), skipping the weekend and recorded holidays.
  function schoolDaysBetween(start, end, data) {
    if (!start) return 0;
    const wk = weekendDays(data);
    const hols = (data.holidays || []).filter(x => x.start && x.kind !== 'School event');
    let n = 0;
    let d = String(start).slice(0, 10);
    const last = String(end || start).slice(0, 10);
    for (let i = 0; d <= last && i < 200; i++, d = addDays(d, 1)) {
      const day = new Date(d + 'T00:00:00').getDay();
      if (wk.includes(day)) continue;
      if (hols.some(x => d >= x.start && d <= (x.end || x.start))) continue;
      n++;
    }
    return n;
  }
  // School days missed for one sick record: as entered, otherwise counted from the dates.
  function sickDays(rec, data, today) {
    if (rec.daysOff !== undefined && rec.daysOff !== null && rec.daysOff !== '' && !isNaN(Number(rec.daysOff))) return Number(rec.daysOff);
    const t = today || isoToday();
    const end = rec.end && rec.end < t ? rec.end : t;
    return end < rec.start ? 0 : schoolDaysBetween(rec.start, end, data);
  }

  function sickStats(data, childId, today) {
    const t = today || isoToday();
    const recs = (data.sick || []).filter(r => r.childId === childId && r.start).sort((a, b) => String(a.start).localeCompare(String(b.start)));
    const exams = (data.exams || []).filter(e => e.childId === childId && e.date);
    const all = recs.map(r => ({ rec: r, days: sickDays(r, data, t), ongoing: r.start <= t && (!r.end || r.end >= t),
      missed: exams.filter(e => e.date >= r.start && e.date <= (r.end || t) && e.date <= t) }));
    const ay = acYear(t);
    const yr = all.filter(x => acYear(x.rec.start) === ay);
    return {
      all, year: ay, episodes: yr.length, daysOff: yr.reduce((n, x) => n + x.days, 0),
      doctorVisits: yr.filter(x => x.rec.visitDate || x.rec.doctor).length, cost: yr.reduce((n, x) => n + (Number(x.rec.cost) || 0), 0),
      current: (all.filter(x => x.ongoing).pop() || {}).rec || null, last: recs[recs.length - 1] || null,
      missedExams: all.flatMap(x => x.missed.map(e => ({ exam: e, rec: x.rec }))),
    };
  }

  const LUNCH_SCORE = { All: 1, Most: 0.75, Half: 0.5, Little: 0.25, None: 0 };
  const splitItems = s => String(s || '').split(/[,\u060C;\n]+/).map(x => x.trim()).filter(Boolean);
  function lunchStats(data, childId, today, days) {
    const t = today || isoToday();
    const span = days || 30;
    const mine = (data.lunch || []).filter(r => r.childId === childId && r.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const recs = mine.filter(r => { const d = daysBetween(r.date, t); return d >= 0 && d < span; });
    const scored = recs.filter(r => r.eaten in LUNCH_SCORE && r.kind !== 'None' && r.kind !== 'Canteen');
    const tally = list => {
      const items = new Map();
      const get = name => { const k = name.toLowerCase().replace(/\s+/g, ' '); if (!items.has(k)) items.set(k, { name, packed: 0, back: 0 }); return items.get(k); };
      const nk = x => x.toLowerCase().replace(/\s+/g, ' ');
      for (const r of list) {
        const packed = splitItems(r.items);
        for (const it of packed) get(it).packed++;
        // "sandwich" coming back counts against "Cheese sandwich" packed that day
        for (const it of splitItems(r.leftovers)) {
          const match = packed.find(p => nk(p) === nk(it)) || packed.find(p => nk(p).includes(nk(it)) || nk(it).includes(nk(p)));
          get(match || it).back++;
        }
      }
      return Array.from(items.values());
    };
    const items = tally(recs);
    const returned = items.filter(i => i.back >= 2).sort((a, b) => b.back / Math.max(b.packed, b.back) - a.back / Math.max(a.packed, a.back) || b.back - a.back);
    const finished = items.filter(i => i.packed >= 3 && i.back === 0).sort((a, b) => b.packed - a.packed);
    const month = t.slice(0, 7);
    const last5 = scored.slice(-5);
    return {
      days: recs.length, eatenPct: scored.length ? r0(mean(scored.map(r => LUNCH_SCORE[r.eaten])) * 100) : null,
      finished: finished.slice(0, 4), returned: returned.slice(0, 4),
      canteenMonth: mine.filter(r => String(r.date).startsWith(month)).reduce((n, r) => n + (Number(r.canteen) || 0), 0),
      last5: last5.length, poorRecent: last5.filter(r => LUNCH_SCORE[r.eaten] <= 0.25).length,
      common: tally(mine).sort((a, b) => b.packed - a.packed).slice(0, 30).map(i => i.name),
      lastEntry: mine[mine.length - 1] || null,
    };
  }

  // Settings > Features: a switched-off part makes no reminders and no calendar entries
  const FEATURE_OF = { payment: 'money', health: 'health', homework: 'school', announcement: 'school', goal: 'goals', lunch: 'lunch' };
  const featureOff = (data, kind) => { const f = ((data.settings || {}).features || {}); return !!FEATURE_OF[kind] && f[FEATURE_OF[kind]] === false; };
  function calendarItems(data, opts = {}) {
    const items = [];
    const kids = data.children || [];
    const only = opts.childId;
    const nm = id => childName(data, id);
    const keep = id => !only || !id || id === only;
    for (const e of data.exams || []) if (keep(e.childId) && e.date) items.push({ date: e.date, type: 'exam', title: `${nm(e.childId)}: ${e.subject || ''} ${e.title || 'exam'}`.trim(), childId: e.childId, id: e.id });
    for (const h of data.holidays || []) if (h.start) items.push({ date: h.start, end: h.end || h.start, type: h.kind === 'School event' ? 'event' : 'holiday', title: h.title || 'Holiday', id: h.id });
    const amt = p => (opts.hideAmounts ? '••••' : (p.amount || ''));
    if (!only && !opts.noMoney) for (const p of data.payments || []) if (p.dueDate && p.status !== 'paid') items.push({ date: p.dueDate, type: 'payment', title: `${p.description || p.category || 'Payment'}${p.childId ? ' - ' + nm(p.childId) : ''} (${amt(p)} ${(data.settings || {}).currency || 'SAR'})`, childId: p.childId, id: p.id });
    for (const hw of data.homework || []) if (keep(hw.childId) && hw.due) items.push({ date: hw.due, type: 'homework', title: `${nm(hw.childId)}: ${hw.subject ? hw.subject + ' - ' : ''}${hw.title || 'homework'}`, childId: hw.childId, id: hw.id });
    if (!only) for (const m of data.meetings || []) if (m.meetingDate) items.push({ date: m.meetingDate, type: 'meeting', title: `School meeting${m.childId ? ' - ' + nm(m.childId) : ''}: ${m.with || ''}`.trim(), childId: m.childId, id: m.id });
    for (const q of data.qualifications || []) if (keep(q.childId) && q.examDate) items.push({ date: q.examDate, type: 'qualification', title: `${nm(q.childId)}: ${q.type || ''} ${q.subject || ''}`.trim(), childId: q.childId, id: q.id });
    for (const c of kids) if (keep(c.id) && c.dob) {
      const year = opts.year || new Date().getFullYear();
      for (const y of [year - 1, year, year + 1]) items.push({ date: `${y}-${String(c.dob).slice(5, 10)}`, type: 'birthday', title: `${c.name}'s birthday`, childId: c.id });
    }
    for (const co of data.courses || []) for (const s of co.sessions || []) if (keep(co.childId) && s.date) items.push({ date: s.date, type: 'course', title: `${nm(co.childId)}: ${co.subject} session`, childId: co.childId, id: co.id });
    const parentView = opts.parent !== undefined ? !!opts.parent : !only;
    const t = opts.today || isoToday();
    if (parentView) for (const r of data.sick || []) if (keep(r.childId) && r.start) items.push({ date: r.start, end: r.end || (r.start <= t ? t : r.start), type: 'sick', title: `${nm(r.childId)} sick${r.illness ? ': ' + r.illness : ''}`, childId: r.childId, id: r.id });
    return items.filter(i => !featureOff(data, i.type)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  // Everything worth a notification, newest analysis first.
  function alerts(data, today, opts = {}) {
    const S = settingsOf(data);
    const out = [];
    const only = opts.childId;
    const keep = id => !only || !id || id === only;
    const nm = id => childName(data, id);
    for (const e of data.exams || []) {
      if (!keep(e.childId) || !e.date) continue;
      const d = daysBetween(today, e.date);
      if (d >= 0 && d <= 7) out.push({ key: `exam:${e.id}:${d <= 1 ? 'soon' : 'week'}`, kind: 'upcoming', severity: d <= 2 ? 'high' : 'medium', date: e.date,
        title: `${nm(e.childId)}: ${e.subject || ''} ${e.title || 'exam'} ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`.replace(/\s+/g, ' '),
        body: Number(e.revisionDays || 3) >= d ? 'Time to start revision.' : '' });
    }
    const parentSide = opts.parent !== undefined ? !!opts.parent : !only;
    if (parentSide) {
      for (const p of (opts.noMoney ? [] : data.payments || [])) {
        if (!p.dueDate || p.status === 'paid' || !keep(p.childId)) continue;
        const d = daysBetween(today, p.dueDate);
        const amount = opts.hideAmounts ? '••••' : (p.amount || '');
        if (d < 0) out.push({ key: `pay:${p.id}:overdue`, kind: 'payment', severity: 'high', date: p.dueDate, title: `Overdue: ${p.description || p.category} (${amount} ${S.currency || 'SAR'})`, body: `Was due ${p.dueDate}.` });
        else if (d <= Number(S.reminderDays || 3)) out.push({ key: `pay:${p.id}:due`, kind: 'payment', severity: 'medium', date: p.dueDate, title: `Payment due ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}: ${p.description || p.category}`, body: `${amount} ${S.currency || 'SAR'}${p.childId ? ' - ' + nm(p.childId) : ''}` });
      }
      for (const m of data.meetings || []) {
        if (!m.meetingDate || !keep(m.childId)) continue;
        const d = daysBetween(today, m.meetingDate);
        if (d >= 0 && d <= 3) out.push({ key: `meet:${m.id}`, kind: 'upcoming', severity: 'medium', date: m.meetingDate, title: `School meeting ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}${m.childId ? ' - ' + nm(m.childId) : ''}`, body: m.reason || '' });
      }
    }
    for (const h of data.holidays || []) {
      if (!h.start) continue;
      const d = daysBetween(today, h.start);
      if (d >= 0 && d <= 3) out.push({ key: `hol:${h.id}`, kind: 'upcoming', severity: 'info', date: h.start, title: `${h.title || 'Holiday'} starts ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`, body: h.end ? `Until ${fmtDay(h.end)}.` : '' });
    }
    for (const hw of data.homework || []) {
      if (!keep(hw.childId) || !hw.due) continue;
      const d = daysBetween(today, hw.due);
      if (d >= 0 && d <= 2) out.push({ key: `hw:${hw.id}`, kind: 'homework', severity: 'medium', date: hw.due,
        title: `${nm(hw.childId)}: homework due ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'in 2 days'}`, body: `${hw.subject ? hw.subject + ' - ' : ''}${hw.title || ''}` });
    }
    for (const q of data.qualifications || []) {
      if (!keep(q.childId) || !q.examDate) continue;
      const d = daysBetween(today, q.examDate);
      if (d >= 0 && d <= 14) out.push({ key: `qual:${q.id}:${d <= 3 ? 'soon' : 'fortnight'}`, kind: 'upcoming', severity: d <= 3 ? 'high' : 'medium', date: q.examDate, title: `${nm(q.childId)}: ${q.type || ''} ${q.subject || ''} ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`.replace(/\s+/g, ' '), body: '' });
    }
    for (const c of data.children || []) {
      if (!keep(c.id)) continue;
      const nb = nextBirthday(c.dob, today);
      if (nb && nb.inDays <= 7) out.push({ key: `bday:${c.id}:${nb.date}`, kind: 'birthday', severity: 'info', date: nb.date, title: nb.inDays === 0 ? `Today is ${c.name}'s birthday (${nb.age})` : `${c.name} turns ${nb.age} in ${nb.inDays} days`, body: '' });
      const s = latestSummary(data, c.id);
      if (s) {
        for (const f of s.findings.filter(x => ['low', 'down', 'skill-gap'].includes(x.type))) {
          out.push({ key: `find:${c.id}:${s.year}:${s.term}:${f.type}:${(f.subjects || []).join(',')}`, kind: 'analysis', severity: f.severity === 'high' ? 'high' : 'medium', date: today,
            title: `${c.name}: ${f.type === 'low' ? 'low marks' : f.type === 'down' ? 'a subject is sliding' : 'a skill gap'}`, body: f.text });
        }
      }
    }
    const parentView = opts.parent !== undefined ? !!opts.parent : !only;
    if (parentView) {
      for (const c of data.children || []) {
        if (!keep(c.id)) continue;
        const ss = sickStats(data, c.id, today);
        for (const x of ss.all) {
          const r = x.rec;
          if (x.ongoing) {
            const n = daysBetween(r.start, today) + 1;
            if (n >= 3) out.push({ key: `sick:${r.id}:long:${Math.floor(n / 3)}`, kind: 'health', severity: 'medium', date: today, title: `${c.name} has been sick for ${n} days`,
              body: `Since ${fmtDay(r.start)}${r.illness ? ` (${r.illness})` : ''}. Add the end date in Sick records when ${c.name} is better.` });
          }
          if (r.followUp) {
            const d = daysBetween(today, r.followUp);
            if (d >= 0 && d <= Number(S.reminderDays || 3)) out.push({ key: `sick:${r.id}:follow`, kind: 'health', severity: 'medium', date: r.followUp,
              title: `${c.name}: follow-up appointment ${d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`}`, body: r.doctor || '' });
          }
          const recent = daysBetween(r.end && r.end < today ? r.end : today, today) <= 21;
          if (recent && x.days > 0 && !r.noteSent) out.push({ key: `sick:${r.id}:note`, kind: 'health', severity: 'medium', date: r.start, title: `Medical note for school: ${c.name}`,
            body: `${x.days} school day${x.days === 1 ? '' : 's'} missed from ${fmtDay(r.start)}. Tick "Medical note given to the school" in the sick record once it is done.` });
          if (recent && !r.makeUp && x.missed.length) out.push({ key: `sick:${r.id}:makeup`, kind: 'health', severity: 'high', date: x.missed[0].date,
            title: `${c.name} was sick on the day of ${fmtList(x.missed.map(e => `${e.subject || 'an exam'} (${fmtDay(e.date)})`))}`,
            body: 'Ask the school about a make-up test, then tick "Missed tests / make-up arranged" in the sick record.' });
        }
        const ls = lunchStats(data, c.id, today);
        if (ls.last5 >= 4 && ls.poorRecent >= 3) out.push({ key: `lunch:${c.id}:${isoWeek(today)}`, kind: 'lunch', severity: 'info', date: today,
          title: `${c.name} brought most of the lunch back on ${ls.poorRecent} of the last ${ls.last5} days`,
          body: ls.returned.length ? `Often comes back: ${fmtList(ls.returned.map(i => i.name))}.` : 'Worth asking what they would rather have.' });
      }
    }
    for (const c of data.children || []) {
      if (!keep(c.id)) continue;
      for (const g of goalsProgress(data, c.id, today)) {
        if (g.status !== 'met') continue;
        const weekly = /a week$/.test(g.kind);
        out.push({ key: `goal:${g.id}:met${weekly ? ':' + isoWeek(today) : ''}`, kind: 'goal', severity: 'positive', date: today,
          title: parentSide ? `${c.name} reached a goal: ${g.label}` : `You reached your goal: ${g.label}`, body: g.reward ? `Reward: ${g.reward}` : 'Well done!' });
      }
    }
    if (parentSide) {
      const kids = new Set((data.users || []).filter(x => x.role === 'child').map(x => x.id));
      const WHAT = { achievements: 'an achievement', qualifications: 'a qualification', diary: 'a school diary entry', sick: 'a sick report', goals: 'a goal' };
      for (const [coll, what] of Object.entries(WHAT)) {
        for (const r of data[coll] || []) {
          if (!kids.has(r.createdBy) || !keep(r.childId)) continue;
          const day = String(r.createdAt || '').slice(0, 10);
          if (!day || daysBetween(day, today) > 3) continue;
          const name = r.title || r.illness || r.kind || r.type || r.subject || '';
          out.push({ key: `kidadd:${r.id}`, kind: coll === 'sick' ? 'health' : 'kid', severity: coll === 'sick' ? 'high' : 'info', date: day,
            title: `${nm(r.childId)} added ${what}${name ? `: ${name}` : ''}`, body: coll === 'sick' ? 'Open Sick records to add the doctor, medicine and the school days missed.' : '' });
        }
      }
    }
    if (!only) for (const t of commonTrends(data).filter(x => x.type !== 'shared-strength')) out.push({ key: `common:${t.key}`, kind: 'analysis', severity: 'medium', date: today, title: 'Pattern across the children', body: t.text });
    const rank = { high: 0, medium: 1, info: 2, positive: 3 };
    return out.filter(a => !featureOff(data, a.kind)).sort((a, b) => (rank[a.severity] - rank[b.severity]) || String(a.date).localeCompare(String(b.date)));
  }

  // ---------- change over time (version 3) ----------
  const r1 = x => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
  const markDates = T => Array.from(new Set(T.subs.flatMap(s => s.marks.map(m => m.when))
    .concat(Array.from(T.courseRows.values()).flatMap(ms => ms.map(m => m.when))).filter(Boolean))).sort();

  // Subject (course) averages calculated from the marks, optionally only the marks dated up to a day.
  function courseAvgsAsOf(T, upto) {
    const ok = m => !upto || (m.when && m.when <= upto);
    const out = {};
    const names = new Set(T.subs.map(s => s.course).concat(Array.from(T.courseRows.keys())));
    for (const name of names) {
      const cr = (T.courseRows.get(name) || []).filter(ok);
      let avg = null;
      if (cr.length) avg = mean(cr.map(m => m.v));
      else {
        const subAvgs = T.subs.filter(s => s.course === name).map(s => s.marks.filter(ok)).filter(ms => ms.length).map(ms => mean(ms.map(m => m.v)));
        if (subAvgs.length) avg = mean(subAvgs);
      }
      if (avg !== null) out[name] = r1(avg);
    }
    return out;
  }
  const overallOf = avgs => { const v = Object.values(avgs); return v.length ? r1(mean(v)) : null; };

  function courseAverages(data, childId, year, term) {
    const courses = courseAvgsAsOf(termRows(data, childId, year, term), null);
    return { courses, overall: overallOf(courses) };
  }

  // Snapshots saved after each SABIS update that changed marks (oldest first).
  function updateHistory(data, childId, year, term) {
    return ((((data.settings || {}).sabis || {}).history) || [])
      .filter(h => h.childId === childId && (!year || (h.year === year && h.term === term)))
      .slice().sort((a, b) => String(a.at).localeCompare(String(b.at)));
  }

  // The term's overall average over time: a point for each week that brought marks,
  // and a marker for every SABIS update. Without dated marks, the updates are the line.
  function overallTimeline(data, childId, year, term) {
    const T = termRows(data, childId, year, term);
    const points = [];
    for (const d of markDates(T)) {
      const o = overallOf(courseAvgsAsOf(T, d));
      if (o !== null) points.push({ date: d, overall: o });
    }
    const updates = updateHistory(data, childId, year, term).filter(u => !u.baseline)
      .map(u => ({ at: u.at, date: String(u.at).slice(0, 10), overall: u.overall, newMarks: u.newMarks || 0, changed: u.changed || 0 }));
    const fromMarks = points.length >= 2;
    const now = overallOf(courseAvgsAsOf(T, null));
    const line = fromMarks ? points : updateHistory(data, childId, year, term).map(u => ({ date: String(u.at).slice(0, 10), overall: u.overall }));
    // marks with no week or first-seen date: the line ends on the overall that includes them
    if (fromMarks && now !== null && Math.abs(now - line[line.length - 1].overall) >= 0.1) {
      const lastUpd = updates.length ? updates[updates.length - 1].date : null;
      const at = lastUpd && lastUpd > line[line.length - 1].date ? lastUpd : line[line.length - 1].date;
      if (at === line[line.length - 1].date) line[line.length - 1] = { date: at, overall: now, all: true }; else line.push({ date: at, overall: now, all: true });
    }
    return { points: line, updates, now, source: fromMarks ? 'marks' : 'updates' };
  }

  // Which subjects moved: in the latest SABIS update (against the state before it),
  // or else over the last four weeks of dated marks.
  function movers(data, childId, year, term) {
    const T = termRows(data, childId, year, term);
    const hist = updateHistory(data, childId, year, term);
    let before = null, after = null, basis = null, since = null, at = null;
    if (hist.length >= 2) {
      const last = hist[hist.length - 1], prev = hist[hist.length - 2];
      before = prev.courses || {}; after = last.courses || {}; basis = 'update'; since = prev.at; at = last.at;
    } else {
      const dates = markDates(T);
      if (!dates.length) return null;
      const lastDate = dates[dates.length - 1];
      since = addDays(lastDate, -28); at = lastDate; basis = 'weeks';
      before = courseAvgsAsOf(T, since); after = courseAvgsAsOf(T, lastDate);
    }
    const items = Object.keys(after).filter(c => before[c] !== undefined)
      .map(c => ({ course: c, before: before[c], after: after[c], change: r1(after[c] - before[c]) }))
      .filter(x => x.change !== 0)
      .sort((a, b) => b.change - a.change);
    return { basis, since, at, items, overallBefore: overallOf(before), overallAfter: overallOf(after) };
  }

  // A straight-line trend through a subject's marks: drawn by position, labelled per month when the marks have dates.
  function trendOf(marks) {
    const pts = (marks || []).filter(m => m && m.v !== null && m.v !== undefined && !isNaN(m.v));
    if (pts.length < 3) return null;
    const fit = xs => {
      const ys = pts.map(m => m.v), mx = mean(xs), my = mean(ys);
      const sxx = xs.reduce((t, x) => t + (x - mx) ** 2, 0);
      if (!sxx) return null;
      const slope = xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / sxx;
      return { slope, a: my - slope * mx };
    };
    const byPos = fit(pts.map((m, i) => i));
    if (!byPos) return null;
    const dated = pts.every(m => m.date) && new Set(pts.map(m => m.date)).size >= 2;
    let per = byPos.slope, unit = 'test';
    if (dated) {
      const t0 = Date.parse(pts[0].date);
      const byDate = fit(pts.map(m => (Date.parse(m.date) - t0) / 864e5));
      if (byDate) { per = byDate.slope * 30; unit = 'month'; }
    }
    const kind = Math.abs(per) < (unit === 'month' ? 1.5 : 1) ? 'steady' : per > 0 ? 'rising' : 'sliding';
    return { per: r1(per), unit, kind, from: r1(byPos.a), to: r1(byPos.a + byPos.slope * (pts.length - 1)) };
  }

  // Subject by subject: this term against the term before it.
  function termCompare(data, childId, year, term) {
    const list = terms(data, childId);
    const i = list.findIndex(t => t.year === year && t.term === term);
    if (i <= 0) return null;
    const prev = list[i - 1];
    const a = termSummary(data, childId, prev.year, prev.term), b = termSummary(data, childId, year, term);
    const items = b.courses.map(c => {
      const p = a.courses.find(x => x.course.toLowerCase() === c.course.toLowerCase());
      return p && p.avg !== null && c.avg !== null ? { course: c.course, before: p.avg, after: c.avg, change: c.avg - p.avg } : null;
    }).filter(Boolean).sort((x, y) => y.change - x.change);
    return items.length ? { prev, items, overallBefore: a.overall, overallAfter: b.overall } : null;
  }

  return { termSummary, latestSummary, terms, reportsFor, seriesStats, commonTrends, cumulativeDomains, careerDirection, international, pathAdvice,
    qualificationAdvice, examWeakTopics, goalsProgress, studyStats, calendarItems, alerts, nextBirthday, daysBetween, mean,
    sickStats, sickDays, schoolDaysBetween, lunchStats, splitItems, LUNCH_SCORE,
    courseAverages, updateHistory, overallTimeline, movers, trendOf, termCompare, finishedBooks };
});
