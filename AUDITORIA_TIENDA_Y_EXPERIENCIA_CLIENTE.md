# Auditoría de Tienda y Experiencia de Compra — LogiFast

> Documento de diagnóstico, viabilidad y plan. Fecha: 16 de septiembre de 2026.
> Alcance: portal de tienda y recorrido de compra del cliente. Sin Mall ni multi-sucursales.
> Método: lectura de código con evidencia (archivo:línea). No se ejecutó la app; nada de lo aquí afirmado proviene de suposiciones sin cita.

---

## PARTE 1 — DIAGNÓSTICO

### 1.1 Estado general del módulo tienda

El portal de tienda son **7 pantallas reales**, no cascarones. La navegación es por estado local
(`TiendaApp.tsx:22`, `useState<TiendaModulo>('kds')`) y se pinta por condicionales
(`TiendaApp.tsx:76-82`), con dock inferior en `TiendaNavbar.tsx:52-60`.

**Lo que funciona de punta a punta (verificado):**

- POS con transacción atómica: crea la venta, decrementa stock y registra Kardex en un solo `$transaction`
  (`src/app/api/tienda/pos/route.ts:103-160`). El precio sale de la base, no del cliente (`pos/route.ts:82-84`).
- Facturación DGI con vista previa de ticket (`TiendaFacturacion.tsx:290-360`, `perfil/route.ts:130-195`).
- Configuración de tienda con horario semanal estructurado, costo de envío y pedido mínimo
  (`TiendaConfiguracion.tsx:103-150`, `perfil/route.ts:134-190`).
- Kardex manual de ENTRADA / SALIDA / AJUSTE con motivo (`TiendaKardex.tsx:70-115`, `kardex/route.ts:53-125`).
- KDS con auto-refresco cada 20 segundos y máquina de estados real
  (`TiendaKDS.tsx:35-68`; transiciones en `api/cliente/tienda/pedidos/route.ts:93-96`).
- Reportes CSV con BOM UTF-8 (`TiendaReportesExcel.tsx:11-40`, `reportes/excel/route.ts:21-125`).

**Problemas con evidencia (ordenados por gravedad):**

1. **El stock puede quedar negativo y el Kardex miente.** En `pos/route.ts:139` se calcula
   `nuevoStock = Math.max(0, stockActual - item.cantidad)`, pero en la línea `:143` se persiste
   `stock: { decrement: item.cantidad }`, que sí admite negativos. El Kardex guarda el valor recortado
   (`:146-155`). Vender 10 unidades con 3 en existencia deja el producto en -7 y el Kardex en 0.

2. **El POS no valida stock antes de vender.** Ni el carrito consulta existencias (`TiendaPOS.tsx:63-80`)
   ni el endpoint rechaza por falta de stock: solo recorta a 0.

3. **Editar un producto reescribe el stock sin dejar rastro.** El formulario siempre envía `stock`
   (`TiendaInventario.tsx:126`) y el PATCH lo escribe tal cual (`api/tienda/productos/route.ts:159`),
   sin movimiento de Kardex. Si hubo ventas mientras el modal estaba abierto, el stock vuelve al valor
   viejo. El Kardex deja de ser una fuente de verdad auditable.

4. **`stockMinimo` no se puede configurar.** Existe el campo, el estado y el envío
   (`TiendaInventario.tsx:16, 38, 90, 127`), pero no hay ningún input que lo modifique: siempre queda en 5.

5. **No se puede borrar un producto.** `/api/tienda/productos` exporta GET, POST y PATCH, y ningún DELETE.

6. **Dos APIs de productos que escriben campos distintos.** `/api/tienda/productos` maneja costo,
   stockMinimo, codigoBarras y unidadMedida; `/api/cliente/tienda/productos` maneja precioOriginal,
   imagenColor, esNuevo y esPopular sin tocar los otros campos (y sin registrar Kardex).

7. **El ajuste manual de stock no es transaccional:** actualiza el producto (`kardex/route.ts:96`) y
   después crea el movimiento (`:102`), sin `$transaction`.

