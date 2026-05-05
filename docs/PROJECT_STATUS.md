# DHL Connect & Park — Estado del Proyecto
**Fecha**: 5 de mayo de 2025
**Versión**: 0.1.0 — MVP completado
**Commit**: `a8ce140`

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
| Resend | 6.12.2 | Email (pendiente wiring) |
| web-push | 3.6.7 | Push notifications (pendiente wiring) |

**Colores DHL**: Rojo `#D40511` · Amarillo `#FFCC00`

---

## Estructura de rutas

```
/                    → redirect a /home
/login               → autenticación email/password
/home                → dashboard (resumen del día)
/desks               → mapa de puestos
/parking             → grid de estacionamiento
/status              → estado diario del colaborador
/incidentes          → reporte de incidentes
/admin               → panel de administración (role=admin)
/api/auth/callback   → callback OAuth
```

---

## Archivos del proyecto

### App (src/app)
```
(auth)/
  layout.tsx          ← fondo rojo DHL para login
  login/page.tsx      ← formulario email/password

(app)/
  layout.tsx          ← header con logo DHL, BottomNav, PolicyModal
  home/page.tsx       ← dashboard con resumen del día
  desks/page.tsx      ← server component que carga datos y pasa a DeskMap
  parking/page.tsx    ← server component que carga datos y pasa a ParkingGrid
  status/page.tsx     ← server component que carga semana y pasa a StatusForm
  incidentes/page.tsx ← server component + historial personal

(admin)/
  layout.tsx          ← header oscuro, nav admin, guard role=admin
  admin/page.tsx      ← dashboard con 4 stats + incidentes abiertos

api/
  auth/callback/route.ts ← exchange code for session
```

### Componentes (src/components)
```
BottomNav.tsx     ← nav inferior fijo con 5 ítems
PolicyModal.tsx   ← modal "3 reglas de oro" (se muestra 1 sola vez)
DeskMap.tsx       ← mapa interactivo de puestos (client component)
ParkingGrid.tsx   ← grid de estacionamientos (client component)
StatusForm.tsx    ← calendario semanal + equipo (client component)
IncidentForm.tsx  ← formulario de reporte (client component)
```

### Lib (src/lib)
```
supabase/client.ts    ← cliente browser
supabase/server.ts    ← cliente server (SSR)
supabase/middleware.ts← sesión + redirects
push/vapid.ts         ← configuración VAPID keys
resend/client.ts      ← cliente Resend
```

---

## Base de datos (Supabase)

### Tablas implementadas
| Tabla | Descripción |
|-------|-------------|
| `profiles` | Extiende auth.users. Campos: role, area, status_type, policy_accepted_at, push_subscription |
| `sites` | Oficinas (seed: Centro de Energía CE) |
| `desks` | 24 puestos abiertos + zonas A/B/C/GG |
| `area_desk_schedule` | Calendario semanal de puestos compartidos por área |
| `user_day_status` | Estado diario: office/site/home_office/vacation |
| `desk_reservations` | Reservas de puesto por día |
| `parking_spots` | 22 espacios (2 calle + 20 nivel -2) |
| `parking_reservations` | Reservas de parking por día |
| `incidents` | Reportes de incidentes |
| `owner_requests` | Solicitudes "Ask the Owner" |

### Archivo de esquema
`docs/schema.sql` — incluye tablas, RLS, trigger de auto-creación de perfil, y seed data completo.

### Seed data incluido
- 1 sitio: Centro de Energía (CE)
- 25 puestos (zonas A, B, C, GG)
- Calendario de áreas (17 registros area_desk_schedule)
- 22 espacios de estacionamiento con asignaciones reales

---

## Reglas de negocio implementadas

### Módulo Puestos (Mi Espacio)
- Colores del mapa:
  - 🟢 Verde: disponible (shared/cowork sin reserva)
  - 🟡 Amarillo: dueño asignado (fixed, dueño sin marcar estado)
  - ⚫ Gris: ocupado (tiene reserva confirmada)
  - 🔵 Azul: mi puesto personal
- Si el dueño de un puesto fijo marca `site` o `home_office` → puesto verde (disponible)
- "Ask the Owner": si el dueño no marcó estado → se envía `owner_request` (pending)
- 1 reserva máxima por usuario por día
- Check-in antes de 10:00 AM (lógica de check-in aún pendiente de UI final)

### Módulo Parking (Smart Parking)
- Lunes: espacios 211-214 bloqueados automáticamente para directores
- Martes-Viernes: 211-214 disponibles para todos
- Espacios 18-19 (Nivel Calle): siempre bloqueados, gestión por Asistente
- 1 reserva de parking máxima por usuario por día
- Plan B activado cuando todos los cupos libres están ocupados
- Visitantes (status_type='visiting'): aviso de reserva 24h anticipación

### Módulo Estado (Mi Estado)
- Opciones: 🏢 En Oficina / 🏭 En Site / 🏠 Home Office / 🏖️ Vacaciones
- Vista semanal (Lunes a Viernes)
- "Site" = fue a centro de distribución, NO va a CE → puesto queda libre
- "Home Office" = trabaja desde casa, NO va a CE → puesto queda libre
- Vista "Ritmo del Equipo" muestra estado de todos los colegas hoy

### Módulo Incidentes (Directo a Office Manager)
- Categorías: Limpieza / Insumos-Kitchenette / Mantenimiento / Otro
- Canal único → evita duplicidades con Aramark/Mantenimiento
- Admin ve todos los incidentes abiertos en el panel

