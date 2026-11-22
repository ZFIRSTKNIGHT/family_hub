// Photos: albums by child and event, shown as thumbnails.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  let album = '';

  KH.pages.photos = function () {
    const all = (KH.store.data.photos || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const albums = Array.from(new Set(all.map(p => p.album).filter(Boolean))).sort();
    const childF = KH.app.filterChild;
    const list = all.filter(p => (!album || p.album === album) && (!childF || !p.childId || p.childId === childF));
    const grid = h('div', { class: 'photos' }, list.map(p => {
      const img = h('img', { alt: p.title || '' });
      if (p.file && p.file.rel) window.hub.url(p.file.rel).then(src => { img.src = src; });
      return h('div', { class: 'photo', onclick: () => KH.crud.edit('photos', p) }, img,
        h('div', { class: 'cap' }, h('div', null, p.title || ''), h('div', { class: 'muted' }, [u.fmtDate(p.date), KH.store.childName(p.childId), p.album].filter(Boolean).join(' · '))));
    }));
    const addMany = async () => {
      const paths = await window.hub.pick({ multi: true, title: 'Choose photos', filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'] }] });
      if (!paths.length) return;
      const r = await u.prompt(`Add ${paths.length} photo${paths.length === 1 ? '' : 's'}`, [{ key: 'album', label: 'Album (optional)', value: album }, { key: 'date', label: 'Date', type: 'date', value: u.today() }]);
      if (!r) return;
      for (const p of paths) {
        const file = await window.hub.store(p, 'photos');
        KH.store.upsert('photos', { file, title: file.name.replace(/\.[^.]+$/, ''), album: r.album, date: r.date, childId: childF || '' });
      }
      u.toast('Photos added'); KH.app.refresh();
    };
    return h('div', null,
      h('div', { class: 'row', style: { marginBottom: '12px' } },
        h('select', { style: { width: '170px' }, onchange: e => { KH.app.filterChild = e.target.value; KH.app.refresh(); } }, h('option', { value: '' }, 'All children'), KH.store.children().map(c => h('option', { value: c.id, selected: c.id === childF }, c.name))),
        h('select', { style: { width: '170px' }, onchange: e => { album = e.target.value; KH.app.refresh(); } }, h('option', { value: '' }, 'All albums'), albums.map(a => h('option', { value: a, selected: a === album }, a))),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn', onclick: () => KH.crud.edit('photos') }, '+ Photo'),
        h('button', { class: 'btn primary', onclick: addMany }, '+ Add several photos')),
      list.length ? grid : h('div', { class: 'card empty' }, 'No photos yet.'));
  };
})();
