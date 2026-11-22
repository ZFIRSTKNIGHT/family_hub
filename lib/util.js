// Small DOM and formatting helpers shared by every page.
(function () {
  'use strict';
  const KH = window.KH = window.KH || {};
  const u = KH.u = {};

  u.h = function h(tag, attrs, ...kids) {
    const svgTags = /^(svg|path|circle|rect|line|polyline|g)$/;
    const el = svgTags.test(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'selected') el.selected = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    const add = c => {
      if (c === null || c === undefined || c === false) return;
      if (Array.isArray(c)) c.forEach(add);
      else if (c instanceof Node) el.appendChild(c);
      else el.appendChild(document.createTextNode(String(c)));
    };
    kids.forEach(add);
    return el;
  };
  const h = u.h;

  u.esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  u.uid = p => `${p || 'id'}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  u.now = () => new Date().toISOString();
  u.iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  u.today = () => u.iso(new Date());
  u.parseDate = s => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00') : null);
  u.locale = () => (KH.i18n && KH.i18n.lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB');
  u.fmtDate = s => (s ? u.parseDate(s).toLocaleDateString(u.locale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  u.fmtShort = s => (s ? u.parseDate(s).toLocaleDateString(u.locale(), { day: 'numeric', month: 'short' }) : '');
  // Exact date and time, e.g. "Sat 21 Nov, 15:05" (the year only when it is not this year).
  u.fmtDateTime = s => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    const o = { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' };
    if (d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
    return d.toLocaleString(u.locale(), o);
  };
  u.ago = s => {
    if (!s) return '';
    const mins = Math.round((Date.now() - new Date(s).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs} h ago`;
    const days = Math.round(hrs / 24);
    return days === 1 ? 'yesterday' : `${days} days ago`;
  };
  // "Sat 21 Nov, 15:05 · 3 h ago" (no "ago" part after a week)
  u.when = s => { if (!s) return ''; const days = (Date.now() - new Date(s).getTime()) / 864e5; return days < 7 ? `${u.fmtDateTime(s)} · ${u.ago(s)}` : u.fmtDateTime(s); };
  u.money = n => { const v = Math.round((Number(n) || 0) * 100) / 100; return v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  // Amounts are hidden (like a banking app) until the money PIN has been entered.
  u.amount = n => (KH.lock && KH.lock.hidden() ? '•••••' : u.money(n));
  u.academicYear = s => {
    const d = s ? u.parseDate(s) : new Date();
    const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
  };
  u.ageOf = dob => {
    if (!dob) return null;
    const b = u.parseDate(dob), t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  };
  u.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  u.initials = name => String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const tr = n => { if (KH.i18n) KH.i18n.apply(n); return n; };

  // ---------- grade colours: 90s green, 80s blue, 70s yellow, 60s orange, 50s red; top half darker ----------
  u.band = v => {
    const n = Number(v);
    if (isNaN(n)) return '';
    if (n < 50) return 'g0';
    const tens = Math.min(90, Math.floor(n / 10) * 10);
    return `g${tens + (n >= tens + 5 ? 5 : 0)}`;
  };
  u.grade = (v, extra) => (v === null || v === undefined || v === '' ? h('span', { class: 'muted' }, '-') : h('span', { class: `gb ${u.band(v)}`, title: extra || '' }, String(v)));
  u.gradeLegend = () => h('div', { class: 'legend' },
    [['g95', 'g90', '90–100'], ['g85', 'g80', '80–89'], ['g75', 'g70', '70–79'], ['g65', 'g60', '60–69'], ['g55', 'g50', '50–59'], ['g0', 'g0', 'below 50']].map(([a, b, l]) =>
      h('span', null, h('i', { style: { background: `var(--${a})` } }), a !== b ? h('i', { style: { background: `var(--${b})` } }) : null, l)),
    h('span', { class: 'muted' }, 'darker = top half of the band'));

  // ---------- numbers that count up when a page opens ----------
  u.counter = (value, opts = {}) => h('span', { 'data-count': value, 'data-dec': opts.dec || 0 }, opts.start === false ? String(value) : '0');
  u.animateCounts = (root, instant) => {
    const reduce = instant || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    root.querySelectorAll('[data-count]').forEach(el => {
      const to = Number(el.getAttribute('data-count'));
      const dec = Number(el.getAttribute('data-dec')) || 0;
      if (isNaN(to) || reduce) { el.textContent = isNaN(to) ? el.getAttribute('data-count') : to.toFixed(dec); return; }
      const t0 = performance.now(), dur = 900 + Math.min(600, Math.abs(to) * 4);
      const step = now => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  // ---------- small inline icons ----------
  const ICONS = {
    menu: 'M4 7h16M4 12h16M4 17h16', back: 'M15 5l-7 7 7 7', send: 'M21 3L10 14M21 3l-6.5 18-3.5-7-7-3.5z', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    home: 'M3 11l9-7 9 7M5 10v10h14V10', calendar: 'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4', book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5',
    lunch: 'M5 8h14l-1.5 12h-11zM9 8V6a3 3 0 0 1 6 0v2', heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    wallet: 'M3 6h18v13H3zM3 10h18', lock: 'M5 11h14v10H5zM8 11V8a4 4 0 0 1 8 0v3', gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    school: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5', key: 'M15 7a4 4 0 1 1-3.9 5H8l-2 2-2-2 2-2h5.1A4 4 0 0 1 15 7z', chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z', plus: 'M12 5v14M5 12h14', sync: 'M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z', sun: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', eyeoff: 'M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 4.4-1',
    photo: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3', doc: 'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.1a4 4 0 0 1 0 7.8M18 21a7 7 0 0 0-3-5.7', bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    path: 'M3 17l6-6 4 4 8-8M14 7h7v7', copy: 'M9 9h11v11H9zM5 15H4V4h11v1', out: 'M14 3h7v7M10 14 21 3M21 14v7H3V3h7', trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15',
    check: 'M5 12l5 5L20 7', print: 'M6 9V2h12v7M6 18H4v-7h16v7h-2M6 14h12v8H6z', news: 'M4 4h13v16H6a2 2 0 0 1-2-2zM17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3',
    pen: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', chat: 'M4 5h16v11H9l-5 4z', mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
    clip: 'M21 12.5l-8.5 8.5a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3L15 8.5', share: 'M4 12v7h16v-7M12 3v12M7 8l5-5 5 5', flag: 'M5 21V4M5 4h12l-2 4 2 4H5', logout: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  };
  u.icon = (name, cls) => {
    const svg = h('svg', { class: `ico ${cls || ''}`, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    svg.appendChild(h('path', { d: ICONS[name] || ICONS.star }));
    return svg;
  };

  // Phones: a phone-sized screen gets the bottom tabs, one-column pages and tables as cards.
  const phoneQuery = window.matchMedia ? window.matchMedia('(max-width: 760px)') : { matches: false, addEventListener() {} };
  u.isPhone = () => phoneQuery.matches;
  u.onPhoneChange = fn => { try { phoneQuery.addEventListener('change', fn); } catch (e) { /* old engines */ } };
  // each cell carries its column name, so a table can show as a stack of cards on a phone
  u.labelTables = root => {
    (root || document).querySelectorAll('table.list').forEach(t => {
      const ths = Array.from(t.querySelectorAll(':scope > thead th'));
      if (!ths.length) return;
      t.classList.add('labeled');
      const names = ths.map(th => th.textContent.trim());
      t.querySelectorAll(':scope > tbody > tr').forEach(tr => {
        Array.from(tr.children).forEach((td, i) => { if (td.tagName === 'TD' && !td.hasAttribute('colspan') && td.dataset.label === undefined) td.dataset.label = names[i] || ''; });
      });
    });
  };
  if (typeof MutationObserver !== 'undefined') {
    let queued = false;
    new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; u.labelTables(document); }); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }

  u.toast = (msg, kind) => {
    const root = document.getElementById('toast-root');
    const t = tr(h('div', { class: `toast ${kind || ''}` }, msg));
    root.appendChild(t);
    setTimeout(() => t.remove(), kind === 'bad' ? 5200 : 2800);
  };

  const openModals = new Set();
  // dialogs belong to the page they were opened on (on a phone the back button changes the page)
  u.closeModals = () => { Array.from(openModals).forEach(c => c()); };
  u.modal = ({ title, body, actions, wide, onClose }) => {
    const root = document.getElementById('modal-root');
    let closed = false;
    const close = () => { if (closed) return; closed = true; openModals.delete(close); back.remove(); if (onClose) onClose(); };
    openModals.add(close);
    const footer = h('div', { class: 'mf' });
    for (const a of actions || []) {
      footer.appendChild(h('button', { class: `btn ${a.primary ? 'primary' : ''} ${a.danger ? 'danger' : ''}`, style: a.left ? { marginInlineEnd: 'auto' } : null,
        onclick: async () => { const r = a.onClick ? await a.onClick() : true; if (r !== false) close(); } }, a.label));
    }
    const box = h('div', { class: `modal ${wide ? 'wide' : ''}`, role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'mh' }, h('h2', null, title || ''), h('button', { class: 'btn icon small', 'aria-label': 'Close', onclick: close }, '✕')),
      h('div', { class: 'mb' }, body),
      actions && actions.length ? footer : null);
    const back = h('div', { class: 'modal-back', onmousedown: e => { if (e.target === back) close(); } }, box);
    back.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    root.appendChild(tr(back));
    const first = back.querySelector('input, select, textarea');
    if (first && !u.isPhone()) setTimeout(() => first.focus(), 30); // on a phone the keyboard waits for a tap
    return { close, el: back, box };
  };

  u.confirm = (message, okLabel) => new Promise(resolve => {
    u.modal({ title: 'Please confirm', body: h('p', null, message), onClose: () => resolve(false),
      actions: [{ label: 'Cancel', onClick: () => resolve(false) }, { label: okLabel || 'Yes', primary: true, danger: true, onClick: () => resolve(true) }] });
  });

  u.prompt = (title, fields) => new Promise(resolve => {
    const inputs = {};
    const body = h('div', null, fields.map(f => h('label', { class: 'f' }, h('span', null, f.label),
      inputs[f.key] = h('input', { type: f.type || 'text', value: f.value || '', placeholder: f.placeholder || '' }))));
    u.modal({ title, body, onClose: () => resolve(null), actions: [{ label: 'Cancel', onClick: () => resolve(null) },
      { label: 'OK', primary: true, onClick: () => { const out = {}; for (const f of fields) out[f.key] = inputs[f.key].value; resolve(out); } }] });
  });

  u.section = (title, ...kids) => h('div', { class: 'card' }, title ? h('h2', null, title) : null, ...kids);
  u.stat = (label, value, sub) => h('div', { class: 'card tight' }, h('div', { class: 'stat-label' }, label),
    h('div', { class: 'stat' }, value === null || value === undefined ? '-' : (typeof value === 'number' ? u.counter(value) : value)), sub ? h('div', { class: 'small muted' }, sub) : null);
  u.chip = (text, kind) => h('span', { class: `chip ${kind || ''}` }, text);
  // Charts: markup plus one tooltip that follows the pointer over anything with data-tip.
  u.svg = markup => {
    const d = h('div', { class: 'chart' });
    d.innerHTML = markup;
    if (d.querySelector('[data-tip]')) {
      const tip = h('div', { class: 'tip', role: 'tooltip' });
      d.appendChild(tip);
      const say = t => (KH.i18n && KH.i18n.lang === 'ar' && KH.i18n.translateText ? KH.i18n.translateText(t, 'ar') : t);
      const show = e => {
        const t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
        if (!t) { tip.classList.remove('on'); return; }
        tip.textContent = say(t.getAttribute('data-tip'));
        const r = d.getBoundingClientRect();
        const x = Math.min(e.clientX - r.left + 14, r.width - tip.offsetWidth - 4);
        tip.style.left = Math.max(0, x) + 'px';
        tip.style.top = Math.max(0, e.clientY - r.top - 38) + 'px';
        tip.classList.add('on');
      };
      d.addEventListener('mousemove', show);
      d.addEventListener('click', show); // a tap on a phone
      d.addEventListener('mouseleave', () => tip.classList.remove('on'));
    }
    return d;
  };
  // on a phone, a tap anywhere else puts the chart's note away
  document.addEventListener('touchstart', e => {
    document.querySelectorAll('.chart .tip.on').forEach(t => { if (!t.parentNode.contains(e.target)) t.classList.remove('on'); });
  }, { passive: true });
})();
