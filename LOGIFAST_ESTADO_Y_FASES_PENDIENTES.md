# LogiFast — Estado, verificaciones y fases pendientes

**Fecha:** 17 de septiembre de 2026
**Repo:** `~/linux/logifast` · rama `main`
**Contenido:** qué se hizo, qué queda (con **pruebas a ejecutar en cada fase**), acceso a la base de datos, mejoras futuras y guía para verificar **Tienda ↔ Cliente ↔ Repartidor**.
**Informe técnico detallado:** `AUDITORIA_TIENDA_V2_VERIFICADA.md` (mismo directorio).

---

## 0. Estado en 30 segundos

- **Fase 1 (reparaciones críticas): TERMINADA Y VERIFICADA** contra la base de datos real. 14 archivos, ya commiteados.
- **Fase 0 (cimientos de seguridad/imágenes): PENDIENTE** — requiere decisiones tuyas (rotar credenciales).
- **Fase 2 (escáner de códigos de barras): PENDIENTE** — diseño y contrato ya cerrados (§5).
- **Fase 3 (funciones nuevas) y Fase 4 (rediseño visual): PENDIENTES** (§6 y §7).
- Nada está pusheado todavía. Ver §9 (¿es seguro subir?).

---

## 1. Qué se reparó en la Fase 1

| Área | Antes | Ahora |
|---|---|---|
| **KDS (pantalla principal del comerciante)** | Llamaba a `PATCH /api/ordenes/{id}`, que devolvía **403** al comerciante y convertía `listo` en `recibido` | Usa `PATCH /api/cliente/tienda/pedidos` (valida que la tienda sea suya) y la transición correcta `listo → en_camino` |
| **POS** | Podía vender sin stock: dejaba el producto en **negativo** (-7) mientras el Kardex registraba 0 | Rechaza con **400** (producto y disponible) y producto/Kardex escriben **el mismo valor** |
| **Inventario** | Editar un producto reescribía el stock **sin dejar rastro** en el Kardex; `stockMinimo` no era editable | Si el stock cambia, se crea el movimiento `AJUSTE` en la misma transacción; input de **"Stock mínimo (alerta)"**; "Archivar del catálogo" con confirmación |
| **Kardex** | El ajuste manual no era atómico | Lectura + actualización + movimiento en **una sola transacción** |
| **Carrito / checkout** | Mostraba envío fijo **C$35** (el servidor cobraba otro); cupones hardcodeados que **no existían** en la BD → la compra fallaba con 400 | Envío **real** de la tienda; cupones decididos **solo por el servidor**; bloqueo de carrito multi-tienda y de pedidos bajo el mínimo |
| **Cupones (servidor)** | La vista previa y el cobro usaban **reglas distintas** (se podían saltar con un POST directo) | **Motor único** en `src/lib/cupones.ts`: monto mínimo, tipo de servicio, primer pedido, tope y uso único, idénticos en los dos caminos |
| **Mis Pedidos** | La misma compra salía **duplicada** (como envío y como compra) | Filtrado por tipo; el historial aplica su filtro; "Reordenar" ya no miente |
| **Inicio / seguimiento** | Categorías que llevaban a una lista vacía; el seguimiento hablaba de "paquete" en una compra | Claves de categoría reales; plantilla propia de pedido |

**Verificado con evidencia real:** `tsc` 0 errores · `eslint` 0 avisos en los 14 archivos · `next build` correcto (31/31 páginas) · login real · `GET /api/tienda/perfil`, `/api/cliente/tienda/pedidos`, `/api/tienda/productos`, `/api/tienda/kardex` con datos reales · `LOGI20` sobre C$200 → **descuento C$40** · `BIENVENIDA` → rechazado por "primer pedido" · `LOGIFAST20` (código viejo) → **400** (prueba de que la compra habría fallado) · pedido de otra tienda → **403**.

