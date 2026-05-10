# Especificación Front-End — Daily Card + Home Post-Acción
**Proyecto:** DHL Connect & Park  
**Versión:** 1.0  
**Fecha:** 2026-05-09  
**Autor:** Sally (UX Designer / UX Writer)

---

## Resumen ejecutivo

Reemplazar el Home actual (dashboard genérico con links) por un flujo de dos fases:

1. **Fase 1 — Daily Card:** Pantalla limpia con una sola acción contextual por perfil. Sin nav, sin distracciones. El usuario completa su acción del día.
2. **Fase 2 — Home post-acción:** Dashboard de estado personal relevante al perfil. Solo aparece después de que la Fase 1 fue completada.

---

## Arquitectura de componentes

```
src/
  app/(app)/home/
    page.tsx                  ← orquestador: decide Fase 1 o Fase 2
  components/
    DailyCard/
      index.tsx               ← dispatcher por rol
      ExecutiveCard.tsx        ← card Executive
      ProfessionalCard.tsx     ← card Professional
      GuestCard.tsx            ← card Guest
    Homedashboard/
      index.tsx               ← dispatcher por rol
      ExecutiveHome.tsx        ← home post-acción Executive
      ProfessionalHome.tsx     ← home post-acción Professional
      GuestHome.tsx            ← home post-acción Guest
```

---

## Lógica de orquestación — `home/page.tsx`

```typescript
// Determina qué mostrar:
// 1. Obtener perfil del usuario (rol, full_name)
// 2. Obtener estado del día del usuario:
//    - ¿Tiene reserva confirmada hoy? (desk_reservations donde date=today, status=confirmed)
//    - ¿Hizo check-in? (checked_in=true)
//    - ¿Liberó su espacio hoy? (status=cancelled y user_id coincide, date=today)
//    - Para executive: ¿tiene weekly_plan para hoy con solidarity_released=true?
// 3. Si dailyActionCompleted === false → render <DailyCard role={role} />
// 4. Si dailyActionCompleted === true → render <Homedashboard role={role} />

// dailyActionCompleted es true cuando:
// - Executive: eligió "usar" o "liberar" hoy (weekly_plan para hoy existe)
// - Professional: tiene reserva confirmed+checked_in, O canceló su reserva hoy
// - Guest: no tiene acción obligatoria — siempre va directo al Home (Fase 2)
//   EXCEPCIÓN: si es antes de las 09:01 AM, muestra su card informativa primero
```

---

## FASE 1 — Daily Cards

### Reglas generales de UI para todas las cards

- **Fondo:** `bg-dhl-light-gray` (igual al resto de la app)
- **La card:** `bg-white rounded-2xl shadow-sm border border-dhl-mid-gray` centrada verticalmente en el viewport, max-width 380px, padding 32px
- **Sin BottomNav visible** durante Fase 1 — la card debe tomar toda la atención
- **Sin header** de DHL durante Fase 1 — solo el logo pequeño arriba centrado como referencia de marca
- **Tipografía saludo:** `text-xl font-bold text-dhl-dark`
- **Tipografía pregunta:** `text-base text-dhl-gray mt-2`
- **Botones primarios:** `w-full py-3 rounded-xl font-semibold text-sm`
- **Transición post-acción:** fade-out de la card (300ms) → fade-in del Home

---

### 1A. ExecutiveCard — Estados

#### Estado `pending` (no ha definido su día)

**Mostrar cuando:** No existe `weekly_plan` para hoy con `planned_status` definido.

```
Layout:
  - Logo DHL pequeño centrado (top: 24px)
  - Card centrada verticalmente:
    - Saludo: "Buenos días, [first_name]."
    - Pregunta: "¿Usas tu oficina hoy?"
    - Botón A: "Sí, la uso"        → bg-dhl-dark text-white
    - Botón B: "La libero hoy"     → bg-dhl-yellow text-dhl-dark
    (gap-3 entre botones, apilados verticalmente)
```

**Copy exacto:**
```
"Buenos días, [first_name]."
"¿Usas tu oficina hoy?"
Botón A: "Sí, la uso"
Botón B: "La libero hoy"
```

