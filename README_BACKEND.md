# LOGIFAST — Backend + Frontend completos + Rediseño social

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
```

## 👤 Credenciales demo

Todas usan password `123456`:

| Rol         | Email                     |
|-------------|---------------------------|
| Cliente     | cliente@logifast.com      |
| Repartidor  | repartidor@logifast.com   |
| Admin       | admin@logifast.com        |
| Ingeniero   | ingeniero@logifast.com    |

## 🎨 Rediseño aplicado (inspiración IG/FB — no los colores)

### Cliente
- **Stories en el explorar** (carrusel horizontal con gradiente IG-style)
- **Feed con cards estilo post** (imagen, like, comentarios, compartir)
- **Perfil con foto subible** (botón cámara → `/api/cliente/foto-perfil`)
- **Carrito con bottom-sheet animado**

### Ingeniero / Mantenimiento (rediseño total)
- **Timeline visual** con dots de colores por prioridad
- **Cards modernas** con border-glow según prioridad (URGENTE, ALTA, etc.)
- **Galería de fotos antes/después** subible desde el detalle
- **KPI cards** con iconos y sparklines
- **Inventario rediseñado** con grid responsivo, barra de stock visual, alertas pulsantes

### Repartidor 100% funcional
- **Recargas con código promocional real** (valida contra BD)
- **Historial de recargas persistente** (carga desde `/api/recargas`)
- **Saldos actualizados** en tiempo real
- **Foto de perfil subible**
- **Estados de conexión reales** (conectar/desconectar con validación)

### Admin
- **ModuleMarketing con datos reales** (KPIs desde `/api/marketing/stats`)
- **ModuleOverview** ya usaba datos reales

## 🍞 Notificaciones unificadas con sileo

Se eliminaron 6 sistemas de toast duplicados:
- ❌ `LfToast.tsx` (orphan)
- ❌ `sonner.tsx` (orphan)
- ❌ `toaster.tsx` + `toast.tsx` + `use-toast.ts` (Radix shadcn, orphan)
- ❌ `addToast` del store principal
- ❌ 5 hooks `useToast` inline en dashboard
- ❌ 3 closures `showToast` inline
- ❌ 2 estados `setToast` en cliente

✅ **Solo se usa `sileo`** con animación premium (slide-in con rotateX + blur, barra de progreso, dark mode, responsive).

Uso:
```ts
import { notify } from '@/lib/notify';
notify.success('¡Orden creada!');
notify.error('No se pudo conectar');
notify.loading('Procesando...');
notify.promise(asyncFn, { loading, success, error });
```

## 📸 Sistema de subida de imágenes

### Backend
- `POST /api/upload` — FormData con `file`, `categoria`, `entidadId`
- `POST /api/cliente/foto-perfil` — sube y actualiza `User.fotoUrl`
- `POST /api/mantenimientos/[id]/fotos` — sube fotos de mantenimiento
- Procesa con **sharp**: redimensiona, auto-rotate EXIF, convierte a **WebP** (calidad 82)
- Guarda en `/public/uploads/<categoria>/<uuid>.webp`
- Registra en `MediaAsset` (modelo en BD)

### Frontend
```tsx
import { ImageUploader } from '@/components/ui/ImageUploader';

<ImageUploader
  categoria="perfil"
  entidadId={user.id}
  onUploaded={(url, id) => console.log('Subida:', url)}
  label="Subir foto"
  aspectRatio="square"
/>
```

### Categorías soportadas
- `perfil` — fotos de perfil (cliente, repartidor, admin, ingeniero)
- `producto` — fotos de productos
- `tienda` — logos de tiendas
- `mantenimiento` — fotos antes/después/proceso
- `banner` — banners del marketplace
- `repuesto` — fotos de repuestos
- `general` — cualquier otra

## 🗄️ Migración a PostgreSQL

El schema es **100% compatible con SQLite y PostgreSQL** (no usa tipos específicos).

### Pasos para migrar (cuando estés listo):

1. **Instalar PostgreSQL** y crear la base:
   ```bash
   createdb logifast
   ```

2. **Editar `prisma/schema.prisma`** — cambiar el provider:
   ```prisma
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. **Editar `.env`**:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/logifast"
   ```

4. **Reiniciar la base** (crea todas las tablas con el nuevo motor):
   ```bash
   npx prisma migrate reset --force
   ```

5. **Sembrar datos demo**:
   ```bash
   node scripts/seed.js
   ```

6. **Verificar** que todo funciona — las imágenes subidas se conservan en `/public/uploads/`.

## 📋 Endpoints (todos reales, conectados a BD)

### Auth (JWT httpOnly cookies)
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/logout`, `GET /api/auth/me`

