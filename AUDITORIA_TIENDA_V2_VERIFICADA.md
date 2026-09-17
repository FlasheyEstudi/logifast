# Auditoría v2 — Tienda y Experiencia de Compra (verificada en código)

**Fecha:** 17 de septiembre de 2026
**Repo:** `~/linux/logifast` · rama `main` · HEAD `b479482`
**Alcance:** portal de tienda + recorrido de compra del cliente. Tienda individual. **Sin Mall ni multi-sucursal.**
**Base:** re-verificación de `AUDITORIA_TIENDA_Y_EXPERIENCIA_CLIENTE.md` (16-sep) contra el código actual.

---

## 0. Método y límites (leer antes de confiar en cualquier cifra)

- Todo hallazgo lleva evidencia `ruta:linea` leída del árbol de trabajo **de hoy**, no de la auditoría anterior.
- **No se ejecutó la aplicación.** `DATABASE_URL` apunta a Postgres remoto en Supabase (`aws-0-us-east-2.pooler.supabase.com`) y este entorno no tiene red. No hay verificación de runtime: ni latencia, ni capturas, ni pruebas end-to-end.
- Verificación por afirmación del informe previo: **18 confirmadas**, **1 matizada** (`stockMinimo`, §1.3), **2 corregidas** (§0.1) y varias **líneas desplazadas**.
- Los conteos de estilo salen de `rg` sobre `src/components/**`. Donde el conteo literal era imposible, se indica el sustituto usado.

### 0.1 Correcciones al informe anterior

1. **`sharp` NO es del todo código muerto.** `src/lib/upload/image.ts` implementa `saveImage()` con sharp (rotate EXIF + `resize(1200,1200, inside)` + webp q82) y hasta un `deleteImage()`. Pero **se importa y nunca se invoca**: `api/upload/route.ts:2`, `cliente/foto-perfil/route.ts:4`, `repartidor/foto-perfil/route.ts:4` lo importan; ningún sitio lo llama. La ruta viva es `uploadToSupabaseStorage` **sin compresión de servidor**. La afirmación original ("no se invoca") es correcta; la conclusión útil es otra: *hay compresor escrito y probado, solo hay que enchufarlo*.
2. **`.env` sí define `DATABASE_URL`/`DIRECT_URL`/`JWT_SECRET`/`NEXT_PUBLIC_REALTIME_URL`** (Postgres de Supabase), pero **no define ninguna variable `SUPABASE_*`** ni en `.env` ni en `.env.example`. Consecuencia dura: `src/lib/upload/supabase-storage.ts:3-4` cae siempre a la **URL y al JWT anon hardcodeados**. Hoy el almacenamiento de imágenes depende de una credencial embebida en el repositorio.
3. **El KDS no está roto "solo un poco": está roto del todo para el comerciante** (§1.3, hallazgo A). Es el hallazgo más grave del módulo y es nuevo respecto a la v1.

---

## 1. Diagnóstico del módulo TIENDA

### 1.1 Las 7 pantallas (`src/components/tienda/`)

Navegación por estado local (`TiendaApp.tsx:22`) y dock inferior (`TiendaNavbar.tsx:52-59`):

- **KDS** (pantalla por defecto) — monitor de pedidos entrantes, refresco cada 20 s.
- **POS** — caja, venta de mostrador, ticket DGI.
- **Inventario** — alta/edición de productos, publicar/pausar.
- **Kardex** — movimientos manuales ENTRADA / SALIDA / AJUSTE.
- **Facturación** — datos fiscales, vista previa de ticket.
- **Reportes** — exportación CSV (BOM UTF-8).
- **Perfil/Configuración** — horario semanal, costo de envío, pedido mínimo, logo.

Total API del proyecto: **118 rutas** `route.ts` (medido hoy).

### 1.2 Lo que funciona (verificado)

- **POS transaccional**: crea venta + descuenta stock + registra Kardex en un solo `$transaction` (`api/tienda/pos/route.ts:104-160`).
- **Precio autoritativo del servidor**: el POS ignora el precio que manda el cliente y usa `prod.precio` (`pos/route.ts:77-84`). Igual en la compra del cliente (`api/ordenes-compra/route.ts:175-176`).
- **Compra del cliente con validación de stock previa** (`ordenes-compra/route.ts:181-186`) y decremento con rollback si queda negativo (`:264-272`).
- **Endpoint correcto de estados de pedido**: `PATCH /api/cliente/tienda/pedidos` valida propiedad de tienda y aplica una máquina de estados real (`api/cliente/tienda/pedidos/route.ts:60-134`). *Existe; el KDS no lo usa (ver A).*
- **Cupones revalidados en servidor** para compras (`ordenes-compra/route.ts:196-227`): estado, vigencia, usos máximos y "ya usado".
- **Facturación DGI, Kardex manual, reportes CSV y configuración**: operativos.

### 1.3 Problemas del lado tienda, por gravedad

**A. El KDS no puede mover pedidos (nuevo, crítico).**
`TiendaKDS.tsx:36` carga los pedidos de `/api/cliente/tienda/pedidos` (ids de `OrdenCompra`), pero al pulsar un botón llama `TiendaKDS.tsx:97` → `PATCH /api/ordenes/${ordenId}`. Ese endpoint exige, para rol `cliente`, ser el dueño de la orden (`api/ordenes/[id]/route.ts:52-55`) y en una `OrdenCompra` el `clienteId` es **el comprador**, no el comerciante. Resultado: **403 y "Error al actualizar el estado"**.
Y aunque el comerciante fuese admin, el mapeo de estados convertiría `listo` en `recibido` (`api/ordenes/[id]/route.ts:106-110`), así que el pedido nunca llegaría a "listo".
Extra: el tercer botón del KDS envía `listo → entregado` (`TiendaKDS.tsx:325-327`), transición que **la máquina de estados del endpoint correcto no permite** (`listo: ['en_camino','cancelado']`, `cliente/tienda/pedidos/route.ts:113-119`).
**Consecuencia:** el comerciante no puede atender un pedido desde su propia pantalla principal. Es el bug de mayor impacto de toda la auditoría.

