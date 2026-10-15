// Files library: folders + uploads (staff) and browsing/downloading (everyone). Uses a PRIVATE storage bucket.
(() => {
  const $ = id => document.getElementById(id), BUCKET = 'library';
  const P = () => window.PZ;
  let folders = [], files = [], cur = null, q = '';

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
  const esc = s => P().esc(s);

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
    const staff = P().isStaff();
    $('files-staff-bar').style.display = staff ? '' : 'none';

    const chain = []; for (let f = folderOf(cur); f; f = folderOf(f.parent_id)) chain.unshift(f);
    $('files-crumbs').innerHTML = q ? `<span class="${muted}">Search results for “${esc(q)}”</span>` :
      `<button data-open="" class="hover:underline"><i class="fa-solid fa-house text-xs"></i> All files</button>` +
      chain.map(f => `<i class="fa-solid fa-chevron-right text-[9px] opacity-50"></i><button data-open="${f.id}" class="hover:underline">${esc(f.name)}</button>`).join('');

    const subs = q ? [] : folders.filter(f => (f.parent_id || null) === cur);
    const list = q ? files.filter(f => f.name.toLowerCase().includes(q)) : files.filter(f => (f.folder_id || null) === cur);

    $('files-folders').innerHTML = subs.map(f => {
      const n = files.filter(x => x.folder_id === f.id).length + folders.filter(x => x.parent_id === f.id).length;
      return `<div data-open="${f.id}" role="button" tabindex="0" class="${card} !p-4 cursor-pointer hover:border-britishNavy dark:hover:border-white transition-all flex items-center gap-3">
        <i class="fa-solid fa-folder text-3xl text-amber-500"></i>
        <div class="min-w-0 flex-grow"><p class="text-sm font-bold truncate">${esc(f.name)}</p><p class="${muted}">${n} item${n === 1 ? '' : 's'}</p></div>
        ${staff ? `<button data-fdel="${f.id}" aria-label="Delete folder" class="text-red-600 text-xs p-1"><i class="fa-solid fa-trash"></i></button>` : ''}</div>`;
    }).join('');

    $('files-list').innerHTML = list.map(f => `<div class="${card} !p-3.5 flex items-center gap-3">
      <i class="fa-solid ${icon(f.name)} text-xl w-6 text-center"></i>
      <div class="min-w-0 flex-grow"><p class="text-sm font-bold truncate">${esc(f.name)}</p>
        <p class="${muted}">${size(f.size || 0)} · ${P().fmt(f.created_at)}${q ? ' · ' + esc(pathOf(f.folder_id)) : ''}</p></div>
      <button data-view="${f.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-hairline">Open</button>
      <button data-dl="${f.id}" aria-label="Download" class="px-2.5 py-1.5 rounded-lg text-xs border border-hairline"><i class="fa-solid fa-download"></i></button>
      ${staff ? `<button data-filedel="${f.id}" aria-label="Delete file" class="text-red-600 text-xs p-1"><i class="fa-solid fa-trash"></i></button>` : ''}</div>`).join('');

    if (!subs.length && !list.length)
      $('files-list').innerHTML = `<p class="${muted} py-6 text-center">${q ? 'No files match your search.' : staff ? 'Empty folder — drag files here or use “Upload files”.' : 'Nothing here yet.'}</p>`;
  }

  async function signed(path, opts) {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 120, opts);
    if (error) { P().toast(error.message); return null; }
    return data.signedUrl;
  }

  async function upload(list) {
    if (!P().isStaff() || !list.length) return;
    const ok = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      P().toast(`Uploading ${i + 1}/${list.length}: ${file.name}`);
      const path = `${cur || 'root'}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`;
      const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined });
      if (up.error) { P().toast(file.name + ': ' + up.error.message); continue; }
      const r = await sb.from('files').insert({ folder_id: cur, name: file.name, path, size: file.size, mime: file.type || null });
      if (r.error) { await sb.storage.from(BUCKET).remove([path]); P().toast(r.error.message); continue; }
      ok.push(file.name);
    }
    if (ok.length) {
      if ($('files-notify').checked)
        await sb.from('posts').insert({ kind: 'notice', title: 'New files: ' + (folderOf(cur)?.name || 'Library'),
          body: ok.slice(0, 5).join(', ') + (ok.length > 5 ? ` +${ok.length - 5} more` : ''), important: true });
      P().toast(`Uploaded ${ok.length} file${ok.length > 1 ? 's' : ''}`);
    }
    load();
  }

  async function deleteFolder(id) {
    const ids = new Set([id]);
    for (let grew = true; grew;) { grew = false; folders.forEach(f => { if (ids.has(f.parent_id) && !ids.has(f.id)) { ids.add(f.id); grew = true; } }); }
    const doomed = files.filter(f => ids.has(f.folder_id));
    if (!confirm(`Delete “${folderOf(id).name}” with ${ids.size - 1} subfolder(s) and ${doomed.length} file(s)? This can't be undone.`)) return;
    if (doomed.length) await sb.storage.from(BUCKET).remove(doomed.map(f => f.path));
    const r = await sb.from('folders').delete().eq('id', id);
    r.error ? P().toast(r.error.message) : load();
  }

  // ---- events ----
  $('view-files').addEventListener('click', async e => {
    const t = s => e.target.closest(s);
    if (t('[data-fdel]')) return deleteFolder(t('[data-fdel]').dataset.fdel);
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
      await sb.storage.from(BUCKET).remove([f.path]);
      const r = await sb.from('files').delete().eq('id', f.id);
      r.error ? P().toast(r.error.message) : load();
    }
  });
  $('files-search').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });
  $('btn-newfolder').onclick = () => { $('folder-form').classList.toggle('hidden'); $('folder-name').focus(); };
  $('folder-form').onsubmit = async e => {
    e.preventDefault();
    const r = await sb.from('folders').insert({ name: $('folder-name').value.trim(), parent_id: cur });
    if (r.error) return P().toast(r.error.message);
    $('folder-name').value = ''; $('folder-form').classList.add('hidden'); load();
  };
  $('btn-upload').onclick = () => $('file-input').click();
  $('file-input').onchange = e => { upload([...e.target.files]); e.target.value = ''; };
  const zone = $('view-files');
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { if (P().isStaff()) { e.preventDefault(); zone.classList.add('drop-on'); } }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, () => zone.classList.remove('drop-on')));
  zone.addEventListener('drop', e => { if (P().isStaff()) { e.preventDefault(); upload([...e.dataTransfer.files]); } });

  document.addEventListener('pz-ready', () => {
    load();
    sb.channel('library-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, load).subscribe();
  });
})();
