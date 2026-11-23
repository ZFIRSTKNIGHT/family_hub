// Settings (parent), Accounts (parent and children logins, with a login-card
// generator for the children) and My password (everyone).
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const hub = window.hub;
  const t = s => (KH.i18n ? KH.i18n.t(s) : s);

  const field = (label, el, hint) => h('label', { class: 'f' }, h('span', null, label), el, hint ? h('div', { class: 'small muted', style: { marginTop: '3px' } }, hint) : null);

  function numberSetting(key, label, hint, step) {
    const s = KH.store.settings();
    return field(label, h('input', { type: 'number', step: step || '1', value: s[key], onchange: e => { const v = Number(e.target.value); if (!isNaN(v)) { KH.store.setSetting(key, v); u.toast('Saved'); } } }), hint);
  }
  function check(label, hint, checked, onchange) {
    return h('label', { class: 'row', style: { alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'nowrap', cursor: 'pointer' } },
      h('input', { type: 'checkbox', checked: !!checked, style: { marginTop: '2px' }, onchange: e => onchange(e.target.checked) }),
      h('div', { style: { flex: 1, minWidth: 0 } }, h('div', { style: { fontWeight: 600 } }, label), hint ? h('div', { class: 'small muted' }, hint) : null));
  }
  function checkSetting(key, label, hint, after) {
    return check(label, hint, KH.store.settings()[key], v => { KH.store.setSetting(key, v); if (after) after(v); u.toast('Saved'); });
  }
  function sabisSetting(key, value) {
    const sab = Object.assign({}, KH.store.settings().sabis || {}, { [key]: value });
    KH.store.setSetting('sabis', sab);
    u.toast('Saved');
  }

  // ---------------- data, cloud and security ----------------
  function dataCard() {
    const info = KH.store.info || {};
    const where = info.cloud === 'gdrive' ? 'Google Drive' : info.cloud === 'onedrive' ? 'OneDrive' : '';
    const backups = h('div', { class: 'small muted' }, 'Loading backups...');
    const loadBackups = () => hub.backups().then(list => {
      backups.innerHTML = '';
      if (!list.length) { backups.textContent = t('No backups yet (one is made automatically each day you use the app).'); return; }
      backups.appendChild(KH.i18n.apply(h('table', { class: 'list' }, h('tbody', null, list.slice(0, 12).map(b => h('tr', null,
        h('td', null, b.name.replace(/^data-/, 'Daily ').replace(/^manual-/, 'Manual ').replace(/^conflict-/, 'Cloud copy ').replace(/\.json(\.enc)?$|\.enc$/, '')),
        h('td', { class: 'small muted' }, `${Math.max(1, Math.round(b.size / 1024))} KB`),
        h('td', { class: 'right' }, h('button', { class: 'btn small', onclick: async () => {
          if (!(await u.confirm(`Go back to the backup "${b.name}"? The current data is backed up first, so this can be undone.`, 'Restore'))) return;
          try { KH.store.data = await hub.restore(b.name); u.toast('Backup restored'); KH.app.refresh(); } catch (e) { u.toast(e.message, 'bad'); }
        } }, 'Restore'))))))));
    }).catch(e => { backups.textContent = e.message; });
    loadBackups();
    const move = async () => {
      const roots = (await hub.roots()) || [];
      let pick = roots.find(r => r.kind !== 'local' && !String(info.dataDir || '').startsWith(r.path)) || roots[0];
      const list = h('div');
      const draw = () => { list.innerHTML = ''; for (const r of roots) list.appendChild(h('div', { class: `choice ${r === pick ? 'on' : ''}`, onclick: () => { pick = r; draw(); } }, u.icon(r.kind === 'local' ? 'home' : 'school'), h('div', null, h('b', null, r.label), h('div', { class: 'small muted', 'data-noi18n': '1', style: { wordBreak: 'break-all' } }, r.path)))); KH.i18n.apply(list); };
      draw();
      u.modal({ title: 'Move the family data', body: h('div', null, h('p', { class: 'muted', style: { marginTop: 0 } }, 'Everything (records, pictures, documents and backups) moves to the new place, still encrypted. Other PCs then need to open it from the new place.'), list),
        actions: [{ label: 'Cancel' },
          { label: 'Another folder...', onClick: async () => { await doMove(null); } },
          { label: 'Move here', primary: true, onClick: async () => { await doMove(pick && pick.path); } }] });
    };
    const doMove = async root => {
      try {
        const r = await hub.moveTo(root);
        if (!r) return;
        if (r.data) KH.store.data = r.data;
        KH.store.info = await hub.info();
        u.toast('The family data was moved', 'good');
        KH.app.refresh();
      } catch (e) { u.toast(e.message, 'bad'); }
    };
    const familyCloud = info.cloud === 'family-cloud';
    return u.section('Family data and cloud',
      familyCloud
        ? h('div', { class: 'okbox', style: { marginBottom: '12px' } }, 'Your data is kept in this folder and the family cloud keeps every PC and phone up to date. Everything is encrypted before it leaves this PC. ', h('a', { onclick: () => KH.app.go('#/cloud') }, 'Family cloud and devices'))
        : h('div', { class: where ? 'okbox' : 'warnbox', style: { marginBottom: '12px' } },
          where ? `Your data is in ${where} and is encrypted before it leaves this PC. Any PC signed in to the same ${where} can open it with a parent's password (or the recovery key).`
            : 'Your data is kept on this PC only (encrypted). Set up the family cloud (Family cloud in the menu) to use it on other PCs and phones.'),
      h('div', { class: 'small', style: { wordBreak: 'break-all', marginBottom: '12px' } }, h('b', null, 'Folder: '), h('span', { 'data-noi18n': '1' }, info.dataDir || '')),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => hub.showFolder() }, 'Open folder'),
        familyCloud ? null : h('button', { class: 'btn', onclick: move }, 'Move to another place...'),
        h('button', { class: 'btn', onclick: async () => { await hub.backupNow(); u.toast('Backup made'); loadBackups(); } }, 'Back up now')),
      h('h3', { style: { margin: '18px 0 6px', fontSize: '14px' } }, 'Backups (encrypted)'), backups,
      h('h3', { style: { margin: '18px 0 6px', fontSize: '14px' } }, 'Copy records without the cloud'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => { const p = await hub.exportJson(); if (p) u.toast('Exported'); } }, 'Export all records...'),
        h('button', { class: 'btn', onclick: async () => { const d = await hub.importJson(); if (d) { KH.store.data = d; u.toast('Imported and combined'); KH.app.refresh(); } } }, 'Import and combine...')),
      h('p', { class: 'small muted' }, 'The export file is not encrypted and leaves out saved passwords. Pictures and documents stay in the data folder.'));
  }

  // Pictures and documents from version 1 stay as they were until encrypted here, one at a time.
  let encryptRun = null;
  function olderFilesBlock() {
    const box = h('div', { style: { marginTop: '16px' } });
    const draw = (n, p) => {
      box.innerHTML = '';
      if (!n && !p) return;
      box.appendChild(KH.i18n.apply(h('div', null,
        h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'Older pictures and documents'),
        p ? h('div', { class: 'sync-box' }, h('div', { class: 'small' }, `Encrypting ${p.done} of ${p.total}…`), h('div', { class: 'progress' }, h('div', { style: { width: `${Math.round(p.done / Math.max(1, p.total) * 100)}%` } })))
          : h('div', null,
            h('p', { class: 'small muted', style: { marginTop: 0 } }, `${n} file${n === 1 ? '' : 's'} from version 1 (pictures, documents and old backups) ${n === 1 ? 'is' : 'are'} still stored unencrypted. They open normally. Encrypting them takes about ${Math.max(1, Math.ceil(n * 1.6 / 60))} minute${n * 1.6 > 60 ? 's' : ''}; the app does one file at a time so antivirus tools don't mistake it for ransomware.`),
            h('button', { class: 'btn', onclick: run }, u.icon('lock'), 'Encrypt them now')))));
    };
    const run = async () => {
      if (encryptRun) return;
      draw(0, { done: 0, total: 1 });
      encryptRun = hub.encryptOld();
      try {
        const r = await encryptRun;
        u.toast(r.failed.length ? `${r.done} encrypted, ${r.failed.length} could not be` : `${r.done} files encrypted`, r.failed.length ? 'bad' : 'good');
      } catch (e) { u.toast(e.message, 'bad'); }
      encryptRun = null;
      hub.plainCount().then(c => draw(c)).catch(() => {});
    };
    hub.plainCount().then(c => draw(c)).catch(() => {});
    box.progress = p => draw(0, p);
    return box;
  }
  let olderBox = null;
  hub.onEncryptProgress(p => { if (olderBox && olderBox.isConnected) olderBox.progress(p); });

  function securityCard() {
    const status = h('div', { class: 'small muted', style: { marginBottom: '10px' } }, '');
    hub.vaultStatus().then(st => { status.textContent = t(st.remembered ? 'This PC remembers the key to the family data (protected by Windows), so nobody needs to unlock it here again.' : 'This PC does not remember the key; a parent unlocks the data each time the app starts.'); }).catch(() => {});
    const pinSet = KH.lock.pinSet();
    return u.section('Security',
      h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'PIN for money and credentials'),
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Company reimbursement and Credentials need the PIN, and amounts on Home and the calendar stay hidden until it is entered. It locks again after 5 minutes or when the app is minimised. Payments and private courses stay open.'),
      h('div', { class: 'row', style: { marginBottom: '16px' } },
        h('button', { class: 'btn', onclick: async () => { if (pinSet && !(await KH.lock.require())) return; if (await KH.createPin()) KH.app.refresh(); } }, pinSet ? 'Change PIN' : 'Create a PIN'),
        KH.lock.unlocked() ? h('button', { class: 'btn', onclick: () => KH.lock.lockNow() }, u.icon('lock'), 'Lock now') : null),
      h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'Encryption'),
      status,
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => {
          if (!(await u.confirm('Make a new recovery key? The old one stops working.', 'Make a new key'))) return;
          try { const code = await hub.newRecovery(); KH.showRecoveryModal(code); } catch (e) { u.toast(e.message, 'bad'); }
        } }, 'New recovery key'),
        h('button', { class: 'btn danger', onclick: async () => {
          if (!(await u.confirm('Forget the key on this PC? The app closes the family data, and a parent has to sign in with their password (or the recovery key) to open it again here. Use this before giving the PC away.', 'Forget this PC'))) return;
          await hub.forgetPC(); location.reload();
        } }, 'Forget this PC')),
      resetByEmailBlock(),
      olderBox = olderFilesBlock());
  }

  // Password codes by email: the Gmail account that sends them, and each parent's address.
  function resetByEmailBlock() {
    const cred = (KH.store.data.credentials || []).find(c => c.kind === 'gmail-sender');
    const parents = (KH.store.data.users || []).filter(x => x.role === 'parent');
    const from = h('input', { type: 'email', placeholder: 'family.account@gmail.com', value: cred ? cred.username : '' });
    const pass = h('input', { type: 'password', placeholder: cred ? '•••••••••••••••• (saved; type to change)' : '16-letter app password from Google', autocomplete: 'new-password' });
    const mails = parents.map(p => ({ p, el: h('input', { type: 'email', placeholder: 'name@example.com', value: p.email || '' }) }));
    const msg = h('div', { class: 'small', style: { minHeight: '18px' } });
    const ready = !!cred && parents.some(p => p.email);
    return h('div', { style: { marginTop: '18px' } },
      h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'Password codes by email'),
      h('p', { class: 'small muted', style: { marginTop: 0 } }, '"Forgot password?" on the sign-in screen sends a 6-digit code by email. A parent\'s code goes to that parent; a child\'s code goes to the parents, so you approve every reset. It works on any PC that has opened the family data before; on a new PC the recovery key is still needed.'),
      ready ? h('div', { class: 'okbox small', style: { marginBottom: '10px' } }, `Set up: codes are sent from ${cred.username}.`) : h('div', { class: 'warnbox small', style: { marginBottom: '10px' } }, 'Not set up yet.'),
      h('div', { class: 'form-grid' },
        h('label', { class: 'f' }, h('span', null, 'Send codes from (Gmail address)'), from),
        h('label', { class: 'f' }, h('span', null, 'Gmail app password'), pass),
        mails.map(x => h('label', { class: 'f' }, h('span', null, `Email for ${x.p.displayName || x.p.username}`), x.el))),
      h('p', { class: 'small muted' }, 'The app password comes from your Google account: Security → 2-Step Verification → App passwords. It only lets the app send email, and it is stored encrypted like your other logins. Never share it in a chat.'),
      msg,
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: async () => {
          msg.textContent = ''; msg.style.color = 'var(--bad)';
          const addr = from.value.trim().toLowerCase();
          if (addr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) { msg.textContent = t('That Gmail address does not look right.'); return; }
          if (addr && !cred && !pass.value.trim()) { msg.textContent = t('Type the app password too.'); return; }
          for (const x of mails) { const v = x.el.value.trim(); if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { msg.textContent = t(`The email for ${x.p.displayName || x.p.username} does not look right.`); return; } }
          if (addr) {
            const rec = Object.assign({}, cred || { kind: 'gmail-sender', label: 'Gmail (password codes)', url: 'https://mail.google.com' }, { username: addr });
            if (pass.value.trim()) rec.secret = await hub.seal(pass.value.replace(/\s+/g, ''));
            KH.store.upsert('credentials', rec);
          }
          for (const x of mails) KH.store.upsert('users', Object.assign({}, (KH.store.data.users || []).find(v => v.id === x.p.id), { email: x.el.value.trim() }));
          await KH.store.flush();
          u.toast('Saved', 'good'); KH.app.refresh();
        } }, 'Save'),
        h('button', { class: 'btn', onclick: async () => {
          msg.textContent = ''; msg.style.color = '';
          try { const to = await hub.mailTest(); msg.style.color = 'var(--good)'; msg.textContent = t(`Test email sent to ${to.join(', ')}.`); } catch (e) { msg.style.color = 'var(--bad)'; msg.textContent = KH.i18n.t(e.message); }
        } }, 'Send a test email')));
  }

  KH.showRecoveryModal = function (code) {
    u.modal({ title: 'Your new recovery key', body: h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Keep it somewhere safe, away from the PC. It opens the family data if every parent password is forgotten. The old key no longer works.'),
      h('div', { class: 'code', 'data-noi18n': '1' }, code)),
    actions: [
      { label: 'Copy', onClick: () => { hub.copy(code); u.toast('Copied - it clears from the clipboard in 30 seconds'); return false; } },
      { label: 'Print', onClick: () => { hub.print(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>body{font-family:Segoe UI,Arial;padding:40px}.c{font:700 26px Consolas,monospace;letter-spacing:.08em;border:2px dashed #4F46E5;padding:18px;text-align:center;margin:20px 0}</style></head><body><h1>M. Ebrahim Family Hub - recovery key</h1><div class="c">${u.esc(code)}</div><p>Created ${new Date().toLocaleDateString('en-GB')}</p></body></html>`); return false; } },
      { label: 'Done', primary: true }] });
  };

  function sabisCard() {
    const sab = KH.store.settings().sabis || {};
    const time = h('input', { type: 'time', value: sab.time || '15:00', style: { width: '140px' }, onchange: e => sabisSetting('time', e.target.value || '15:00') });
    return u.section('School connections',
      h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'SABIS Digital Platform'),
      check('Update from SABIS every day by itself', 'Runs once a day after the time below, while the app is running (it keeps running in the tray). New things arrive as Windows notifications.', sab.auto !== false, v => sabisSetting('auto', v)),
      field('Daily update after', time),
      check('Download study files (exam preparation, PrepList and course practice)', 'Saved by child and subject. Downloading a file marks it as read on SABIS, the same as opening it there.', sab.downloadDocs !== false, v => sabisSetting('downloadDocs', v)),
      h('div', { class: 'row' }, KH.sabisButton(), h('button', { class: 'btn', onclick: () => KH.app.go('#/credentials') }, u.icon('key'), 'SABIS login')),
      h('p', { class: 'small muted' }, 'The update only reads SABIS. It never presses Save or sends anything there. Years before 2026-27 are not on SABIS, so keep using Add marks for those.'),
      calendarLinks(),
      h('h3', { style: { margin: '16px 0 6px', fontSize: '14px' } }, 'Another school platform'),
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'For a school without SABIS: read report cards from a photo or PDF with Add marks, add its calendar link above if it has one, and enter homework and dates by hand. More platforms can be connected where the school allows it.'));
  }
  // school calendar links (iCal / webcal): their events come into the calendar every day
  function calendarLinks() {
    const list = () => (KH.store.settings().schoolConnections || []).filter(c => c.type === 'ics');
    const box = h('div');
    const draw = () => {
      box.innerHTML = '';
      const nameIn = h('input', { type: 'text', placeholder: 'For example: School calendar' });
      const urlIn = h('input', { type: 'url', placeholder: 'https://… or webcal://…' });
      box.appendChild(KH.i18n.apply(h('div', null,
        h('h3', { style: { margin: '16px 0 6px', fontSize: '14px' } }, 'School calendar links'),
        list().length ? h('table', { class: 'list' }, h('tbody', null, list().map(c => h('tr', null,
          h('td', null, h('b', { 'data-noi18n': '1' }, c.name || 'School calendar'), h('div', { class: 'small muted', 'data-noi18n': '1', style: { wordBreak: 'break-all' } }, c.url)),
          h('td', { class: 'small muted' }, c.error ? h('span', { style: { color: 'var(--bad)' } }, c.error) : c.last ? `${c.count || 0} ${t('events')} · ${u.ago(c.last)}` : t('not read yet')),
          h('td', { class: 'right' },
            h('button', { class: 'btn small', onclick: async () => { try { const r = await hub.schoolCalendarSync(c.id); u.toast(`${r.count} ${t('events read')}`, 'good'); draw(); } catch (e) { u.toast(e.message, 'bad'); } } }, 'Read now'),
            h('button', { class: 'btn small', onclick: async () => {
              if (!(await u.confirm('Remove this school calendar? Events already brought in stay.', 'Remove'))) return;
              KH.store.setSetting('schoolConnections', (KH.store.settings().schoolConnections || []).filter(x => x.id !== c.id)); draw();
            } }, 'Remove')))))) : h('div', { class: 'small muted' }, 'If the school shares its calendar as a link (iCal or webcal), add it here and its events come into the calendar every day.'),
        h('div', { class: 'row', style: { marginTop: '8px', gap: '8px', flexWrap: 'wrap' } }, nameIn, urlIn,
          h('button', { class: 'btn', onclick: async () => {
            const url = urlIn.value.trim();
            if (!/^(https|webcal):\/\//i.test(url) && !/^http:\/\/127\.0\.0\.1[:/]/.test(url)) { u.toast('Use a calendar link that starts with https:// or webcal://', 'bad'); return; }
            const conn = { id: `sc-${Date.now().toString(36)}`, type: 'ics', name: nameIn.value.trim() || 'School calendar', url };
            KH.store.setSetting('schoolConnections', (KH.store.settings().schoolConnections || []).concat([conn]));
            await KH.store.flush();
            try { const r = await hub.schoolCalendarSync(conn.id); u.toast(`${r.count} ${t('events read')}`, 'good'); } catch (e) { u.toast(e.message, 'bad'); }
            draw();
          } }, u.icon('plus'), 'Add calendar')))));
    };
    draw();
    return box;
  }

  // the sound of notifications on this PC: Windows' own, one of the app's, or none; volume; quiet hours
  function soundBlock() {
    const box = h('div', { style: { margin: '4px 0 14px' } });
    if (!hub.soundGet) return box;
    const NAMES = [['chime', 'Chime'], ['bell', 'Bell'], ['twotone', 'Two tones'], ['harp', 'Harp'], ['pop', 'Soft pop'], ['windows', "Windows' own sound"], ['none', 'No sound']];
    hub.soundGet().then(cur => {
      const save = async b => { try { cur = await hub.soundSet(Object.assign({}, cur, b)); } catch (e) { u.toast(e.message, 'bad'); } };
      const play = () => { if (cur.sound === 'none' || cur.sound === 'windows') return; const a = new Audio(`../assets/sounds/${cur.sound}.wav`); a.volume = cur.volume; a.play().catch(() => {}); };
      const sel = h('select', { onchange: async e => { await save({ sound: e.target.value }); play(); } }, NAMES.map(([v, l]) => h('option', { value: v, selected: cur.sound === v }, l)));
      const vol = h('input', { type: 'range', min: '0', max: '100', value: String(Math.round(cur.volume * 100)), style: { width: '160px' }, onchange: async e => { await save({ volume: Number(e.target.value) / 100 }); play(); } });
      const from = h('input', { type: 'time', value: cur.from, onchange: e => save({ from: e.target.value }) });
      const to = h('input', { type: 'time', value: cur.to, onchange: e => save({ to: e.target.value }) });
      const quiet = h('input', { type: 'checkbox', checked: cur.quiet, onchange: e => save({ quiet: e.target.checked }) });
      box.appendChild(KH.i18n.apply(h('div', null,
        h('h3', { style: { margin: '0 0 6px', fontSize: '14px' } }, 'Notification sound on this PC'),
        h('div', { class: 'row', style: { gap: '10px', flexWrap: 'wrap' } }, sel, h('span', { class: 'small muted' }, 'Volume'), vol,
          h('button', { class: 'btn small', onclick: play }, 'Play')),
        h('label', { class: 'row small', style: { marginTop: '8px', gap: '8px', flexWrap: 'wrap' } }, quiet, h('span', null, 'Quiet hours: no sound from'), from, h('span', null, 'to'), to),
        h('div', { class: 'small muted', style: { marginTop: '4px' } }, 'During quiet hours notifications still appear, without sound. Phones use their own notification sound.'))));
    }).catch(() => {});
    return box;
  }

  // Settings > Features: switch parts of the app off for the whole family (the organiser)
  function featuresCard() {
    const F = KH.features;
    return u.section('Features',
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Switch off what the family does not use: it leaves the menus, the pages, Home and the reminders. Nothing is deleted, and switching it on again brings it all back. Encryption, backups and locking are always on.'),
      h('div', { class: 'grid g2', style: { gap: '0 18px' } }, F.list.map(f => h('label', { class: 'row', style: { padding: '6px 0', gap: '8px', alignItems: 'flex-start', flexWrap: 'nowrap' } },
        h('input', { type: 'checkbox', checked: F.on(f.key), onchange: e => {
          const cur = Object.assign({}, KH.store.settings().features || {});
          if (e.target.checked) delete cur[f.key]; else cur[f.key] = false;
          KH.store.setSetting('features', cur);
          KH.app.refresh();
        } }), h('span', null, f.label)))));
  }

  function windowsCard() {
    const info = KH.store.info || {};
    return u.section('Notifications and Windows',
      checkSetting('notifications', 'Show Windows notifications', 'Upcoming exams, homework, payments (without amounts), birthdays, meetings, findings in new marks, and what each SABIS update brings in.'),
      h('div', { class: 'row', style: { marginBottom: '14px' } },
        h('button', { class: 'btn primary', onclick: async () => {
          try { const ok = await hub.notifyTest(); u.toast(ok ? 'Sent. You should see it near the clock.' : 'Windows did not show it. Check Settings > System > Notifications, and that Focus / Do not disturb is off.', ok ? 'good' : 'bad'); } catch (e) { u.toast(e.message, 'bad'); }
        } }, u.icon('bell'), 'Send test notification'),
        h('button', { class: 'btn', onclick: async () => { const n = await hub.notifyCheck(); u.toast(n ? `${n} reminder${n === 1 ? '' : 's'} shown` : 'Nothing new to remind you about'); } }, 'Check reminders now')),
      soundBlock(),
      checkSetting('keepRunning', 'Keep running in the tray when the window is closed', 'Needed for reminders and the daily SABIS update. Right-click the tray icon to quit.'),
      check('Start with Windows (quietly, in the tray)', 'So reminders arrive even when you have not opened the app.', info.loginItem, async v => { await hub.loginItem(v); KH.store.info = await hub.info(); u.toast('Saved'); }),
      h('div', { class: 'note small' }, h('b', null, 'Tray icon hidden? '), 'Windows 11 hides new tray icons under the ^ arrow near the clock. To keep it visible: Settings > Personalisation > Taskbar > Other system tray icons, then turn on M. Ebrahim Family Hub. You can also drag the icon from the ^ area onto the taskbar.'));
  }

  function appearanceCard() {
    const me = KH.store.user;
    const theme = document.documentElement.dataset.theme || 'light';
    const lang = (KH.i18n && KH.i18n.lang) || 'en';
    return u.section('Look and language',
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Each login keeps its own choice. The buttons at the top of every page do the same.'),
      field('Style', h('div', { class: 'style-pick' }, [
        ['premium', 'Premium & elegant', 'Navy, gold and serif headings. The default.', ['#0F1B33', '#F3F4F7', '#C9A24E']],
        ['modern', 'Modern & colourful', 'Bright colours and playful motion.', ['#4F46E5', '#F3F5FB', '#7C3AED']],
        ['calm', 'Clean & calm', 'Soft greens and quiet surfaces.', ['#2F7D6D', '#F6F8F7', '#DCEFE9']],
      ].map(([v, l, d, sw]) => h('button', { class: `style-opt ${KH.app.styleOf() === v ? 'on' : ''}`, type: 'button', onclick: () => KH.app.setStyle(v) },
        h('span', { class: 'style-swatch' }, h('i', { style: { background: sw[0], width: '34%' } }), h('i', { style: { background: sw[1], width: '46%' } }), h('i', { style: { background: sw[2], width: '20%' } })),
        h('b', null, l), h('span', { class: 'small muted' }, d))))),
      field('Theme', h('div', { class: 'seg' }, [['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => h('button', { class: theme === v ? 'on' : '', onclick: () => KH.app.setTheme(v) }, l)))),
      field('Language', h('div', { class: 'seg' }, [['en', 'English'], ['ar', 'العربية']].map(([v, l]) => h('button', { class: lang === v ? 'on' : '', 'data-noi18n': '1', onclick: () => KH.app.setLang(v) }, l)))),
      h('div', { class: 'small muted' }, `Signed in as ${me.displayName || me.username}.`));
  }

  function readerCard() {
    const count = h('span', null, '...');
    hub.ocrCount().then(n => { count.textContent = n; }).catch(() => { count.textContent = '0'; });
    return u.section('Reading marks from pictures',
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'For years that are not on SABIS. Every time you check and save marks read from a picture, the reader learns the digits you confirmed, so it gets more accurate with your school\'s report style.'),
      h('div', { class: 'row' }, h('span', null, 'Learned digit samples: '), h('b', null, count), h('div', { class: 'spacer' }),
        h('button', { class: 'btn small danger', onclick: async () => { if (await u.confirm('Forget everything the reader has learned? It goes back to its built-in samples.', 'Forget')) { await hub.ocrReset(); count.textContent = '0'; } } }, 'Reset learning')));
  }

  // ---------- the phone app's Settings: this phone, the look, the money PIN, the shared settings ----------
  function phoneCard() {
    const P = window.FHPhone || {}, H = window.FHPhoneHub || {};
    const state = h('div', { class: 'small muted', style: { margin: '4px 0 10px' } }, '');
    const who = h('div');
    const push = h('div', { style: { margin: '8px 0' } });
    hub.cloud.status().then(st => {
      who.innerHTML = '';
      who.appendChild(KH.i18n.apply(h('div', null,
        field('Family', h('b', { 'data-noi18n': '1' }, st.family || '')),
        field('This phone', h('div', null, h('b', { 'data-noi18n': '1' }, st.deviceName || ''), st.role ? h('span', { class: 'small muted' }, ` · ${t(st.role === 'owner' ? 'Organiser' : st.role === 'parent' ? 'Parent' : 'Family')}`) : null)))));
    }).catch(() => {});
    if (H.pending) H.pending().then(p => { state.textContent = t(p ? 'Some changes are waiting for a connection. They are sent when the phone is online.' : 'Up to date with the family cloud.'); }).catch(() => {});
    const drawPush = on => {
      push.innerHTML = '';
      push.appendChild(KH.i18n.apply(on
        ? h('div', { class: 'okbox small' }, 'Notifications are on: messages and family news arrive even when the app is closed, with the phone\'s own sound.')
        : h('div', null, h('div', { class: 'small muted', style: { marginBottom: '6px' } }, /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'On an iPhone, notifications work once the app is on the Home Screen (Share > Add to Home Screen).' : 'Get messages and family news even when the app is closed.'),
          h('button', { class: 'btn primary', onclick: async () => {
            try { const ok = await hub.cloud.enablePush(); if (ok) { u.toast('Notifications are on', 'good'); drawPush(true); } else u.toast('Notifications were not allowed. You can allow them in the phone\'s settings for this app.', 'bad'); } catch (e) { u.toast(e.message, 'bad'); }
          } }, u.icon('bell'), 'Turn on notifications'))));
    };
    hub.cloud.pushReady().then(drawPush).catch(() => drawPush(false));
    return u.section('This phone',
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'This phone reads and saves the family data in the family cloud, encrypted. SABIS updates, reading marks from pictures and backups stay on the family PC.'),
      who, state, push,
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => { try { await H.syncNow(); u.toast('Up to date', 'good'); KH.app.refresh(); } catch (e) { u.toast(e.message, 'bad'); } } }, u.icon('sync'), 'Sync now')),
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn danger', onclick: async () => {
          if (!(await u.confirm('Forget the family data on this phone? A parent then unlocks it again with their password or the recovery key.', 'Forget this phone'))) return;
          await hub.forgetPC(); try { localStorage.removeItem('kh.remember'); } catch (e) { /* ignore */ } location.reload();
        } }, 'Forget this phone'),
        h('button', { class: 'btn', onclick: async () => {
          if (!(await u.confirm('Leave the family cloud on this phone? To use it again it needs a new code from a family device.', 'Leave'))) return;
          await hub.forgetPC(); try { localStorage.removeItem('kh.remember'); } catch (e) { /* ignore */ }
          if (P.leave) await P.leave(); else location.reload();
        } }, 'Leave the family cloud')));
  }
  function pinCard() {
    const pinSet = KH.lock.pinSet();
    return u.section('PIN for money and credentials',
      h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Company reimbursement and Credentials need the PIN, and amounts on Home and the calendar stay hidden until it is entered. It locks again when the app goes to the background.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: async () => { if (pinSet && !(await KH.lock.require())) return; if (await KH.createPin()) KH.app.refresh(); } }, pinSet ? 'Change PIN' : 'Create a PIN'),
        KH.lock.unlocked() ? h('button', { class: 'btn', onclick: () => KH.lock.lockNow() }, u.icon('lock'), 'Lock now') : null));
  }

  function generalCard(s, nameIn, curIn) {
    return u.section('General', field('Title shown in the app', nameIn), field('Currency', curIn),
            field('School weekend', h('select', { onchange: e => { KH.store.setSetting('weekend', e.target.value); u.toast('Saved'); } },
              [['fri-sat', 'Friday and Saturday'], ['sat-sun', 'Saturday and Sunday']].map(([v, l]) => h('option', { value: v, selected: (s.weekend || 'fri-sat') === v }, l))), 'Used to count school days missed when sick.'));
  }
  function analysisCard() {
    return u.section('Analysis', h('p', { class: 'small muted', style: { marginTop: 0 } }, 'These decide what the app flags in the reports and reminders.'),
            numberSetting('lowMark', 'A subject is "low" below', 'Default 70.'),
            numberSetting('dropPoints', 'Flag a drop of at least (points)', 'Default 8: a subject falling this much across a term is flagged.'),
            numberSetting('reminderDays', 'Remind me this many days before exams and payments', 'Default 3.'));
  }
  function aboutCard(info) {
    const where = info.platform === 'win32' ? 'Windows' : info.platform === 'phone' ? 'Phone' : info.platform || '';
    return u.section('About', h('div', { class: 'row', style: { gap: '14px', flexWrap: 'nowrap' } }, h('img', { src: 'assets/logo.png', alt: '', style: { width: '64px', height: '64px', borderRadius: '16px', flex: 'none' } }),
      h('div', { class: 'small muted' }, `M. Ebrahim Family Hub ${info.version || ''} · ${where} · records encrypted with AES-256`)));
  }
  function phoneSettings(s, info) {
    const nameIn = h('input', { type: 'text', value: s.familyName || 'M. Ebrahim Family Hub', onchange: e => { KH.store.setSetting('familyName', e.target.value.trim() || 'M. Ebrahim Family Hub'); KH.app.refresh(); } });
    const curIn = h('input', { type: 'text', value: s.currency || 'SAR', onchange: e => { KH.store.setSetting('currency', e.target.value.trim() || 'SAR'); u.toast('Saved'); } });
    return h('div', null, phoneCard(), appearanceCard(), pinCard(), generalCard(s, nameIn, curIn), analysisCard(), aboutCard(info));
  }

  KH.pages.settings = function () {
    const s = KH.store.settings();
    const info = KH.store.info || {};
    if (KH.phoneApp) return phoneSettings(s, info);
    const periodSel = h('select', { onchange: e => { KH.store.setSetting('reimbursePeriod', e.target.value); u.toast('Saved'); } },
      [['academic-year', 'Per academic year (Aug-Jul)'], ['calendar-year', 'Per calendar year (Jan-Dec)'], ['total', 'One limit for all years']].map(([v, l]) => h('option', { value: v, selected: s.reimbursePeriod === v }, l)));
    const nameIn = h('input', { type: 'text', value: s.familyName || 'M. Ebrahim Family Hub', onchange: e => { KH.store.setSetting('familyName', e.target.value.trim() || 'M. Ebrahim Family Hub'); KH.app.refresh(); } });
    const curIn = h('input', { type: 'text', value: s.currency || 'SAR', onchange: e => { KH.store.setSetting('currency', e.target.value.trim() || 'SAR'); u.toast('Saved'); } });
    return h('div', null,
      h('div', { class: 'grid g2' },
        h('div', null,
          sabisCard(),
          windowsCard(),
          appearanceCard(),
          generalCard(s, nameIn, curIn),
          analysisCard()),
        h('div', null, dataCard(), featuresCard(), securityCard(),
          u.section('Company reimbursement',
            h('p', { class: 'small muted', style: { marginTop: 0 } }, 'Used by the Company reimbursement page (parents only, behind the PIN).'),
            numberSetting('reimburseLimit', 'Limit (all children together)', `In ${s.currency || 'SAR'}. Default 100,000.`, '100'),
            numberSetting('reimburseShare', 'Company pays this % of each invoice', 'Default 66.67, which the app treats as exactly two thirds.', '0.01'),
            field('The limit applies', periodSel)),
          readerCard(),
          aboutCard(info))));
  };

  // ---------------- Control: what other parent accounts see (the organiser only) ----------------
  KH.pages.control = function () {
    const A = KH.access;
    const others = (KH.store.data.users || []).filter(x => x.role === 'parent' && x.id !== A.ownerId());
    const rows = A.SECTIONS.map(sec => {
      const box = h('input', { type: 'checkbox', checked: A.shown(sec.key), onchange: e => {
        const c = Object.assign({}, KH.store.settings().control || {}, { [sec.key]: e.target.checked });
        KH.store.setSetting('control', c);
        u.toast(e.target.checked ? 'Shown to the other parent account' : 'Hidden from the other parent account');
      } });
      return h('label', { class: 'row', style: { padding: '8px 0', borderBottom: '1px solid var(--line)', gap: '10px' } }, box, h('span', null, sec.label));
    });
    return h('div', { style: { maxWidth: '720px' } },
      u.section('Control',
        h('p', { class: 'muted', style: { marginTop: 0 } }, others.length
          ? `What ${others.map(o => o.displayName || o.username).join(', ')} can see. Ticked sections are shown; the rest disappear from that account's menu and pages.`
          : 'What other parent accounts can see, once you add one in Accounts. Ticked sections are shown.'),
        rows,
        h('div', { class: 'note small', style: { marginTop: '12px' } }, 'Company reimbursement, Settings, Family cloud and this Control page are on your account only. Money and Credentials start hidden, and they also ask for the PIN.')));
  };

  // ---------------- accounts ----------------
  const WORDS = ['Apple', 'Bear', 'Berry', 'Bird', 'Blue', 'Cake', 'Cloud', 'Coral', 'Dolphin', 'Eagle', 'Falcon', 'Fox', 'Garden', 'Gold', 'Green', 'Happy', 'Honey', 'Jolly', 'Kite', 'Lemon', 'Lion', 'Lucky', 'Mango', 'Maple', 'Moon', 'Ocean', 'Orange', 'Owl', 'Panda', 'Pearl', 'Pepper', 'Pilot', 'Planet', 'Purple', 'Quick', 'Rain', 'River', 'Robin', 'Rocket', 'Ruby', 'Silver', 'Sky', 'Smile', 'Snow', 'Star', 'Sunny', 'Tiger', 'Tulip', 'Turtle', 'Violet', 'Whale', 'Zebra'];
  const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  // Easy to read out and type: two words and two digits, no look-alike characters.
  function easyPassword() {
    let a = WORDS[rnd(WORDS.length)], b = WORDS[rnd(WORDS.length)];
    while (b === a) b = WORDS[rnd(WORDS.length)];
    return `${a}-${b}-${2 + rnd(8)}${2 + rnd(8)}`;
  }
  KH.easyPassword = easyPassword;
  function freeUsername(base) {
    const taken = new Set((KH.store.data.users || []).map(x => String(x.username).toLowerCase()));
    const b = String(base || 'child').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '') || 'child';
    if (!taken.has(b)) return b;
    for (let i = 2; i < 100; i++) if (!taken.has(`${b}${i}`)) return `${b}${i}`;
    return `${b}${Date.now() % 1000}`;
  }

  function loginCardHtml(child, username, password) {
    const esc = u.esc;
    const col = KH.kidColor(child);
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><style>
      body{font-family:"Segoe UI",Arial,sans-serif;color:#151B2E;padding:30px}
      .card{width:420px;border:2px dashed ${col};border-radius:18px;padding:22px 26px}
      .top{background:${col};color:#fff;border-radius:12px;padding:12px 16px;margin-bottom:14px}
      .top b{font-size:20px}.k{color:#556078;font-size:12px;margin-top:10px}.v{font:700 22px Consolas,"Cascadia Mono",monospace;letter-spacing:.03em}
      .s{color:#556078;font-size:12px;margin-top:16px;line-height:1.5}</style></head><body><div class="card">
      <div class="top"><b>${esc(child.name)}</b><br>M. Ebrahim Family Hub</div>
      <div class="k">Username</div><div class="v">${esc(username)}</div>
      <div class="k">Password</div><div class="v">${esc(password)}</div>
      <div class="s">Open M. Ebrahim Family Hub on the family PC, type the username and password, then press Sign in. You will see your own marks, homework, calendar and study hours.<br>Keep this card private.</div>
      </div></body></html>`;
  }

  function showLoginCard(child, username, password) {
    const text = `M. Ebrahim Family Hub\n${child.name}\nUsername: ${username}\nPassword: ${password}`;
    u.modal({ title: `${child.name}'s login`, body: h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Give this to ' + child.name + '. The password is only shown now; you can make a new one at any time.'),
      h('div', { class: 'login-card' },
        h('div', { class: 'row', style: { marginBottom: '10px' } }, KH.avatar(child, 40), h('b', { style: { fontSize: '17px' } }, child.name)),
        h('div', { class: 'small muted' }, 'Username'), h('div', { class: 'val', 'data-noi18n': '1' }, username),
        h('div', { class: 'small muted', style: { marginTop: '10px' } }, 'Password'), h('div', { class: 'val', 'data-noi18n': '1' }, password))),
    actions: [
      { label: 'Copy', onClick: () => { hub.copy(text); u.toast('Copied - it clears from the clipboard in 30 seconds'); return false; } },
      { label: 'Print card', onClick: () => { hub.print(loginCardHtml(child, username, password)); return false; } },
      { label: 'Done', primary: true }] });
  }

  async function makeChildLogin(child, existing) {
    const password = easyPassword();
    const hp = await hub.hash(password);
    let username;
    if (existing) {
      username = existing.username;
      KH.store.upsert('users', Object.assign({}, existing, { salt: hp.salt, hash: hp.hash }));
    } else {
      username = freeUsername(String(child.name).split(/\s+/)[0]);
      KH.store.upsert('users', { username, displayName: child.name, role: 'child', childId: child.id, salt: hp.salt, hash: hp.hash, lang: 'en' });
    }
    KH.app.refresh();
    showLoginCard(child, username, password);
  }

  async function addAccount() {
    const kids = KH.store.children();
    const role = h('select', null, h('option', { value: 'child' }, 'Child (sees only their own page)'), h('option', { value: 'parent' }, 'Parent (sees everything)'));
    const childSel = h('select', null, kids.map(c => h('option', { value: c.id }, c.name)));
    const userIn = h('input', { type: 'text' });
    const nameIn = h('input', { type: 'text' });
    const p1 = h('input', { type: 'password' }), p2 = h('input', { type: 'password' });
    const childRow = field('Child', childSel);
    const suggest = () => { const c = KH.store.child(childSel.value); if (role.value === 'child' && c) { if (!userIn.dataset.touched) userIn.value = freeUsername(c.name.split(/\s+/)[0]); if (!nameIn.dataset.touched) nameIn.value = c.name; } };
    role.addEventListener('change', () => { childRow.style.display = role.value === 'child' ? '' : 'none'; suggest(); });
    childSel.addEventListener('change', suggest);
    userIn.addEventListener('input', () => { userIn.dataset.touched = '1'; });
    nameIn.addEventListener('input', () => { nameIn.dataset.touched = '1'; });
    suggest();
    u.modal({ title: 'Add a login', body: h('div', null, field('Type', role), childRow, field('Username', userIn), field('Name shown', nameIn),
      field('Password', p1, 'At least 6 characters for a parent (it also unlocks the family data on a new PC), 4 for a child.'), field('Repeat password', p2)),
      actions: [{ label: 'Cancel' }, { label: 'Create login', primary: true, onClick: async () => {
        const username = userIn.value.trim().toLowerCase();
        if (!username) { u.toast('Choose a username', 'bad'); return false; }
        if ((KH.store.data.users || []).some(x => String(x.username).toLowerCase() === username)) { u.toast('That username is taken', 'bad'); return false; }
        const min = role.value === 'parent' ? 6 : 4;
        if (p1.value.length < min) { u.toast(`The password needs at least ${min} characters`, 'bad'); return false; }
        if (p1.value !== p2.value) { u.toast('The two passwords do not match', 'bad'); return false; }
        const hp = await hub.hash(p1.value);
        const rec = { username, displayName: nameIn.value.trim() || username, role: role.value, salt: hp.salt, hash: hp.hash, lang: 'en' };
        if (role.value === 'child') rec.childId = childSel.value;
        if (role.value === 'parent') { try { await hub.vaultSetPassword(username, p1.value); } catch (e) { u.toast(e.message, 'bad'); return false; } }
        KH.store.upsert('users', rec);
        u.toast('Login created'); KH.app.refresh(); return true;
      } }] });
  }

  async function setPassword(user) {
    const r = await u.prompt(`New password for ${user.displayName || user.username}`, [{ key: 'p1', label: 'New password', type: 'password' }, { key: 'p2', label: 'Repeat', type: 'password' }]);
    if (!r) return;
    const min = user.role === 'parent' ? 6 : 4;
    if (r.p1.length < min) return u.toast(`The password needs at least ${min} characters`, 'bad');
    if (r.p1 !== r.p2) return u.toast('The two passwords do not match', 'bad');
    if (user.role === 'parent') { try { await hub.vaultSetPassword(user.username, r.p1); } catch (e) { return u.toast(e.message, 'bad'); } }
    const hp = await hub.hash(r.p1);
    const saved = KH.store.upsert('users', Object.assign({}, user, { salt: hp.salt, hash: hp.hash }));
    if (KH.store.user && KH.store.user.id === user.id) KH.store.user = saved;
    u.toast('Password changed');
  }

  KH.pages.accounts = function () {
    const users = (KH.store.data.users || []).slice().sort((a, b) => (a.role === b.role ? String(a.username).localeCompare(String(b.username)) : a.role === 'parent' ? -1 : 1));
    const parents = users.filter(x => x.role === 'parent');
    const kids = KH.store.children();
    const kidsWithout = kids.filter(c => !users.some(x => x.childId === c.id));
    return h('div', null,
      kidsWithout.length ? h('div', { class: 'card' }, h('h2', null, "Children's logins"),
        h('p', { class: 'muted', style: { marginTop: 0 } }, 'One click makes a username and an easy-to-read password, ready to print or copy.'),
        h('div', { class: 'row' }, kidsWithout.map(c => h('button', { class: 'btn primary', onclick: () => makeChildLogin(c) }, u.icon('user'), `Make ${c.name}'s login`)))) : null,
      h('div', { class: 'grid g2' },
        u.section('Logins',
          h('table', { class: 'list' }, h('thead', null, h('tr', null, ['Username', 'Name', 'Type', ''].map(x => h('th', null, x)))),
            h('tbody', null, users.map(x => h('tr', null, h('td', { 'data-noi18n': '1' }, h('b', null, x.username)), h('td', null, x.displayName || ''),
              h('td', null, x.role === 'parent' ? u.chip('parent', 'info') : h('span', { class: 'chip', style: { background: `color-mix(in srgb, ${KH.kidColor(KH.store.child(x.childId))} 16%, transparent)`, color: KH.kidColor(KH.store.child(x.childId)) } }, KH.store.childName(x.childId))),
              h('td', { class: 'right' }, h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
                x.role === 'child' && KH.store.child(x.childId) ? h('button', { class: 'btn small', title: 'Make a new easy password and show the login card', onclick: async () => {
                  if (await u.confirm(`Make a new password for ${x.username}? The old one stops working.`, 'New password')) makeChildLogin(KH.store.child(x.childId), x);
                } }, 'New password + card') : null,
                x.role === 'child' && KH.store.child(x.childId) ? h('button', { class: 'btn small', title: 'For a forgotten diary PIN', onclick: async () => {
                  const nm = KH.store.childName(x.childId);
                  if (!(await u.confirm(`Reset ${nm}'s diary PIN? ${nm} chooses a new PIN and gets a fresh diary. Pages written with the old PIN stay locked: nobody can read them, you included, unless ${nm} remembers the old PIN.`, 'Reset diary PIN'))) return;
                  try { await hub.diaryReset(x.childId); u.toast(`${nm} can choose a new diary PIN now`, 'good'); } catch (e) { u.toast(e.message, 'bad'); }
                } }, 'Reset diary PIN') : null,
                h('button', { class: 'btn small', onclick: () => setPassword(x) }, 'Set password'),
                x.id !== KH.store.user.id && !(x.role === 'parent' && parents.length <= 1) ? h('button', { class: 'btn small danger', onclick: async () => {
                  if (!(await u.confirm(`Remove the login "${x.username}"? Their records stay.`, 'Remove'))) return;
                  if (x.role === 'parent') { try { await hub.vaultRemoveParent(x.username); } catch (e) { /* the key may not exist yet */ } }
                  KH.store.remove('users', x.id); KH.app.refresh();
                } }, 'Remove') : null)))))),
          h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn', onclick: addAccount }, '+ Add login'))),
        u.section('What children can do',
          h('ul', { style: { margin: 0, paddingInlineStart: '18px', lineHeight: 1.7 } },
            h('li', null, 'See only their own marks, charts, action plan, goals and future path.'),
            h('li', null, 'See their own homework, timetable, study files and the school announcements meant for their grade.'),
            h('li', null, 'Log their daily study hours, reading and lunch box, and tick off their own actions.'),
            h('li', null, 'Set their own goals, and add achievements, qualifications, school diary entries and "not feeling well" reports. You get a notification and can remove anything.'),
            h('li', null, 'Keep a private diary behind their own PIN. Parents cannot read it; "Reset diary PIN" gives them a fresh diary if they forget it.'),
            h('li', null, 'They cannot see the other children, payments, the company reimbursement, credentials, meetings, contacts or settings.')),
          h('p', { class: 'small muted' }, 'Tip: on a child\'s own PC, sign in once with their login and tick "Keep me signed in". Reminders on that PC then cover only that child.'))));
  };

  KH.pages.me = function () {
    const cur = h('input', { type: 'password' }), p1 = h('input', { type: 'password' }), p2 = h('input', { type: 'password' });
    const msg = h('div', { class: 'small', style: { minHeight: '18px' } });
    const me = KH.store.user;
    const min = me.role === 'parent' ? 6 : 4;
    return h('div', { style: { maxWidth: '460px' } }, u.section('Change my password',
      field('Current password', cur), field('New password', p1, `At least ${min} characters.`), field('Repeat new password', p2), msg,
      h('button', { class: 'btn primary', onclick: async () => {
        msg.style.color = 'var(--bad)';
        if (!(await hub.verify(cur.value, me.salt, me.hash))) { msg.textContent = t('The current password is not right.'); return; }
        if (p1.value.length < min) { msg.textContent = t(`The new password needs at least ${min} characters.`); return; }
        if (p1.value !== p2.value) { msg.textContent = t('The two new passwords do not match.'); return; }
        if (me.role === 'parent') { try { await hub.vaultSetPassword(me.username, p1.value); } catch (e) { msg.textContent = KH.i18n.t(e.message); return; } }
        const hp = await hub.hash(p1.value);
        KH.store.user = KH.store.upsert('users', Object.assign({}, me, { salt: hp.salt, hash: hp.hash }));
        cur.value = p1.value = p2.value = '';
        msg.style.color = 'var(--good)'; msg.textContent = t('Password changed.');
      } }, 'Change password')));
  };
})();
