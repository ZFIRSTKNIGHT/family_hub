// Credentials (parents, behind the PIN): the SABIS parent login used by "Update from
// SABIS", each child's own SABIS login and any other portal. Passwords are encrypted
// with the family key and only opened when you press the eye or Copy.
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const hub = window.hub;
  const SABIS_URL = 'https://digitalplatform.sabis.net';
  const field = (label, el, hint) => h('label', { class: 'f' }, h('span', null, label), el, hint ? h('div', { class: 'small muted', style: { marginTop: '3px' } }, hint) : null);

  function edit(rec, preset) {
    const isNew = !rec;
    const r = Object.assign({ kind: 'other', label: '', url: '', username: '', notes: '' }, preset || {}, rec || {});
    const kids = KH.store.children();
    const label = h('input', { type: 'text', value: r.label });
    const url = h('input', { type: 'text', value: r.url || (/^sabis/.test(r.kind) ? SABIS_URL : ''), placeholder: 'https://' });
    const user = h('input', { type: 'text', value: r.username, autocomplete: 'off' });
    const pass = h('input', { type: 'password', autocomplete: 'new-password', placeholder: isNew ? '' : 'Leave empty to keep the saved password' });
    const show = h('button', { class: 'btn icon small', type: 'button', title: 'Show', onclick: () => { pass.type = pass.type === 'password' ? 'text' : 'password'; } }, u.icon('eye'));
    const notes = h('textarea', { style: { minHeight: '60px' } }, r.notes || '');
    const childSel = h('select', null, kids.map(c => h('option', { value: c.id, selected: c.id === r.childId }, c.name)));
    const body = h('div', null,
      r.kind === 'sabis-child' ? field('Child', childSel) : null,
      r.kind === 'other' ? field('Name', label, 'For example: school bus app, Classera, Noor, bank') : null,
      field('Address (web page)', url),
      field('Username', user),
      field('Password', h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, pass, show), r.kind === 'sabis-parent' ? 'Used by "Update from SABIS". Stored encrypted; only this app can open it.' : 'Stored encrypted; only this app can open it.'),
      field('Notes', notes));
    u.modal({ title: isNew ? 'Add a login' : 'Edit login', body,
      actions: [
        !isNew ? { label: 'Delete', danger: true, left: true, onClick: async () => {
          if (!(await u.confirm(`Delete the saved login "${titleOf(r)}"?`, 'Delete'))) return false;
          KH.store.remove('credentials', r.id); KH.app.refresh(); return true;
        } } : null,
        { label: 'Cancel' },
        { label: 'Save', primary: true, onClick: async () => {
          if (!user.value.trim()) { u.toast('Enter the username', 'bad'); return false; }
          if (isNew && !pass.value) { u.toast('Enter the password', 'bad'); return false; }
          const out = Object.assign({}, r, { url: url.value.trim(), username: user.value.trim(), notes: notes.value });
          if (r.kind === 'other') out.label = label.value.trim() || url.value.trim() || 'Login';
          if (r.kind === 'sabis-child') { out.childId = childSel.value; out.label = `SABIS – ${KH.store.childName(childSel.value)}`; }
          if (r.kind === 'sabis-parent') { out.label = 'SABIS – parent'; out.id = out.id || 'cred-sabis-parent'; }
          if (pass.value) out.secret = await hub.seal(pass.value);
          pass.value = '';
          KH.store.upsert('credentials', out);
          u.toast('Login saved', 'good');
          KH.app.refresh();
          return true;
        } },
      ].filter(Boolean) });
  }

  const titleOf = c => (c.kind === 'sabis-parent' ? 'SABIS – parent' : c.kind === 'sabis-child' ? `SABIS – ${KH.store.childName(c.childId) || 'child'}` : c.label || c.url || 'Login');

  function row(c) {
    let shown = false;
    const secret = h('span', { class: 'secret masked' }, '••••••••');
    const eye = h('button', { class: 'btn icon small', title: 'Show password', 'aria-label': 'Show password', onclick: async () => {
      if (!c.secret) return;
      shown = !shown;
      try { secret.textContent = shown ? await hub.unseal(c.secret) : '••••••••'; secret.classList.toggle('masked', !shown); } catch (e) { u.toast(e.message, 'bad'); }
      eye.innerHTML = ''; eye.appendChild(u.icon(shown ? 'eyeoff' : 'eye'));
      if (shown) setTimeout(() => { if (shown) eye.click(); }, 20000);
    } }, u.icon('eye'));
    const copyPw = async () => { try { await hub.copy(await hub.unseal(c.secret)); u.toast('Password copied - it clears from the clipboard in 30 seconds'); } catch (e) { u.toast(e.message, 'bad'); } };
    const kid = c.kind === 'sabis-child' ? KH.store.child(c.childId) : null;
    return h('div', { class: 'credential' },
      h('span', { class: 'avatar', style: { width: '40px', height: '40px', background: kid ? KH.kidGradient(kid) : c.kind === 'sabis-parent' ? 'linear-gradient(135deg,#5B6CFF,#9B4DFF)' : 'var(--chip)', color: kid || c.kind === 'sabis-parent' ? '#fff' : 'var(--muted)' } }, u.icon(c.kind === 'other' ? 'key' : 'school')),
      h('div', { style: { minWidth: '180px', flex: '1 1 200px' } }, h('div', { style: { fontWeight: 700 } }, titleOf(c)), h('div', { class: 'small muted', 'data-noi18n': '1', style: { wordBreak: 'break-all' } }, c.url || '')),
      h('div', { style: { minWidth: '160px', flex: '1 1 160px' } }, h('div', { class: 'small muted' }, 'Username'), h('div', { class: 'secret', 'data-noi18n': '1' }, c.username || '-')),
      h('div', { style: { minWidth: '150px', flex: '1 1 150px' } }, h('div', { class: 'small muted' }, 'Password'), h('div', { class: 'row', style: { gap: '4px', flexWrap: 'nowrap' } }, secret, c.secret ? eye : null)),
      h('div', { class: 'row', style: { gap: '6px' } },
        h('button', { class: 'btn small', onclick: async () => { await hub.copy(c.username || ''); u.toast('Username copied'); } }, u.icon('copy'), 'Username'),
        c.secret ? h('button', { class: 'btn small', onclick: copyPw }, u.icon('copy'), 'Password') : null,
        c.url || /^sabis/.test(c.kind) ? h('button', { class: 'btn small primary', onclick: () => hub.launchLogin(c.id).catch(e => u.toast(e.message, 'bad')) }, u.icon('out'), /^sabis/.test(c.kind) ? (kid ? `Open SABIS as ${kid.name}` : 'Open SABIS') : 'Open') : null,
        h('button', { class: 'btn small', onclick: () => edit(c) }, 'Edit')));
  }

  KH.pages.credentials = function () {
    const creds = KH.store.data.credentials || [];
    const parent = creds.find(c => c.kind === 'sabis-parent');
    const kids = KH.store.children();
    const childCreds = creds.filter(c => c.kind === 'sabis-child');
    const others = creds.filter(c => c.kind === 'other' || !c.kind).sort((a, b) => String(a.label).localeCompare(String(b.label)));
    const kidsWithout = kids.filter(k => !childCreds.some(c => c.childId === k.id));
    return h('div', { style: { maxWidth: '1180px' } },
      h('div', { class: 'note', style: { marginBottom: '18px' } }, 'Passwords here are encrypted with your family key and stay encrypted in OneDrive or Google Drive. They are only opened on this PC when you press the eye, Copy or Open. Copied passwords are cleared from the clipboard after 30 seconds. This page locks again after 5 minutes.'),
      u.section('SABIS – parent login',
        h('p', { class: 'small muted', style: { marginTop: 0 } }, '"Update from SABIS" signs in with this login and reads all three children from it.'),
        parent ? row(parent) : h('div', { class: 'row' }, h('span', { class: 'muted' }, 'Not saved yet.'), h('div', { class: 'spacer' }),
          h('button', { class: 'btn primary', onclick: () => edit(null, { kind: 'sabis-parent', url: SABIS_URL }) }, '+ Add SABIS parent login'))),
      u.section("Children's SABIS logins",
        h('p', { class: 'small muted', style: { marginTop: 0 } }, "Each child's own SABIS student login, if they have one. \"Open SABIS as …\" opens it in its own window without signing you out."),
        childCreds.map(row),
        kidsWithout.length ? h('div', { class: 'row', style: { marginTop: childCreds.length ? '6px' : 0 } }, kidsWithout.map(k =>
          h('button', { class: 'btn', onclick: () => edit(null, { kind: 'sabis-child', childId: k.id, url: SABIS_URL }) }, `+ ${k.name}'s SABIS login`))) : null),
      u.section('Other portals and logins',
        others.length ? others.map(row) : h('div', { class: 'muted small', style: { marginBottom: '8px' } }, 'Nothing saved yet.'),
        h('button', { class: 'btn', style: { marginTop: '6px' }, onclick: () => edit(null, { kind: 'other' }) }, '+ Add a login')),
      h('div', { class: 'row' }, h('div', { class: 'spacer' }), h('button', { class: 'btn', onclick: () => KH.lock.lockNow() }, u.icon('lock'), 'Lock now')));
  };
})();