> **Incidente durante la verificación:** una prueba mía sobre el endpoint viejo cambió el estado de la orden `cmu2wlvj70003la09rewquaai` de `en_camino` a `recibido`. **Ya fue restaurada** a `en_camino`; el campo `updatedAt` conserva la marca de tiempo de esa operación. El login de prueba dejó además una fila en `LoginAudit` (comportamiento normal del sistema).

---

## 2. Acceso a la base de datos

- **Motor:** PostgreSQL en Supabase. **Host:** `aws-0-us-east-2.pooler.supabase.com` (pooler, puerto 6543 / directo 5432).
- **La cadena completa vive en `~/linux/logifast/.env`** (variables `DATABASE_URL` y `DIRECT_URL`). Ese archivo **está en `.gitignore`**, así que no se sube al repositorio.
- **Contraseña:** la que me indicaste. **A propósito NO la escribo en este archivo.**

> ### ⚠️ Por qué no escribo la contraseña aquí
> Este documento vive **dentro del repositorio** y va a ser commiteado y subido. Cualquier secreto escrito en un archivo versionado queda **para siempre en el historial de Git** (aunque luego lo borres, sigue recuperable) y lo ve cualquiera con acceso al repositorio. Por eso:
> - La contraseña se queda **solo** en `.env` (ignorado por Git).
> - Si necesitas pasar credenciales a alguien, usa un gestor de contraseñas, no un `.md`.
> - **Recomendación:** si esa contraseña se ha compartido por chat o correo, **rótala** en el panel de Supabase y actualiza `.env`. Anótalo como parte de la Fase 0.
> - Si aun así quieres el texto en el archivo, dímelo y lo añado — pero entonces **este archivo no debe subirse nunca** (habría que añadirlo a `.gitignore`).

**Consultas rápidas de verificación (solo lectura):**

```bash
cd ~/linux/logifast
# Contar tablas y ver el esquema real
node_modules/.bin/prisma db pull --print | head -40

# Consulta suelta desde Node (usa la URL de .env; nunca imprime la contraseña)
node --env-file=.env -e "const{PrismaClient}=require('/home/flashey/linux/logifast/node_modules/@prisma/client');const d=new PrismaClient();d.tienda.count().then(n=>console.log('tiendas:',n)).finally(()=>process.exit(0))"
```

**Datos reales que condicionan las pruebas:**
- **8 tiendas**, pero **solo 2 tienen dueño**:
  - **Tienda de María López** (`cmsnxugd80001la09tb68pxx1`) → dueño `cliente@logifast.com` · envío C$20 · pedido mínimo C$50 · su producto: **"Frescl"** C$20, stock 10, código de barras `000112`.
  - **Tienda de Antonio Cortez** (`cmso1m7w20002l509bq6zwq8g`) → dueño `envios@logifast.com` · sin productos.
  - Las otras 6 (Pizza Express, Farmacia San Pablo, Floristería Rosas, Mini Market Don Carlos, TechZone Managua, Super Abarrotes) **no tienen propietario** → nadie puede atender sus pedidos desde el portal tienda (§8, paso 5.0.c).
- **Usuarios demo** (contraseña `123456`): `cliente@logifast.com`, `repartidor@logifast.com` (Carlos Martínez, perfil activo), `admin@logifast.com`, `ingeniero@logifast.com`.
- **Cupones sembrados:** `LOGI20` (20 %, usos 12/100) y `BIENVENIDA` (C$50, solo primer pedido). Los códigos `LOGIFAST20`/`PROMO50`… **no existen**.
- **Casi ningún producto tiene `codigoBarras`**: para probar el escáner hay que cargarlos desde Inventario.

---

## 3. Fase 0 — Cimientos (PENDIENTE · requiere tu decisión)

**Trabajo a realizar:**
1. Definir `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env` y `.env.example`.
2. Borrar el JWT hardcodeado de `src/lib/upload/supabase-storage.ts:4` y **rotar esa clave** en el panel de Supabase.
3. Quitar el respaldo silencioso que guarda imágenes como `data:...base64` cuando falla la subida → debe ser un **error visible**.
4. Enchufar `src/lib/upload/image.ts` (compresor con **sharp** ya escrito y **nunca invocado**) al camino real de subida.
5. Añadir `.remove()` para borrar la imagen anterior del bucket al reemplazarla.

