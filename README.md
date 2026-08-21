# 🚀 LOGIFAST 2.0 — Enterprise Logistics, Omnichannel POS & Marketplace Platform

<div align="center">

```
   __             _ ____             _     ____    ___  
  / /  ___   __ _(_) __/__ ____ ___ / /_  |_  /   / _ \ 
 / /__/ _ \/ _ `/ / _// _ `(_-</ __/ __/  / /_ _ / // / 
/____/\___/\_, /_/_/  \_,_/___/\__/\__/  /___/(_)\___/  
          |___/                                         
```

### *Plataforma Unificada de Envíos Express, Comercio Hiperlocal, Telemetría de Flotas en Tiempo Real y Sistema de Punto de Venta (POS) con Kardex*

---

[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma 6](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_Pooler-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime_Engine-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-v5.24-blueviolet?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/)
[![Sharp](https://img.shields.io/badge/Sharp-WebP_Pipeline-99CC00?style=for-the-badge&logo=sharp&logoColor=white)](https://sharp.pixelplumbing.com/)

<br/>

| ⚡ Métrica | 📊 Valor Auditado | ⚡ Métrica | 📊 Valor Auditado |
| :--- | :--- | :--- | :--- |
| **Archivos de Rutas API** | `108 Route Files` | **Operaciones HTTP Totales** | `190 Endpoints Activos` |
| **Modelos Prisma ORM** | `47 Modelos Relacionales` | **Componentes React TSX** | `133 Módulos UI` |
| **Líneas de Código (LOC)** | `122,000+ Líneas` | **Errores TypeScript (`tsc`)** | `0 (Compilación Limpia)` |
| **Módulos de Usuario** | `5 Portales Integrados` | **Microservicios Satélite** | `Socket.IO Realtime Gateway` |

</div>

---

## 📑 Tabla de Contenidos

- [🏛️ Arquitectura Global del Sistema](#️-arquitectura-global-del-sistema)
- [✨ Módulos y Capacidades del Ecosistema](#-módulos-y-capacidades-del-ecosistema)
  - [1. 🛒 Marketplace B2C & PWA Cliente](#1--marketplace-b2c--pwa-cliente)
  - [2. 🛵 PWA Conductor & Repartidor con Telemetría](#2--pwa-conductor--repartidor-con-telemetría)
  - [3. 🏪 Comercio Omnicanal, POS & Kardex](#3--comercio-omnicanal-pos--kardex)
  - [4. 🔧 Taller de Flota & Mantenimiento (Ingeniería)](#4--taller-de-flota--mantenimiento-ingeniería)
  - [5. 👑 Central de Despacho & SuperAdmin](#5--central-de-despacho--superadmin)
- [📡 Microservicio en Tiempo Real (Socket.IO)](#-microservicio-en-tiempo-real-socketio)
- [🗄️ Atlas de Base de Datos (47 Modelos Prisma)](#️-atlas-de-base-de-datos-47-modelos-prisma)
- [🔌 Inventario Exhaustivo de APIs (190 Operaciones)](#-inventario-exhaustivo-de-apis-190-operaciones)
- [🔒 Seguridad Defensiva, Criptografía & GDPR](#-seguridad-defensiva-criptografía--gdpr)
- [🛠️ Pila Tecnológica Detallada](#️-pila-tecnológica-detallada)
- [👥 Matriz de Roles y Credenciales Demo](#-matriz-de-roles-y-credenciales-demo)
- [🚀 Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
- [📦 Despliegue en Producción](#-despliegue-en-producción)

---

## 🏛️ Arquitectura Global del Sistema

```mermaid
flowchart TB
    subgraph Experiencias_UI["🌐 Portales Web & PWAs (React 19 + Tailwind CSS v4)"]
        UI_CLI["📱 Cliente PWA\n• Marketplace & Stories\n• Envíos Punto a Punto\n• Live Tracking & Chat"]
        UI_REP["🛵 Repartidor PWA\n• GPS Stream en Vivo\n• PIN de Entrega Dinámico\n• Billetera & Recargas"]
        UI_POS["🏪 Tienda & POS\n• Facturación RUC/DGI\n• Kardex & Inventario\n• KDS Cocina"]
        UI_ENG["🔧 Taller Flota\n• Hoja de Vida Motos\n• Mantenimientos\n• Alertas de Repuestos"]
        UI_ADM["👑 Central Admin\n• Despacho Automatizado\n• Torre de Control Mapas\n• Marketing & Push"]
    end

    subgraph Capa_Gateway["🛡️ Next.js 16 Gateway & Edge Middleware"]
        MW["Security Headers\nRate Limiting por IP\nCookie Parser (httpOnly)"]
    end

    subgraph Capa_Servicios["⚡ Núcleo de Aplicación (Next.js App Router)"]
        API_AUTH["🔐 Auth Engine (bcrypt + JWT)"]
        API_DISPATCH["📦 Dispatch & Routing Engine"]
        API_COMMERCE["🛍️ POS & Commerce Engine"]
        API_FLEET["🏍️ Fleet Management Engine"]
        API_MKT["📢 Marketing & Campaign Engine"]
        MEDIA_SVC["🖼️ Image Processing (Sharp WebP)"]
        GEO_SVC["🗺️ OSRM Engine + POIs Nicaragua"]
    end

    subgraph Capa_Realtime["📡 Satélite Realtime (Socket.IO Port 3003)"]
        SIO_HUB["Socket.IO Server Engine"]
        ROOM_ORD["Salas /orden:{id}"]
        ROOM_REP["Salas /repartidor:{id}"]
        ROOM_ADM["Sala /admin"]
    end

    subgraph Capa_Datos["🗄️ Persistencia de Datos (Supabase Cloud)"]
        PRISMA["Prisma ORM Client v6.19.3"]
        SUPABASE["PostgreSQL Database (AWS us-east-2)\nConnection Pooling (pgbooster)"]
    end

    Experiencias_UI --> MW --> Capa_Servicios
    Capa_Servicios --> PRISMA --> SUPABASE
    UI_REP <-->|Streaming GPS 100ms| SIO_HUB
    UI_CLI <-->|Tracking & Chat| SIO_HUB
    UI_ADM <-->|Telemetría Flota| SIO_HUB
    Capa_Servicios -->|Event Broadcast /api/emit| SIO_HUB
    SIO_HUB --- ROOM_ORD & ROOM_REP & ROOM_ADM
