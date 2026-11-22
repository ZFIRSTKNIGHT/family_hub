// Reading & books: one family library (covers, categories, search), a shelf for each child
// (to read, reading, finished), and a reader for PDF and EPUB books inside the app that
// remembers the page and logs reading time for the child.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h, A = KH.analysis;
  const DEFAULT_CATS = ['Stories & novels', 'Islamic', 'Arabic', 'English', 'Science', 'Maths', 'History & geography', 'Exam prep', 'Comics', 'Other'];
  const STATUSES = ['To read', 'Reading', 'Finished'];

  // ---------------- data helpers ----------------
  const L = KH.lib = {};
  L.categories = () => Array.from(new Set(DEFAULT_CATS.concat(KH.store.settings().bookCategories || []).concat((KH.store.data.books || []).map(b => b.category).filter(Boolean))));
  L.book = id => (KH.store.data.books || []).find(b => b.id === id);
  L.shelf = (bookId, childId) => (KH.store.data.shelf || []).find(x => x.bookId === bookId && x.childId === childId);
  L.setShelf = (bookId, childId, patch) => {
    const cur = L.shelf(bookId, childId);
    const rec = Object.assign({}, cur || { bookId, childId, status: 'To read' }, patch);
    if (rec.status === 'Reading' && !rec.startDate) rec.startDate = u.today();
    if (rec.status === 'Finished' && !rec.endDate) rec.endDate = u.today();
    if (rec.status !== 'Finished') delete rec.endDate;
    return KH.store.upsert('shelf', rec);
  };
  L.visibleTo = (b, childId) => !b.visibleTo || !b.visibleTo.length || b.visibleTo.includes(childId);
  L.forViewer = () => {
    const all = (KH.store.data.books || []).filter(b => !b.deletedAt);
    if (KH.app.isParent()) return all;
    const me = KH.store.user.childId;
    return all.filter(b => L.visibleTo(b, me));
  };
  const fmtOf = name => (/\.epub$/i.test(name) ? 'epub' : /\.pdf$/i.test(name) ? 'pdf' : 'other');
  const titleFrom = name => String(name || '').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+-\s+/g, ' - ').replace(/\s{2,}/g, ' ').trim();
  const catFrom = folder => {
    if (!folder) return '';
    const f = String(folder).toLowerCase();
    return L.categories().find(c => c.toLowerCase() === f) || folder;
  };

  // scripts for the reader load only when needed
  const loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });
    return loaded[src];
  }
  async function pdfjs() {
    await loadScript('vendor/pdf.min.js');
    const lib = window.pdfjsLib;
    if (lib && !lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
    return lib;
  }
  const openPdf = async rel => (await pdfjs()).getDocument({ url: window.hub.fileUrl(rel), isEvalSupported: false, standardFontDataUrl: 'vendor/pdf-fonts/' }).promise;

  // ---------------- EPUB (unzipped here, shown without any of the book's scripts) ----------------
  async function openEpub(rel) {
    await loadScript('vendor/jszip.min.js');
    const buf = await (await fetch(window.hub.fileUrl(rel))).arrayBuffer();
    const zip = await window.JSZip.loadAsync(buf);
    const read = p => { const f = zip.file(decodeURIComponent(p)) || zip.file(p); return f ? f.async('string') : Promise.resolve(''); };
    const xml = s => new DOMParser().parseFromString(s, 'application/xml');
    const container = xml(await read('META-INF/container.xml'));
    const opfPath = (container.querySelector('rootfile') || {}).getAttribute ? container.querySelector('rootfile').getAttribute('full-path') : '';
    if (!opfPath) throw new Error('This EPUB file looks damaged.');
    const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
    const opf = xml(await read(opfPath));
    const items = {};
    opf.querySelectorAll('manifest > item').forEach(it => { items[it.getAttribute('id')] = { href: base + it.getAttribute('href'), type: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' }; });
    const spine = Array.from(opf.querySelectorAll('spine > itemref')).map(r => items[r.getAttribute('idref')]).filter(x => x && /html/.test(x.type));
    const title = (opf.querySelector('metadata title, metadata > *|title') || {}).textContent || '';
    const author = (opf.querySelector('metadata creator, metadata > *|creator') || {}).textContent || '';
    const coverMeta = opf.querySelector('metadata meta[name="cover"]');
    let cover = Object.values(items).find(x => /cover-image/.test(x.props)) || (coverMeta ? items[coverMeta.getAttribute('content')] : null);
    if (cover && !/^image\//.test(cover.type)) cover = null;
    const resolve = (from, href) => { if (!href || /^(data:|https?:)/i.test(href)) return href; const parts = (from.slice(0, from.lastIndexOf('/') + 1) + href.split('#')[0]).split('/'); const out = []; for (const p of parts) { if (p === '..') out.pop(); else if (p !== '.') out.push(p); } return out.join('/'); };
    const dataUrl = async (path, type) => { const f = zip.file(decodeURIComponent(path)) || zip.file(path); if (!f) return ''; return `data:${type || 'image/jpeg'};base64,${await f.async('base64')}`; };
    async function chapter(i) {
      const it = spine[i];
      if (!it) return '';
      const doc = new DOMParser().parseFromString(await read(it.href), 'text/html');
      doc.querySelectorAll('script, iframe, object, embed, form, link[rel="preload"]').forEach(n => n.remove());
      doc.querySelectorAll('*').forEach(n => { for (const a of Array.from(n.attributes)) if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
      let css = '';
      for (const l of Array.from(doc.querySelectorAll('link[rel~="stylesheet"]'))) { css += await read(resolve(it.href, l.getAttribute('href'))); l.remove(); }
      for (const img of Array.from(doc.querySelectorAll('img[src]'))) img.setAttribute('src', await dataUrl(resolve(it.href, img.getAttribute('src'))));
      for (const im of Array.from(doc.querySelectorAll('image'))) { const href = im.getAttribute('xlink:href') || im.getAttribute('href'); if (href) { const d = await dataUrl(resolve(it.href, href)); im.setAttribute('href', d); im.setAttribute('xlink:href', d); } }
      doc.querySelectorAll('a[href]').forEach(a => a.removeAttribute('href'));
      css = css.replace(/url\([^)]*\)/g, 'none').replace(/@import[^;]+;/g, '');
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style><style>html{background:#fffdf8}body{max-width:720px;margin:0 auto;padding:28px 34px 80px;font:19px/1.65 Georgia,"Times New Roman",serif;color:#1d1b16}img,svg{max-width:100%;height:auto}</style></head><body>${doc.body ? doc.body.innerHTML : ''}</body></html>`;
    }
    return { title: title.trim(), author: author.trim(), count: spine.length, chapter, coverData: cover ? await dataUrl(cover.href, cover.type) : '' };
  }

  // ---------------- covers ----------------
  async function makeCover(book) {
    if (!book.file || !book.file.rel || book.cover) return;
    try {
      let dataUrl = '', pages = null, meta = {};
      if (book.format === 'pdf') {
        const pdf = await openPdf(book.file.rel);
        pages = pdf.numPages;
        const page = await pdf.getPage(1);
        const vp0 = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: 360 / vp0.width });
        const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        dataUrl = c.toDataURL('image/jpeg', 0.82);
        try { pdf.destroy(); } catch (e) { /* ignore */ }
      } else if (book.format === 'epub') {
        const ep = await openEpub(book.file.rel);
        meta = { title: ep.title, author: ep.author };
        if (ep.coverData) {
          // shrink the cover to a thumbnail
          const img = new Image();
          await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = ep.coverData; });
          const c = document.createElement('canvas'); const w = 360; c.width = w; c.height = Math.round(img.height * w / img.width);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          dataUrl = c.toDataURL('image/jpeg', 0.82);
        }
      }
      const fresh = L.book(book.id) || book;
      const patch = {};
      if (dataUrl) patch.cover = await window.hub.storeData(dataUrl.split(',')[1], 'books', `cover-${book.id}.jpg`);
      if (pages) patch.pages = pages;
      if (meta.title && (!fresh.title || fresh.title === titleFrom(fresh.file.name))) patch.title = meta.title;
      if (meta.author && !fresh.author) patch.author = meta.author;
      if (Object.keys(patch).length) { KH.store.upsert('books', Object.assign({}, fresh, patch)); if (/^#\/reading/.test(location.hash)) KH.app.refresh(); }
    } catch (e) { console.warn('cover', e && e.message); }
  }
  L.makeCover = makeCover;

  // ---------------- adding books ----------------
  async function addFiles(list, opts = {}) {
    const kid = !KH.app.isParent();
    const me = KH.store.user;
    let n = 0;
    for (const f of list) {
      try {
        const stored = await window.hub.store(f.path, 'books');
        const rec = KH.store.upsert('books', {
          title: titleFrom(stored.name), author: '', category: catFrom(f.folder) || opts.category || 'Other', language: '',
          format: fmtOf(stored.name), file: { rel: stored.rel, name: stored.name, size: f.size || 0 },
          visibleTo: kid ? [me.childId] : (opts.visibleTo || []), addedBy: me.id, createdBy: me.id,
        });
        if (kid) L.setShelf(rec.id, me.childId, { status: 'To read' });
        n++;
        makeCover(rec);
        if (list.length > 5) await new Promise(r => setTimeout(r, 250)); // gentle on antivirus and the cloud folder
      } catch (e) { u.toast(`${f.path.split(/[\\/]/).pop()}: ${e.message}`, 'bad'); }
    }
    if (n) u.toast(`${n} book${n === 1 ? '' : 's'} added`, 'good');
    KH.app.refresh();
  }
  L.addFiles = addFiles;
  async function pickBooks() {
    const paths = await window.hub.pick({ multi: true, title: 'Choose books', filters: [{ name: 'Books (PDF, EPUB)', extensions: ['pdf', 'epub'] }] });
    if (paths.length) addFiles(paths.map(p => ({ path: p, folder: '' })));
  }
  async function pickFolder() {
    const r = await window.hub.pickBookFolder();
    if (!r) return;
    if (!r.files.length) { u.toast('No PDF or EPUB books in that folder', 'bad'); return; }
    if (!(await u.confirm(`Add ${r.files.length} book${r.files.length === 1 ? '' : 's'} from "${r.root}"? Sub-folder names become categories.`, 'Add them'))) return;
    addFiles(r.files.map(f => ({ path: f.path, folder: f.folder || '', size: f.size })), { category: catFrom(r.root) });
  }

  // ---------------- one book: cover, card, details ----------------
  const CAT_HUE = c => { let x = 0; for (const ch of String(c || '')) x = (x * 31 + ch.charCodeAt(0)) % 360; return x; };
  function coverEl(b, big) {
    if (b.cover && b.cover.rel) return h('img', { class: `bk-cover ${big ? 'big' : ''}`, src: window.hub.fileUrl(b.cover.rel), alt: '', loading: 'lazy' });
    const hue = CAT_HUE(b.category);
    return h('div', { class: `bk-cover gen ${big ? 'big' : ''}`, style: { background: `linear-gradient(160deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 28%))` } },
      h('span', { class: 'bk-gen-title ux' }, b.title || 'Book'), b.author ? h('span', { class: 'bk-gen-author ux' }, b.author) : null);
  }
  function statusFor(b) {
    if (KH.app.isParent()) return null;
    return L.shelf(b.id, KH.store.user.childId);
  }
  function bookCard(b) {
    const sh = statusFor(b);
    const kids = KH.app.isParent() ? KH.store.children().map(c => ({ c, s: L.shelf(b.id, c.id) })).filter(x => x.s) : [];
    return h('button', { class: 'bk-card', type: 'button', onclick: () => details(b.id) },
      h('span', { class: 'bk-cover-wrap' }, coverEl(b), sh && sh.progress ? h('span', { class: 'bk-progress' }, h('span', { style: { width: `${Math.min(100, sh.progress)}%` } })) : null,
        b.format ? h('span', { class: 'bk-format' }, b.format.toUpperCase()) : null),
      h('span', { class: 'bk-title ux' }, b.title || 'Untitled'),
      h('span', { class: 'bk-meta ux' }, [b.author, b.category].filter(Boolean).join(' · ')),
      sh ? u.chip(sh.status === 'Reading' && sh.progress ? `reading · ${sh.progress}%` : sh.status.toLowerCase(), sh.status === 'Finished' ? 'good' : sh.status === 'Reading' ? 'accent' : '') : null,
      kids.length ? h('span', { class: 'bk-kids' }, kids.map(x => h('span', { class: 'dot', title: `${x.c.name}: ${x.s.status}`, style: { background: KH.kidColor(x.c), opacity: x.s.status === 'Finished' ? 1 : x.s.status === 'Reading' ? 0.75 : 0.35 } }))) : null);
  }

  function details(id) {
    const b = L.book(id);
    if (!b) return;
    const parent = KH.app.isParent(), me = KH.store.user;
    const mine = !parent && b.createdBy === me.id;
    const body = h('div', { class: 'bk-details' });
    let m;
    const redraw = () => { body.innerHTML = ''; body.appendChild(content()); KH.i18n.apply(body); };
    function content() {
      const bk = L.book(id) || b;
      const sh = parent ? null : L.shelf(bk.id, me.childId);
      const right = h('div', { style: { flex: 1, minWidth: 0 } },
        h('h3', { class: 'ux', style: { margin: '0 0 4px' } }, bk.title),
        h('div', { class: 'muted ux' }, [bk.author, bk.category, bk.language, bk.pages ? `${bk.pages} pages` : ''].filter(Boolean).join(' · ')),
        bk.notes ? h('p', { class: 'small ux' }, bk.notes) : null,
        h('div', { class: 'row', style: { margin: '14px 0' } },
          bk.file && bk.file.rel ? h('button', { class: 'btn primary', onclick: () => { if (m) m.close(); KH.app.go(`#/read/${bk.id}`); } }, u.icon('book'), bk.format === 'other' ? 'Open' : sh && sh.lastPage ? 'Continue reading' : 'Read') : h('span', { class: 'muted small' }, 'No file attached'),
          bk.file && bk.file.rel ? h('button', { class: 'btn', onclick: () => window.hub.open(bk.file.rel) }, u.icon('out'), 'Open in another app') : null,
          KH.shareToChat ? h('button', { class: 'btn', onclick: () => { if (m) m.close(); KH.shareToChat({ type: 'book', id: bk.id, title: bk.title, sub: [bk.author, bk.category].filter(Boolean).join(' · '), route: `#/read/${bk.id}` }); } }, u.icon('share'), 'Share') : null));
      if (!parent) {
        right.appendChild(h('div', null,
          h('div', { class: 'stat-label' }, 'My shelf'),
          h('div', { class: 'seg', style: { margin: '6px 0 10px' } }, STATUSES.map(st => h('button', { class: sh && sh.status === st ? 'on' : '', onclick: () => { L.setShelf(bk.id, me.childId, { status: st }); redraw(); } }, st))),
          h('div', { class: 'stat-label' }, 'My rating'),
          h('div', { class: 'stars' }, [1, 2, 3, 4, 5].map(n => h('button', { class: sh && Number(sh.rating) >= n ? 'on' : '', 'aria-label': `${n} stars`, onclick: () => { L.setShelf(bk.id, me.childId, { rating: n }); redraw(); } }, '★')))));
      } else {
        right.appendChild(h('div', null,
          h('div', { class: 'stat-label' }, 'Who can see it'),
          h('div', { class: 'checks', style: { margin: '6px 0 12px' } },
            h('label', null, h('input', { type: 'checkbox', checked: !bk.visibleTo || !bk.visibleTo.length, onchange: e => { KH.store.upsert('books', Object.assign({}, bk, { visibleTo: e.target.checked ? [] : KH.store.children().map(c => c.id) })); redraw(); } }), 'Everyone'),
            KH.store.children().map(c => h('label', null, h('input', { type: 'checkbox', checked: L.visibleTo(bk, c.id), onchange: e => {
              const cur = !bk.visibleTo || !bk.visibleTo.length ? KH.store.children().map(k => k.id) : bk.visibleTo.slice();
              const next = e.target.checked ? Array.from(new Set(cur.concat(c.id))) : cur.filter(x => x !== c.id);
              KH.store.upsert('books', Object.assign({}, bk, { visibleTo: next.length === KH.store.children().length ? [] : next })); redraw();
            } }), c.name))),
          h('div', { class: 'stat-label' }, 'Shelves'),
          h('div', { class: 'small', style: { marginTop: '4px' } }, KH.store.children().map(c => { const s = L.shelf(bk.id, c.id); return h('div', null, h('span', { class: 'dot', style: { background: KH.kidColor(c) } }), ` ${c.name}: `, s ? `${s.status}${s.progress ? ` (${s.progress}%)` : ''}${s.rating ? ' · ' + '★'.repeat(Number(s.rating)) : ''}` : 'not on the shelf'); }))));
      }
      return h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '20px', flexWrap: 'nowrap' } }, coverEl(bk, true), right);
    }
    redraw();
    const actions = [];
    if (parent || mine) {
      actions.push({ label: 'Remove', danger: true, left: true, onClick: async () => { if (!(await u.confirm('Remove this book from the library?', 'Remove'))) return false; KH.store.remove('books', id); KH.app.refresh(); return true; } });
      actions.push({ label: 'Edit details', onClick: () => { editBook(id); return true; } });
    }
    actions.push({ label: 'Close', primary: true });
    m = u.modal({ title: 'Book', body, actions, wide: true });
  }

  function editBook(id) {
    const b = L.book(id);
    const f = {};
    const field = (k, label, el) => { f[k] = el; return h('label', { class: 'f' }, h('span', null, label), el); };
    const cats = L.categories();
    const catSel = h('select', null, cats.map(c => h('option', { value: c, selected: c === b.category }, c)), h('option', { value: '__new' }, 'New category…'));
    const newCat = h('input', { type: 'text', placeholder: 'Name of the new category', style: { display: 'none', marginTop: '6px' } });
    catSel.addEventListener('change', () => { newCat.style.display = catSel.value === '__new' ? '' : 'none'; if (catSel.value === '__new') newCat.focus(); });
    const body = h('div', { class: 'form-grid' },
      field('title', 'Title', h('input', { type: 'text', value: b.title || '' })),
      field('author', 'Author', h('input', { type: 'text', value: b.author || '' })),
      h('label', { class: 'f' }, h('span', null, 'Category'), catSel, newCat),
      field('language', 'Language', h('select', null, ['', 'English', 'Arabic', 'French', 'Other'].map(v => h('option', { value: v, selected: v === (b.language || '') }, v)))),
      field('ages', 'Good for ages (e.g. 8-12)', h('input', { type: 'text', value: b.ages || '' })),
      h('label', { class: 'f full' }, h('span', null, 'Notes'), f.notes = h('textarea', null, b.notes || '')));
    u.modal({ title: 'Edit book', body, actions: [{ label: 'Cancel' }, { label: 'Save', primary: true, onClick: () => {
      let category = catSel.value;
      if (category === '__new') { category = newCat.value.trim() || 'Other'; const list = KH.store.settings().bookCategories || []; if (!list.includes(category)) KH.store.setSetting('bookCategories', list.concat(category)); }
      KH.store.upsert('books', Object.assign({}, L.book(id), { title: f.title.value.trim() || b.title, author: f.author.value.trim(), category, language: f.language.value, ages: f.ages.value.trim(), notes: f.notes.value.trim() }));
      KH.app.refresh();
    } }] });
  }

  // ---------------- the page ----------------
  const view = KH.libView = KH.libView || { q: '', cat: '', shelf: '' };
  KH.pages.reading = function () {
    const parent = KH.app.isParent();
    const kids = parent ? KH.store.children() : [KH.store.child(KH.store.user.childId)].filter(Boolean);
    const today = u.today();
    const week = d => A.daysBetween(d, today) <= 6 && A.daysBetween(d, today) >= 0;
    // reading this week
    const summary = h('div', { class: `grid ${kids.length >= 3 ? 'g3' : 'g2'}` }, kids.map(c => {
      const mins = (KH.store.data.readingLog || []).filter(r => r.childId === c.id && week(r.date)).reduce((s, r) => s + Number(r.minutes || 0), 0);
      const finished = A.finishedBooks(KH.store.data, c.id, '');
      const reading = (KH.store.data.shelf || []).filter(x => x.childId === c.id && x.status === 'Reading').map(x => (L.book(x.bookId) || {}).title).filter(Boolean);
      return h('div', { class: 'card tight' }, h('div', { class: 'kid-head' }, KH.avatar(c, 32), h('b', null, c.name)),
        h('div', null, h('span', { class: 'stat' }, u.counter(mins)), h('span', { class: 'muted' }, ' minutes this week')),
        h('div', { class: 'small muted ux' }, `${finished} book${finished === 1 ? '' : 's'} finished${reading.length ? ` · reading: ${reading.join(', ')}` : ''}`));
    }));
    // library
    let books = L.forViewer();
    const cats = Array.from(new Set(books.map(b => b.category || 'Other')));
    if (view.cat) books = books.filter(b => (b.category || 'Other') === view.cat);
    if (view.q) { const q = view.q.toLowerCase(); books = books.filter(b => `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(q)); }
    if (!parent && view.shelf) books = books.filter(b => { const s = L.shelf(b.id, KH.store.user.childId); return view.shelf === 'none' ? !s : s && s.status === view.shelf; });
    books.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    const search = h('input', { type: 'search', placeholder: 'Search title, author or category', value: view.q, style: { maxWidth: '320px' },
      oninput: u.debounce(e => { view.q = e.target.value; KH.app.refresh(); setTimeout(() => { const s = document.querySelector('.lib-search'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 0); }, 250) });
    search.classList.add('lib-search');
    const chip = (label, val, cur, set) => h('button', { class: `pill ${cur === val ? 'on' : ''}`, onclick: () => { set(val); KH.app.refresh(); } }, label);
    const drop = h('div', { class: 'lib-drop' }, u.icon('book'), h('span', null, 'Drop PDF or EPUB books (or a folder of them) here'));
    const lib = h('div', { class: 'card lib' },
      h('div', { class: 'row', style: { marginBottom: '12px' } },
        h('h2', { style: { margin: 0 } }, parent ? 'Family library' : 'Library'), h('span', { class: 'muted small' }, `${L.forViewer().length} book${L.forViewer().length === 1 ? '' : 's'}`),
        h('div', { class: 'spacer' }), search,
        h('button', { class: 'btn primary', onclick: pickBooks }, '+ Add books'),
        parent && !KH.phoneApp ? h('button', { class: 'btn', onclick: pickFolder }, 'Add a folder') : null),
      h('div', { class: 'pills' }, chip('All', '', view.cat, v => { view.cat = v; }), cats.sort().map(c => chip(c, c, view.cat, v => { view.cat = v; }))),
      !parent ? h('div', { class: 'pills', style: { marginTop: '6px' } }, chip('Whole library', '', view.shelf, v => { view.shelf = v; }),
        STATUSES.map(st => chip(st === 'To read' ? 'My to-read list' : st, st, view.shelf, v => { view.shelf = v; }))) : null,
      books.length ? h('div', { class: 'bk-grid' }, books.map(bookCard)) : h('div', { class: 'empty' }, L.forViewer().length ? 'No book matches.' : (parent ? 'No books yet. Add PDF or EPUB files, or a whole folder.' : 'No books for you yet. Ask Mum or Dad, or add your own.')),
      drop);
    // drag and drop files or folders
    lib.addEventListener('dragover', e => { e.preventDefault(); lib.classList.add('dragging'); });
    lib.addEventListener('dragleave', e => { if (!lib.contains(e.relatedTarget)) lib.classList.remove('dragging'); });
    lib.addEventListener('drop', e => {
      e.preventDefault(); lib.classList.remove('dragging');
      const files = Array.from(e.dataTransfer.files || []).map(f => ({ path: window.hub.pathForFile(f), folder: '' })).filter(f => f.path && /\.(pdf|epub)$/i.test(f.path));
      if (files.length) addFiles(files); else u.toast('Drop PDF or EPUB files. For a whole folder, use "Add a folder".', 'bad');
    });
    // books without a cover yet (added on another PC, or before version 3)
    setTimeout(() => { (KH.store.data.books || []).filter(b => !b.cover && b.file && b.file.rel && (b.format === 'pdf' || b.format === 'epub')).slice(0, 4).forEach(makeCover); }, 600);
    return h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, parent ? 'Daily reading helps comprehension. Aim for 20-30 minutes a day. Reading inside the app is logged for the children by itself.' : 'Open a book to read it here. Your reading time is logged by itself, and you can correct it in the reading log.'),
      summary, lib,
      u.section('Reading log', KH.crud.list('readingLog')));
  };

  // ---------------- the reader ----------------
  KH.pages.reader = function (id) {
    const b = L.book(id);
    const wrap = h('div', { class: 'reader' });
    if (!b || !b.file || !b.file.rel) { wrap.appendChild(h('div', { class: 'card empty' }, 'This book has no file.')); return wrap; }
    const parent = KH.app.isParent(), me = KH.store.user;
    const childId = parent ? null : me.childId;
    if (b.format === 'other') { window.hub.open(b.file.rel); wrap.appendChild(h('div', { class: 'card empty' }, 'Opened in another app.')); return wrap; }
    const sh = childId ? L.shelf(b.id, childId) : null;
    const state = { page: 1, total: 0, zoom: 1, active: 0, last: Date.now(), done: false };
    const pageLbl = h('span', { class: 'reader-page' }, '…');
    const stage = h('div', { class: 'reader-stage' });
    const finishBar = h('div', { class: 'reader-finish', style: { display: 'none' } }, h('b', null, 'You reached the end!'),
      childId ? h('button', { class: 'btn primary small', onclick: () => { L.setShelf(b.id, childId, { status: 'Finished', progress: 100 }); finishBar.style.display = 'none'; u.toast('Well done! Marked as finished.', 'good'); } }, 'Mark as finished') : null);
    const bar = h('div', { class: 'reader-bar' },
      h('button', { class: 'btn small', onclick: () => history.length > 1 ? history.back() : KH.app.go('#/reading') }, '← Library'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn small icon', 'aria-label': 'Previous', onclick: () => go(-1) }, '‹'), pageLbl, h('button', { class: 'btn small icon', 'aria-label': 'Next', onclick: () => go(1) }, '›'),
      b.format === 'pdf' ? h('button', { class: 'btn small icon', 'aria-label': 'Smaller', onclick: () => zoom(-0.15) }, '−') : null,
      b.format === 'pdf' ? h('button', { class: 'btn small icon', 'aria-label': 'Bigger', onclick: () => zoom(0.15) }, '+') : null);
    wrap.append(bar, finishBar, stage);

    // reading time: counts while the window is in front and someone moved, scrolled or typed in the last 2 minutes
    const touch = () => { state.last = Date.now(); };
    ['mousemove', 'wheel', 'keydown', 'scroll', 'click'].forEach(ev => wrap.addEventListener(ev, touch, { passive: true, capture: true }));
    const tick = setInterval(() => { if (document.hasFocus() && Date.now() - state.last < 120000) state.active += 15; }, 15000);
    let pdfDoc = null, epub = null, saveTimer = null;
    const progress = () => (state.total ? Math.round(state.page / state.total * 100) : 0);
    const remember = () => {
      if (!childId) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const cur = L.shelf(b.id, childId);
        const patch = { lastPage: b.format === 'epub' ? state.loc : state.page, progress: progress() };
        if (!cur || cur.status === 'To read') patch.status = 'Reading';
        L.setShelf(b.id, childId, patch);
      }, 1200);
      if (state.total && state.page >= state.total && !(L.shelf(b.id, childId) || {}).endDate) finishBar.style.display = '';
    };
    function leave() {
      clearInterval(tick);
      window.removeEventListener('hashchange', onHash);
      if (pdfDoc) { try { pdfDoc.destroy(); } catch (e) { /* ignore */ } }
      if (childId && state.active >= 60) {
        const mins = Math.round(state.active / 60);
        const today = u.today();
        const log = (KH.store.data.readingLog || []).find(r => r.childId === childId && r.date === today && r.bookId === b.id && r.auto);
        if (log) KH.store.upsert('readingLog', Object.assign({}, log, { minutes: Number(log.minutes || 0) + mins }));
        else KH.store.upsert('readingLog', { childId, date: today, minutes: mins, bookId: b.id, auto: true, createdBy: me.id, notes: '' });
        u.toast(`${mins} minute${mins === 1 ? '' : 's'} of reading logged`, 'good');
      }
    }
    const onHash = () => { if (!location.hash.startsWith(`#/read/${id}`)) leave(); };
    window.addEventListener('hashchange', onHash);

    // ---- PDF: pages drawn as you scroll ----
    async function startPdf() {
      try {
        pdfDoc = await openPdf(b.file.rel);
        state.total = pdfDoc.numPages;
        const first = await pdfDoc.getPage(1);
        const base = first.getViewport({ scale: 1 });
        const pagesEl = h('div', { class: 'reader-pages' });
        stage.appendChild(pagesEl);
        const slots = [];
        const layout = () => {
          const w = Math.min(stage.clientWidth - 40, 980) * state.zoom;
          const scale = w / base.width;
          slots.forEach(s => { s.style.width = `${w}px`; s.style.height = `${base.height * scale}px`; s.dataset.drawn = ''; s.innerHTML = ''; });
          return scale;
        };
        for (let i = 1; i <= state.total; i++) { const s = h('div', { class: 'reader-sheet', 'data-page': i }); slots.push(s); pagesEl.appendChild(s); }
        let scale = layout();
        const draw = async s => {
          if (s.dataset.drawn) return;
          s.dataset.drawn = '1';
          const page = await pdfDoc.getPage(Number(s.dataset.page));
          const vp = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
          const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height); c.style.width = '100%'; c.style.height = '100%';
          s.appendChild(c);
          await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
        };
        const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) draw(en.target); }), { root: stage, rootMargin: '800px 0px' });
        slots.forEach(s => io.observe(s));
        stage.addEventListener('scroll', () => {
          const mid = stage.scrollTop + stage.clientHeight / 3;
          let p = 1; for (const s of slots) { if (s.offsetTop <= mid) p = Number(s.dataset.page); else break; }
          if (p !== state.page) { state.page = p; pageLbl.textContent = `${p} / ${state.total}`; remember(); }
        }, { passive: true });
        state.goTo = p => { const s = slots[Math.max(0, Math.min(state.total - 1, p - 1))]; if (s) stage.scrollTop = s.offsetTop - 12; };
        state.relayout = () => { const keep = state.page; scale = layout(); slots.forEach(s => { io.unobserve(s); io.observe(s); }); setTimeout(() => state.goTo(keep), 30); };
        pageLbl.textContent = `1 / ${state.total}`;
        const start = sh && Number(sh.lastPage) > 1 ? Number(sh.lastPage) : 1;
        if (start > 1) setTimeout(() => state.goTo(start), 80);
        else remember();   // opening a book puts it on the child's shelf as "Reading"
      } catch (e) { stage.appendChild(h('div', { class: 'errbox' }, `Could not open this PDF: ${e.message}`)); }
    }
    // ---- EPUB: one chapter at a time ----
    async function startEpub() {
      try {
        epub = await openEpub(b.file.rel);
        state.total = epub.count;
        const frame = h('iframe', { class: 'reader-epub', sandbox: 'allow-same-origin', title: b.title });
        stage.appendChild(frame);
        state.goTo = async (p, ratio) => {
          state.page = Math.max(1, Math.min(state.total, p));
          frame.srcdoc = await epub.chapter(state.page - 1);
          frame.onload = () => {
            const d = frame.contentDocument;
            if (!d) return;
            if (ratio) d.documentElement.scrollTop = ratio * (d.documentElement.scrollHeight - frame.clientHeight);
            ['mousemove', 'wheel', 'keydown', 'scroll'].forEach(ev => d.addEventListener(ev, touch, { passive: true }));
            d.addEventListener('keydown', key);
            d.addEventListener('scroll', u.debounce(() => { const el = d.documentElement; state.loc = `${state.page}:${(el.scrollTop / Math.max(1, el.scrollHeight - frame.clientHeight)).toFixed(3)}`; remember(); }, 400), { passive: true });
          };
          pageLbl.textContent = `Part ${state.page} / ${state.total}`;
          state.loc = `${state.page}:0`; remember();
        };
        const lastLoc = sh && sh.lastPage ? String(sh.lastPage).split(':') : null;
        state.goTo(lastLoc ? Number(lastLoc[0]) || 1 : 1, lastLoc ? Number(lastLoc[1]) || 0 : 0);
      } catch (e) { stage.appendChild(h('div', { class: 'errbox' }, `Could not open this EPUB: ${e.message}`)); }
    }
    function go(d) { if (state.goTo) state.goTo(state.page + d); }
    function zoom(d) { state.zoom = Math.max(0.5, Math.min(2.5, state.zoom + d)); if (state.relayout) state.relayout(); }
    function key(e) { if (e.key === 'ArrowRight' || e.key === 'PageDown') { if (b.format === 'epub') go(1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (b.format === 'epub') go(-1); } }
    wrap.addEventListener('keydown', key);
    setTimeout(() => (b.format === 'epub' ? startEpub() : startPdf()), 30);
    return wrap;
  };

  // ---------------- version 2 books -> library + shelves (done once by a parent) ----------------
  KH.upgradeLibrary = function () {
    const S = KH.store;
    if (S.settings().libraryV3) return;
    const books = S.data.books || [];
    S.data.shelf = S.data.shelf || [];
    for (const b of books) {
      const patch = {};
      if (!b.format && b.file && b.file.name) patch.format = fmtOf(b.file.name);
      if (b.childId && !b.visibleTo) patch.visibleTo = [b.childId];
      if (b.childId && !S.data.shelf.some(x => x.bookId === b.id && x.childId === b.childId)) {
        S.data.shelf.push({ id: u.uid('shf'), bookId: b.id, childId: b.childId, status: b.status || 'To read', startDate: b.startDate || '', endDate: b.endDate || '', rating: b.rating || '', createdAt: u.now(), updatedAt: u.now() });
      }
      if (Object.keys(patch).length) Object.assign(b, patch, { updatedAt: u.now() });
    }
    S.setSetting('libraryV3', true);
  };
})();
