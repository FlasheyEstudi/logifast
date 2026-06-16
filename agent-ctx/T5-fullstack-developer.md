# Task T5 - Redesign ClientTienda.tsx

## Agent: fullstack-developer

## Task
Redesign ClientTienda.tsx — Store profile per A.3 spec

## Work Summary
Complete visual redesign of ClientTienda.tsx per A.3 Mobile 2026 specification.

## Key Changes
1. **PORTADA (200px)**: Tienda portadaColor + GeometricPattern SVG overlay (0.04 opacity) + bottom gradient transparent→rgba(0,0,0,0.3). Three 36x36 glassmorphism floating buttons (back, heart, share) using var(--lf-glass-bg) + blur.

2. **LOGO + INFO**: 72x72 logo with borderRadius 22px (rounded square, not circle), border 4px var(--surface), overlapping portada by 32px. Badges row (Verificado/Popular/Nuevo) with Lucide icons. Meta row with dot separators. Pulsing green dot for open status.

3. **PROMO BAR**: var(--primario-soft) background, "20% OFF con codigo LOGI20" + "Aplicar" link.

4. **ACCIONES RAPIDAS**: 4 pills (Hacer pedido filled, Llamar/Direccion/Compartir outline) with Lucide icons.

5. **STICKY TABS**: Menu/Info/Resenas with Framer Motion layoutId="tienda-tab-indicator" sliding underline.

6. **MENU TAB**: Pill search bar (borderRadius 28px), sticky category nav with layoutId="cat-underline", horizontal product cards (88x88 image, 32x32 + button morphing to [-][qty][+] control).

7. **INFO TAB**: Hours table, policies, coverage zones.

8. **RESENAS TAB**: Big rating display + distribution bars + review cards.

9. **FLOATING CART**: Pill-shaped "Ver carrito" with badge count, positioned above bottom nav.

## Preserved
- All existing props (isDark, tiendaId, onBack, onOpenCart)
- Add-to-cart functionality
- Marketplace store integration
- No emojis (Lucide icons only)

## Lint
0 errors, 1 pre-existing warning
