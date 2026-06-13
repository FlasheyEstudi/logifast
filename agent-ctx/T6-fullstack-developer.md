# Task T6 — Redesign ClientCarrito.tsx per A.4 spec

## Agent: fullstack-developer

## Work Completed

Redesigned `/home/z/my-project/src/components/client/ClientCarrito.tsx` per A.4 CARRITO spec with all 10 sections:

1. **HEADER (56px)**: ArrowLeft back + "Tu carrito" Syne 20px bold + quantity badge pill + "Limpiar" link
2. **EMPTY STATE**: Custom SVG shopping bag outline + "Tu carrito esta vacio" 20px bold + CTA button
3. **GRUPOS POR TIENDA**: Surface cards with 22px radius, border, shadow. Store header with 28x28 logo. Items: 52x52 image + info + quantity controls (circle borders, JetBrains Mono 15px)
4. **CODIGO PROMOCIONAL**: Expandible "Tienes un codigo?" link → monospace input + "Aplicar" button
5. **DIRECCION DE ENTREGA**: MapPin icon + address + "Cambiar" link, address dropdown
6. **HORARIO**: "Lo antes posible" default with ETA, "Programar" expandible with date/time
7. **RESUMEN DE COSTOS**: 22px card, rows with muted labels + mono values, descuento in verde, TOTAL Syne 32px bold primario
8. **METODO DE PAGO**: Efectivo/Transferencia cards, selected state with primario border + soft bg, Banknote/CreditCard Lucide icons
9. **BOTON "Hacer pedido"**: Sticky bottom, 18px padding, primario bg, Syne bold 17px, 18px radius, shadow-fab, scale(0.98) active
10. **CONFIRMACION**: Animated SVG checkmark (pathLength), "Pedido confirmado" Syne 28px verde, order ID mono muted, tienda logo+name, ETA "~30 minutos" Syne 20px bold, Rastrear/Volver buttons

## Key Changes
- Slide-from-right transition: `translateX(100%) → translateX(0)`, 0.35s, cubic-bezier(0.16, 1, 0.3, 1)
- Migrated all colors from old variables (--negro, --blanco, etc.) to new design system (--bg, --surface, --text, etc.)
- All CSS tokens used: --lf-card-radius, --lf-shadow-card, --lf-shadow-fab, --primario-soft, --lf-safe-bottom
- Fonts: Syne headings, DM Sans body, JetBrains Mono numbers
- No emojis, only Lucide SVG icons
- Removed unused imports: ShoppingBag, ChevronDown, Store, Trash2, X, Tienda type

## Lint: 0 errors, 1 pre-existing warning
## Dev server: Running on port 3000 (200 OK)
