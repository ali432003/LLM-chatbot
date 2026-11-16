# AI Chat (practice project)

A small ChatGPT/Gemini-style chat app.

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Auth + database:** Supabase (email/password, Postgres with Row Level Security)
- **Model:** a free chat model from Hugging Face via the Inference Providers API

## Features
- Sign up / log in / log out
- Protected `/chat` route (middleware + server check)
- Chat UI with a sidebar of past conversations
- Conversations and messages saved per user in Supabase
- Delete conversations, mobile-friendly sidebar

## Setup

### 1. Supabase
1. Create a project at https://supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
3. (Optional, easier for practice) **Authentication → Providers → Email**: turn off "Confirm email" so signup logs you in right away.
4. Copy the Project URL and `anon` key from **Project Settings → API**.

### 2. Hugging Face
1. Create a free account and a token at https://huggingface.co/settings/tokens
   (enable the "Make calls to Inference Providers" permission).
2. Pick a chat model that is enabled for Inference Providers. The default is `Qwen/Qwen2.5-7B-Instruct`.
   If you get a "model not supported" error, choose another from
   https://huggingface.co/models?inference_provider=all&other=conversational and set `HF_MODEL`.
   Free accounts have a small monthly credit allowance, which is plenty for practice.

### 3. Run it
```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev
```
Open http://localhost:3000.

## How it works
- `middleware.ts` refreshes the Supabase session and redirects unauthenticated users away from `/chat`.
- `app/api/chat/route.ts` checks the user, saves their message, sends the last 20 messages to Hugging Face, saves the reply, and returns it. The HF token never reaches the browser.
- `components/ChatApp.tsx` loads conversations/messages straight from Supabase (RLS restricts rows to the owner).

## Ideas to extend
- Stream tokens (`stream: true`) for a typing effect
- Markdown + code rendering for replies
- Rename conversations, per-user rate limiting