8. **El portal de tienda no tiene rol propio.** Los roles del sistema son cuatro
   (`src/lib/auth/session.ts:39`: cliente, repartidor, admin, ingeniero). La rama `loginRole === 'tienda'`
   de `src/app/page.tsx:783` nunca se activa. El comerciante entra por `ClientMiTienda.tsx:46`, que monta
   `TiendaApp` desde la app de cliente.

9. **Fallo silencioso al cargar el perfil.** Si `/api/tienda/perfil` falla, el navbar queda con
   "Mi Tienda" y no hay aviso (`TiendaApp.tsx:33-39`).

### 1.2 La experiencia del cliente comprando (recorrido simulado sobre el código)

Recorrido real: Inicio → Explorar → Tienda → Carrito → Confirmar.
Pantallas y salto entre ellas: `ClientShell.tsx:207-214` (pestañas), `ClientExplorar.tsx:308`
(selecciona tienda), `ClientShell.tsx:1529` (monta la tienda como overlay), `ClientTienda.tsx:254`
(agregar al carrito), `ClientTienda.tsx:2419-2460` (botón flotante de checkout),
`ClientCarrito.tsx:207` (pagar), `PagoExitoso.tsx:71-115` (confirmación).

**El flujo existe pero se corta en tres puntos duros, los tres verificados en el código:**

1. **No se puede comprar de dos tiendas (y el error aparece al final).** El carrito agrupa los artículos
   por tienda y los muestra separados (`ClientCarrito.tsx:125-139`), pero al pagar envía
   `const tiendaId = cartItems[0]?.tiendaId` (`ClientCarrito.tsx:218`) con **todos** los artículos
   (`:223-233`). El servidor rechaza cualquier producto de otra tienda con 400
   (`api/ordenes-compra/route.ts:167-172`: "Producto X no pertenece a la tienda indicada").
   El usuario descubre el problema después de armar el pedido, sin forma de partirlo.

2. **El envío que ve el cliente no es el que se cobra.** El carrito muestra un valor fijo de C$35
   (`ClientCarrito.tsx:120`: `cartItems.length > 0 ? 35 : 0`), mientras el servidor cobra
   `tienda.costoEnvio` (`api/ordenes-compra/route.ts:229-230`). El total mostrado y el cobrado divergen.

3. **Los cupones se validan dos veces y con reglas distintas.** El cliente trae códigos hardcodeados con
   descuento arbitrario (`ClientCarrito.tsx:194-199`: LOGIFAST20, PROMO50, BIENVENIDO50, LOGIFAST50 →
   C$50 fijos). El servidor revalida contra la base y aplica su propia regla
   (`api/ordenes-compra/route.ts:206-225`). Resultado: el usuario ve un descuento que puede desaparecer
   o cambiar el total al confirmar.

**Otras cosas que el cliente ve y no tienen sentido (verificadas):**

- Nombre de tienda hardcodeado: `'Tienda LogiFast'` (`ClientCarrito.tsx:219`).
- **La misma compra aparece dos veces en "Mis Pedidos":** el POST crea además una `OrdenServicio` de tipo
  compra (`api/ordenes-compra/route.ts:322-352`) y `GET /api/ordenes` devuelve todas las órdenes del
  cliente sin filtrar por tipo (`api/ordenes/route.ts:57-72`). Se ve como envío activo y como compra
  activa, con ids distintos.
- **El seguimiento de una compra usa la plantilla de paquetería**, con pasos como "Paquete recogido"
  (`src/lib/store.ts:467-476`), aunque el pedido sea de comida.
- **"Reordenar" solo navega a Explorar**: no repite el pedido.
- **La notificación "listo para retiro" miente:** `TiendaKDS.tsx:104-105` dispara
  `notificarPedidoListoParaRetiro` al pasar a "listo", pero **no existe modo retiro**: toda compra genera
  un envío con repartidor (`api/ordenes-compra/route.ts`, paso 5 de la transacción).
- Categorías del inicio que no coinciden con las de la tienda: al filtrar, la pantalla queda vacía.

