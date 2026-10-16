// WhatsApp channel link: staff set the invite link once; everyone gets a "Join" button.
(() => {
  const $ = id => document.getElementById(id), P = () => window.PZ;
  const ok = u => /^https:\/\/(chat\.whatsapp\.com|whatsapp\.com\/channel|www\.whatsapp\.com\/channel|wa\.me)\//i.test(u || '');
  let url = '';

  function paint() {
    $('btn-wa').style.display = ok(url) ? '' : 'none';
    if (ok(url)) $('btn-wa').href = url;
    $('btn-wa-edit').style.display = P().isStaff() ? '' : 'none';
  }
  async function load() {
    const { data } = await sb.from('settings').select('value').eq('key', 'whatsapp_channel').maybeSingle();
    url = data?.value || ''; paint();
  }
  $('btn-wa-edit').onclick = async () => {
    const v = prompt('Paste your WhatsApp channel invite link (https://whatsapp.com/channel/…). Leave empty to remove it.', url);
    if (v === null) return;
    const clean = v.trim();
    if (clean && !ok(clean)) return P().toast("That doesn't look like a WhatsApp invite link.");
    const r = await sb.from('settings').upsert({ key: 'whatsapp_channel', value: clean });
    if (r.error) return P().toast(r.error.message);
    url = clean; paint(); P().toast('WhatsApp link saved');
  };
  document.addEventListener('pz-ready', load);
})();
