# DHL Connect & Park — Estado del Proyecto
**Fecha**: 9 de mayo de 2026
**Versión**: 2.1.0 — Executive UX + Incidents + Riffs anti-farming
**Commit**: `e8a67bb`

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
| @sentry/nextjs | 10.52.0 | Error monitoring (production only) |

**Colores DHL**: Rojo `#D40511` · Amarillo `#FFCD05`

---

## Estructura de rutas

```
/                    → redirect a /home
/login               → autenticación email/password
/home                → dashboard con riffs + módulos por rol
/desks               → mapa de puestos (solo professional/guest/admin)
/parking             → grid de estacionamiento (solo professional/guest/admin)
/planner             → planificador semanal (solo executive/admin)
/status              → estado diario del colaborador (solo professional/guest/admin)
/incidentes          → reporte de incidentes (todos los roles)
/admin               → panel de administración con KPIs Blueprint
/api/auth/callback   → callback OAuth
/api/desks/reserve   → POST/DELETE/PATCH reservas de puestos
/api/desks/release   → POST liberación de puesto (early checkout / solidarity)
/api/planner         → GET/POST planificador semanal
/api/incidents       → POST crear incidente (admin client, bypasa RLS)
/api/riffs/award     → POST otorgamiento de Riffs
/api/worst-case      → POST log de escenarios de demanda insatisfecha
```

---

## Modelo de roles (v2.1)

| Rol | Nav disponible | Descripción |
|-----|---------------|-------------|
| `executive` | Inicio · Planner · Incidentes | Directors/Managers con oficina asignada |
| `professional` | Inicio · Puestos · Parking · Mi Estado · Incidentes | Colaboradores híbridos |
| `guest` | Inicio · Puestos · Parking · Mi Estado · Incidentes | Visitantes, externos |
| `admin` | Todo | Office Manager / TI |
| `client` | Igual a professional | Legacy → migrado a `professional` |

---

## Gamificación — Riffs (v2.1)

| Acción | Puntos | Rol |
|--------|--------|-----|
| Liberación solidaria | +50 Riffs | Executive / Professional |
| Check-in con carpooling | +30 Riffs | Professional |
| Early checkout | +20 Riffs | Professional |
| Check-in a tiempo | +10 Riffs | Professional |

**Niveles**:
- Opening Act: 0–999 Riffs
- Rising Star: 1.000–2.999 Riffs
- Headliner: 3.000–7.999 Riffs
- Rock Legend: 8.000+ Riffs

**Anti-farming**: el API de planner guarda `ref_id = plan.id` en `riffs_log`. Al liberar el mismo día múltiples veces, el guard detecta el ref_id existente y no otorga puntos duplicados.

**Reset anual**: pg_cron programado en Supabase para correr el 1 de enero a las 03:00 UTC (00:00 Santiago). Archiva totales en `riffs_history` y limpia `riffs_log`.

---

## Archivos del proyecto

### App (src/app)
```
(auth)/
  layout.tsx            ← fondo rojo DHL para login
  login/page.tsx        ← formulario email/password

(app)/
  layout.tsx            ← header, BottomNav (rol-sensitivo), PolicyModal
  home/page.tsx         ← dashboard: riffs, widget semana executive, módulos por rol
  desks/page.tsx        ← server component con rol → DeskMap
  parking/page.tsx      ← server component → ParkingGrid
  planner/page.tsx      ← planificador semanal (solo executive/admin)
                           En fin de semana muestra la semana SIGUIENTE
  status/page.tsx       ← estado diario (professional/guest/admin)
                           Sin sección "Ritmo del equipo" para executive
  incidentes/page.tsx   ← reporte + historial

(admin)/
  layout.tsx            ← header oscuro, nav admin, guard role=admin
  admin/page.tsx        ← KPIs: stats, Green Score, Demanda Insatisfecha, Top Riffs

api/
  auth/callback/route.ts
  desks/reserve/route.ts   ← POST/DELETE/PATCH (carpooling support)
  desks/release/route.ts   ← POST solidarity/early checkout
  planner/route.ts         ← GET/POST weekly plan + anti-farming guard
  incidents/route.ts       ← POST incidente (admin client, bypasa RLS)
  riffs/award/route.ts     ← POST award riffs
  worst-case/route.ts      ← POST log worst-case

error.tsx                  ← error boundary con Sentry.captureException
global-error.tsx           ← global error boundary con Sentry
```

