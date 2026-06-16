# Task 1-A — Config system foundation

## What was built

Six NEW files implementing a real, persistent config system for LOGIFAST
(replacing the decorative toggles in RepartidorPerfil). No existing files
were modified.

| File | Purpose |
|------|---------|
| `src/hooks/useLocalStorage.ts` | SSR-safe localStorage hook + cross-tab listener |
| `src/services/audio.ts` | Web Audio API beeps (no sound files) + vibrate helper |
| `src/store/configStore.ts` | Zustand + persist global config store + theme helpers |
| `src/providers/ThemeProvider.tsx` | Wires `tema` to `data-theme` attribute, listens to OS |
| `src/components/ui/TemaToggle.tsx` | 3-button segmented Claro/Oscuro/Sistema control |
| `src/components/ui/SonidoToggle.tsx` | Sound card with Switch + volume slider + test button |

## Key exports for downstream tasks

```ts
// store/configStore.ts
useConfigStore           // zustand hook
aplicarTema(tema)        // imperative theme apply
inicializarTema()        // read persisted tema + apply on first paint
CONFIG_STORAGE_KEY       // 'logifast-config'
type Tema = 'light' | 'dark' | 'system'
type Idioma = 'es' | 'en'
type ConfigState         // full state + actions interface

// services/audio.ts
type SonidoTipo = 'nueva_orden' | 'orden_aceptada' | 'orden_entregada'
                | 'mensaje' | 'error' | 'toggle_on' | 'toggle_off'
                | 'exito' | 'notificacion'
reproducirSonido(tipo, volumen?)
reproducirSiActivo(tipo, { sonidoActivo, volumenSonido, notificacionesSonido })
vibrarSiActivo(patron, vibracionActiva)

// hooks/useLocalStorage.ts
useLocalStorage<T>(key, defaultValue)
useLocalStorageListener(key, callback)

// components
<ThemeProvider>{children}</ThemeProvider>
<TemaToggle />
<SonidoToggle />
```

## State persisted to localStorage

Stored under key `logifast-config` as `{ state: {...}, version: 0 }`:

- `tema`, `sonidoActivo`, `volumenSonido`, `vibracionActiva`
- `notificacionesPush`, `notificacionesEmail`, `notificacionesSonido`
- `compartirUbicacion`, `idioma`

## Behavior notes for downstream agents

- `toggleSonido` plays `toggle_on` sound 50ms after enabling.
- `toggleVibracion` calls `navigator.vibrate(50)` when enabling.
- `setTema` immediately applies `data-theme` to `<html>` (so even before
  React re-renders, the theme is correct).
- `inicializarTema()` reads `logifast-config` from localStorage and
  applies the theme synchronously — mount `<ThemeProvider>` at the app
  root to avoid flash-of-wrong-theme on first paint.
- For `'system'` tema, ThemeProvider subscribes to
  `matchMedia('(prefers-color-scheme: dark)')` and live-updates.
- Audio uses Web Audio API (oscillators); AudioContext is created lazily
  on first call and resumed if suspended (autoplay policy). All calls
  no-op on SSR.
- `reproducirSiActivo` skips notification-class sounds
  (nueva_orden/notificacion/mensaje) when `notificacionesSonido === false`.

## Design system compliance

All styling uses existing LOGIFAST tokens — no new CSS variables invented:
`--bg`, `--bg-alt`, `--surface`, `--text`, `--text-muted`, `--text-secondary`,
`--border`, `--primario`, `--primario-soft`, `--shadow-sm`.

No emojis, no lucide-react in TemaToggle/SonidoToggle — all icons are
inline SVG.

## Verification

- `bun run lint`: 0 errors, 1 pre-existing warning in `src/app/layout.tsx`
  (custom-font warning, unrelated to this task).
- `curl http://localhost:3000`: HTTP 200 (Turbopack compiled all new
  files cleanly).