**B. El stock puede quedar negativo y el Kardex miente.**
`api/tienda/pos/route.ts:139` calcula `nuevoStock = Math.max(0, stockActual - item.cantidad)` (recortado a 0), pero `:143` persiste `stock: { decrement: item.cantidad }` (admite negativos). El Kardex guarda el valor recortado (`:153`). Vender 10 con 3 en existencia deja el producto en **-7** y el Kardex en **0**. El POS **no valida stock antes de vender** (`pos/route.ts:64-94` no compara existencias; el carrito tampoco: `TiendaPOS.tsx:75-90`).

**C. Editar un producto reescribe el stock sin rastro.**
El formulario siempre manda `stock` (`TiendaInventario.tsx:126`) y el PATCH lo escribe tal cual (`api/tienda/productos/route.ts:159`) **sin crear movimiento de Kardex** (el único `kardexMovimiento.create` del archivo está en el POST, `:101`). Si hubo ventas con el modal abierto, el stock vuelve al valor viejo. Tampoco valida negativos.

**D. No se puede borrar un producto.** `api/tienda/productos` exporta GET/POST/PATCH; no hay `DELETE` (`:10`, `:41`, `:128`, fin en `:174`). El endpoint de cliente **sí** tiene DELETE (`api/cliente/tienda/productos/route.ts:104`).

**E. El ajuste manual de Kardex no es atómico.** `api/tienda/kardex/route.ts:96` actualiza el producto y `:102` crea el movimiento, sin `$transaction` y con lectura previa en `:84`. (Nota: aquí producto y Kardex sí coinciden porque ambos usan el valor recortado; el problema es la carrera, no la mentira.)

**F. Dos APIs de productos divergentes.** `/api/tienda/productos` escribe costo, `stockMinimo`, `codigoBarras`, `unidadMedida` y Kardex de entrada; `/api/cliente/tienda/productos` escribe `precioOriginal`, `imagenColor`, `esNuevo`, `esPopular` y **no toca Kardex**. El mismo producto tiene dos puertas de escritura con reglas distintas.

**G. `stockMinimo` no es configurable.** Existe el campo y se envía (`TiendaInventario.tsx:16,38,90,127`) pero **no hay input** que lo edite: en producto nuevo queda 5. (Matiz: al editar se reenvía el valor existente.)

**H. Credencial de Supabase hardcodeada y respaldo base64.** `src/lib/upload/supabase-storage.ts:3-4` define URL y JWT anon en el código; si la subida falla, devuelve `data:...base64` como si fuera éxito (`:30-35`, `:42-46`), y `api/upload/route.ts:43-54` repite el patrón. Esos valores se guardan en `User.fotoUrl` / `MediaAsset.url`. **Sin `.remove()`**: no hay borrado de objetos, y los nombres incluyen `Date.now()` (`:20`), así que cada cambio acumula basura.

**I. Sin rol de tienda.** Los roles son `cliente | repartidor | admin | ingeniero` (`src/lib/auth/session.ts:39`). La rama `loginRole === 'tienda'` de `src/app/page.tsx:783` **nunca se activa** (ningún selector produce ese valor). El comerciante entra por la puerta del cliente (`ClientMiTienda.tsx:46` → `TiendaApp`).
Consecuencia directa: cualquier validación de permisos que pregunte "¿eres el cliente dueño de esta orden?" falla para el comerciante (es la causa de A).

**J. Fallo silencioso al cargar el perfil.** `TiendaApp.tsx:32` hace `if (!res.ok) return;` sin aviso; el navbar se queda en "Mi Tienda" y nadie se entera.

**K. Kardex plano.** Entrega 100 movimientos sin paginación ni filtros (`api/tienda/kardex/route.ts:26-29`).

---

## 2. Experiencia del cliente comprando (recorrido simulado sobre el código)

Recorrido: **Inicio → Explorar → Tienda → Carrito → Confirmar → Seguimiento**.
Montaje: pestañas (`ClientShell.tsx:207-214`), tienda como overlay (`:1529`), carrito y checkout (`ClientCarrito.tsx`), confirmación (`PagoExitoso.tsx` → `OrderConfirmationModal`).

### 2.1 Los tres cortes duros del flujo (todos confirmados hoy)

1. **No se puede comprar de dos tiendas, y el error aparece al final.**
   El carrito agrupa visualmente por tienda (`ClientCarrito.tsx:125-139`), pero al pagar envía `const tiendaId = cartItems[0]?.tiendaId` **con todos los artículos** (`:218` y `:225-231`). El servidor rechaza con 400 `Producto X no pertenece a la tienda indicada` (`ordenes-compra/route.ts:166-171`). El cliente descubre el problema después de armar el pedido, sin forma de partirlo.

2. **El envío que ve no es el que se cobra.**
   El carrito muestra `cartItems.length > 0 ? 35 : 0` (`ClientCarrito.tsx:120`, pintado en `:957`), y el servidor cobra `tienda.costoEnvio` (`ordenes-compra/route.ts:229`). Solo después de crear la orden la UI se reconcilia (`:257`). *Mostrar un número y cobrar otro es el defecto de confianza más caro del flujo.*

3. **Los cupones se validan dos veces y con reglas distintas.**
   Cliente: cupones de billetera + lista maestra + **códigos hardcodeados** (`ClientCarrito.tsx:189-199`: `LOGIFAST20` → 20; `PROMO50`/`BIENVENIDO50`/`LOGIFAST50` → 50). Servidor: `db.codigoPromocional` con reglas propias (`ordenes-compra/route.ts:196-227`).
   **Agravante verificado:** el seed solo crea `LOGI20` y `BIENVENIDA` (`scripts/seed.js:484,499`). Ninguno de los códigos hardcodeados existe en la base → el usuario ve "¡Cupón aplicado!" y al confirmar recibe **400 `Código promocional inválido`**: la compra no se crea.
   **Segundo agravante:** `aplicableA` y `segmento` del cupón (`BIENVENIDA` es `primer_envio`/`nuevos`) **no se validan en el servidor**: cualquiera puede usarlo repetidamente (solo lo limita `usoCodigo` por cliente).