### 1.3 Problemas de usabilidad y diseño detectados en ambos lados

Medición objetiva por archivo (objetos de estilo inline frente a clases CSS):

```
TiendaInventario.tsx   style-inline: 59   className: 2
TiendaPOS.tsx          style-inline: 58   className: 4
TiendaConfiguracion.tsx style-inline: 48  className: 2
TiendaKardex.tsx       style-inline: 46   className: 0
TiendaFacturacion.tsx  style-inline: 38   className: 1
TiendaKDS.tsx          style-inline: 26   className: 1
TiendaNavbar.tsx       style-inline: 17   className: 2
TiendaReportesExcel.tsx style-inline: 15  className: 0
```

Consecuencias concretas:

- **Cero capacidad de respuesta al tamaño de pantalla.** No hay una sola media query, `matchMedia` ni
  `useDeviceInfo` en los componentes de tienda ni en el flujo de compra del cliente. Un estilo inline no
  puede llevar media queries. La responsividad existe en `globals.css` (decenas de breakpoints), pero
  estos componentes casi no usan clases, así que no la aprovechan.
- **`TiendaNavbar.tsx` es el componente más fuera del sistema:** 0 tokens de diseño y 14 colores hex
  hardcodeados. Es la barra que el comerciante ve siempre.
- **Mezcla de tokens y colores fijos** en el resto (entre 5 y 16 hex por archivo), lo que rompe el modo
  claro/oscuro y la coherencia.
- **Estados ausentes:** sin estado de carga, vacío ni error en varias pantallas (por ejemplo, el perfil
  falla en silencio, `TiendaApp.tsx:33-39`). Sin feedback al pulsar en las tarjetas y botones del POS.
- **Kardex sin paginación ni filtros:** entrega 100 movimientos en una tabla plana (`kardex/route.ts:26-29`).
- **Jerarquía plana:** precios, stock y estados compiten con la misma tipografía y peso.

---

## PARTE 2 — VIABILIDAD DEL ESCÁNER REMOTO (celular → tablet/PC en tiempo real)

### Veredicto: VIABLE, y el trabajo pesado ya está hecho

La capa de relay ya existe y **acepta varios dispositivos por sala**:

- El servidor cuenta y deduplica sockets por sala (`mini-services/realtime-service/index.ts:52-59`).
- Ya hay un caso real de dos roles distintos compartiendo sala: en `orden:{id}` entra el repartidor
  (`index.ts:117`) y el cliente (`:140`), y ambos reciben (`:118`).
- El endpoint de emisión acepta cualquier nombre de sala, sin lista blanca (`index.ts:39-46`), así que
  una sala de escaneo `scan:{codigo}` es un cambio aditivo, no arquitectónico.

Es decir: el "escáner inalámbrico" no necesita infraestructura nueva, solo un canal de emparejamiento.

### Lo que falta construir

1. **Emparejamiento.** Hoy no existe nada (cero coincidencias de "emparej" en `src/`). Se resuelve con un
   código de 6 dígitos que la tablet muestra y el celular ingresa, o con un QR. El celular emite
   `pos:unirse { codigo }` y el servidor lo mete en `scan:{codigo}`.
2. **Re-unión automática a salas no personales.** Hoy `src/services/realtime.ts:14-18` solo vuelve a
   reclamar la sala personal tras reconectar. En un escáner esto es crítico: si el celular pierde señal
   un segundo y no se re-une, deja de llegar cada escaneo.
3. **Confirmación e idempotencia.** Un `ack` por escaneo con identificador único, para no duplicar
   artículos si el mismo código se emite dos veces por un reintento.
4. **Persistencia mínima en la tablet.** El servicio es 100% en memoria (`index.ts:87-88`): si el celular
   se desconecta, la tablet debe conservar lo escaneado (ya lo hace, porque el carrito vive en el POS).

### Límites reales, sin adornos

