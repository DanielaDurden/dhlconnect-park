# DHL Connect & Park — Descripción de Funcionalidades
**Versión**: 3.1.0
**Fecha**: Mayo 2026
**Producción**: https://dhl-stage.vercel.app

---

## Visión general

**DHL Connect & Park** (nombre interno: DHL Stage) es una Progressive Web App (PWA) diseñada para el equipo del Centro de Energía (CE) de DHL Chile. Centraliza la gestión de puestos de trabajo y estacionamientos, elimina conflictos de espacio y da visibilidad al equipo sobre quién está en la oficina cada día.

La app funciona desde el navegador del celular y puede instalarse como una aplicación nativa (ícono en pantalla de inicio, sin necesidad de App Store). También está optimizada para uso en escritorio.

---

## 1. Onboarding y Acceso

### 1.1 Login
El usuario ingresa con su **email corporativo y contraseña**.

- Fondo gris claro DHL, header amarillo con logo oficial
- Validación de credenciales contra Supabase Auth
- Mensaje de error claro si las credenciales son incorrectas
- **Recordar sesión**: guarda el email en localStorage para pre-rellenar el campo en el siguiente ingreso
- **Olvidé mi contraseña**: modal informativo — las credenciales se gestionan a través del Office Manager
- Redirección automática a `/home` o `/admin` según el rol

### 1.2 Aceptación de políticas (primer ingreso)
La **primera vez** que un colaborador inicia sesión, aparece un modal con las **3 Reglas de Oro** de la oficina antes de poder usar cualquier función:

| Regla | Descripción |
|-------|-------------|
| 🧹 Orden | Mantén tu puesto limpio y ordenado al terminar la jornada |
| ✨ Limpieza | Deja los espacios comunes (cocina, salas) como los encontraste |
| 🤝 Respeto de espacios | Respeta los puestos asignados; si necesitas uno, solicítalo por la app |

El usuario debe presionar **"Acepto las reglas de oro"** para continuar. La aceptación queda registrada en DB con fecha y hora. El modal no vuelve a aparecer en sesiones posteriores.

---