**Acción Botón A:**
- POST /api/planner con `{ planned_status: "office", solidarity_released: false, day_of_week: hoy }`
- Card desaparece sin mensaje. Transition directo a HomeExecutive.

**Acción Botón B:**
- Mostrar estado `released` inline (ver abajo)

#### Estado `released` (liberó su espacio — respuesta inline)

```
Layout (reemplaza el contenido de la card, sin cambiar el contenedor):
  - Ícono: ✦ (text-dhl-yellow, text-2xl, centrado)
  - Título: "Liberado. Gracias, [first_name]."
  - Subtítulo: "Tu espacio ya está disponible\npara quien lo necesite hoy."
  - Riffs badge: "+ 50 Riffs" (bg-dhl-yellow/20 text-dhl-dark font-bold px-3 py-1 rounded-full)
  - Link discreto: "Ver mi impacto →" (text-xs text-dhl-gray underline)
  - Después de 2.5s → auto-transition a HomeExecutive
```

**Copy exacto:**
```
"✦  Liberado. Gracias, [first_name]."
"Tu espacio ya está disponible para quien lo necesite hoy."
"+ 50 Riffs"
"Ver mi impacto →"
```

**Acción:**
- POST /api/planner con `{ planned_status: "home_office", solidarity_released: true, day_of_week: hoy }`
- Mostrar estado released 2.5s → transición a Home

#### Estado `away` (ya definió que usa su espacio)

No hay card. Directo a HomeExecutive.

---

### 1B. ProfessionalCard — Estados

#### Estado `pending_early` (antes de 09:01 AM, sin acción)

**Mostrar cuando:** No hay reserva confirmed+checked_in hoy, y hora < 09:01.

```
Layout:
  - Logo DHL pequeño centrado
  - Card centrada:
    - Saludo: "Hola, [first_name]. ¿Vienes hoy?"
    - Info: "Tu puesto [desk_code] te espera hasta las 9:00 AM."
      (text-xs text-dhl-gray — solo mostrar si tiene puesto asignado)
    - Countdown: "⏱ Quedan [X] minutos"
      (solo mostrar si faltan menos de 60 minutos para las 9:00 AM)
      (text-xs text-amber-600 font-semibold)
    - Botón A: "Sí, ya llegué"    → bg-dhl-dark text-white
    - Botón B: "Hoy no vengo"     → bg-white text-dhl-gray border border-dhl-mid-gray
```

**Copy exacto:**
```
"Hola, [first_name]. ¿Vienes hoy?"
"Tu puesto [desk_code] te espera hasta las 9:00 AM."
"⏱ Quedan [X] minutos"
Botón A: "Sí, ya llegué"
Botón B: "Hoy no vengo"
```

**Acción Botón A:** Mostrar estado `checkin_form` inline
**Acción Botón B:** Mostrar estado `released` inline

#### Estado `checkin_form` (confirmó que está — mini-form inline)

```
Layout (reemplaza los botones dentro de la misma card, sin scroll):
  - El saludo y el texto de puesto se mantienen arriba
  - Aparecen dos filas de toggles:
    
    "¿Viniste en auto?"
    [  Sí  ]  [  No  ]   ← botones pill seleccionables

    "¿Hiciste carpooling?"
    [  Sí  ]  [  No  ]   ← botones pill seleccionables

  - Botón: "Listo, confirmar" → bg-dhl-dark text-white w-full
    (habilitado solo cuando ambas preguntas tienen respuesta)
```

**Copy exacto:**
```
"¿Viniste en auto?"       → opciones: "Sí" / "No"
"¿Hiciste carpooling?"    → opciones: "Sí" / "No"
Botón: "Listo, confirmar"
```

**Acción "Listo, confirmar":**
- PATCH /api/desks/reserve con `{ desk_id, date: today, carpooling: [bool] }`
- Si auto=Sí → POST /api/parking/reserve (asignar parking disponible automáticamente si hay)
- Mostrar estado `confirmed` inline

#### Estado `confirmed` (check-in exitoso — respuesta inline)

```
Layout (reemplaza el form, misma card):
  - "✦  Puesto confirmado."  (font-bold text-dhl-dark)
  - "[desk_code] es tuyo hoy."
  - "Que sea un buen día en la oficina."
  - Riffs badge SOLO si carpooling=true: "+ 30 Riffs por carpooling"
  - Después de 2.5s → auto-transition a HomeProfessional
```