### Componentes (src/components)
```
BottomNav.tsx      ← nav filtrado por rol
                      Executive: Inicio / Planner / Incidentes
                      Professional/Guest: Inicio / Puestos / Parking / Mi Estado / Incidentes
PolicyModal.tsx    ← modal "3 reglas de oro"
DeskMap.tsx        ← mapa interactivo (coords desde floorPlan.ts)
ParkingGrid.tsx    ← grid con spots high_frequency, Plan B desde config.ts
PlannerForm.tsx    ← 2 botones por día: "Voy a la oficina" / "Comparto mi espacio"
StatusForm.tsx     ← estado semanal (oculta Ritmo del equipo para executive)
IncidentForm.tsx   ← reporte via /api/incidents (admin client)

HomeDashboard/
  index.tsx          ← despacha por rol + WeekendBanner
  ExecutiveHome.tsx  ← widget Mi Semana (Mon-Fri planificado), Riffs, impacto semanal
  ProfessionalHome.tsx
  GuestHome.tsx

DailyCard/
  index.tsx          ← greeting neutral "¡Hola!" (sin hydration risk)
  ExecutiveCard.tsx  ← "¿Usas tu oficina hoy?" → Sí la uso / Comparte tu escenario
  ProfessionalCard.tsx
  GuestCard.tsx
```

### Lib (src/lib)
```
floorPlan.ts   ← coordenadas pixel de todos los puestos, salas, zonas
config.ts      ← PARKING_MANAGED_COUNT, PARKING_PLAN_B
dateUtils.ts   ← getWeekStart, isValidDateString
```

---

## Base de datos (Supabase)

### Tablas implementadas
| Tabla | Descripción |
|-------|-------------|
| `profiles` | role, area, policy_accepted_at, riffs_total |
| `sites` | Oficinas (seed: Centro de Energía CE) |
| `desks` | 24 puestos con zonas A/B/C/GG |
| `desk_reservations` | Reservas con carpooling, checked_in, check_in_time |
| `parking_spots` | 22 espacios + high_frequency flag |
| `parking_reservations` | Reservas con carpooling |
| `incidents` | Reportes de incidentes (status: open/in_progress/resolved) |
| `riffs_log` | Log de acciones gamificadas — se resetea el 1 de enero |
| `riffs_history` | Archivo anual de totales por usuario y nivel alcanzado |
| `weekly_plans` | Planificador semanal executive (5 días, solidarity_released) |
| `user_day_status` | Estado diario del colaborador (professional/guest) |
| `worst_case_log` | Log de escenarios de capacidad completa |

### Supabase SQL ejecutados en esta sesión
- `incidents` table + RLS policies
- `riffs_history` table + RLS policies
- `reset_riffs_annual()` function (pg_cron, 1 ene 03:00 UTC)

### Spots high_frequency (requieren check-in)
206, 207, 208, 209, 210, 218, 219, 220, 228, 229

---

## Reglas de negocio implementadas (v2.1)

### Executive — flujo completo
- **Daily Card**: al abrir /home sin registro del día → "¿Usas tu oficina hoy?" con dos opciones
- **Planner**: solo 2 estados por día — "Voy a la oficina" (🏢) / "Comparto mi espacio" (🎸 +50 Riffs)
- **Fin de semana**: el planner muestra la semana SIGUIENTE para planificar con anticipación
- **Widget Mi Semana**: visible en /home, muestra Mon-Fri con estado planificado; vacío invita al planner
- **Impacto**: contador de días liberados en la semana actual (no mensual)
- **Nav**: Inicio / Planner / Incidentes — sin Puestos, Parking, ni Mi Estado

