-- 1. Enable UUID Extension (jika belum aktif)
create extension if not exists "uuid-ossp";

-- 2. Create Table: Sessions (Untuk Riwayat)
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- 3. Create Table: Queue (Untuk Antrian)
create table queue (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id),
  name text not null,
  business_name text,
  status text default 'waiting', -- 'waiting', 'answered'
  created_at timestamptz default now()
);

-- 4. Create Table: App State (Global Config untuk status aktif/speaker)
create table app_state (
  id int primary key default 1,
  is_session_active boolean default false,
  current_session_id uuid references sessions(id),
  active_speaker_id uuid, -- ID dari tabel queue yang sedang bicara
  updated_at timestamptz default now()
);

-- 5. Insert Default State (PENTING: Jangan skip ini)
insert into app_state (id, is_session_active, current_session_id, active_speaker_id)
values (1, false, null, null);

-- 6. Enable Realtime (Supabase biasanya auto-enable, tapi pastikan di dashboard Table Editor -> Realtime 'ON' untuk tabel app_state dan queue)

-- 7. Row Level Security (RLS) Policies
-- Agar simpel untuk demo, kita allow public access (anon).
-- Untuk production, sebaiknya gunakan Auth policies.

alter table sessions enable row level security;
alter table queue enable row level security;
alter table app_state enable row level security;

-- Policy untuk SESSIONS
create policy "Public can read sessions" on sessions for select using (true);
create policy "Public can insert sessions" on sessions for insert with check (true);
create policy "Public can update sessions" on sessions for update using (true);

-- Policy untuk QUEUE
create policy "Public can read queue" on queue for select using (true);
create policy "Public can insert queue" on queue for insert with check (true);
create policy "Public can update queue" on queue for update using (true);

-- Policy untuk APP STATE
create policy "Public can read app_state" on app_state for select using (true);
create policy "Public can update app_state" on app_state for update using (true);
