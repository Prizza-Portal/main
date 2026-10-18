// Prizza portal logic: Supabase data, roles, push notifications, PWA install.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const safeUrl = u => /^https?:\/\//i.test(u || '') ? esc(u) : '';
  const fmt = d => new Date(d).toLocaleDateString(I18N.locale(), { day: 'numeric', month: 'short', year: 'numeric' });

  let me, profile, posts = [], done = new Set(), prepFilter = 'all', resFilter = 'all', deferredInstall, schedFile;
  const isStaff = () => profile && ['teacher', 'admin'].includes(profile.role);

  function toast(t) {
    let el = $('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
    el.textContent = t; el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 4000);
  }

  // ---------- Rendering ----------
  const card = 'p-5 rounded-2xl bg-white dark:bg-darkbg-card border border-hairline';
  const muted = 'text-xs text-charcoal-muted dark:text-darkbg-muted';
  const chip = p => (isStaff() && window.SPACES && SPACES.labelOf(p)) ? `<span class="px-2 py-0.5 rounded-full border border-hairline text-[10px] font-bold">${esc(SPACES.labelOf(p))}</span>` : '';
  const imp = p => (p.important ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">Important</span>' : '') + chip(p);
  const del = p => isStaff() ? `<button data-del="${p.id}" class="text-[11px] font-bold text-red-600 hover:underline">Delete</button>` : '';
  const link = (p, label = 'Open link') => safeUrl(p.link) ? `<a href="${safeUrl(p.link)}" target="_blank" rel="noopener" class="text-xs font-bold text-britishNavy dark:text-white hover:underline">${label} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i></a>` : '';
  const when = p => `<span class="text-[11px] ${'text-charcoal-muted dark:text-darkbg-muted'}">${fmt(p.created_at)}</span>`;

  function prepCard(p) {
    const d = done.has(p.id);
    const over = p.due_date && !d && new Date(p.due_date) < new Date(new Date().toDateString());
    return `<article class="${card} flex items-start justify-between gap-4">
      <div class="space-y-1.5 min-w-0">
        <div class="flex items-center gap-2 flex-wrap"><h4 class="font-display text-lg font-bold ${d ? 'line-through opacity-60' : ''}">${esc(p.title)}</h4>${imp(p)}</div>
        <p class="${muted} whitespace-pre-line">${esc(p.body)}</p>
        ${p.due_date ? `<p class="text-[11px] font-bold ${over ? 'text-red-600' : 'text-charcoal-muted dark:text-darkbg-muted'}"><i class="fa-regular fa-clock"></i> Due ${fmt(p.due_date)}${over ? ' · Overdue' : ''}</p>` : ''}
        <div class="flex gap-4">${link(p)}${del(p)}</div>
      </div>
      <button data-done="${p.id}" class="shrink-0 px-3 py-2 rounded-xl text-xs font-bold border border-hairline ${d ? 'bg-britishNavy text-white' : ''}">${d ? 'Submitted' : 'Mark done'}</button>
    </article>`;
  }
  const noticeCard = p => `<article class="${card} ${p.important ? 'border-s-4 !border-s-amber-600' : ''} space-y-1.5">
      <div class="flex items-center justify-between gap-2"><div class="flex items-center gap-2 flex-wrap"><h4 class="font-display text-lg font-bold">${esc(p.title)}</h4>${imp(p)}</div>${when(p)}</div>
      <p class="${muted} whitespace-pre-line">${esc(p.body)}</p><div class="flex gap-4">${link(p)}${del(p)}${isStaff() ? `<button data-wacopy="${p.id}" class="text-[11px] font-bold text-green-700 hover:underline"><i class="fa-brands fa-whatsapp"></i> Copy for WhatsApp</button>` : ''}</div></article>`;
  const blogCard = p => `<article class="${card} space-y-2">${when(p)}<h4 class="font-display text-xl font-bold">${esc(p.title)}</h4>
      <p class="text-sm text-charcoal-muted dark:text-gray-300 whitespace-pre-line">${esc(p.body)}</p><div class="flex gap-4">${link(p, 'Read more')}${del(p)}</div></article>`;
  const resCard = p => `<article class="${card} flex gap-4 items-start">
      <i class="fa-solid ${/youtu|vimeo/i.test(p.link || '') ? 'fa-circle-play' : 'fa-file-lines'} text-2xl text-britishNavy dark:text-white mt-1"></i>
      <div class="space-y-1 min-w-0"><h4 class="font-display text-lg font-bold">${esc(p.title)}</h4><p class="${muted}">${esc(p.body)}</p><div class="flex gap-4">${link(p, 'Open')}${del(p)}</div></div></article>`;

  const fill = (id, arr, empty) => $(id).innerHTML = arr.length ? arr.join('') : `<p class="${muted}">${empty}</p>`;

  function render() {
    const by = k => posts.filter(p => p.kind === k);
    const as = by('assignment'), pending = as.filter(p => !done.has(p.id)), notices = by('notice'), res = by('resource');
    $('stat-pending-count').textContent = $('badge-prep-count').textContent = pending.length;
    $('stat-notices-count').textContent = $('badge-news-count').textContent = notices.length;
    $('stat-resources-count').textContent = res.length;
    fill('dash-prep-container', pending.slice(0, 4).map(prepCard), 'Nothing pending — nice work!');
    const list = prepFilter === 'pending' ? pending : prepFilter === 'submitted' ? as.filter(p => done.has(p.id)) : as;
    fill('prep-list-container', list.map(prepCard), 'No tasks here yet.');
    const rl = res.filter(p => resFilter === 'all' || (resFilter === 'video') === /youtu|vimeo/i.test(p.link || ''));
    fill('resources-grid-container', rl.map(resCard), 'No resources yet.');
    fill('notices-timeline-container', notices.map(noticeCard), 'No notices yet.');
    fill('blog-grid-container', by('blog').map(blogCard), 'No blog posts yet.');
  }

  async function load() {
    const [p, s, st] = await Promise.all([
      sb.from('posts').select('*').order('created_at', { ascending: false }).limit(200),
      sb.from('submissions').select('post_id'),
      sb.from('settings').select('value').eq('key', 'schedule_image').maybeSingle()
    ]);
    if (p.error) return toast(p.error.message);
    posts = p.data; done = new Set((s.data || []).map(x => x.post_id));
    if (st.data?.value) $('schedule-image-display').src = st.data.value;
    render();
  }

  // ---------- Filters ----------
  const ACT = 'px-3.5 py-2 text-xs font-bold rounded-xl border border-hairline bg-paper-100 dark:bg-darkbg-card text-charcoal dark:text-white';
  const OFF = 'px-3.5 py-2 text-xs font-bold rounded-xl border border-transparent text-charcoal-muted hover:text-charcoal dark:hover:text-white';
  const mark = (cls, key) => document.querySelectorAll('.' + cls).forEach(b => b.className = (b.getAttribute('onclick').includes(`'${key}'`) ? ACT : OFF) + ' ' + cls);
  window.filterPrep = k => { prepFilter = k; mark('prep-filter', k); render(); };
  window.filterResources = k => { resFilter = k; mark('res-filter', k); render(); };

  // ---------- Clicks: mark done / delete ----------
  document.addEventListener('click', async e => {
    const w = e.target.closest('[data-wacopy]');
    if (w) {
      const p = posts.find(z => z.id === w.dataset.wacopy);
      const text = `*${p.title}*\n${p.body || ''}${p.link ? '\n' + p.link : ''}`.trim();
      try { await navigator.clipboard.writeText(text); toast('Copied — paste it into your WhatsApp channel'); } catch { toast('Could not copy automatically.'); }
    }
    const d = e.target.closest('[data-done]'), x = e.target.closest('[data-del]');
    if (d) {
      const id = d.dataset.done;
      const r = done.has(id)
        ? await sb.from('submissions').delete().eq('post_id', id).eq('user_id', me.id)
        : await sb.from('submissions').insert({ post_id: id, user_id: me.id });
      if (r.error) return toast(r.error.message);
      done.has(id) ? done.delete(id) : done.add(id); render();
    }
    if (x && confirm('Delete this post?')) {
      const r = await sb.from('posts').delete().eq('id', x.dataset.del);
      r.error ? toast(r.error.message) : load();
    }
  });

  // ---------- Staff: new post + schedule image ----------
  window.openPostModal = async () => {
    await SPACES.load(); const mine = SPACES.mine();
    $('post-space').innerHTML = SPACES.options(SPACES.canWriteScope(mine) ? SPACES.key(mine) : '');
    $('post-modal').classList.remove('hidden');
  };
  window.closePostModal = () => $('post-modal').classList.add('hidden');
  window.submitPost = async e => {
    e.preventDefault();
    const f = e.target, g = n => f.elements[n];
    const row = { kind: g('kind').value, title: g('title').value.trim(), body: g('body').value.trim() || null,
      link: g('link').value.trim() || null, due_date: g('due').value || null, important: g('important').checked, ...SPACES.parse(g('space').value) };
    if (!g('space').value) return toast('You need a school or class assigned before you can post here. Ask an admin.');
    const { error } = await sb.from('posts').insert(row);
    if (error) return toast(error.message);
    f.reset(); closePostModal(); toast(row.important ? 'Posted — notifying everyone' : 'Posted');
  };

  const origSelect = handleCalendarFileSelect;
  window.handleCalendarFileSelect = e => { schedFile = e.target.files[0]; origSelect(e); };
  window.saveUploadedCalendarImg = async () => {
    if (!schedFile) return;
    const path = `schedule/${Date.now()}-${schedFile.name.replace(/[^\w.-]/g, '_')}`;
    const up = await sb.storage.from('files').upload(path, schedFile);
    if (up.error) return toast(up.error.message);
    const url = sb.storage.from('files').getPublicUrl(path).data.publicUrl;
    const r = await sb.from('settings').upsert({ key: 'schedule_image', value: url });
    if (r.error) return toast(r.error.message);
    $('schedule-image-display').src = url; closeUploaderModal(); toast('Schedule published');
  };

  // ---------- Account + mobile sidebar ----------
  window.openAuthModal = async () => {
    if (confirm(`Signed in as ${me?.email.split('@')[0]}.\n\nSign out?`)) { await sb.auth.signOut(); location.replace('login.html'); }
  };
  const origCollapse = toggleSidebarCollapse, origView = switchView;
  // Phone menu: slide-out sidebar with a dark backdrop. (The old close-on-any-click handler fired on the
  // menu button itself, because the header sits inside the page wrapper, so the menu opened and shut instantly.)
  const setMenu = open => { $('sidebar').classList.toggle('open', open); $('sidebar-backdrop').classList.toggle('hidden', !open); };
  window.toggleSidebarCollapse = () => innerWidth < 768 ? setMenu(!$('sidebar').classList.contains('open')) : origCollapse();
  window.switchView = v => { origView(v); setMenu(false); };
  $('sidebar-backdrop').addEventListener('click', () => setMenu(false));
  addEventListener('resize', () => { if (innerWidth >= 768) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Push notifications ----------
  const pushOK = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const b64 = s => { const r = atob((s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r], c => c.charCodeAt(0)); };
  const getSub = async () => pushOK ? (await navigator.serviceWorker.ready).pushManager.getSubscription() : null;

  async function refreshBell() {
    const on = pushOK && Notification.permission === 'granted' && !!(await getSub());
    $('btn-notify').querySelector('.nav-text').textContent = on ? 'Notifications on' : 'Enable notifications';
    $('btn-notify').querySelector('i').className = (on ? 'fa-solid' : 'fa-regular') + ' fa-bell w-5 text-center';
    $('btn-notify').dataset.on = on ? '1' : '';
  }
  window.toggleNotifications = async () => {
    if (!pushOK) return toast('Not supported here. On iPhone: Share → Add to Home Screen, then open the app and try again.');
    const reg = await navigator.serviceWorker.ready;
    if ($('btn-notify').dataset.on) {
      const s = await reg.pushManager.getSubscription();
      if (s) { await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint); await s.unsubscribe(); }
      toast('Notifications turned off'); return refreshBell();
    }
    if (await Notification.requestPermission() !== 'granted') return toast('Notifications are blocked — allow them in your browser/site settings.');
    try {
      const s = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(PRIZZA.VAPID_PUBLIC_KEY) });
      const { error } = await sb.from('push_subscriptions').upsert({ user_id: me.id, endpoint: s.endpoint, subscription: s.toJSON() }, { onConflict: 'endpoint' });
      if (error) throw error;
      toast('Notifications enabled!');
    } catch (err) { toast('Could not enable notifications: ' + err.message); }
    refreshBell();
  };

  // ---------- Install as app ----------
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (!standalone) $('btn-install').style.display = '';
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  addEventListener('appinstalled', () => { $('btn-install').style.display = 'none'; toast('Prizza installed!'); });
  window.installApp = async () => {
    if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
    else toast('iPhone/iPad: tap Share → Add to Home Screen. Desktop/Android: use the install icon in the address bar or browser menu.');
  };

  document.addEventListener('pz-lang', () => { if (me) { render(); refreshBell(); } });
  document.addEventListener('pz-spaces', () => { if (me && posts.length) render(); });
  window.PZ = { isStaff, esc, toast, fmt, get me() { return me; }, get role() { return profile?.role; }, get school() { return profile?.school_id || null; }, get klass() { return profile?.class_id || null; }, get name() { return profile?.full_name || me.email.split('@')[0]; } };

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return location.replace('login.html');
    me = session.user;
    const { data } = await sb.from('profiles').select('*').eq('id', me.id).maybeSingle();
    profile = data || { role: 'student', full_name: me.email.split('@')[0] };
    $('user-display-name').textContent = profile.full_name || me.email.split('@')[0];
    $('user-display-role').textContent = profile.role[0].toUpperCase() + profile.role.slice(1) + ' Account';
    if (isStaff()) { $('btn-newpost').style.display = ''; $('admin-upload-wrap').classList.remove('hidden'); }
    await load(); refreshBell();
    document.dispatchEvent(new Event('pz-ready'));
    const v = new URLSearchParams(location.search).get('view');
    if (v && $('view-' + v)) switchView(v);

    // Live updates while the app is open
    sb.channel('posts-live').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, p => {
      if (p.eventType === 'INSERT' && p.new.important) toast('New: ' + p.new.title);
      load();
    }).subscribe();
  });
})();
