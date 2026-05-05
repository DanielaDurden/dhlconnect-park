# DHL Connect & Park — Descripción de Funcionalidades
**Versión**: 1.0 MVP
**Fecha**: Mayo 2025

---

## Visión general

**DHL Connect & Park** es una Progressive Web App (PWA) diseñada para el equipo del Centro de Energía (CE) de DHL Chile. Su objetivo es centralizar la gestión de puestos de trabajo y estacionamientos, eliminar conflictos de espacio y darle visibilidad al equipo sobre quién está en la oficina cada día.

La app funciona desde el navegador del celular y puede instalarse como una aplicación nativa (ícono en pantalla de inicio, sin necesidad de App Store).

---

## 1. Onboarding y Acceso

### 1.1 Login
El usuario ingresa con su **email corporativo y contraseña** a través de la pantalla de inicio de sesión.

- Pantalla de fondo rojo DHL con logo oficial
- Validación de credenciales contra Supabase Auth
- Si las credenciales son incorrectas, se muestra un mensaje de error claro
- Una vez autenticado, el sistema redirige automáticamente al inicio de la app
- Los usuarios ya autenticados que vuelvan a abrir la app entran directo sin necesidad de hacer login nuevamente

### 1.2 Aceptación de políticas (primer ingreso)
La **primera vez** que un colaborador inicia sesión, aparece un modal animado con las **3 Reglas de Oro** de la oficina antes de poder usar cualquier función:

| Regla | Descripción |
|-------|-------------|
| 🧹 Orden | Mantén tu puesto limpio y ordenado al terminar la jornada |
| ✨ Limpieza | Deja los espacios comunes (cocina, salas) como los encontraste |
| 🤝 Respeto de espacios | Respeta los puestos asignados; si necesitas uno, solicítalo por la app |

El usuario debe presionar **"Acepto las reglas de oro"** para continuar. Esta aceptación queda registrada en la base de datos con fecha y hora. El modal no vuelve a aparecer en sesiones posteriores.

---

## 2. Módulo: Mi Espacio (Puestos de Trabajo)

### 2.1 Mapa interactivo de puestos
Muestra el **layout esquemático** de la planta abierta del CE, organizado en zonas:

- **Zona A** — Fila superior (6 puestos)
- **Zona B** — Planta principal en pares (12 puestos, 6 filas de 2)
- **Zona C** — Bloque Co-Work y HR (6 puestos)
- **Zona GG** — Gerencia General (1 puesto)

Cada puesto se muestra como un cuadro con su código y área. El color indica su estado en tiempo real:

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Disponible — puede ser reservado |
| 🟡 Amarillo | Dueño asignado — el titular no ha marcado si irá o no |
| ⚫ Gris | Ocupado — ya tiene una reserva confirmada para hoy |
| 🔵 Azul | Mi puesto — este puesto me pertenece o yo lo tengo reservado |

Al tocar cualquier puesto, aparece un panel inferior con los detalles y las acciones disponibles.

### 2.2 Tipos de puestos

| Tipo | Descripción |
|------|-------------|
| **Fijo** | Asignado permanentemente a una persona o área específica |
| **Compartido** | Rotado entre áreas según el calendario semanal |
| **Co-Work** | Libre para cualquier colaborador, sin restricciones de área |

### 2.3 Calendario de puestos compartidos
Los **7 puestos compartidos** de la planta abierta rotan entre áreas según un calendario fijo. El sistema muestra en un banner qué áreas tienen puestos disponibles **hoy** y cuántos son:

| Área | Días asignados |
|------|---------------|
| Finanzas | Lunes, Martes, Jueves |
| OE | Martes, Miércoles, Jueves, Viernes |
| SD | Martes, Miércoles |
| BD | Miércoles, Jueves, Viernes |
| MKT | Martes, Jueves |
| Legal | Lunes, Viernes |
| IT | Lunes, Martes, Miércoles, Viernes |

