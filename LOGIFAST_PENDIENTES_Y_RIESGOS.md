# LogiFast — Qué falta y riesgos de subir a producción

**Fecha:** 17 de septiembre de 2026 · **Rama:** `main` · **HEAD local:** `a6d35c7`
**Base de datos:** el esquema ya está aplicado en el Supabase real (no hay migraciones pendientes).

---

## 0. Estado en 30 segundos

| Fase | Estado |
|---|---|
| Fase 0 — cimientos (storage/credenciales) | **Parcial**: la optimización de imágenes y la limpieza de storage están hechas; **la rotación de credenciales sigue pendiente y solo la puede hacer el dueño** |
| Fase 1 — reparaciones críticas | **Terminada** (previa a esta sesión) |
| Fase 2 — escáner de códigos de barras | **Terminada y verificada** (15/15 casos de protocolo) |
| Fase 3 — funciones nuevas | **Terminada: 10 de 10**, verificadas contra la base real |
| Fase 4 — rediseño visual | **Parcial**: causa raíz arreglada y portal medido; falta el grueso del flujo de compra |

**8 commits locales sin subir** (`a7dd707`, `c16684f`, `68952ab`, `b7b0afc`, `e54340e`, `8e5deb4`, `4f61b6e`, `a6d35c7`).

---

## 1. Fase 3 — las 10 funciones y con qué se probó cada una

1. **#1 Pedido recurrente** — motor con precio del día y descuento de stock, API del cliente (programar / pausar / reanudar / cancelar) y cron cada 5 min desde el microservicio realtime. *Verificado:* se programó "lunes a viernes 10:00", se forzó el vencimiento y el cron creó la orden (2× Frescl, C$40, PIN), bajó el stock 10→8 y reprogramó el viernes.
2. **#2 Retiro en punto** — el checkout acepta `modoEntrega=retiro`: envío C$0, **no** crea `OrdenServicio` ni publica oferta a repartidores, la dirección pasa a "Retiro en tienda" y el PIN sirve para retirar. *Verificado* end-to-end, incluido el control de que reparto sin dirección da 400.
3. **#3 Devolución con reingreso de stock** — sube stock, crea Kardex `DEVOLUCION` y registra el reembolso como venta negativa. *Verificado* con stock 10→12 y reversión completa.
4. **#4 Recompensa por 5 compras** — cupón `RECOMPENSA-AAAA-MM` (10%), idempotente por clave única; cada mes estrena código. *Verificado*, incluida la segunda llamada que no duplica.
5. **#5 Estadísticas / dashboard** — panel con comparación contra el período anterior, 4 gráficas, top 10 y stock bajo, más descarga Excel/PDF.
6. **#6 Cupones por tienda** — el motor único rechaza un cupón de otra tienda, tanto en la vista previa como en el cobro. *Verificado* con dos tiendas.
7. **#7 Varios usuarios por tienda** — `resolverAccesoTienda`, 10 rutas del portal migradas, API de equipo y puerta de precios. *Verificado* con un invitado real: ve su tienda y recibe 403 al cambiar precios.
8. **#8 Pauta contratada** — banner con `tiendaId`, tarifa y vigencia. *Verificado:* sale por el sistema de banners del inicio.
9. **#9 Alianzas con repartidores** — la tienda publica, el repartidor canjea y queda registro; no hay canje doble. *Verificado* (segundo intento → 409).
10. **#10 Rol de tienda real** — el acceso por roles cubre dueño e invitados; cada uno ve **solo** su tienda.

---

## 2. Lo que falta (con su criterio de prueba)

### 2.1 Fase 4 — flujo de compra del cliente (lo más grande)
Migrar los estilos inline a clases con breakpoints, **pantalla por pantalla**. Línea base medida hoy:

- `ClientTienda.tsx` **243**, `ClientPerfil.tsx` **228**, `ClientSolicitar.tsx` **227**, `ClientTracking.tsx` **145**, `ClientPedidos.tsx` **118**, `ClientInicio.tsx` **113**.

**Prueba:** medir con `node scripts/auditoria-responsive.mjs` a 390 / 820 / 1440 px → 0 desbordes, 0 recortes, 0 objetivos táctiles < 44 px, y que el conteo de `style={{` **baje** por archivo.

