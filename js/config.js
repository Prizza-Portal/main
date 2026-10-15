// Fill these in (Supabase dashboard → Project Settings → API). The anon key is safe to expose;
// Row Level Security in schema.sql is what protects your data.
window.PRIZZA = {
  SUPABASE_URL: 'https://kweljsykfzapsyyjeifs.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_ZCygW1KhZV61Mrx7pWul9w_PcG154hI',
  VAPID_PUBLIC_KEY: 'BA1dueWNp8vbZlcaWLgzcpmv_B8grwxLMI9SvfoG2Sh6A7WdGdWB10DucN7qlDclEq8HtxJP42KMLpLmIl97HIU' // from: npx web-push generate-vapid-keys
};
window.sb = window.supabase.createClient(PRIZZA.SUPABASE_URL, PRIZZA.SUPABASE_ANON_KEY);

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(console.error));
}
