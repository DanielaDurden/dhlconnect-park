-- =============================================
-- DHL Connect & Park — Supabase Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null default 'client' check (role in ('admin', 'client')),
  area text check (area in ('FIN','OE','SD','BD','Legal','MKT','IT','HR','Ops','KAM','GG','Co-Work')),
  status_type text not null default 'base' check (status_type in ('base', 'visiting')),
  avatar_url text,
  policy_accepted_at timestamptz,
  push_subscription jsonb,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update all profiles"
  on public.profiles for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- SITES
-- ─────────────────────────────────────────────
create table if not exists public.sites (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  created_at timestamptz default now() not null
);

alter table public.sites enable row level security;
create policy "Everyone can view sites" on public.sites for select using (true);
create policy "Admins can manage sites" on public.sites for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- DESKS
-- ─────────────────────────────────────────────
create table if not exists public.desks (
  id uuid primary key default uuid_generate_v4(),
  site_id uuid references public.sites(id) on delete cascade not null,
  code text not null,
  zone text not null check (zone in ('A','B','C','GG','Office')),
  type text not null check (type in ('fixed','shared','cowork','office','meeting')),
  area text,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  grid_row int not null default 0,
  grid_col int not null default 0,
  is_active boolean default true not null,
  unique(site_id, code)
);

alter table public.desks enable row level security;
create policy "Everyone can view desks" on public.desks for select using (true);
create policy "Admins can manage desks" on public.desks for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- AREA WEEKLY SCHEDULE
-- ─────────────────────────────────────────────
create table if not exists public.area_desk_schedule (
  id uuid primary key default uuid_generate_v4(),
  area text not null,
  day_of_week int not null check (day_of_week between 1 and 5),
  desk_count int not null default 1
);

alter table public.area_desk_schedule enable row level security;
create policy "Everyone can view schedule" on public.area_desk_schedule for select using (true);
create policy "Admins can manage schedule" on public.area_desk_schedule for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- USER DAY STATUS
-- ─────────────────────────────────────────────
create table if not exists public.user_day_status (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('office','site','home_office','vacation')),
  created_at timestamptz default now() not null,
  unique(user_id, date)
);

alter table public.user_day_status enable row level security;
create policy "Users can manage their own status" on public.user_day_status
  for all using (auth.uid() = user_id);
create policy "Admins can view all statuses" on public.user_day_status for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Everyone can view statuses for desk logic" on public.user_day_status for select using (true);

-- ─────────────────────────────────────────────
-- DESK RESERVATIONS
-- ─────────────────────────────────────────────
create table if not exists public.desk_reservations (
  id uuid primary key default uuid_generate_v4(),
  desk_id uuid references public.desks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  checked_in boolean default false not null,
  check_in_time timestamptz,
  status text default 'confirmed' check (status in ('confirmed','cancelled')) not null,
  created_at timestamptz default now() not null
);

create unique index desk_reservations_unique_active
  on public.desk_reservations(desk_id, date)
  where status = 'confirmed';

alter table public.desk_reservations enable row level security;
create policy "Users can view their own desk reservations" on public.desk_reservations
  for select using (auth.uid() = user_id);
create policy "Users can create desk reservations" on public.desk_reservations
  for insert with check (auth.uid() = user_id);
create policy "Users can cancel their own reservations" on public.desk_reservations
  for update using (auth.uid() = user_id);
create policy "Everyone can view desk reservations for map" on public.desk_reservations
  for select using (status = 'confirmed');
create policy "Admins can manage all desk reservations" on public.desk_reservations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- PARKING SPOTS
-- ─────────────────────────────────────────────
create table if not exists public.parking_spots (
  id uuid primary key default uuid_generate_v4(),
  spot_number int not null unique,
  level text not null check (level in ('street','minus2')),
  spot_status text not null default 'available'
    check (spot_status in ('available','fixed','blocked','director_reserved')),
  assigned_user_name text,
  director_name text,
  is_accessible boolean default false not null,
  is_active boolean default true not null
);

