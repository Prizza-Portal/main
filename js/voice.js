// Voice rooms: peer-to-peer audio (WebRTC) + shared whiteboard. Supabase Realtime is only used for signalling,
// presence (who is in which channel) and whiteboard strokes — audio goes directly between browsers.
(() => {
  const $ = id => document.getElementById(id), P = () => window.PZ, esc = s => P().esc(s);
  const ICE = (window.PRIZZA && PRIZZA.ICE_SERVERS) || [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const MAX = 8, COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#7c3aed'];
  let channels = [], lobby, room = null, curCh = null, local = null, peers = {}, muted = false, deaf = false;
  let actx = null, meters = {}, canDrawAll = true;
  let tool = 'pen', color = COLORS[0], strokes = [], byId = {}, cv, ctx, bw = 1, bh = 1, sending = null, pend = [], timer = null, drawing = false;

  const ini = n => (String(n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('') || '?').toUpperCase();
  const me = () => P().me;

  // ---------- channels + presence ----------
  async function loadChannels() {
    const { data, error } = await sb.from('voice_channels').select('*').order('position').order('created_at');
    if (error) return P().toast(error.message);
    channels = data; renderList();
  }
  const allMembers = () => lobby ? Object.entries(lobby.presenceState()).map(([k, m]) => ({ ...m[m.length - 1], user_id: k })) : [];
  const inCh = id => allMembers().filter(m => m.channel_id === id);
  const isStaffUser = id => !!allMembers().find(m => m.user_id === id && m.staff);
  const meta = () => ({ channel_id: curCh, name: P().name, muted, deaf, staff: P().isStaff() });

  function renderList() {
    const staff = P().isStaff();
    $('vc-add').style.display = staff ? '' : 'none';
    $('vc-list').innerHTML = channels.map(c => `<button class="dc-ch ${curCh === c.id ? 'on' : ''}" data-join="${c.id}">
        <i class="fa-solid fa-volume-high text-xs"></i><span class="flex-grow truncate">${esc(c.name)}</span>
        ${staff ? `<span role="button" data-vcdel="${c.id}" title="Delete channel" class="text-xs opacity-60 hover:opacity-100">✕</span>` : ''}</button>` +
      inCh(c.id).map(m => `<div class="dc-mem" id="mem-${m.user_id}"><span class="dc-av">${ini(m.name)}</span><span class="truncate">${esc(m.name)}</span>
        ${m.muted ? '<i class="fa-solid fa-microphone-slash text-[10px]"></i>' : ''}</div>`).join('')).join('')
      || '<p class="text-xs p-4" style="color:#949ba4">No channels yet.</p>';
  }
  function renderTiles() {
    if (!curCh) return;
    const ms = inCh(curCh);
    $('vc-tiles').innerHTML = ms.map(m => `<div class="dc-tile" id="tile-${m.user_id}"><div class="dc-av">${ini(m.name)}</div>
      <div class="truncate">${esc(m.name)}${m.muted ? ' <i class="fa-solid fa-microphone-slash" style="color:#f23f43"></i>' : ''}</div></div>`).join('');
    $('vc-count').textContent = `${ms.length}/${MAX} in channel`;
  }
  function onSync() { renderList(); if (curCh) reconcile(); }

  // ---------- WebRTC ----------
  const send = msg => room && room.send({ type: 'broadcast', event: 'm', payload: { ...msg, from: me().id } });

  function makePC(id) {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    const p = peers[id] = { pc, queue: [], seen: false, audio: null };
    local.getTracks().forEach(t => pc.addTrack(t, local));
    pc.onicecandidate = e => e.candidate && send({ t: 'ice', to: id, d: e.candidate });
    pc.ontrack = e => {
      const a = new Audio(); a.autoplay = true; a.srcObject = e.streams[0]; a.muted = deaf; p.audio = a; a.play().catch(() => {});
      watch(e.streams[0], id);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' && peers[id] === p) { dropPeer(id); if (curCh && me().id > id) setTimeout(reconcile, 1500); }
    };
    return p;
  }
  async function call(id) {
    const p = makePC(id), o = await p.pc.createOffer();
    await p.pc.setLocalDescription(o); send({ t: 'offer', to: id, d: o });
  }
  const flush = async p => { while (p.queue.length) await p.pc.addIceCandidate(p.queue.shift()).catch(() => {}); };
  async function onOffer(from, d) {
    if (!local) return;
    if (peers[from]) dropPeer(from);
    const p = makePC(from);
    await p.pc.setRemoteDescription(d); await flush(p);
    const a = await p.pc.createAnswer(); await p.pc.setLocalDescription(a); send({ t: 'answer', to: from, d: a });
  }
  async function onAnswer(from, d) { const p = peers[from]; if (p && !p.pc.currentRemoteDescription) { await p.pc.setRemoteDescription(d); await flush(p); } }
  async function onIce(from, d) { const p = peers[from]; if (!p) return; p.pc.remoteDescription ? p.pc.addIceCandidate(d).catch(() => {}) : p.queue.push(d); }
  function dropPeer(id) {
    const p = peers[id]; if (!p) return;
    p.pc.close(); if (p.audio) { p.audio.srcObject = null; } delete peers[id]; unwatch(id);
  }
  // Exactly one side of every pair calls: the one with the larger user id.
  function reconcile() {
    const ms = inCh(curCh).filter(m => m.user_id !== me().id), ids = new Set(ms.map(m => m.user_id));
    ms.forEach(m => { if (peers[m.user_id]) peers[m.user_id].seen = true; else if (me().id > m.user_id) call(m.user_id); });
    Object.keys(peers).forEach(id => { if (peers[id].seen && !ids.has(id)) dropPeer(id); });
    renderTiles();
  }

  // ---------- speaking indicators ----------
  function watch(stream, key) {
    try {
      const src = actx.createMediaStreamSource(stream), an = actx.createAnalyser(); an.fftSize = 512; src.connect(an);
      meters[key] = { an, src, buf: new Uint8Array(an.fftSize) };
    } catch {}
  }
  function unwatch(key) { const m = meters[key]; if (m) { try { m.src.disconnect(); } catch {} delete meters[key]; } }
  setInterval(() => {
    Object.entries(meters).forEach(([key, m]) => {
      m.an.getByteTimeDomainData(m.buf);
      let s = 0; for (const v of m.buf) { const x = (v - 128) / 128; s += x * x; }
      const on = Math.sqrt(s / m.buf.length) > 0.035 && !(key === me().id && muted);
      [`tile-${key}`, `mem-${key}`].forEach(id => { const el = $(id); if (el) el.classList.toggle('dc-speaking', on); });
    });
  }, 120);

  // ---------- join / leave ----------
  async function join(id) {
    if (curCh === id) return;
    if (curCh) await leave();
    if (inCh(id).length >= MAX) return P().toast(`This channel is full (${MAX} people).`);
    try { local = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch { return P().toast('Microphone blocked — allow it in your browser settings to join.'); }
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume();
    curCh = id; muted = false; deaf = false; strokes = []; byId = {}; canDrawAll = true; $('vc-lock').checked = true;
    watch(local, me().id);
    room = sb.channel('voice:' + id, { config: { broadcast: { self: false } } });
    room.on('broadcast', { event: 'm' }, ({ payload }) => onMsg(payload));
    try {
      await new Promise((res, rej) => { room.subscribe(s => { if (s === 'SUBSCRIBED') res(); if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') rej(); }); setTimeout(rej, 10000); });
    } catch { await leave(); return P().toast('Could not connect to the room. Try again.'); }
    await lobby.track(meta());
    showRoom(); redraw();
    setTimeout(() => send({ t: 'need' }), 2000);
  }
  async function leave() {
    Object.keys(peers).forEach(dropPeer); unwatch(me().id);
    if (local) { local.getTracks().forEach(t => t.stop()); local = null; }
    if (room) { await sb.removeChannel(room); room = null; }
    curCh = null; await lobby.untrack(); showRoom(); renderList();
  }
  function showRoom() {
    const on = !!curCh, c = channels.find(x => x.id === curCh);
    $('vc-empty').style.display = on ? 'none' : ''; $('vc-room').style.display = on ? 'flex' : 'none'; $('vc-panel').style.display = on ? 'flex' : 'none';
    $('vc-room-name').textContent = c?.name || ''; $('vc-panel-name').textContent = c?.name || '';
    const staff = P().isStaff(); $('vc-clear').style.display = staff ? '' : 'none'; $('vc-lock-wrap').style.display = staff ? '' : 'none';
    $('nav-voice').querySelector('i').style.color = on ? '#23a55a' : '';
    updateButtons(); renderTiles(); updateLock();
  }
  function updateButtons() {
    $('vc-mute').classList.toggle('off', muted || deaf); $('vc-mute').innerHTML = `<i class="fa-solid fa-microphone${muted || deaf ? '-slash' : ''}"></i>`;
    $('vc-deaf').classList.toggle('off', deaf);
  }
  function applyAudio() {
    if (local) local.getAudioTracks().forEach(t => t.enabled = !(muted || deaf));
    Object.values(peers).forEach(p => { if (p.audio) p.audio.muted = deaf; });
    updateButtons(); if (curCh) lobby.track({ ...meta(), muted: muted || deaf });
  }

  // ---------- messages ----------
  function onMsg(m) {
    if (m.to && m.to !== me().id) return;
    const from = m.from;
    if (m.t === 'offer') onOffer(from, m.d);
    else if (m.t === 'answer') onAnswer(from, m.d);
    else if (m.t === 'ice') onIce(from, m.d);
    else if (m.t === 'pts') {
      if (!canDrawAll && !isStaffUser(from)) return;
      let s = byId[m.id];
      if (!s) { s = { id: m.id, c: m.c, w: m.w, e: m.e, p: [] }; strokes.push(s); byId[m.id] = s; }
      const i = s.p.length; s.p.push(...m.p); drawFrom(s, i);
    } else if (m.t === 'clear' && isStaffUser(from)) { strokes = []; byId = {}; redraw(); }
    else if (m.t === 'lock' && isStaffUser(from)) { canDrawAll = m.v; $('vc-lock').checked = m.v; updateLock(); }
    else if (m.t === 'need') {
      const others = inCh(curCh).map(x => x.user_id).filter(id => id !== from).sort();
      if (others[0] === me().id && strokes.length) {
        let list = strokes.slice();
        while (JSON.stringify(list).length > 140000 && list.length > 1) list.shift();
        send({ t: 'board', to: from, strokes: list, v: canDrawAll });
      }
    } else if (m.t === 'board') {
      strokes = m.strokes; byId = Object.fromEntries(strokes.map(s => [s.id, s])); canDrawAll = m.v; updateLock(); redraw();
    }
  }

  // ---------- whiteboard ----------
  const canDraw = () => P().isStaff() || canDrawAll;
  const lw = s => (s.e ? s.w * 3 : s.w) * bw / 1000;
  function drawFrom(s, idx) {
    if (!ctx || !s.p.length) return;
    const pt = i => [s.p[i] * bw / 1000, s.p[i + 1] * bh / 1000];
    ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.globalCompositeOperation = s.e ? 'destination-out' : 'source-over';
    ctx.strokeStyle = ctx.fillStyle = s.c; ctx.lineWidth = lw(s);
    if (s.p.length === 2) { const [x, y] = pt(0); ctx.beginPath(); ctx.arc(x, y, lw(s) / 2, 0, 7); ctx.fill(); }
    else {
      ctx.beginPath(); let [x, y] = pt(Math.max(0, idx - 2)); ctx.moveTo(x, y);
      for (let i = Math.max(0, idx - 2) + 2; i < s.p.length; i += 2) { [x, y] = pt(i); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function redraw() { if (!ctx) return; ctx.clearRect(0, 0, bw, bh); strokes.forEach(s => drawFrom(s, 0)); }
  function resize() {
    const r = $('vc-board').getBoundingClientRect(); if (!r.width) return;
    const dpr = window.devicePixelRatio || 1; bw = r.width; bh = r.height;
    cv.width = bw * dpr; cv.height = bh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw();
  }
  function updateLock() { $('vc-locked').style.display = curCh && !canDraw() ? '' : 'none'; }
  function flushPts() {
    clearTimeout(timer); timer = null;
    if (sending && pend.length) { send({ t: 'pts', id: sending.id, c: sending.c, w: sending.w, e: sending.e, p: pend }); pend = []; }
  }
  function add(e) {
    const r = cv.getBoundingClientRect(), x = Math.round((e.clientX - r.left) / r.width * 1000), y = Math.round((e.clientY - r.top) / r.height * 1000);
    const i = sending.p.length; sending.p.push(x, y); pend.push(x, y); drawFrom(sending, i);
    if (!timer) timer = setTimeout(flushPts, 60);
  }
  function setupBoard() {
    cv = $('vc-canvas'); ctx = cv.getContext('2d');
    new ResizeObserver(resize).observe($('vc-board'));
    cv.addEventListener('pointerdown', e => {
      if (!room || !canDraw()) return;
      cv.setPointerCapture(e.pointerId); drawing = true;
      sending = { id: crypto.randomUUID().slice(0, 8), c: color, w: +$('vc-size').value, e: tool === 'eraser', p: [] };
      strokes.push(sending); byId[sending.id] = sending; if (strokes.length > 3000) strokes.shift(); add(e);
    });
    cv.addEventListener('pointermove', e => { if (drawing) add(e); });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { if (drawing) { flushPts(); drawing = false; } }));
    $('vc-colors').innerHTML = COLORS.map((c, i) => `<button class="dc-sw ${i === 0 ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour"></button>`).join('');
    $('vc-room').addEventListener('click', e => {
      const t = e.target.closest('[data-tool]'), c = e.target.closest('[data-color]');
      if (t) { tool = t.dataset.tool; document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b === t)); }
      if (c) { color = c.dataset.color; tool = 'pen'; document.querySelectorAll('[data-color]').forEach(b => b.classList.toggle('on', b === c)); document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === 'pen')); }
    });
    $('vc-clear').onclick = () => { if (!confirm('Clear the board for everyone?')) return; strokes = []; byId = {}; redraw(); send({ t: 'clear' }); };
    $('vc-lock').onchange = e => { canDrawAll = e.target.checked; send({ t: 'lock', v: canDrawAll }); updateLock(); };
    $('vc-save').onclick = () => {
      const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height;
      const c = t.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, t.width, t.height); c.drawImage(cv, 0, 0);
      const a = document.createElement('a'); a.href = t.toDataURL('image/png'); a.download = 'whiteboard.png'; a.click();
    };
  }

  // ---------- UI wiring ----------
  $('vc-list').addEventListener('click', async e => {
    const d = e.target.closest('[data-vcdel]'), j = e.target.closest('[data-join]');
    if (d) {
      e.stopPropagation(); const c = channels.find(x => x.id === d.dataset.vcdel);
      if (confirm(`Delete channel “${c.name}”?`)) { const r = await sb.from('voice_channels').delete().eq('id', c.id); r.error && P().toast(r.error.message); }
    } else if (j) join(j.dataset.join);
  });
  $('vc-add').onclick = async () => {
    const name = prompt('New voice channel name:'); if (!name || !name.trim()) return;
    const r = await sb.from('voice_channels').insert({ name: name.trim().slice(0, 40), position: channels.length });
    r.error && P().toast(r.error.message);
  };
  $('vc-mute').onclick = () => { if (deaf) deaf = false; muted = !muted; applyAudio(); };
  $('vc-deaf').onclick = () => { deaf = !deaf; applyAudio(); };
  $('vc-leave').onclick = leave;

  document.addEventListener('pz-lang', () => { if (lobby) { renderList(); renderTiles(); } });
  document.addEventListener('pz-ready', async () => {
    setupBoard(); await loadChannels();
    lobby = sb.channel('voice-lobby', { config: { presence: { key: me().id } } });
    lobby.on('presence', { event: 'sync' }, onSync).subscribe();
    sb.channel('voice-channels-db').on('postgres_changes', { event: '*', schema: 'public', table: 'voice_channels' }, loadChannels).subscribe();
  });
})();
