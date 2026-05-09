# DHL Connect & Park — Especificaciones UX/UI Frontend
**Versión**: 2.0  
**Autora**: Sally (UX Designer) — BMad Method  
**Fecha**: 2026-05-05  
**Estado**: Listo para implementación

---

## Contexto y objetivo

Este documento define las mejoras de UX/UI para la PWA DHL Connect & Park, alineadas al manual de marca DHL 2025 y los estándares de accesibilidad WCAG 2.2 AA.

**Principios guía aplicados:**
- Yellow (`#FFCD05`) es el color de identidad del header y los highlights — nunca rojo como fondo donde aparece el logo
- Rojo (`#D40511`) es exclusivo para CTAs primarios y mensajes de error
- Blancos y grises claros dominan los fondos de contenido (~70%)
- Iconos SVG en lugar de emojis en toda la interfaz
- Controles de accesibilidad obligatorios (toggle de contraseña, focus rings, labels explícitos)
- Contrastes mínimos: 4.5:1 para texto normal, 3:1 para iconos y controles grandes

---

## 1. Design Tokens — `tailwind.config.ts`

Actualizar el bloque `colors.dhl` con los valores correctos del brand book:

```typescript
colors: {
  dhl: {
    red: "#D40511",       // solo CTAs y errores
    yellow: "#FFCD05",    // header bg, highlights (era #FFCC00 — cambiar)
    dark: "#1A1A1A",      // texto primario
    gray: "#666666",      // texto secundario
    "light-gray": "#F5F5F5",  // fondos de página
    "mid-gray": "#E0E0E0",    // bordes, separadores
  },
  // mantener desk y parking colors sin cambio
}
```

---

## 2. Login Page — `src/app/(auth)/login/page.tsx`

### Cambios visuales

| Elemento | ANTES | DESPUÉS |
|----------|-------|---------|
| Fondo | `bg-dhl-red` full screen | `bg-dhl-light-gray` full screen |
| Logo | Blanco (invertido con `brightness-0 invert`) | Color natural (eliminar clase de inversión) |
| Acento superior | Ninguno | Franja amarilla `bg-dhl-yellow` de 6px en top |
| Campo email | Sin icono | Icono envelope SVG a la izquierda |
| Campo password | Sin toggle | Ojo SVG toggle show/hide a la derecha |
| Focus ring | `focus:ring-dhl-red` | `focus:ring-dhl-yellow focus:border-dhl-dark` |
| Footer | `text-white/60` | `text-dhl-gray` |

### Estructura HTML target

```
<div class="min-h-screen bg-dhl-light-gray flex flex-col">
  <!-- Franja amarilla superior -->
  <div class="h-1.5 bg-dhl-yellow w-full" />

  <!-- Contenido centrado -->
  <div class="flex-1 flex flex-col items-center justify-center p-6">
    <!-- Logo natural sin inversión -->
    <Image src="/dhl-logo.svg" alt="DHL" width={120} height={17} />

    <!-- Card blanca -->
    <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 mt-8">
      <h1>Bienvenido</h1>
      <p>Ingresa con tus credenciales de red DHL</p>

      <form>
        <!-- Campo email con icono -->
        <div class="relative">
          <EnvelopeIcon class="absolute left-3 top-3.5 w-4 h-4 text-dhl-gray" />
          <input type="email" class="pl-9 ..." placeholder="nombre@dhl.com" />
        </div>

        <!-- Campo password con toggle -->
        <div class="relative">
          <LockIcon class="absolute left-3 top-3.5 w-4 h-4 text-dhl-gray" />
          <input type={showPassword ? "text" : "password"} class="pl-9 pr-10 ..." />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            onClick={() => setShowPassword(!showPassword)}
            class="absolute right-3 top-3 p-0.5 text-dhl-gray hover:text-dhl-dark"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <!-- Error message -->
        <div role="alert" class="bg-red-50 text-dhl-red text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircleIcon class="w-4 h-4 flex-shrink-0" />
          {error}
        </div>

        <!-- Botón primario -->
        <button type="submit" class="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl ...">
          Ingresar
        </button>
      </form>
    </div>

    <p class="text-dhl-gray text-xs mt-6">DHL Connect & Park © 2025</p>
  </div>
</div>
```