**Copy exacto:**
```
"✦  Puesto confirmado."
"[desk_code] es tuyo hoy."
"Que sea un buen día en la oficina."
"+ 30 Riffs por carpooling"   ← condicional
```

#### Estado `released_voluntary` (dijo "Hoy no vengo" — respuesta inline)

```
Layout:
  - "Entendido. Tu puesto queda libre"
  - "para quien lo necesite hoy."
  - ""
  - "Nos vemos cuando vuelvas."
  - Después de 2.5s → auto-transition a HomeProfessional
```

**Copy exacto:**
```
"Entendido. Tu puesto queda libre para quien lo necesite hoy."
"Nos vemos cuando vuelvas."
```

**Acción:**
- DELETE /api/desks/reserve con `{ reservation_id }` (si tenía reserva)
- Si no tenía reserva: no llamada (igual transiciona)

#### Estado `auto_released` (post 09:01 AM, no hizo check-in)

**Mostrar cuando:** Hora > 09:01 AM Y no hay checked_in=true hoy.

```
Layout:
  - "Tu puesto fue liberado a las 9:01 AM."   (text-sm text-dhl-dark)
  - "¿Ya estás aquí? Mira qué hay libre."     (text-xs text-dhl-gray)
  - Botón: "Ver disponibilidad"  → border border-dhl-dark text-dhl-dark
  - Después de 4s sin acción → auto-transition a HomeProfessional
```

**Copy exacto:**
```
"Tu puesto fue liberado a las 9:01 AM."
"¿Ya estás aquí? Mira qué hay libre."
Botón: "Ver disponibilidad"
```

---

### 1C. GuestCard — Estados

#### Estado `pre_cutoff` (antes de 09:01 AM)

```
Layout:
  - "Buenos días, [first_name]."
  - "Los espacios se actualizan a las 9:01 AM."
  - "Vuelve en un momento."
  - Después de 3s → auto-transition a GuestHome (que mostrará el contador)
```

**Copy exacto:**
```
"Buenos días, [first_name]."
"Los espacios se actualizan a las 9:01 AM."
"Vuelve en un momento."
```

#### Estado `available` (post 09:01 AM, hay espacios libres)

```
Layout:
  - "Hay lugar hoy."                                     (text-xl font-bold)
  - "[X] espacios disponibles ahora mismo."              (text-sm text-dhl-gray)
  - Botón: "Ver el mapa →"  → bg-dhl-dark text-white w-full
```

**Copy exacto:**
```
"Hay lugar hoy."
"[X] espacios disponibles ahora mismo."
Botón: "Ver el mapa →"
```

**Acción botón:** Navegar a /desks. La Daily Card NO aparece más ese día.

#### Estado `full` (post 09:01 AM, sin disponibilidad)

```
Layout:
  - "Oficina completa por ahora."                        (text-base font-semibold)
  - "Puede abrirse un espacio en cualquier momento."     (text-xs text-dhl-gray)
  - "La app te avisa."                                   (text-xs text-dhl-gray)
  - Botón A: "Activar aviso"       → bg-dhl-dark text-white
  - Botón B: "Ver alternativas"    → border border-dhl-mid-gray text-dhl-gray
```

**Copy exacto:**
```
"Oficina completa por ahora."
"Puede abrirse un espacio en cualquier momento. La app te avisa."
Botón A: "Activar aviso"
Botón B: "Ver alternativas"
```

**Acción "Ver alternativas":** Navegar a /parking o mostrar inline las alternativas de la spec de ParkingGrid (ParkUp + Av. del Parque 4023).

---

## FASE 2 — Home Post-Acción (Dashboard de estado)

El BottomNav y el Header DHL vuelven a aparecer normalmente aquí.

### 2A. ExecutiveHome

