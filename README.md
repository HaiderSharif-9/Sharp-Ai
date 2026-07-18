# Sharp

A personal AI assistant built by Haider — chat, image generation, voice
input/output, file & image understanding, and real accounts with saved
conversation history, all running on free-tier services.

## Features

- 💬 Chat, powered by Groq's free API
- 🖼️ Image generation — type `/image a description`
- 📎 Attach images or text files (`.txt`, `.md`, `.csv`, `.json`) for Sharp to read
- 👁️ Vision — attach a photo and ask Sharp about it (auto-switches to a vision model)
- 🎤 Voice input (speak instead of typing) and 🔊 spoken replies — built into the browser, free
- 👤 Real accounts — email/password or Google sign-in
- 🗂️ Multiple saved conversations with a sidebar, like ChatGPT/Claude
- 🕐 Sharp knows the current date/time in *your* timezone, not the server's

## Tech stack

- **Next.js** (App Router) + **Tailwind CSS** — frontend
- **Groq API** — the language model (`openai/gpt-oss-120b`) and vision model (`qwen/qwen3.6-27b`)
- **Supabase** — auth (email/password + Google) and Postgres database for chat history
- **Pollinations.ai** — image generation, no key required

Everything runs on free tiers. No paid services required.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Groq API key

https://console.groq.com/keys — free, no card required.

### 3. Set up Supabase (accounts + saved chats)

Follow **`SUPABASE_SETUP.md`** in this repo — it walks through creating a
free Supabase project, running the database schema, and enabling Google
sign-in. Takes about 10 minutes, one-time setup.

### 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in:
```
GROQ_API_KEY=your_groq_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

### 5. Run it

```bash
npm run dev
```

Open http://localhost:3000 — you'll land on the login page first.

## Project structure

```
app/
  page.tsx              main chat UI (sidebar, messages, input, voice)
  login/page.tsx         sign in / sign up page
  api/chat/route.ts      calls Groq, injects Sharp's personality + current time
  auth/callback/route.ts  handles the Google OAuth redirect
  globals.css             visual design system (colors, the "cut corner" style)
lib/supabase/            Supabase client setup (browser + server)
middleware.ts             keeps auth sessions fresh, protects the chat page
supabase_schema.sql        database schema — run once in Supabase's SQL editor
supabase_migration_conversations.sql   adds multi-conversation support
```

## Deploying

Push to GitHub, then import the repo at https://vercel.com (free tier). Add
the same three environment variables from `.env.local` in Vercel's project
settings, then deploy.

## Known limits (free-tier reality)

- Groq's free tier caps requests per minute — heavy rapid testing can
  briefly hit a rate limit (Sharp will tell you when this happens)
- Groq occasionally retires/renames models with short notice — if chat
  suddenly 404s, check https://console.groq.com/docs/models and update the
  model ids in `app/api/chat/route.ts`
- Voice input (speech-to-text) works best in Chrome/Edge; Firefox and
  Safari support it weakly or not at all
- Attachments are capped at 4MB to keep things fast on the free tier
