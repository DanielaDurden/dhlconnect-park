-- ============================================================
-- DHL Stage — Migración v3.0 (Iteración de Desarrollo)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar rol 'host' (rename de 'executive')
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'executive', 'professional', 'guest', 'client', 'host'));

-- 2. Ampliar constraint de acciones en riffs_log para incluir:
--    - manual_adjustment (bug fix del admin)
--    - carpool (reemplaza checkin_carpooling)
--    - voluntary_release (alias más claro de solidarity_release)
--    - recover_base_penalty (penalización por recuperar base con reserva activa)
alter table public.riffs_log
  drop constraint if exists riffs_log_action_check;

alter table public.riffs_log
  add constraint riffs_log_action_check
  check (action in (
    'solidarity_release',
    'checkin_carpooling',
    'early_checkout',
    'checkin_ontime',
    'manual_adjustment',
    'carpool',
    'voluntary_release',
    'recover_base_penalty'
  ));

-- 3. Permitir puntos negativos (para penalizaciones y ajustes manuales negativos)
alter table public.riffs_log
  drop constraint if exists riffs_log_points_check;

alter table public.riffs_log
  add constraint riffs_log_points_check
  check (points != 0);

-- 4. Agregar columna 'note' a riffs_log para notas en ajuste manual
alter table public.riffs_log
  add column if not exists note text;

-- 5. Agregar campos de resolución de incidentes
alter table public.incidents
  add column if not exists resolution_comment text;

alter table public.incidents
  add column if not exists resolved_at timestamptz;

-- 6. Activar spots de nivel calle (18, 19) — eran 'blocked'
update public.parking_spots
  set spot_status = 'available', is_active = true
  where spot_number in (18, 19);

-- ============================================================
-- Notas para el admin:
-- - Migrar usuarios 'executive' → 'host':
--   UPDATE profiles SET role = 'host' WHERE role = 'executive';
-- - El rol 'professional' queda legacy (existentes en BD no se migran automáticamente)
-- ============================================================
