// SVG charts, returned as markup strings so they work on screen (theme colours,
// animated) and in PDF exports (opts.print: fixed colours, no animation).
(function () {
  'use strict';
  const KH = window.KH = window.KH || {};
  const esc = s => KH.u.esc(s);
  const LIGHT = { text: '#151B2E', text2: '#556078', grid: '#E3E7F1', ref: '#8f96a3', track: '#EEF1F7', accent: '#4F46E5', good: '#11744A', bad: '#C2371F', grey: '#AAB0BA', surface: '#FFFFFF', gold: '#D99A1E',
    g95: '#15803D', g90: '#4ADE80', g85: '#1D4ED8', g80: '#60A5FA', g75: '#CA8A04', g70: '#FACC15', g65: '#EA580C', g60: '#FB923C', g55: '#B91C1C', g50: '#F87171', g0: '#7F1D1D' };
  const VARS = { text: 'var(--text)', text2: 'var(--muted)', grid: 'var(--border)', ref: 'var(--muted)', track: 'var(--track)', accent: 'var(--accent)', good: 'var(--good)', bad: 'var(--bad)', grey: 'var(--muted)', surface: 'var(--surface)', gold: 'var(--gold, #D99A1E)',
    g95: 'var(--g95)', g90: 'var(--g90)', g85: 'var(--g85)', g80: 'var(--g80)', g75: 'var(--g75)', g70: 'var(--g70)', g65: 'var(--g65)', g60: 'var(--g60)', g55: 'var(--g55)', g50: 'var(--g50)', g0: 'var(--g0)' };
  const pal = opts => (opts && opts.print ? LIGHT : VARS);
  const bandColour = (v, P) => P[KH.u.band(v)] || P.grey;
  // Phones: charts are drawn narrower so their text stays readable; long names are shortened,
  // long captions wrap (translated first, so each line is already in the reader's language).
  const narrow = opts => !(opts && opts.print) && !!(KH.u && KH.u.isPhone && KH.u.isPhone());
  const clip = (str, max) => { const t = String(str); return t.length > max ? t.slice(0, Math.max(1, max - 1)) + '…' : t; };
  const tr = str => (KH.i18n && KH.i18n.t ? KH.i18n.t(str) : str);
  const wrapLines = (str, max) => {
    const words = String(str).split(/\s+/), out = [];
    let cur = '';
    for (const w of words) { if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) out.push(cur);
    return out;
  };
  // a caption: one line on a PC, wrapped lines on a phone; returns the markup and how many lines it took
  const caption = (str, x, y, P, phone, max) => {
    if (!phone) return { s: `<text x="${x}" y="${y}" fill="${P.text2}">${esc(str)}</text>`, n: 1 };
    const ls = wrapLines(tr(str), max || 52);
    return { s: ls.map((l, i) => `<text x="${x}" y="${y + i * 16}" fill="${P.text2}" data-noi18n="1">${esc(l)}</text>`).join(''), n: ls.length };
  };

  // Horizontal bars, sorted, coloured by grade band, with a dashed reference line (overall).
  function bars(items, opts = {}) {
    const P = pal(opts);
    const list = items.filter(i => i.value !== null && i.value !== undefined && !isNaN(i.value)).slice().sort((a, b) => b.value - a.value);
    if (!list.length) return '';
    const phone = narrow(opts);
    const longest = Math.max(...list.map(it => Math.max(String(it.label).length * 6.9, String(it.sub || '').length * 6)));
    const W = phone ? 350 : (opts.width || 520), x0 = Math.round(Math.min(phone ? 132 : 250, Math.max(phone ? 80 : 90, longest + 18))), w = W - x0 - 46, rowH = 36, barH = 18;
    const cap = opts.subtitle ? caption(opts.subtitle, 0, 40, P, phone) : { s: '', n: 1 };
    const y0 = (opts.title ? 64 : 34) + (cap.n - 1) * 16;
    const H = y0 + list.length * rowH + 8;
    const x = v => x0 + Math.max(0, Math.min(100, v)) / 100 * w;
    const ref = opts.ref;
    const maxLabel = Math.floor((x0 - 12) / 6.9), maxSub = Math.floor((x0 - 12) / 6);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(opts.title || 'Averages')}" font-size="12" font-family="inherit">`;
    if (opts.title) s += `<text x="0" y="20" font-size="15" font-weight="700" fill="${P.text}">${esc(opts.title)}</text>`;
    s += cap.s;
    list.forEach((it, i) => {
      const yy = y0 + i * rowH;
      const col = it.color || (opts.bands === false ? P.grey : bandColour(it.value, P));
      const xe = x(it.value);
      const label = phone ? clip(tr(it.label), maxLabel) : it.label, sub = it.sub && phone ? clip(tr(it.sub), maxSub) : it.sub;
      s += `<text x="${x0 - 10}" y="${yy + 9}" text-anchor="end" font-weight="600" fill="${P.text}"${phone ? ' data-noi18n="1"' : ''}>${esc(label)}</text>`;
      if (it.sub) s += `<text x="${x0 - 10}" y="${yy + 23}" text-anchor="end" font-size="11" fill="${P.text2}"${phone ? ' data-noi18n="1"' : ''}>${esc(sub)}</text>`;
      s += `<rect x="${x0}" y="${yy}" width="${w}" height="${barH}" rx="9" fill="${P.track}"/>`;
      s += `<rect class="${opts.print ? '' : 'bar'}" style="animation-delay:${(i * 0.06).toFixed(2)}s" x="${x0}" y="${yy}" width="${Math.max(10, xe - x0)}" height="${barH}" rx="9" fill="${col}"><title>${esc(it.label)}: ${it.value}</title></rect>`;
      s += `<text x="${xe + 7}" y="${yy + 13}" font-weight="800" fill="${P.text}">${it.value}</text>`;
    });
    if (ref !== undefined && ref !== null) {
      s += `<line x1="${x(ref)}" x2="${x(ref)}" y1="${y0 - 12}" y2="${H - 4}" stroke="${P.ref}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      s += `<text x="${x(ref)}" y="${y0 - 17}" text-anchor="middle" font-weight="700" fill="${P.text2}">${esc(opts.refLabel || 'Overall')} ${ref}</text>`;
    }
    return s + '</svg>';
  }

  // One small line chart per subject (subjects with two or more marks).
  function multiples(subjects, opts = {}) {
    const P = pal(opts);
    const list = subjects.filter(s => s.n >= 2);
    if (!list.length) return '';
    const order = { down: 0, uneven: 1, up: 2, steady: 3 };
    list.sort((a, b) => (order[a.direction] ?? 4) - (order[b.direction] ?? 4));
    const phone = narrow(opts);
    const cap = caption('Every mark in subjects with two or more marks. Red = down, green = up, grey = steady or uneven. Dashed = trend. ◆ = starred mark.', 0, 40, P, phone, 50);
    const extra = (cap.n - 1) * 16;
    const W = phone ? 350 : 750, cols = phone ? 2 : 3, gx = phone ? 16 : 24, gy = 26, pw = (W - (cols - 1) * gx) / cols, ph = 112, y0 = 82 + extra, plotTop = 50, plotH = 54;
    const nRows = Math.ceil(list.length / cols);
    const H = y0 + nRows * ph + (nRows - 1) * gy + 10;
    const lo = Math.min(40, ...list.flatMap(s => s.marks.map(m => m.v))), hi = 100;
    const vy = v => plotTop + (hi - v) / (hi - lo) * plotH;
    const tone = d => (d === 'down' ? P.bad : d === 'up' ? P.good : P.grey);
    let s = `<svg viewBox="0 0 ${phone ? W : 760} ${H}" width="100%" role="img" aria-label="Trend per subject" font-size="12" font-family="inherit">`;
    s += `<text x="0" y="20" font-size="15" font-weight="700" fill="${P.text}">${esc(opts.title || 'Which way each subject is heading')}</text>`;
    s += cap.s;
    if (opts.ref) s += `<line x1="0" x2="18" y1="${58 + extra}" y2="${58 + extra}" stroke="${P.ref}" stroke-dasharray="3 3"/><text x="24" y="${62 + extra}" fill="${P.text2}">Overall ${opts.ref}</text>`;
    list.forEach((sub, i) => {
      const px = (i % cols) * (pw + gx), py = y0 + Math.floor(i / cols) * (ph + gy);
      const n = sub.marks.length;
      const X = k => px + 10 + (n === 1 ? (pw - 20) / 2 : k / (n - 1) * (pw - 20));
      const Y = m => py + vy(m.v);
      const col = tone(sub.direction);
      const trd = sub.trend !== undefined ? sub.trend : (KH.analysis && KH.analysis.trendOf ? KH.analysis.trendOf(sub.marks) : null);
      const tag = sub.direction === 'up' || sub.direction === 'down' ? `${sub.change > 0 ? '▲ +' : '▼ −'}${Math.abs(sub.change)}` : sub.direction;
      const name = sub.sub === sub.course ? sub.course : sub.sub;
      s += `<text x="${px}" y="${py + 14}" font-weight="700" fill="${P.text}"${phone ? ' data-noi18n="1"' : ''}>${esc(phone ? clip(tr(name), Math.floor((pw - 50) / 7)) : name)}</text>`;
      s += `<text x="${px + pw}" y="${py + 14}" text-anchor="end" font-weight="700" fill="${col}">${esc(tag)}</text>`;
      const trTxt = trd ? (trd.kind === 'steady' ? ' · steady' : ` · ${trd.kind} about ${Math.abs(trd.per)} a ${trd.unit}`) : '';
      // a phone has room for the average only; the trend shows as the dashed line
      s += phone ? `<text x="${px}" y="${py + 30}" font-size="11" fill="${P.text2}">avg ${sub.avg}</text>`
        : `<text x="${px}" y="${py + 30}" font-size="11" fill="${P.text2}">${esc(sub.sub === sub.course ? '' : sub.course + ' · ')}avg ${sub.avg}${esc(trTxt)}</text>`;
      s += `<line x1="${px}" x2="${px + pw}" y1="${py + vy(lo)}" y2="${py + vy(lo)}" stroke="${P.grid}"/>`;
      if (opts.ref) s += `<line x1="${px}" x2="${px + pw}" y1="${py + vy(opts.ref)}" y2="${py + vy(opts.ref)}" stroke="${P.ref}" stroke-dasharray="3 3"/>`;
      if (trd) {
        const clamp = v => Math.max(lo, Math.min(hi, v));
        s += `<line x1="${X(0)}" y1="${py + vy(clamp(trd.from))}" x2="${X(n - 1)}" y2="${py + vy(clamp(trd.to))}" stroke="${P.text2}" stroke-width="1.4" stroke-dasharray="5 4" opacity=".8"/>`;
      }
      s += `<polyline points="${sub.marks.map((m, k) => `${X(k)},${Y(m)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
      sub.marks.forEach((m, k) => {
        const cx = X(k), cy = Y(m);
        const dc = bandColour(m.v, P);
        s += m.star ? `<path class="${opts.print ? '' : 'dotp'}" d="M${cx},${cy - 6} L${cx + 6},${cy} L${cx},${cy + 6} L${cx - 6},${cy} Z" fill="${dc}" stroke="${P.text}" stroke-width=".8"><title>${esc(m.col)}: ${m.v} (starred = below passing average)</title></path>`
          : `<circle class="${opts.print ? '' : 'dotp'}" style="animation-delay:${(k * 0.05).toFixed(2)}s" cx="${cx}" cy="${cy}" r="4.4" fill="${dc}" stroke="${opts.print ? '#fff' : 'var(--surface)'}" stroke-width="1.5"><title>${esc(m.col)}: ${m.v}</title></circle>`;
      });
      const f = sub.marks[0], l = sub.marks[n - 1];
      s += `<text x="${X(0)}" y="${Y(f) - 9}" text-anchor="start" font-weight="700" fill="${P.text}">${f.v}</text>`;
      s += `<text x="${X(n - 1)}" y="${Y(l) - 9}" text-anchor="end" font-weight="700" fill="${P.text}">${l.v}</text>`;
    });
    return s + '</svg>';
  }

  // Study hours per week (last 8 weeks).
  function hours(weeks, opts = {}) {
    const P = pal(opts);
    const W = 360, H = 120, max = Math.max(5, ...weeks), bw = 30, gap = 12, x0 = 6, y0 = 14, ph = 80;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" font-size="11" role="img" aria-label="Study hours per week" font-family="inherit">`;
    weeks.forEach((v, i) => {
      const x = x0 + i * (bw + gap), hgt = Math.max(2, v / max * ph);
      s += `<rect class="colbar" style="animation-delay:${(i * 0.05).toFixed(2)}s" x="${x}" y="${y0 + ph - hgt}" width="${bw}" height="${hgt}" rx="7" fill="${i === weeks.length - 1 ? P.accent : P.grey}" opacity="${i === weeks.length - 1 ? 1 : 0.55}"><title>${v} h</title></rect>`;
      s += `<text x="${x + bw / 2}" y="${y0 + ph - hgt - 4}" text-anchor="middle" font-weight="700" fill="${P.text}">${v || ''}</text>`;
      s += `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" fill="${P.text2}">${i === weeks.length - 1 ? 'This wk' : `-${weeks.length - 1 - i}w`}</text>`;
    });
    return s + '</svg>';
  }


  // ---------- version 3: change over time ----------
  const fmtD = iso => KH.u.fmtShort(iso);
  const sgn = v => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');
  const T0 = d => Date.parse(String(d).slice(0, 10) + 'T00:00:00');

  // The term's overall average over time, with a diamond for each SABIS update.
  function overTime(tl, opts = {}) {
    const P = pal(opts);
    const pts = ((tl && tl.points) || []).filter(p => p.overall !== null && p.overall !== undefined);
    if (pts.length < 2) return '';
    const ups = ((tl && tl.updates) || []).filter(x => x.overall !== null && x.overall !== undefined);
    const phone = narrow(opts);
    const cap = opts.subtitle ? caption(opts.subtitle, 0, 40, P, phone) : { s: '', n: 1 };
    const extra = opts.title ? (cap.n - 1) * 16 : 0;
    const W = phone ? 350 : 560, H = (opts.compact ? 190 : 240) + extra, x0 = 36, x1 = W - (phone ? 56 : 70), y0 = (opts.title ? 64 : 22) + extra, y1 = H - 34;
    const times = pts.map(p => T0(p.date)).concat(ups.map(x => T0(x.date)));
    const tmin = Math.min(...times), tmax = Math.max(...times);
    const vals = pts.map(p => p.overall).concat(ups.map(x => x.overall));
    const ref = opts.ref;
    let lo = Math.min(...vals) - 4, hi = Math.max(...vals) + 4;
    if (ref !== undefined && ref !== null && ref < lo && lo - ref < 15) lo = ref - 2;
    const step = hi - lo > 30 ? 10 : 5;
    lo = Math.max(0, Math.floor(lo / step) * step); hi = Math.min(100, Math.ceil(hi / step) * step);
    if (hi - lo < step * 2) { lo = Math.max(0, lo - step); hi = Math.min(100, hi + step); }
    const X = d => x0 + (tmax === tmin ? (x1 - x0) / 2 : (T0(d) - tmin) / (tmax - tmin) * (x1 - x0));
    const Y = v => y0 + (hi - v) / ((hi - lo) || 1) * (y1 - y0);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(opts.title || 'Overall over time')}" font-size="12" font-family="inherit">`;
    if (opts.title) s += `<text x="0" y="20" font-size="15" font-weight="700" fill="${P.text}">${esc(opts.title)}</text>`;
    s += cap.s;
    for (let v = lo; v <= hi; v += step) {
      s += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="${P.grid}"/>`;
      s += `<text x="${x0 - 8}" y="${Y(v) + 4}" text-anchor="end" fill="${P.text2}">${v}</text>`;
    }
    if (ref !== undefined && ref !== null && ref >= lo && ref <= hi) {
      s += `<line x1="${x0}" x2="${x1}" y1="${Y(ref)}" y2="${Y(ref)}" stroke="${P.ref}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
      s += phone ? `<text x="${x1 + 6}" y="${Y(ref) + 4}" fill="${P.text2}">${ref}</text>` : `<text x="${x1 + 8}" y="${Y(ref) + 4}" fill="${P.text2}">${esc(opts.refLabel || 'Low mark')} ${ref}</text>`;
    }
    const d0 = new Date(tmin), months = [];
    for (let d = new Date(d0.getFullYear(), d0.getMonth() + (d0.getDate() > 1 ? 1 : 0), 1); d.getTime() <= tmax; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
    if (months.length) {
      for (const m of months) {
        const iso = KH.u.iso(m);
        s += `<line x1="${X(iso)}" x2="${X(iso)}" y1="${y1}" y2="${y1 + 5}" stroke="${P.ref}"/><text x="${X(iso)}" y="${y1 + 19}" text-anchor="middle" fill="${P.text2}">${esc(m.toLocaleDateString(KH.u.locale(), { month: 'short' }))}</text>`;
      }
    } else {
      s += `<text x="${x0}" y="${y1 + 19}" fill="${P.text2}">${esc(fmtD(pts[0].date))}</text><text x="${x1}" y="${y1 + 19}" text-anchor="end" fill="${P.text2}">${esc(fmtD(pts[pts.length - 1].date))}</text>`;
    }
    const line = pts.map(p => `${X(p.date).toFixed(1)},${Y(p.overall).toFixed(1)}`).join(' ');
    s += `<polygon points="${X(pts[0].date).toFixed(1)},${y1} ${line} ${X(pts[pts.length - 1].date).toFixed(1)},${y1}" fill="${P.accent}" opacity=".09"/>`;
    s += `<polyline class="${opts.print ? '' : 'draw'}" points="${line}" fill="none" stroke="${P.accent}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach((p, i) => {
      const prev = i ? pts[i - 1].overall : null;
      const tip = `${fmtD(p.date)}: overall ${p.overall}${prev !== null ? ` (${sgn(Math.round((p.overall - prev) * 10) / 10)})` : ''}${p.all ? ', with every mark so far' : ''}`;
      s += `<circle cx="${X(p.date)}" cy="${Y(p.overall)}" r="3.6" fill="${P.accent}" stroke="${P.surface}" stroke-width="1.5"/>`;
      s += `<circle cx="${X(p.date)}" cy="${Y(p.overall)}" r="11" fill="transparent" data-tip="${esc(tip)}"/>`;
    });
    ups.forEach((x, i) => {
      const last = i === ups.length - 1;
      const prev = i ? ups[i - 1].overall : null;
      const ch = prev === null ? '' : ` (${sgn(Math.round((x.overall - prev) * 10) / 10)})`;
      const tip = `SABIS update, ${KH.u.fmtDateTime(x.at)}: overall ${x.overall}${ch}${x.newMarks ? `, ${x.newMarks} new mark${x.newMarks === 1 ? '' : 's'}` : ''}`;
      const cx = X(x.date), cy = Y(x.overall), r = last && opts.highlightLast ? 7 : 5;
      s += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" transform="rotate(45 ${cx} ${cy})" fill="${last && opts.highlightLast ? P.gold : P.surface}" stroke="${P.text}" stroke-width="1.5"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="12" fill="transparent" data-tip="${esc(tip)}"/>`;
    });
    const lp = pts[pts.length - 1];
    s += `<text x="${X(lp.date) + 9}" y="${Y(lp.overall) + 4}" font-weight="800" fill="${P.text}">${lp.overall}</text>`;
    return s + '</svg>';
  }

  // What moved: one bar per subject around zero, rising to the right, sliding to the left.
  function moved(items, opts = {}) {
    const P = pal(opts);
    const list = (items || []).slice(0, opts.max || 12);
    if (!list.length) return '';
    const phone = narrow(opts);
    const cap = opts.subtitle ? caption(opts.subtitle, 0, 40, P, phone) : { s: '', n: 1 };
    const W = phone ? 350 : 540, rowH = 30, y0 = (opts.title ? 60 : 14) + (opts.title ? (cap.n - 1) * 16 : 0), H = y0 + list.length * rowH + 8;
    const labelW = Math.min(phone ? 116 : 200, Math.max(phone ? 84 : 96, Math.max(...list.map(i => String(i.course).length)) * 7.2 + 14));
    const cx = labelW + (W - labelW) / 2, half = (W - labelW) / 2 - (phone ? 44 : 58);
    const maxAbs = Math.max(4, ...list.map(i => Math.abs(i.change)));
    const maxName = Math.floor((labelW - 14) / 7.2);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(opts.title || 'What moved')}" font-size="12" font-family="inherit">`;
    if (opts.title) s += `<text x="0" y="20" font-size="15" font-weight="700" fill="${P.text}">${esc(opts.title)}</text>`;
    s += cap.s;
    s += `<line x1="${cx}" x2="${cx}" y1="${y0 - 6}" y2="${H - 4}" stroke="${P.ref}" stroke-width="1.2"/>`;
    list.forEach((it, i) => {
      const yy = y0 + i * rowH, w = Math.max(3, Math.abs(it.change) / maxAbs * half), up = it.change > 0;
      s += `<text x="${labelW - 12}" y="${yy + 16}" text-anchor="end" font-weight="600" fill="${P.text}"${phone ? ' data-noi18n="1"' : ''}>${esc(phone ? clip(tr(it.course), maxName) : it.course)}</text>`;
      s += `<rect class="${opts.print ? '' : up ? 'grow-l' : 'grow-r'}" style="animation-delay:${(i * 0.05).toFixed(2)}s" x="${up ? cx + 1 : cx - w - 1}" y="${yy + 5}" width="${w}" height="16" rx="5" fill="${up ? P.good : P.bad}"/>`;
      s += `<rect x="${labelW}" y="${yy}" width="${W - labelW}" height="${rowH}" fill="transparent" data-tip="${esc(`${it.course}: ${it.before} → ${it.after} (${sgn(it.change)})`)}"/>`;
      s += `<text x="${up ? cx + w + 7 : cx - w - 7}" y="${yy + 17}" text-anchor="${up ? 'start' : 'end'}" font-weight="800" fill="${P.text}">${up ? '▲' : '▼'} ${sgn(it.change)}</text>`;
    });
    return s + '</svg>';
  }

  // This term against the term before: a hollow dot (before) joined to a filled dot (now).
  function termVs(cmp, opts = {}) {
    const P = pal(opts);
    const list = (cmp && cmp.items) || [];
    if (!list.length) return '';
    const phone = narrow(opts);
    const W = phone ? 350 : 540, rowH = 28, y0 = 46, H = y0 + list.length * rowH + 30;
    const labelW = Math.min(phone ? 116 : 200, Math.max(phone ? 84 : 96, Math.max(...list.map(i => String(i.course).length)) * 7.2 + 14));
    const maxName = Math.floor((labelW - 14) / 7.2);
    const vals = list.flatMap(i => [i.before, i.after]);
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 4) / 10) * 10), hi = 100;
    const xL = labelW + 6, xR = W - 46;
    const X = v => xL + (v - lo) / (hi - lo) * (xR - xL);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="This term against the term before" font-size="12" font-family="inherit">`;
    s += `<circle cx="8" cy="14" r="5" fill="${P.surface}" stroke="${P.text2}" stroke-width="2"/><text x="20" y="18" fill="${P.text2}">${esc(opts.prevLabel || 'Before')}</text>`;
    const off = 34 + String(opts.prevLabel || 'Before').length * 6.6;
    s += `<circle cx="${off}" cy="14" r="5.5" fill="${P.accent}"/><text x="${off + 12}" y="18" fill="${P.text2}">${esc(opts.curLabel || 'Now')}</text>`;
    for (let v = lo; v <= hi; v += 10) {
      s += `<line x1="${X(v)}" x2="${X(v)}" y1="${y0 - 8}" y2="${H - 26}" stroke="${P.grid}"/><text x="${X(v)}" y="${H - 10}" text-anchor="middle" fill="${P.text2}">${v}</text>`;
    }
    list.forEach((it, i) => {
      const yy = y0 + i * rowH + 8, a = X(it.before), b = X(it.after), col = it.change > 0 ? P.good : it.change < 0 ? P.bad : P.grey;
      s += `<text x="${labelW - 12}" y="${yy + 4}" text-anchor="end" font-weight="600" fill="${P.text}"${phone ? ' data-noi18n="1"' : ''}>${esc(phone ? clip(tr(it.course), maxName) : it.course)}</text>`;
      s += `<line x1="${a}" x2="${b}" y1="${yy}" y2="${yy}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>`;
      s += `<circle cx="${a}" cy="${yy}" r="5" fill="${P.surface}" stroke="${P.text2}" stroke-width="2"/>`;
      s += `<circle cx="${b}" cy="${yy}" r="6" fill="${bandColour(it.after, P)}" stroke="${P.surface}" stroke-width="1.5"/>`;
      s += `<text x="${Math.max(a, b) + 12}" y="${yy + 4}" font-weight="800" fill="${P.text}">${sgn(it.change)}</text>`;
      s += `<rect x="${labelW}" y="${yy - rowH / 2}" width="${W - labelW}" height="${rowH}" fill="transparent" data-tip="${esc(`${it.course}: ${it.before} → ${it.after}`)}"/>`;
    });
    return s + '</svg>';
  }

  function progress(pct, color) {
    const p = Math.max(0, Math.min(100, pct || 0));
    return `<div class="bar-bg"><div class="bar-fg" style="width:${p}%;${color ? 'background:' + color : ''}"></div></div>`;
  }

  KH.charts = { bars, multiples, hours, progress, overTime, moved, termVs, C: LIGHT, bandColour: v => bandColour(v, VARS) };
})();