### Iconos SVG inline requeridos (usar estos exactos — no dependencias externas)

**Envelope (email):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect x="2" y="4" width="20" height="16" rx="2"/>
  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
</svg>
```

**Lock:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>
```

**Eye (mostrar):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
```

**EyeOff (ocultar):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
  <line x1="2" x2="22" y1="2" y2="22"/>
</svg>
```

**AlertCircle (error):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="12" x2="12" y1="8" y2="12"/>
  <line x1="12" x2="12.01" y1="16" y2="16"/>
</svg>
```

---

## 3. App Layout / Header — `src/app/(app)/layout.tsx`

### Cambios visuales

| Elemento | ANTES | DESPUÉS |
|----------|-------|---------|
| Fondo header | `bg-dhl-red` | `bg-dhl-yellow` (`#FFCD05`) |
| Logo | `brightness-0 invert` (blanco) | Sin filtro (color natural rojo) |
| Nombre usuario | `text-white` | `text-dhl-dark` |
| Área | `text-white/80` | `text-dhl-dark/60` |
| Badge Admin | `bg-dhl-yellow text-dhl-dark` | `border-2 border-dhl-dark text-dhl-dark bg-transparent` |
| Icono logout | `text-white/70` | `text-dhl-dark/60 hover:text-dhl-dark` |
| Sombra header | `shadow-md` | `shadow-sm border-b border-yellow-300` |

### Estructura target del header

```tsx
<header className="bg-dhl-yellow sticky top-0 z-40 shadow-sm border-b border-yellow-300">
  <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto w-full">
    <Link href="/home">
      <Image
        src="/dhl-logo.svg"
        alt="DHL"
        width={72}
        height={10}
        priority
        // SIN brightness-0 invert
      />
    </Link>
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-dhl-dark/60 leading-none">{profile?.area}</p>
        <p className="text-sm font-semibold text-dhl-dark leading-tight">{firstName}</p>
      </div>
      {profile?.role === "admin" && (
        <Link href="/admin"
          className="border-2 border-dhl-dark text-dhl-dark text-xs font-bold px-2 py-0.5 rounded-lg">
          Admin
        </Link>
      )}
      <form action={handleSignOut}>
        <button type="submit" aria-label="Cerrar sesión"
          className="text-dhl-dark/60 hover:text-dhl-dark transition-colors p-1">
          {/* LogOut SVG icon */}
        </button>
      </form>
    </div>
  </div>
</header>
```

---

## 4. PolicyModal — `src/components/PolicyModal.tsx`

### Cambios visuales

| Elemento | ANTES | DESPUÉS |
|----------|-------|---------|
| Header bg | `bg-dhl-red` | `bg-dhl-yellow` |
| Saludo "👋" | Emoji | Icono SVG Hand/Wave |
| Texto header | `text-white` | `text-dhl-dark` |
| Subtítulo | `text-white/80` | `text-dhl-dark/70` |
| Icono 🧹 Orden | Emoji | SVG Sparkles/Broom |
| Icono ✨ Limpieza | Emoji | SVG Star/Clean |
| Icono 🤝 Respeto | Emoji | SVG Users/Handshake |
| Botón aceptar | `bg-dhl-red` (correcto) | `bg-dhl-red` (mantener) |

### Iconos SVG para reglas

**Mano/Bienvenida (header):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-7 h-7">
  <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
  <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/>
  <path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/>
  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
</svg>
```

**Orden (escoba/sparkles):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6 text-dhl-red">
  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
</svg>
```

**Limpieza (check/clean):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6 text-dhl-red">
  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
</svg>
```

**Respeto (usuarios):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6 text-dhl-red">
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</svg>
```

---

## 5. Dashboard / Home — `src/app/(app)/home/page.tsx`

### Cambios

1. **Saludo**: Eliminar emoji `👋`. Usar solo texto: `Hola, {firstName}`
2. **Summary card — iconos de fila**: Reemplazar emojis con SVG inline (18×18px, `text-dhl-gray`)
3. **Module cards**: Reemplazar emojis con SVG iconos en contenedor `bg-dhl-yellow/20` (amarillo suave) + icono en `text-dhl-red`
4. **Module cards border**: Eliminar el sistema de colores variados (`border-l-blue-500`, `border-l-green-500`, etc.). Usar solo `border border-dhl-mid-gray` para consistencia de marca
5. **Status display**: Reemplazar emojis de estado con SVG + texto