### 2.2 Otras cosas que el cliente ve y no cierran

- **La misma compra aparece dos veces en "Mis Pedidos".** Toda compra crea además una `OrdenServicio` `tipo:'compra'` (`ordenes-compra/route.ts:324`), y `GET /api/ordenes` no filtra por tipo (`api/ordenes/route.ts:50-65`). `ClientPedidos.tsx:297` la pinta como "Envíos en curso" **y** `:298` como compra activa.
- **Nombre de tienda con fallback fijo:** `(item as any).tiendaNombre || 'Tienda LogiFast'` (`ClientCarrito.tsx:126`, `:219`). Mejoró respecto a la v1 (ya usa el nombre real cuando existe), pero el respaldo sigue siendo un literal.
- **El seguimiento de una compra habla de paquetería:** `TRACKING_STEPS_TEMPLATE` con `{ label: 'Paquete recogido' }` (`src/lib/store.ts:467-476`, `:1072`). No hay plantilla de pedido.
- **"Reordenar" no reordena:** solo navega a Explorar (`ClientPedidos.tsx:241-242`).
- **Notificación de "listo para retiro" sin modo retiro:** se dispara en `TiendaKDS.tsx:104-108` y en `ClientShell.tsx:493-503`; pero **no existe el modo retiro** (toda compra crea reparto) y `metodoEntrega` — el campo que `ClientShell.tsx:499` consulta — **no se escribe en ningún sitio del proyecto**. Es una notificación que miente por diseño.
- **Categorías del inicio que no llevan a nada:** las tarjetas usan `'restaurantes'`, `'supermercados'`, `'farmacias'` (`ClientInicio.tsx:820,864,908`) y las claves reales son `comida, tienda, farmacia, regalos, supermercado, tecnologia, deportes` (`src/lib/marketplace-store.ts:125-133`). Al filtrar, la lista queda vacía (`ClientExplorar.tsx:80`).
- **Métodos de pago decorativos:** "Transferencia" y "Tarjeta" están `disabled: true` con badge "Próximamente" (`ClientPerfil.tsx:2366-2367`) y el carrito fuerza efectivo (`ClientCarrito.tsx:112`). El cliente ve tres opciones; solo una es real.
- **Filtro muerto:** `historiaFilter` se declara y nunca se aplica (`ClientPedidos.tsx:300-307`).
- **Función fantasma:** el store tiene `cartScheduleMode` ('ahora' | 'programar') (`marketplace-store.ts:161,241,443`) y **ninguna pantalla lo usa** — la UI de "programar entrega" no existe.

### 2.3 Lo que le falta al recorrido

- Punto de retiro (pago en app + retiro en tienda + aviso real).
- Recompra con un toque (reordenar de verdad).
- Estado "listo" visible para el cliente con instrucciones de retiro.
- Transparencia de costos antes de confirmar (envío real, descuento validado, total final).
- Manejo de errores con salida: hoy el 400 del servidor se muestra como notificación y el carrito queda igual.

---

## 3. Escáner de códigos de barras — viabilidad verificada

### 3.1 Modo 1 — Escáner directo (cámara del dispositivo)

**Estado: no existe hoy. Viable con dos caminos, uno de ellos barato.**

- No hay ningún lector instalado en el código (`barcode`/`mlkit`/`BarcodeDetector`: cero coincidencias en `src/`).
- **`@capacitor/camera` sí está instalado y compilado** en el APK del cliente: `@capacitor/camera` está en las dependencias (`Escritorio/LogiFast-Cliente-Android/package.json:16`), la app lo enlaza (`android/capacitor.settings.gradle`: `include ':capacitor-camera'`), lo compila (`android/app/capacitor.build.gradle:13`) y declara el permiso (`AndroidManifest.xml:25` `<uses-permission android:name="android.permission.CAMERA" />`).
- **Camino A (recomendado):** añadir `@capacitor-mlkit/barcode-scanning` — lector nativo, sin conexión, lectura continua, formatos EAN/UPC/Code128/QR. Coste: plugin nuevo + recompilar APK (requiere red para bajar dependencias Gradle/ML Kit).
- **Camino B (sin plugin nuevo):** usar la cámara ya compilada para capturar la foto y decodificarla con una librería JS (zxing-js / quagga). Funciona sin tocar el APK, pero es foto-a-foto, no continuo: se siente lento en mostrador.
- **Camino C (navegador/PWA): bloqueado.** `src/middleware.ts:42` envía `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`. Ese header **mata `getUserMedia`/`BarcodeDetector`** en el contexto web. Es un cambio de una línea (`camera=(self)`), pero solo habilita el camino web; para el APK el camino nativo A/B no depende de ese header.
- **Punto de integración ya listo:** `Producto.codigoBarras` existe (`prisma/schema.prisma:358`) y el buscador del POS ya filtra por ese campo (`TiendaPOS.tsx:166-169`). Un escaneo solo tiene que **escribir ese valor en el mismo campo de búsqueda**: cero lógica nueva de búsqueda.

### 3.2 Modo 2 — Escáner remoto (celular → tablet/PC)

**Veredicto: VIABLE. La infraestructura existe; falta el emparejamiento y el re-join.**

Lo que ya funciona:
- Microservicio Socket.IO con CORS abierto (`mini-services/realtime-service/index.ts:86-88`) y conteo/dedupe de sockets por sala (`:52-60`).
- Emisión server-side a **cualquier** sala desde Next (`src/lib/realtime-emitter.ts:18-33` → `POST /api/emit`).
- Precedente real de dos roles compartiendo sala (`orden:{id}`: repartidor y cliente).

