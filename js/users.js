// Admin-only user management: roles, password resets, removing accounts.
(() => {
  const $ = id => document.getElementById(id), P = () => window.PZ, esc = s => P().esc(s);
  let users = [], classes = [], q = '';
  const card = 'p-5 rounded-2xl bg-white dark:bg-darkbg-card border border-hairline';
  const muted = 'text-xs text-charcoal-muted dark:text-darkbg-muted';
  const btn = 'px-3 py-2 rounded-xl text-xs font-bold border border-hairline';

  async function load() {
    const [p, c] = await Promise.all([sb.from('profiles').select('*').order('created_at', { ascending: false }), sb.from('classes').select('id,name,school_id,schools(name)')]);
    if (p.error) return P().toast(p.error.message);
    users = p.data; classes = c.data || [];
    const opts = '<option value="">No class</option>' + classes.map(k => `<option value="${k.id}">${esc(k.schools?.name || '')} — ${esc(k.name)}</option>`).join('');
    $('ua-class').innerHTML = opts; render();
  }
  function render() {
    const list = users.filter(u => `${u.full_name} ${u.username}`.toLowerCase().includes(q));
    $('users-list').innerHTML = list.length ? list.map(u => {
      const you = u.id === P().me.id, tag = you ? `<span class="${muted}">(you)</span>` : '';
      return `<div class="${card} !p-3.5 flex flex-wrap items-center gap-3">
        <div class="min-w-0 flex-grow"><p class="text-sm font-bold truncate">${esc(u.full_name || u.username)} ${tag}</p>
          <p class="${muted}">@${esc(u.username || '')} · joined ${P().fmt(u.created_at)}</p></div>
        <select data-role="${u.id}" class="field !w-auto" ${you ? 'disabled' : ''}>${['student', 'teacher', 'admin'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
        <select data-class="${u.id}" class="field !w-auto"><option value="">No class</option>${classes.map(k => `<option value="${k.id}" ${u.class_id === k.id ? 'selected' : ''}>${esc(k.schools?.name || '')} — ${esc(k.name)}</option>`).join('')}</select>
        ${you ? '' : `<button data-reset="${u.id}" class="${btn}">Reset password</button><button data-deluser="${u.id}" class="${btn} text-red-600" aria-label="Delete user"><i class="fa-solid fa-trash"></i></button>`}</div>`;
    }).join('') : `<p class="${muted} py-6 text-center">No users found.</p>`;
  }

  async function call(body) {
    const { error } = await sb.functions.invoke('admin-users', { body });
    if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch {} P().toast(m); return false; }
    return true;
  }

  $('ua-toggle').onclick = () => $('ua-form').classList.toggle('hidden');
  $('ua-form').onsubmit = async e => {
    e.preventDefault();
    if (await call({ action: 'create_user', username: $('ua-user').value.trim(), full_name: $('ua-name').value.trim(), password: $('ua-pass').value, role: $('ua-role').value, class_id: $('ua-class').value || null })) {
      P().toast('Account created'); $('ua-form').reset(); $('ua-form').classList.add('hidden'); load();
    }
  };
  $('users-search').oninput = e => { q = e.target.value.trim().toLowerCase(); render(); };
  $('users-list').addEventListener('change', async e => {
    const cs = e.target.closest('[data-class]');
    if (cs) {
      const k = classes.find(x => x.id === cs.value);
      const r = await sb.from('profiles').update({ class_id: cs.value || null, school_id: k?.school_id || null }).eq('id', cs.dataset.class);
      r.error ? P().toast(r.error.message) : P().toast('Class updated'); return load();
    }
    const sel = e.target.closest('[data-role]'); if (!sel) return;
    const r = await sb.from('profiles').update({ role: sel.value }).eq('id', sel.dataset.role);
    r.error ? P().toast(r.error.message) : P().toast('Role updated — they need to refresh the site.');
    load();
  });
  $('users-list').addEventListener('click', async e => {
    const rs = e.target.closest('[data-reset]'), dl = e.target.closest('[data-deluser]');
    if (rs) {
      const pw = prompt('New password for this user (at least 8 characters):');
      if (pw && await call({ action: 'reset_password', user_id: rs.dataset.reset, password: pw })) P().toast('Password changed');
    }
    if (dl) {
      const u = users.find(x => x.id === dl.dataset.deluser);
      if (confirm(`Permanently delete ${u.full_name || u.username}? This can't be undone.`) && await call({ action: 'delete_user', user_id: u.id })) { P().toast('User deleted'); load(); }
    }
  });
  document.addEventListener('pz-lang', () => users.length && render());
  document.addEventListener('pz-ready', () => {
    if (P().role !== 'admin') return;
    $('nav-users').style.display = ''; load();
  });
})();
