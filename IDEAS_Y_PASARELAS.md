# LOGIFAST — Ideas de mejora + Pasarelas de pago

## 🚀 Ideas de nuevas funciones por rol

### 👤 Cliente

**Interacciones sociales (inspiración IG/FB):**
- **Feed personalizado** con productos de tiendas que sigue (algoritmo simple basado en follows + likes + compras previas)
- **Stories de tiendas** con productos nuevos, promos flash y novedades (24h)
- **Compartir productos** por link, WhatsApp o código QR
- **Lista pública de favoritos** (opcional, tipo "Wishlist pública")
- **Reseñas con fotos** — el cliente sube foto del producto recibido
- **Calificar repartidor** con etiquetas rápidas ("Rápido", "Amable", "Cuidadoso")
- **Sistema de niveles** (Bronce, Plata, Oro, VIP) basado en compras — desbloquea descuentos
- **Programa de referidos** con código único, ambos ganan saldo/crédito

**Comodidad:**
- **Direcciones favoritas con mapa** (pin拖gable, no solo texto)
- **Horarios de entrega programados** (pedir para mañana a las 10am)
- **Modo "compra recurrente"** (ej: leche todos los lunes)
- **Carrito compartido** con familia/compañeros de cuarto
- **Histórico de pedidos** con opción "volver a pedir" en 1 toque
- **Notificaciones inteligentes**: "Tu tienda favorita tiene promo", "Tu repartidor de confianza está conectado"

**Pagos:**
- **Billetera digital** con saldo recargable (como Uber)
- **Pago con tarjeta** (visa/mastercard)
- **Pago en efectivo al recibir** (ya existe)
- **Transferencia bancaria** con validación automática
- **Split de pago** (mitad tarjeta, mitad efectivo)
- **Suscripción LOGIFAST+** (envío gratis por C$ 200/mes)

### 🛵 Repartidor

**Gestión de ganancias:**
- **Dashboard de ganancias** con gráficas (diarias, semanales, mensuales, anuales)
- **Retiro de ganancias** a cuenta bancaria o billetera
- **Bonos por metas** (10 entregas hoy → +C$ 50 bonus)
- **Propinas** del cliente (opcional, 10-15%)
- **Multiplicador por hora pico** (1.5x de 5pm a 8pm)

**Productividad:**
- **Ruta optimizada** (si tiene varias entregas, OSRM las ordena)
- **Modo "cola de órdenes"** — aceptar varias y hacerlas en cadena
- **Búsqueda de direcciones con autocompletado** (OSM Nominatim)
- **Botón de pánico** (emergencia, comparte ubicación con admin)
- **Chat con plantillas rápidas** ("Ya llegué", "Estoy en camino", "Necesito referencia")

**Gamificación:**
- **Logros y badges** ("100 entregas", "Sin rechazos esta semana", "5 estrellas 10 veces")
- **Ranking semanal** entre repartidores (con premio al top 3)
- **Streak de días activos** (bonus por连续 7 días)

### 👨‍💼 Administrador

**Decisiones basadas en datos:**
- **Mapa de calor** de zonas con más pedidos
- **Predicción de demanda** (ml básico: "los viernes a las 6pm hay 3x pedidos")
- **Cohort analysis** de clientes (retención por semana de registro)
- **Funnel de conversión** (visitó → registró → primer pedido → segundo pedido)
- **Alertas de anomalías** (caída de pedidos, repartidor con muchas incidencias)

**Operativas:**
- **Asignación manual** de órdenes (override del auto-assign)
- **Códigos promocionales masivos** (subir CSV con 1000 códigos)
- **Segmentación de clientes** para campañas (enviar push a "inactivos 30 días")
- **Aprobación de nuevas tiendas** (flujo de revisión)
- **Cierre de día** con corte de caja automático
- **Exportar reportes** a Excel/PDF (ya tienes CSV, añade PDF)

### 🔧 Ingeniero

**Taller inteligente:**
- **Códigos QR en motos** — escanear y ver historial completo
- **Checklist digital** por mantenimiento (tipo Uber inspection)
- **Inventario con barcode scanner** (cámara del celular)
- **Predicción de fallos** (moto X llegó a 15k km → sugerir cambio de aceite)
- **Cotizaciones automáticas** (cliente describe problema → sistema sugiere repuestos + mano de obra)
- **Foto antes/después** obligatoria (ya tienes el endpoint, haces que sea required)
- **Tiempo real de mantenimiento** (cronómetro que corre desde "iniciar" hasta "completar")
- **Ranking de mecánicos** (quién hace más mantenimientos, mejor calificación)

