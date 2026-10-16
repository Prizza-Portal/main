// Admin-only: schools, classes and class codes. Codes are generated in the database and shown ONCE;
// only a hash is stored, so a code can never be looked up again.
(() => {
  const $ = id => document.getElementById(id), P = () => window.PZ, esc = s => P().esc(s);
  let schools = [], classes = [], codes = [];
  const muted = 'text-xs text-charcoal-muted dark:text-darkbg-muted';
  const btn = 'px-3 py-2 rounded-xl text-xs font-bold border border-hairline';
  const sName = id => schools.find(s => s.id === id)?.name || '?';
  const status = k => k.revoked ? 'Revoked' : new Date(k.expires_at) < new Date() ? 'Expired' : k.uses >= k.max_uses ? 'Full' : 'Active';

  async function load() {
    const [s, c, k] = await Promise.all([
      sb.from('schools').select('*').order('name'),
      sb.from('classes').select('*').order('name'),
      sb.from('signup_codes').select('id,label,hint,school_id,class_id,max_uses,uses,expires_at,revoked,created_at').order('created_at', { ascending: false })]);
    const err = s.error || c.error || k.error; if (err) return P().toast(err.message);
    schools = s.data; classes = c.data; codes = k.data; render();
  }

  function render() {
    $('school-list').innerHTML = schools.length ? schools.map(s => `<div class="rounded-xl border border-hairline p-3 space-y-2">
        <div class="flex items-center justify-between gap-2"><b class="text-sm">${esc(s.name)}</b>
          <button data-delschool="${s.id}" class="text-red-600 text-xs" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></div>
        <div class="flex flex-wrap gap-1.5">${classes.filter(c => c.school_id === s.id).map(c =>
          `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold border border-hairline">${esc(c.name)} <button data-delclass="${c.id}" class="opacity-60 hover:opacity-100" aria-label="Delete">✕</button></span>`).join('')}</div>
        <form data-addclass="${s.id}" class="flex gap-2"><input required maxlength="60" placeholder="New class name (e.g. Year 9A)" class="field"><button class="${btn}">Add class</button></form>
      </div>`).join('') : `<p class="${muted}">No schools yet — add one first.</p>`;

    $('code-class').innerHTML = classes.length ? classes.map(c => `<option value="${c.id}">${esc(sName(c.school_id))} — ${esc(c.name)}</option>`).join('') : '<option value="">Create a class first.</option>';

    $('code-list').innerHTML = codes.length ? codes.map(k => {
      const st = status(k), ok = st === 'Active';
      const col = ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
      return `<div class="rounded-xl border border-hairline p-3 flex flex-wrap items-center gap-3">
        <div class="min-w-0 flex-grow"><p class="text-sm font-bold truncate">${esc(k.label || '—')} <span class="${muted}" dir="ltr">••••${esc(k.hint)}</span></p>
          <p class="${muted}">${esc(sName(k.school_id))} — ${esc(classes.find(c => c.id === k.class_id)?.name || '?')} · ${k.uses}/${k.max_uses} used · Expires ${P().fmt(k.expires_at)}</p></div>
        <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${col}">${st}</span>
        ${ok ? `<button data-revoke="${k.id}" class="${btn}">Revoke</button>` : ''}
        <button data-delcode="${k.id}" class="${btn} text-red-600" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></div>`;
    }).join('') : `<p class="${muted}">No codes yet.</p>`;
  }

  $('school-form').onsubmit = async e => {
    e.preventDefault();
    const r = await sb.from('schools').insert({ name: $('school-name').value.trim() });
    if (r.error) return P().toast(r.error.message);
    $('school-name').value = ''; load();
  };
  $('school-list').addEventListener('submit', async e => {
    const f = e.target.closest('[data-addclass]'); if (!f) return; e.preventDefault();
    const r = await sb.from('classes').insert({ school_id: f.dataset.addclass, name: f.querySelector('input').value.trim() });
    r.error ? P().toast(r.error.message) : load();
  });
  $('code-form').onsubmit = async e => {
    e.preventDefault();
    if (!$('code-class').value) return P().toast('Create a class first.');
    const { data, error } = await sb.rpc('create_signup_code', { p_label: $('code-label').value.trim() || null, p_class: $('code-class').value, p_max: +$('code-max').value, p_days: +$('code-days').value });
    if (error) return P().toast(error.message);
    $('code-value').textContent = data.match(/.{4}/g).join('-');
    $('code-new').classList.remove('hidden'); $('code-label').value = ''; P().toast('Code created'); load();
  };
  $('code-copy').onclick = async () => { try { await navigator.clipboard.writeText($('code-value').textContent); P().toast('Copied'); } catch {} };
  $('code-done').onclick = () => { $('code-value').textContent = ''; $('code-new').classList.add('hidden'); };

  $('view-setup').addEventListener('click', async e => {
    const t = s => e.target.closest(s); let r;
    if (t('[data-delschool]')) {
      const s = schools.find(x => x.id === t('[data-delschool]').dataset.delschool);
      if (confirm(`Delete school “${s.name}” and all its classes and codes?`)) r = await sb.from('schools').delete().eq('id', s.id); else return;
    } else if (t('[data-delclass]')) {
      const c = classes.find(x => x.id === t('[data-delclass]').dataset.delclass);
      if (confirm(`Delete class “${c.name}” and its codes?`)) r = await sb.from('classes').delete().eq('id', c.id); else return;
    } else if (t('[data-revoke]')) {
      if (confirm('Revoke this code?')) r = await sb.from('signup_codes').update({ revoked: true }).eq('id', t('[data-revoke]').dataset.revoke); else return;
    } else if (t('[data-delcode]')) {
      if (confirm('Delete this code?')) r = await sb.from('signup_codes').delete().eq('id', t('[data-delcode]').dataset.delcode); else return;
    } else return;
    r.error ? P().toast(r.error.message) : load();
  });

  document.addEventListener('pz-lang', () => schools.length && render());
  document.addEventListener('pz-ready', () => { if (P().role !== 'admin') return; $('nav-setup').style.display = ''; load(); });
})();