Lo que falta construir (4 piezas, ninguna arquitectónica):
1. **Handler de sala de escaneo.** Hoy **no existe un `room:join` genérico**: las salas se crean con `socket.join` explícito y solo para las uniones conocidas (`index.ts:104-187`). Hace falta `socket.on('escaner:unir', …)` → `socket.join('escaner:'+codigo)`.
2. **Método cliente + re-unión.** `src/services/realtime.ts:112-140` solo expone las uniones listadas, y en reconexión **solo se reclama la sala personal** (`:42-45`). Sin re-join, un parpadeo de red desconecta el escáner en silencio.
3. **Confirmación e idempotencia.** `ack` por lectura con id único, para que un reintento no agregue el producto dos veces.
4. **Autenticación y lista blanca.** Hoy `/api/emit` acepta cualquier sala y cualquier `userId` (`index.ts:26-81`), sin allowlist, y si no hay sala hace `io.emit(...)` a todos. La comparación del secreto es por igualdad exacta y solo en `production`, con default `'logifast-dev-secret'` (`:27-34`). **Sin cerrar esto, cualquiera puede inyectar códigos de barras en el POS de una tienda.**
   Además: el mapa `salasOrden` se llena y **nunca se limpia** en `disconnect` (`:203-212`).

### 3.3 Límites reales (sin adornos)

- **Requiere internet en ambos dispositivos.** Sin red no hay relay; el modo directo (1) es el único que funciona offline.
- **El celular debe estar en primer plano con la pantalla encendida** (el propio proyecto documenta que el WebView suspende WebSockets en segundo plano).
- **Latencia:** no medida (no se pudo ejecutar nada). En 4G con la sala montada es un evento de socket; "instantáneo" es expectativa razonable, **no dato**.
- **Batería:** pantalla encendida consume; conviene Wake Lock + apagado por inactividad.
- **Seguridad:** ver punto 4 arriba. Es requisito previo, no mejora opcional.

---

## 4. Las 9 funciones a integrar — estado real e integración

Sin Mall ni multi-sucursal. Estado verificado en esquema + endpoints + UI.

- **1. Pedido recurrente (lun-vie, horario y lugar) — NO EXISTE.**
  `OrdenCompra.programadoPara` está en el esquema (`schema.prisma:452`) y **nunca se usa** en el flujo de compra (los usos de `programadoPara` son de mantenimiento de motos). No hay campos de días ni plantilla. Sí existe un scheduler real que se puede reutilizar: `mini-services/realtime-service/index.ts:155-186` (`setInterval` 5 min → `POST /api/cron/campanas`).
  *Integración:* tabla `PedidoRecurrente` (tienda, cliente, días, hora, dirección, items, activo) + cron que reutilice `ordenes-compra` interno + UI en el carrito (el store ya tiene `cartScheduleMode` sin usar).

- **2. Pedido y retiro en punto — PARCIAL (solo la notificación).**
  `notificarPedidoListoParaRetiro` existe (`src/services/native-notifications.ts:549-589`) y se dispara en dos sitios, pero **no hay modo retiro persistido**: `metodoEntrega` no existe en `OrdenCompra` (`schema.prisma:435-464`) y nadie lo escribe; el texto de la notificación siempre es de repartidor.
  *Integración:* campo `metodoEntrega` ('envio'|'retiro') + no crear `OrdenServicio` cuando sea retiro + validar pago previo + pantalla de retiro con código.

- **3. Alerta de reposición al devolver producto — NO EXISTE.**
  Cero coincidencias de devolución/reembolso en `src/` y `prisma/`. El Kardex tiene tres escritores y ninguno es devolución (`pos/route.ts:146`, `productos/route.ts:101`, `kardex/route.ts:102`).
  *Integración:* modelo `Devolucion` + movimiento Kardex tipo `DEVOLUCION` + reposición automática + umbral `stockMinimo` para la alerta.

- **4. Historial + beneficios (5 compras/mes) — PARCIAL.**
  Historial sí (`ClientPedidos.tsx`), puntos sí pero derivados del total histórico, no mensual (`cliente/fidelizacion/route.ts:16-24`; `cliente/billetera/route.ts:87-97`), cupones de cliente sí (`CuponCliente`, `schema.prisma:1040-1057`). La regla "5 compras/mes" **no existe**. `referidos` devuelve datos **simulados** (`cliente/referidos/route.ts:19-26`).
  *Integración:* contador mensual (o `groupBy` por mes) + tabla de recompensas + otorgar cupón al llegar a 5. Reutiliza `CuponCliente`.

- **5. Estadísticas y reportes — PARCIAL (para la tienda: solo CSV).**
  `tienda/reportes/excel/route.ts` exporta CSV plano; el Kardex entrega 100 filas. **No hay `topProductos` ni `horasPico`** (cero coincidencias). Las agregaciones reales viven solo en admin (`admin/stats/route.ts:8-70`).
  *Integración:* endpoint `tienda/estadisticas` con `groupBy` sobre `OrdenCompra`/`VentaPOS` (por día, por hora, top productos) + gráficas en el portal.

- **6. Códigos de descuento por tienda — NO EXISTE (existe a nivel plataforma).**
  `CodigoPromocional` **no tiene `tiendaId`** (`schema.prisma:139-158`); su API exige `requireRole('admin')` (`api/codigos/route.ts:61,108,131`); no hay UI de cupones en el portal.
  *Integración:* `tiendaId` opcional (null = global) + endpoints en `api/tienda/cupones` + UI. **Y arreglar antes el §2.1-3** (validación en servidor con reglas que el cliente no pueda contradecir).

- **7. Múltiples usuarios por tienda con roles — NO EXISTE.**
  `Tienda.propietarioId` es único (`schema.prisma:316`) y **todos** los endpoints resuelven la tienda por ese campo (pos `:29`, perfil `:22,62,153`, productos `:18,49,147`, kardex `:19,80`, reportes `:19`, pedidos `:22,75`). Un segundo usuario vería todo vacío.
  *Integración:* tabla puente `UsuarioTienda` (tiendaId, userId, rol: dueño|cajero|bodega) + helper `getTiendaDelUsuario()` que sustituya los `findFirst({propietarioId})`. Depende del rol de tienda real (§1.3-I).

