# 📜 Historial de Cambios, Mejoras y Guía de Despliegue en Supabase

**Proyecto:** LOGIFAST — Plataforma Integral de Envíos Express y Delivery Marketplace  
**Fecha de Actualización:** 29 de Julio, 2026  
**Versión:** 0.2.0 (Producción / Release Ready)  

---

## 🛠️ 1. Resumen de Cambios y Mejoras Realizadas

### 🟢 Rol Cliente
* **Solicitud de Envíos Express (`ClientSolicitar.tsx`):**
  * Integrado con el backend vía `POST /api/ordenes`.
  * Cálculo dinámico de kilometraje, tarifa base por peso/tamaño y cupones de descuento.
* **Carrito y Checkout Marketplace (`ClientCarrito.tsx`):**
  * Integrado con `POST /api/ordenes-compra`.
  * Validación en tiempo real de cupones promocionales vía `POST /api/codigos/validar`.
* **Seguimiento GPS en Vivo (`ClientInicio.tsx` & `/api/ordenes/[id]/tracking`):**
  * Retorna las coordenadas GPS del repartidor asignado, rumbo de la moto y línea de tiempo de la entrega.
* **Calificaciones y Reseñas (`ClientRating.tsx` & `/api/repartidor/calificaciones`):**
  * Permite calificar al repartidor (estrellas y etiquetas) recalculando automáticamente su promedio de valoración en la base de datos.
* **Direcciones y Métodos de Pago (`ClientPerfil.tsx`):**
  * Carga y guarda direcciones frecuentes en `db.direccionCliente` y tarjetas en `db.metodoPago`.

---

### 🟢 Rol Administrador
* **Monitoreo en Tiempo Real (`DashboardShell.tsx`):**
  * Polling unificado cada 4 segundos que sincroniza solicitudes express, compras en marketplace y usuarios activos directamente desde la base de datos en `useStore`.
* **Gestión de Usuarios y Roles (`ModuleSuperAdmin.tsx` & `/api/admin/users`):**
  * Handlers `POST` y `PATCH` para creación de cuentas con contraseñas encriptadas (`bcryptjs`), asignación de roles (Cliente, Repartidor, Admin, Ingeniero) y auto-creación de `RepartidorProfile`.
* **Centro de Despacho y Reasignación (`ModuleDespacho.tsx`, `ModulePedidos.tsx` & `/api/ordenes/[id]`):**
  * Despacho manual y drag-and-drop conectado a `PATCH /api/ordenes/[id]`.
  * Cancelación de pedidos conectada a `DELETE /api/ordenes/[id]`.
* **Flota y Motocicletas (`ModuleFlota.tsx` & `/api/ingeniero/motos`):**
  * CRUD completo de vehículos (adición y actualización) sincronizado en la tabla `Moto`.
* **Marketing y Push Broadcast (`ModuleMarketing.tsx` & `/api/admin/send-push`):**
  * Creación de cupones promocionales, banners publicitarios y transmisión de notificaciones push guardadas en `db.notificacionPush`.

---

### 🟢 Rol Repartidor (Delivery Driver)
* **Gestión Multipedido Simultáneo (Hasta 3 pedidos):**
  * Pestañas dinámicas de pedidos activos.
  * **Optimización Automática de Ruta:** Algoritmo de vecino más cercano (Haversine) que reordena las paradas por proximidad GPS.
* **Transiciones de Estado de la Orden:**
  * `aceptarOrden` → `PATCH /api/repartidor/ordenes/[id]/aceptar`.
  * `recogerPaquete` → `PATCH /api/repartidor/ordenes/[id]/recoger`.
  * `confirmarEntrega` → `PATCH /api/repartidor/ordenes/[id]/entregar` (descuento del 15% de comisión del saldo en vivo).
  * `reportarIncidencia` → `PATCH /api/repartidor/ordenes/[id]/incidencia`.
* **Transmisión de Ubicación GPS en Vivo:**
  * `actualizarPosicion` envía periódicamente coordenadas a `POST /api/repartidor/posicion`.

---

### 📱 2. Corrección Crítica de la PWA (App Instalable)
1. **Solución a Error 404 al Instalar:**
   * Se corrigió `public/manifest.json` cambiando `"start_url": "/repartidor"` (ruta inexistente) a `"start_url": "/"` y `"scope": "/"`.
2. **Habilitación de Service Worker:**
   * Se removió el script en `src/app/layout.tsx` que eliminaba activamente los Service Workers en cada recarga y se activó `navigator.serviceWorker.register('/sw.js')`.
3. **Estrategia de Caché Offline:**
   * `public/sw.js` precachea archivos principales (`/`, `/manifest.json`, `/icons/icon-192.png`, `/icons/icon-512.png`, `/logo.png`) y maneja clics en notificaciones Push.

---

## 🗄️ 3. Guía de Despliegue en Supabase (PostgreSQL)

### Requisitos Previos:
Necesitas la **URL de conexión** (Connection String) de tu proyecto en Supabase.

### Paso 1: Crear el Archivo `.env`
Crea el archivo `.env` en la raíz del proyecto (`C:\Users\RESP_SOPORTE_TECNICO\Downloads\logifast\.env`):

```env
# Conexión principal con Connection Pooling (Puerto 6543)
DATABASE_URL="postgresql://postgres.[REF_PROYECTO]:[TU_CONTRASEÑA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Conexión Directa para Migraciones de Prisma (Puerto 5432)
DIRECT_URL="postgresql://postgres.[REF_PROYECTO]:[TU_CONTRASEÑA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

> 📌 **¿Dónde encontrar estas credenciales en Supabase?**
> 1. Inicia sesión en tu panel de Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
> 2. Selecciona tu proyecto LOGIFAST.
> 3. Ve a **Project Settings** → **Database** → sección **Connection string**.
> 4. Copia la cadena en formato **URI / Prisma**.

### Paso 2: Ejecutar la Sincronización del Esquema
Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npx prisma db push
```

Este comando creará las **38 tablas relacionales** en tu base de datos de Supabase.

### Paso 3: Cargar Datos Iniciales (Seed Data)
Para insertar usuarios demo (clientes, repartidores, administradores, ingenieros), tiendas de Managua y la flota de motos en Supabase:

```bash
node scripts/seed.js
```

---

## 🧪 4. Verificación de Pruebas Automatizadas
Se ejecutó la suite automatizada `node scripts/test-suite.js` obteniendo **22 de 22 pruebas pasadas (100% de éxito)**. El comando `npm run build` genera las 81 rutas API y páginas en **7.9 segundos** sin errores.