### Anti-farming Riffs
- Un solo riff por entrada de `weekly_plans` (guard por `ref_id`)
- Liberar → recuperar → liberar el mismo día no acumula puntos adicionales
- Reset anual el 1 de enero vía pg_cron

### Incidentes
- Insert vía API route server-side (`/api/incidents`) con admin client
- Categorías: Limpieza / Insumos-Kitchenette / Mantenimiento / Otro
- Status: open → in_progress → resolved (gestión futura en admin panel)
- Error visible al usuario si falla el envío

### Check-in (Professional)
- Cutoff: **9:01 AM**
- Pasada la hora → spots se liberan automáticamente en UI
- Check-in con carpooling: +30 Riffs

### Módulo Puestos (Professional/Guest)
- Guest: solo puede reservar spots cowork (C01, C04, C05)
- Capacidad completa: mensaje inclusivo + log en `worst_case_log`

### Módulo Parking
- Plan B extendido: ParkUp + Estacionamiento Público (desde `config.ts`)
- Spots high_frequency: color naranja, info en bottom sheet
- Lunes: espacios 211-214 reservados para directores

### Prevención de hydration errors
- Fechas/horas calculadas en `useEffect` (nunca en render body)
- `getDeskState(desk, myId, pastCutoff: boolean)` — pastCutoff como parámetro
- Greeting neutral "¡Hola!" en DailyCard; greeting con hora en ExecutiveHome via useEffect

---

## Pendientes (próximas iteraciones)

### Prioridad Alta
- [ ] **Admin: gestión de incidentes** — ver todos los reportes, cambiar status open→resolved
- [ ] **Admin: gestión de usuarios** — asignar roles, áreas, puestos fijos
- [ ] **Cron job** — liberar reservas sin check-in a las 9:15 AM (DB trigger o Vercel Cron)

### Prioridad Media
- [ ] **Push Notifications** — avisos de check-in
- [ ] **Resend email** — confirmación de reserva / notificación al Office Manager en incidentes
- [ ] **Riffs total persistente** en `profiles.riffs_total` (actualmente calculado en runtime)
- [ ] **QR Check-in** — flujo de check-in físico en oficina
- [ ] **Historial de Riffs** — mostrar `riffs_history` en /profile (años anteriores)

### Prioridad Baja
- [ ] **Tests** — reglas de negocio de reservas y riffs
- [ ] **Ícono PWA real** — reemplazar placeholder en `/public/icons/`

---

## Variables de entorno requeridas

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=nanolab
SENTRY_PROJECT=javascript-nextjs
```

---

## Cómo configurar Supabase

1. Crear proyecto en supabase.com
2. SQL Editor → ejecutar `docs/schema.sql` (base)
3. SQL Editor → ejecutar `docs/migrations/v2_blueprint.sql` (v2.0)
4. SQL Editor → crear tabla `incidents` + RLS (ver historial de sesión)
5. SQL Editor → crear `riffs_history` + `reset_riffs_annual()` + pg_cron (ver historial de sesión)
6. Asignar roles a usuarios:
   ```sql
   UPDATE profiles SET role='executive' WHERE email IN ('director@dhl.com', 'manager@dhl.com');
   UPDATE profiles SET role='guest' WHERE email = 'externo@empresa.com';
   UPDATE profiles SET role='admin' WHERE email = 'officemanager@dhl.com';
   ```

---

## Cómo ejecutar el proyecto

```bash
npm install
npm run dev        # desarrollo
npm run build      # build producción
npm start
```

---

*Actualizado por Claude Code el 2026-05-09 — v2.1.0*