---

## 🌍 Funciones transversales

### Notificaciones
- **Push reales con Firebase Cloud Messaging** (FCM es gratis)
- **Web Push API** para PWA (ya tienes manifest)
- **Email con SendGrid** (12k emails/mes gratis) o **Resend** (3k gratis)
- **SMS con Twilio** (pago, pero muy confiable)
- **Plantillas dinámicas** con variables (ya tienes el modelo `PlantillaMensaje`)

### Maps y rutas
- **OSRM self-hosted** para rutas optimizadas (gratis)
- **MapLibre + tiles de OpenStreetMap** (ya lo tienes)
- **Geocoding con Nominatim** (gratis, 1 req/s) o **Photon** (self-hosted)
- **Estimación de ETA** con tráfico (TomTom free tier 2500 req/día)

### Seguridad
- **2FA con SMS o TOTP** (Google Authenticator)
- **Login con Google/Facebook** (OAuth)
- **Rate limiting** en endpoints críticos (login, registro)
- **Audit logs** más granulares (ya tienes el modelo `AuditLog`)
- **Backups automáticos** programados de PostgreSQL en Supabase

### Performance
- **Redis** para caché de productos, tiendas y sesiones
- **CDN para imágenes** (Cloudinary free tier 25 GB)
- **Lazy loading de imágenes** con `next/image`
- **Service Worker** más inteligente (ya tienes uno, mejorarlo con Workbox)
- **Server-Sent Events** para tracking en tiempo real (alternativa a WebSocket)

---

## 💳 Pasarelas de pago recomendadas

### 🇳🇮 Para Nicaragua (tu mercado actual)

#### 1. **PayPal** ⭐ Recomendada para empezar
- **Costo**: 4.4% + $0.30 por transacción
- **Ventajas**: Acepta tarjetas internacionales, marcas conocidas (Visa, Mastercard, Amex)
- **Desventajas**: No permite recibir dinero en cuentas bancarias nicaragüenses directamente (necesitas cuenta en USA o terceros)
- **Mejor para**: Cobrar a clientes internacionales o diáspora

#### 2. **Stripe** ⭐⭐ Mejor opción técnica
- **Costo**: 2.9% + $0.30 por transacción
- **Ventajas**: API excelente, documentación premium, soporta 3D Secure, tarjetas, Apple Pay, Google Pay
- **Desventajas**: NO soporta Nicaragua como país de origen del comercio (necesitas constituir empresa en USA, Costa Rica o México)
- **Mejor para**: Cuando constituyas LOGIFAST en otro país o uses Stripe Atlas

#### 3. **Wompi (por Bancard)** ⭐⭐⭐ Mejor para Nicaragua
- **Costo**: ~3.5% + IVA
- **Ventajas**: **Acepta Nicaragua**, procesa en córdobas y dólares, integra con bancos locales (BAC, LAFISE, AVANZ, BDF)
- **Desventajas**: Requiere contrato comercial, documentación más extensa
- **Mejor para**: Operación 100% local, dinero directo a tu cuenta bancaria en Nicaragua
- **Web**: https://wompi.co

#### 4. **Mercado Pago**
- **Costo**: ~3.49% + IVA
- **Ventajas**: Billetera integrada, pago con QR, tarjetas, transferencias
- **Desventajas**: Cobertura limitada en Nicaragua (mejor en Argentina, México, Brasil)
- **Mejor para**: Si expandes a otros países de LatAm

#### 5. **2Checkout (Verifone)**
- **Costo**: 3.5% + $0.35
- **Ventajas**: Acepta Nicaragua, soporta 30+ métodos de pago, multiple moneda
- **Desventajas**: Setup más complejo, soporte lento
- **Mejor para**: Si planeas vender suscripción LOGIFAST+

### 🌮 Para LatAm (expansión futura)

#### 6. **Mercado Pago Pro**
- Ideal cuando expandas a México, Argentina, Colombia, Chile
- API unificada para todos esos países

#### 7. **dLocal**
- Especializada en mercados emergentes
- Acepta efectivo (OXXO, PagoEfectivo, PIX), transferencias, tarjetas locales
- Una sola integración para toda LatAm

#### 8. **EBANX**
- Fuerte en Brasil (PIX), México, Colombia
- Excelente para suscripciones

### 🔥 Stack recomendado para LOGIFAST

