# Task V4 — ClientBusqueda.tsx Full Search Screen

## Task
Build ClientBusqueda.tsx — Full search screen per spec section 1

## File Created
- `/home/z/my-project/src/components/client/ClientBusqueda.tsx`

## Implementation Details

### Component Structure
- **Props**: `isDark: boolean`, `onClose: () => void`, `onNavigate: (mod: string) => void`
- Full-screen overlay component using Framer Motion for enter/exit transitions
- Three states: Initial (no text), Typing (suggestions), Results (filtered tabs)

### Search Bar (56px fixed top)
- Search icon 20px absolute left
- Input: 15px, no border, bg surface, padding 16px
- X clear button (animated with AnimatePresence, appears only when text exists)
- "Cancelar" button slides in from right (14px, var(--md-primary))
- Bottom line: 1px var(--md-outline)

### Initial State (no text)
- **Recent Searches**: "Recientes" 14px bold + "Limpiar" link muted
  - List of 5 default terms: Clock icon 16px muted + text 15px + X icon to delete
  - On tap: execute search with that term
  - Delete individual items or clear all
- **Trends**: "Popular cerca de ti" 14px bold
  - Horizontal pills: Pizza / Farmacia / Supermercado / Flores / Documentos
  - Each pill: border var(--md-outline), padding 8px 16px, font-size 13px
- **Quick Categories**: Grid 2-column with Lucide icons 28px + name 14px bold
  - 7 categories: Utensils, Store, Pill, Gift, ShoppingCart, Smartphone, Dumbbell
  - On tap: navigate to Explorar

### While Typing (active state)
- Real-time suggestions filtered from: tiendas + productos + categorias + envios
- Each suggestion: type icon (Store/Package/Grid3X3/Truck 18px) + text (match highlighted bold) + secondary info muted
- Max 8 suggestions
- "Ver todos los resultados" link at bottom
- "Buscar igualmente" option when no suggestions match

### Results (on submit or tap suggestion)
- Filter tabs: Todo / Tiendas / Productos / Envios with Framer Motion layoutId sliding underline
- Counter: "X resultados para '[term]'" muted 13px
- **Tienda results**: Logo + name (match bold) + verified badge + category + rating + time + chevron
- **Producto results**: 64x64 image placeholder + name (match bold) + tienda 12px muted + price mono + "+" add-to-cart button
- **Envio results**: Truck icon + ID (mono) + status badge (color-coded) + route (MapPin) + date
- **Compra results**: Logo + ID (mono) + status badge + items + total (mono)
- **No results**: SVG search illustration + "Sin resultados" + "Explorar categorias" button

### Design Rules Followed
- NO emojis — Lucide SVG icons only
- Mobile-first, Material You 3.0 aesthetic
- CSS variables: var(--md-primary), var(--md-surface), var(--md-on-surface), var(--md-outline), var(--md-primary-container), var(--md-on-primary-container), var(--md-surface-variant), var(--md-on-surface-variant)
- Fonts: Syne headings, DM Sans body, JetBrains Mono numbers/prices/IDs
- Framer Motion animations throughout
- Responsive 2-column grid for categories

### Data Sources
- `useMarketplaceStore` for tiendas, productos, ordenesCompra, addToCart
- `useStore` for orders (envios)
- Local state: query, recentSearches (with add/delete/clear), activeTab, showResults

### Transitions
- Enter: 0.3s cubic-bezier(0.16, 1, 0.3, 1) — opacity + y + scale
- Exit: 0.25s easeIn — collapse back
- "Cancelar" slides in from right
- Item stagger animations with 0.04s delay

### ESLint
- Passes with 0 errors