### Iconos SVG para summary card

**Puesto (monitor):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4.5 h-4.5">
  <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
</svg>
```

**Parking (auto):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4.5 h-4.5">
  <path d="M19 17H5v-6l2.5-6H16.5L19 11v6Z"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
</svg>
```

**Mi estado (pin/location):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4.5 h-4.5">
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
</svg>
```

### Iconos SVG para module cards

**Mi Espacio:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6">
  <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
</svg>
```

**Smart Parking:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6">
  <circle cx="12" cy="12" r="10"/><path d="M9 12h4a2 2 0 1 0 0-4H9v8"/>
</svg>
```

**Mi Estado:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6">
  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
</svg>
```

**Directo a Office Manager:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-6 h-6">
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
</svg>
```

### Module card target

```tsx
<Link href={mod.href}>
  <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.99]">
    <div className="w-11 h-11 rounded-xl bg-dhl-yellow/20 flex items-center justify-center text-dhl-red flex-shrink-0">
      {mod.icon}  {/* SVG component */}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-dhl-dark text-sm">{mod.title}</p>
      <p className="text-dhl-gray text-xs mt-0.5 leading-tight">{mod.description}</p>
    </div>
    <ChevronRightIcon className="w-5 h-5 text-dhl-mid-gray flex-shrink-0" />
  </div>
</Link>
```

### Status display — reemplazar emojis

```tsx
// ANTES: "🏢 En oficina"
// DESPUÉS:
const STATUS_DISPLAY: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  office:      { label: "En oficina",  icon: <BuildingIcon />, color: "text-green-600" },
  site:        { label: "En site",     icon: <FactoryIcon />,  color: "text-purple-600" },
  home_office: { label: "Home Office", icon: <HomeIcon />,     color: "text-blue-600" },
  vacation:    { label: "Vacaciones",  icon: <SunIcon />,      color: "text-orange-500" },
};
```

**Building (oficina):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4 h-4">
  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
</svg>
```

**Factory (site):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4 h-4">
  <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
</svg>
```

**Home:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4 h-4">
  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
</svg>
```

**Sun (vacaciones):**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="w-4 h-4">
  <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
</svg>
```

---

## 6. BottomNav — `src/components/BottomNav.tsx`

Los SVG actuales están bien. Ajustar solo:

| Cambio | ANTES | DESPUÉS |
|--------|-------|---------|
| Active indicator | Solo color `text-dhl-red` | Color `text-dhl-red` + punto indicador amarillo bajo el icono |
| Tap target | `min-w-0 flex-1` | Agregar `min-h-[44px]` para cumplir WCAG tap target mínimo |
| aria-label | Ausente | Agregar `aria-label` y `aria-current="page"` al item activo |

```tsx
<Link
  key={item.href}
  href={item.href}
  aria-label={item.label}
  aria-current={isActive ? "page" : undefined}
  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors min-w-0 flex-1 min-h-[44px] justify-center ${
    isActive ? "text-dhl-red" : "text-dhl-gray hover:text-dhl-dark"
  }`}
>
  {item.icon}
  <span className="text-[10px] font-medium truncate">{item.label}</span>
  {isActive && (
    <span className="w-4 h-0.5 rounded-full bg-dhl-yellow mt-0.5" aria-hidden="true" />
  )}
</Link>
```

---

## 7. StatusForm — `src/components/StatusForm.tsx`

Reemplazar los emojis del array `STATUS_OPTIONS`:

```tsx
// ANTES:
{ value: "office", label: "En Oficina", emoji: "🏢", ... }

// DESPUÉS — agregar campo `icon` con SVG component o string
const STATUS_OPTIONS = [
  { value: "office",     label: "En Oficina",  icon: <BuildingIcon />,  description: "Estaré en el CE",                   colors: "border-green-500 bg-green-50 text-green-800" },
  { value: "site",       label: "En Site",     icon: <FactoryIcon />,   description: "Voy a un centro de distribución",   colors: "border-purple-500 bg-purple-50 text-purple-800" },
  { value: "home_office",label: "Home Office", icon: <HomeIcon />,      description: "Trabajo desde casa",                colors: "border-blue-500 bg-blue-50 text-blue-800" },
  { value: "vacation",   label: "Vacaciones",  icon: <SunIcon />,       description: "Fuera de disponibilidad",           colors: "border-orange-400 bg-orange-50 text-orange-800" },
];
```

