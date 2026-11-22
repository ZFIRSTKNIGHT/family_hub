// My diary: a child's private pages behind their own 6-digit PIN. The pages are encrypted
// with the child's PIN in the main process (diary.js); parents cannot read them.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const MOODS = [['great', '😄'], ['good', '🙂'], ['okay', '😐'], ['low', '🙁'], ['tired', '😴']];
  let idleTimer = null;

  // six boxes for a 6-digit PIN
  function pinInput(onDone) {
    const boxes = [];
    const wrap = h('div', { class: 'pin6', dir: 'ltr' });
    for (let i = 0; i < 6; i++) {
      const b = h('input', { type: 'password', inputmode: 'numeric', maxlength: '1', autocomplete: 'off', 'aria-label': `Digit ${i + 1}` });
      b.addEventListener('input', () => {
        b.value = b.value.replace(/\D/g, '').slice(-1);
        if (b.value && i < 5) boxes[i + 1].focus();
        const v = boxes.map(x => x.value).join('');
        if (v.length === 6) onDone(v, () => { boxes.forEach(x => { x.value = ''; }); boxes[0].focus(); });
      });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && i > 0) { boxes[i - 1].focus(); boxes[i - 1].value = ''; } });
      boxes.push(b); wrap.appendChild(b);
    }
    setTimeout(() => boxes[0].focus(), 60);
    return wrap;
  }

  function shell(...kids) { return h('div', { class: 'diary' }, ...kids); }

  async function lockNow() { try { await window.hub.diaryLock(); } catch (e) { /* already locked */ } }
  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => { if (location.hash === '#/mydiary') { await lockNow(); u.toast('Your diary locked itself'); KH.app.refresh(); } }, 3 * 60 * 1000);
  }
  window.addEventListener('hashchange', () => { if (location.hash !== '#/mydiary') { clearTimeout(idleTimer); if (KH.store.user && KH.store.user.role === 'child') lockNow(); } });
  if (window.hub && window.hub.onLock) window.hub.onLock(() => { if (location.hash === '#/mydiary') KH.app.refresh(); });

  function setupView(st) {
    let first = null;
    const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px' } });
    const step = h('div');
    const ask = (label, cb) => { step.innerHTML = ''; step.appendChild(h('div', null, h('p', { style: { fontWeight: 700 } }, label), pinInput(cb))); KH.i18n.apply(step); };
    const startOver = () => ask('Choose a 6-digit PIN', (v, clear) => { first = v; clear(); ask('Type the same PIN again', async (v2, clear2) => {
      if (v2 !== first) { msg.textContent = KH.i18n.t('The two PINs are different. Start again.'); clear2(); return startOver(); }
      try { await window.hub.diarySetup(v2); u.toast('Your diary is ready', 'good'); KH.app.refresh(); } catch (e) { msg.textContent = KH.i18n.t(e.message); }
    }); });
    startOver();
    return shell(h('div', { class: 'card diary-lock' },
      h('div', { class: 'diary-badge' }, u.icon('lock')),
      h('h2', null, st.resetAt ? 'Choose a new diary PIN' : 'Your own private diary'),
      h('p', { class: 'muted' }, st.resetAt
        ? 'A parent gave you a fresh diary. Pages written with your old PIN are still there, locked. If you remember the old PIN later, you can open them again.'
        : 'Only you can open it, with your own PIN. Not even Mum or Dad can read it. If you ever forget the PIN, a parent can give you a fresh diary, but the old pages stay locked until you remember the old PIN.'),
      step, msg));
  }

  function lockedView(st) {
    const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px' } }, st.waitSeconds ? KH.i18n.t(`Too many tries. Wait ${st.waitSeconds} seconds.`) : '');
    return shell(h('div', { class: 'card diary-lock' },
      h('div', { class: 'diary-badge' }, u.icon('lock')),
      h('h2', null, 'My diary is locked'),
      h('p', { class: 'muted' }, 'Type your 6-digit PIN.'),
      pinInput(async (v, clear) => { try { await window.hub.diaryUnlock(v); KH.app.refresh(); } catch (e) { msg.textContent = KH.i18n.t(e.message); clear(); } }),
      msg,
      h('p', { class: 'small muted', style: { marginBottom: 0 } }, 'Forgot it? Ask a parent to reset your diary PIN in Accounts. Your pages stay locked, not deleted.')));
  }

  function editor(entry, onDone) {
    const e = Object.assign({ date: u.today(), title: '', text: '', mood: '' }, entry || {});
    const title = h('input', { type: 'text', value: e.title, placeholder: 'A title for today (optional)' });
    const date = h('input', { type: 'date', value: e.date });
    const text = h('textarea', { rows: 12, placeholder: 'Write anything you like…', style: { fontSize: '16px', lineHeight: 1.6 } }, e.text);
    let mood = e.mood, photo = e.photo || null;
    const moods = h('div', { class: 'moods' }, MOODS.map(([k, icon]) => h('button', { type: 'button', class: mood === k ? 'on' : '', 'aria-label': k, title: k, onclick: ev => { mood = mood === k ? '' : k; moods.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.getAttribute('aria-label') === mood)); ev.preventDefault(); } }, icon)));
    const pic = h('div', { class: 'diary-pic' });
    const showPic = () => { pic.innerHTML = ''; if (photo) pic.append(h('img', { src: photo, alt: '' }), h('button', { class: 'btn small', type: 'button', onclick: () => { photo = null; showPic(); } }, 'Remove picture')); };
    showPic();
    const addPic = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' }, onchange: async ev => {
      const f = ev.target.files[0]; if (!f) return;
      const img = new Image(); const url = URL.createObjectURL(f);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      photo = c.toDataURL('image/jpeg', 0.8); showPic();
    } });
    const m = u.modal({ title: entry ? 'Edit page' : 'New page', wide: true, body: h('div', null,
      h('div', { class: 'form-grid' }, h('label', { class: 'f' }, h('span', null, 'Date'), date), h('label', { class: 'f' }, h('span', null, 'Title'), title)),
      h('label', { class: 'f full' }, h('span', null, 'How do you feel? (optional)'), moods),
      h('label', { class: 'f full' }, h('span', null, 'Your page'), text),
      pic, h('button', { class: 'btn small', type: 'button', onclick: () => addPic.click() }, u.icon('photo'), 'Add a picture'), addPic),
    actions: [
      entry ? { label: 'Delete page', danger: true, left: true, onClick: async () => { if (!(await u.confirm('Delete this page? It cannot be brought back.', 'Delete'))) return false; await window.hub.diaryDelete(entry.id); onDone(); return true; } } : null,
      { label: 'Cancel' },
      { label: 'Save', primary: true, onClick: async () => {
        try { await window.hub.diarySave({ id: e.id, createdAt: e.createdAt, date: date.value, title: title.value.trim(), text: text.value, mood, photo }); onDone(); u.toast('Saved in your diary', 'good'); return true; }
        catch (err) { u.toast(err.message, 'bad'); if (/locked/i.test(err.message)) KH.app.refresh(); return false; }
      } },
    ].filter(Boolean) });
    setTimeout(() => text.focus(), 80);
    return m;
  }

  function openView(st, pages) {
    armIdle();
    const list = h('div', { class: 'diary-pages' }, pages.length ? pages.map(p => h('button', { class: 'diary-page', type: 'button', onclick: () => editor(p, () => KH.app.refresh()) },
      h('div', { class: 'diary-date' }, h('b', null, u.parseDate(p.date).getDate()), h('span', null, u.parseDate(p.date).toLocaleDateString(u.locale(), { month: 'short' }))),
      h('div', { style: { minWidth: 0, flex: 1 } },
        h('div', { class: 'ux', style: { fontWeight: 800 } }, (p.mood ? (MOODS.find(x => x[0] === p.mood) || [, ''])[1] + ' ' : '') + (p.title || u.fmtDate(p.date))),
        h('div', { class: 'small muted ux diary-snip' }, String(p.text || '').slice(0, 180)),
        p.old ? u.chip('old PIN', '') : null),
      p.photo ? h('img', { class: 'diary-thumb', src: p.photo, alt: '' }) : null))
      : h('div', { class: 'empty' }, 'No pages yet. Press "New page" to write your first one.'));
    const lockedOld = (st.older || []).filter(v => !v.open);
    return shell(
      h('div', { class: 'row', style: { marginBottom: '14px' } },
        h('p', { class: 'muted', style: { margin: 0 } }, 'Only you can read this. It locks itself after 3 minutes, or when you leave this page.'),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn', onclick: async () => { await lockNow(); KH.app.refresh(); } }, u.icon('lock'), 'Lock now'),
        h('button', { class: 'btn primary', onclick: () => editor(null, () => KH.app.refresh()) }, '+ New page')),
      list,
      lockedOld.length ? h('div', { class: 'card', style: { marginTop: '16px' } },
        h('h3', { style: { marginTop: 0 } }, 'Older pages (locked)'),
        h('p', { class: 'small muted' }, 'These pages were written with your old PIN, before a parent gave you a fresh diary. Type the old PIN to read them.'),
        lockedOld.map(v => h('div', { class: 'row' }, h('span', { class: 'small' }, `Diary from ${u.fmtDate(String(v.created).slice(0, 10))}`),
          h('button', { class: 'btn small', onclick: () => {
            const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px' } });
            const m = u.modal({ title: 'Old PIN', body: h('div', null, h('p', null, 'Type the PIN you used for that diary.'), pinInput(async (val, clear) => { try { await window.hub.diaryUnlockOld(v.id, val); m.close(); KH.app.refresh(); } catch (e) { msg.textContent = KH.i18n.t(e.message); clear(); } }), msg), actions: [{ label: 'Cancel' }] });
          } }, 'Open with old PIN')))) : null);
  }

  KH.pages.mydiary = function () {
    const wrap = h('div', null, h('div', { class: 'card empty' }, 'Opening…'));
    (async () => {
      try {
        const st = await window.hub.diaryStatus();
        let view;
        if (!st.hasPin) view = setupView(st);
        else if (!st.unlocked) view = lockedView(st);
        else view = openView(st, await window.hub.diaryList());
        wrap.innerHTML = ''; wrap.appendChild(view); KH.i18n.apply(wrap);
      } catch (e) { wrap.innerHTML = ''; wrap.appendChild(h('div', { class: 'errbox' }, e.message)); }
    })();
    return wrap;
  };
})();