**Pruebas a ejecutar al terminar la Fase 0:**
- [ ] Subir una foto de perfil real y comprobar que `User.fotoUrl` empieza por `https://` y **no** por `data:`.
- [ ] Verificar en el panel de Supabase que el objeto existe en el bucket `logifast-media` con el peso esperado (< 40 KB para perfil).
- [ ] Reemplazar la foto y comprobar que **la anterior fue eliminada** del bucket.
- [ ] Cortar la red a propósito y subir: debe mostrar **error visible**, no un falso éxito.
- [ ] Confirmar que la clave vieja ya no funciona (rotada).

---

## 4. Fase 1 — Reparaciones (TERMINADA ✅)

**Pruebas de regresión para repetir cuando se toque este código** (§8 tiene el detalle de comandos):
- [ ] Vender 10 unidades con 3 en existencia → **400** con producto y disponible; stock intacto; sin Kardex.
- [ ] Vender 3 con 3 → venta creada, stock 0, **una** fila de Kardex con `stockNuevo: 0`.
- [ ] Editar un producto cambiando el precio → el stock **no** cambia y **no** se crea movimiento.
- [ ] Editar el stock a mano → se crea el movimiento `AJUSTE` con el valor anterior y el nuevo.
- [ ] Mover un pedido desde el KDS: recibido → preparando → listo → en_camino (los cuatro pasos con 200).
- [ ] Compra con `LOGI20` → descuento exacto del 20 % sobre el subtotal, **nunca** sobre el envío.
- [ ] Compra con artículos de dos tiendas → bloqueada con aviso claro.
- [ ] "Mis Pedidos" → la compra aparece **una sola vez**.

---

## 5. Fase 2 — Escáner de códigos de barras (PENDIENTE · contrato cerrado)

**Objetivo doble:** (1) escáner **directo** con la cámara del celular/tablet; (2) escáner **remoto**: el celular lee los códigos y llegan **al instante** a la tablet/PC que tiene el POS abierto, como si fuera un lector físico conectado.

**Viabilidad: SÍ**, con la infraestructura que ya existe (microservicio Socket.IO + `Producto.codigoBarras` + el buscador del POS). No requiere servicios nuevos.

### Piezas a construir
1. **Servicio realtime** (`mini-services/realtime-service/index.ts`): salas de escaneo + endurecer `/api/emit` (auth obligatoria, allowlist de salas, prohibir broadcast total) + arreglar la fuga del mapa `salasOrden` al desconectar.
2. **Cliente realtime** (`src/services/realtime.ts`): métodos `escanerUnirse` / `escanerEnviar` / `escanerSalir` con *ack* y timeout, y **re-unión automática tras reconexión** (crítico: si el celular parpadea, debe volver a la sala solo).
3. **Panel "Escáner" en el POS** (tablet/PC): muestra el **código de sesión de 6 dígitos**, recibe cada lectura, la inyecta en el buscador existente y agrega el producto si la coincidencia es única; pitido/vibración de confirmación; anti-duplicados. Además, soporte de **pistola HID** (teclado + Enter).
4. **Página `/escaner`** para el celular: emparejar con el código, leer con cámara si el navegador lo permite (`BarcodeDetector` + `getUserMedia`) y **respaldo por teclado** si no; wake lock para no apagar la pantalla.
5. **`Permissions-Policy: camera=(self)`** en `src/middleware.ts` (hoy `camera=()` bloquea la cámara en el navegador).

### Contrato técnico (v1)
- Sala: `escaner:{CODIGO}` (6 dígitos que genera y muestra la tablet).
- Eventos: `escaner:unir` `{codigo, rol:'pantalla'|'lector'}` con ack · `escaner:codigo` `{codigo, valor, id}` con ack (idempotente por `id`) · `escaner:salir`.
- Recepción: `escaner:codigo:recibido` `{valor, id, desde, en}` · `escaner:presencia` `{pantalla, lectores}` · `escaner:cerrada`.
- La tablet crea la sala como `pantalla`; el celular entra como `lector` **solo si la sala existe y la pantalla está activa**.