alter table public.parking_spots enable row level security;
create policy "Everyone can view parking spots" on public.parking_spots for select using (true);
create policy "Admins can manage parking spots" on public.parking_spots for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- PARKING RESERVATIONS
-- ─────────────────────────────────────────────
create table if not exists public.parking_reservations (
  id uuid primary key default uuid_generate_v4(),
  spot_id uuid references public.parking_spots(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  status text default 'confirmed' check (status in ('confirmed','cancelled')) not null,
  created_at timestamptz default now() not null
);

create unique index parking_reservations_unique_active
  on public.parking_reservations(spot_id, date)
  where status = 'confirmed';

create unique index parking_one_per_user_per_day
  on public.parking_reservations(user_id, date)
  where status = 'confirmed';

alter table public.parking_reservations enable row level security;
create policy "Users can view their own parking reservations" on public.parking_reservations
  for select using (auth.uid() = user_id);
create policy "Users can create parking reservations" on public.parking_reservations
  for insert with check (auth.uid() = user_id);
create policy "Users can cancel their own parking reservations" on public.parking_reservations
  for update using (auth.uid() = user_id);
create policy "Everyone can view parking reservations for map" on public.parking_reservations
  for select using (status = 'confirmed');
create policy "Admins can manage all parking reservations" on public.parking_reservations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- INCIDENTS
-- ─────────────────────────────────────────────
create table if not exists public.incidents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category text not null check (category in ('cleaning','supplies','maintenance','other')),
  description text not null,
  location text,
  status text default 'open' check (status in ('open','in_progress','resolved')) not null,
  created_at timestamptz default now() not null
);

alter table public.incidents enable row level security;
create policy "Users can view their own incidents" on public.incidents
  for select using (auth.uid() = user_id);
create policy "Users can create incidents" on public.incidents
  for insert with check (auth.uid() = user_id);
create policy "Admins can manage all incidents" on public.incidents for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─────────────────────────────────────────────
-- OWNER REQUESTS (Ask the Owner)
-- ─────────────────────────────────────────────
create table if not exists public.owner_requests (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  desk_id uuid references public.desks(id) on delete cascade not null,
  date date not null,
  status text default 'pending' check (status in ('pending','approved','denied')) not null,
  created_at timestamptz default now() not null,
  unique(requester_id, desk_id, date)
);

alter table public.owner_requests enable row level security;
create policy "Users can view their own requests" on public.owner_requests
  for select using (auth.uid() = requester_id or auth.uid() = owner_id);
create policy "Users can create requests" on public.owner_requests
  for insert with check (auth.uid() = requester_id);
create policy "Owners can update their requests" on public.owner_requests
  for update using (auth.uid() = owner_id);

-- =============================================
-- SEED DATA
-- =============================================

-- Site
insert into public.sites (id, name, address) values
  ('00000000-0000-0000-0000-000000000001', 'Centro de Energía (CE)', 'Santiago, Chile')
on conflict do nothing;

-- ─── Desks ────────────────────────────────────
-- Zone A: Top Row (row 0)
insert into public.desks (site_id, code, zone, type, area, grid_row, grid_col) values
  ('00000000-0000-0000-0000-000000000001', 'A01', 'A', 'fixed', 'BD', 0, 0),
  ('00000000-0000-0000-0000-000000000001', 'A02', 'A', 'fixed', 'FIN', 0, 1),
  ('00000000-0000-0000-0000-000000000001', 'A03', 'A', 'fixed', 'FIN', 0, 2),
  ('00000000-0000-0000-0000-000000000001', 'A04', 'A', 'fixed', 'OE', 0, 3),
  ('00000000-0000-0000-0000-000000000001', 'A05', 'A', 'shared', 'OE/FIN', 0, 4),
  ('00000000-0000-0000-0000-000000000001', 'A06', 'A', 'fixed', 'OE', 0, 6)
on conflict do nothing;

-- Zone B: Main Left Pairs (rows 1-6)
insert into public.desks (site_id, code, zone, type, area, grid_row, grid_col) values
  ('00000000-0000-0000-0000-000000000001', 'B01', 'B', 'fixed', 'FIN', 1, 1),
  ('00000000-0000-0000-0000-000000000001', 'B02', 'B', 'shared', 'OE/FIN', 1, 2),
  ('00000000-0000-0000-0000-000000000001', 'B03', 'B', 'fixed', 'BD', 2, 1),
  ('00000000-0000-0000-0000-000000000001', 'B04', 'B', 'shared', 'BD/SD', 2, 2),
  ('00000000-0000-0000-0000-000000000001', 'B05', 'B', 'fixed', 'KAM', 3, 1),
  ('00000000-0000-0000-0000-000000000001', 'B06', 'B', 'shared', 'Legal/MKT', 3, 2),
  ('00000000-0000-0000-0000-000000000001', 'B07', 'B', 'fixed', 'SD', 4, 1),
  ('00000000-0000-0000-0000-000000000001', 'B08', 'B', 'shared', 'SD/FIN', 4, 2),
  ('00000000-0000-0000-0000-000000000001', 'B09', 'B', 'fixed', 'SD', 5, 1),
  ('00000000-0000-0000-0000-000000000001', 'B10', 'B', 'fixed', 'SD', 5, 2),
  ('00000000-0000-0000-0000-000000000001', 'B11', 'B', 'shared', 'IT/OE', 6, 1),
  ('00000000-0000-0000-0000-000000000001', 'B12', 'B', 'shared', 'IT/OE', 6, 2)
on conflict do nothing;

