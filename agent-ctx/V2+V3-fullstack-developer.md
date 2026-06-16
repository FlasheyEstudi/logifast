# Task V2+V3 — ClientShell.tsx Update

## Task
Update ClientShell.tsx with splash screen, native status bar, Android gesture bar, Material 3 bottom nav, snackbar system, and dynamic imports.

## Work Completed

### 1. Splash Screen
- Fixed fullscreen overlay (`var(--md-surface)` background)
- 72x72 rounded square logo (border-radius 20px) with gradient #FF5722→#FF8A65 + Bike icon 32px white
- "LOGIFAST" Syne 24px bold in `var(--md-on-surface)`
- Logo animates scale 0.8→1 (0.6s), text fades in (0.6s + 0.3s delay)
- After 1.5s: fade-out (0.4s opacity→0), removed from DOM at 1.9s
- Uses `showSplash` + `splashFading` local state

### 2. Native Status Bar (mobile only)
- Fixed 24px bar at top of viewport (respects safe-area-inset-top)
- Left: "9:41" JetBrains Mono 14px font-weight 500
- Right: 3 inline SVG icons (SignalIcon, WifiIcon, BatteryIcon)
- z-index 9999, pointer-events none
- Hidden on desktop via CSS @media (min-width: 1024px)

### 3. Android Gesture Bar (mobile only)
- Fixed 20px bar at bottom (respects safe-area-inset-bottom)
- Center: 120px×3px horizontal line, border-radius 2px, `var(--md-on-surface-variant)` at 30% opacity
- z-index 9999, pointer-events none
- Hidden on desktop

### 4. Material 3 Bottom Nav
- Pill indicator pattern: active icon wrapped in 64×32px border-radius 16px pill
- Active: background `var(--md-primary-container)`, icon `var(--md-on-primary-container)`
- Inactive: transparent bg, icon `var(--md-on-surface-variant)`
- Active label: font-weight 700, `var(--md-on-surface)`, 12px
- Inactive label: font-weight 500, `var(--md-on-surface-variant)`, 12px
- Enviar button: `var(--md-primary-container)` bg, `var(--md-on-primary-container)` icon, 52×52, border-radius 16px, `var(--md-elevation-3)` shadow, translateY(-12px)
- Height: 80px (was 72px)
- Background: `var(--md-surface)`, border-top: 1px `var(--md-outline-variant)`

### 5. Snackbar System
- SnackbarContext + useSnackbar hook exported
- Fixed position: bottom 96px (above bottom nav), left 16px, right 16px
- Background: `var(--md-inverse-surface)`, color: `var(--md-inverse-on-surface)`
- Border-radius 4px, padding 14px 16px, shadow `var(--md-elevation-3)`
- Optional action button in `var(--md-inverse-primary)`
- Auto-dismiss: 4 seconds
- Animation: translateY(100px)→0, 0.3s cubic-bezier(0.2,0,0,1)

### 6. Dynamic Imports Added
- ClientBusqueda, ClientAyuda, ClientPuntos (all ssr: false)

### 7. Placeholder Components Created
- ClientBusqueda.tsx: Full-screen search overlay with input, empty state
- ClientAyuda.tsx: Help screen with contact options + FAQ
- ClientPuntos.tsx: Loyalty points screen with balance card, activity list

### 8. CSS Updates
- Status bar / gesture bar shown only on mobile (hidden ≥1024px)
- Header offset for status bar on mobile
- Content padding updated for 80px bottom nav + safe area
- Snackbar max-width on desktop (480px, centered)

## Verification
- Lint: 0 errors, 1 pre-existing warning (fonts in layout.tsx)
- Server: 200 OK