### Auth y Onboarding
- Login email/password (Supabase Auth)
- Modal "3 Reglas de Oro" en el primer login (`policy_accepted_at = null`)
- Middleware redirige usuarios no autenticados a `/login`
- Usuarios autenticados van directo a `/home`
- Admin badge visible en header si `role = 'admin'`

---

## Datos del layout de la oficina CE

### Zonas de puestos abiertos
| Código | Zona | Tipo | Área |
|--------|------|------|------|
| A01 | A | fixed | BD |
| A02 | A | fixed | FIN |
| A03 | A | fixed | FIN |
| A04 | A | fixed | OE |
| A05 | A | shared | OE/FIN |
| A06 | A | fixed | OE |
| B01 | B | fixed | FIN |
| B02 | B | shared | OE/FIN |
| B03 | B | fixed | BD |
| B04 | B | shared | BD/SD |
| B05 | B | fixed | KAM |
| B06 | B | shared | Legal/MKT |
| B07 | B | fixed | SD |
| B08 | B | shared | SD/FIN |
| B09 | B | fixed | SD |
| B10 | B | fixed | SD |
| B11 | B | shared | IT/OE |
| B12 | B | shared | IT/OE |
| C01 | C | cowork | Co-Work |
| C02 | C | fixed | HR |
| C03 | C | fixed | HR |
| C04 | C | cowork | Co-Work |
| C05 | C | cowork | Co-Work |
| C06 | C | fixed | HR |
| GG01 | GG | fixed | GG |

### Espacios de estacionamiento Nivel -2
| N° | Tipo | Asignado a |
|----|------|------------|
| 18 | blocked | Nivel Calle — Revisar con Asistente |
| 19 | blocked | Nivel Calle — Revisar con Asistente |
| 206 | fixed | Guerrero Gajardo, José Tomás |
| 207 | fixed | Corona Coronel, Alejandro |
| 208 | fixed | Sánchez García, Alessandra |
| 209 | fixed | Márquez Fuenzalida, Rodrigo Ignacio |
| 210 | fixed | Jiménez Cox, Agustín |
| 211 | director_reserved | Alvaro Quintana Milos (Director Transporte) |
| 212 | director_reserved | Gorgas, Sebastián José (Director Tech & AEMCE) |
| 213 | director_reserved | Vinicius Falcao (Director LSHC) |
| 214 | director_reserved | Danilo Marchant (Director Consumer & Retail) |
| 215 | available | — |
| 216 | available | — |
| 217 | available | — |
| 218 | fixed | Stepancic Juchler, Paola |
| 219 | fixed | Gómez Badillo, Henry Giovanny |
| 220 | fixed | Arratia Olivares, Álvaro José |
| 228 | fixed | Dos Santos Cerqueira, Marcos Vinícios |
| 229 | fixed | Arango Estrada, Germán |
| 230 | available | — |
| 241 | available | — |
| 242 | available | — |

---

## Pendientes (próximas iteraciones)

### Prioridad Alta
- [ ] **Configurar env vars** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] **Ejecutar `docs/schema.sql`** en Supabase SQL Editor
- [ ] **Crear usuarios de prueba** en Supabase Auth y asignarles área/rol
- [ ] **Asignar puestos fijos** a usuarios reales (`desks.assigned_user_id`)

### Prioridad Media
- [ ] **Check-in QR o Geolocalización** — liberar puesto si no hay check-in antes de 10:00 AM
- [ ] **Push Notifications** — "Ask the Owner" envía push al dueño del puesto
- [ ] **Notificación al dueño** cuando su solicitud es aprobada/denegada
- [ ] **Resend email** — confirmación de reserva al usuario
- [ ] **Admin: gestión de usuarios** (`/admin/users`) — asignar áreas, roles, puestos fijos
- [ ] **Admin: gestión de incidentes** — cambiar status open→in_progress→resolved

### Prioridad Baja
- [ ] **Cron job** — liberar reservas sin check-in a las 10:15 AM
- [ ] **Módulo Calendario de Equipo** — jefes de área cargan calendario semanal del equipo
- [ ] **Ícono PWA real** — reemplazar íconos placeholder en `/public/icons/`
- [ ] **Internacionalización** — todo está en español, pero por si acaso
- [ ] **Tests** — unitarios para las reglas de negocio de reservas

---

## Variables de entorno requeridas

```env
# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase Service Role (para operaciones admin)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Web Push — VAPID keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=...

# Resend (emails)
RESEND_API_KEY=re_...
```

## Cómo generar las VAPID keys
```bash
npx web-push generate-vapid-keys
```

---

## Cómo ejecutar el proyecto

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build
npm start
```

---

## Cómo configurar Supabase

1. Crear proyecto en supabase.com
2. Ir a **SQL Editor** → pegar y ejecutar `docs/schema.sql`
3. Ir a **Authentication → Users** → crear usuarios de prueba
4. Ejecutar en SQL Editor para asignar roles:
   ```sql
   -- Crear admin
   UPDATE profiles SET full_name='Admin DHL', role='admin', area='GG'
     WHERE email='admin@dhl.com';

   -- Asignar áreas a usuarios
   UPDATE profiles SET full_name='Ana López', area='FIN'
     WHERE email='ana@dhl.com';
   ```
5. Para asignar puestos fijos a usuarios:
   ```sql
   UPDATE desks SET assigned_user_id = (
     SELECT id FROM profiles WHERE email = 'ana@dhl.com'
   ) WHERE code = 'B01';
   ```

---

*Generado automáticamente por Claude Code el 2025-05-05*
