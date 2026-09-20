# LOGIFAST — GUÍA MAESTRA DE ARQUITECTURA Y DIRECTIVAS PARA AGENTES

> **DIRECTIVA SUPREMA: AHORRO EXTREMO DE TOKENS Y PRECISIÓN QUIRÚRGICA**  
> Como agente que opera sobre LogiFast, tienes prohibido "explorar" el repositorio a ciegas o volcar archivos completos. Consulta este mapa de arquitectura para ir directamente al archivo y función exacta que necesitas modificar.

---

## 1. REGLAS OPERATIVAS DEL AGENTE (DEEPSEEK / REASONIX)
1. **Buscar antes de leer:** Usa `jCodeMunch` o grep dirigido para extraer únicamente la función, tipo o interfaz necesaria. Nunca leas más de 150 líneas si solo vas a cambiar 10.
2. **Carpetas estrictamente prohibidas:** NUNCA leas ni indexes:
   - `node_modules/`, `.next/`, `dist/`, `.git/`
   - `android/app/build/`, `android/.gradle/`
   - Archivos de log (`dev.log`, `.system_generated/`)
3. **Reutilizar antes de crear:** Antes de programar un componente o función, revisa este documento. LogiFast ya tiene un 90% de las utilidades construidas en `src/lib/` y `src/components/ui/`.
4. **Verificación obligatoria:** Todo cambio debe verificarse con la comprobación mínima (ej. `npx prisma validate`, comprobación de sintaxis o tests unitarios específicos).

---

## 2. MAPA DE RUTAS Y VISTAS DE LA APLICACIÓN

LogiFast opera bajo **Next.js 16 (App Router)** con interfaces diferenciadas por rol de usuario:

