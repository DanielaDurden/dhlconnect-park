# DHL Connect & Park — Estado del Proyecto
**Fecha**: 15 de mayo de 2026
**Versión**: 3.1.0 — Push Notifications · Host Parking Config · Admin Usuarios
**Commit**: `pendiente`
**Producción**: https://dhl-stage.vercel.app

---

## Stack técnico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 14.2.35 | Framework (App Router) |
| React | 18 | UI |
| TypeScript | 5 | Tipado |
| Tailwind CSS | 3.4 | Estilos |
| Supabase (`@supabase/ssr`) | 0.10.2 | Auth + DB |
| next-pwa | 5.6.0 | Service Worker / PWA |
| web-push | 3.6.7 | Push Notifications VAPID |
| @sentry/nextjs | 10.52.0 | Error monitoring (production only) |

**Colores DHL**: Rojo `#D40511` · Amarillo `#FFCD05`

---

## Estructura de rutas

```
/                       → redirect a /home
/login                  → autenticación email/password
/home                   → dashboard por rol (Host / Guest / Professional)
/desks                  → mapa de puestos (guest / professional)
/parking                → grid de estacionamiento (guest / professional / host)
/planner                → planificador semanal (solo host)
/status                 → estado diario del colaborador (guest / professional)
/incidentes             → reporte de incidentes (todos los roles)
/profile                → perfil, nivel Riffs, historial

/admin                  → dashboard KPIs (solo admin)
/admin/desks            → mapa maestro de puestos (admin)
/admin/parking          → mapa de Smart Parking (admin)
/admin/incidents        → inbox de incidentes (admin)
/admin/rockstar         → leaderboard + ajuste manual de Riffs (admin)
/admin/reportes         → descarga CSV histórico (admin)
/admin/users            → gestión de usuarios: toggle has_parking por host (admin)

/api/auth/callback
/api/desks/reserve          → POST/DELETE/PATCH reservas de puestos
/api/desks/release          → POST liberación (early checkout / solidarity)
/api/planner                → GET/POST planificador semanal
/api/incidents              → POST crear incidente
/api/riffs/award            → POST otorgamiento de Riffs
/api/worst-case             → POST log demanda insatisfecha
/api/accept-policy          → POST aceptar política (cookie + DB)
/api/push/subscribe         → POST guardar suscripción push / DELETE eliminarla

/api/admin/force-release            → DELETE cancelar reserva de puesto
/api/admin/reserve-for-user         → POST reservar puesto para cualquier usuario
/api/admin/desk-status              → PATCH toggle is_active en puesto
/api/admin/incidents/[id]           → PATCH cambiar status del incidente
/api/admin/riffs-adjust             → POST insertar ajuste manual de Riffs
/api/admin/report                   → GET descargar CSV (ocupacion/incidentes/riffs/demanda)
/api/admin/force-release-parking    → DELETE cancelar reserva de parking
/api/admin/reserve-parking-for-user → POST reservar parking para cualquier usuario
/api/admin/parking-status           → PATCH toggle is_active en parking_spot
/api/admin/user-parking             → PATCH toggle has_parking en profiles (por host)
```

---

## Modelo de roles