## 2. Modelo de Roles

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| `host` | Inicio · Planner · Parking · Incidentes | Directors/Managers con oficina asignada |
| `guest` | Inicio · Puestos · Parking · Mi Estado · Incidentes | Colaboradores híbridos y visitantes |
| `professional` | Igual a guest | Alias legacy para colaboradores híbridos |
| `admin` | /admin/* exclusivo | Office Manager / TI |

Los usuarios **host** tienen una oficina o puesto base asignado permanentemente. Pueden configurar su semana mediante el **Planificador** y liberar su espacio solidariamente para otros.

Los usuarios **guest/professional** reservan puestos y estacionamientos día a día.

---

## 3. Módulo: Mi Espacio (Puestos de Trabajo)

### 3.1 Mapa interactivo de puestos
Muestra el **layout esquemático** de la planta abierta del CE, organizado en zonas:

- **Zona A** — Fila superior (6 puestos)
- **Zona B** — Planta principal en pares (12 puestos, 6 filas de 2)
- **Zona C** — Bloque Co-Work y HR (6 puestos)
- **Zona GG** — Gerencia General (1 puesto)

Cada puesto muestra su código y área. El color indica su estado en tiempo real:

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Disponible — puede ser reservado |
| 🟡 Amarillo | Dueño asignado sin estado del día marcado |
| ⚫ Gris | Ocupado — reserva confirmada para hoy |
| 🔵 Azul | Mi puesto — lo tengo reservado o asignado |

Al tocar cualquier puesto aparece un panel inferior con detalles y acciones disponibles.

### 3.2 Tipos de puestos

| Tipo | Descripción |
|------|-------------|
| **Fijo** | Asignado permanentemente a una persona o área |
| **Compartido** | Rotado entre áreas según calendario semanal |
| **Co-Work** | Libre para cualquier colaborador, sin restricciones |

### 3.3 Calendario de puestos compartidos
Los 7 puestos compartidos rotan entre áreas según un calendario fijo semanal. Un banner muestra qué áreas tienen puestos disponibles **hoy** y cuántos son.

### 3.4 Reserva de puesto
Un colaborador puede reservar un puesto **disponible** para el día actual:

- Solo se permite **1 reserva de puesto por día** por usuario
- Al reservar, el puesto cambia a azul (para el usuario) y gris (para el resto)
- Banner de confirmación en la parte superior de la pantalla

### 3.5 Cancelación de reserva
El usuario puede cancelar su propia reserva en cualquier momento. El puesto vuelve a quedar disponible.

### 3.6 Liberación automática por estado del dueño
Si el **titular de un puesto fijo** marca su estado como Site o Home Office, el sistema convierte automáticamente su puesto a disponible para que otros puedan reservarlo.

### 3.7 Banner de reserva activa
Si el usuario ya tiene un puesto reservado, aparece un banner verde en la parte superior con el código del puesto y el recordatorio de hacer check-in antes de las **10:00 AM**.

---

## 4. Módulo: Smart Parking (Estacionamientos)

### 4.1 Vista de estacionamientos
Muestra todos los espacios del CE:

- **Nivel Calle**: Espacios 18 y 19
- **Nivel -2**: Espacios 206 al 242 (20 cupos gestionados)

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Libre — disponible para reservar |
| 🟠 Naranja | Director — reservado los lunes para directivos |
| 🔴 Rojo | Ocupado |
| ⚫ Gris | Fuera de servicio |
| 🔵 Azul | Mi reserva |

### 4.2 Barra de ocupación
Barra de progreso con ocupación actual del día. Cambia de verde → naranja → rojo según nivel.

### 4.3 Reserva de estacionamiento
- Solo se permite **1 reserva por día** por usuario
- Confirmación inmediata, cancelable en cualquier momento

### 4.4 Control de acceso por rol (has_parking)
Los usuarios **host** solo pueden reservar estacionamiento si el admin les ha habilitado el acceso (`has_parking = true`). Si no tienen acceso, ven un banner ámbar informativo y pueden solicitar al Office Manager que lo active.

### 4.5 Prioridad Ejecutiva — Lunes
Los lunes, los espacios 211–214 quedan reservados para los directores:

| Espacio | Director |
|---------|---------|
| 211 | Director de Transporte |
| 212 | Director Tech & AEMCE |
| 213 | Director LSHC |
| 214 | Director Consumer & Retail |

De martes a viernes quedan disponibles para todos.

### 4.6 Plan B — Estacionamiento lleno
Si todos los espacios disponibles están ocupados, la app activa el **Plan B**: alerta con instrucciones para usar estacionamientos externos (ParkUp) y cómo gestionar el reembolso con RRHH.

---

## 5. Módulo: Mi Estado (Calendario Personal)

### 5.1 Marcación de estado diario
Cada colaborador indica **dónde trabaja cada día de la semana**:

| Estado | Emoji | Significado |
|--------|-------|-------------|
| En Oficina | 🏢 | Asistirá al Centro de Energía |
| En Site | 🏭 | Fue a un centro de distribución |
| Home Office | 🏠 | Trabaja desde casa |
| Vacaciones | 🏖️ | Fuera de disponibilidad |

"En Site" y "Home Office" liberan automáticamente el puesto fijo del colaborador.

### 5.2 Vista semanal
Muestra los 5 días hábiles de la semana actual. Para cada día: estado registrado, botones de acción (días futuros), o registro histórico (días pasados). El día de hoy aparece destacado.

### 5.3 Ritmo del Equipo
Al final de la pantalla: quién está dónde hoy en tiempo real, agrupado por tipo de estado y con nombre y área de cada persona.

---

## 6. Módulo: Planificador Semanal (solo host)

El **Planificador** permite a los hosts gestionar su presencia y asignación de puestos semana a semana:

- Vista de los 5 días hábiles con estado por día
- **Liberación solidaria**: el host puede liberar su puesto base para que otros lo usen, ganando **+50 Riffs**
- Planificación anticipada: el host puede marcar su estado para toda la semana de una sola vez
- Las liberaciones se sincronizan con el mapa de puestos en tiempo real

---

## 7. Módulo: Incidentes (Directo a Office Manager)

### 7.1 Reporte de incidentes
Canal unificado para reportar problemas de la oficina al Office Manager:

| Campo | Descripción |
|-------|-------------|
| **Tipo** | Limpieza / Insumos-Kitchenette / Mantenimiento / Otro |
| **Ubicación** | Planta abierta, Kitchenette, Sala de reuniones, Baños, Recepción, Pasillo, Otro |
| **Descripción** | Texto libre hasta 500 caracteres |

### 7.2 Confirmación y seguimiento
- Confirmación visual de éxito al enviar
- El reporte queda registrado con estado "Abierto"
- Historial de reportes del usuario con estado de cada uno (Abierto / En curso / Resuelto)

---

## 8. Gamificación — Riffs

Sistema de puntos para incentivar comportamientos positivos en la oficina:

| Acción | Puntos |
|--------|--------|
| Liberación solidaria de puesto base | +50 |
| Check-in con carpooling | +30 |
| Early checkout | +20 |
| Check-in a tiempo | +10 |

**Niveles**:
| Nivel | Rango |
|-------|-------|
| Opening Act | 0 – 999 |
| Rising Star | 1.000 – 2.999 |
| Headliner | 3.000 – 7.999 |
| Rock Legend | 8.000+ |

El historial y el nivel actual del colaborador están disponibles en `/profile`.

---

## 9. Push Notifications

La app puede enviar **notificaciones push** al dispositivo del usuario (celular o escritorio) incluso cuando la app no está abierta:

- Al entrar por primera vez, la app solicita permiso para enviar notificaciones
- La suscripción se guarda de forma segura en la base de datos
- Las notificaciones incluyen título y cuerpo descriptivo
- Al tocar la notificación, el usuario es dirigido directamente a la app

**Casos de uso actuales**:
- Avisos de check-in y recordatorios de reserva activa

---

## 10. Panel de Administración (Centro de Control)

Disponible exclusivamente para usuarios con rol **admin**. Acceso desde `/admin`.

### 10.1 Dashboard de KPIs
Grid con métricas del día:

| Métrica | Descripción |
|---------|-------------|
| 🖥️ Puestos hoy | Ocupación actual de los 24 puestos |
| 🚗 Parking hoy | Ocupación actual de los 22 spots |
| 😞 Demanda Insatisfecha | Solicitudes sin puesto disponible (log diario) |
| 📈 Tasa de Adopción | % de usuarios activos que reservaron este mes |
| 🌿 Green Score | Riffs por carpooling acumulados esta semana |

Alerta amarilla si demanda insatisfecha ≥ 3.

### 10.2 Mapa Maestro de Puestos
Floor plan interactivo completo con acceso a:
- **Liberación forzada** de cualquier reserva
- **Asignar reserva** a cualquier usuario desde dropdown
- **Toggle fuera de servicio** por puesto

### 10.3 Smart Parking Admin
Floor plan del Nivel -2 con nombre del ocupante sobre cada spot:
- Liberación forzada, asignación y toggle de servicio por spot

### 10.4 Inbox de Incidentes
- Tabs: Todos / Abierto / En curso / Resuelto
- Cambio de status con un clic

### 10.5 Rockstar Path (Gestión de Riffs)
- Leaderboard semanal con nivel badge
- Ajuste manual de puntos por usuario (acepta negativos)

### 10.6 Reportes
- 4 tipos de CSV descargable: Ocupación · Incidentes · Riffs · Demanda Insatisfecha
- Rango de fechas configurable

### 10.7 Gestión de Usuarios
- Lista de todos los hosts con toggle de acceso a estacionamiento (`has_parking`)
- Permite activar/desactivar el acceso al parking por host desde el panel

---

## 11. Experiencia PWA

### 11.1 Instalable en el celular
Sin App Store ni Play Store. Al visitar la URL, el navegador ofrece "Agregar a pantalla de inicio":
- Ícono en pantalla del celular
- Pantalla completa sin barra del browser
- Experiencia nativa

### 11.2 Navegación inferior (Bottom Navigation)
Barra fija en la parte inferior con acceso a los módulos por rol:

| Rol | Ítems en nav |
|-----|-------------|
| Host | Inicio · Planner · Parking · Incidentes |
| Guest / Professional | Inicio · Puestos · Parking · Mi Estado · Incidentes |
| Admin | Dashboard · Mapa · Parking · Incidentes · Rockstar · Reportes · Usuarios |

### 11.3 Push Notifications
Ver sección 9.

### 11.4 Compatibilidad
- Chrome, Safari, Edge modernos
- Optimizada para móvil (iPhone y Android)
- Responsive para tablet y escritorio

---

## 12. Seguridad y permisos

### 12.1 Autenticación
- Toda la app está protegida: usuarios no autenticados redirigen al login
- Sesiones con cookies seguras de Supabase (`@supabase/ssr`)
- Al cerrar sesión, la sesión se invalida en el servidor

### 12.2 Roles y acceso
- El guard de `(app)/layout.tsx` redirige a `/admin` si el rol es `admin`
- El guard de `(admin)/layout.tsx` redirige a `/home` si el rol no es `admin`
- Las API routes de admin usan `createAdminClient()` (service role key, bypasa RLS)

### 12.3 Row Level Security (Supabase)
- Cada usuario solo puede ver y modificar sus propios datos
- Los mapas de puestos y parking son visibles para todos (necesario para mostrar disponibilidad)
- Las operaciones admin usan service role key que bypasa RLS de forma controlada

---

## 13. Flujos principales de uso

### Flujo típico de un día laboral (guest/professional)

```
1. Abrir la app
2. Marcar estado en "Mi Estado" → En Oficina
3. Ir a "Mi Espacio" → reservar un puesto disponible
4. Si se viene en auto → "Smart Parking" → reservar espacio
5. Hacer check-in antes de las 10:00 AM (mantiene la reserva, gana Riffs)
6. Si hay un problema en la oficina → "Incidentes"
```

### Flujo típico de un día laboral (host)

```
1. Abrir la app
2. En "Planner" → marcar días de asistencia a la semana
3. Si no irá un día → liberar puesto solidariamente (+50 Riffs)
4. Si tiene parking habilitado → reservar espacio en Smart Parking
```

### Flujo de adopción (admin)

```
1. Entrar a /admin/users
2. Ver qué hosts tienen has_parking activo
3. Activar o desactivar según disponibilidad de cupos
4. Revisar dashboard de adopción mensual para identificar usuarios inactivos
```

---

*Actualizado por Claude Code — 2026-05-15 — v3.1.0*