### Pruebas a ejecutar al terminar la Fase 2
- [ ] La tablet muestra el código; el celular entra con él y la tablet pasa a "Lector conectado".
- [ ] Escanear 20 códigos seguidos → llegan **los 20**, en orden, sin duplicados.
- [ ] Escanear un código que **no existe** → aviso claro, sin agregar nada.
- [ ] Escanear un código con **varias coincidencias** → no agrega automáticamente; deja el valor en el buscador.
- [ ] Poner el celular en modo avión 5 s y volver: **se re-une solo** y sigue enviando.
- [ ] Cerrar el panel del POS → el celular muestra "sesión cerrada" y vuelve al paso de emparejar.
- [ ] Celular sin cámara o permiso denegado → aparece el respaldo por teclado (nunca pantalla bloqueada).
- [ ] Pistola HID en el POS: leer un código con la pistola agrega el producto (Enter).
- [ ] Sin realtime disponible → el POS sigue funcionando con el buscador manual.
- [ ] Intentar unir un celular a un código **inventado** → rechazado.

### Decisiones pendientes (tuyas)
- **APK nativo:** la lectura **continua y sin conexión** en el APK necesita el plugin `@capacitor-mlkit/barcode-scanning` → instalar dependencia y **recompilar las APK** (requiere red). La v1 web funciona sin eso.
- **Seguridad del emparejamiento:** la v1 no autentica la unión; se mitiga porque la sala **solo existe mientras el panel del POS está abierto**. Si quieres seguridad fuerte, hay que ligar el emparejamiento al rol de tienda (ver §6, punto 1).

---

## 6. Fase 3 — Funciones nuevas (PENDIENTE)

Cada función con su estado actual verificado y las **pruebas** que debe pasar:

| # | Función | Estado actual | Prueba que debe pasar al implementarla |
|---|---|---|---|
| 1 | **Pedido recurrente** (lunes a viernes, hora y lugar) | No existe (el campo `programadoPara` está en el esquema pero sin uso) | Programar una compra para el martes 10:00 → se crea sola a esa hora, con el mismo carrito; se puede pausar/cancelar |
| 2 | **Pedido y retiro en punto** (pago en app + retiro + aviso de listo) | Parcial: la notificación existe pero **el modo retiro no** (toda compra crea reparto) | Comprar en modo retiro → **no** se crea envío con repartidor; la tienda marca "listo" y **el cliente recibe el aviso real**; retirar con código |
| 3 | **Devolución con reingreso de stock** | No existe | Devolver 2 unidades → el stock sube 2 y aparece el movimiento de Kardex; si quedó bajo el mínimo, salta la alerta |
| 4 | **5 compras/mes → recompensa** | Parcial (hay puntos e historial, no la regla) | 5 compras en el mes → se otorga el cupón automáticamente; el 6.º mes no arrastra el contador del anterior |
| 5 | **Estadísticas de tienda** (ventas, top productos, horas pico) | Parcial: solo exportación CSV | El portal muestra top 10 productos y gráfica por hora, cuadrando con la exportación CSV |
| 6 | **Cupones por tienda** | No existe (`CodigoPromocional` no tiene `tiendaId`) | La tienda crea su cupón y **solo aplica en sus productos**; el cupón global sigue funcionando |
| 7 | **Varios usuarios por tienda con roles** | No existe (`Tienda.propietarioId` es único) | Invitar a un cajero → entra con su cuenta, ve **solo** esa tienda y no puede cambiar precios si no tiene permiso |
| 8 | **Marketing interno** (banners pagados) | Parcial (`Banner` sin `tiendaId` ni precio) | Contratar un banner → se muestra en el inicio, cuenta impresiones y clics, y respeta la vigencia |
| 9 | **Alianzas y beneficios para repartidores** | No existe | Un comercio aliado aplica un beneficio al repartidor y queda registrado |
| 10 | **Rol de tienda real** (base de 1 y 7) | No existe: hoy el comerciante entra como `cliente` | El comerciante entra por su propio rol y **no** puede ver ni tocar datos de otras tiendas |