- **8. Marketing interno (banners pagados) — PARCIAL.**
  `Banner` existe con `impresiones`/`clicks` (`schema.prisma:174-199`) pero **sin `tiendaId` ni precio**, y su API es solo admin (`api/banners/route.ts:120,233,275`). No hay contratación ni cobro.
  *Integración:* `tiendaId` + `precio`/`presupuesto` + estado de campaña + endpoint de compra + métricas por tienda.

- **9. Alianzas y beneficios para repartidores — NO EXISTE.**
  Cero coincidencias de `alianza`/`convenio`. Lo más cercano: motos y saldo (`Moto`, `RecargaSaldo`, `RepartidorProfile.saldo`).
  *Integración:* modelo `Alianza` (comercio ↔ beneficio) + descuentos aplicables al repartidor + vitrina en su app.

---

## 5. Supabase Storage y compresión — reglas obligatorias

**Situación actual:** las imágenes viven en Supabase, pero con tres defectos estructurales (§1.3-H): credencial embebida, respaldo base64 silencioso y sin borrado. Y **la compresión real ocurre en el navegador** (`src/lib/image-compressor.ts` + `ImageUploader.tsx`, canvas 800×800, webp q0.75), que el cliente puede saltarse: los endpoints aceptan el archivo crudo y lo suben tal cual.

**Reglas:**

1. **Una sola puerta.** Toda subida pasa por un único helper: valida → comprime → sube → registra. Nada de caminos alternativos (hoy hay tres sitios subiendo con el mismo helper y ninguno comprimiendo).
2. **Comprimir en el servidor.** Ya está escrito: `src/lib/upload/image.ts` con sharp (rotate EXIF, `resize(..., { fit: 'inside', withoutEnlargement: true })`, webp). **Enchufarlo** a `uploadToSupabaseStorage` en vez de importarlo y no llamarlo.
3. **Presupuestos por caso de uso** (ancho máximo, calidad webp, peso objetivo):
   - Foto de perfil: 400 px · q80 · < 40 KB
   - Miniatura de producto (listas): 320 px · q72 · < 25 KB
   - Imagen de producto (detalle): 900 px · q78 · < 120 KB
   - Portada de tienda: 1400 px · q78 · < 200 KB
   - Banner: 1600 px · q80 · < 250 KB
   - Foto de mantenimiento: 1200 px · q75 · < 180 KB
   Todas en WebP, `fit: inside`, `withoutEnlargement: true`, orientación EXIF corregida.
4. **Un objeto, dos variantes.** Original optimizada + miniatura; se sirve la miniatura en listas y la grande en detalle. Se guarda la ruta base, no dos filas.
5. **Nada de base64 en la base de datos.** Si la subida falla: error visible y reintento. Nunca un `data:` URL persistido. (Esto además aliviará cualquier respuesta JSON que hoy arrastre la foto del usuario.)
6. **Borrar al reemplazar.** Al cambiar foto, logo o portada, eliminar el objeto anterior del bucket (hoy se acumulan: nombre con `Date.now()`, sin `.remove()`).
7. **Servir según dispositivo** con las variantes + `next/image` (o `srcset`) para no mandar 900 px a un celular.
8. **Credenciales fuera del código.** Variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env` y `.env.example`; borrar el JWT hardcodeado y **rotar esa clave** (estuvo versionada).

---

## 6. Rediseño visual — mismo sistema, mejor ejecución

### 6.1 Causa raíz del desorden (hallazgo nuevo y decisivo)

`tailwind.config.ts:9-30` define los colores como **tripletas HSL**: `background: 'hsl(var(--background))'`, `primary: 'hsl(var(--primary))'`… pero `globals.css:108-124` define esos tokens como **HEX y rgba**: `--background:#F2F2F7`, `--primary:#007AFF`, `--border-shadcn: rgba(...)`.
Resultado mecánico: `bg-background`, `bg-primary`, `border-border` **generan CSS inválido**. Por eso el proyecto abandonó las clases y (con)vive de estilos inline.

Magnitud medida (`rg` sobre `src/components/`):

- **Tienda:** 308 estilos inline vs 13 `className=` en 9 archivos (ratio ≈ 24:1). **Cero** uso de las clases del sistema (`lf-*`) en todo `src/components/tienda/`.
- **Flujo de compra:** 659 inline vs 16 `className=` (ratio ≈ 41:1). Peores: `ClientPerfil` 258, `ClientTienda` 243, `ClientSolicitar` 227, `ClientInicio` 118, `ClientPedidos` 109, `ClientCarrito` 77.
- Los estilos inline **no admiten media queries**: los únicos `@media` del flujo están en un `<style>` local de `ClientShell.tsx` (líneas 1767, 1773, 1793, 1813, 1821). En `tienda/`: cero media queries, ceros `matchMedia`.
- **Estados:** `isLoading` = 0 y `skeleton` = 0 en todo `tienda/` + flujo. Ninguna pantalla tiene los cuatro estados (carga/vacío/error/contenido); varias solo tienen el cuarto. `ClientCarrito` no tiene estado vacío.
- `TiendaNavbar.tsx` (la barra que el comerciante ve siempre): **14 colores hex, cero tokens**.

### 6.2 Qué se conserva y qué se corrige

**Se conserva (regla de oro):** el sistema ya existe y es bueno — tokens Apple-like (`--bg`, `--surface`, `--text`, `--primario #007AFF`, `--exito #34C759`, `--peligro #FF3B30`), radios (`--lf-card-radius 14px`, `--lf-sheet-radius 20px`, `--lf-pill-radius 100px`), sombras (`--lf-shadow-card/float/sheet/fab`), glass (`--lf-glass-*`), tipografías (Syne títulos, DM Sans texto, JetBrains Mono cifras) y componentes `.lf-card`, `.lf-btn-primario`, `.lf-btn-ghost`, `.lf-safe-*`, scope `.cliente-app`. **No se cambia nada de eso.**

**Se corrige (ejecución):**

