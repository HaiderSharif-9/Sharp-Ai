# Setting up accounts (Supabase) — do this once

Your app now has real accounts and chat history saved to a database instead
of just your browser. This part needs a few manual steps on your end since
it's tied to your own free Supabase account.

## 1. Create a Supabase project

1. Go to https://supabase.com, sign up (free, no card needed)
2. Click "New Project" — pick any name/password/region
3. Wait ~2 minutes for it to spin up

## 2. Run the database schema

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New query"
3. Open `supabase_schema.sql` (included in this project), copy all of it,
   paste it into the SQL editor, and click **Run**

This creates two tables: `profiles` (stores each user's name) and `messages`
(stores chat history) — both locked down so users can only ever see their
own data.

## 3. Get your API keys

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** and the **anon/public key**
3. Add them to your `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=paste_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_key_here
   ```

## 4. Turn on email/password sign-up

This is on by default in Supabase — no action needed. New users signing up
with email get a confirmation email automatically.

## 5. Turn on Google sign-in

1. In Supabase: **Authentication → Providers → Google**, toggle it on
2. You'll need a Google OAuth Client ID/Secret — Supabase's page links
   directly to Google Cloud Console with instructions for creating one
   (it's free)
3. Set the redirect URL Google asks for to:
   ```
   https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   ```
   (Supabase shows you your exact URL on that same settings page)

## 6. Restart your app

```bash
npm run dev
```

You should now be redirected to `/login` the first time you visit — sign up
with a name, email, and password (or click "Continue with Google"), and
you'll land back in the chat, saved under your account.

## What changed under the hood

- `/login` — sign in / sign up page
- `middleware.ts` — checks whether you're logged in on every request and
  redirects accordingly
- `lib/supabase/` — the client setup for talking to your database
- Chat history now lives in the `messages` table instead of localStorage,
  so it follows your account across devices/browsers
- Sharp now knows your name and will use it naturally in replies