### 2.2 Fase 4 — verificación visual pendiente
- Medido: portal de tienda (8 módulos a 3 anchos) y app del cliente (390 px), en claro y **oscuro**.
- **Sin medir:** dashboard admin, app del repartidor y landing. Y las tarjetas nuevas del portal (cupones, equipo, alianzas, pauta) y el panel nuevo con datos: se compilaron y se probaron por API, pero **no se midieron en navegador**.

### 2.3 Regresión de Fase 1
No se repitieron las seis pruebas de §8.3 del documento de fases (cliente compra → tienda recibe → avanza → repartidor entrega → cliente ve → dinero). **Prueba:** ejecutarlas con los tres roles.

### 2.4 Dependencias externas
- **Rotar la clave anon de Supabase y la contraseña de la base** (esa quedó escrita en el chat). La clave sigue en el historial de git; el código ya no la contiene.
- `git push origin main` (8 commits).
- Netlify desplegará al hacer push; no hay migraciones que correr porque el esquema ya está aplicado.

### 2.5 Mejoras menores
- Aviso al cliente cuando la tienda marca "listo" un pedido de retiro: el estado y el PIN funcionan; conviene probar el aviso en el flujo real.
- El invitado entra hoy por "Mi Tienda"; falta una entrada propia del rol tienda si se quiere login directo al portal.

---

## 3. ¿Es seguro subir a producción?

**Técnicamente sí.** Lo que respalda esa respuesta:

- `npm run build` (producción) → **exit 0**, sin errores. Todas las rutas nuevas compilan, incluida `/escaner` y `/api/tienda/reportes/{xlsx,pdf}`.
- `exceljs` y `pdfkit` **no entran al bundle del cliente** (solo se usan en rutas de servidor): el usuario no descarga peso extra.
- El **esquema ya está aplicado** en la base real: el código y la base están sincronizados; todo lo nuevo es aditivo (ninguna columna ni tabla se borró).
- `tsc` sin errores; árbol de trabajo limpio.
- Los literales de claves que había hardcodeados ya no están en el código.

**Riesgos que quedan (y que conviene aceptar a sabiendas):**

1. **El arreglo de la capa de tokens cambia colores en toda la app.** Antes, las clases del sistema generaban CSS inválido y no pintaban nada; ahora sí. Eso significa que pantallas que **no** se re-midieron (dashboard admin, repartidor, landing) pueden verse distintas.
2. **Las tarjetas nuevas del portal y el panel con datos no se midieron en navegador** (solo se probaron por API y compilaron). Siguen los mismos patrones ya medidos, pero "mismo patrón" no es "medido".
3. **La rotación de credenciales está pendiente.** Subir no agrava la exposición (la clave ya estaba en el historial), pero rotarla sigue siendo lo urgente.
4. Las funciones nuevas de Fase 3 se probaron por API contra la base real; **los clics de sus pantallas no**.

**Recomendación:** subir es razonable; si quieres riesgo mínimo, hazlo en dos pasos — (a) push y mirar el deploy con las pantallas sin medir (admin, repartidor, landing), y (b) rotar credenciales después. Y si prefieres cero sorpresas visuales, antes de subir conviene una pasada de medición sobre esas tres pantallas.

---

## 4. Herramientas que quedaron para verificar

- `scripts/auditoria-responsive.mjs` — mide desbordes, recortes, objetivos táctiles y colores computados a 390/820/1440 con el Chromium que ya está en la caché de Playwright (sin dependencias).
- `scripts/auditoria-paso-modulos-tienda.js` — recorre los 8 módulos del portal y reporta cada uno.
- `scripts/auditoria-paso-modo-oscuro.js` — cambia el tema con el botón real de la app y vuelve a medir.
- `scripts/verificar-reportes.mjs` — abre el XLSX generado con ExcelJS y comprueba hojas, celdas, totales e imágenes incrustadas.
- `mini-services/realtime-service/test-escaner.mjs` — 15 casos del escáner (PIN, emparejamiento, relé de códigos, allowlist).
