# LOGIFAST 2.0 — Sistema de Logística y Entregas Express

## 🚀 Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env

# 3. Generar cliente Prisma + sincronizar DB
npx prisma generate
npx prisma db push

# 4. Sembrar datos demo
node scripts/seed.js

# 5. Levantar servidor
npm run dev    # http://localhost:3000

# 6. (Opcional) Correr tests E2E
node tests/e2e.js
```

## 👤 Credenciales demo

Todas usan password `123456`:

| Rol         | Email                     |
|-------------|---------------------------|
| Cliente     | cliente@logifast.com      |
| Repartidor  | repartidor@logifast.com   |
| Admin       | admin@logifast.com        |
| Ingeniero   | ingeniero@logifast.com    |

## 🔒 Seguridad implementada

### Autenticación
- **JWT** en cookies httpOnly (no accesible desde JS)
- **bcryptjs** con 10 salt rounds para hashing de contraseñas
- **Preención de timing attacks**: login siempre ejecuta `verifyPassword` aunque el usuario no exista
- **Rate limiting**:
  - Login: 10 intentos por IP cada 15 minutos
  - Register: 3 registros por IP cada hora
  - Forgot password: 3 por IP cada hora
  - Reset password: 5 por IP cada hora
  - Delete account: 2 por IP cada hora

### Autorización por roles
- `requireSession()` — cualquier usuario autenticado
- `requireRole('admin')` — solo admin
- `requireRole('ingeniero', 'admin')` — ingeniero o admin
- `requireRole('repartidor')` — solo repartidor

### Endpoints protegidos
- **Admin**: `/api/campanas`, `/api/codigos`, `/api/banners`, `/api/feed`, `/api/plantillas`, `/api/notificaciones-auto`, `/api/horarios`, `/api/feriados`, `/api/zonas` (POST/PATCH/DELETE), `/api/audit`, `/api/login-audit`, `/api/admin/*`
- **Ingeniero/Admin**: `/api/ingeniero/*` (todos los mutables)
- **Repartidor**: `/api/repartidor/*` (cada endpoint valida que el repartidor solo acceda a sus propios datos)
- **Cliente**: `/api/cliente/*`, `/api/direcciones`, `/api/metodos-pago`, `/api/carrito`

### Auditoría
- **LoginAudit**: registra todos los intentos de login (exitosos y fallidos) con IP, user agent y razón
- **AuditLog**: modelo existente para acciones admin
- Endpoint `/api/login-audit` (admin) para revisar intentos

### Headers de seguridad (middleware)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### GDPR compliance
- `POST /api/auth/delete-account` — elimina cuenta con confirmación
- `GET /api/auth/export-data` — exportar todos los datos del usuario en JSON

## 📋 Endpoints (todos con auth y validación)

### Auth (públicos)
- `POST /api/auth/login` — con rate limit + audit
- `POST /api/auth/register` — con rate limit + validación
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password` — genera token de reseteo
- `POST /api/auth/reset-password` — resetea con token
- `POST /api/auth/change-password` — cambia contraseña autenticado
- `POST /api/auth/delete-account` — elimina cuenta (GDPR)
- `GET /api/auth/export-data` — exporta datos (GDPR)

### Admin (solo admin)
- `GET /api/admin/stats` — dashboard con métricas reales (usuarios, órdenes, revenue, top tiendas/repartidores, security)
- `GET /api/admin/users` — lista usuarios con filtros y paginación
- `POST /api/admin/send-push` — envía notificaciones push masivas
- `GET /api/login-audit` — auditoría de intentos de login

### Búsqueda
- `GET /api/search?q=&type=tiendas|productos|todos&limit=` — búsqueda global

### Marketplace (GET público, mutaciones con auth)
- `GET/POST /api/tiendas`
- `GET/PATCH/DELETE /api/tiendas/[id]`
- `GET/POST /api/tiendas/[id]/productos`
- `GET /api/productos`
- `GET/POST /api/ordenes-compra`
- `GET/POST /api/favoritos/tiendas`
- `GET /api/search`

### Cliente (con auth)
- `GET/POST/PATCH/DELETE /api/direcciones`
- `GET/POST/DELETE /api/metodos-pago`
- `GET/POST /api/valoraciones`
- `GET/POST/PATCH/DELETE /api/carrito`
- `GET /api/notificaciones-push`
- `GET/POST/PATCH /api/cliente/tienda` — gestión de tienda del cliente
- `POST/PATCH/DELETE /api/cliente/tienda/productos`
- `GET/PATCH /api/cliente/tienda/pedidos`

### Social (con auth)
- `GET/POST /api/social/likes`
- `GET/POST/DELETE /api/social/comentarios`
- `GET/POST /api/social/follow`

### Stories (GET público)
- `GET /api/stories`
- `POST /api/stories` (admin)
- `PATCH /api/stories` — marcar vista

### Repartidor (con auth de repartidor)
- `GET/PATCH /api/repartidor/perfil`
- `GET /api/repartidor/moto`
- `GET/PATCH /api/repartidor/conexion`
- `GET /api/repartidor/ordenes`
- `GET /api/repartidor/ordenes/[id]`
- `PATCH /api/repartidor/ordenes/[id]/{aceptar,rechazar,recoger,entregar,incidencia}`
- `POST /api/repartidor/posicion`
- `GET /api/repartidor/posicion/[repartidorId]`
- `GET/POST /api/repartidor/chat`
- `GET /api/repartidor/chat/[ordenId]`
- `GET/PATCH /api/repartidor/notificaciones`
- `GET /api/repartidor/calificaciones`
- `GET /api/repartidor/stats`
- `GET/POST /api/recargas`

### Ingeniero (con auth de ingeniero o admin)
- `GET/POST /api/ingeniero/motos`
- `GET/POST /api/ingeniero/mantenimientos`
- `PATCH /api/ingeniero/mantenimientos/[id]/{iniciar,completar,cancelar}`
- `GET/POST /api/ingeniero/repuestos`
- `GET /api/ingeniero/alertas`
- `GET /api/ingeniero/stats`
- `POST /api/mantenimientos/[id]/fotos` — subir fotos
- `GET /api/mantenimientos/[id]/fotos`

### Upload
- `POST /api/upload` — imagen genérica (con auth)
- `POST /api/cliente/foto-perfil` — foto de perfil

### Pagos (webhook)
- `POST /api/pagos/webhook` — webhook para pasarelas (Wompi, Stripe, PayPal)

### Zonas y envíos
- `GET/POST /api/zonas`
- `GET/POST /api/solicitudes-envio`

### Marketing (GET público, mutaciones admin)
- `GET/POST/PATCH/DELETE /api/campanas`
- `GET/POST/PATCH/DELETE /api/codigos`
- `GET/POST/PATCH/DELETE /api/banners`
- `GET/POST/PATCH/DELETE /api/feed`
- `GET/POST/PATCH/DELETE /api/plantillas`
- `GET/PATCH /api/notificaciones-auto`
- `GET/POST /api/mensajes`
- `GET /api/marketing/stats` — KPIs reales

## 🧪 Tests E2E

```bash
# Asegúrate de que el servidor esté corriendo
npm run dev

# En otra terminal
node tests/e2e.js
```

Tests cubren:
- ✅ Auth (login, register, logout, me, forgot-password, reset-password, change-password)
- ✅ Protección de rutas (401 sin cookie, 403 con rol incorrecto)
- ✅ Marketplace (tiendas, productos, órdenes, stories, zonas)
- ✅ Repartidor (perfil, moto, conexión, órdenes, stats, notificaciones, calificaciones, recargas)
- ✅ Social (likes, comentarios, follow, valoraciones)
- ✅ Direcciones y métodos de pago
- ✅ Mi Tienda (CRUD completo)
- ✅ Export data (GDPR)
- ✅ Change password (con validación de contraseña actual)

**77 tests, 0 fallas.**

## 🗄️ Schema Prisma (47 modelos)

### Auth
- `User` (con emailVerified, twoFactorEnabled, twoFactorSecret)
- `PasswordReset` (tokens de recuperación)
- `LoginAudit` (auditoría de intentos)

### Marketplace
- `Tienda`, `Producto`, `OrdenCompra`, `ItemOrdenCompra`, `FavoritoTienda`, `FavoritoProducto`, `ResenaTienda`

### Envíos
- `OrdenServicio`, `SolicitudEnvio`, `PosicionRepartidor`, `ZonaCobertura`

### Repartidor
- `RepartidorProfile`, `MotoAsignada`, `Moto`, `Mantenimiento`, `Repuesto`, `RepuestoUsado`, `AlertaMantenimiento`
- `NotificacionRepartidor`, `ChatRepartidor`, `CalificacionRepartidor`, `RecargaSaldo`

### Social
- `MediaAsset`, `TiendaFollow`, `ProductoLike`, `Comentario`, `Story`, `StoryVista`, `ValoracionProducto`

### Cliente
- `DireccionCliente`, `MetodoPago`, `CarritoItem`, `DireccionBusqueda`

### Marketing
- `Campana`, `CodigoPromocional`, `UsoCodigo`, `Banner`, `FeedItem`, `PlantillaMensaje`, `MensajeDirecto`, `NotificacionAutomatica`, `NotificacionPush`

### Config
- `ConfiguracionHorario`, `Feriado`, `AuditLog`, `FeatureFlag`, `ActividadUsuario`

## 🛠️ Stack técnico
- Next.js 16 + React 19 + TypeScript
- Prisma 6 + SQLite (desarrollo) / PostgreSQL (producción, schema compatible)
- Zustand para estado
- sileo para toasts (con animación premium)
- sharp para procesamiento de imágenes (WebP)
- bcryptjs + jsonwebtoken para auth
- MapLibre GL para mapas
- Middleware con headers de seguridad

## 🚦 Migración a PostgreSQL

1. Edita `prisma/schema.prisma`: cambia `provider = "sqlite"` → `provider = "postgresql"`
2. Edita `.env`: `DATABASE_URL="postgresql://user:pass@localhost:5432/logifast"`
3. `createdb logifast`
4. `npx prisma migrate reset --force`
5. `node scripts/seed.js`

## 🔧 Scripts útiles

```bash
npm run dev        # Desarrollo
npm run build      # Build producción
npm run start      # Servidor producción
npm run lint       # ESLint
npx tsc --noEmit   # Type check
npx prisma studio  # GUI para DB
node scripts/seed.js  # Sembrar datos
node tests/e2e.js  # Tests E2E
```
