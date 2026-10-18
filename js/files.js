// Files library with SPACES: "Shared with everyone", a whole school, or a single class. Private storage bucket.
(() => {
  const $ = id => document.getElementById(id), BUCKET = 'library', SK = 'prizza_files_scope';
  const P = () => window.PZ, esc = s => P().esc(s);
  let folders = [], files = [], cur = null, q = '', scopes = [], scope = { school: null, class: null }, moving = null;

  const card = 'p-5 rounded-2xl bg-white dark:bg-darkbg-card border border-hairline';
  const muted = 'text-xs text-charcoal-muted dark:text-darkbg-muted';
  const ICONS = [[/^pdf$/, 'fa-file-pdf text-red-600'], [/^(docx?|rtf|txt|odt)$/, 'fa-file-word text-blue-600'],
    [/^(xlsx?|csv|ods)$/, 'fa-file-excel text-green-600'], [/^(pptx?|odp)$/, 'fa-file-powerpoint text-orange-600'],
    [/^(png|jpe?g|gif|webp|svg)$/, 'fa-file-image text-purple-600'], [/^(mp4|mov|webm|mkv)$/, 'fa-file-video text-pink-600'],
    [/^(mp3|wav|m4a|ogg)$/, 'fa-file-audio text-teal-600'], [/^(zip|rar|7z)$/, 'fa-file-zipper text-amber-600']];
  const icon = n => (ICONS.find(([r]) => r.test((n.split('.').pop() || '').toLowerCase())) || [0, 'fa-file text-charcoal-muted'])[1];
  const size = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
  const folderOf = id => folders.find(f => f.id === id);
  const pathOf = id => { const parts = []; for (let f = folderOf(id); f; f = folderOf(f.parent_id)) parts.unshift(f.name); return parts.join(' / ') || 'All files'; };

  // ---- spaces (who can see / change what is ALSO enforced by the database) ----
  const key = s => `${s.school || ''}|${s.class || ''}`;
  const sameScope = x => (x.school_id || null) === scope.school && (x.class_id || null) === scope.class;
  const isAdmin = () => P().role === 'admin';
  const canWriteScope = s => isAdmin() || (P().role === 'teacher' && !!s.school && s.school === P().school);
  const canWriteItem = x => canWriteScope({ school: x.school_id || null, class: x.class_id || null });
  const canWriteHere = () => P().isStaff() && canWriteScope(scope);
  const scopeLabel = s => (scopes.find(x => key(x) === key(s)) || { label: 'Shared with everyone' }).label;

  async function buildScopes() {
    const [s, c] = await Promise.all([sb.from('schools').select('id,name').order('name'), sb.from('classes').select('id,name,school_id').order('name')]);
    const sch = (s.data || []).filter(x => isAdmin() || x.id === P().school), cls = c.data || [];
    scopes = [{ school: null, class: null, label: 'Shared with everyone' }];
    sch.forEach(x => {
      scopes.push({ school: x.id, class: null, label: `${x.name} (whole school)` });
      cls.filter(k => k.school_id === x.id).forEach(k => scopes.push({ school: x.id, class: k.id, label: `${x.name} — ${k.name}` }));
    });
    let saved = null; try { saved = localStorage.getItem(SK); } catch {}
    const mine = scopes.find(x => x.class && x.class === P().klass) || scopes.find(x => !x.class && x.school && x.school === P().school);
    scope = scopes.find(x => key(x) === saved) || mine || scopes[0];
  }
  function renderScope() {
    const sel = $('files-scope');
    sel.innerHTML = scopes.map(s => `<option value="${key(s)}" ${key(s) === key(scope) ? 'selected' : ''}>${esc(s.label)}</option>`).join('');
  }

  async function load() {
    const [f, fi] = await Promise.all([
      sb.from('folders').select('*').order('name'),
      sb.from('files').select('*').order('created_at', { ascending: false })]);
    if (f.error || fi.error) return P().toast((f.error || fi.error).message);
    folders = f.data; files = fi.data;
    if (cur && !folderOf(cur)) cur = null;
    render();
  }

  function render() {
    renderScope();
    $('files-staff-bar').style.display = canWriteHere() ? '' : 'none';

    const chain = []; for (let f = folderOf(cur); f; f = folderOf(f.parent_id)) chain.unshift(f);
    $('files-crumbs').innerHTML = q ? `<span class="${muted}">Search results for “${esc(q)}”</span>` :
      `<button data-open="" class="hover:underline"><i class="fa-solid fa-house text-xs"></i> ${esc(scopeLabel(scope))}</button>` +
      chain.map(f => `<i class="fa-solid fa-chevron-right text-[9px] opacity-50"></i><button data-open="${f.id}" class="hover:underline">${esc(f.name)}</button>`).join('');

    const subs = q ? [] : folders.filter(f => cur ? f.parent_id === cur : (!f.parent_id && sameScope(f)));
    const list = q ? files.filter(f => f.name.toLowerCase().includes(q)) : files.filter(f => cur ? f.folder_id === cur : (!f.folder_id && sameScope(f)));
    const moveBtn = (kind, x) => (canWriteItem(x) && !(kind === 'folder' ? x.parent_id : x.folder_id) && scopes.some(canWriteScope))
      ? `<button data-move="${kind}:${x.id}" aria-label="Move" class="text-xs p-1 opacity-70 hover:opacity-100"><i class="fa-solid fa-right-left"></i></button>` : '';

    $('files-folders').innerHTML = subs.map(f => {
      const n = files.filter(x => x.folder_id === f.id).length + folders.filter(x => x.parent_id === f.id).length;
      return `<div data-open="${f.id}" role="button" tabindex="0" class="${card} !p-4 cursor-pointer hover:border-britishNavy dark:hover:border-white transition-all flex items-center gap-3">
        <i class="fa-solid fa-folder text-3xl text-amber-500"></i>
        <div class="min-w-0 flex-grow"><p class="text-sm font-bold truncate">${esc(f.name)}</p><p class="${muted}">${n} item${n === 1 ? '' : 's'}</p></div>
        ${moveBtn('folder', f)}${canWriteItem(f) ? `<button data-fdel="${f.id}" aria-label="Delete folder" class="text-red-600 text-xs p-1"><i class="fa-solid fa-trash"></i></button>` : ''}</div>`;
    }).join('');

    $('files-list').innerHTML = list.map(f => `<div class="${card} !p-3.5 flex items-center gap-3">
      <i class="fa-solid ${icon(f.name)} text-xl w-6 text-center"></i>
      <div class="min-w-0 flex-grow"><p class="text-sm font-bold truncate">${esc(f.name)}</p>
        <p class="${muted}">${size(f.size || 0)} · ${P().fmt(f.created_at)}${q ? ' · ' + esc(pathOf(f.folder_id)) : ''}</p></div>
      <button data-view="${f.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-hairline">Open</button>
      <button data-dl="${f.id}" aria-label="Download" class="px-2.5 py-1.5 rounded-lg text-xs border border-hairline"><i class="fa-solid fa-download"></i></button>
      ${moveBtn('file', f)}${canWriteItem(f) ? `<button data-filedel="${f.id}" aria-label="Delete file" class="text-red-600 text-xs p-1"><i class="fa-solid fa-trash"></i></button>` : ''}</div>`).join('');

    if (!subs.length && !list.length)
      $('files-list').innerHTML = `<p class="${muted} py-6 text-center">${q ? 'No files match your search.' : canWriteHere() ? 'Empty folder — drag files here or use “Upload files”.' : 'Nothing here yet.'}</p>`;
  }

  async function signed(path, opts) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 120, opts);
    if (error) { P().toast(error.message); return null; }
    return data.signedUrl;
  }

  async function upload(list) {
    if (!canWriteHere() || !list.length) return;
    const ok = [], here = folderOf(cur) ? { school_id: folderOf(cur).school_id, class_id: folderOf(cur).class_id } : { school_id: scope.school, class_id: scope.class };
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      P().toast(`Uploading ${i + 1}/${list.length}: ${file.name}`);
      const path = `${cur || 'root'}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
      if (up.error) { P().toast(file.name + ': ' + up.error.message); continue; }
      const r = await sb.from('files').insert({ folder_id: cur, name: file.name, path, size: file.size, mime: file.type || null, ...here });
      if (r.error) { await sb.storage.from(BUCKET).remove([path]); P().toast(r.error.message); continue; }
      ok.push(file.name);
    }
    if (ok.length) {
      if ($('files-notify').checked)   // the notice (and its push) goes only to the same space as the files
        await sb.from('posts').insert({ kind: 'notice', title: 'New files: ' + (folderOf(cur)?.name || 'Library'),
          body: ok.slice(0, 5).join(', ') + (ok.length > 5 ? ` +${ok.length - 5} more` : ''), important: true, ...here });
      P().toast(`Uploaded ${ok.length} file${ok.length > 1 ? 's' : ''}`);
    }
    load();
  }

  async function deleteFolder(id) {
    const ids = new Set([id]);
    for (let grew = true; grew;) { grew = false; folders.forEach(f => { if (ids.has(f.parent_id) && !ids.has(f.id)) { ids.add(f.id); grew = true; } }); }
    const doomed = files.filter(f => ids.has(f.folder_id));
    if (!confirm(`Delete “${folderOf(id).name}” with ${ids.size - 1} subfolder(s) and ${doomed.length} file(s)? This can't be undone.`)) return;
    const r = await sb.from('folders').delete().eq('id', id);          // rows first: if the database says no, nothing is lost
    if (r.error) return P().toast(r.error.message);
    if (doomed.length) await sb.storage.from(BUCKET).remove(doomed.map(f => f.path));
    load();
  }

  // ---- events ----
  $('view-files').addEventListener('click', async e => {
    const t = s => e.target.closest(s);
    if (t('[data-fdel]')) return deleteFolder(t('[data-fdel]').dataset.fdel);
    if (t('[data-move]')) {
      moving = t('[data-move]').dataset.move.split(':');
      $('move-scope').innerHTML = scopes.filter(canWriteScope).map(s => `<option value="${key(s)}">${esc(s.label)}</option>`).join('');
      return $('move-modal').classList.remove('hidden');
    }
    if (t('[data-open]')) { cur = t('[data-open]').dataset.open || null; q = ''; $('files-search').value = ''; return render(); }
    const byId = id => files.find(f => f.id === id);
    if (t('[data-view]')) {
      const f = byId(t('[data-view]').dataset.view), w = window.open('about:blank', '_blank');
      const u = await signed(f.path);
      return u ? (w ? w.location.href = u : location.href = u) : w && w.close();
    }
    if (t('[data-dl]')) {
      const f = byId(t('[data-dl]').dataset.dl), u = await signed(f.path, { download: f.name });
      if (u) { const a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); }
    }
    if (t('[data-filedel]')) {
      const f = byId(t('[data-filedel]').dataset.filedel);
      if (!confirm(`Delete “${f.name}”?`)) return;
      const r = await sb.from('files').delete().eq('id', f.id);
      if (r.error) return P().toast(r.error.message);
      await sb.storage.from(BUCKET).remove([f.path]); load();
    }
  });
  $('files-scope').onchange = e => {
    scope = scopes.find(s => key(s) === e.target.value) || scopes[0]; cur = null; q = ''; $('files-search').value = '';
    try { localStorage.setItem(SK, key(scope)); } catch {}
    render();
  };
  $('move-cancel').onclick = () => $('move-modal').classList.add('hidden');
  $('move-save').onclick = async () => {
    const to = scopes.find(s => key(s) === $('move-scope').value); if (!moving || !to) return;
    const r = await sb.rpc('move_files_scope', { p_kind: moving[0], p_id: moving[1], p_school: to.school, p_class: to.class });
    if (r.error) return P().toast(r.error.message);
    $('move-modal').classList.add('hidden'); P().toast('Moved'); load();
  };
  $('files-search').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
  $('btn-newfolder').onclick = () => { $('folder-form').classList.toggle('hidden'); $('folder-name').focus(); };
  $('folder-form').onsubmit = async e => {
    e.preventDefault();
    const r = await sb.from('folders').insert({ name: $('folder-name').value.trim(), parent_id: cur, school_id: scope.school, class_id: scope.class });
    if (r.error) return P().toast(r.error.message);
    $('folder-name').value = ''; $('folder-form').classList.add('hidden'); load();
  };
  $('btn-upload').onclick = () => $('file-input').click();
  $('file-input').onchange = e => { upload([...e.target.files]); e.target.value = ''; };
  const zone = $('view-files');
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { if (canWriteHere()) { e.preventDefault(); zone.classList.add('drop-on'); } }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, () => zone.classList.remove('drop-on')));
  zone.addEventListener('drop', e => { if (canWriteHere()) { e.preventDefault(); upload([...e.dataTransfer.files]); } });

  document.addEventListener('pz-lang', () => (folders.length || files.length) && render());
  document.addEventListener('pz-ready', async () => {
    await buildScopes(); await load();
    sb.channel('library-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, load).subscribe();
  });
})();