### 2.4 Reserva de puesto
Un colaborador puede reservar un puesto **disponible** (shared o cowork) para el día actual:

- Solo se permite **1 reserva de puesto por día** por usuario
- Al reservar, el puesto cambia a color azul (para el usuario) y gris (para el resto)
- Aparece un banner de confirmación en la parte superior de la pantalla

### 2.5 Cancelación de reserva
El usuario puede cancelar su propia reserva en cualquier momento tocando su puesto reservado y seleccionando "Cancelar mi reserva". El puesto vuelve a quedar disponible para otros colaboradores.

### 2.6 Liberación automática por estado del dueño
Si el **titular de un puesto fijo** marca su estado del día como **Site** (fue a un centro de distribución) o **Home Office** (trabaja desde casa), el sistema convierte automáticamente su puesto a **verde (disponible)** para que otros puedan reservarlo.

Esto permite que los puestos fijos no queden vacíos sin uso cuando el titular no asiste a la oficina.

### 2.7 Función "Preguntar al Dueño"
Si un puesto fijo tiene titular asignado pero este **no ha marcado su estado del día**, el solicitante puede presionar **"📨 Preguntar al dueño"**. Esto:

1. Registra una solicitud en el sistema
2. (Próximamente) Envía una notificación push al titular del puesto preguntándole si lo usará
3. El titular puede liberar el puesto desde la notificación

Solo se puede enviar una solicitud por puesto por día para evitar spam.

### 2.8 Banner de reserva activa
Si el usuario ya tiene un puesto reservado, aparece un banner verde en la parte superior de la página con el código del puesto y el recordatorio de hacer check-in antes de las **10:00 AM**.

---

## 3. Módulo: Smart Parking (Estacionamientos)

### 3.1 Vista de estacionamientos
Muestra todos los espacios de estacionamiento del CE organizados por nivel:

- **Nivel Calle**: Espacios 18 y 19
- **Nivel -2**: Espacios 206 al 242 (20 cupos gestionados)

Cada espacio se muestra como una tarjeta con su número y estado:

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Libre — disponible para reservar |
| 🟡 Amarillo | Fijo — asignado permanentemente a un colaborador |
| 🟠 Naranja | Director — reservado los lunes para directivos |
| 🔴 Rojo | Bloqueado — requiere gestión del Office Manager |
| ⚫ Gris | Ocupado — ya reservado por otro usuario |
| 🔵 Azul | Mi reserva |

### 3.2 Barra de ocupación
En la parte superior se muestra una **barra de progreso** con la ocupación actual del día:
- Porcentaje de cupos ocupados vs. disponibles
- Cambia de color verde → naranja → rojo según el nivel de ocupación

### 3.3 Reserva de estacionamiento
El usuario puede reservar cualquier espacio **disponible** tocándolo y confirmando:

- Solo se permite **1 reserva de estacionamiento por día** por usuario
- La reserva queda confirmada inmediatamente
- Se puede cancelar en cualquier momento

### 3.4 Prioridad Ejecutiva — Lunes
Los **lunes**, el sistema bloquea automáticamente los espacios **211, 212, 213 y 214** para uso exclusivo de los directores:

| Espacio | Director |
|---------|---------|
| 211 | Alvaro Quintana Milos — Director de Transporte |
| 212 | Gorgas, Sebastián José — Director Tech & AEMCE |
| 213 | Vinicius Falcao — Director LSHC |
| 214 | Danilo Marchant — Director Consumer & Retail |

De martes a viernes, estos espacios quedan disponibles para cualquier colaborador.

### 3.5 Espacios bloqueados (Nivel Calle)
Los espacios **18 y 19** del Nivel Calle están marcados como bloqueados. Para acceder a ellos, el colaborador debe coordinar directamente con el Office Manager.

### 3.6 Plan B — Estacionamiento lleno
Si todos los espacios disponibles están ocupados, la app activa automáticamente el **"Plan B"**: un alerta destacada con instrucciones para usar estacionamientos externos (ParkUp) y cómo gestionar el reembolso a través de RRHH.