### Upload
- `POST /api/upload` — imagen genérica
- `POST /api/cliente/foto-perfil` — foto de perfil del cliente
- `POST /api/mantenimientos/[id]/fotos` — fotos de mantenimiento
- `GET /api/mantenimientos/[id]/fotos`

### Social (nuevo)
- `GET/POST /api/social/likes` — like/unlike producto
- `GET/POST /api/social/comentarios` — comentarios + respuestas
- `DELETE /api/social/comentarios?id=`
- `GET/POST /api/social/follow` — seguir/dejar de seguir tienda

### Stories (nuevo)
- `GET /api/stories` — stories activas (no expiradas)
- `POST /api/stories` — crear story (admin)
- `PATCH /api/stories` — marcar como vista

### Cliente (nuevo)
- `GET/POST/PATCH/DELETE /api/direcciones` — direcciones guardadas
- `GET/POST/DELETE /api/metodos-pago` — métodos de pago
- `GET/POST /api/valoraciones` — valoraciones de productos (1-5 estrellas)
- `GET/POST/PATCH/DELETE /api/carrito` — carrito persistente
- `GET /api/notificaciones-push` — notificaciones push del usuario

### Repartidor (nuevo)
- `GET/POST /api/recargas` — recargas de saldo con código promocional

### Envíos (nuevo)
- `GET/POST /api/solicitudes-envio` — solicitudes de envío directo
- `GET/POST /api/zonas` — zonas de cobertura

### Marketplace (real, ya existía)
- `GET/POST /api/tiendas`, `GET/PATCH/DELETE /api/tiendas/[id]`
- `GET/POST /api/tiendas/[id]/productos`
- `GET /api/productos`
- `GET/POST /api/ordenes-compra`
- `GET/POST /api/favoritos/tiendas`

### Repartidor (real, ya existía)
- `/api/repartidor/perfil`, `/moto`, `/conexion`, `/ordenes`, `/posicion`, `/chat`, `/notificaciones`, `/calificaciones`, `/stats`
- `/api/repartidor/ordenes/[id]/{aceptar,rechazar,recoger,entregar,incidencia}`

### Admin/Marketing/Config (real, ya existía)
- `/api/ordenes`, `/api/campanas`, `/api/codigos`, `/api/banners`, `/api/feed`, `/api/plantillas`
- `/api/mensajes`, `/api/notificaciones-auto`, `/api/marketing/stats`
- `/api/audit`, `/api/horarios`, `/api/feriados`
- `/api/ingeniero/*` — completo CRUD de motos, mantenimientos, repuestos, alertas

## 🗃️ Schema Prisma (43 modelos)

### Auth
- `User` (con `fotoUrl`, `bio`, `role`, `password` bcrypt)

### Marketplace
- `Tienda`, `Producto`, `OrdenCompra`, `ItemOrdenCompra`, `FavoritoTienda`, `FavoritoProducto`, `ResenaTienda`

### Envíos
- `OrdenServicio`, `SolicitudEnvio`, `PosicionRepartidor`, `ZonaCobertura`

### Repartidor
- `RepartidorProfile`, `MotoAsignada`, `Moto`, `Mantenimiento`, `Repuesto`, `RepuestoUsado`, `AlertaMantenimiento`
- `NotificacionRepartidor`, `ChatRepartidor`, `CalificacionRepartidor`, `RecargaSaldo`

### Social (nuevo)
- `MediaAsset`, `TiendaFollow`, `ProductoLike`, `Comentario`, `Story`, `StoryVista`, `ValoracionProducto`

### Cliente (nuevo)
- `DireccionCliente`, `MetodoPago`, `CarritoItem`, `DireccionBusqueda`

### Marketing
- `Campana`, `CodigoPromocional`, `UsoCodigo`, `Banner`, `FeedItem`, `PlantillaMensaje`, `MensajeDirecto`, `NotificacionAutomatica`, `NotificacionPush`

### Config
- `ConfiguracionHorario`, `Feriado`, `AuditLog`, `FeatureFlag`, `ActividadUsuario`

## 🎯 Componentes UI nuevos

- `ImageUploader` — drag & drop + preview + progreso
- `StoryViewer` — carrusel IG-style + visor fullscreen con progreso
- `CommentSection` — comentarios + respuestas anidadas
- `RatingStars` — estrellas interactivas con persistencia

## 🛠️ Stack
- Next.js 16 + React 19 + TypeScript
- Prisma 6 + SQLite (desarrollo) / PostgreSQL (producción)
- Zustand para estado
- sileo para toasts
- sharp para procesamiento de imágenes
- bcryptjs + jsonwebtoken para auth
- MapLibre GL para mapas