### A. Canal Cliente (E-Commerce & Pedidos)
* **Entrada Principal:** [`src/app/cliente/page.tsx`](file:///home/flashey/linux/logifast/src/app/cliente/page.tsx) y [`src/components/client/ClientShell.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientShell.tsx)
* **Pestaña Inicio / Feed:** [`src/components/client/ClientInicio.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientInicio.tsx) (banners, stories, tiendas destacadas).
* **Explorar Tiendas:** [`src/components/client/ClientExplorar.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientExplorar.tsx) y [`StoreCard.tsx`](file:///home/flashey/linux/logifast/src/components/client/StoreCard.tsx).
* **Perfil y Catálogo de Tienda:** [`src/components/client/ClientTienda.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientTienda.tsx).
* **Carrito y Checkout:** [`src/components/client/ClientCarrito.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientCarrito.tsx).
* **Solicitar Encomienda / Mandado:** [`src/components/client/ClientSolicitar.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientSolicitar.tsx).
* **Seguimiento en Vivo (Tracking):** [`src/components/client/ClientTracking.tsx`](file:///home/flashey/linux/logifast/src/components/client/ClientTracking.tsx).

### B. Canal Tienda / Comercio (POS, KDS y Gestión)
* **Entrada Principal:** [`src/app/tienda/page.tsx`](file:///home/flashey/linux/logifast/src/app/tienda/page.tsx) y [`src/components/tienda/TiendaApp.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaApp.tsx)
* **Punto de Venta Mostrador (POS):** [`src/components/tienda/TiendaPOS.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaPOS.tsx) y API [`/api/tienda/pos`](file:///home/flashey/linux/logifast/src/app/api/tienda/pos/route.ts).
* **Pantalla de Cocina en Vivo (KDS):** [`src/components/tienda/TiendaKDS.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaKDS.tsx).
* **Control de Inventario & Stock:** [`src/components/tienda/TiendaInventario.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaInventario.tsx).
* **Libro de Kardex Contable:** [`src/components/tienda/TiendaKardex.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaKardex.tsx).
* **Facturación DGI y Series Fiscales:** [`src/components/tienda/TiendaFacturacion.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaFacturacion.tsx).
* **Lector de Código de Barras por Cámara:** [`src/components/tienda/CamaraEscaneo.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/CamaraEscaneo.tsx).
* **Impresión de Etiquetas de Estantes:** [`src/components/tienda/TiendaEtiquetasModal.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaEtiquetasModal.tsx).
* **Marketing, Banners y Stories:** [`src/components/tienda/TiendaComercial.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaComercial.tsx) y [`TiendaCupones.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaCupones.tsx).
* **Exportación Contable a Excel:** [`src/components/tienda/TiendaReportesExcel.tsx`](file:///home/flashey/linux/logifast/src/components/tienda/TiendaReportesExcel.tsx).

### C. Canal Repartidor (Rider App)
* **Entrada Principal:** [`src/app/app/repartidor/page.tsx`](file:///home/flashey/linux/logifast/src/app/app/repartidor/page.tsx) y [`src/components/repartidor/RepartidorShell.tsx`](file:///home/flashey/linux/logifast/src/components/repartidor/RepartidorShell.tsx)
* **Gestión de Órdenes en Curso:** [`src/components/repartidor/RepartidorServicio.tsx`](file:///home/flashey/linux/logifast/src/components/repartidor/RepartidorServicio.tsx).
* **Mapa de Ruteo y Navegación:** [`src/components/repartidor/RepartidorMap.tsx`](file:///home/flashey/linux/logifast/src/components/repartidor/RepartidorMap.tsx).
* **Alerta Sonora de Nueva Orden:** [`src/components/repartidor/RepartidorNotificacionOrden.tsx`](file:///home/flashey/linux/logifast/src/components/repartidor/RepartidorNotificacionOrden.tsx).
* **Perfil, Moto y Saldo Prepago:** [`src/components/repartidor/RepartidorPerfil.tsx`](file:///home/flashey/linux/logifast/src/components/repartidor/RepartidorPerfil.tsx).

### D. Panel de Administración Central (Ops & SuperAdmin)
* **Entrada Principal:** [`src/app/dashboard/page.tsx`](file:///home/flashey/linux/logifast/src/app/dashboard/page.tsx) y [`src/components/dashboard/DashboardShell.tsx`](file:///home/flashey/linux/logifast/src/components/dashboard/DashboardShell.tsx)
* **Despacho en Vivo:** [`src/components/dashboard/ModuleDespacho.tsx`](file:///home/flashey/linux/logifast/src/components/dashboard/ModuleDespacho.tsx).
* **Finanzas y Comisiones:** [`src/components/dashboard/ModuleFinanzas.tsx`](file:///home/flashey/linux/logifast/src/components/dashboard/ModuleFinanzas.tsx).
* **Tarifas Globales (Base, Km, Noche):** [`src/components/dashboard/ModuleConfig.tsx`](file:///home/flashey/linux/logifast/src/components/dashboard/ModuleConfig.tsx).
* **Gestión de Flota:** [`src/components/dashboard/ModuleFlota.tsx`](file:///home/flashey/linux/logifast/src/components/dashboard/ModuleFlota.tsx).

---

## 3. SERVICIOS CENTRALES Y LIBRERÍAS CRÍTICAS (`src/lib/`)

No inventes funciones ni dupliques llamadas. Usa los módulos existentes:

* **Autenticación & Sesión:** [`src/lib/auth/session.ts`](file:///home/flashey/linux/logifast/src/lib/auth/session.ts)
  * Usa JWT firmado con `HS256` en cookie httpOnly `lf-session`.
  * Función servidora: `getSessionUser()`. Devuelve `{ id, email, role, name }`.
* **Permisos de Tienda:** [`src/lib/auth/tienda-acceso.ts`](file:///home/flashey/linux/logifast/src/lib/auth/tienda-acceso.ts)
  * Funciones: `resolverAccesoTienda(user)` y `tienePermiso(acceso, 'pos' | 'kds' | 'inventario' | 'equipo')`.
* **Cálculo de Tarifas:** [`src/lib/tarifas.ts`](file:///home/flashey/linux/logifast/src/lib/tarifas.ts)
  * Función única autorizada: `calcularTarifaEnvio()`.
  * Constantes: `FALLBACK = { tarifaBase: 40, costoEnvioKm: 15, kmIncluidos: 2 }`.
  * Repartidor: `PARTICIPACION_REPARTIDOR` (actualmente 0.7, meta de migración: 0.92 con retención del 8%).
* **Motor OSRM & Geometría:** [`src/lib/osrm.ts`](file:///home/flashey/linux/logifast/src/lib/osrm.ts)
  * Funciones: `calcularDistanciaHaversine()`, `calcularTiempoEstimado()`, ruteo vial con servidor OSRM.
* **Geolocalización Nativa Android:** [`src/lib/native-geolocation.ts`](file:///home/flashey/linux/logifast/src/lib/native-geolocation.ts)
  * Usa `@capacitor/geolocation` con fallback a `navigator.geolocation` en navegador web.
* **Tiempo Real / WebSockets:** [`src/services/realtime.ts`](file:///home/flashey/linux/logifast/src/services/realtime.ts) y [`src/lib/realtime-emitter.ts`](file:///home/flashey/linux/logifast/src/lib/realtime-emitter.ts)
  * Eventos emitidos para sincronización instantánea de estados entre cocina, cliente y repartidor.
* **Estado Global (Zustand):**
  * Tienda/Marketplace: [`src/lib/marketplace-store.ts`](file:///home/flashey/linux/logifast/src/lib/marketplace-store.ts)
  * Repartidor: [`src/lib/repartidor-store.ts`](file:///home/flashey/linux/logifast/src/lib/repartidor-store.ts)

---

## 4. BASE DE DATOS Y MODELOS CLAVE (`prisma/schema.prisma`)

Motor: **PostgreSQL en Supabase**. Acceso mediante `db` desde [`src/lib/db.ts`](file:///home/flashey/linux/logifast/src/lib/db.ts).

### Modelos de Alto Tráfico:
* **`User`**: Cuentas con roles (`cliente`, `repartidor`, `tienda`, `admin`, `ingeniero`).
* **`Tienda`**: Negocios registrados. Contiene `ruc`, `regimenDgi`, `serieFactura`, `saludoFactura`, `piePaginaFactura`, `costoEnvio`, `calificacion`.
* **`Producto`**: Catálogo de cada tienda con `stock`, `precio`, `categoria`, `sku`, `codigoBarras`.
* **`VentaPOS` e `ItemVentaPOS`**: Ventas presenciales de mostrador en el local físico (aisladas del delivery).
* **`KardexMovimiento`**: Libro contable de inventario (`tipo`: ENTRADA_COMPRA, SALIDA_VENTA, MERMA, AJUSTE).
* **`OrdenCompra`**: Pedidos de catálogo de tienda a domicilio.
* **`OrdenServicio`**: Solicitudes de encomiendas y envíos entre puntos A y B con repartidor.
* **`RepartidorProfile`**: Perfil del conductor, con `saldo` prepago, moto asignada, lat/lng y calificación.
* **`AppConfig` (Fila id=1)**: Configuración global del sistema (`tarifaBase`, `costoEnvioKm`, `tarifaMin`, `recargoNocturno`).

---

## 5. SISTEMA DE DISEÑO ORGÁNICO & PARCHES ANDROID

LogiFast utiliza un lenguaje visual fluido basado en curvas y olas SVG:

1. **Estructura Estándar de Ola SVG:**
   ```tsx
   <svg
     viewBox="0 0 500 24"
     preserveAspectRatio="none"
     aria-hidden="true"
     style={{ width: '100%', height: '100%', display: 'block' }}
   >
     <path d="..." fill="var(--surface)" />
   </svg>
   ```
2. **Regla Subpixel para Móviles:** Todo contenedor de ola que separe secciones debe llevar **`bottom: -1px`** (o `-1`). Omitir esto provoca una línea horizontal transparente en pantallas de alta densidad (hdpi/xxhdpi) en Android.
3. **Curvatura Asimétrica (Squircles):**
   - Tarjetas y modales: `borderRadius: '28px 28px 26px 14px'`
   - Mapas y cards secundarias: `borderRadius: '24px 28px 22px 26px'`

---

## 6. MODELO DE NEGOCIO Y TARIFAS VIGENTES

* **Delivery App (Marketplace):** Comisión de la plataforma del **12% al 15%** a las tiendas por órdenes generadas en la aplicación.
* **Ventas Físicas en Local (POS):** **0% de comisión**. El comercio cobra presencialmente sin pagar porcentaje a LogiFast.
* **Planes de Tienda:**
  * **Plan Inicial (Gratis - C$ 0/mes):** Catálogo online en la app y recepción de pedidos.
  * **Plan PRO (C$ 400 - C$ 450/mes):** POS físico, pantalla de cocina (KDS), control de Kardex/Stock, facturación DGI con RUC y hasta 5 usuarios con roles.
  * **Plan Empresarial (C$ 1,200 - C$ 1,400/mes):** Multi-sucursal centralizada y stock compartido.
* **Retención al Repartidor:** Tasa tecnológica del **8%** por viaje completado (debitada automáticamente de su saldo prepago).
* **Evolución del Kilómetro de Envío:** Tarifa base C$40 (2 km incluidos) evolucionando hacia tramos degresivos (C$12/km de 2 a 5 km, C$10/km > 5 km) con distancia vial OSRM.

---

## 7. COMANDOS FRECUENTES DE DESARROLLO

```bash
# Iniciar servidor de desarrollo en red local (puerto 3000)
npm run dev

# Sincronizar y generar las APKs de Android (Cliente y Repartidor)
npm run mobile:build

# Validar y aplicar cambios en el esquema de Prisma (Supabase)
npx prisma validate
npm run db:push

# Diagnóstico oficial de Reasonix
reasonix doctor
```

---

## 8. HOJA DE RUTA TÉCNICA (PRÓXIMAS TAREAS)

Cuando el usuario pida avanzar en el desarrollo, estas son las tareas prioritarias identificadas:
1. **Columna `plan` en `Tienda`:** Agregar `plan String @default("GRATIS")` en `prisma/schema.prisma` y ejecutar `db:push`.
2. **Candado de acceso (Paywall):** Condicionar en `TiendaApp.tsx` las pestañas POS, KDS y Kardex para que exijan `plan === 'PRO'`.
3. **Ajuste de tasa de repartidor al 8%:** Actualizar `/api/repartidor/ordenes/[id]/entregar/route.ts` de `0.15` a `0.08`, y `PARTICIPACION_REPARTIDOR = 0.92` en `src/lib/tarifas.ts`.
4. **Algoritmo de tramos degresivos:** Modificar `calcularTarifaEnvio()` en `src/lib/tarifas.ts` para aplicar C$12/km y C$10/km en distancias largas con OSRM.
