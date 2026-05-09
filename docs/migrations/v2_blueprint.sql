-- ============================================================
-- DHL Connect & Park — Migración v2.0 (Blueprint)
-- Ejecutar en Supabase SQL Editor sobre DB existente
-- ============================================================

-- 1. Ampliar roles en profiles
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'executive', 'professional', 'guest', 'client'));

-- Migrar 'client' → 'professional' (valor por defecto para existentes)
update public.profiles set role = 'professional' where role = 'client';

-- Actualizar default de la columna
alter table public.profiles alter column role set default 'professional';

-- 2. Ampliar parking_spots status para alta frecuencia
alter table public.parking_spots
  drop constraint if exists parking_spots_spot_status_check;

alter table public.parking_spots
  add constraint parking_spots_spot_status_check
  check (spot_status in ('available','fixed','blocked','director_reserved','high_frequency'));

-- 3. Agregar columna carpooling a desk_reservations
alter table public.desk_reservations
  add column if not exists carpooling boolean default false not null;

-- 4. Agregar columna carpooling a parking_reservations
alter table public.parking_reservations
  add column if not exists carpooling boolean default false not null;

-- 5. Tabla de Riffs (gamificación)
create table if not exists public.riffs_log (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  action       text not null check (action in ('solidarity_release','checkin_carpooling','early_checkout','checkin_ontime')),
  points       int not null check (points > 0),
  ref_id       uuid,
  created_at   timestamptz default now() not null
);

alter table public.riffs_log enable row level security;

create policy "Users can view their own riffs"
  on public.riffs_log for select using (auth.uid() = user_id);

create policy "Service role can insert riffs"
  on public.riffs_log for insert with check (true);

create policy "Admins can view all riffs"
  on public.riffs_log for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Vista de totales por usuario
create or replace view public.riffs_totals as
  select user_id, coalesce(sum(points), 0)::int as total_riffs
  from public.riffs_log
  group by user_id;

-- 6. Tabla de Planificador Semanal (solo Executives)
create table if not exists public.weekly_plans (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references public.profiles(id) on delete cascade not null,
  week_start          date not null,
  day_of_week         int not null check (day_of_week between 1 and 5),
  planned_status      text not null check (planned_status in ('office','site','home_office','vacation')),
  solidarity_released boolean default false not null,
  created_at          timestamptz default now() not null,
  unique(user_id, week_start, day_of_week)
);

alter table public.weekly_plans enable row level security;

create policy "Users can manage their own weekly plans"
  on public.weekly_plans for all using (auth.uid() = user_id);

create policy "Admins can view all plans"
  on public.weekly_plans for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 7. Tabla de log de Demanda Insatisfecha (Worst Case KPI)
create table if not exists public.worst_case_log (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  type       text not null check (type in ('parking_full','desks_full')),
  date       date not null,
  created_at timestamptz default now() not null
);

alter table public.worst_case_log enable row level security;

create policy "Service role can insert worst case logs"
  on public.worst_case_log for insert with check (true);

create policy "Admins can view worst case logs"
  on public.worst_case_log for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 8. Actualizar spots de alta frecuencia (bloqueados para >4 días/semana)
-- Los 12 spots de alta frecuencia según el Blueprint:
-- Se mantienen como 'fixed' con assigned_user_name existente
-- pero se les agrega el flag is_high_frequency
alter table public.parking_spots
  add column if not exists is_high_frequency boolean default false not null;

-- Marcar los spots 206-210 y 218-220 + 228-229 como alta frecuencia (>4 días/semana)
update public.parking_spots
  set is_high_frequency = true, spot_status = 'high_frequency'
  where spot_number in (206,207,208,209,210,218,219,220,228,229);

-- Director spots (211-214): mantener como director_reserved
-- Spots disponibles (215,216,217,230,241,242): mantener como available
-- Street (18,19): mantener como blocked

-- ============================================================
-- Seed data adicional: ejemplo de usuarios con nuevos roles
-- (Ejecutar después de crear usuarios en Supabase Auth)
-- ============================================================

-- update public.profiles set role='executive' where email='director@dhl.com';
-- update public.profiles set role='professional' where email='ana@dhl.com';
-- update public.profiles set role='guest' where email='visita@dhl.com';