```

---

## ✨ Módulos y Capacidades del Ecosistema

### 1. 🛒 Marketplace B2C & PWA Cliente
* **Explorador Hiperlocal:** Filtrado por radio de cobertura en kilómetros, categorías, comercios populares y tiempos estimados de entrega.
* **Stories Interactivas:** Carrusel horizontal de promociones flash y lanzamientos temporales con contador de expiración.
* **Feed Social y Comunidad:** Publicaciones con interacción en tiempo real (Likes, Reseñas con estrellas, Comentarios anidados).
* **Cotizador de Envíos Express:** Cálculo de costo en base a distancia geodésica y rutas reales con el motor OSRM y POIs locales de Nicaragua.
* **Live Tracking & PIN:** Monitoreo en mapa cartográfico interactivo con renderizado de ruta en vivo y código PIN único para recibir el paquete.
* **Billetera de Fidelización:** Acumulación automática de puntos canjeables en checkout y validación de cupones con montos mínimos.

### 2. 🛵 PWA Conductor & Repartidor con Telemetría
* **Asignación Atómica de Órdenes:** Transacciones seguras con bloqueos a nivel de base de datos para evitar colisiones de asignación entre repartidores.
* **Verificación de Entrega Criptográfica:** Obligatoriedad de digitación de **PIN Dinámico** para marcar entregas como completadas.
* **Telemetría GPS Continua:** Transmisión de latitud, longitud, orientación (`heading`) y velocidad a través de Socket.IO.
* **Billetera y Recargas Prepago:** Consulta de comisiones ganadas, kilometraje acumulado y canje de códigos de saldo en tiempo real.
* **Modo Offline & Resiliencia:** Indicador de estado de red (`NetworkStatusIndicator.tsx`) y refresco gestual (`PullToRefresh.tsx`).

### 3. 🏪 Comercio Omnicanal, POS & Kardex
* **Punto de Venta (POS) en Mostrador:** Interfaz optimizada para pantallas táctiles y lectores de código de barra, con cálculo de cambio en efectivo.
* **Kardex de Movimientos:** Auditoría permanente de existencias físicas (entradas, salidas por venta, ajustes de merma y transferencias).
* **Kitchen Display System (KDS):** Visualizador de comandas en vivo con estados de preparación (`Pendiente`, `Cocinando`, `Listo para Despacho`).
* **Facturación con Normativa Fiscal:** Emisión de comprobantes con RUC, Razón Social, desglose de IVA y formato térmico configurable.

### 4. 🔧 Taller de Flota & Mantenimiento (Ingeniería)
* **Hoja de Vida de Vehículos:** Control integral de motos (Número de Chasis/VIN, Placa, Kilometraje acumulado y Conductor asignado).
* **Mantenimientos Preventivos y Correctivos:** Planificación por kilometraje y fecha límite con cálculo automático de costos (mano de obra + repuestos).
* **Control de Inventario de Repuestos:** Alertas de stock crítico con umbrales mínimos, control de SKU y matriz de compatibilidad por modelo de moto.
* **Bitácora Fotográfica:** Carga y archivo de fotografías WebP del estado del vehículo antes y después del servicio.

### 5. 👑 Central de Despacho & SuperAdmin
* **Torre de Control:** Asignación visual de órdenes arrastrando sobre mapa en tiempo real o mediante despacho algorítmico por cercanía.
* **Marketing & Growth Hub:** Creación y programación de campañas masivas, banners publicitarios, notificaciones push masivas y códigos de descuento.
* **Gestión de Tarifas y Reglas Operativas:** Recargos nocturnos configurables, tarifas dinámicas por días festivos y delimitación de polígonos de cobertura.
* **Trazabilidad & Auditoría:** Registro exhaustivo de auditoría de inicio de sesión (`LoginAudit`) y bitácora de operaciones críticas (`AuditLog`).

---

## 📡 Microservicio en Tiempo Real (Socket.IO)

Ubicado en [`mini-services/realtime-service`](file:///home/flashey/Documentos/linux/logifast/mini-services/realtime-service), es un servidor WebSocket ultraligero que orquesta la comunicación bidireccional de baja latencia:

```
[WebSocket Gateway: Puerto 3003]
  │
  ├── 🟢 Evento 'repartidor:conectar'      ──> Conecta conductor y lo une al pool 'repartidores'
  ├── 📍 Evento 'repartidor:posicion'      ──> Transmite telemetría a sala 'admin' y a 'orden:{id}'
  ├── 📦 Evento 'admin:asignar:orden'      ──> Despacha orden de forma instantánea a 'repartidor:{id}'
  ├── 💬 Evento 'chat:mensaje'             ──> Mensajería instantánea bidireccional cliente-conductor-soporte
  └── 🔄 Endpoint HTTP POST '/api/emit'    ──> Permite a las Server Actions de Next.js emitir eventos