En el render de cada opción, mostrar el SVG icon en lugar del emoji:
```tsx
<div className="w-8 h-8 flex items-center justify-center text-current">
  {option.icon}
</div>
```

---

## 8. Patrones globales de componentes

### Inputs

Todos los inputs deben seguir este patrón:
```tsx
<div className="relative">
  {/* Icono izquierdo (si aplica) */}
  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhl-gray pointer-events-none" />
  <input
    className="w-full border border-dhl-mid-gray rounded-xl px-4 py-3 text-sm text-dhl-dark
               placeholder:text-dhl-gray/60
               focus:outline-none focus:ring-2 focus:ring-dhl-yellow focus:border-dhl-dark
               disabled:bg-dhl-light-gray disabled:cursor-not-allowed
               pl-9" {/* solo si hay icono */}
  />
</div>
```

**Cambio clave**: Focus ring cambia de `ring-dhl-red` → `ring-dhl-yellow` en inputs de formulario (excepto en contextos de error).

### Botones primarios

```tsx
<button className="bg-dhl-red text-white font-bold py-3.5 px-6 rounded-xl
                   hover:bg-red-700 active:scale-[0.98]
                   transition-all duration-150
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:ring-2 focus-visible:ring-dhl-yellow focus-visible:ring-offset-2">
```

### Botones secundarios / outline

```tsx
<button className="border-2 border-dhl-dark text-dhl-dark font-bold py-3 px-6 rounded-xl
                   hover:bg-dhl-dark hover:text-white
                   transition-all duration-150">
```

### Cards de contenido

```tsx
<div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray p-4">
```

### Toast / Notificación de éxito

```tsx
<div role="status" aria-live="polite"
     className="fixed top-16 left-1/2 -translate-x-1/2 z-50
                bg-dhl-dark text-white text-sm font-medium
                px-4 py-2.5 rounded-full shadow-lg
                flex items-center gap-2">
  <CheckCircleIcon className="w-4 h-4 text-dhl-yellow" />
  {message}
</div>
```

---

## 9. Resumen de archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `tailwind.config.ts` | Actualizar `dhl.yellow` a `#FFCD05` |
| `src/app/(auth)/login/page.tsx` | Fondo blanco/gris, franja amarilla, logo natural, iconos en inputs, toggle de contraseña |
| `src/app/(app)/layout.tsx` | Header amarillo, logo natural, texto oscuro, badge outline |
| `src/components/PolicyModal.tsx` | Header amarillo, iconos SVG en lugar de emojis |
| `src/app/(app)/home/page.tsx` | Eliminar emojis, iconos SVG en summary y module cards, módulos sin border-l multicolor |
| `src/components/BottomNav.tsx` | Tap targets 44px, aria-labels, indicador amarillo activo |
| `src/components/StatusForm.tsx` | Emojis → SVG icons en STATUS_OPTIONS y render |
| `src/app/(app)/home/page.tsx` | Status display emojis → SVG + texto |

---

## 10. Accesibilidad — checklist mínimo obligatorio

- [ ] Todos los `<button>` interactivos tienen `aria-label` descriptivo
- [ ] Toggle de contraseña tiene `aria-label` dinámico ("Mostrar/Ocultar contraseña")
- [ ] Mensajes de error usan `role="alert"` para anuncio automático
- [ ] Notificaciones de éxito usan `role="status"` y `aria-live="polite"`
- [ ] Iconos decorativos tienen `aria-hidden="true"`
- [ ] Nav item activo tiene `aria-current="page"`
- [ ] Todos los inputs tienen `<label>` asociado o `aria-label`
- [ ] Tap targets mínimo 44×44px en móvil
- [ ] Contrastes: texto oscuro sobre amarillo (#FFCD05) cumple 4.5:1 ✓

---

*Documento generado por Sally (UX Designer) — DHL Connect & Park v2.0*  
*Para implementación: entregar a agente DEV con acceso completo al repo*
