-- run this in the Supabase SQL editor

-- uploaded apps. everyone can see them. set approved to false in the dashboard to hide one
create table games (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  author text not null,
  file_path text not null,
  uploaded_by uuid not null default auth.uid() references auth.users,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table games enable row level security;

-- anyone can see apps that aren't hidden, and you can always see your own
create policy "read games" on games for select
  using (approved or uploaded_by = auth.uid());

-- logged in users can upload
create policy "upload games" on games for insert to authenticated
  with check (uploaded_by = auth.uid());


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


-- storage: a public bucket for the app files, uploads go in a folder named after your user id
insert into storage.buckets (id, name, public) values ('games', 'games', true);

create policy "upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'games' and (storage.foldername(name))[1] = auth.uid()::text);
