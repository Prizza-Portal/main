// Admin-only: reset a user's password or delete a user. Deploy with "Verify JWT" OFF (we check the admin ourselves).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return json({ error: 'Not signed in' }, 401);
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return json({ error: 'Admins only' }, 403);

  const { action, user_id, password } = await req.json();
  if (action === 'reset_password') {
    if (!password || String(password).length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);
    const { error } = await admin.auth.admin.updateUserById(user_id, { password });
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  if (action === 'delete_user') {
    if (user_id === user.id) return json({ error: "You can't delete yourself" }, 400);
    const { error } = await admin.auth.admin.deleteUser(user_id);
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  return json({ error: 'Unknown action' }, 400);
});
