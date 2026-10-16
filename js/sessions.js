// Live sessions: staff schedule them, everyone sees Live / Upcoming / Past based on the clock.
(() => {
  const $ = id => document.getElementById(id);
  const P = () => window.PZ;
  let rows = [], editing = null, att = new Set(), counts = {};

  const PLATFORMS = { zoom: ['Zoom', 'fa-video'], meet: ['Google Meet', 'fa-video'], teams: ['Microsoft Teams', 'fa-users'],
    youtube: ['YouTube Live', 'fa-brands fa-youtube'], other: ['Online', 'fa-link'] };
  const safe = u => /^https:\/\//i.test(u || '') ? u : '';
  const card = 'bg-white dark:bg-darkbg-card border border-hairline rounded-2xl';
  const muted = 'text-xs text-charcoal-muted dark:text-darkbg-muted';

  // Only YouTube (and links the admin marks as "Other") can be shown inside the site;
  // Zoom, Meet and Teams refuse to be embedded, so those open in a new tab / their app.
  function embedUrl(s) {
    const u = safe(s.link); if (!u) return null;
    if (s.platform === 'youtube') {
      const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/))([\w-]{11})/);
      return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null;
    }
    return s.platform === 'other' ? u : null;
  }
  const status = s => { const n = Date.now(); return n < +new Date(s.starts_at) ? 'upcoming' : n <= +new Date(s.ends_at) ? 'live' : 'past'; };
  const day = d => new Date(d).toLocaleDateString(I18N.locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const tm = d => new Date(d).toLocaleTimeString(I18N.locale() || [], { hour: 'numeric', minute: '2-digit' });

  function row(s, st) {
    const staff = P().isStaff(), [pName, pIcon] = PLATFORMS[s.platform] || PLATFORMS.other;
    const border = { live: 'border-s-green-500', upcoming: 'border-s-blue-500', past: 'border-s-orange-500' }[st];
    const badge = st === 'live' ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-600 text-white animate-pulse">● Live now</span>'
      : st === 'upcoming' ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">Upcoming</span>'
      : '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-darkbg-main dark:text-gray-300">Completed</span>';
    const btn = 'px-3 py-2 rounded-xl text-xs font-bold';
    const canJoin = st !== 'past' && safe(s.link);
    const present = st === 'past' && !staff ? (att.has(s.id) ? '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700"><i class="fa-solid fa-check"></i> Present</span>' : '<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">Absent</span>') : '';
    return `<article class="${card} border-s-4 ${border} p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
      <div class="md:w-44 shrink-0"><p class="text-sm font-bold"><i class="fa-regular fa-calendar text-xs me-1.5 opacity-60"></i>${day(s.starts_at)}</p>
        <p class="${muted} mt-0.5">${tm(s.starts_at)} – ${tm(s.ends_at)}</p></div>
      <div class="min-w-0 flex-grow"><h4 class="font-display text-lg font-bold">${P().esc(s.title)}</h4>
        <p class="${muted} mt-0.5"><i class="fa-solid ${pIcon} text-orange-500 me-1"></i>${pName}</p>
        ${s.description ? `<p class="${muted} mt-1 whitespace-pre-line">${P().esc(s.description)}</p>` : ''}</div>
      <div class="flex flex-wrap items-center gap-2">${badge}${present}
        ${canJoin && embedUrl(s) ? `<button data-watch="${s.id}" data-join="${s.id}" class="${btn} bg-britishNavy dark:bg-white text-white dark:text-britishNavy">Join in site</button>` : ''}
        ${canJoin ? `<a data-join="${s.id}" href="${P().esc(safe(s.link))}" target="_blank" rel="noopener" class="${btn} ${embedUrl(s) ? 'border border-hairline' : 'bg-britishNavy dark:bg-white text-white dark:text-britishNavy'}">${st === 'live' ? 'Join now' : 'Open link'} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>` : ''}
        ${staff ? `<button data-att="${s.id}" class="${btn} border border-hairline" aria-label="Attendance"><i class="fa-solid fa-user-check"></i> ${counts[s.id] || 0}</button>
        <button data-sedit="${s.id}" class="${btn} border border-hairline" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
        <button data-sdel="${s.id}" class="${btn} border border-hairline text-red-600" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>` : ''}</div>
    </article>`;
  }

  function render() {
    const g = { live: [], upcoming: [], past: [] };
    rows.forEach(s => g[status(s)].push(s));
    g.live.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    g.upcoming.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    g.past.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    const block = (title, list, st) => list.length ? `<div class="space-y-3"><h3 class="font-display text-lg font-bold">${title} <span class="${muted}">(${list.length})</span></h3>${list.slice(0, 40).map(s => row(s, st)).join('')}</div>` : '';
    $('sessions-container').innerHTML = block('Live now', g.live, 'live') + block('Upcoming sessions', g.upcoming, 'upcoming') + block('Past sessions', g.past, 'past')
      || `<p class="${muted} py-8 text-center">No sessions scheduled yet.</p>`;
    $('btn-newsession').style.display = P().isStaff() ? '' : 'none';
  }

  async function load() {
    const { data, error } = await sb.from('sessions').select('*').order('starts_at', { ascending: false });
    if (error) return P().toast(error.message);
    rows = data;
    const a = await sb.from('session_attendance').select('session_id,user_id');
    att = new Set(); counts = {};
    (a.data || []).forEach(x => { counts[x.session_id] = (counts[x.session_id] || 0) + 1; if (x.user_id === P().me.id) att.add(x.session_id); });
    render();
  }

  // datetime-local <-> ISO (admin types in their own timezone; every student sees it in theirs)
  const toLocalInput = iso => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  function openForm(s) {
    editing = s ? s.id : null;
    $('session-form-title').textContent = s ? 'Edit session' : 'New session';
    $('s-title').value = s?.title || ''; $('s-platform').value = s?.platform || 'zoom'; $('s-link').value = s?.link || '';
    $('s-start').value = s ? toLocalInput(s.starts_at) : ''; $('s-end').value = s ? toLocalInput(s.ends_at) : ''; $('s-desc').value = s?.description || '';
    $('s-notify-wrap').style.display = s ? 'none' : '';
    $('session-form').classList.remove('hidden'); $('s-title').focus();
  }
  const closeForm = () => { $('session-form').classList.add('hidden'); editing = null; };

  $('btn-newsession').onclick = () => openForm(null);
  $('s-cancel').onclick = closeForm;
  $('session-form').onsubmit = async e => {
    e.preventDefault();
    const row = { title: $('s-title').value.trim(), platform: $('s-platform').value, link: $('s-link').value.trim(),
      starts_at: new Date($('s-start').value).toISOString(), ends_at: new Date($('s-end').value).toISOString(), description: $('s-desc').value.trim() || null, reminded: false };
    if (!/^https:\/\//i.test(row.link)) return P().toast('The link must start with https://');
    if (row.ends_at <= row.starts_at) return P().toast('End time must be after the start time.');
    const r = editing ? await sb.from('sessions').update(row).eq('id', editing) : await sb.from('sessions').insert(row);
    if (r.error) return P().toast(r.error.message);
    if (!editing && $('s-notify').checked)
      await sb.from('posts').insert({ kind: 'notice', important: true, title: 'New session: ' + row.title,
        body: `${day(row.starts_at)}, ${tm(row.starts_at)} – ${tm(row.ends_at)}` });
    P().toast(editing ? 'Session updated' : 'Session scheduled'); closeForm(); load();
  };

  function closeMeeting() { $('meeting-frame').src = 'about:blank'; $('meeting-modal').classList.add('hidden'); $('meeting-modal').classList.remove('flex'); }
  $('meeting-close').onclick = closeMeeting;
  $('att-close').onclick = () => $('attendance-modal').classList.add('hidden');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMeeting(); });

  $('view-sessions').addEventListener('click', async e => {
    const t = s => e.target.closest(s), find = id => rows.find(x => x.id === id);
    if (t('[data-join]') && !P().isStaff()) {
      const id = t('[data-join]').dataset.join, s = find(id);
      if (s && status(s) === 'live' && !att.has(id)) { att.add(id); sb.from('session_attendance').insert({ session_id: id, user_id: P().me.id }); }
    }
    if (t('[data-att]')) {
      const s = find(t('[data-att]').dataset.att);
      $('att-title').textContent = 'Attendance — ' + s.title; $('att-list').innerHTML = '<p class="text-xs">Loading…</p>';
      $('attendance-modal').classList.remove('hidden');
      const { data, error } = await sb.from('session_attendance').select('joined_at, profiles(full_name, username)').eq('session_id', s.id).order('joined_at');
      $('att-list').innerHTML = error ? P().esc(error.message) : data.length ? data.map(r => `<div class="flex justify-between gap-3 p-2.5 rounded-xl border border-hairline"><span class="font-bold">${P().esc(r.profiles?.full_name || r.profiles?.username || 'Unknown')}</span><span class="${muted}">${tm(r.joined_at)}</span></div>`).join('') : '<p class="text-xs">Nobody joined while it was live.</p>';
    }
    if (t('[data-watch]')) {
      const s = find(t('[data-watch]').dataset.watch);
      $('meeting-title').textContent = s.title; $('meeting-ext').href = safe(s.link); $('meeting-frame').src = embedUrl(s);
      $('meeting-modal').classList.remove('hidden'); $('meeting-modal').classList.add('flex');
    }
    if (t('[data-sedit]')) openForm(find(t('[data-sedit]').dataset.sedit));
    if (t('[data-sdel]')) {
      const s = find(t('[data-sdel]').dataset.sdel);
      if (!confirm(`Delete “${s.title}”?`)) return;
      const r = await sb.from('sessions').delete().eq('id', s.id);
      r.error ? P().toast(r.error.message) : load();
    }
  });

  document.addEventListener('pz-lang', () => rows.length && render());
  document.addEventListener('pz-ready', () => {
    load();
    setInterval(render, 30000); // statuses flip automatically as time passes
    sb.channel('sessions-live').on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, load).subscribe();
  });
})();