```
Secciones (de arriba a abajo, separadas por dividers):

1. STATUS CARD — "Tu oficina hoy"
   - Si liberó: "Tu oficina · Liberada hoy"
                "Alguien ya la está usando." (si hay reserva de otra persona)
                Botón discreto: "Recuperar" → text-xs text-red-500 underline
   - Si usa:    "Tu oficina · Reservada"
                "Tu espacio está asegurado para hoy."

2. RIFFS CARD
   - Nombre del nivel: e.g. "Rising Star"
   - Barra de progreso (igual que la implementada en /profile)
   - Puntos totales: "[X] Riffs"

3. IMPACTO DEL MES
   - "Este mes liberaste [X] días."
   - "Apoyaste a [Y] personas."   ← calculado desde riffs_log action=solidarity_release
   - Solo mostrar si X > 0. Si X = 0: ocultar sección.

4. ACCESOS RÁPIDOS (solo si son relevantes)
   - Planner semanal  →  /planner
   - Incidentes       →  /incidentes
```

---

### 2B. ProfessionalHome

```
Secciones:

1. STATUS PUESTO
   - Si confirmed: "Puesto [desk_code] · Confirmado"
                   "Hoy hasta las 18:00"
                   Botón: "Liberar ahora" → text-xs text-dhl-gray underline
   - Si released:  "Sin puesto hoy"
                   "Mira qué está disponible." → link a /desks
   - Si auto-released: "Puesto liberado automáticamente."

2. STATUS PARKING (solo si vino en auto)
   - Si tiene reserva parking: "Parking · Nivel -2 · Espacio [N°]"
   - Si no tiene: "Sin parking reservado hoy."
                  Botón: "Reservar" → /parking

3. RIFFS CARD
   - Nivel + barra de progreso + puntos totales

4. ACCESOS RÁPIDOS
   - Mi estado semanal  → /status
   - Incidentes         → /incidentes
```

---

### 2C. GuestHome

```
Secciones:

1. STATUS ESPACIO
   - Si tiene espacio ocupado: "Espacio [code] · Ocupado por ti"
                                Botón: "Liberar" → text-xs text-dhl-gray underline (+20 Riffs label al lado)
   - Si no tiene espacio: "Sin espacio ocupado ahora."
                           Botón: "Ver disponibilidad" → /desks

2. DISPONIBILIDAD EN TIEMPO REAL (mini-resumen)
   - "[X] puestos libres ahora mismo"
   - Actualizado hace [N] min — (timestamp del último cambio)

3. RIFFS CARD
   - Nivel + barra + puntos

4. NOTA CULTURAL (solo si no tiene espacio)
   - "Si terminas antes, libera tu espacio. Alguien más lo agradecerá. +20 Riffs"
   - Texto pequeño, tono suave. No es un CTA agresivo.
```

---

## Datos necesarios en `home/page.tsx` (server component)

```typescript
// Queries a ejecutar en paralelo:
const [
  profile,              // role, full_name, area
  deskReservationToday, // desk_reservations donde user_id=me, date=today, status=confirmed
  parkingResToday,      // parking_reservations donde user_id=me, date=today, status=confirmed
  weeklyPlanToday,      // weekly_plans donde user_id=me, week_start=currentWeekStart, day_of_week=hoy
  riffsData,            // riffs_log donde user_id=me (últimas 50 entradas para calcular total y nivel)
  solidarityThisMonth,  // riffs_log donde user_id=me, action=solidarity_release, created_at >= inicio del mes
  availableDesksToday,  // count de desk_reservations libres hoy (para Guest)
] = await Promise.all([...])

// Lógica:
const dailyActionCompleted =
  role === 'executive' ? !!weeklyPlanToday :
  role === 'professional' ? (deskReservationToday?.checked_in || deskReleasedToday) :
  true // guest siempre pasa a Home (su card es informativa)

// Pasar todo como props a <DailyCard> o <Homedashboard> según dailyActionCompleted
```

---

## Interacciones client-side (componentes client)

Todas las cards son **client components** (`"use client"`).

- Los POSTs a APIs se hacen desde el cliente.
- Después de respuesta exitosa de la API → `router.refresh()` + animación de transición.
- El countdown del Professional se actualiza con `setInterval` cada 30s.
- No hay polling de disponibilidad — el Guest actualiza manualmente con pull-to-refresh o botón.

---

## Animaciones (Tailwind / CSS)

```css
/* Fade out card → fade in home */
.card-exit { animation: fadeOut 300ms ease forwards; }
.home-enter { animation: fadeIn 300ms ease forwards; }

@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }

/* Riffs badge pop */
.riffs-pop { animation: pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes pop { 
  0%   { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1);   opacity: 1; }
}
```