---

## 7. Fase 4 — Rediseño visual (PENDIENTE · causa raíz identificada)

**El problema no es el sistema de diseño, es una avería mecánica:** `tailwind.config.ts` declara los colores como `hsl(var(--primary))` pero `globals.css` los define en **HEX/rgba**, así que las clases del sistema generan CSS inválido y todo se escribe con estilos inline (**308** en el portal tienda y **659** en el flujo de compra), que **no admiten media queries** → por eso no hay responsividad real.

**Orden de trabajo:** arreglar la capa de tokens → migrar el layout a clases con breakpoints **pantalla por pantalla** (POS, Inventario, KDS, Kardex, Configuración, Reportes, y después el flujo de compra) → estados de carga/vacío/error → feedback al toque (0.15-0.22 s) → auditoría final de contraste y tamaños táctiles.

**Se conserva todo:** colores, tipografías (Syne / DM Sans / JetBrains Mono), radios, sombras y componentes existentes. Solo mejora la ejecución.

**Pruebas a ejecutar al terminar la Fase 4:**
- [ ] Las 7 pantallas de tienda en **celular (390 px), tablet (820 px) y escritorio (1440 px)** sin desbordes horizontales.
- [ ] Ningún elemento táctil por debajo de 44 px de alto.
- [ ] El conteo de estilos inline por archivo **baja** respecto a la línea base (medible con `grep -c 'style={{'`).
- [ ] Ninguna regresión funcional: repetir las pruebas de la Fase 1 (§4).
- [ ] Modo claro y oscuro correctos en las dos vistas.

---

## 8. Guía: verificar que la TIENDA se conecta con CLIENTE y REPARTIDOR

**Cadena completa:** Cliente compra → Tienda lo recibe y lo prepara → Repartidor lo toma y lo entrega → Cliente lo ve actualizado.

### 8.0 Arrancar el entorno

```bash
cd ~/linux/logifast
node_modules/.bin/next build
node_modules/.bin/next start -p 3000

# Microservicio realtime (para el escáner y los avisos en vivo).
# Su script usa `bun`, que NO está instalado aquí; con Node 26 debería arrancar igual:
cd ~/linux/logifast/mini-services/realtime-service && node index.ts
```
⚠️ La app apunta a un **realtime remoto** (`NEXT_PUBLIC_REALTIME_URL` en `.env`). Para probar el escáner en local, cámbiala temporalmente a `http://localhost:3003`.

### 8.1 Tokens de los tres roles

```bash
BASE=http://localhost:3000
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"email":"cliente@logifast.com","password":"123456"}'    # TOK_CLI
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"email":"repartidor@logifast.com","password":"123456"}' # TOK_REP
curl -s -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@logifast.com","password":"123456"}'      # TOK_ADM
```
La API acepta `Authorization: Bearer <token>`, así que **no hace falta navegador**.

### 8.2 (Opcional) Dar dueño a una tienda con pedidos

Las 6 tiendas huérfanas no pueden atenderse desde el portal. Para probar con pedidos reales:

```bash
cd ~/linux/logifast
# Asignar dueño (ejemplo: Floristería Rosas → María). Revertir con data:{propietarioId:null}
node --env-file=.env -e "const{PrismaClient}=require('/home/flashey/linux/logifast/node_modules/@prisma/client');const d=new PrismaClient();d.tienda.update({where:{id:'cmsnxon6l001mlzvc4gn3l4y6'},data:{propietarioId:'cmsnxmh2e0000lzvcu3d5s5v5'}}).then(r=>console.log('dueño asignado a',r.nombre)).finally(()=>process.exit(0))"
```

### 8.3 Las seis pruebas

