-- run this in the Supabase SQL editor

-- your tasks. other apps can read/write these through Supabase's REST API
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  text text not null,
  done boolean not null default false,
  due date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

-- you only ever see and change your own tasks
create policy "own tasks" on tasks for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
