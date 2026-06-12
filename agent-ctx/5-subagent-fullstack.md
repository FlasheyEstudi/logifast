# Task 5 - ClientEnvios.tsx Creation

## Summary
Created `/home/z/my-project/src/components/client/ClientEnvios.tsx` - the Shipments/Tracking module for LOGIFAST Client Experience.

## Key Implementation Details

### Activos Tab
- Active order cards with status badges, route display, rider info, ETA (JetBrains Mono, primario color), map placeholder (250px), horizontal progress timeline
- Progress timeline: 4 steps with spring animations, pulsing current step, sequential line fills
- Report problem modal with 3 reason options + description field
- Empty state with decorative SVG and "Solicitar envío" CTA
- Real-time simulation: 5s interval, ETA jitter every tick, -1 min every 30s, simulateStatusChange calls

### Historial Tab
- Client metrics (3 mini stats, JetBrains Mono, muted)
- Filter pills (Todos/Entregados/Cancelados/Con incidencia)
- Search by ID or destination
- Compact order items with expand-in-place details
- Pagination with "Cargar más" (10 per page)

### Technical
- framer-motion: tab transitions, timeline animations, modals, card enter/exit
- lucide-react: Package, MapPin, Clock, User, ChevronDown, ChevronUp, AlertTriangle, Search, Download, RefreshCw, ArrowRight, CheckCircle, XCircle, Bike
- Store integration: orders (filtered by María López), clientEnvioTab/Filter/Search, simulateStatusChange
- ~990 lines, lint passes with 0 errors
