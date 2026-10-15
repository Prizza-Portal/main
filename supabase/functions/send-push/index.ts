// Sends a Web Push to every subscribed device when an IMPORTANT post is created.
// Triggered by a Database Webhook on INSERT into public.posts (see SETUP.md).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const views: Record<string, string> = { notice: 'news', assignment: 'assignments', resource: 'resources', blog: 'blog' };

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) return new Response('forbidden', { status: 403 });
  const { record } = await req.json();
  if (!record?.important) return new Response('skipped');

  const payload = JSON.stringify({
    title: (record.kind === 'assignment' ? 'New homework: ' : 'Prizza: ') + record.title,
    body: (record.body ?? '').slice(0, 140),
    url: `index.html?view=${views[record.kind] ?? 'dashboard'}`,
    tag: record.id,
  });
  const { data: subs } = await db.from('push_subscriptions').select('id, subscription');
  let sent = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    try { await webpush.sendNotification(s.subscription, payload); sent++; }
    catch (err) { if ([404, 410].includes(err.statusCode)) await db.from('push_subscriptions').delete().eq('id', s.id); }
  }));
  return new Response(JSON.stringify({ sent }));
});