1. **Arreglar la capa de tokens** (hex → HSL o quitar `hsl()` del config). Es el desbloqueo: sin esto, cada pantalla seguirá inventando colores.
2. **Migrar layout a clases con breakpoints** pantalla por pantalla, conservando tokens para color. Lo decorativo puede quedarse inline.
3. **`TiendaNavbar` al sistema:** reemplazar los 14 hex por tokens y unificar las cápsulas flotantes (hoy compiten con el contenido).
4. **Jerarquía en tres niveles** por pantalla: título de sección, dato principal (precio, stock, estado) y dato secundario. El precio y la acción pasan a ser lo más pesado; lo administrativo baja de peso y contraste.
5. **Cuatro estados explícitos** en cada pantalla con datos: carga (esqueleto, no spinner suelto), vacío (con acción), error (con reintento) y contenido.
6. **Feedback al toque:** toda tarjeta/botón responde (escala 0.98 + cambio de fondo); transiciones 0.15-0.22 s solo en opacidad/desplazamiento.

### 6.3 Especificación por dispositivo

**Celular (mostrador):** una columna, ancho completo; dock inferior como única navegación (se eliminan las cápsulas fijas que compiten); objetivos táctiles ≥ 44 px; POS con carrito colapsable en hoja inferior y botón de cobro anclado abajo.
**Tablet (vertical y horizontal):** 100% del ancho; dos paneles (lista | detalle) en Inventario, Kardex y KDS; POS en dos columnas (catálogo + carrito) sin modales para lo esencial; rejillas de 3-4 columnas. **Aquí vive el escáner remoto** (es la pantalla grande).
**Escritorio:** menú lateral permanente en vez del dock (el componente de navegación ya está aislado, se intercambia por breakpoint); tablas amplias con encabezado fijo, orden por columna, filtros en barra superior y paginación visible; densidad mayor; panel de estadísticas con gráficas.

### 6.4 Por qué este orden

Sin la corrección de tokens (§6.2-1) cualquier rediseño vuelve a escribirse inline y el problema se repite. Con ella, el resto es trabajo de layout medible y verificable en tres tamaños.

---

## 7. Verificación de los 4 commits sin pushear

**Estado:** `main` está **4 commits adelante de `origin/main`** (base remota = `aef8387`). Nada pusheado.

### 7.1 Gates ejecutados (evidencia real, hoy)

- **`tsc --noEmit`** → salida vacía, **exit 0**: 0 errores de tipos en todo el proyecto.
- **`eslint`** sobre los **8 archivos** tocados por los 4 commits → **exit 0**, 0 errores y 0 avisos.
- **`next build`** → **exit 0**, `✓ Compiled successfully in 8.0s`, `✓ Generating static pages (31/31)`. El build completo pasa.

*(El verificador delegado no pudo ejecutar nada por un techo de permisos read-only; estos tres gates los ejecuté directamente y sus salidas están en `/tmp/cw-tsc.log`, `/tmp/cw-eslint.log`, `/tmp/cw-build.log`.)*

### 7.2 Veredicto por commit (revisión de diff + código)

- **`2c2387e` fix(móvil) — PASS con observaciones.** Limpia el bundle anterior antes de copiar. Observación: `fs.rmSync` borra **todo** `_next`, no solo `static`; no quedan emojis en el archivo de notificaciones (verificado por rango Unicode).
- **`284bf30` fix(despacho) — PASS con observaciones.** Corrige de verdad el contrato roto (`cliente` pasaba como objeto) y la fusión por id evita que el panel borre el historial. Observaciones: la normalización al contrato `Order` es **parcial** — emite estados crudos (`asignado`, `aceptado`, `recibido`, `preparando`, `listo`, `en_camino`) fuera de los valores de `OrderStatus` (`src/lib/store.ts:8`), marca `estadoPago:'pagado'` fijo para toda la cola y arma un `timeline` de un solo paso. La autorización del GET (`requireRole('admin')`) es preexistente: no aparece en el diff de este commit.
- **`8fa27e2` feat(mensajes) — PASS.** POST/PATCH/DELETE con gate `admin`, `variables` serializado como string (coherente con Prisma), el switch revierte si el servidor rechaza. Observación menor: el GET admite `ingeniero`, así que un ingeniero ve el panel y recibe 403 al guardar.
- **`b479482` fix(store) — PASS con observaciones.** En `ClientPedidos` el cambio es correcto (`useStore.getState().fetchOrders()` mapea las filas y captura errores internamente; el polling de 20 s se mantiene). En `DashboardShell`, la rama de **envíos** funciona (el endpoint `/api/ordenes` sí devuelve `repartidor`), pero la de **compras** lee `o.cliente`, `o.tienda` y `o.repartidor`, y el payload mapeado de `/api/ordenes-compra` **no devuelve esos campos**: devuelve `repartidorNombre`, `tiendaNombre` y no incluye `cliente` (`api/ordenes-compra/route.ts:47-90`). Resultado: las compras siguen mostrando "Cliente Marketplace", "Tienda Marketplace" y repartidor `null`/`RP`. Arreglo de una línea en la rama de compras: `nombreRepartidorDe(o.repartidor) ?? o.repartidorNombre` (y análogo para tienda/cliente).

### 7.3 Trazabilidad y recomendación

- Ninguno de los 4 commits tocó `worklog.md` ni documentación: el rastro del porqué se pierde.
- **Conclusión: los 4 pasan typecheck, lint y build.** Ninguno rompe la compilación; se pueden integrar. Quedan dos detalles de una línea (rama de compras de `DashboardShell`, estados crudos del despacho) que conviene arreglar antes de empujar, no después. *Empujar a `origin` es una acción externa: no la ejecuté; requiere tu autorización.*

---

## 8. Plan de implementación paso a paso

**Fase 0 — Cimientos (1-2 días).**
Habilitar `camera=(self)` en `middleware.ts:42`; sacar las credenciales de Supabase del código y definir `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` en `.env`/`.env.example`; rotar el JWT expuesto; borrar el respaldo base64 (que el fallo sea error visible).
*Verificación:* subida real que devuelva URL pública y **no** un `data:` URL.

