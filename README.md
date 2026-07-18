# Assistant — Phase 1

A working chat interface wired to Google's Gemini API (free tier). This is the
minimal core: no auth, no memory, no image gen yet — just a clean, working
chat loop. Everything else gets added as its own module later.

## 1. Get a free API key

Go to https://aistudio.google.com/apikey and generate a key. No credit card
required for the free tier.

## 2. Run it locally

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
cp .env.example .env.local
# open .env.local and paste your key in place of "your_key_here"
npm run dev
```

Open http://localhost:3000 — you should see the chat interface.

## 3. Deploy for free

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com, sign in with GitHub, and import the repo.
3. In the Vercel project settings, add an environment variable:
   - `GEMINI_API_KEY` = your key
4. Deploy. Vercel gives you a free `.vercel.app` URL.

## Project structure

```
app/
  page.tsx           chat UI (client component)
  api/chat/route.ts  server route that calls Gemini, keeps the key secret
  globals.css         blueprint-schematic visual theme
```

## What's next (Phase 2 ideas)

- Swap the in-memory message state for a Supabase table so history survives
  a refresh (Supabase free tier also gives you auth for free).
- Add a second API route for image generation (Pollinations.ai has no key
  requirement and is free).
- Add simple tool-calling in `route.ts` — Gemini supports function calling,
  which is how you'd let the model decide "search the web" vs "just answer."

Keep each addition as its own route/module rather than growing `route.ts`
into one giant file — that's the "don't build one giant model" principle
applied to the code itself.