- **Requiere internet** en ambos dispositivos. Sin red no hay relay.
- **El celular debe estar en primer plano con la pantalla encendida.** El propio proyecto documenta que el
  WebView suspende WebSockets en segundo plano (`src/services/background-tracking.ts:6-15`), y el APK
  conecta directo a Railway (`NEXT_PUBLIC_REALTIME_URL` en `.env:10`), sin pasar por Caddy.
- **Latencia:** con la sala ya montada, el salto es un evento de socket; en la práctica se siente
  instantáneo en 4G. No hay medición en este entorno, es una expectativa razonable, no un dato medido.
- **Batería:** mantener pantalla encendida consume; conviene un modo "escáner activo" con Wake Lock y
  apagado automático por inactividad.
- **Modo directo (sin relay):** funciona sin internet, pero exige instalar un lector nativo.

### Escáner directo (Modo 1): qué hay y qué no

- **No hay ningún lector instalado.** Cero coincidencias de "barcode" en `src/`. Los dos APK compilan
  exactamente 8 plugins nativos y ninguno es de códigos de barras.
- **`@capacitor/camera` sí está instalado y compilado** (ambos `package.json:16`, permiso CAMERA declarado),
  pero **el código nunca lo usa**: cero llamadas a `getPhoto`.
- **Bloqueador concreto encontrado:** `src/middleware.ts:42` envía
  `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`. Eso **desactiva la cámara en el
  contexto web**: cualquier solución basada en navegador falla hasta que se cambie a `camera=(self)`.
  Es un cambio de una línea y es requisito previo de todo lo demás.
- **Opción recomendada:** plugin nativo `@capacitor-mlkit/barcode-scanning` (usa el escáner de ML Kit,
  funciona sin conexión, lectura continua en tiempo real, formatos EAN/UPC/Code128/QR). Requiere
  agregar el plugin y recompilar los APK.
- **Alternativa sin instalar nada:** la API del navegador `BarcodeDetector` no es fiable aquí (depende de
  los servicios de Google, y el proyecto mantiene un parche explícito para equipos Huawei sin ellos en
  `scripts/sync-mobile.js`).
- **Ya existe el punto de integración:** `Producto.codigoBarras` está en el esquema
  (`prisma/schema.prisma:358`) y el POS ya filtra por ese campo desde el buscador
  (`TiendaPOS.tsx:167-168`). Un escaneo solo tiene que escribir ese mismo valor en el mismo campo de búsqueda.

---

## PARTE 3 — FUNCIONES A INTEGRAR, SUPABASE STORAGE Y COMPRESIÓN

### 3.1 Estado real de las nueve funciones pedidas

| Función | Estado | Evidencia |
| :--- | :--- | :--- |
| Pedido recurrente programado | **No existe** | `OrdenCompra.programadoPara` está en el esquema pero solo se usa en mantenimientos: cero usos en el flujo de compra |
| Pedido y retiro en punto | **No existe** | Toda compra crea una `OrdenServicio` con repartidor. `notificarPedidoListoParaRetiro` se dispara en `TiendaKDS.tsx:105` sin que exista el modo retiro |
| Alerta de reposición al devolver producto | **No existe** | Cero coincidencias de devolución/reembolso en `src/app/api/` |
| Historial de compras + beneficios (5 compras/mes) | **Parcial** | Hay historial (`ClientPedidos.tsx:300-301`), puntos (25 por compra, `billetera/route.ts:86`) y cupones (`CuponCliente`), pero no existe la regla de 5 compras/mes |
| Estadísticas y reportes (top productos, horas pico) | **Parcial** | Solo exportación CSV plana. No hay endpoint de agregación ni gráficas en el portal |
| Códigos de descuento configurables por la tienda | **No existe** | `CodigoPromocional` no tiene `tiendaId` (`schema.prisma:139-157`) y ningún endpoint de tienda lo toca |
| Múltiples usuarios por tienda con roles | **No existe** | `Tienda` tiene un único `propietarioId` y todos los endpoints resuelven por ese campo |
| Marketing interno (banners y promociones pagadas) | **No existe para la tienda** | El modelo `Banner` existe con impresiones y clicks, pero sin `tiendaId`, sin precio y sin API de contratación |
| Alianzas y beneficios para repartidores | **No existe** | Cero modelos y campos de alianza o beneficio en el esquema |

