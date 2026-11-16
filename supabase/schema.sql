-- Run this in Supabase Dashboard -> SQL Editor

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);
create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);

-- Row Level Security: users can only see and change their own data
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "own conversations select" on public.conversations
  for select using (auth.uid() = user_id);
create policy "own conversations insert" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "own conversations update" on public.conversations
  for update using (auth.uid() = user_id);
create policy "own conversations delete" on public.conversations
  for delete using (auth.uid() = user_id);

create policy "own messages select" on public.messages
  for select using (auth.uid() = user_id);
create policy "own messages insert" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "own messages delete" on public.messages
  for delete using (auth.uid() = user_id);