**Fase 1 (hoy → 100 usuarios)**: Efectivo al recibir (ya tienes) + transferencia manual
- Cero comisiones
- Cero fricción técnica
- Validación del modelo de negocio

**Fase 2 (100 → 1000 usuarios)**: + **Wompi**
- Integra Wompi para tarjetas locales
- Procesa en córdobas
- Dinero directo a tu cuenta BAC/LAFISE

**Fase 3 (1000+ usuarios)**: + **Stripe** (constituyendo en USA/México) + **PayPal**
- Suscripciones LOGIFAST+ con Stripe Billing
- Pagos internacionales para clientes con tarjeta extranjera
- Apple Pay / Google Pay

**Fase 4 (expansión regional)**: + **Mercado Pago** + **dLocal**
- Un país a la vez
- Mercado Pago para México/Argentina/Colombia
- dLocal para métodos locales (OXXO, PIX, etc.)

---

## 🛠️ Implementación técnica sugerida

### Estructura de pago en el schema (ya lista para añadir)

```prisma
model Pago {
  id              String   @id @default(cuid())
  ordenId         String
  metodo          String   // efectivo, tarjeta, transferencia, paypal, wompi
  monto           Float
  comision        Float    @default(0)
  estado          String   @default("pendiente") // pendiente, procesando, completado, fallido, reembolsado
  referencia      String?  // ID de la transacción en la pasarela
  tarjetaUltimos4 String?
  tarjetaMarca    String?
  metadata        String?  // JSON con respuesta completa de la pasarela
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Endpoint sugerido

```
POST /api/pagos/crear
  → Crea intent de pago en Wompi/Stripe
  → Devuelve URL/formulario de pago
  → Cliente paga en frontend
  → Webhook confirma → marca orden como pagada

POST /api/pagos/webhook/wompi
POST /api/pagos/webhook/stripe
  → Recibe confirmación de la pasarela
  → Actualiza estado del pago
  → Libera la orden
```

### Integración rápida con Wompi (Nicaragua)

```ts
// src/lib/payments/wompi.ts
export async function createWompiPaymentIntent(amount: number, ordenId: string) {
  const res = await fetch('https://production.wompi.co/v1/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount_in_cents: Math.round(amount * 100),
      currency: 'NIO', // o USD
      reference: ordenId,
      customer_email: 'cliente@logifast.com',
      payment_method: { type: 'CARD' }, // o NEQUI, PSE, etc.
      redirect_url: 'https://logifast.com/pago/exitoso',
    }),
  });
  return res.json();
}
```

---

## 📱 Avatar como foto de perfil

**Ya está implementado** en este rediseño:
- Endpoint: `POST /api/cliente/foto-perfil` (FormData + sharp → WebP)
- Componente: `ImageUploader` con drag&drop, preview, progreso
- UI: botón cámara en `ClientPerfil` y `RepartidorPerfil`
- Persistencia: `User.fotoUrl` en la BD
- Optimización: 400x400 WebP calidad 85 (cada foto ~30KB)

**Para extenderlo**:
- Subir fotos durante el registro (paso 3 del stepper)
- Avatar en chat (repartidor → cliente)
- Avatar en comentarios y reseñas
- Avatar en notificaciones push
- Filtro de detección de rostros (Amazon Rekognition o Face API) para evitar fotos inapropiadas
- Auto-crop inteligente con detección de rostro
- Marcas de agua para fotos de productos (logo LOGIFAST)

---

## 🎯 Prioridades recomendadas (próximas 4 semanas)

### Semana 1: Pagos + UX
1. Integrar **Wompi** para tarjetas locales
2. Modelo `Pago` + endpoints `/api/pagos/*`
3. Pantalla de pago en checkout (tarjeta/efectivo/transferencia)
4. Webhooks de confirmación

### Semana 2: Notificaciones reales
1. **Firebase Cloud Messaging** para push
2. **Resend** para emails transaccionales
3. Plantillas dinámicas (ya tienes `PlantillaMensaje`)
4. Centro de notificaciones en cada rol

### Semana 3: Social y engagement
1. Feed personalizado del cliente (algoritmo simple)
2. Sistema de referidos con código único
3. Niveles de cliente (Bronce/Plata/Oro/VIP)
4. Programa de puntos canjeables

### Semana 4: Optimización y growth
1. **Cloudinary** para imágenes (CDN + transforms)
2. **Sentry** para monitoreo de errores
3. **PostHog** o **Mixpanel** para analytics de producto
4. A/B testing de landing page
5. Migración a PostgreSQL (ya tienes las instrucciones)