-- Zone C: Right Block CoWork + HR (rows 1-2)
insert into public.desks (site_id, code, zone, type, area, grid_row, grid_col) values
  ('00000000-0000-0000-0000-000000000001', 'C01', 'C', 'cowork', 'Co-Work', 1, 5),
  ('00000000-0000-0000-0000-000000000001', 'C02', 'C', 'fixed', 'HR', 1, 6),
  ('00000000-0000-0000-0000-000000000001', 'C03', 'C', 'fixed', 'HR', 1, 7),
  ('00000000-0000-0000-0000-000000000001', 'C04', 'C', 'cowork', 'Co-Work', 2, 5),
  ('00000000-0000-0000-0000-000000000001', 'C05', 'C', 'cowork', 'Co-Work', 2, 6),
  ('00000000-0000-0000-0000-000000000001', 'C06', 'C', 'fixed', 'HR', 2, 7)
on conflict do nothing;

-- GG Desk
insert into public.desks (site_id, code, zone, type, area, grid_row, grid_col) values
  ('00000000-0000-0000-0000-000000000001', 'GG01', 'GG', 'fixed', 'GG', 7, 1)
on conflict do nothing;

-- Area Weekly Schedule (shared desks by day)
-- day_of_week: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes
insert into public.area_desk_schedule (area, day_of_week, desk_count) values
  -- Finanzas: L,M,J (3 desks each)
  ('FIN', 1, 3), ('FIN', 2, 3), ('FIN', 4, 3),
  -- OE: M,Mi,J,V
  ('OE', 2, 1), ('OE', 3, 3), ('OE', 4, 2), ('OE', 5, 4),
  -- SD: M,Mi
  ('SD', 2, 1), ('SD', 3, 1),
  -- BD: Mi,J,V
  ('BD', 3, 1), ('BD', 4, 1), ('BD', 5, 1),
  -- MKT: M,J
  ('MKT', 2, 1), ('MKT', 4, 1),
  -- Legal: L,V
  ('Legal', 1, 1), ('Legal', 5, 1),
  -- IT: L,M,Mi,V
  ('IT', 1, 2), ('IT', 2, 1), ('IT', 3, 2), ('IT', 5, 1)
on conflict do nothing;

-- ─── Parking Spots ────────────────────────────
insert into public.parking_spots (spot_number, level, spot_status, assigned_user_name, director_name, is_accessible) values
  -- Nivel Calle
  (18, 'street', 'blocked', null, null, false),
  (19, 'street', 'blocked', null, null, false),
  -- Nivel -2: Fixed spots (named employees)
  (206, 'minus2', 'fixed', 'Guerrero Gajardo, José Tomás', null, false),
  (207, 'minus2', 'fixed', 'Corona Coronel, Alejandro', null, false),
  (208, 'minus2', 'fixed', 'Sánchez García, Alessandra', null, false),
  (209, 'minus2', 'fixed', 'Márquez Fuenzalida, Rodrigo Ignacio', null, false),
  (210, 'minus2', 'fixed', 'Jiménez Cox, Agustín', null, false),
  -- Director spots (reserved Mondays)
  (211, 'minus2', 'director_reserved', null, 'Alvaro Quintana Milos', false),
  (212, 'minus2', 'director_reserved', null, 'Gorgas, Sebastián José', false),
  (213, 'minus2', 'director_reserved', null, 'Vinicius Falcao', false),
  (214, 'minus2', 'director_reserved', null, 'Danilo Marchant', false),
  -- Free spots
  (215, 'minus2', 'available', null, null, false),
  (216, 'minus2', 'available', null, null, false),
  (217, 'minus2', 'available', null, null, false),
  -- Fixed spots
  (218, 'minus2', 'fixed', 'Stepancic Juchler, Paola', null, false),
  (219, 'minus2', 'fixed', 'Gómez Badillo, Henry Giovanny', null, false),
  (220, 'minus2', 'fixed', 'Arratia Olivares, Álvaro José', null, false),
  -- Fixed spots inner area
  (228, 'minus2', 'fixed', 'Dos Santos Cerqueira, Marcos Vinícios', null, false),
  (229, 'minus2', 'fixed', 'Arango Estrada, Germán', null, false),
  -- Free spots
  (230, 'minus2', 'available', null, null, false),
  (241, 'minus2', 'available', null, null, false),
  (242, 'minus2', 'available', null, null, false)
on conflict do nothing;

-- ─── Test Users (create via Supabase Auth Dashboard, then update profile) ───
-- After creating users in Auth, run:
-- update public.profiles set full_name='Admin DHL', role='admin', area='GG'
--   where email='admin@dhl.com';
-- update public.profiles set full_name='Ana Finanzas', area='FIN'
--   where email='ana@dhl.com';
-- (etc. for all test users)