**Fase 1 — Reparar lo que ya está roto (3-4 días).** Orden por impacto:
1. **KDS → endpoint correcto** (`/api/cliente/tienda/pedidos` PATCH) y alinear las transiciones con la máquina de estados del servidor. *Verificación:* pedido que recorre recibido → preparando → listo desde el portal.
2. **POS:** rechazar venta sin stock y persistir el valor recortado (o el decremento, pero no ambos). *Verificación:* vender 10 con 3 en existencia debe rechazarse y el Kardex debe cuadrar.
3. **Inventario:** que editar producto no escriba stock sin Kardex; exponer `stockMinimo`; agregar DELETE o "archivar".
4. **Compra del cliente:** bloquear carrito multi-tienda con aviso temprano; traer el envío real de la tienda; validar cupones contra el servidor **antes** de mostrar el descuento; filtrar `tipo:'compra'` en Mis Pedidos; quitar el nombre fijo; corregir las categorías del inicio; habilitar o esconder los métodos de pago no disponibles.
*Verificación:* compra completa con cupón válido, con cupón inválido y con artículos de dos tiendas.

**Fase 2 — Escáner (3-4 días).**
Primero el directo (plugin ML Kit o cámara+decoder JS) escribiendo en el campo `codigoBarras` del buscador del POS. Después el remoto: emparejamiento por código de 6 dígitos, sala `escaner:{codigo}`, re-unión automática, `ack` idempotente, sonido en ambos lados.
*Verificación:* 20 escaneos seguidos sin perder ninguno; probar con el celular en modo avión un segundo y confirmar que vuelve a unirse.
*Requisito de seguridad:* autenticar el join y poner allowlist en `/api/emit` **antes** de exponerlo.

**Fase 3 — Funciones nuevas (1 semana).** Recurrente (cron existente + tabla), retiro en tienda (`metodoEntrega` + notificación correcta), devoluciones con reposición y alerta, regla de 5 compras/mes, estadísticas con agregación real, cupones por tienda, usuarios múltiples por tienda.
*Verificación:* una por una con su caso de uso completo.

**Fase 4 — Rediseño visual (1-1.5 semanas).** Arreglar tokens; luego migrar pantalla por pantalla en este orden: POS, Inventario, KDS, Kardex, Configuración, Reportes, y después el flujo de compra (Carrito → Tienda → Mis Pedidos). Cada pantalla verificada en celular, tablet y escritorio.
*Verificación:* mismas pantallas, cero regresiones funcionales, y el conteo de estilos inline debe bajar por pantalla (es medible con `rg`).

**Fase 5 — Pulido (2 días).** Estados de carga/vacío/error, paginación del Kardex, auditoría de contraste y tamaños táctiles.

---

## 9. Recomendaciones técnicas y de código

1. **Un solo camino de escritura por dominio.** Las dos APIs de productos ya divergieron (§1.3-F).
2. **El Kardex debe ser la fuente de verdad del stock.** Ninguna ruta escribe `stock` sin movimiento. Si se edita a mano sin rastro, no hay auditoría.
3. **Transacciones para todo lo que toque stock o dinero** (POS, compra, ajuste manual, devolución). Hoy POS y compra sí; Kardex manual no.
4. **Validar en el servidor lo que se muestra en el cliente.** Envío y cupones son el ejemplo: el cliente no debe calcular dinero que el servidor corrige después.
5. **Reutilizar antes de inventar:** el endpoint de estados correcto ya existe; el compresor con sharp ya existe; el cron ya existe; `codigoBarras` ya está en el buscador. La mitad del trabajo es conectar piezas.
6. **Un rol de tienda de verdad.** Hoy el comerciante es `cliente` y eso rompe permisos (causa raíz del bug del KDS) y bloquea usuarios múltiples.
7. **Idempotencia en escaneos** (id único por lectura) y **re-join de salas** en reconexión: sin lo segundo, el escáner remoto se siente roto al primer parpadeo.
8. **Cerrar `/api/emit`**: allowlist de salas + auth obligatoria. Hoy acepta cualquier sala y hasta emite a todos.
9. **Cupones: una sola regla.** El servidor decide; el cliente solo la pinta. Y validar `aplicableA`/`segmento`.
10. **Medir antes de prometer.** Latencia del escáner remoto, consumo de batería y rendimiento real no fueron medidos (no se pudo ejecutar la app): validarlos en dispositivo antes de comprometerlos con el usuario final.

---

## 10. Fase 1 ejecutada — registro de cambios (17-sep-2026)

Seis escritores en paralelo con **archivos disjuntos** (reclamo de escritura por archivo exacto, sin solapamiento), y después una sola pasada de gates globales ejecutada por el orquestador.

### 10.1 Qué cambió, por frente