```

---

## 🗄️ Atlas de Base de Datos (47 Modelos Prisma)

El esquema de datos en [`prisma/schema.prisma`](file:///home/flashey/Documentos/linux/logifast/prisma/schema.prisma) modela el negocio con integridad referencial estricta:

```mermaid
erDiagram
    User ||--o{ OrdenServicio : "crea"
    User ||--o{ OrdenCompra : "compra"
    User ||--o| RepartidorProfile : "perfil"
    User ||--o{ Tienda : "administra"
    User ||--o{ AuditLog : "registra"
    User ||--o{ LoginAudit : "audita"
    
    Tienda ||--|{ Producto : "contiene"
    Tienda ||--o{ VentaPOS : "vende"
    Tienda ||--o{ KardexMovimiento : "registra"
    Tienda ||--o{ Story : "publica"
    
    Producto ||--o{ ItemOrdenCompra : "incluido_en"
    Producto ||--o{ ItemVentaPOS : "vendido_en"
    Producto ||--o{ KardexMovimiento : "movimientos"
    
    RepartidorProfile ||--o{ OrdenServicio : "entrega"
    RepartidorProfile ||--o{ PosicionRepartidor : "geolocalizacion"
    RepartidorProfile ||--o{ RecargaSaldo : "saldo"
    RepartidorProfile ||--o| MotoAsignada : "conduce"
    
    Moto ||--o{ Mantenimiento : "historial"
    Moto ||--o{ AlertaMantenimiento : "alertas"
    Mantenimiento ||--o{ RepuestoUsado : "consume"
    Repuesto ||--o{ RepuestoUsado : "inventario"
```

### Clasificación de Modelos por Dominio:

| Dominio | Modelos Prisma | Descripción Funcional |
| :--- | :--- | :--- |
| **🔐 Autenticación & Usuarios** | `User`, `PasswordReset`, `LoginAudit`, `AuditLog`, `ActividadUsuario` | Manejo de identidades, sesiones, 2FA, reseteo seguro y bitácoras inmutables. |
| **🛍️ Marketplace & Catálogo** | `Tienda`, `Producto`, `OrdenCompra`, `ItemOrdenCompra`, `CarritoItem`, `FavoritoTienda`, `FavoritoProducto`, `ResenaTienda` | Comercio B2C, gestión de carritos sincronizados, favoritos y calificaciones. |
| **🏪 Punto de Venta (POS) & Stock**| `VentaPOS`, `ItemVentaPOS`, `KardexMovimiento` | Facturación en mostrador, tickets fiscales y control de entradas/salidas de inventario. |
| **🛵 Logística & Envíos** | `OrdenServicio`, `SolicitudEnvio`, `PosicionRepartidor`, `ZonaCobertura` | Despacho punto a punto, cálculo de distancias y polígonos de servicio. |
| **🏍️ Flota, Taller & Repuestos** | `Moto`, `MotoAsignada`, `Mantenimiento`, `Repuesto`, `RepuestoUsado`, `AlertaMantenimiento` | Hoja de vida mecánica, órdenes de trabajo y control de repuestos automotrices. |
| **💼 Repartidores & Billetera** | `RepartidorProfile`, `ServicioRepartidor`, `CalificacionRepartidor`, `RecargaSaldo`, `ChatRepartidor`, `NotificacionRepartidor` | Estado de conexión, billetera prepago, chat de soporte y PIN de seguridad. |
| **📱 Social & Engagement** | `Story`, `StoryVista`, `TiendaFollow`, `ProductoLike`, `Comentario`, `ValoracionProducto`, `MediaAsset` | Historias efímeras, feed social, interacciones y almacenamiento multimedia. |
| **📢 Marketing & Fidelización** | `Campana`, `CodigoPromocional`, `UsoCodigo`, `Banner`, `FeedItem`, `PlantillaMensaje`, `MensajeDirecto`, `NotificacionAutomatica`, `NotificacionPush` | Motor de cupones, banners dinámicos, segmentación de audiencia y push masivo. |
| **⚙️ Configuración Operativa** | `ConfiguracionHorario`, `Feriado`, `FeatureFlag`, `DireccionCliente`, `MetodoPago`, `DireccionBusqueda` | Recargos nocturnos, días feriados, banderas de funciones y direcciones guardadas. |

---

## 🔌 Inventario Exhaustivo de APIs (190 Operaciones)

El backend de Next.js App Router expone **108 archivos de ruta** que implementan **190 manejadores HTTP** fuertemente tipados:

```
├── 🔐 Autenticación & Seguridad (/api/auth)
│   ├── POST   /api/auth/login                  ──> Autenticación con cookies httpOnly y anti-timing attack
│   ├── POST   /api/auth/register               ──> Registro de nuevos clientes con rate limit
│   ├── POST   /api/auth/logout                 ──> Invalidación de sesión y borrado de cookie
│   ├── GET    /api/auth/me                     ──> Datos del usuario autenticado en la sesión actual
│   ├── POST   /api/auth/forgot-password        ──> Emisión de token temporal para reseteo
│   ├── POST   /api/auth/reset-password         ──> Actualización de clave mediante token válido
│   ├── POST   /api/auth/change-password        ──> Cambio de clave autenticado con verificación de anterior
│   ├── POST   /api/auth/delete-account         ──> Derecho al olvido: eliminación irreversible (GDPR)
│   └── GET    /api/auth/export-data            ──> Descarga de volcado integral de datos en JSON (GDPR)
│
├── 🛒 Marketplace & Tiendas (/api/tiendas, /api/productos, /api/carrito)
│   ├── GET/POST         /api/tiendas           ──> Listado con filtros de distancia / Creación de comercio
│   ├── GET/PATCH/DELETE /api/tiendas/[id]      ──> Detalle, actualización y borrado de tienda
│   ├── GET/POST         /api/tiendas/[id]/productos ──> Catálogo de productos por tienda
│   ├── GET              /api/productos         ──> Catálogo global con paginación y búsqueda
│   ├── GET/POST/PATCH/DELETE /api/carrito      ──> Carrito persistente multi-producto
│   └── GET/POST         /api/ordenes-compra    ──> Creación y consulta de órdenes de compra
│
├── 🛵 Repartidor & Telemetría (/api/repartidor)
│   ├── GET/PATCH        /api/repartidor/perfil ──> Perfil del conductor y parámetros de vehículo
│   ├── GET/PATCH        /api/repartidor/conexion ──> Alternar estado Online / Offline / En Pausa
│   ├── GET              /api/repartidor/ordenes ──> Órdenes disponibles y asignadas
│   ├── PATCH            /api/repartidor/ordenes/[id]/aceptar   ──> Aceptación atómica de pedido
│   ├── PATCH            /api/repartidor/ordenes/[id]/recoger   ──> Confirmación de retiro en tienda
│   ├── PATCH            /api/repartidor/ordenes/[id]/entregar  ──> Validación obligatoria por PIN Dinámico
│   ├── PATCH            /api/repartidor/ordenes/[id]/incidencia ──> Reporte de problemas en ruta
│   ├── POST             /api/repartidor/posicion ──> Ingesta de coordenadas GPS
│   └── GET/POST         /api/recargas          ──> Recarga de billetera mediante código prepago
│
├── 🏪 Comercio, POS & Kardex (/api/tienda)
│   ├── GET/POST/PATCH   /api/cliente/tienda    ──> Configuración de marca, RUC, WhatsApp y membretes
│   ├── GET/POST         /api/cliente/tienda/pedidos ──> Tablero KDS de comandas entrantes
│   ├── GET/POST         /api/cliente/tienda/productos ──> Administración de existencias y precios
│   └── POST             /api/upload            ──> Pipeline de optimización de imágenes Sharp WebP
│
├── 🔧 Ingeniería & Taller de Flota (/api/ingeniero)
│   ├── GET/POST         /api/ingeniero/motos   ──> Parque de vehículos y kilometrajes acumulados
│   ├── GET/POST         /api/ingeniero/mantenimientos ──> Programación de órdenes de mantenimiento
│   ├── PATCH            /api/ingeniero/mantenimientos/[id]/iniciar   ──> Paso a estado EN_PROCESO
│   ├── PATCH            /api/ingeniero/mantenimientos/[id]/completar ──> Cierre y deducción de repuestos
│   ├── GET/POST         /api/ingeniero/repuestos ──> Inventario de repuestos y control de SKUs
│   └── GET              /api/ingeniero/alertas ──> Notificaciones automáticas de mantenimiento
│
└── 👑 Administración & Torre de Despacho (/api/admin)
    ├── GET              /api/admin/stats       ──> KPIs en tiempo real (Ingresos, Flota, Órdenes)
    ├── GET/POST         /api/admin/despacho    ──> Asignación manual/automática de pedidos a motos
    ├── GET/POST/PATCH/DELETE /api/admin/marketing ──> Motor de campañas, banners y cupones
    ├── POST             /api/admin/send-push   ──> Notificaciones push masivas a usuarios segmentados
    ├── GET              /api/admin/audit       ──> Bitácora de auditoría administrativa
    └── GET              /api/login-audit       ──> Registro de intentos y bloqueos de seguridad
```

---

## 🔒 Seguridad Defensiva, Criptografía & GDPR

| Vector de Seguridad | Mecanismo de Protección Implementado |
| :--- | :--- |
| **Robo de Token / XSS** | Sesiones emitidas en cookies `httpOnly`, `Secure`, `SameSite=Lax` (`lf-session`). JS en el cliente no puede acceder a las credenciales. |
| **Timing Attacks** | Verificación de passwords con ciclo constante contra hash sintético si el usuario no existe (`verifyPassword`). |
| **Ataques de Fuerza Bruta** | **Rate Limiting estricto por IP**: 10 logins / 15 min; 3 registros / hora; 2 bajas de cuenta / hora. |
| **Cabeceras HTTP en Middleware** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **Privacidad & GDPR** | Endpoint de exportación de expediente (`/api/auth/export-data`) y baja irreversible (`/api/auth/delete-account`). |
| **Fraude en Entrega** | **PIN Dinámico Criptográfico** de 4 dígitos generado por orden; la entrega solo se liquida con coincidencia exacta. |

---

## 🛠️ Pila Tecnológica Detallada

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TECNOLOGÍAS DEL ECOSISTEMA                             │
├──────────────────────┬─────────────────────────────┬───────────────────────────────────┤
│ CAPA                 │ TECNOLOGÍA PRINCIPAL        │ LIBRERÍAS CLAVE                   │
├──────────────────────┼─────────────────────────────┼───────────────────────────────────┤
│ 🖥️ Frontend          │ Next.js 16.1.1 (App Router) │ React 19, TypeScript 5, Zustand 5 │
│ 🎨 UI & Diseño       │ Tailwind CSS v4             │ Radix UI, Lucide, Framer Motion   │
│ 🍞 Notificaciones    │ Sileo v0.1.5                │ Sonner, Sileo Toaster Core        │
│ 🗺️ Mapas & Ruteo     │ MapLibre GL v5.24           │ OSRM Engine, GeoJSON POIs Nic     │
│ 📡 Tiempo Real       │ Socket.IO v4.8.3            │ Socket.IO Client, Custom Emitters │
│ 🗄️ Base de Datos     │ PostgreSQL (Supabase Cloud) │ Prisma ORM v6.19.3                │
│ 🖼️ Procesamiento     │ Sharp v0.34.3               │ WebP Pipeline, Auto-Rotate EXIF   │
│ 📊 Analítica         │ Recharts v3.8.1             │ TanStack Table v8, React Query v5 │
│ 🔐 Seguridad         │ BcryptJS + JSONWebToken     │ HTTPOnly Cookie Parser, RateLimit │
└──────────────────────┴─────────────────────────────┴───────────────────────────────────┘
```

---

## 👥 Matriz de Roles y Credenciales Demo

> 🔑 **Contraseña universal para todas las cuentas de prueba:** `123456`

| Rol | Correo de Acceso | Alcance y Vistas Permitidas |
| :--- | :--- | :--- |
| **🛒 Cliente** | `cliente@logifast.com` | Marketplace, Envíos Express, Live Tracking, Billetera y Social Feed. |
| **🛵 Repartidor** | `repartidor@logifast.com` | PWA Móvil de Repartidor, GPS en vivo, Validación de PIN, Recargas de Saldo. |
| **🔧 Ingeniero** | `ingeniero@logifast.com` | Taller de Mantenimiento, Hoja de Vida de Motos, Control de Repuestos y SKUs. |
| **👑 Administrador** | `admin@logifast.com` | Central de Despacho, Torre de Control, Marketing, Banners, Finanzas y Auditoría. |

---

## 🚀 Guía de Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone https://github.com/FlasheyEstudi/logifast.git
cd logifast
npm install
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y asigna las credenciales de base de datos:
```bash
cp .env.example .env
```
Contenido recomendado de `.env`:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbooster=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
JWT_SECRET="logifast-enterprise-secret-key-32-chars-minimum"
NODE_ENV="development"
NEXT_PUBLIC_REALTIME_URL="http://localhost:3003"
```

### 3. Sincronizar Prisma y Sembrar Datos
```bash
# Generar tipos TypeScript del cliente Prisma
npx prisma generate

# Sincronizar modelos con Supabase PostgreSQL
npx prisma db push

# Poblar con catálogo inicial, motos, tiendas y usuarios
node scripts/seed.js
```

### 4. Iniciar Servicios

**Terminal 1 — Aplicación Principal:**
```bash
npm run dev
# Puerto activo: http://localhost:3000
```

**Terminal 2 — Microservicio WebSockets Realtime:**
```bash
cd mini-services/realtime-service
npm install
npm start
# Puerto activo: http://localhost:3003
```

---

## 🧪 Pruebas de Calidad

```bash
# 1. Verificación de Tipos Estáticos (TypeScript 5)
npx tsc --noEmit

# 2. Ejecución de la Suite de Pruebas E2E (77 Tests)
node tests/e2e.js
```

---

## 📦 Despliegue en Producción

```mermaid
graph LR
    GH[🐙 GitHub Repository] -->|Push main| VERCEL[▲ Vercel: Next.js Frontend & APIs]
    GH -->|Push main| RAILWAY[🚂 Railway: Microservicio Realtime]
    VERCEL <--> SUPABASE[(🗄️ Supabase PostgreSQL)]
    RAILWAY <--> VERCEL
```

1. **Vercel (Frontend & Server Actions):**
   * **Build Command:** `npx prisma generate && next build`
   * **Environment Variables:** `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NEXT_PUBLIC_REALTIME_URL`.
2. **Railway / Render (Servicio Realtime):**
   * **Root Directory:** `mini-services/realtime-service`
   * **Start Command:** `npm start` (expone puerto asignado en variable `PORT`).

---

<div align="center">

Hecho con precisión y pasión por la ingeniería de software moderna.<br/>
**LOGIFAST 2.0 © 2026 — Todos los derechos reservados.**

</div>