### 3.2 Supabase Storage: ya está implementado (y tiene tres problemas)

Lo positivo: **las imágenes ya viven en Supabase Storage.** Bucket `logifast-media`, escritura en
`src/lib/upload/supabase-storage.ts:22-28`, URL pública en `:37-41`, y lo usan cuatro endpoints
(upload genérico, foto de perfil de cliente, foto de perfil de repartidor, fotos de mantenimiento).
También hay `cacheControl: 31536000`, correcto para ancho de banda.

Los tres problemas, en orden de gravedad:

1. **Respaldo silencioso que mete la imagen en la base de datos.** Si la subida falla, el helper **no
   lanza error**: devuelve la imagen completa en base64 como `data:` URL
   (`supabase-storage.ts:30-35` y `:42-45`, repetido en `api/upload/route.ts:44-53`). Ese valor se guarda
   en `User.fotoUrl` y en `MediaAsset.url`, columnas de texto sin límite. Cada respuesta JSON que incluya
   al usuario arrastra decenas de kilobytes de base64. Es exactamente lo contrario de "ahorrar ancho de
   banda", y el operador no se entera porque el fallo parece un éxito.
2. **Credenciales hardcodeadas de respaldo** (`supabase-storage.ts:3-4`): URL y una clave JWT embebidas en
   el código como fallback. Además, `SUPABASE_SERVICE_ROLE_KEY` **no está definida ni en `.env` ni en
   `.env.example`** (cero coincidencias), así que hoy se usa el fallback.
3. **No hay borrado ni variantes.** No existe ninguna llamada a `.remove()`: cambiar la foto de perfil deja
   la anterior acumulada para siempre. `upsert: true` con nombre que incluye la fecha hace que nunca se
   sobrescriba nada. Y se sirve un solo tamaño para todos los dispositivos.

### 3.3 Reglas obligatorias de imágenes y compresión

**Regla 1: una sola puerta.** Toda subida pasa por un único helper con validación, compresión, subida y
registro. Nada de caminos alternativos.

**Regla 2: comprimir en el servidor, no confiar en el cliente.** Hoy la compresión ocurre en el navegador
(`ImageUploader.tsx:100-105`: 800x800, webp calidad 0.75) y `sharp` está instalado pero su ruta es código
muerto (`saveImage` no se invoca en ningún lado). El cliente se puede saltar; el servidor no.

**Regla 3: presupuestos por caso de uso** (ancho máximo, calidad webp, peso objetivo):

| Caso | Ancho máx | Calidad | Peso objetivo |
| :--- | :--- | :--- | :--- |
| Foto de perfil | 400 px | 80 | menos de 40 KB |
| Miniatura de producto (lista) | 320 px | 72 | menos de 25 KB |
| Imagen de producto (detalle) | 900 px | 78 | menos de 120 KB |
| Portada de tienda | 1400 px | 78 | menos de 200 KB |
| Banner | 1600 px | 80 | menos de 250 KB |
| Foto de mantenimiento | 1200 px | 75 | menos de 180 KB |

Todas en WebP, con `fit: 'inside'` y `withoutEnlargement: true` para no agrandar lo que ya es pequeño, y
autocorrección de orientación EXIF.

**Regla 4: un objeto, dos variantes.** Subir la original optimizada más una miniatura, y servir la miniatura
en listas y la grande en el detalle. Se guarda la ruta base, no dos filas.

**Regla 5: nada de base64 en la base de datos.** Si la subida falla, se devuelve error y se muestra al
usuario. Nunca un `data:` URL persistido.

**Regla 6: borrar al reemplazar.** Al cambiar foto de perfil, logo o portada, se elimina el objeto anterior
del bucket.

---

## PARTE 4 — PROPUESTA DE REDISEÑO VISUAL