**PRUEBA 1 — el cliente compra**
```bash
curl -s -X POST $BASE/api/ordenes-compra -H "Authorization: Bearer $TOK_CLI" -H 'Content-Type: application/json' \
 -d '{"tiendaId":"cmsnxugd80001la09tb68pxx1","items":[{"productoId":"cmtn2renj0001jw09ynu8xlfi","cantidad":3}],
      "direccionEntrega":"Col. Los Robles, Managua","lat":12.1245,"lng":-86.252,"metodoPago":"efectivo","codigoPromo":"LOGI20"}'
```
Esperado **200**: `subtotal 60` (3 × C$20), `costoEnvio 20` (el de la tienda), `descuento 12` (20 % de 60), **`total 68`**. Debe existir además una `OrdenServicio` con `tipo:'compra'` y el mismo `codigoPin`.

**PRUEBA 2 — la tienda lo recibe (KDS)**
```bash
curl -s $BASE/api/cliente/tienda/pedidos -H "Authorization: Bearer $TOK_CLI"
```
Esperado: el pedido aparece con `estado:"recibido"`. Si sale vacío → esa tienda no tiene dueño (§8.2).

**PRUEBA 3 — la tienda avanza el pedido** (esto era lo que daba 403)
```bash
curl -s -X PATCH $BASE/api/cliente/tienda/pedidos -H "Authorization: Bearer $TOK_CLI" -H 'Content-Type: application/json' -d "{\"id\":\"$ORDEN\",\"estado\":\"preparando\"}"
curl -s -X PATCH $BASE/api/cliente/tienda/pedidos -H "Authorization: Bearer $TOK_CLI" -H 'Content-Type: application/json' -d "{\"id\":\"$ORDEN\",\"estado\":\"listo\"}"
curl -s -X PATCH $BASE/api/cliente/tienda/pedidos -H "Authorization: Bearer $TOK_CLI" -H 'Content-Type: application/json' -d "{\"id\":\"$ORDEN\",\"estado\":\"en_camino\"}"
```
Esperado **200** en los tres. Un 400 `"Transición no válida"` significa que se saltó un paso.

**PRUEBA 4 — el repartidor lo ve, lo toma y lo entrega**
```bash
curl -s "$BASE/api/repartidor/ordenes?estado=activa" -H "Authorization: Bearer $TOK_REP"          # ¿aparece?
curl -s -X PATCH $BASE/api/repartidor/ordenes/$ORDEN/aceptar  -H "Authorization: Bearer $TOK_REP"
curl -s -X PATCH $BASE/api/repartidor/ordenes/$ORDEN/recoger  -H "Authorization: Bearer $TOK_REP"
curl -s $BASE/api/repartidor/ordenes-compra/$ORDEN/productos  -H "Authorization: Bearer $TOK_REP" # qué lleva
curl -s -X PATCH $BASE/api/repartidor/ordenes/$ORDEN/entregar -H "Authorization: Bearer $TOK_REP" \
  -H 'Content-Type: application/json' -d '{"codigoPin":"<PIN_DE_LA_PRUEBA_1>"}'
```
Esperado: cada paso 200 y la orden avanzando hasta `entregado`.

**PRUEBA 5 — el cliente lo ve (y sin duplicados)**
```bash
curl -s $BASE/api/ordenes -H "Authorization: Bearer $TOK_CLI"
```
Esperado: la compra aparece **una sola vez** (no como "envío en curso" duplicado) con el estado actualizado.

**PRUEBA 6 — dinero**
```bash
curl -s -X POST $BASE/api/codigos/validar -H "Authorization: Bearer $TOK_CLI" -H 'Content-Type: application/json' -d '{"codigo":"LOGI20","montoSubtotal":200,"tipoOrden":"marketplace"}'      # → descuento 40
curl -s -X POST $BASE/api/codigos/validar -H "Authorization: Bearer $TOK_CLI" -H 'Content-Type: application/json' -d '{"codigo":"LOGIFAST20","montoSubtotal":200,"tipoOrden":"marketplace"}'  # → 400
```
En pantalla: el envío mostrado debe ser el de la tienda (nunca 35), y con dos tiendas en el carrito debe verse el aviso y el botón deshabilitado.

