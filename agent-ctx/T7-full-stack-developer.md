# Task T7 — Redesign ClientTracking.tsx (A.5 Immersive Tracking)

## Agent: full-stack-developer

## Summary
Complete redesign of ClientTracking.tsx per A.5 TRACKING INMERSIVO specification.

## Key Changes
- **Map area**: 55% of mobile screen (up from 50vh)
- **Rider marker**: white 40x40 circle, Bike SVG, 2px var(--primario) border, shadow
- **Pulsing ring**: 2s loop animation (lf-ring-pulse), expands + fades
- **Pickup pin**: 20x20 circle, var(--exito), white 3px border
- **Delivery pin**: 20x20 circle, var(--primario), white 3px border
- **Dashed route**: SVG path connecting pickup → rider → destination
- **ETA pill**: glassmorphism floating near rider, Clock SVG + "~12 min" JetBrains Mono
- **Bottom sheet**: 3 snap points (minimized/medium/full) with spring animation
- **Handle bar**: 40x5px, var(--border), border-radius 3px, clickable to cycle
- **ETA section**: always visible, Syne 36px bold, progress bar 4px gradient
- **8-step timeline**: per-step Lucide icons (Check, Bike, Package, Navigation, MapPin, CheckCircle)
- **Timeline dots**: 28x28, completed=green filled, current=primario border+pulse, pending=border muted
- **Repartidor card**: 52x52 avatar, Star rating, 3 action pills (Phone/MessageCircle/Share2)
- **Expandable details**: "Ver detalles" with grid layout
- **Back button**: 40x40 glassmorphism circle, ArrowDown icon, top-left
- **Haptic feedback**: on step advance, button taps
- **No emojis**: Lucide icons only
- **CSS tokens**: --lf-glass-bg, --lf-sheet-radius, --lf-shadow-sheet, --primario-soft, etc.
- **Fonts**: Syne headings, DM Sans body, JetBrains Mono numbers

## Lint Result
0 errors, 1 pre-existing warning (layout.tsx font)
