# Task T2: Redesign ClientShell.tsx — Glassmorphism bottom nav

## Agent: fullstack-developer

## Summary
Redesigned the mobile bottom navigation bar in ClientShell.tsx per the Mobile 2026 spec with glassmorphism, an elevated center "Enviar" button, sliding active indicator, haptic feedback, and notification badges.

## Changes Made

### File: `/home/z/my-project/src/components/client/ClientShell.tsx`

1. **Imports**: Replaced `PlusCircle` with `PackagePlus` from lucide-react
2. **NAV_ITEMS**: Updated icon sizes from 20px to 22px; changed Enviar icon from `PlusCircle` to `PackagePlus`
3. **handleNav**: Added haptic feedback (`navigator.vibrate(20)`) with availability guard
4. **Content area**: Updated paddingBottom from `calc(64px + env(...))` to `calc(72px + env(...))`
5. **Bottom nav container**:
   - Height: 64px -> 72px
   - Background: `color-mix(...)` -> `var(--lf-glass-bg)` (glassmorphism)
   - Backdrop filter: `blur(20px)` -> `blur(var(--lf-glass-blur))`
   - Border top: `var(--border)` -> `var(--lf-glass-border)`
6. **Enviar button**: Complete redesign
   - 52x52 rounded square (borderRadius 16px), NOT circular
   - `translateY(-12px)` elevation
   - `PackagePlus` 24px white icon (no label text)
   - `var(--lf-shadow-fab)` shadow
   - Press animation: `scale(0.92)` on down, `scale(1)` on up, 0.15s
   - Touch + mouse event handlers for cross-platform press feedback
7. **Active indicator**: Replaced 4px dot with 16px x 2.5px horizontal line
   - Uses Framer Motion `layoutId="client-nav-indicator"` for spring slide
   - Positioned at `bottom: 0` of each button
8. **Active items**: `var(--primario)` color, 11px, font-weight 600
9. **Inactive items**: `var(--text-muted)` color, 10px, font-weight 400
10. **Notification badge**: Added on Inicio icon (16px danger circle, white 10px mono text)
11. **Cart badge**: Preserved on Explorar icon

## Lint Result
0 errors, 1 pre-existing warning (custom font in layout.tsx)

## Previous Agent Context
- Read `/home/z/my-project/worklog.md` for full project history
- CSS variables defined in `/home/z/my-project/src/app/globals.css` (lines 42-64 light, 118-126 dark)
