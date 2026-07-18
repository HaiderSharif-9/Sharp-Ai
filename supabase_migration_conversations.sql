create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table conversations enable row level security;

drop policy if exists "Users can view their own conversations" on conversations;
create policy "Users can view their own conversations"
  on conversations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own conversations" on conversations;
create policy "Users can insert their own conversations"
  on conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own conversations" on conversations;
create policy "Users can update their own conversations"
  on conversations for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own conversations" on conversations;
create policy "Users can delete their own conversations"
  on conversations for delete
  using (auth.uid() = user_id);

-- Link messages to a conversation
alter table messages add column if not exists conversation_id uuid references conversations(id) on delete cascade;
do $$
declare
  u record;
  new_conv_id uuid;
begin
  for u in select distinct user_id from messages where conversation_id is null loop
    insert into conversations (user_id, title) values (u.user_id, 'Previous chat')
    returning id into new_conv_id;

    update messages set conversation_id = new_conv_id
    where user_id = u.user_id and conversation_id is null;
  end loop;
end $$;

create index if not exists conversations_user_id_updated_at_idx
  on conversations (user_id, updated_at desc);

create index if not exists messages_conversation_id_created_at_idx
  on messages (conversation_id, created_at);
