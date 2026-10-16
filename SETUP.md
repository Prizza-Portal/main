# Prizza setup (Supabase + notifications + installable app)

## 1. Supabase project
1. Create a free project at supabase.com.
2. **SQL Editor** → paste all of `supabase/schema.sql` → Run. (Creates tables, security rules, storage bucket.)
3. **Project Settings → API**: copy the *Project URL* and *anon public key* into `js/config.js`.
4. **Authentication → URL Configuration**: set *Site URL* to your hosted site address.
   **Required:** Authentication → Sign In / Providers → Email: keep the provider ENABLED, turn OFF "Confirm email".

## 2. Make yourself admin
Sign up on `login.html`, then run in the SQL Editor (use your email):
`update profiles set role = 'admin' where id = (select id from auth.users where email = 'yourusername@prizza.app');`
Promote helpers the same way with `role = 'teacher'` (teachers and admins can post; students can only read and mark homework done).

## 3. Push notifications
1. Generate keys: `npx web-push generate-vapid-keys`. (Already done for you: the public key is in `js/config.js`).
2. Install the Supabase CLI, then from this folder:
   ```
   supabase login && supabase link --project-ref YOUR_REF
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com WEBHOOK_SECRET=pick-a-long-random-string
   supabase functions deploy send-push --no-verify-jwt
   ```
3. Dashboard → **Database → Webhooks → Create**: table `posts`, event **Insert**, type *HTTP Request* (POST) to
   `https://YOUR_REF.supabase.co/functions/v1/send-push`, with header `x-webhook-secret: <same secret>`.

Now every post published with "Important" ticked pushes to all subscribed devices, even when the app is closed.

## 4. Host it (HTTPS is required for install + push)
Upload the whole `prizza` folder to Netlify, Vercel, Cloudflare Pages or GitHub Pages. Keep `sw.js` and `manifest.webmanifest` in the root.

## 5. Using it
- **Install**: Android/desktop Chrome/Edge → "Install app" button (or address-bar icon). iPhone → Share → Add to Home Screen.
- **Notifications**: each user taps "Enable notifications" once. On iPhone this only works after installing to the Home Screen (iOS 16.4+).

## Files library
Run `supabase/files.sql` in the SQL Editor once. Staff see "New folder" / "Upload files" in the Files tab; students can browse, open and download.
Free Supabase plan limit: 50 MB per file (Storage → Settings).

## Real Android app (optional)
Host the site first, then go to pwabuilder.com, enter your site URL and choose Android — it produces an APK/AAB you can install or publish on Google Play. iOS needs a Mac + Apple Developer account ($99/yr).

## Sessions page
Run `supabase/sessions.sql` once. Staff add sessions (name, platform, link, start/end); students automatically see Live / Upcoming / Past by the clock.
Zoom, Google Meet and Teams cannot be embedded in other sites, so they open in a new tab/app. YouTube Live links play inside the site.

## Quizzes, attendance, Users page, reminders
1. SQL Editor → run `supabase/extras.sql` once (if `pg_cron` errors: Database → Extensions → enable `pg_cron`, then run again).
2. Users page (reset password / delete): Edge Functions → Deploy a new function → name `admin-users` → paste `supabase/functions/admin-users/index.ts` → turn **Verify JWT** OFF → Deploy. (Role changes work without it.)
3. Reminders: every minute the database checks for sessions starting within 15 minutes and posts an important notice, which your existing push setup sends to everyone. Push notifications must already be set up (section 3).

## Voice Rooms
Run `supabase/voice.sql` once. Audio goes directly between browsers (WebRTC); Supabase Realtime carries presence, signalling and whiteboard strokes.
- Needs HTTPS (or localhost) for the microphone. Up to 8 people per channel.
- Some school/mobile networks block direct connections. If someone can join but can't hear anyone, add a free TURN relay (e.g. Metered): put it in `js/config.js` as
  `ICE_SERVERS: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:YOUR-TURN-HOST', username: '...', credential: '...' }]` inside `window.PRIZZA`.

## Class codes (signup protection) — run `supabase/class_codes.sql`
1. SQL Editor → run `supabase/class_codes.sql` once (after `extras.sql`).
2. Re-deploy the `admin-users` edge function with the new `index.ts` (adds "Create account" without a code).
3. Authentication → Sign In / Providers → Email: set **Minimum password length** to 8. Keep "Allow new users to sign up" ON — the database trigger is what enforces the code.
4. Optional but recommended: Authentication → Attack protection → enable CAPTCHA.
5. Sign in as admin → **School setup**: add a school, add classes, then **Generate code**. Copy it immediately — only a hash is stored, so it can never be shown again. Give each class its own code.
Students enter the code on the Sign up tab. Admins create teacher/admin accounts from **Users → Create account** (no code needed).
Note: adding a user from the Supabase dashboard's "Add user" button will be rejected by the gate — use Users → Create account instead.