**Regla de oro respetada:** no se cambia el sistema. Se mantienen los tokens (`--bg`, `--surface`, `--text`,
`--primario`), las tipografías (Syne para títulos, DM Sans para texto, JetBrains Mono para números),
los radios de tarjeta, las sombras y los iconos del proyecto. Lo que cambia es **cómo se ejecuta**.

### 4.1 Los cuatro problemas estructurales y su corrección

1. **Todo es estilo inline.** Se migra el *layout* (contenedores, rejillas, separaciones, tamaños) a clases
   con breakpoints en `globals.css` o en un archivo propio del módulo, conservando los tokens para color.
   Lo decorativo puede quedarse inline. Sin este paso, tablet y escritorio son imposibles.
2. **`TiendaNavbar` fuera del sistema.** Se reemplazan los 14 hex por tokens y se unifica el tratamiento de
   las dos cápsulas flotantes.
3. **Jerarquía plana.** Se definen tres niveles tipográficos dentro de cada pantalla: título de sección,
   dato principal (precio, stock, estado) y dato secundario. El precio y la acción pasan a ser lo más
   pesado visualmente; el ruido administrativo baja de peso y de contraste.
4. **Estados ausentes.** Cada pantalla con datos necesita cuatro estados explícitos: cargando (esqueleto,
   no spinner suelto), vacío (con salida a la acción), error (con reintento) y contenido. Hoy varias
   pantallas solo tienen el cuarto.

### 4.2 Especificación por dispositivo

**Celular (uso principal del comerciante en mostrador):**

- Una columna, ancho completo, sin márgenes laterales internos.
- Dock inferior ya existente (`TiendaNavbar.tsx:238`) como única navegación; se eliminan las cápsulas
  flotantes fijas que hoy compiten con el contenido.
- Objetivos táctiles de 44 px mínimo; acciones destructivas separadas.
- POS: carrito colapsable en hoja inferior, teclado numérico de pantalla completa, botón de cobro anclado
  abajo y siempre visible.

**Tablet (vertical y horizontal, ancho completo):**

- Dos paneles: lista a la izquierda, detalle a la derecha (inventario, Kardex, KDS).
- POS en dos columnas: catálogo y carrito simultáneos, sin hojas ni modales para lo esencial.
- Rejillas de producto de 3 a 4 columnas según ancho, con la miniatura y el precio siempre visibles.
- El escáner remoto tiene aquí su lugar natural: la tablet es la pantalla grande.

**Escritorio:**

- Menú lateral permanente en lugar del dock inferior (el componente de navegación ya está aislado, así que
  se puede intercambiar por breakpoint).
- Tablas amplias con encabezado fijo, orden por columna, filtros en barra superior y paginación visible
  (el Kardex hoy entrega 100 filas sin controles).
- Densidad mayor: las tarjetas pasan a filas compactas.
- Panel de estadísticas con gráficas.

### 4.3 Reglas de interacción transversales

- Transiciones cortas (0.15 a 0.22 s) y solo en opacidad y desplazamiento; nada que bloquee el toque.
- Feedback inmediato al pulsar (escala 0.98 y cambio de fondo) en toda tarjeta y botón.
- Nunca bloquear con un modal lo que se puede resolver en la misma pantalla.
- Los avisos van a *snackbar* o a notificación; los errores siempre con acción de reintento.

---

## PARTE 5 — PLAN DE IMPLEMENTACIÓN

**Fase 0 — Cimientos (1 a 2 días).** Cámara habilitada en el middleware
(`Permissions-Policy: camera=(self)`), borrar el respaldo de credenciales hardcodeadas, definir
`SUPABASE_SERVICE_ROLE_KEY` y verificar el bucket y sus políticas. Sin esto, nada de imágenes ni escáner
es confiable. Verificación: subida real que devuelva URL pública y NO un `data:` URL.

**Fase 1 — Integridad de stock (2 días).** Corregir el decremento para que use el valor recortado y rechace
la venta sin existencias; hacer que editar un producto no toque el stock (o que genere movimiento de
Kardex); volver transaccional el ajuste manual; exponer `stockMinimo` en el formulario; agregar DELETE de
productos; unificar en una sola API las dos rutas de productos. Verificación: vender 10 con 3 en existencia
debe rechazarse; editar el precio no debe alterar el stock; cada cambio de stock debe tener su fila de Kardex.

