// Generic list + form screens built from the record types in schema.js.
(function () {
  'use strict';
  const KH = window.KH;
  const u = KH.u, h = u.h;

  const resolveOptions = f => (typeof f.options === 'function' ? f.options() : f.options || []).map(x => (typeof x === 'string' ? { value: x, label: x } : x));

  function display(schema, key, rec) {
    const f = schema.fields.find(x => x.key === key);
    const v = rec[key];
    if (!f) return v === undefined || v === null ? '' : String(v);
    if (v === undefined || v === null || v === '') return '';
    switch (f.type) {
      case 'date': return u.fmtDate(v);
      case 'child': return KH.store.childName(v);
      case 'check': return v ? 'Yes' : '';
      case 'file': return v.name || 'file';
      case 'multi': case 'children': return (v || []).map(x => (f.type === 'children' ? KH.store.childName(x) : x)).join(', ');
      case 'select': { const o = resolveOptions(f).find(o => String(o.value) === String(v)); return o ? o.label : String(v); }
      default: return String(v);
    }
  }

  function input(f, value, onChange) {
    const changed = () => onChange && onChange();
    switch (f.type) {
      case 'textarea': {
        const el = h('textarea', { oninput: changed }); el.value = value || '';
        return { el, get: () => el.value };
      }
      case 'number': {
        const el = h('input', { type: 'number', step: f.step || 'any', value: value === undefined || value === null ? '' : value, oninput: changed });
        return { el, get: () => (el.value === '' ? '' : Number(el.value)) };
      }
      case 'date': {
        const el = h('input', { type: 'date', value: value || '', onchange: changed });
        return { el, get: () => el.value };
      }
      case 'check': {
        const el = h('input', { type: 'checkbox', checked: !!value, onchange: changed });
        return { el: h('div', null, el), get: () => el.checked };
      }
      case 'select': case 'child': {
        const options = f.type === 'child'
          ? [{ value: '', label: f.required ? 'Choose...' : '-' }].concat(KH.store.children().map(c => ({ value: c.id, label: c.name })))
          : resolveOptions(f);
        const el = h('select', { onchange: changed }, options.map(o => h('option', { value: o.value, selected: String(o.value) === String(value === undefined ? '' : value) }, o.label)));
        if (f.locked) el.disabled = true;
        return { el, get: () => el.value };
      }
      case 'multi': case 'children': {
        const options = f.type === 'children' ? KH.store.children().map(c => ({ value: c.id, label: c.name })) : resolveOptions(f);
        const set = new Set(value || []);
        const boxes = options.map(o => { const cb = h('input', { type: 'checkbox', checked: set.has(o.value), onchange: changed }); cb.dataset.v = o.value; return h('label', null, cb, o.label); });
        const el = h('div', { class: 'checks' }, boxes);
        return { el, get: () => Array.from(el.querySelectorAll('input')).filter(c => c.checked).map(c => c.dataset.v) };
      }
      case 'file': {
        let cur = value || null;
        const name = h('span', { class: 'muted small' }, cur ? cur.name : 'No file');
        const openBtn = h('button', { class: 'btn small', type: 'button', onclick: () => cur && window.hub.open(cur.rel) }, 'Open');
        const preview = h('div');
        const showPreview = async () => {
          preview.innerHTML = '';
          if (cur && f.accept === 'image') preview.appendChild(h('img', { src: await window.hub.url(cur.rel), style: { maxWidth: '220px', maxHeight: '150px', borderRadius: '6px', marginTop: '6px' } }));
        };
        const pick = async () => {
          const filters = f.accept === 'image' ? [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'] }] : [];
          const paths = await window.hub.pick({ filters });
          if (!paths.length) return;
          cur = await window.hub.store(paths[0], f.folder || 'documents');
          name.textContent = cur.name; openBtn.disabled = false; showPreview(); changed();
        };
        openBtn.disabled = !cur;
        showPreview();
        return { el: h('div', null, h('div', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: pick }, 'Choose file...'), openBtn, name), preview), get: () => cur };
      }
      case 'list': {
        let rows = (value || []).map(r => Object.assign({}, r));
        const body = h('tbody');
        const wrap = h('div', null);
        const render = () => {
          body.innerHTML = '';
          rows.forEach((r, i) => {
            const tr = h('tr');
            for (const sf of f.sub) {
              let el;
              if (sf.type === 'check') el = h('input', { type: 'checkbox', checked: !!r[sf.key], onchange: e => { r[sf.key] = e.target.checked; } });
              else el = h('input', { type: sf.type === 'number' ? 'number' : sf.type === 'date' ? 'date' : 'text', value: r[sf.key] === undefined ? '' : r[sf.key], style: sf.width ? { width: sf.width + 'px' } : null,
                oninput: e => { r[sf.key] = sf.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value; } });
              tr.appendChild(h('td', null, el));
            }
            tr.appendChild(h('td', null, h('a', { onclick: () => { rows.splice(i, 1); render(); } }, '✕')));
            body.appendChild(tr);
          });
        };
        render();
        wrap.appendChild(h('table', { class: 'list sub-table' }, h('thead', null, h('tr', null, f.sub.map(sf => h('th', null, sf.label)), h('th'))), body));
        wrap.appendChild(h('div', { class: 'row', style: { marginTop: '6px' } },
          h('button', { class: 'btn small', type: 'button', onclick: () => { const nr = {}; f.sub.forEach(sf => { if (sf.type === 'check') nr[sf.key] = false; }); rows.push(nr); render(); } }, '+ Add row'),
          f.key === 'questions' ? h('button', { class: 'btn small', type: 'button', onclick: async () => {
            const r = await u.prompt('Add several questions', [{ key: 'n', label: 'How many questions?', type: 'number', value: '10' }, { key: 'topic', label: 'Topic for all (optional)' }]);
            if (!r) return; const n = Math.min(80, Number(r.n) || 0);
            for (let k = 0; k < n; k++) rows.push({ q: String(rows.length + 1), topic: r.topic || '', correct: true });
            render();
          } }, '+ Add many') : null));
        return { el: wrap, get: () => rows.filter(r => Object.values(r).some(v => v !== '' && v !== false && v !== undefined)) };
      }
      default: {
        const el = h('input', { type: 'text', value: value || '', oninput: changed });
        return { el, get: () => el.value.trim() };
      }
    }
  }

  function canEdit(schema) {
    const role = KH.store.user ? KH.store.user.role : 'parent';
    return role === 'parent' || !!schema.childEditable;
  }
  // A child may change only what they added themselves; parents can change or remove anything.
  function mayEdit(schema, rec) {
    const user = KH.store.user;
    if (!user || user.role === 'parent') return true;
    if (!schema.childEditable) return false;
    return !rec || !rec.id || rec.createdBy === user.id;
  }
  const kidAuthor = rec => { const users = KH.store.data.users || []; const x = rec && rec.createdBy ? users.find(v => v.id === rec.createdBy) : null; return x && x.role === 'child' ? x : null; };
  const singularOf = schema => (KH.store.user && KH.store.user.role === 'child' && schema.childSingular ? schema.childSingular : schema.singular);
  const visibleFields = schema => schema.fields.filter(f => !(f.parentOnly && KH.store.user && KH.store.user.role === 'child'));

  function edit(collKey, record, opts = {}) {
    const schema = KH.schema[collKey];
    const isNew = !record;
    let rec = Object.assign({}, record || {});
    if (isNew) for (const f of schema.fields) if (f.default !== undefined && rec[f.key] === undefined) rec[f.key] = typeof f.default === 'function' ? f.default() : f.default;
    if (opts.preset) Object.assign(rec, opts.preset);
    const role = KH.store.user ? KH.store.user.role : 'parent';
    if (role === 'child') rec.childId = KH.store.user.childId;
    const readOnly = !canEdit(schema) || !mayEdit(schema, record) || opts.readOnly;
    const controls = {};
    const form = h('div', { class: 'form-grid' });
    const current = () => { const out = Object.assign({}, rec); for (const [k, c] of Object.entries(controls)) out[k] = c.get(); return out; };
    // which fields show for these answers; the form is redrawn only when this changes, so typing keeps its place
    const shownKeys = snap => visibleFields(schema).filter(f => !f.show || f.show(snap)).map(f => f.key).join('|');
    let lastShown = '';
    const onFieldChange = () => {
      if (!schema.fields.some(x => x.show)) return;
      if (shownKeys(current()) === lastShown) return;
      // keep the cursor in the field being typed in across the redraw
      const act = document.activeElement;
      let key = null, start = null, end = null;
      for (const [k, c] of Object.entries(controls)) if (act && (c.el === act || (c.el.contains && c.el.contains(act)))) key = k;
      try { if (act && 'selectionStart' in act) { start = act.selectionStart; end = act.selectionEnd; } } catch (e) { /* not a text field */ }
      build();
      const c = key && controls[key];
      if (c) {
        const el = ['INPUT', 'SELECT', 'TEXTAREA'].includes(c.el.tagName) ? c.el : c.el.querySelector && c.el.querySelector('input,select,textarea');
        if (el) { el.focus(); try { if (start !== null) el.setSelectionRange(start, end); } catch (e) { /* not a text field */ } }
      }
    };
    const build = () => {
      const snapshot = Object.keys(controls).length ? current() : rec;
      lastShown = shownKeys(snapshot);
      form.innerHTML = '';
      for (const k of Object.keys(controls)) delete controls[k];
      for (const f0 of visibleFields(schema)) {
        if (f0.show && !f0.show(snapshot)) continue;
        const f = Object.assign({}, f0);
        if (f.key === 'childId' && role === 'child') f.locked = true;
        const c = input(f, snapshot[f.key], onFieldChange);
        controls[f.key] = c;
        if (readOnly) c.el.querySelectorAll ? c.el.querySelectorAll('input,select,textarea,button').forEach(x => { x.disabled = true; }) : null;
        if (readOnly && ['INPUT', 'SELECT', 'TEXTAREA'].includes(c.el.tagName)) c.el.disabled = true;
        form.appendChild(h('label', { class: `f ${f.full || f.type === 'list' || f.type === 'multi' || f.type === 'children' || f.type === 'textarea' ? 'full' : ''}` },
          h('span', null, f.label + (f.required ? ' *' : '')), c.el));
      }
    };
    build();
    const actions = [];
    if (!isNew && !readOnly) actions.push({ label: 'Delete', danger: true, left: true, onClick: async () => {
      if (!(await u.confirm(`Delete this ${singularOf(schema)}?`, 'Delete'))) return false;
      KH.store.remove(collKey, rec.id); u.toast('Deleted'); if (opts.onSaved) opts.onSaved(); KH.app.refresh(); return true;
    } });
    actions.push({ label: readOnly ? 'Close' : 'Cancel' });
    if (!readOnly) actions.push({ label: 'Save', primary: true, onClick: () => {
      const out = current();
      for (const f of schema.fields) {
        if (f.required && (f.show ? f.show(out) : true) && (out[f.key] === '' || out[f.key] === undefined || out[f.key] === null)) { u.toast(`Please fill in "${f.label}"`, 'bad'); return false; }
      }
      if (isNew && !out.createdBy && KH.store.user) out.createdBy = KH.store.user.id;
      for (const f of schema.fields) if (f.show && !f.show(out) && f.key in out && !(f.key in rec)) delete out[f.key];
      const saved = KH.store.upsert(collKey, out);
      u.toast('Saved');
      if (opts.onSaved) opts.onSaved(saved);
      KH.app.refresh();
      return true;
    } });
    const by = kidAuthor(rec);
    const head = by && !isNew ? h('div', { class: 'small muted', style: { marginBottom: '10px' } }, `Added by ${by.displayName || by.username}${rec.createdAt ? `, ${u.fmtDateTime(rec.createdAt)}` : ''}`) : null;
    u.modal({ title: `${isNew ? 'Add' : readOnly ? 'View' : 'Edit'} ${singularOf(schema)}`, body: head ? h('div', null, head, form) : form, actions, wide: schema.fields.some(f => f.type === 'list') });
  }

  function list(collKey, opts = {}) {
    const schema = KH.schema[collKey];
    const role = KH.store.user ? KH.store.user.role : 'parent';
    let rows = (KH.store.data[collKey] || []).slice();
    const childFilter = role === 'child' ? KH.store.user.childId : opts.childId || KH.app.filterChild || '';
    const hasChild = schema.fields.some(f => f.key === 'childId');
    if (childFilter && hasChild) rows = rows.filter(r => !r.childId || r.childId === childFilter);
    if (opts.filter) rows = rows.filter(opts.filter);
    if (schema.sort) rows.sort(schema.sort);
    const hidden = new Set(schema.fields.filter(f => (f.parentOnly || f.key === 'childId') && role === 'child').map(f => f.key));
    const cols = (opts.cols || schema.list).filter(c => !hidden.has(typeof c === 'string' ? c : c.key)).map(c => (typeof c === 'string' ? { key: c, label: (schema.fields.find(f => f.key === c) || { label: c }).label.replace(/\s*\(.*\)\s*\*?$/, '') } : c));
    if (role === 'parent' && rows.some(kidAuthor)) cols.push({ key: 'createdBy', label: 'Added by', render: r => { const k = kidAuthor(r); return k ? u.chip(k.displayName || k.username, 'accent') : ''; } });
    const table = h('table', { class: 'list' },
      h('thead', null, h('tr', null, cols.map(c => h('th', { class: c.right ? 'right' : '' }, c.label)))),
      h('tbody', null, rows.length ? rows.map(r => h('tr', { class: 'click', onclick: () => edit(collKey, r, { onSaved: opts.onSaved }) },
        cols.map(c => h('td', { class: c.right ? 'right nowrap' : '' }, c.render ? c.render(r) : display(schema, c.key, r))))) :
        h('tr', null, h('td', { colspan: cols.length, class: 'empty' }, `Nothing here yet.`))));
    const bar = h('div', { class: 'row', style: { marginBottom: '12px' } });
    if (hasChild && role === 'parent' && !opts.childId) {
      bar.appendChild(h('select', { style: { width: '180px' }, onchange: e => { KH.app.filterChild = e.target.value; KH.app.refresh(); } },
        h('option', { value: '' }, 'All children'), KH.store.children().map(c => h('option', { value: c.id, selected: c.id === KH.app.filterChild }, c.name))));
    }
    bar.appendChild(h('div', { class: 'spacer' }));
    if (canEdit(schema) && !opts.noAdd) bar.appendChild(h('button', { class: 'btn primary', onclick: () => edit(collKey, null, { preset: opts.preset || (childFilter && hasChild ? { childId: childFilter } : null), onSaved: opts.onSaved }) }, `+ Add ${singularOf(schema)}`));
    return h('div', null, opts.noBar ? null : bar, h('div', { class: 'card', style: { padding: '6px 10px' } }, table));
  }

  function page(collKey) {
    const schema = KH.schema[collKey];
    return h('div', null, h('p', { class: 'muted', style: { marginTop: 0 } }, schema.desc), list(collKey));
  }

  KH.crud = { edit, list, page, display, input, resolveOptions, mayEdit, kidAuthor };
})();
