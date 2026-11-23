// The family cloud: setting it up on the main PC, joining from another PC or a phone, adding
// devices with a code or QR, the list of devices, sign-in approvals, security alerts, and the
// e-mailed code that a new sign-in on a device needs (the organiser approves).
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const hub = window.hub;
  const t = s => (KH.i18n ? KH.i18n.t(s) : s);
  const C = () => hub.cloud;

  const fmtBytes = n => (n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);
  const ago = ms => (ms ? u.ago(new Date(ms).toISOString()) : '');
  const ROLE = { owner: 'Organiser', parent: 'Parent', member: 'Family' };
  const PLATFORM = { windows: 'Windows PC', phone: 'Phone or tablet', web: 'Browser', mac: 'Mac', linux: 'Linux' };
  const isOrganiser = () => {
    const s = KH.store.settings ? KH.store.settings() : {};
    const owner = (s.cloud || {}).ownerUserId;
    return !!KH.store.user && KH.store.user.role === 'parent' && (!owner || owner === KH.store.user.id);
  };

  let last = null;
  const listeners = new Set();
  if (C() && C().onStatus) C().onStatus(st => { last = st; listeners.forEach(fn => { try { fn(st); } catch (e) { /* ignore */ } }); });

  function statusLine(st) {
    if (!st || !st.connected) return { cls: 'warnbox', text: st && st.revoked ? 'This device was signed out of the family cloud by the organiser.' : 'Not connected to the family cloud.' };
    if (st.deviceStatus === 'pending') return { cls: 'warnbox', text: 'Waiting for the organiser to approve this device.' };
    if (st.progress) {
      const p = st.progress;
      return { cls: 'note', text: `${p.dir === 'up' ? 'Sending' : 'Receiving'} the family data: ${fmtBytes(p.bytes)} of ${fmtBytes(p.total)}${p.files ? ` (${p.done || 0} of ${p.files} files)` : ''}...` };
    }
    if (st.error && st.error.code === 'offline') return { cls: 'warnbox', text: `No internet connection. Changes are kept here and sent when it is back.${st.lastSync ? ` Last in sync ${ago(st.lastSync)}.` : ''}` };
    if (st.error) return { cls: 'warnbox', text: st.error.message };
    if (st.busy) return { cls: 'note', text: 'Syncing...' };
    return { cls: 'okbox', text: st.lastSync ? `Everything is in sync (${ago(st.lastSync)}).` : 'Connected.' };
  }

  // ---------------------------------------------------------------- approval before a sign-in
  // The first time a child or the other parent signs in on a device, the organiser approves it:
  // a code goes to the organiser's e-mail (or they approve it in Family cloud > Waiting for approval).
  async function gate(user) {
    if (!C() || !user) return true;
    const owner = ((KH.store.settings ? KH.store.settings() : {}).cloud || {}).ownerUserId;
    if (!owner || user.id === owner) return true;
    const key = `kh.approved.${user.id}`;
    try { if (localStorage.getItem(key)) return true; } catch (e) { /* ignore */ }
    const subject = `user:${user.id}`;
    let a;
    try { a = await C().approved(subject); } catch (e) { a = { approved: false, error: e.message }; }
    if (a.notConnected || a.approved) { if (a.approved && !a.notConnected) try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ } return true; }
    if (a.offline) { u.toast('This is a first sign-in on this device, so it needs the internet once (for the approval code).', 'bad'); return false; }
    const ownerUser = (KH.store.data.users || []).find(x => x.id === owner) || {};
    const ownerName = ownerUser.displayName || 'the organiser';
    let req = null;
    const sendCode = async () => {
      req = await C().codeRequest({ purpose: 'sign-in', subject, label: user.displayName || user.username });
      return req;
    };
    try { await sendCode(); } catch (e) { u.toast(e.message, 'bad'); return false; }
    if (req.approved) { try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ } return true; }
    return new Promise(resolve => {
      const codeIn = h('input', { type: 'text', inputmode: 'numeric', maxlength: '7', placeholder: '123 456', style: { fontSize: '22px', letterSpacing: '.2em', textAlign: 'center' } });
      const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px' } });
      const sentTo = () => (req && req.sent ? `A 6-digit code was sent to ${ownerName}'s e-mail (${req.to}). Ask ${ownerName} for it.` : `${ownerName} can approve this in Family Hub > Family cloud > Waiting for approval (the code e-mail is not set up yet).`);
      const info = h('p', { class: 'muted', style: { marginTop: 0 } });
      const paint = () => { info.textContent = t(`This is the first time ${user.displayName || user.username} signs in on this device.`) + ' ' + t(sentTo()); };
      paint();
      u.modal({ title: 'Approval needed', body: h('div', null, info, codeIn, msg,
        h('p', { class: 'small', style: { marginBottom: 0 } }, h('a', { onclick: async () => { try { await sendCode(); paint(); u.toast('A new code was sent'); } catch (e) { msg.textContent = t(e.message); } } }, 'Send a new code'),
          ' · ', h('a', { onclick: async () => {
            try { const r = await C().approved(subject); if (r.approved) { try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ } document.querySelector('.modal-back') && document.querySelector('.modal-back').remove(); resolve(true); } else msg.textContent = t('Not approved yet.'); } catch (e) { msg.textContent = t(e.message); }
          } }, 'Already approved on another device? Check'))),
        actions: [{ label: 'Cancel', onClick: () => { resolve(false); return true; } }, { label: 'Continue', primary: true, onClick: async () => {
          try {
            await C().codeVerify({ id: req.id, code: codeIn.value.replace(/\D/g, '') });
            try { localStorage.setItem(key, '1'); } catch (e) { /* ignore */ }
            resolve(true);
            return true;
          } catch (e) { msg.textContent = t(e.message); return false; }
        } }] });
      setTimeout(() => codeIn.focus(), 60);
    });
  }

  // ---------------------------------------------------------------- joining (start-up screens)
  // ui: { screen, logo, langPick, err, back, done }
  function showJoin(ui) {
    const codeIn = h('input', { type: 'text', placeholder: 'ABCD-EFGH', maxlength: '9', style: { fontSize: '22px', letterSpacing: '.15em', textAlign: 'center', textTransform: 'uppercase' } });
    const nameIn = h('input', { type: 'text', placeholder: 'For example: Study room PC' });
    const msg = ui.err();
    async function go() {
      msg.textContent = '';
      const code = codeIn.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (code.length !== 8) { msg.textContent = t('The code has 8 letters and numbers, like ABCD-EFGH.'); return; }
      if (!nameIn.value.trim()) { msg.textContent = t('Give this PC a name, so you can recognise it in the list of devices.'); return; }
      try {
        const st = await C().join({ code, deviceName: nameIn.value.trim() });
        showWait(ui, st);
      } catch (e) { msg.textContent = t(e.message); }
    }
    ui.screen(h('div', { class: 'login wide' }, ui.langPick(), ui.logo(),
      h('h1', null, 'Join your family'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'On a family device, the organiser opens Family cloud > Add a device and gets a code. Type that code here. The family data then comes to this PC from the family cloud, still encrypted.'),
      h('label', { class: 'f' }, h('span', null, 'Code from the family device'), codeIn),
      h('label', { class: 'f' }, h('span', null, 'Name of this PC'), nameIn),
      h('div', { class: 'note small', style: { margin: '6px 0 10px' } }, 'If a different family was set up on this PC before, it is put aside in Documents (renamed, not deleted).'),
      msg,
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => ui.back() }, 'Back'), h('div', { class: 'spacer' }),
        h('button', { class: 'btn primary', onclick: go }, 'Join'))));
    setTimeout(() => codeIn.focus(), 60);
  }
  // After joining: approval (if the code came from the other parent) and the first download.
  function showWait(ui, st) {
    const line = h('div', { class: 'note' });
    const codeIn = h('input', { type: 'text', inputmode: 'numeric', placeholder: '123 456', style: { fontSize: '22px', letterSpacing: '.2em', textAlign: 'center' } });
    const msg = ui.err();
    const approval = h('div', { style: { display: 'none' } },
      h('p', { class: 'muted' }, "The organiser must approve this PC: a code was sent to the organiser's e-mail. Type it here, or the organiser can approve it in Family cloud > Devices."),
      h('label', { class: 'f' }, h('span', null, 'Approval code'), codeIn), msg,
      h('button', { class: 'btn primary', onclick: async () => {
        try { await C().approve(codeIn.value.replace(/\D/g, '')); approval.style.display = 'none'; } catch (e) { msg.textContent = t(e.message); }
      } }, 'Approve'));
    let finished = false;
    const paint = s => {
      if (finished || !s) return;
      approval.style.display = s.deviceStatus === 'pending' ? '' : 'none';
      const l = statusLine(s);
      line.className = l.cls;
      line.textContent = t(s.deviceStatus === 'pending' ? 'Waiting for approval...' : l.text);
      if (s.connected && s.deviceStatus === 'active' && s.lastSync && !s.busy) { finished = true; listeners.delete(paint); clearInterval(timer); ui.done(); }
    };
    listeners.add(paint);
    const timer = setInterval(() => C().status().then(paint).catch(() => {}), 2500);
    ui.screen(h('div', { class: 'login wide' }, ui.logo(),
      h('h1', null, 'Bringing the family data to this PC'),
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'This can take a few minutes the first time (pictures, documents and books come too). You can leave this window open.'),
      line, approval));
    paint(st);
  }

  // ---------------------------------------------------------------- the Family cloud page
  function setupCard(rerender) {
    const me = KH.store.user || {};
    const nameIn = h('input', { type: 'text', value: (KH.store.settings().familyName || 'M. Ebrahim Family Hub').replace(/^M\. /, '') });
    const mailIn = h('input', { type: 'email', value: me.email || '', placeholder: 'name@gmail.com' });
    const pcIn = h('input', { type: 'text', value: 'Main PC' });
    const msg = h('div', { class: 'small', style: { color: 'var(--bad)', minHeight: '18px' } });
    const plainBox = h('div');
    hub.plainCount().then(n => {
      plainBox.innerHTML = '';
      if (!n) return;
      const bar = h('div', { class: 'small muted' });
      plainBox.appendChild(KH.i18n.apply(h('div', { class: 'warnbox', style: { marginBottom: '10px' } },
        h('div', null, `${n} older pictures or documents are not encrypted yet. They must be encrypted before anything goes to the family cloud.`),
        h('button', { class: 'btn small', style: { marginTop: '8px' }, onclick: async e => {
          e.target.disabled = true;
          hub.onEncryptProgress(p => { bar.textContent = `${p.done} of ${p.total}`; });
          try { await hub.encryptOld(); u.toast('Older files encrypted', 'good'); rerender(); } catch (err) { u.toast(err.message, 'bad'); e.target.disabled = false; }
        } }, 'Encrypt them now'), bar)));
    }).catch(() => {});
    const go = async e => {
      msg.textContent = '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mailIn.value.trim())) { msg.textContent = t('Type the Gmail address that should receive approval codes and security alerts.'); return; }
      e.target.disabled = true;
      try {
        const st = await C().setup({ familyName: nameIn.value.trim(), ownerEmail: mailIn.value.trim(), deviceName: pcIn.value.trim() || 'Main PC' });
        KH.store.info = await hub.info();
        if (st.moved) u.toast('Your family folder moved from OneDrive to this PC (Documents). The OneDrive copy stays as a backup.', 'good');
        rerender();
      } catch (err) { msg.textContent = t(err.message); e.target.disabled = false; }
    };
    return u.section('Set up the family cloud',
      h('p', { class: 'muted', style: { marginTop: 0 } }, "Your family's own sync service, on Cloudflare (free). It replaces OneDrive: phones and other PCs join with a code, everything stays encrypted, and the cloud never sees the family key."),
      plainBox,
      h('div', { class: 'form-grid' },
        h('label', { class: 'f' }, h('span', null, 'Family name'), nameIn),
        h('label', { class: 'f' }, h('span', null, 'Name of this PC'), pcIn),
        h('label', { class: 'f full' }, h('span', null, 'Your Gmail (approval codes and security alerts)'), mailIn)),
      h('div', { class: 'note small', style: { margin: '8px 0' } }, 'If your family folder is in OneDrive, it moves to Documents on this PC. The OneDrive copy is left as a backup, and you can delete it later.'),
      msg,
      h('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } },
        h('button', { class: 'btn primary', onclick: go }, u.icon('sync'), 'Set up the family cloud'),
        h('button', { class: 'btn', onclick: async () => {
          if (!(await u.confirm('Join the family cloud that was set up on another PC? The family data on this PC is put aside (renamed in Documents, not deleted) and the family data comes from the family cloud instead.', 'Join with a code'))) return;
          KH.cloudUI.showJoin(KH.cloudKit());
        } }, 'This PC should join the family cloud of another PC')));
  }

  function addDeviceBlock() {
    const box = h('div');
    const make = async role => {
      box.innerHTML = '';
      box.appendChild(h('div', { class: 'small muted' }, t('Getting a code...')));
      try {
        const r = await C().joinCode({ role });
        const qr = h('div', { style: { width: '190px', height: '190px', background: '#fff', borderRadius: '10px', padding: '6px', flex: 'none' } });
        qr.innerHTML = r.qr;
        const left = h('b');
        const tick = () => { const s = Math.max(0, Math.round((r.expiresAt - Date.now()) / 1000)); left.textContent = s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : t('expired'); if (!s) clearInterval(timer); };
        const timer = setInterval(() => { if (!document.body.contains(left)) clearInterval(timer); else tick(); }, 1000);
        tick();
        box.innerHTML = '';
        box.appendChild(KH.i18n.apply(h('div', { class: 'row', style: { gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' } }, qr,
          h('div', { style: { flex: '1', minWidth: '220px' } },
            h('div', { class: 'code', 'data-noi18n': '1', style: { margin: '0 0 8px' } }, r.code),
            h('div', { class: 'small' }, 'Works once, for ', left, '.'),
            h('ol', { class: 'small', style: { paddingInlineStart: '18px' } },
              h('li', null, 'Phone: scan the square with the camera, or open ', h('b', { 'data-noi18n': '1' }, 'zfirstknight.github.io/family_hub'), ' and choose Join.'),
              h('li', null, 'PC: install Family Hub, choose "Join my family" and type the code.')),
            r.approval === 'owner-code' ? h('div', { class: 'note small' }, 'The organiser approves this device with an e-mailed code.') : null))));
      } catch (e) { box.innerHTML = ''; box.appendChild(h('div', { class: 'warnbox' }, e.message)); }
    };
    return h('div', null,
      h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'Add a device'),
      h('div', { class: 'row', style: { gap: '8px', marginBottom: '10px' } },
        h('button', { class: 'btn', onclick: () => make('member') }, u.icon('plus'), "A child's device or a family PC"),
        h('button', { class: 'btn', onclick: () => make('parent') }, u.icon('plus'), "The other parent's phone or PC"),
        h('button', { class: 'btn', onclick: () => make('owner') }, u.icon('plus'), 'My own phone or PC')),
      h('div', { class: 'small muted', style: { margin: '-4px 0 10px' } }, 'Your own devices also get the security alerts and can manage devices.'),
      box);
  }

  function devicesBlock(st) {
    const box = h('div', { class: 'small muted' }, t('Loading devices...'));
    const load = async () => {
      try {
        const [d, p] = await Promise.all([C().devices(), C().pending().catch(() => ({ pending: [] }))]);
        box.innerHTML = '';
        const users = KH.store.data.users || [];
        const who = subject => { const id = String(subject || '').replace(/^user:/, ''); const x = users.find(v => v.id === id); return x ? (x.displayName || x.username) : subject; };
        if (p.pending && p.pending.length) {
          box.appendChild(h('div', { class: 'warnbox', style: { marginBottom: '10px' } },
            h('b', null, t('Waiting for approval')),
            p.pending.map(x => h('div', { class: 'row', style: { marginTop: '6px' } },
              h('div', { class: 'spacer' }, x.purpose === 'device' ? `${x.device} (${t(PLATFORM[x.platform] || x.platform)}) ${t('wants to join')}` : `${who(x.subject)} ${t('wants to sign in on')} ${x.device}`),
              h('button', { class: 'btn small primary', onclick: async () => { try { await C().grant(x.device_id, x.subject); u.toast('Approved', 'good'); load(); } catch (e) { u.toast(e.message, 'bad'); } } }, 'Approve')))));
        }
        box.appendChild(h('table', { class: 'list' },
          h('thead', null, h('tr', null, ['Device', 'Kind', 'Role', 'Last seen', ''].map(x => h('th', null, x)))),
          h('tbody', null, d.devices.map(x => h('tr', null,
            h('td', null, h('b', { 'data-noi18n': '1' }, x.name), x.me ? h('span', { class: 'chip', style: { marginInlineStart: '6px' } }, t('this device')) : null, x.status === 'pending' ? h('span', { class: 'chip bad', style: { marginInlineStart: '6px' } }, t('waiting')) : null),
            h('td', null, t(PLATFORM[x.platform] || x.platform)),
            h('td', null, t(ROLE[x.role] || x.role)),
            h('td', { class: 'small muted' }, `${ago(x.lastSeen)}${x.country ? ` · ${x.country}` : ''}`),
            h('td', { class: 'right' },
              x.status === 'pending' ? h('button', { class: 'btn small primary', onclick: async () => { try { await C().approveDevice(x.id); load(); } catch (e) { u.toast(e.message, 'bad'); } } }, 'Approve') : null,
              !x.me ? h('button', { class: 'btn small', onclick: async () => {
                if (!(await u.confirm(`Sign "${x.name}" out of the family cloud? It stops receiving the family data at once. To use it again it needs a new code.`, 'Sign out'))) return;
                try { await C().signout(x.id); u.toast('Signed out', 'good'); load(); } catch (e) { u.toast(e.message, 'bad'); }
              } }, 'Sign out') : null))))));
        KH.i18n.apply(box);
      } catch (e) { box.innerHTML = ''; box.appendChild(h('div', { class: 'warnbox' }, e.message)); }
    };
    load();
    return h('div', null, h('h3', { style: { margin: '14px 0 6px', fontSize: '14px' } }, 'Devices'), box);
  }

  function alertsBlock() {
    const box = h('div', { class: 'small muted' }, t('Loading...'));
    C().alerts().then(r => {
      box.innerHTML = '';
      const list = (r.alerts || []).slice(0, 15);
      if (!list.length) { box.textContent = t('No security alerts.'); return; }
      const text = a => (a.kind === 'setup' ? `The family cloud was set up on ${(a.detail || {}).device || 'this PC'}.` : a.text);
      box.appendChild(h('table', { class: 'list' }, h('tbody', null, list.map(a => h('tr', { style: { fontWeight: a.seen ? '' : '600' } },
        h('td', null, text(a)), h('td', { class: 'small muted right' }, ago(a.at)))))));
      const unseen = list.filter(a => !a.seen);
      if (unseen.length) box.appendChild(h('button', { class: 'btn small', style: { marginTop: '8px' }, onclick: async () => { await C().alertsSeen(list[0].id); u.toast('Marked as seen'); KH.app.refresh(); } }, t('Mark all as seen')));
    }).catch(e => { box.textContent = e.message; });
    return h('div', null, h('h3', { style: { margin: '14px 0 6px', fontSize: '14px' } }, 'Security alerts (only you see these)'), box);
  }

  KH.pages.cloud = function () {
    const root = h('div', { style: { maxWidth: '980px' } });
    const render = async () => {
      let st = null;
      try { st = await C().status(); } catch (e) { st = { connected: false }; }
      if (st.connected && !st.revoked) { try { await C().me(); st = await C().status(); } catch (e) { /* offline: show what we have */ } }
      last = st;
      root.innerHTML = '';
      if (!isOrganiser()) {
        root.appendChild(u.section('Family cloud', h('div', { class: statusLine(st).cls }, statusLine(st).text),
          h('p', { class: 'small muted' }, 'The family organiser manages devices and approvals.')));
        return KH.i18n.apply(root);
      }
      if (!st.connected) {
        root.appendChild(KH.phoneApp ? u.section('Family cloud', h('div', { class: 'warnbox' }, 'This phone is not connected to the family cloud.')) : setupCard(render));
        return KH.i18n.apply(root);
      }
      if (st.role === 'member') {
        const l = statusLine(st);
        root.appendChild(u.section('Family cloud', h('div', { class: l.cls }, l.text),
          h('p', { class: 'small muted' }, h('span', null, 'This device'), ': ', h('b', { 'data-noi18n': '1' }, st.deviceName), '. ',
            h('span', null, 'It is a family device, so devices and approvals are managed from your own phone or PC.'))));
        return KH.i18n.apply(root);
      }
      const line = h('div', { class: statusLine(st).cls });
      line.textContent = t(statusLine(st).text);
      const paint = s => { if (!document.body.contains(line)) { listeners.delete(paint); return; } const l = statusLine(s); line.className = l.cls; line.textContent = t(l.text); };
      listeners.add(paint);
      const usage = h('span', { class: 'small muted' });
      C().usage().then(x => { usage.textContent = `${t('Stored')}: ${fmtBytes(x.bytes)} · ${x.files} ${t('files')}`; }).catch(() => {});
      root.appendChild(u.section('Family cloud',
        line,
        h('div', { class: 'row', style: { margin: '10px 0' } },
          h('div', { class: 'small' }, h('b', { 'data-noi18n': '1' }, st.family || ''), ' · ', t('This device'), ': ', h('span', { 'data-noi18n': '1' }, st.deviceName), ' (', t(ROLE[st.role] || st.role), ')'),
          h('div', { class: 'spacer' }), usage,
          h('button', { class: 'btn small', onclick: async () => { try { await C().syncNow(); } catch (e) { u.toast(e.message, 'bad'); } } }, u.icon('sync'), 'Sync now')),
        h('div', { class: st.email ? 'okbox small' : 'warnbox small', style: { marginBottom: '12px' } },
          st.email ? `Approval codes and security alerts go to ${st.owner}.` : 'E-mail is not set up yet, so codes cannot be sent. Approve devices and sign-ins on this page instead.'),
        addDeviceBlock(),
        devicesBlock(st),
        alertsBlock()));
      if (!KH.phoneApp) {
        root.appendChild(u.section('Leave the family cloud',
          h('p', { class: 'small muted', style: { marginTop: 0 } }, "This PC stops syncing and is signed out. Its family folder stays as it is."),
          h('button', { class: 'btn', onclick: async () => {
            if (!(await u.confirm('Stop using the family cloud on this PC?', 'Disconnect'))) return;
            try { await C().disconnect(); u.toast('Disconnected'); render(); } catch (e) { u.toast(e.message, 'bad'); }
          } }, 'Disconnect this PC')));
      }
      KH.i18n.apply(root);
    };
    render();
    return root;
  };

  KH.cloudUI = { gate, showJoin, showWait, statusLine, fmtBytes, isOrganiser, last: () => last };
})();