**Fase 2 — Arreglar la compra del cliente (3 días).** Resolver la compra multi-tienda (partir el pedido o
impedir mezclar tiendas con un aviso claro desde el carrito); calcular el envío real desde la tienda;
validar los cupones contra el servidor **antes** de mostrar el descuento; filtrar la orden de compra para
que no se duplique como envío; corregir el nombre de tienda hardcodeado; ajustar el seguimiento para que
hable de pedido y no de paquete. Verificación: compra completa con cupón válido, con cupón inválido y con
artículos de dos tiendas.

**Fase 3 — Escáner (3 a 4 días).** Primero el modo directo: integrar el plugin de códigos de barras,
pantalla de escaneo con lectura continua y envío directo al carrito del POS. Después el modo remoto sobre
la sala de escaneo: código de sesión en la tablet, unión desde el celular, re-unión automática tras
reconexión, confirmación por escaneo con identificador único y sonido de confirmación en ambos lados.
Verificación: escanear en el celular y ver el artículo aparecer en la tablet sin recargar, con el celular
escaneando 20 códigos seguidos sin perder ninguno.

**Fase 4 — Funciones nuevas (1 semana).** Pedido recurrente (usar `programadoPara` y el cron que ya existe
para campañas), retiro en tienda (nuevo modo de entrega y su notificación correcta), devoluciones con
reingreso automático de stock por Kardex, regla de beneficios por 5 compras al mes, estadísticas con
agregación real (top productos, horas pico), códigos de descuento por tienda, y usuarios adicionales por
tienda con permisos.

**Fase 5 — Rediseño visual (1 semana).** Migrar el layout de tienda a clases con breakpoints, en el orden:
POS, inventario, KDS, Kardex, configuración, reportes. Un pantalla por vez, cada una verificada en los tres
tamaños.

**Fase 6 — Pulido (2 días).** Estados de carga, vacío y error en todas las pantallas; paginación del Kardex;
auditoría final de contraste, tamaños táctiles y textos.

---

## PARTE 6 — RECOMENDACIONES TÉCNICAS

1. **Un solo camino de escritura por dominio.** Las dos APIs de productos ya divergieron. Un helper único por
   entidad evita que vuelva a pasar.
2. **El Kardex debe ser la fuente de verdad del stock.** Ninguna ruta debería escribir `stock` sin crear su
   movimiento. Si el stock se puede editar a mano sin rastro, no hay auditoría posible.
3. **Transacciones para todo lo que toque stock y dinero** (POS, compra, ajuste manual, devolución).
4. **Nunca base64 en la base de datos.** Un fallo de subida debe ser un error visible.
5. **Validar en el servidor lo que se muestra en el cliente.** Cupones y costo de envío son el ejemplo claro:
   el cliente no debe calcular dinero que el servidor luego corrige.
6. **El escáner debe escribir en el mismo campo que ya usa el buscador del POS.** Cero código nuevo de
   búsqueda: el escaneo es un atajo de teclado con superpoderes.
7. **Re-unión de salas tras reconexión**: generalizar lo que hoy solo hace la sala personal. Sin esto, el
   escáner remoto se siente roto en cuanto el celular parpadea.
8. **Idempotencia en el escaneo** (identificador único por lectura) para que un reintento de red no agregue
   dos veces el mismo artículo.
9. **Un rol de tienda de verdad.** Hoy el comerciante entra por la puerta del cliente. Un rol propio simplifica
   permisos, evita la rama muerta de `page.tsx:783` y habilita el día de mañana los usuarios múltiples.
10. **Medir antes de prometer.** Nada de lo aquí afirmado sobre rendimiento fue medido en dispositivo: la
    latencia del escáner remoto y el consumo de batería deben validarse en un teléfono real antes de
    comprometerlos con el usuario final.
