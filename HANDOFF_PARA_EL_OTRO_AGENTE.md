# Handoff — LogiFast (portal de tienda, escáner y reportes) — 17 sep 2026

- **State:** sesión cerrada. El **sistema visual del portal está terminado y medido**; falta la
  **estructura interna módulo por módulo**. Hay **2 commits locales sin subir**.
- **Repo:** `~/linux/logifast` · rama `main` · HEAD `707a32f` · árbol limpio.
- **Sin subir (origin ya avanzó por otro agente/el usuario):** `9d61c4e`, `707a32f`.

## Landed / committed

Diseño y responsive:
- `c16684f` — arreglo de la capa de tokens de Tailwind (`hsl(#HEX)` inválido → tripletes `--x-hsl`).
- `68952ab` — portal sin recortes ni objetivos táctiles chicos (rejillas con breakpoints).
- `8e5deb4` — flujo de compra del cliente: 44 px y rejillas que no se recortan.
- `fa49756` — mínimo táctil de 44 px **en el CSS** de las raíces de las apps (cliente, repartidor, navs del dashboard).
- `54346b8` / `30ef29c` / `ed26153` / `6589b7b` — capa de diseño del portal: superficies, tablas, campos, botones, movimiento, modo oscuro y **tokens del sistema** (`--radius`, `--md-elevation-*`, `--ring-hsl`).
- `9d61c4e` — 21 colores a mano → `var(--primario|--exito|--peligro)`; "Compras programadas" vuelve a Pedidos.
- `707a32f` — el panel de Estadísticas (único módulo con estilos inline, 47) reescrito con Tailwind + tokens → queda 1 inline (color de la leyenda de la dona, inevitable en recharts).

Funciones nuevas (Fase 3, 10/10 verificadas contra la base real): `a7dd707`, `4f61b6e`, `a6d35c7`
— escáner, devoluciones, estadísticas, retiro en punto, recompensa 5 compras, cupones por tienda,
equipo con roles, alianzas con repartidores y pauta contratada. **Esquema ya aplicado** en la base
(4 tablas nuevas + columnas), todo aditivo.

## Decisions made (no re-litigar)

1. **Rediseño por capa CSS, no reescribiendo 1.000 estilos inline.** Resultado: los 8 módulos del
   portal y las 6 pantallas del cliente miden 0 desbordes, 0 recortes y 0 objetivos < 44 px.
2. **Todos los módulos del portal ya son Tailwind + tokens** (POS 149 clases, Inventario 113,
   Kardex 96, KDS 48…). Lo que falta NO es el lenguaje visual: es la **estructura interna**.
3. **Cámara del celular = contexto seguro.** `getUserMedia` no funciona en `http://IP-de-LAN`.
   Por eso escanear no va y escribir el código sí. Salidas: HTTPS en local
   (`next dev --experimental-https`), la URL publicada (Netlify ya es HTTPS) o el APK con ML Kit.
   iPhone además no trae `BarcodeDetector`: necesita un decodificador JS (jsQR/zxing).
4. **No tocar el chrome del portal** (`TiendaNavbar`, header): es la línea del otro agente. Lo mío
   está acotado a `.lf-tienda-contenido` (módulos) y `.lf-ios-*` (cliente/repartidor). Único archivo
   compartido que toqué: la clase del contenedor en `TiendaApp.tsx`.

## Next step

**Estructura interna de POS e Inventario** (tarjetas del catálogo, panel de cobro con jerarquía del
total, tabla con acciones y estado de stock). Después KDS, Kardex, Métricas, Reportes y Configuración.

## Pendientes que no son código

- **Rotar credenciales** (clave anon de Supabase y la contraseña de la base; solo el dueño).
- **Pruebas de Fase 1** (las seis de §8.3 del doc de fases) sin repetir.
- La regresión de diseño se mide con los scripts de abajo.

## Cómo verificar (recetas exactas)

- `node scripts/auditoria-responsive.mjs --url <url> --out /tmp/x --anchuras 390,820,1440 --cookie "lf-session=<jwt>" [--eval-file <paso>]`
  Mide desbordes, elementos recortados, objetivos < 44 px y colores computados. Usa el Chromium de
  la caché de Playwright, **sin dependencias**. Para loguearse:
  `curl -c /tmp/jar -H 'Content-Type: application/json' -d '{"email":"cliente@logifast.com","password":"123456"}' <url>/api/auth/login`.
- Pasos listos: `auditoria-paso-cliente.js` (6 pantallas del cliente), `auditoria-paso-modulos-tienda.js`
  (los 8 módulos del portal), `auditoria-paso-modo-oscuro.js`.
- **Para medir el portal hace falta una ruta temporal** (`src/app/app/tienda-audit/page.tsx`, ~40 líneas,
  monta `<TiendaApp>`); se borra al terminar. **El otro agente la borra**: créala, mide y elimínala en
  la misma pasada. Ojo: el paso de módulos navega por los botones del `aside` y **debe saltarse "Salir"**
  (navega a `/api/auth/logout` y el CDP responde "target navigated or closed").
- `node scripts/verificar-reportes.mjs <archivo.xlsx>` lee el XLSX de vuelta con ExcelJS y comprueba
  hojas, celdas, totales e imágenes incrustadas. Los PDF se validan con `pdftotext` (poppler).
- `node mini-services/realtime-service/test-escaner.mjs` — 15 casos del escáner (servicio en `PORT=3999`).

## Trampas ya pagadas (no repetirlas)

- **Campos numéricos**: `onChange={(e) => setX(Math.max(1, Number(e.target.value)))}` impide borrar
  (el valor vuelve solo). Arreglado en 5 archivos: permitir vacío mientras se escribe y reajustar en
  `onBlur`. No reintroducir ese patrón.
- El correo del perfil del cliente estaba **escrito a mano** (`cliente@logifast.com`) y el botón
  Editar sobreescribía teléfono/dirección con los del demo — arreglado en `ccc0522`.
- El registro sí crea sesión en el servidor; la app mostraba el perfil demo por estado en memoria
  (arreglado con recarga tras registrar, `e55a415`).
- `exceljs` y `pdfkit` están instalados y son **solo de servidor**: no deben entrar al bundle del cliente.
- Los conteos de "estilos inline" se comparan con `grep -c 'style={{'`.

## Continuation records

- Documento humano con el detalle: `LOGIFAST_PENDIENTES_Y_RIESGOS.md` (repo, raíz).
- Base de datos dejada como estaba: los datos de prueba que creé (ventas, devoluciones, pedidos
  recurrentes, alianzas, miembros de tienda) **se borraron y se verificó el estado base**.