### 8.4 Errores típicos y su significado

| Síntoma | Significado |
|---|---|
| KDS vacío aunque haya pedidos | Esa tienda no tiene `propietarioId` (6 de 8 están así) → §8.2 |
| 403 al mover un pedido | El pedido es de otra tienda (guarda de propiedad funcionando) |
| 400 "Transición no válida" | Te saltaste una etapa del flujo |
| 400 "Código promocional inválido o inactivo" | El código no existe en la base |
| 400 "Stock insuficiente para …" | El stock real es menor que lo pedido |
| El pedido no aparece al repartidor | Sigue en `recibido`/`preparando` sin repartidor, o ya tiene uno asignado |

---

## 9. ¿Es seguro subir los cambios? (lectura antes de `git push`)

**Sobre los cambios de código: sí, son seguros de subir.** No introducen credenciales nuevas, no cambian el esquema de la base, no añaden dependencias y pasan typecheck, lint y build. El esquema de Prisma **no se tocó**, así que no hay migraciones que aplicar en producción.

**Antes de subir, ten en cuenta:**
1. ⚠️ **`src/lib/upload/supabase-storage.ts:4` tiene un JWT hardcodeado** (clave anon de Supabase). **Ya está en el historial del repositorio** — o sea, ya está expuesto si el repositorio es público — pero eso se arregla **rotando la clave** (Fase 0), no borrando la línea. Rotar primero, subir después.
2. ⚠️ **Las 6 tiendas sin dueño** son un problema de **datos**, no de código: en la demo, esos comercios no pueden atender pedidos.
3. ⚠️ Si el repositorio es **público**, el push expone también el código del negocio y cualquier rastro previo; revisa la visibilidad en GitHub.
4. ✅ **La contraseña de la base NO está en el repositorio** (vive solo en `.env`, ignorado por Git). No añadas este `.md` a un repo público si algún día le pones secretos dentro.
5. ✅ `main` ya estaba 4 commits adelante de `origin/main` **antes** de este trabajo; subir publica esos 4 también.

---

## 10. Otras mejoras a futuro (fuera del alcance actual)

1. **Tests automatizados**: hoy no hay suite; añadir pruebas de los endpoints críticos (POS, compra, cupones) con una base de datos de prueba. Sin esto, cada cambio depende de revisión manual.
2. **Idempotencia en el botón de pagar**: un doble toque no debería crear dos órdenes (hoy se mitiga deshabilitando el botón).
3. **Validar `pedidoMinimo` en el servidor** (hoy solo lo bloquea la interfaz).
4. **Paginación y filtros en el Kardex** (entrega 100 movimientos en una tabla plana).
5. **Imágenes**: variantes (miniatura/detalle), `next/image` y borrado al reemplazar.
6. **Rate limiting real** en `/api/auth/*` (hoy hay uno "básico" en el middleware) y revisar el **respaldo del login que crea usuarios** con contraseña por defecto.
7. **Roles finos**: cajero, bodega, encargado — con permisos por acción.
8. **Observabilidad**: logs estructurados y métricas del embudo de compra (dónde abandona la gente).
9. **Backups y migrate**: el proyecto usa `prisma db push`; conviene pasar a migraciones versionadas antes de producción.
10. **Escáner v2**: plugin nativo (ML Kit) para lectura continua dentro de la APK, y lectura por lotes (varios productos de una pasada).
11. **Accesibilidad**: contraste, foco visible, etiquetas ARIA y navegación por teclado (hoy no auditado).
12. **PWA offline para el escáner**: que la lectura funcione sin señal y sincronice después.

---

## 11. Cómo retomar

```bash
cd ~/linux/logifast
git log --oneline -10      # ver los commits de la Fase 1
git status                 # árbol limpio esperado
```
- Fase 0 → rotar credenciales y enchufar la compresión (1-2 días).
- Fase 2 → implementar el escáner con el contrato de §5 (3-4 días).
- Fase 3 → funciones nuevas (1 semana).
- Fase 4 → rediseño visual (1-1.5 semanas).