- **A · KDS** (`src/components/tienda/TiendaKDS.tsx`): el cambio de estado pasa de `PATCH /api/ordenes/:id` (que devolvía 403 al comerciante y mapeaba `listo`→`recibido`) a `PATCH /api/cliente/tienda/pedidos` con `{ id, estado }`, mostrando el error real del servidor. Tercera transición alineada a la máquina de estados: `listo → en_camino` ("Entregar al Repartidor"). Se eliminó la notificación de "listo para retiro", que mentía porque el modo retiro no existe (queda comentada para cuando exista).
- **B · POS** (`api/tienda/pos/route.ts`, `TiendaPOS.tsx`): se rechaza la venta sin existencias con **400** y mensaje que indica producto y disponible; dentro de la transacción se relee el producto, se calcula `stockActual - cantidad` y producto y Kardex escriben **el mismo valor** (se eliminó el `decrement` que permitía negativos). El carrito del POS topa la cantidad al stock real. Los productos con `stock === null` siguen vendiéndose sin tocar existencias.
- **C · Inventario/Kardex** (`api/tienda/productos/route.ts`, `api/tienda/kardex/route.ts`, `TiendaInventario.tsx`): editar un producto ya no reescribe el stock en silencio — si el valor cambia, la actualización y su movimiento `AJUSTE` van en una sola transacción, y se rechaza stock negativo; el POST de creación también quedó atómico con su ENTRADA inicial; el ajuste manual de Kardex es una única transacción; el formulario expone por fin **"Stock mínimo (alerta)"** (y `0` deja de convertirse en 5); el control de Pausar/Publicar se etiqueta "Archivar del catálogo"/"Publicar en catálogo" con confirmación en línea (sin borrado duro, para no romper la trazabilidad del Kardex); la tarjeta avisa cuando el stock está en o por debajo del mínimo.
- **D · Checkout y cupones** (`ClientCarrito.tsx`, `api/ordenes-compra/route.ts`, `api/codigos/validar/route.ts`, **nuevo** `src/lib/cupones.ts`): el envío mostrado sale **solo** de `GET /api/tiendas/[id]` (`costoEnvio`) — nunca más un 35 fijo; mientras carga, el botón queda deshabilitado; si el fetch falla, se dice "Por confirmar" y el CTA lo advierte, sin inventar montos; con artículos de más de una tienda y por debajo del `pedidoMinimo` el pago se bloquea con el motivo escrito. Los cupones hardcodeados (`LOGIFAST20`, `PROMO50`, `BIENVENIDO50`, `LOGIFAST50`) y la lista maestra local **desaparecieron**: el descuento lo decide `POST /api/codigos/validar` y se revalida antes de cobrar. Y las reglas se unificaron en `src/lib/cupones.ts`, que ahora usan **los dos** caminos (vista previa y cobro), cerrando el hueco por el que un POST directo podía saltarse `montoMinimo`, `tipoServicio`, `primerPedidoSolo` y el tope de descuento.
- **E1 · Carrito y Mis Pedidos** (`src/lib/marketplace-store.ts`, `ClientPedidos.tsx`): guarda anti-mezcla en `addToCart` (rechaza agregar de otra tienda con aviso claro, antes de que el error aparezca al final del checkout); `CartItem.tiendaNombre` existe y se rellena (el carrito ya muestra el nombre real); las compras ya **no** se duplican como "envíos en curso"; `historiaFilter` se aplica de verdad; y "Reordenar" se renombró a "Explorar tiendas" porque rearmar el carrito no era posible sin cambiar la forma de la respuesta de la API (los items llegan sin `productoId`).
- **E2 · Inicio y seguimiento** (`ClientInicio.tsx`, `src/lib/store.ts`): las tres tarjetas de categorías usan las claves reales (`comida`, `supermercado`, `farmacia`) y dejan de llevar a una lista vacía; el seguimiento de una compra tiene su propia plantilla de pasos ("Pedido confirmado", "Pedido recogido"…) y ya no habla de paquetería; la plantilla de envíos quedó intacta.

### 10.2 Gates ejecutados (evidencia real, no autoinforme)

- **`tsc --noEmit`** → **exit 0**, salida vacía: 0 errores de tipos en todo el proyecto (`/tmp/cw2-tsc.log`).
- **`eslint`** sobre los **14 archivos** tocados → **exit 0**, 0 errores y 0 avisos (`/tmp/cw2-eslint.log`).
- **`next build`** → **exit 0**, `✓ Compiled successfully in 8.6s`, `✓ Generating static pages (31/31)` (`/tmp/cw2-build.log`).
- **Revisión manual del tramo crítico** (dinero): `delivery` se deriva únicamente de `envioTienda.costoEnvio` (`ClientCarrito.tsx:238`); el cupón se revalida con el subtotal actual antes del POST y un rechazo muestra el mensaje del servidor y aborta (`:343-352`); cero coincidencias de códigos hardcodeados y de `validateCodigoPromo`; todos los hooks quedan antes del `return null` de `:232` (orden de hooks correcto).

### 10.3 Hallazgos adyacentes detectados y NO tocados (fuera del alcance de esta fase)

- `ClientPerfil.tsx:1722` ignora el `boolean` que devuelve `addToCart` y muestra siempre "agregado al carrito": con la nueva guarda, el usuario puede ver el aviso de rechazo **y** un toast falso. Arreglo de una línea.
- `ClientShell.tsx` (~409-425) elige como "envío activo" cualquier `OrdenServicio` no entregada, incluidas las `tipo:'compra'`: es el mismo patrón de doble fuente que se corrigió en `ClientPedidos`, pero en otro archivo.
- El servidor **no** valida `tienda.pedidoMinimo` al crear la orden (hoy solo lo bloquea la UI). Vale la pena moverlo al servidor en la Fase 3.
- Los métodos de pago del carrito siguen limitados a efectivo ("Transferencia" aparece como Próximamente); falta decidir si se ocultan o se habilitan.

### 10.4 Lo que sigue pendiente de la Fase 0 y de la Fase 2

- **Fase 0 (cimientos) sin ejecutar a propósito:** definir `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` en `.env`/`.env.example`, borrar el JWT embebido en `supabase-storage.ts:4` y **rotar esa clave en el panel de Supabase** (acción externa: requiere tu decisión), cambiar `Permissions-Policy` a `camera=(self)` y eliminar el respaldo base64 silencioso.
- **Fase 2 (escáner):** sin empezar. Sigue en pie el plan: primero el modo directo (ML Kit o cámara+decoder), después el modo remoto con emparejamiento, re-unión de sala y `ack` idempotente — y **antes** de exponerlo, autenticar el join y poner allowlist en `/api/emit`.

### 10.5 Límite de esta verificación

Nada de lo anterior se ejecutó contra la base de datos real (sin red en el entorno). Los gates de compilación pasan y la lógica se revisó línea por línea, pero **el comportamiento en runtime está sin observar**: la prueba de fuego (una compra completa con cupón válido, una con cupón inválido y una con artículos de dos tiendas) queda pendiente para un entorno con base de datos.

> Los cambios están **sin commitear** en `main`. No se empujó nada.

