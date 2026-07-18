-- Stores each user's display name
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- profile data (OAuth signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'there')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Stores chat history
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  role text not null,
  content text not null,
  image_url text,
  attachment_image text,
  attachment_name text,
  created_at timestamptz default now()
);

alter table messages enable row level security;

drop policy if exists "Users can view their own messages" on messages;
create policy "Users can view their own messages"
  on messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own messages" on messages;
create policy "Users can insert their own messages"
  on messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own messages" on messages;
create policy "Users can delete their own messages"
  on messages for delete
  using (auth.uid() = user_id);

create index if not exists messages_user_id_created_at_idx
  on messages (user_id, created_at);
