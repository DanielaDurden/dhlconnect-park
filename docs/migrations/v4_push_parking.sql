-- ============================================================
-- DHL Stage — Migración v4.0
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Columna para suscripción push (§6 — notificaciones)
alter table public.profiles
  add column if not exists push_subscription jsonb;

-- 2. Columna para acceso a parking (§2.4 — hosts sin parking)
alter table public.profiles
  add column if not exists has_parking boolean not null default true;

-- ============================================================
-- Notas:
-- - push_subscription: almacena el objeto PushSubscription del browser
-- - has_parking: false = el host accede al mapa de parking como guest
-- ============================================================
