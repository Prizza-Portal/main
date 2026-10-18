// Shared helper: the "spaces" a person can send content to (everyone / a school / a class).
// The database enforces who can see and change what — this only builds the pickers.
(() => {
  const P = () => window.PZ;
  let list = [], loading = null;
  const key = s => `${s.school || ''}|${s.class || ''}`;
  async function build() {
    const [s, c] = await Promise.all([sb.from('schools').select('id,name').order('name'), sb.from('classes').select('id,name,school_id').order('name')]);
    const sch = (s.data || []).filter(x => P().role === 'admin' || x.id === P().school), cls = c.data || [];
    list = [{ school: null, class: null, label: 'Shared with everyone' }];
    sch.forEach(x => {
      list.push({ school: x.id, class: null, label: `${x.name} (whole school)` });
      cls.filter(k => k.school_id === x.id).forEach(k => list.push({ school: x.id, class: k.id, label: `${x.name} — ${k.name}` }));
    });
    document.dispatchEvent(new Event('pz-spaces'));
    return list;
  }
  const canWriteScope = s => P().role === 'admin' || (P().role === 'teacher' && !!s.school && s.school === P().school);
  window.SPACES = {
    key, canWriteScope,
    load: () => loading || (loading = build()),
    get list() { return list; },
    labelOf: x => (list.find(s => key(s) === key({ school: x.school_id || null, class: x.class_id || null })) || {}).label || '',
    parse: v => { const [a, b] = String(v || '|').split('|'); return { school_id: a || null, class_id: b || null }; },
    mine: () => list.find(s => s.class && s.class === P().klass) || list.find(s => !s.class && s.school && s.school === P().school) || list[0],
    options(selected) { return list.filter(canWriteScope).map(s => `<option value="${key(s)}" ${key(s) === selected ? 'selected' : ''}>${P().esc(s.label)}</option>`).join(''); },
  };
  document.addEventListener('pz-ready', () => window.SPACES.load());
})();
