// Messages: a family chat, Parents, Kids, any group you make, and one-to-one chats, with
// pictures, files and voice notes. Messages travel through the same encrypted cloud folder
// as everything else, so they arrive once both PCs have synced (usually within a minute).
(function () {
  'use strict';
  const KH = window.KH; KH.pages = KH.pages || {};
  const u = KH.u, h = u.h;
  const M = KH.msg = KH.msg || { overview: {}, markers: {}, unread: 0, open: null, list: [], more: false, months: 3 };

  // ---------------- chats this login can see ----------------
  const users = () => KH.store.data.users || [];
  const me = () => KH.store.user;
  const userName = id => { const x = users().find(v => v.id === id); return x ? (x.displayName || x.username) : 'Someone'; };
  const userColor = id => { const x = users().find(v => v.id === id); return x && x.role === 'child' ? KH.kidColor(KH.store.child(x.childId)) : '#4F46E5'; };
  function avatarOf(id, size) {
    const x = users().find(v => v.id === id);
    if (x && x.role === 'child' && KH.store.child(x.childId)) return KH.avatar(KH.store.child(x.childId), size || 32);
    return h('span', { class: 'avatar', style: { width: `${size || 32}px`, height: `${size || 32}px`, background: 'linear-gradient(135deg,#5B6CFF,#9B4DFF)', fontSize: `${Math.round((size || 32) * 0.4)}px` } }, u.initials(userName(id)));
  }
  const dmId = (a, b) => `dm-${[a, b].sort().join('--')}`;
  function membersOf(c) {
    const us = users();
    if (c.kind === 'family') return us.map(x => x.id);
    if (c.kind === 'parents') return us.filter(x => x.role === 'parent').map(x => x.id);
    if (c.kind === 'kids') return us.filter(x => x.role === 'child').map(x => x.id);
    if (c.kind === 'direct') return c.id.slice(3).split('--');
    return (c.members || []).filter(id => us.some(x => x.id === id));
  }
  const kidsOnly = c => { const m = membersOf(c); return m.length > 0 && m.every(id => (users().find(x => x.id === id) || {}).role === 'child'); };
  function chatName(c) {
    if (c.kind === 'family') return 'Family';
    if (c.kind === 'parents') return 'Parents';
    if (c.kind === 'kids') return 'Kids';
    if (c.kind === 'direct') { const other = membersOf(c).filter(id => id !== me().id); return other.length === 1 ? userName(other[0]) : membersOf(c).map(userName).join(' & '); }
    return c.name || 'Group';
  }
  // returns { mine: chats I am in, watch: kids' chats a parent can open }
  function chatsForMe() {
    const user = me(), parent = user.role === 'parent';
    const base = [{ id: 'chat-family', kind: 'family' }];
    if (parent) base.push({ id: 'chat-parents', kind: 'parents' });
    base.push({ id: 'chat-kids', kind: 'kids' });
    const groups = (KH.store.data.chats || []).filter(c => !c.deletedAt);
    const directs = new Map();
    // one-to-one chats appear once there is something in them (or when started)
    for (const [id, ov] of Object.entries(M.overview)) if (/^dm-/.test(id) && ov && ov.last) directs.set(id, { id, kind: 'direct' });
    for (const c of M.started || []) directs.set(c.id, c);
    const all = base.concat(groups, Array.from(directs.values()));
    const mine = all.filter(c => membersOf(c).includes(user.id));
    const watch = parent ? all.filter(c => !membersOf(c).includes(user.id) && kidsOnly(c)) : [];
    return { mine, watch };
  }
  M.chatIds = () => { const { mine, watch } = chatsForMe(); return mine.concat(watch).map(c => c.id); };

  // every family member's one-to-one chat with me, so they can be found before the first message
  function allDirectIds() { return users().filter(x => x.id !== me().id).map(x => dmId(me().id, x.id)); }

  async function refreshOverview() {
    if (!KH.store.user) return;
    try {
      const ids = Array.from(new Set(M.chatIds().concat(allDirectIds()).concat(me().role === 'parent' ? kidPairs() : [])));
      M.overview = await window.hub.msgOverview(ids);
      const { mine } = chatsForMe();
      const unread = mine.reduce((n, c) => n + ((M.overview[c.id] || {}).unread || 0), 0);
      if (unread !== M.unread) { M.unread = unread; KH.app.refreshNav && KH.app.refreshNav(); }
    } catch (e) { /* not signed in yet */ }
  }
  function kidPairs() { const kids = users().filter(x => x.role === 'child'); const out = []; for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) out.push(dmId(kids[i].id, kids[j].id)); return out; }
  M.refreshOverview = refreshOverview;
  setInterval(refreshOverview, 20000);

  // ---------------- one message ----------------
  const fmtTime = iso => new Date(iso).toLocaleTimeString(u.locale(), { hour: 'numeric', minute: '2-digit' });
  const fmtSize = n => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  function fileEl(f) {
    const url = window.hub.fileUrl(f.rel);
    if (f.kind === 'image') return h('img', { class: 'msg-img', src: url, alt: f.name, onclick: () => u.modal({ title: f.name, wide: true, body: h('img', { src: url, style: { maxWidth: '100%', borderRadius: '10px' } }), actions: [{ label: 'Save a copy', onClick: () => { window.hub.saveAs(f.rel); return false; } }, { label: 'Close', primary: true }] }) });
    if (f.kind === 'voice') return h('div', { class: 'msg-voice' }, u.icon('mic'), h('audio', { controls: true, preload: 'none', src: url }), f.duration ? h('span', { class: 'small muted' }, `${Math.round(f.duration)} s`) : null);
    return h('button', { class: 'msg-file', type: 'button', onclick: () => window.hub.open(f.rel) }, u.icon('doc'), h('span', { class: 'ux' }, f.name), h('span', { class: 'small muted' }, fmtSize(f.size || 0)));
  }
  function cardEl(c) {
    return h('button', { class: 'msg-card', type: 'button', onclick: () => { if (c.route) KH.app.go(c.route); } },
      h('span', { class: 'small muted' }, { book: 'Book', homework: 'Homework', announcement: 'Announcement', marks: 'Marks', goal: 'Goal' }[c.type] || 'Shared'),
      h('b', { class: 'ux' }, c.title), c.sub ? h('span', { class: 'small ux' }, c.sub) : null);
  }
  function bubble(m, opts) {
    const mine = m.from === me().id;
    const el = h('div', { class: `msg ${mine ? 'mine' : ''}`, 'data-id': m.id },
      !mine && opts.showName ? h('div', { class: 'msg-from', style: { color: userColor(m.from) } }, userName(m.from)) : null,
      h('div', { class: 'msg-body' },
        m.deleted ? h('i', { class: 'muted' }, 'Message deleted') : null,
        m.text ? h('div', { class: 'msg-text ux' }, m.text) : null,
        (m.files || []).map(fileEl),
        m.card ? cardEl(m.card) : null,
        h('div', { class: 'msg-time' }, fmtTime(m.at))));
    if (mine && !m.deleted) el.addEventListener('contextmenu', async e => {
      e.preventDefault();
      if (await u.confirm('Delete this message for everyone?', 'Delete')) {
        try { await window.hub.msgDelete(m.chat, m.id, String(m.at).slice(0, 7)); openChat(m.chat, true); } catch (err) { u.toast(err.message, 'bad'); }
      }
    });
    return el;
  }

  // ---------------- the page ----------------
  let listEl = null, threadEl = null;
  function chatRow(c, watch) {
    const ov = M.overview[c.id] || {};
    const last = ov.last;
    const others = membersOf(c).filter(id => id !== me().id);
    const icon = c.kind === 'direct' && others.length === 1 ? avatarOf(others[0], 38)
      : h('span', { class: 'avatar chat-ico', style: { width: '38px', height: '38px' } }, u.icon(c.kind === 'family' ? 'home' : c.kind === 'parents' ? 'users' : c.kind === 'kids' ? 'star' : 'users'));
    return h('button', { class: `chat-row ${M.open === c.id ? 'on' : ''}`, type: 'button', onclick: () => KH.app.go(`#/messages/${c.id}`) },
      icon,
      h('span', { class: 'chat-mid' },
        h('span', { class: 'chat-name ux' }, chatName(c), watch ? h('span', { class: 'small muted' }, ' · kids') : null),
        h('span', { class: 'chat-last small muted ux' }, last ? `${last.from === me().id ? 'You: ' : ''}${last.deleted ? 'Message deleted' : last.text || ((last.files || []).some(f => f.kind === 'voice') ? 'Voice note' : (last.files || []).length ? 'Attachment' : last.card ? last.card.title : '')}` : 'No messages yet')),
      ov.unread && !watch ? h('span', { class: 'badge' }, String(ov.unread)) : last ? h('span', { class: 'small muted' }, fmtTime(last.at)) : null);
  }

  function drawList() {
    if (!listEl) return;
    const { mine, watch } = chatsForMe();
    const byLast = (a, b) => String(((M.overview[b.id] || {}).last || {}).at || '').localeCompare(String(((M.overview[a.id] || {}).last || {}).at || ''));
    const fixed = mine.filter(c => ['family', 'parents', 'kids'].includes(c.kind));
    const rest = mine.filter(c => !fixed.includes(c)).sort(byLast);
    listEl.innerHTML = '';
    listEl.append(
      h('div', { class: 'row', style: { padding: '4px 4px 10px' } }, h('b', null, 'Chats'), h('div', { class: 'spacer' }), h('button', { class: 'btn small primary', onclick: newChat }, '+ New chat')),
      ...fixed.map(c => chatRow(c)),
      rest.length ? h('div', { class: 'chat-group' }, 'Groups and one-to-one') : h('div'),
      ...rest.map(c => chatRow(c)),
      watch.length ? h('div', { class: 'chat-group' }, "The kids' chats with each other") : h('div'),
      ...watch.sort(byLast).map(c => chatRow(c, true)));
    KH.i18n.apply(listEl);
  }

  async function openChat(id, keepScroll) {
    M.open = id;
    const c = chatsForMe().mine.concat(chatsForMe().watch).find(x => x.id === id) || (/^dm-/.test(id) ? { id, kind: 'direct' } : null);
    if (!c || !threadEl) return;
    let res;
    try { res = await window.hub.msgList(id, M.months); } catch (e) { threadEl.innerHTML = ''; threadEl.appendChild(h('div', { class: 'errbox' }, e.message)); return; }
    M.list = res.messages; M.more = res.more;
    try { M.markers = await window.hub.msgMarkers(); } catch (e) { M.markers = {}; }
    drawThread(c, keepScroll);
    const last = M.list[M.list.length - 1];
    const member = membersOf(c).includes(me().id);
    if (last && member) { try { await window.hub.msgRead(id, last.at); } catch (e) { /* ignore */ } }
    refreshOverview().then(drawList);
  }

  function drawThread(c, keepScroll) {
    const member = membersOf(c).includes(me().id);
    const box = h('div', { class: 'msg-scroll' });
    const showName = c.kind !== 'direct';
    let day = '';
    if (M.more) box.appendChild(h('div', { style: { textAlign: 'center', margin: '6px 0 12px' } }, h('button', { class: 'btn small', onclick: () => { M.months += 6; openChat(c.id); } }, 'Show older messages')));
    if (!M.list.length) box.appendChild(h('div', { class: 'empty' }, member ? 'No messages yet. Say hello!' : 'No messages yet.'));
    let prev = null;
    for (const m of M.list) {
      const d = String(m.at).slice(0, 10);
      if (d !== day) { day = d; prev = null; box.appendChild(h('div', { class: 'msg-day' }, d === u.today() ? 'Today' : u.fmtDate(d))); }
      // one name over a run of messages from the same person
      const run = prev && prev.from === m.from && (Date.parse(m.at) - Date.parse(prev.at)) < 5 * 60000;
      box.appendChild(bubble(m, { showName: showName && !run }));
      prev = m;
    }
    // seen by: who has read my last message
    const myLast = M.list.slice().reverse().find(m => m.from === me().id && !m.deleted);
    if (myLast) {
      const seen = membersOf(c).filter(id => id !== me().id && String((M.markers[id] || {})[c.id] || '') >= myLast.at);
      if (seen.length) box.appendChild(h('div', { class: 'msg-seen' }, `Seen by ${seen.map(userName).join(', ')}`));
    }
    const head = h('div', { class: 'thread-head' },
      h('a', { class: 'btn icon small phone-only thread-back', href: '#/messages', 'aria-label': 'All chats' }, u.icon('back', 'ico-back')),
      h('b', { class: 'ux' }, chatName(c)),
      h('span', { class: 'small muted' }, membersOf(c).map(userName).join(', ')),
      h('div', { class: 'spacer' }),
      c.kind === 'group' && (me().role === 'parent' || c.createdBy === me().id) ? h('button', { class: 'btn small', onclick: () => editGroup(c) }, 'Edit group') : null);
    const note = kidsOnly(c) ? h('div', { class: 'thread-note' }, me().role === 'child' ? 'Parents can see chats between the kids.' : 'You can read this chat between the kids. They know parents can see it.') : null;
    threadEl.innerHTML = '';
    threadEl.append(head, ...(note ? [note] : []), box, member ? composer(c) : h('div', { class: 'thread-readonly small muted' }, 'Read only: you are not in this chat.'));
    KH.i18n.apply(threadEl);
    requestAnimationFrame(() => { if (!keepScroll) box.scrollTop = box.scrollHeight; });
  }

  // ---------------- writing ----------------
  function composer(c) {
    const pending = [];
    const chips = h('div', { class: 'compose-files' });
    const drawChips = () => { chips.innerHTML = ''; pending.forEach((f, i) => chips.appendChild(h('span', { class: 'chip' }, f.kind === 'voice' ? `Voice note ${Math.round(f.duration)} s` : f.name, h('button', { class: 'chip-x', 'aria-label': 'Remove', onclick: () => { pending.splice(i, 1); drawChips(); } }, '✕')))); };
    const text = h('textarea', { rows: 1, placeholder: 'Write a message…', class: 'compose-text', onkeydown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } } });
    text.addEventListener('input', () => { text.style.height = 'auto'; text.style.height = Math.min(160, text.scrollHeight) + 'px'; });
    const addPaths = async paths => {
      for (const p of paths) {
        try { const r = await window.hub.msgAttach(p); const name = p.split(/[\\/]/).pop(); pending.push({ rel: r.rel, name, size: r.size, type: /\.(png|jpe?g|gif|webp|bmp)$/i.test(name) ? 'image/' + name.split('.').pop().toLowerCase().replace('jpg', 'jpeg') : '' }); }
        catch (e) { u.toast(e.message, 'bad'); }
      }
      drawChips();
    };
    async function send() {
      const body = text.value.trim();
      if (!body && !pending.length) return;
      try {
        const msg = await window.hub.msgSend(c.id, { text: body, files: pending.slice() });
        text.value = ''; text.style.height = 'auto'; pending.length = 0; drawChips();
        M.list.push(msg); drawThread(c); refreshOverview().then(drawList);
        setTimeout(() => { const t = threadEl.querySelector('.compose-text'); if (t) t.focus(); }, 30);
      } catch (e) { u.toast(e.message, 'bad'); }
    }
    // voice notes
    let rec = null, chunks = [], startAt = 0, timer = null;
    const recLbl = h('span', { class: 'rec-time' });
    const micBtn = h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Record a voice note', title: 'Record a voice note', onclick: async () => {
      if (rec) { rec.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = []; rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        rec.onstop = async () => {
          clearInterval(timer); stream.getTracks().forEach(t => t.stop());
          const dur = (Date.now() - startAt) / 1000; rec = null; micBtn.classList.remove('rec'); recLbl.textContent = '';
          if (dur < 1) return;
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
          try { const r = await window.hub.msgAttachData(b64, `voice-${Date.now()}.webm`); pending.push({ rel: r.rel, name: 'Voice note', size: r.size, type: 'audio/webm', kind: 'voice', duration: dur }); drawChips(); }
          catch (e) { u.toast(e.message, 'bad'); }
        };
        rec.start(); startAt = Date.now(); micBtn.classList.add('rec');
        timer = setInterval(() => { const s = Math.round((Date.now() - startAt) / 1000); recLbl.textContent = `● ${s} s`; if (s >= 180 && rec) rec.stop(); }, 250);
      } catch (e) { u.toast('No microphone was found, or it is blocked in Windows settings.', 'bad'); }
    } }, u.icon('mic'));
    const box = h('div', { class: 'composer' },
      chips,
      h('div', { class: 'compose-row' },
        h('button', { class: 'btn icon', type: 'button', 'aria-label': 'Attach files', title: 'Attach pictures or files (up to 25 MB each)', onclick: async () => { const p = await window.hub.pick({ multi: true, title: 'Attach files' }); if (p.length) addPaths(p); } }, u.icon('clip')),
        text, recLbl, micBtn,
        h('button', { class: 'btn primary send-btn', type: 'button', onclick: send, 'aria-label': 'Send' }, u.icon('send'), h('span', { class: 'send-label' }, 'Send'))));
    box.addEventListener('dragover', e => { e.preventDefault(); box.classList.add('dragging'); });
    box.addEventListener('dragleave', () => box.classList.remove('dragging'));
    box.addEventListener('drop', e => { e.preventDefault(); box.classList.remove('dragging'); const ps = Array.from(e.dataTransfer.files || []).map(f => window.hub.pathForFile(f)).filter(Boolean); if (ps.length) addPaths(ps); });
    setTimeout(() => text.focus(), 50);
    return box;
  }

  // ---------------- new chat and groups ----------------
  function newChat() {
    const others = users().filter(x => x.id !== me().id && (me().role === 'parent' || true));
    const picks = new Set();
    const name = h('input', { type: 'text', placeholder: 'Group name (for two or more people)' });
    const body = h('div', null,
      h('p', { class: 'muted', style: { marginTop: 0 } }, 'Pick one person for a one-to-one chat, or several for a group.'),
      h('div', { class: 'who-pick', style: { justifyContent: 'flex-start' } }, others.map(x => {
        const b = h('button', { class: 'who-btn', type: 'button', onclick: () => { if (picks.has(x.id)) picks.delete(x.id); else picks.add(x.id); b.classList.toggle('on', picks.has(x.id)); } }, avatarOf(x.id, 44), h('span', null, x.displayName || x.username));
        return b;
      })),
      h('label', { class: 'f' }, h('span', null, 'Group name'), name));
    u.modal({ title: 'New chat', body, actions: [{ label: 'Cancel' }, { label: 'Start', primary: true, onClick: () => {
      const ids = Array.from(picks);
      if (!ids.length) { u.toast('Pick at least one person', 'bad'); return false; }
      if (ids.length === 1) { const id = dmId(me().id, ids[0]); M.started = (M.started || []).concat([{ id, kind: 'direct' }]); KH.app.go(`#/messages/${id}`); return true; }
      const g = KH.store.upsert('chats', { kind: 'group', name: name.value.trim() || ids.concat(me().id).map(userName).join(', '), members: ids.concat(me().id), createdBy: me().id });
      KH.app.go(`#/messages/${g.id}`); return true;
    } }] });
  }
  function editGroup(c) {
    const picks = new Set(c.members || []);
    const name = h('input', { type: 'text', value: c.name || '' });
    const body = h('div', null, h('label', { class: 'f' }, h('span', null, 'Group name'), name),
      h('div', { class: 'who-pick', style: { justifyContent: 'flex-start' } }, users().map(x => { const b = h('button', { class: `who-btn ${picks.has(x.id) ? 'on' : ''}`, type: 'button', onclick: () => { if (picks.has(x.id)) picks.delete(x.id); else picks.add(x.id); b.classList.toggle('on', picks.has(x.id)); } }, avatarOf(x.id, 40), h('span', null, x.displayName || x.username)); return b; })));
    u.modal({ title: 'Edit group', body, actions: [
      { label: 'Delete group', danger: true, left: true, onClick: async () => { if (!(await u.confirm('Delete this group? Its messages stay in the folder but the group disappears from the list.', 'Delete'))) return false; KH.store.remove('chats', c.id); KH.app.go('#/messages'); return true; } },
      { label: 'Cancel' }, { label: 'Save', primary: true, onClick: () => { KH.store.upsert('chats', Object.assign({}, c, { name: name.value.trim() || c.name, members: Array.from(picks) })); openChat(c.id); return true; } }] });
  }

  // ---------------- share something from the app into a chat ----------------
  KH.shareToChat = function (card) {
    const { mine } = chatsForMe();
    const all = mine.concat(users().filter(x => x.id !== me().id).map(x => ({ id: dmId(me().id, x.id), kind: 'direct' })).filter(d => !mine.some(m => m.id === d.id)));
    const note = h('input', { type: 'text', placeholder: 'Add a message (optional)' });
    let m;
    const body = h('div', null, h('div', { class: 'msg-card', style: { marginBottom: '12px', cursor: 'default' } }, h('b', { class: 'ux' }, card.title), card.sub ? h('span', { class: 'small ux' }, card.sub) : null),
      h('label', { class: 'f' }, h('span', null, 'Message'), note),
      h('div', { class: 'share-list' }, all.map(c => h('button', { class: 'btn', type: 'button', onclick: async () => {
        try { await window.hub.msgSend(c.id, { text: note.value.trim(), card }); u.toast(`Sent to ${chatName(c)}`, 'good'); m.close(); refreshOverview(); } catch (e) { u.toast(e.message, 'bad'); }
      } }, chatName(c)))));
    m = u.modal({ title: 'Share in a chat', body, actions: [{ label: 'Cancel' }] });
  };

  KH.pages.messages = function (route) {
    const id = (route.match(/^#\/messages\/(.+)$/) || [])[1] || null;
    listEl = h('div', { class: 'chat-list' });
    threadEl = h('div', { class: 'thread' }, h('div', { class: 'empty' }, 'Pick a chat on the left.'));
    // on a phone: the chat list, or one chat full screen with a way back
    const wrap = h('div', { class: `msg-wrap ${id ? 'has-chat' : ''}` }, listEl, threadEl);
    drawList();
    refreshOverview().then(() => { drawList(); if (!id && !u.isPhone()) { const first = chatsForMe().mine[0]; if (first) KH.app.go(`#/messages/${first.id}`); } });
    if (id) setTimeout(() => openChat(id), 0);
    return wrap;
  };

  // messages arriving from another PC
  if (window.hub && window.hub.onMessage) window.hub.onMessage(m => {
    if (!KH.store.user) return;
    if (M.open === m.chat && /^#\/messages/.test(location.hash)) {
      const i = M.list.findIndex(x => x.id === m.id);
      if (i >= 0) M.list[i] = m; else M.list.push(m);
      const c = chatsForMe().mine.concat(chatsForMe().watch).find(x => x.id === m.chat);
      if (c && threadEl) { const box = threadEl.querySelector('.msg-scroll'); const atEnd = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 80; drawThread(c, !atEnd); if (membersOf(c).includes(me().id)) window.hub.msgRead(m.chat, m.at).catch(() => {}); }
    }
    refreshOverview().then(() => { if (/^#\/messages/.test(location.hash)) drawList(); });
  });
  if (window.hub && window.hub.onNav) window.hub.onNav(r => { if (KH.store.user) location.hash = r; });
})();
