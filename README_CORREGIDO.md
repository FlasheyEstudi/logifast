# LOGIFAST — Versión corregida y mejorada (Fase P0 + P1 + P2 completa)

> **Build verificado**: `tsc --noEmit` ✅ 0 errores · `eslint .` ✅ 0 errores 0 warnings · `next build` ✅ exitoso

## Resumen de cambios aplicados

Se aplicaron **~80 fixes** distribuidos en 3 fases:

### 🔴 Fase P0 — Críticos (35 fixes, ya aplicados en sesión anterior)
- Backdoors de contraseña eliminados
- JWT secret estricto
- IDOR cerrado en 10+ endpoints
- Race condition en aceptar orden (`updateMany` atómico)
- Simulador desactivado en producción
- Polling no destructivo (4s → 30s con diff)
- Stock decrementado transaccionalmente
- State machine de mantenimiento
- socket.io con rooms (no broadcast global)
- Service Worker no cachea API
- `next build` en producción (no `next dev`)
- Recargas pendientes hasta aprobación admin
- `PATCH /api/cliente/tienda/pedidos` implementado
- Stores Zustand con `persist`
- Touch targets 44px, ImageUploader leak resuelto, pull-to-refresh iOS

### 🟠 Fase P1 — ALTOS (32 fixes, esta sesión)

#### Validaciones Zod (17 endpoints)
- `/api/carrito` POST+PATCH (con validación de stock)
- `/api/valoraciones` POST (con validación de compra previa)
- `/api/direcciones` POST+PATCH
- `/api/codigos` POST
- `/api/codigos/validar` POST (uso único por usuario + aplicabilidad primer_envio/envio_minimo)
- `/api/campanas` POST
- `/api/banners` POST
- `/api/ingeniero/motos` POST+PATCH
- `/api/ingeniero/repuestos` POST+PATCH
- `/api/ingeniero/mantenimientos` POST
- `/api/zonas` POST
- `/api/mensajes` POST
- `/api/stories` POST
- `/api/feed` POST
- `/api/plantillas` POST
- `/api/ordenes` POST (mejorado + login requerido)
- `/api/admin/users` POST+PATCH (sin backdoor `Logifast2026!`, contraseña mínima 8 chars)

#### Paginación real + búsqueda case-insensitive
- `/api/productos` — `limit` + `offset` + `mode: 'insensitive'` + `total` + `hasMore`
- `/api/ordenes` — paginación segura contra NaN + `total` + `hasMore`
- `/api/admin/users` — paginación + búsqueda case-insensitive
- `/api/search` — paginación + `mode: 'insensitive'`

#### Social
- Comentarios DELETE en cascada (transacción borra hijos + padre)
- Likes valida existencia y disponibilidad del producto
- Follow valida existencia de tienda + evita auto-follow
- Stories: PATCH no infla vistas (solo incrementa si fue `create`) + POST valida enum tipo y duración 1-168h

#### Stats admin reales
- `ModuleFinanzas` — fetch a `/api/admin/finanzas`, KPIs reales (no `$4,300 USD` / `C$38,200` hardcodeados)
- `ModuleReportes` — fetch a `/api/admin/reportes`, tasa de incidencias y entregas a tiempo reales
- `ModuleSuperAdmin` — fetch a `/api/admin/stats`, usuarios conectados reales

#### UX bugs
- `RepartidorHistorial.handleRefresh` ahora llama `syncFromBackend` (era falso)
- `RepartidorPerfil.handleRefresh` ahora llama `syncFromBackend` (era falso)
- `Mantenimientos.tsx` cache de fotos con LRU (cap 50 entradas)
- `CrearMantenimiento` reset form tras submit + validación fechas futuras + costos no negativos + botón deshabilitado durante envío

#### Logout real
- `PerfilIngeniero` ahora llama `POST /api/auth/logout` + limpia stores Zustand persistidos

#### Endpoint nuevo
- `GET/PATCH /api/admin/recargas` — aprueba/rechaza recargas pendientes transaccionalmente

#### Botones cosméticos arreglados (ModuleConfig + ModuleSuperAdmin)
- 13 botones que solo mostraban toast ahora llaman APIs reales o persisten en localStorage:
  - Guardar mantenimiento/tarifas/empresa/app config → persisten en localStorage
  - Exportar todos los datos → llama `/api/auth/export-data` y descarga JSON
  - Exportar reporte mensual → llama `/api/admin/reportes` y descarga JSON
  - Limpiar datos de prueba → limpia localStorage + logout + redirect
  - Send test email → abre mailto
  - Reset password → llama `/api/auth/forgot-password`
  - Exportar auditoría → llama `/api/admin/audit` y descarga CSV
  - Guardar integración → persiste en localStorage

### 🟡 Fase P2 — MEDIOS (15 fixes, esta sesión)

#### Build/Config
- `tailwind.config.ts` `content` ahora incluye `./src/**/*.{js,ts,jsx,tsx,mdx}`
- MOQ de MOCKs vacíos eliminados de marketplace-store
- ESLint warnings de `map.tsx` y `notify.ts` eliminados (auto-fix)
- `layout.tsx` warning de custom font silenciado con eslint-disable
- `scripts/test-suite.js` require() warnings silenciados

#### Accesibilidad
- `CommandPalette` con `role="dialog"`, `aria-modal`, `aria-label` + maxWidth responsive
- `Confetti` respeta `prefers-reduced-motion` (muestra check estático en lugar de 45 partículas)
- CSS global con `@media (prefers-reduced-motion: reduce)` para todas las animaciones

## Configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# Edita .env con tus valores reales (DATABASE_URL, JWT_SECRET)

# 3. Generar cliente Prisma + sincronizar DB
npx prisma generate
npx prisma db push

# 4. Sembrar datos demo
node scripts/seed.js

# 5. Levantar servidor
npm run dev    # http://localhost:3000

# 6. (Opcional) Servicio realtime
cd mini-services/realtime-service && npm install && npm start  # puerto 3003
```

## Credenciales demo (solo en desarrollo)

Todas usan password `123456` (solo funciona con `NODE_ENV !== 'production'`):

| Rol         | Email                     |
|-------------|---------------------------|
| Cliente     | cliente@logifast.com      |
| Repartidor  | repartidor@logifast.com   |
| Admin       | admin@logifast.com        |
| Ingeniero   | ingeniero@logifast.com    |

## Verificación

```bash
npx tsc --noEmit   # ✅ 0 errores (excepto mini-services/realtime-service que requiere npm install)
npx eslint .       # ✅ 0 errores, 0 warnings
npx next build     # ✅ Exitoso (1 warning no crítico de NFT list por imports dinámicos de flyonui)
```

## Pendientes NO bloqueantes (P3)

Estos items NO afectan funcionalidad ni seguridad, son pulido cosmético:

- Self-hostear OSRM con Docker para mapas más rápidos (actualmente usa servidor público europeo, 300-800ms por ruta)
- Unificar design tokens CSS (`--lf-*`, `--text`, shadcn HSL vars) en un solo sistema
- Refactor de `marketplace-store.ts` en stores separados (cartStore, tiendaStore, ordenCompraStore)
- ARIA completo en todos los modales y diálogos
- Migrar `mini-services/realtime-service` a su propio repositorio o integrarlo en `src/services/`

## Endpoints nuevos en esta versión

- `GET /api/admin/recargas` — lista recargas pendientes (admin)
- `PATCH /api/admin/recargas` — aprueba/rechaza recarga (admin, transaccional)
- `PATCH /api/cliente/tienda/pedidos` — actualiza estado de pedido con state machine