### 3.7 Aviso para visitantes
Los colaboradores que vienen de otros sites (clasificados como "visiting" en el sistema) reciben un aviso recordándoles que deben reservar su estacionamiento con al menos **24 horas de anticipación**.

---

## 4. Módulo: Mi Estado (Calendario Personal)

### 4.1 Marcación de estado diario
Cada colaborador puede indicar **dónde trabaja cada día de la semana**. Las opciones son:

| Estado | Emoji | Significado |
|--------|-------|-------------|
| En Oficina | 🏢 | Asistirá al Centro de Energía |
| En Site | 🏭 | Fue a un centro de distribución u otra instalación |
| Home Office | 🏠 | Trabaja desde casa |
| Vacaciones | 🏖️ | Fuera de disponibilidad |

> **Importante**: "En Site" y "Home Office" indican que el colaborador **no estará en el CE**, lo cual libera automáticamente su puesto fijo para que otros lo puedan usar.

### 4.2 Vista semanal
La pantalla muestra los **5 días hábiles de la semana actual** (Lunes a Viernes). Para cada día:

- Se indica si ya tiene un estado marcado
- Si el día aún no ha pasado, aparecen los 4 botones de estado para seleccionar
- El día de hoy aparece destacado con el indicador "HOY"
- Los días pasados muestran el estado registrado (o "Sin registro" si no se marcó)

Cada estado se puede cambiar en cualquier momento (upsert: si ya existe un estado para ese día, lo reemplaza).

### 4.3 Ritmo del Equipo
Al final de la pantalla se muestra una vista de **quién está dónde hoy** en tiempo real, agrupado por tipo de estado:

- Cuántas personas están en oficina, site, home office o de vacaciones
- El nombre y área de cada persona
- Permite a los jefes de área planificar mejor sin necesitar reuniones o mensajes de WhatsApp

---

## 5. Módulo: Directo a Office Manager (Incidentes)

### 5.1 Reporte de incidentes
Canal unificado para que los colaboradores reporten problemas de la oficina directamente al **Office Manager**, quien centraliza la comunicación con los proveedores (Aramark, Mantenimiento).

El formulario tiene tres campos:

| Campo | Descripción |
|-------|-------------|
| **Tipo de incidente** | Limpieza / Insumos-Kitchenette / Mantenimiento / Otro |
| **Ubicación** | Planta abierta, Kitchenette, Sala de reuniones, Baños, Recepción, Pasillo, Otro |
| **Descripción** | Texto libre de hasta 500 caracteres |

### 5.2 Categorías de incidentes

| Categoría | Icono | Ejemplos |
|-----------|-------|---------|
| **Limpieza** | 🧹 | Piso sucio, basureros llenos, baños sucios |
| **Insumos / Kitchenette** | 📦 | Falta café, jabón, papel, utensilios |
| **Mantenimiento** | 🔧 | Aire acondicionado, luces, techo, sillas rotas |
| **Otro** | 📋 | Cualquier situación no categorizada |

### 5.3 Confirmación y seguimiento
Al enviar el reporte:
- El formulario muestra una confirmación visual de éxito
- El reporte queda registrado en el sistema con estado "Abierto"
- El Office Manager puede ver todos los reportes abiertos desde el Panel de Administración

El colaborador puede ver su historial de reportes al final de la pantalla, con el estado de cada uno (Abierto / En curso / Resuelto).

### 5.4 Beneficio del canal único
Al centralizar todos los reportes en un solo canal, se evita que múltiples personas contacten al mismo proveedor por el mismo problema, se reduce la duplicidad de pedidos y se tiene trazabilidad de cada solicitud.

---

## 6. Panel de Administración

Disponible exclusivamente para usuarios con rol **admin**. Se accede desde el botón amarillo "Admin" en el encabezado de la app.

### 6.1 Dashboard de administración
Vista general con 4 métricas del día actual:

| Métrica | Descripción |
|---------|-------------|
| 👥 Usuarios registrados | Total de colaboradores en el sistema |
| 🖥️ Puestos reservados hoy | Reservas activas de escritorio para hoy |
| 🚗 Parking reservado hoy | Reservas activas de estacionamiento para hoy |
| 🔧 Incidentes abiertos | Reportes pendientes de resolución |

### 6.2 Gestión de incidentes
Listado de todos los incidentes abiertos con:
- Categoría y ubicación del problema
- Descripción completa
- Nombre del colaborador que reportó
- Fecha del reporte

Esto permite al Office Manager tener visibilidad total sin necesidad de revisar mensajes de WhatsApp, correos o llamadas.

---

## 7. Experiencia PWA (Progressive Web App)

### 7.1 Instalable en el celular
La app puede instalarse directamente desde el navegador sin pasar por el App Store ni el Play Store. Al visitar la URL, el navegador ofrece "Agregar a pantalla de inicio". Una vez instalada:

- Aparece como ícono en la pantalla del celular
- Se abre en pantalla completa, sin barra de navegación del browser
- Funciona con experiencia nativa

### 7.2 Navegación inferior (Bottom Navigation)
Barra fija en la parte inferior de la pantalla con acceso a los 5 módulos principales:

| Ícono | Destino |
|-------|---------|
| 🏠 Inicio | Dashboard / resumen del día |
| 🖥️ Puestos | Mapa de puestos Mi Espacio |
| 🅿️ Parking | Smart Parking |
| 📅 Mi Estado | Calendario personal |
| ⚠️ Incidentes | Directo a Office Manager |

El ícono del módulo activo se resalta en rojo DHL.

### 7.3 Compatibilidad
- Funciona en cualquier navegador moderno (Chrome, Safari, Edge)
- Optimizada para uso móvil (iPhone y Android)
- Responsive: también funciona en tablet y escritorio

---

## 8. Seguridad y permisos

### 8.1 Autenticación
- Toda la app está protegida: usuarios no autenticados son redirigidos automáticamente al login
- Las sesiones se mantienen activas usando cookies seguras de Supabase
- Al cerrar sesión, la sesión se invalida en el servidor

### 8.2 Roles de usuario

| Rol | Acceso |
|-----|--------|
| **client** | Módulos de usuario: Puestos, Parking, Estado, Incidentes |
| **admin** | Todo lo anterior + Panel de Administración |

### 8.3 Aislamiento de datos (Row Level Security)
Cada usuario solo puede ver y modificar sus propios datos. Las políticas de seguridad a nivel de base de datos garantizan que:
- Un usuario no puede cancelar la reserva de otro
- Un usuario no puede ver el historial de incidentes de otro
- Los datos del mapa de puestos y parking son públicos (necesario para mostrar disponibilidad)

---

## 9. Flujos principales de uso

### Flujo típico de un día laboral

```
1. Abrir la app / ingresar al CE
2. Marcar estado en "Mi Estado" → En Oficina
3. Ir a "Mi Espacio" → ver el mapa
4. Reservar un puesto disponible (verde)
5. Si se viene en auto → ir a "Smart Parking" → reservar espacio
6. Hacer check-in antes de las 10:00 AM (mantiene la reserva)
7. Si hay un problema en la oficina → "Directo a Office Manager"
```

### Flujo de liberación de puesto fijo

```
1. El titular del puesto fijo marca "Home Office" o "Site" en Mi Estado
2. El sistema cambia automáticamente su puesto a verde (disponible)
3. Cualquier compañero puede reservar ese puesto para el día
```

### Flujo "Preguntar al Dueño"

```
1. Un colaborador necesita un puesto específico
2. El puesto está en amarillo (titular asignado, sin estado marcado)
3. El colaborador presiona "📨 Preguntar al dueño"
4. El titular recibe una notificación preguntándole si liberará el espacio
5. Si el titular libera → el puesto queda disponible para reserva
```

---

*Documento generado el 2025-05-05 | DHL Connect & Park v1.0 MVP*
