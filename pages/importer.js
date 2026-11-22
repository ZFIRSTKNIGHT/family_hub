// Add marks: from a photo/screenshot (offline reading), from the school portal page,
// or typed in (quick: one mark per subject; detailed: full grid). Everything lands in
// the same review grid so it can be checked before saving.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  const { years, TERMS } = KH.schemaUtil;
  let state = null; // { step, childId, year, term, grid, busy }

  const newCol = (label, kind) => ({ id: u.uid('c'), label: label || '', kind: kind || 'assessment', date: '' });
  const newRow = (course, sub, kind) => ({ id: u.uid('r'), course: course || '', sub: sub || '', kind: kind || 'sub', cells: {} });

  function defaults() {
    const p = KH.pages.importPreset || {};
    KH.pages.importPreset = null;
    const kids = KH.store.children();
    return { step: 'source', childId: p.childId || (kids[0] && kids[0].id) || '', year: p.year || u.academicYear(), term: p.term || 'Term 1', grid: null, busy: '' };
  }

  function lastReportRows(childId) {
    const reps = A.reportsFor(KH.store.data, childId);
    const last = reps[reps.length - 1];
    return last ? (last.rows || []) : [];
  }

  function gridFromOcr(res, photo, source) {
    const columns = res.columns.map((c, i) => Object.assign(newCol(c.label, c.kind), { ocrCi: i }));
    const rows = res.rows.map((r, ri) => {
      const row = Object.assign(newRow(r.course, r.sub, r.kind), { ocrRi: ri, labelConfident: r.labelConfident });
      for (const [ci, cell] of Object.entries(r.cells)) row.cells[columns[ci].id] = { v: cell.v, star: cell.star, low: cell.low, ocr: true };
      return row;
    });
    return { columns, rows, photo: photo || null, source, note: res.note || '', overall: '', ocr: source === 'photo' || source === 'capture' };
  }

  function reportToGrid(r) {
    const columns = (r.columns || []).map(c => ({ id: c.id, label: c.label, kind: c.kind || 'assessment', date: c.date || '' }));
    const rows = (r.rows || []).map(row => ({ id: row.id, course: row.course, sub: row.sub, kind: row.kind || 'sub', cells: JSON.parse(JSON.stringify((r.cells || {})[row.id] || {})) }));
    return { columns, rows, photo: r.photo || null, source: r.source || 'manual', note: r.note || '', overall: r.reported && r.reported.overall !== null && r.reported.overall !== undefined ? r.reported.overall : '', editingId: r.id, attendance: r.attendance };
  }

  KH.pages.editReport = function (r) {
    state = { step: 'review', childId: r.childId, year: r.year, term: r.term, grid: reportToGrid(r), busy: '' };
    KH.app.go('#/add/review');
  };

  // ---------- saving ----------
  async function save() {
    const g = state.grid;
    if (!state.childId) return u.toast('Choose the child first', 'bad');
    const cols = g.columns.filter(c => c.label.trim() || g.rows.some(r => r.cells[c.id] && r.cells[c.id].v !== ''));
    const rows = g.rows.filter(r => (r.course || r.sub) && (Object.values(r.cells).some(c => c && c.v !== '' && c.v !== undefined) || r.kind === 'course'));
    if (!rows.length) return u.toast('There are no marks to save', 'bad');
    const cells = {};
    const reported = { overall: g.overall === '' || g.overall === undefined ? null : Number(g.overall), courses: {}, subs: {} };
    const avgCols = cols.filter(c => c.kind === 'average');
    for (const r of rows) {
      cells[r.id] = {};
      for (const c of cols) {
        const cell = r.cells[c.id];
        if (!cell || cell.v === '' || cell.v === undefined || cell.v === null || isNaN(Number(cell.v))) continue;
        cells[r.id][c.id] = { v: Number(cell.v), star: !!cell.star };
      }
      avgCols.forEach((c, i) => {
        const cell = r.cells[c.id];
        if (!cell || cell.v === '' || cell.v === undefined) return;
        if (avgCols.length >= 2 && i === 0) reported.courses[r.course] = Number(cell.v);
        else if (r.kind === 'course') reported.courses[r.course] = Number(cell.v);
        else reported.subs[r.id] = Number(cell.v);
      });
    }
    // SABIS marks for the same term always win; a typed or photographed copy is kept but not counted
    const fromSabis = (KH.store.data.reports || []).find(r => r.childId === state.childId && r.year === state.year && r.term === state.term && r.source === 'sabis' && r.id !== g.editingId);
    if (fromSabis && !(await u.confirm(`SABIS already has ${KH.store.childName(state.childId)}'s marks for ${state.term} ${state.year}. These marks will be kept, but the SABIS ones are what the analysis counts. Save anyway?`, 'Save anyway'))) return;
    const same = (KH.store.data.reports || []).filter(r => r.childId === state.childId && r.year === state.year && r.term === state.term && r.id !== g.editingId && r.source !== 'sabis' && !r.superseded);
    if (same.length && !fromSabis) {
      const choice = await new Promise(resolve => u.modal({ title: 'There is already a report for this term',
        body: h('p', null, `${KH.store.childName(state.childId)} already has ${same.length === 1 ? 'a report' : same.length + ' reports'} for ${state.term} ${state.year}. Replace it with this one? Keep both only if this picture holds different marks (for example a second page), otherwise the marks are counted twice.`),
        onClose: () => resolve('cancel'),
        actions: [{ label: 'Cancel', onClick: () => resolve('cancel') }, { label: 'Keep both', onClick: () => resolve('both') }, { label: 'Replace', primary: true, onClick: () => resolve('replace') }] }));
      if (choice === 'cancel') return;
      if (choice === 'replace') {
        // keep the school's overall from the old report if this one did not have it
        const prevOverall = same.map(r => r.reported && r.reported.overall).find(v => v !== null && v !== undefined && v !== '');
        if (reported.overall === null && prevOverall !== undefined) reported.overall = Number(prevOverall);
        same.forEach(r => KH.store.remove('reports', r.id));
      }
    }
    const rec = {
      id: g.editingId, childId: state.childId, year: state.year, term: state.term, importedAt: (g.editingId && (KH.store.data.reports.find(x => x.id === g.editingId) || {}).importedAt) || u.now(),
      source: g.source, photo: g.photo, note: g.note || (g.source === 'manual' ? 'Typed in' : g.source === 'portal' ? 'School portal page' : 'Photo / screenshot'),
      columns: cols.map(c => ({ id: c.id, label: c.label.trim() || 'Mark', kind: c.kind, date: c.date || null })),
      rows: rows.map(r => ({ id: r.id, course: r.course.trim(), sub: (r.sub || '').trim(), kind: r.kind })),
      cells, reported, attendance: g.attendance,
    };
    if (fromSabis) rec.superseded = 'sabis';
    KH.store.upsert('reports', rec);
    // teach the digit reader with the checked marks
    if (g.ocr) {
      const learn = [];
      for (const r of g.rows) for (const c of g.columns) {
        const cell = r.cells[c.id];
        if (r.ocrRi === undefined || c.ocrCi === undefined || !cell || !cell.ocr) continue;
        if (cell.v !== '' && /^\d{1,3}$/.test(String(cell.v))) learn.push({ ri: r.ocrRi, ci: c.ocrCi, value: String(cell.v) });
      }
      try { const n = await window.hub.learn(learn); if (n) u.toast(`Saved. The reader learned from ${n} digits.`); } catch (e) { /* ignore */ }
    } else u.toast('Saved');
    const childId = state.childId;
    state = null;
    KH.app.go(`#/child/${childId}`);
  }

  // ---------- review grid ----------
  function cellText(cell) { return !cell || cell.v === '' || cell.v === undefined ? '' : `${cell.v}${cell.star ? '*' : ''}`; }

  function gridEditor() {
    const g = state.grid;
    const table = h('table');
    const head = h('tr', null, h('th', null, h('div', { class: 'small muted' }, 'Subject (course / part)')), h('th', null, h('div', { class: 'small muted' }, 'Row')));
    g.columns.forEach((c, ci) => {
      head.appendChild(h('th', null,
        h('input', { class: 'cell', style: { width: '78px', fontWeight: 600 }, value: c.label, placeholder: 'Label', oninput: e => { c.label = e.target.value; } }),
        h('select', { style: { width: '78px', fontSize: '11px' }, onchange: e => { c.kind = e.target.value; } },
          [['assessment', 'mark'], ['midterm', 'mid-term'], ['final', 'final'], ['average', 'average']].map(([v, l]) => h('option', { value: v, selected: c.kind === v }, l))),
        h('input', { type: 'date', style: { width: '78px', fontSize: '10px' }, value: c.date || '', title: 'Date (optional)', onchange: e => { c.date = e.target.value; } }),
        h('div', null, h('a', { class: 'small', onclick: () => { g.columns.splice(ci, 1); KH.app.refresh(); } }, 'remove'))));
    });
    table.appendChild(h('thead', null, head));
    const body = h('tbody');
    g.rows.forEach((r, ri) => {
      const tr = h('tr', { class: r.kind === 'course' ? 'course-row' : '' },
        h('td', null, h('div', { class: 'row', style: { gap: '2px', flexWrap: 'nowrap' } },
          h('input', { class: 'label', style: { width: '120px', background: r.labelConfident === false ? 'var(--warnbg)' : '' }, value: r.course, placeholder: 'Course', oninput: e => { r.course = e.target.value; } }),
          h('input', { class: 'label', style: { width: '150px', background: r.labelConfident === false ? 'var(--warnbg)' : '' }, value: r.sub, placeholder: '(part, e.g. Grammar)', oninput: e => { r.sub = e.target.value; } }))),
        h('td', null, h('select', { style: { width: '84px', fontSize: '12px' }, onchange: e => { r.kind = e.target.value; KH.app.refresh(); } },
          [['sub', 'subject'], ['course', 'course total']].map(([v, l]) => h('option', { value: v, selected: r.kind === v }, l))),
          h('a', { class: 'small', style: { marginLeft: '4px' }, onclick: () => { g.rows.splice(ri, 1); KH.app.refresh(); } }, '✕')));
      g.columns.forEach(c => {
        const cell = r.cells[c.id];
        tr.appendChild(h('td', { class: cell && cell.low ? 'low' : '' }, h('input', { class: 'cell', value: cellText(cell), title: cell && cell.low ? 'Not sure about this one - please check' : '',
          oninput: e => {
            const t = e.target.value.trim();
            const star = /\*$/.test(t);
            const v = t.replace(/\*/g, '').trim();
            r.cells[c.id] = Object.assign(r.cells[c.id] || {}, { v: v === '' ? '' : (isNaN(Number(v)) ? '' : Number(v)), star, low: false });
            e.target.parentElement.classList.remove('low');
          } })));
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    return h('div', { class: 'grid-editor' }, table);
  }

  function reviewView() {
    const g = state.grid;
    const kids = KH.store.children();
    const lowCount = g.rows.reduce((n, r) => n + Object.values(r.cells).filter(c => c && c.low).length, 0) + g.rows.filter(r => r.labelConfident === false).length;
    const header = h('div', { class: 'card' },
      h('div', { class: 'row' },
        h('label', { class: 'f', style: { width: '180px', margin: 0 } }, h('span', null, 'Child'), h('select', { onchange: e => { state.childId = e.target.value; } }, kids.map(c => h('option', { value: c.id, selected: c.id === state.childId }, c.name)))),
        h('label', { class: 'f', style: { width: '140px', margin: 0 } }, h('span', null, 'Academic year'), h('select', { onchange: e => { state.year = e.target.value; } }, years().map(y => h('option', { value: y, selected: y === state.year }, y)))),
        h('label', { class: 'f', style: { width: '130px', margin: 0 } }, h('span', null, 'Term'), h('select', { onchange: e => { state.term = e.target.value; } }, TERMS.map(t => h('option', { value: t, selected: t === state.term }, t)))),
        h('label', { class: 'f', style: { width: '160px', margin: 0 } }, h('span', null, 'Overall on report (optional)'), h('input', { type: 'number', value: g.overall, oninput: e => { g.overall = e.target.value; } })),
        h('label', { class: 'f', style: { flex: 1, minWidth: '180px', margin: 0 } }, h('span', null, 'Note'), h('input', { type: 'text', value: g.note, oninput: e => { g.note = e.target.value; } }))));
    const tools = h('div', { class: 'row', style: { marginBottom: '10px' } },
      h('button', { class: 'btn small', onclick: () => { g.rows.push(newRow()); KH.app.refresh(); } }, '+ Row'),
      h('button', { class: 'btn small', onclick: () => { g.columns.push(newCol('', 'assessment')); KH.app.refresh(); } }, '+ Column'),
      h('button', { class: 'btn small', onclick: () => {
        const prev = lastReportRows(state.childId);
        if (!prev.length) return u.toast('No earlier report for this child', 'bad');
        prev.forEach((p, i) => { if (g.rows[i]) { g.rows[i].course = p.course; g.rows[i].sub = p.sub; g.rows[i].kind = p.kind || 'sub'; g.rows[i].labelConfident = true; } });
        KH.app.refresh(); u.toast('Subject names copied in the same order - check they line up');
      } }, 'Copy subject names from last report'),
      h('button', { class: 'btn small', onclick: async () => {
        const r = await u.prompt('Number the mark columns', [{ key: 'prefix', label: 'Label', value: 'Week' }, { key: 'start', label: 'First number', type: 'number', value: '1' }]);
        if (!r) return;
        let n = Number(r.start) || 1;
        g.columns.forEach(c => { if (c.kind === 'assessment') c.label = `${r.prefix} ${n++}`; });
        KH.app.refresh();
      } }, 'Number columns...'),
      h('div', { class: 'spacer' }),
      lowCount ? u.chip(`${lowCount} highlighted to check`, 'warn') : null);
    const left = h('div', { style: { flex: 1, minWidth: 0 } }, tools, gridEditor(),
      h('p', { class: 'small muted' }, 'Type 72* for a starred mark. "Course total" rows hold a course\'s overall mark per column (portal style); "average" columns hold the averages printed on the report.'),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { state = null; KH.app.go('#/add'); } }, 'Cancel'), h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: save }, g.editingId ? 'Save changes' : 'Save marks')));
    const wrap = h('div', null, header);
    if (g.photo) {
      let zoom = 1;
      const img = h('img', { title: 'Click to zoom in or out', style: { width: '100%', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'zoom-in' } });
      img.addEventListener('click', e => {
        const box = img.parentElement, r = img.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        zoom = zoom === 1 ? 2.5 : 1;
        img.style.width = `${zoom * 100}%`; img.style.cursor = zoom === 1 ? 'zoom-in' : 'zoom-out';
        if (zoom > 1) { box.scrollLeft = fx * img.offsetWidth - box.clientWidth / 2; box.scrollTop = fy * img.offsetHeight - box.clientHeight / 2; }
      });
      window.hub.url(g.photo).then(src => { img.src = src; });
      wrap.appendChild(h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '16px', flexWrap: 'nowrap' } }, left,
        h('div', { style: { width: '40%', flexShrink: 0 } },
          h('div', { class: 'row small muted', style: { marginBottom: '4px' } }, h('span', null, 'The picture, for checking (click to zoom):'), h('div', { class: 'spacer' }),
            h('a', { onclick: () => window.hub.open(g.photo) }, 'Open full size')),
          h('div', { style: { maxHeight: '75vh', overflow: 'auto', borderRadius: '6px' } }, img))));
    } else wrap.appendChild(left);
    if (g.note && g.source !== 'manual' && /No marks/.test(g.note)) wrap.insertBefore(h('div', { class: 'warnbox', style: { marginBottom: '10px' } }, g.note), wrap.children[1]);
    return wrap;
  }

  // ---------- sources ----------
  // Reads a picture already copied into the data folder and opens the review grid.
  async function readPicture(rel) {
    if (!state) state = defaults();
    state.busy = 'Reading the marks from the picture... (about 5-20 seconds)';
    KH.app.refresh();
    let ok = false;
    try {
      const res = await window.hub.ocr(rel);
      state.grid = gridFromOcr(res, rel, 'photo');
      if (!state.grid.columns.length) { state.grid.columns = [newCol('Mark')]; state.grid.rows = [newRow()]; state.grid.note = 'No marks were found in this picture - type them in, or try a sharper picture.'; }
      state.step = 'review';
      ok = true;
    } catch (e) { u.toast('Could not read the picture: ' + e.message, 'bad'); }
    state.busy = '';
    if (ok) KH.app.go('#/add/review'); else KH.app.refresh();
  }
  KH.pages.readPicture = readPicture;

  async function fromPhoto() {
    const paths = await window.hub.pick({ title: 'Choose the report photo or screenshot', filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'webp'] }] });
    if (!paths.length) return;
    const saved = await window.hub.store(paths[0], 'reports');
    return readPicture(saved.rel);
  }

  const fileToBase64 = file => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).replace(/^data:[^,]*,/, ''));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  async function fromFileObject(file, how) {
    if (!file || !/^image\//.test(file.type || '') && !/\.(jpe?g|png|bmp|gif|webp)$/i.test(file.name || '')) return u.toast('That is not a picture', 'bad');
    let saved = null;
    const p = window.hub.pathForFile ? window.hub.pathForFile(file) : '';
    if (p) saved = await window.hub.store(p, 'reports');
    else {
      const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      saved = await window.hub.storeData(await fileToBase64(file), 'reports', `${how}-${u.today()}.${ext}`);
    }
    return readPicture(saved.rel);
  }
  const onAddPage = () => location.hash === '#/add' && !(state && state.busy) && KH.app.isParent();
  document.addEventListener('paste', e => {
    if (!onAddPage()) return;
    const item = Array.from((e.clipboardData || {}).items || []).find(i => i.kind === 'file' && /^image\//.test(i.type));
    if (!item) return;
    e.preventDefault();
    fromFileObject(item.getAsFile(), 'pasted');
  });
  document.addEventListener('dragover', e => { e.preventDefault(); const z = document.querySelector('.dropzone'); if (z && onAddPage()) z.classList.add('over'); });
  document.addEventListener('dragleave', e => { if (e.target && e.target.classList && e.target.classList.contains('dropzone')) e.target.classList.remove('over'); });
  document.addEventListener('drop', e => {
    e.preventDefault();
    if (!onAddPage()) return;
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) fromFileObject(f, 'dropped');
  });

  async function portalRead(kind) {
    state.busy = kind === 'tables' ? 'Reading the table on the portal page...' : 'Capturing the portal page and reading it...';
    KH.app.refresh();
    try {
      const res = kind === 'tables' ? await window.hub.portalTables() : await window.hub.portalCapture();
      state.grid = gridFromOcr(res, res.photo || null, kind === 'tables' ? 'portal' : 'capture');
      state.step = 'review';
      state.busy = '';
      KH.app.go('#/add/review');
    } catch (e) { state.busy = ''; u.toast(e.message, 'bad'); KH.app.refresh(); }
  }

  function quick() {
    const prev = lastReportRows(state.childId).filter(r => r.kind !== 'course');
    const subjects = prev.length ? prev.map(r => [r.course, r.sub]) : ['English', 'Arabic', 'Mathematics', 'Science', 'Social Studies', 'Islamic Studies', 'Computing', 'French'].map(s => [s, s]);
    const col = newCol('Final', 'final');
    state.grid = { columns: [col], rows: subjects.map(([c, s]) => newRow(c, s === c ? c : s)), photo: null, source: 'manual', note: 'Typed in (final marks)', overall: '' };
    state.step = 'review';
    KH.app.go('#/add/review');
  }

  function detailed() {
    const cols = [newCol('Test 1'), newCol('Test 2'), newCol('Test 3'), newCol('Mid Term', 'midterm'), newCol('Final', 'final')];
    const prev = lastReportRows(state.childId);
    const rows = prev.length ? prev.map(r => newRow(r.course, r.sub, r.kind)) : [newRow('English', 'English'), newRow('Mathematics', 'Mathematics'), newRow('Science', 'Science')];
    state.grid = { columns: cols, rows, photo: null, source: 'manual', note: 'Typed in', overall: '' };
    state.step = 'review';
    KH.app.go('#/add/review');
  }

  function sourceView() {
    const kids = KH.store.children();
    const card = (title, text, btns) => h('div', { class: 'card' }, h('h2', null, title), h('p', { class: 'muted small', style: { minHeight: '38px' } }, text), h('div', { class: 'row' }, btns));
    return h('div', null,
      KH.phoneApp ? h('div', { class: 'note', style: { marginBottom: '18px' } }, 'This year\'s marks come from SABIS on the family PC. On the phone you can type marks for earlier years or other schools; reading marks from a photo is done on the PC.') :
      KH.app.isParent() ? h('div', { class: 'note', style: { marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } },
        h('span', { style: { flex: '1 1 300px' } }, 'This year\'s marks come straight from SABIS with one click. Use this page for earlier years, other schools or anything SABIS does not have.'), KH.sabisButton()) : null,
      h('div', { class: 'card' }, h('div', { class: 'row' },
        h('label', { class: 'f', style: { width: '200px', margin: 0 } }, h('span', null, 'Child'), h('select', { onchange: e => { state.childId = e.target.value; } }, kids.map(c => h('option', { value: c.id, selected: c.id === state.childId }, c.name)))),
        h('label', { class: 'f', style: { width: '160px', margin: 0 } }, h('span', null, 'Academic year'), h('select', { onchange: e => { state.year = e.target.value; } }, years().map(y => h('option', { value: y, selected: y === state.year }, y)))),
        h('label', { class: 'f', style: { width: '160px', margin: 0 } }, h('span', null, 'Term'), h('select', { onchange: e => { state.term = e.target.value; } }, TERMS.map(t => h('option', { value: t, selected: t === state.term }, t)))))),
      state.busy ? h('div', { class: 'note', style: { marginBottom: '16px' } }, state.busy) : null,
      h('div', { class: 'grid g2' },
        KH.phoneApp ? null : h('div', { class: 'card dropzone' }, h('h2', null, 'From a photo or screenshot'),
          h('p', { class: 'muted small', style: { minHeight: '38px' } }, 'Pick a photo of the printed report or a screenshot of the portal, drag it here, or press Ctrl+V after taking a screenshot (Windows + Shift + S). The app reads it offline and shows everything for checking; unsure marks are highlighted.'),
          h('div', { class: 'row' }, h('button', { class: 'btn primary', disabled: !!state.busy, onclick: fromPhoto }, 'Choose picture...'))),
        KH.phoneApp ? null : card('From one SABIS page', 'Opens SABIS inside the app, signed in with your saved parent login. Open the page with the marks, then read it straight from the page (exact) or capture it.',
          [h('button', { class: 'btn', onclick: async () => { try { await window.hub.portalOpen(); } catch (e) { u.toast(e.message, 'bad'); } } }, 'Open SABIS'),
            h('button', { class: 'btn primary', disabled: !!state.busy, onclick: () => portalRead('tables') }, 'Read marks from page'),
            h('button', { class: 'btn', disabled: !!state.busy, onclick: () => portalRead('capture') }, 'Capture page')]),
        card('Type marks: quick', 'One mark per subject, for old report cards that only show final grades (good for past years).', [h('button', { class: 'btn', onclick: quick }, 'Start quick entry')]),
        card('Type marks: detailed', 'A full grid of subjects and tests, the same as the review screen.', [h('button', { class: 'btn', onclick: detailed }, 'Start detailed entry')])));
  }

  KH.pages.importer = function (route) {
    if (!state || KH.pages.importPreset) state = defaults();
    if (route === '#/add/review' && state.grid) return reviewView();
    if (route === '#/add' && state.grid && !state.busy) { state = defaults(); }
    return sourceView();
  };
})();