Agregar estas clases al `globals.css` del proyecto.

---

## Archivos a crear / modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/app/(app)/home/page.tsx` | MODIFICAR | Orquestador Fase 1/2, queries paralelas |
| `src/components/DailyCard/index.tsx` | CREAR | Dispatcher por rol |
| `src/components/DailyCard/ExecutiveCard.tsx` | CREAR | Card Executive con estados |
| `src/components/DailyCard/ProfessionalCard.tsx` | CREAR | Card Professional con estados y countdown |
| `src/components/DailyCard/GuestCard.tsx` | CREAR | Card Guest informativa |
| `src/components/Homedashboard/index.tsx` | CREAR | Dispatcher por rol |
| `src/components/Homedashboard/ExecutiveHome.tsx` | CREAR | Dashboard Executive |
| `src/components/Homedashboard/ProfessionalHome.tsx` | CREAR | Dashboard Professional |
| `src/components/Homedashboard/GuestHome.tsx` | CREAR | Dashboard Guest |
| `src/app/globals.css` | MODIFICAR | Agregar animaciones fadeOut/fadeIn/pop |

---

## Copy de referencia rápida (todos los textos exactos)

### Executive
- Saludo: `"Buenos días, [first_name]."`
- Pregunta: `"¿Usas tu oficina hoy?"`
- Btn usar: `"Sí, la uso"`
- Btn liberar: `"La libero hoy"`
- Confirmación liberación: `"✦  Liberado. Gracias, [first_name]."` / `"Tu espacio ya está disponible para quien lo necesite hoy."` / `"+ 50 Riffs"`
- Home status usando: `"Tu oficina · Reservada"` / `"Tu espacio está asegurado para hoy."`
- Home status liberada: `"Tu oficina · Liberada hoy"` / `"Alguien ya la está usando."` / btn: `"Recuperar"`
- Home impacto: `"Este mes liberaste [X] días."` / `"Apoyaste a [Y] personas."`

### Professional
- Saludo: `"Hola, [first_name]. ¿Vienes hoy?"`
- Info puesto: `"Tu puesto [code] te espera hasta las 9:00 AM."`
- Countdown: `"⏱ Quedan [X] minutos"`
- Btn confirmar: `"Sí, ya llegué"`
- Btn liberar: `"Hoy no vengo"`
- Pregunta auto: `"¿Viniste en auto?"` / opciones: `"Sí"` `"No"`
- Pregunta carpooling: `"¿Hiciste carpooling?"` / opciones: `"Sí"` `"No"`
- Btn submit: `"Listo, confirmar"`
- Confirmación: `"✦  Puesto confirmado."` / `"[code] es tuyo hoy."` / `"Que sea un buen día en la oficina."` / `"+ 30 Riffs por carpooling"` (condicional)
- Sin venir: `"Entendido. Tu puesto queda libre para quien lo necesite hoy."` / `"Nos vemos cuando vuelvas."`
- Auto-liberado: `"Tu puesto fue liberado a las 9:01 AM."` / `"¿Ya estás aquí? Mira qué hay libre."` / btn: `"Ver disponibilidad"`

### Guest
- Pre-cutoff: `"Buenos días, [first_name]."` / `"Los espacios se actualizan a las 9:01 AM."` / `"Vuelve en un momento."`
- Con disponibilidad: `"Hay lugar hoy."` / `"[X] espacios disponibles ahora mismo."` / btn: `"Ver el mapa →"`
- Sin disponibilidad: `"Oficina completa por ahora."` / `"Puede abrirse un espacio en cualquier momento. La app te avisa."` / btn A: `"Activar aviso"` / btn B: `"Ver alternativas"`
- Home con espacio: `"Espacio [code] · Ocupado por ti"` / btn: `"Liberar"` / label: `"+20 Riffs"`
- Home sin espacio: `"Sin espacio ocupado ahora."` / btn: `"Ver disponibilidad"`
- Nota cultural: `"Si terminas antes, libera tu espacio. Alguien más lo agradecerá. +20 Riffs"`

---

*Documento generado por Sally (UX Designer) — DHL Connect & Park v2.1*