| Rol | Nav disponible | Descripción |
|-----|---------------|-------------|
| `host` | Inicio · Planner · Parking · Incidentes | Directors/Managers con oficina asignada |
| `executive` | Igual a host | Legacy alias — soportado en código |
| `professional` | Inicio · Puestos · Parking · Mi Estado · Incidentes | Colaboradores híbridos |
| `guest` | Inicio · Puestos · Parking · Mi Estado · Incidentes | Visitantes, externos |
| `admin` | /admin/* exclusivo — sin acceso a /home | Office Manager / TI |
| `client` | Igual a professional | Legacy alias — soportado en código |

**Regla de redirect**:
- `(app)/layout.tsx` detecta rol `admin` → `redirect("/admin")` antes de renderizar cualquier página
- `(admin)/layout.tsx` verifica rol con `createAdminClient()` → si no es admin, `redirect("/home")`

**Compatibilidad legacy**: `HomeDashboard/index.tsx` y `DailyCard/index.tsx` aceptan tanto los roles nuevos (`host`, `guest`) como los legacy (`executive`, `professional`, `client`).

---

## Admin Panel — Centro de Control (v3.0)

### Layout (`(admin)/layout.tsx`)
- Desktop-first, `max-w-7xl`
- Header oscuro: logo DHL + "Centro de Control" | nombre del admin + **Cerrar sesión**
- Cerrar sesión: server action → `supabase.auth.signOut()` → `redirect("/login")`
- Nav (7 items): Dashboard · 🗺️ Mapa · 🚗 Parking · ⚠️ Incidentes · 🎸 Rockstar · 📊 Reportes · 👥 Usuarios
- Guard: usa `createAdminClient()` para leer perfil (bypasa RLS, evita loop)

### Dashboard (`/admin` → `admin/page.tsx`)
Scorecards en grid `lg:grid-cols-5`:
- **Puestos hoy**: ocupación `N / 24 desks`
- **Parking hoy**: ocupación `N / 22 spots`
- **Demanda Insatisfecha**: 😞 count — siempre cara triste (métrica negativa)
- **Tasa de Adopción**: % de usuarios activos que reservaron puesto o parking este mes (query desde `riffs_log`)
- **Green Score Semanal**: Riffs por carpooling esta semana
- **Uso por Rol hoy**: breakdown Host / Professional / Guest
- **Inbox de incidentes**: últimos 5 con badge de status
- **Top Riffs**: top 5 de la semana
- Alerta amarilla si demanda insatisfecha ≥ 3
- Quick actions: Mapa · Smart Parking · Incidentes · Rockstar · Reportes · **Usuarios**

### Mapa Maestro (`/admin/desks` → `AdminDeskMap`)
- Stats strip: Ocupados · Con check-in · Disponibles · Fuera de servicio
- Floor plan interactivo completo (coordenadas de `src/lib/floorPlan.ts`)
- Estados admin: rojo (ocupado+check-in) · naranja (sin check-in) · verde (disponible) · amarillo (cowork) · gris (fuera de servicio)
- Panel lateral derecho:
  - Ocupante con rol y estado check-in
  - **Liberación Forzada** → DELETE `/api/admin/force-release`
  - **Asignar reserva** (dropdown usuarios) → POST `/api/admin/reserve-for-user`
  - **Marcar Fuera de Servicio / Restaurar** → PATCH `/api/admin/desk-status`

### Smart Parking (`/admin/parking` → `AdminParkingMap`)
- Stats strip: Ocupados · Disponibles · Fuera de servicio · Accesibles activos
- Floor plan Nivel -2 completo (coordenadas inline, canvas 600×950px)
- Estados admin: rojo (ocupado) · naranja (asignado/alta freq.) · ámbar (director) · verde (disponible) · gris (fuera de servicio)
- Nombre abreviado del ocupante sobre el spot
- Panel lateral derecho con Liberación Forzada / Asignar espacio / Toggle servicio

### Incidentes (`/admin/incidents` → `IncidentInbox`)
- Tabs: Todos / Abierto / En curso / Resuelto
- Formato: "Puesto X reportado como 'Categoría'. Acción requerida."
- Cambio de status → PATCH `/api/admin/incidents/[id]`

### Rockstar Path Admin (`/admin/rockstar` → `RiffsAdmin`)
- Leaderboard con nivel badge
- Ajuste manual: usuario + puntos (acepta negativos) + nota → POST `/api/admin/riffs-adjust`

### Reportes (`/admin/reportes` → `ReportDownload`)
- 4 tipos: Ocupación · Incidentes · Riffs · Demanda
- Date range picker + descarga CSV
- → GET `/api/admin/report?from=&to=&type=`

### Gestión de Usuarios (`/admin/users`)
- Lista todos los hosts (role = 'host' o 'executive')
- Toggle `has_parking` por usuario → PATCH `/api/admin/user-parking`
- Permite al admin activar o desactivar acceso a parking por host
- Componente cliente: `UserParkingToggle.tsx` (optimistic update)

---

## Gamificación — Riffs

| Acción | Puntos | Rol |
|--------|--------|-----|
| Liberación solidaria | +50 | Host / Professional |
| Check-in con carpooling | +30 | Professional / Guest |
| Early checkout | +20 | Professional / Guest |
| Check-in a tiempo | +10 | Professional / Guest |
| Ajuste manual admin | variable | Admin |

**Niveles**: Opening Act (0–999) · Rising Star (1k–2.999) · Headliner (3k–7.999) · Rock Legend (8k+)

**Anti-farming**: guard por `ref_id = plan.id` en `riffs_log`.

**Reset anual**: pg_cron 1 enero 03:00 UTC → archiva en `riffs_history`, limpia `riffs_log`.

---

## Push Notifications (v3.1)

### Flujo completo
1. `PushSubscription.tsx` (client component) se monta en `(app)/layout.tsx`
2. Solicita permiso al usuario si `Notification.permission !== "granted"`
3. Suscribe al service worker con VAPID public key
4. Guarda la suscripción en `profiles.push_subscription` via POST `/api/push/subscribe`
5. El SW custom (`worker/index.js`) maneja el evento `push` → `showNotification()`

### Service Worker custom
- `next.config.mjs` usa `customWorkerDir: "worker"` (next-pwa merges `worker/index.js`)
- Handler `push`: muestra notificación con título + body del payload
- Handler `notificationclick`: cierra la notificación y abre/enfoca `/home`

### Variables de entorno requeridas
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # Public VAPID key (cliente)
VAPID_PRIVATE_KEY=              # Private VAPID key (servidor)
VAPID_EMAIL=                    # mailto: del administrador
```

---

## Componentes

```
src/components/
  BottomNav.tsx
  PolicyModal.tsx
  PushSubscription.tsx          ← solicita permiso + guarda suscripción push
  DeskMap.tsx                   ← toast en todas las acciones
  ParkingGrid.tsx               ← toast en todas las acciones

  HomeDashboard/
    index.tsx                   ← soporta roles legacy (executive, professional, client)
    HostHome.tsx
    GuestHome.tsx               ← también usado por professional/client legacy

  DailyCard/
    index.tsx                   ← soporta roles legacy
    HostCard.tsx
    GuestCard.tsx

  admin/
    AdminDeskMap.tsx
    AdminParkingMap.tsx
    IncidentInbox.tsx
    RiffsAdmin.tsx
    ReportDownload.tsx
    UserParkingToggle.tsx       ← toggle client-side para has_parking
```

**Patrón toast** (uniforme en toda la app):
```tsx
const [toast, setToast] = useState<string | null>(null);
function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
// En JSX:
{toast && (
  <div className="fixed top-16 left-0 right-0 mx-4 z-50 pointer-events-none">
    <div className="bg-dhl-dark text-white text-sm rounded-xl px-4 py-3 shadow-xl max-w-lg mx-auto text-center">
      {toast}
    </div>
  </div>
)}
```

---

## Base de datos (Supabase)

### Tablas
| Tabla | Descripción |
|-------|-------------|
| `profiles` | role, area, policy_accepted_at, **push_subscription** (jsonb), **has_parking** (bool, default true) |
| `desks` | 24 puestos, zonas A/B/C/GG, is_active |
| `desk_reservations` | carpooling, checked_in, check_in_time, status |
| `parking_spots` | spot_status, assigned_user_name, director_name, is_accessible, is_active |
| `parking_reservations` | carpooling, status |
| `incidents` | category, status (open/in_progress/resolved), location |
| `riffs_log` | action, points, ref_id (anti-farming) |
| `riffs_history` | archivo anual |
| `weekly_plans` | planificador host, solidarity_released |
| `user_day_status` | estado diario professional/guest |
| `worst_case_log` | log demanda insatisfecha |

### Columnas añadidas en v3.1 (migration: `v4_push_parking.sql`)
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_subscription jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_parking boolean NOT NULL DEFAULT true;
```

### `createAdminClient()` vs `createClient()`
- `createAdminClient()` → `SUPABASE_SERVICE_ROLE_KEY` → bypasa RLS — usar en API routes de admin y en `(admin)/layout.tsx`
- `createClient()` → anon key + cookies → respeta RLS — usar en páginas de usuario

---

## Decisiones de arquitectura

### Redirect timing (aprendido en v3.0)
El redirect de admin debe ir en `(app)/layout.tsx`, NO en `home/page.tsx`.
Poner `redirect("/admin")` dentro de un page que ya está dentro del layout renderizado causa `"Maximum update depth exceeded"`.

### Floor plans admin
- AdminDeskMap reutiliza coordenadas de `src/lib/floorPlan.ts`
- AdminParkingMap tiene coordenadas inline (mismo canvas 600×950 que ParkingGrid)

### Adopción KPI (corregido en v3.1)
La tasa de adopción se calcula desde `riffs_log` (acciones `voluntary_release`, `solidarity_release`, `carpool`, `checkin_carpooling`, `recover_base_penalty`), no desde `weekly_plans.solidarity_released`. El campo anterior solo contaba liberaciones, perdiendo carpooling y otras acciones.

### Roles legacy
Los roles `executive`, `professional` y `client` siguen existiendo en DB (no se renombraron en producción). El código los trata como aliases: `host || executive`, `guest || professional || client`. Esto evita una migración masiva de datos.

---

## Issues conocidos

| Issue | Causa | Estado |
|-------|-------|--------|
| `ERR_BLOCKED_BY_CLIENT` en Sentry | Ad blocker bloquea `ingest.us.sentry.io` | No resoluble |
| `ERR_BLOCKED_BY_CLIENT` en chunks Vercel | Ad blocker | No resoluble |
| `apple-mobile-web-app-capable deprecated` | Duplicate manual meta tag | ✅ Eliminado |
| `icon-192x192.png 404` | Iconos PNG nunca creados | ✅ Referencias eliminadas |

---

## Pendientes

### Alta
- [ ] **Cron job**: liberar reservas sin check-in a las 9:15 AM (Vercel Cron o DB trigger)
- [ ] **Iconos PWA**: crear `icon-192x192.png` e `icon-512x512.png` con branding DHL

### Media
- [ ] **Resend email**: confirmación de reserva / alerta en incidentes críticos
- [ ] **QR Check-in**: flujo físico de check-in en oficina
- [ ] **Enviar push desde admin**: endpoint para notificar a usuarios desde el panel

### Baja
- [ ] **Tests**: reglas de negocio de reservas y riffs
- [ ] **`profiles.riffs_total` persistente**: actualmente calculado en runtime

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@dhl.com
SENTRY_DSN=
SENTRY_ORG=nanolab
SENTRY_PROJECT=javascript-nextjs
```

---

## Setup

```bash
npm install && npm run dev
```

Supabase:
1. Ejecutar `docs/schema.sql`
2. Ejecutar migraciones en `docs/migrations/` (v3_stage.sql → v4_push_parking.sql)
3. Asignar roles:
```sql
UPDATE profiles SET role='admin' WHERE email = 'admin@dhl.com';
UPDATE profiles SET role='host' WHERE email IN ('...', '...');
```

---

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 3.1.0 | 2026-05-15 | Push Notifications (VAPID end-to-end), has_parking toggle por host, Admin Usuarios, adopción KPI fix, login Recordar sesión, soporte roles legacy |
| 3.0.0 | 2026-05-11 | Admin Panel completo (Centro de Control), desktop layout, bug fixes |

---

*Actualizado por Claude Code — 2026-05-15 — v3.1.0*
