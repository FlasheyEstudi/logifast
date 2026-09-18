# AUDITORÍA DEL DESIGN SYSTEM — LogiFast

**Fecha:** 18 sep 2026 · **Repo:** `~/linux/logifast` · **HEAD:** `2580e1c` · **Árbol:** limpio
**Alcance:** por qué el portal de tienda no se parece al resto de la app, medido, no opinado.

---

## 0. Aviso previo: el prompt que pidió esta auditoría describe OTRO proyecto

Las rutas y los componentes que manda a escanear no existen en este repo. Verificado:

| Lo que pide el prompt | Realidad en `~/linux/logifast` |
|---|---|
| `src/app/pages/cliente/` `repartidor/` `admin/` | **No existe.** Hay `src/components/{client,repartidor,dashboard,ingeniero}/` |
| `src/app/pages/portal-tienda/` | **No existe.** El portal es `src/components/tienda/` (15 archivos) |
| `src/app/shared/` | **No existe** |
| `src/theme/variables.scss` | **No existe.** Los tokens viven en `src/app/globals.css` (16.401 líneas) |
| `src/global.scss` | **No existe.** Es `src/app/globals.css` |
| `app-button`, `app-table`, `app-badge` | **No existen.** El kit es `src/components/ui/*` (shadcn + Radix) |
| `tailwind.config.js` | Es `.ts`… **y está inerte** (ver §3.2) |
| Stack implícito: Angular + Ionic | **Es Next.js 16 + React 19 + Tailwind 4 + shadcn** |

**Consecuencia:** las cinco órdenes de "BORRA X y usa Y" no se pueden ejecutar literalmente. Dos de
ellas apuntan a componentes que ya se están usando (§5) y una apunta a algo que no existe
("VENTA POSP": 0 coincidencias en todo `src/`).

**Pero el diagnóstico de fondo es correcto:** la tienda se construyó aparte y se ve distinta.
Abajo está *por qué*, con números.

---

## 1. Dónde vive el sistema de diseño real

Son **tres capas**, y ninguna es un SCSS de Ionic:

1. **Tokens** — `src/app/globals.css`
   - Color: `--bg #F2F2F7`, `--surface #FFFFFF`, `--text #1C1C1E`, `--text-secondary`, `--text-muted`,
     `--primario **#007AFF**`, `--primario-hover`, `--exito #34C759`, `--warning #FF9500`,
     `--peligro #FF3B30`, `--border`
   - Material You: `--md-primary #0764E2`, `--md-elevation-1…5`
   - **Geometría declarada:** `--lf-card-radius **14px**`, `--lf-button-radius 14px`,
     `--lf-input-radius 10px`, `--lf-pill-radius 100px`, `--lf-sheet-radius 20px`, `--radius 0.75rem` (12px)
   - Sombras: `--lf-shadow-card 0 2px 12px rgba(0,0,0,.06)`, `--lf-shadow-float`, `--lf-shadow-sheet`
2. **Kit de componentes** — `src/components/ui/*` (shadcn + Radix):
   `button, card, badge, input, table, tabs, dialog, select, textarea, ImageUploader, …`
3. **Capa móvil `lf-*`** — 1.413 reglas en `globals.css` (`.lf-ios-*`, `.lf-shadow-card`,
   `.lf-card-radius`, `.lf-client-*`). Es la que usan cliente y repartidor.

---

## 2. Quién usa qué (medido sobre los `.tsx` de cada superficie)

| Métrica | **tienda** | client | dashboard | repartidor | ingeniero |
|---|---:|---:|---:|---:|---:|
| archivos | 15 | 18 | 17 | 12 | 10 |
| imports al kit `ui/` | 57 | 16 | 32 | 12 | 12 |
| **clases de paleta cruda** (slate/emerald/red…) | **726** | 3 | 1 | 3 | 0 |
| clases con token `bg-[var(--…)]` | 602 | 1 | 1 | 0 | 0 |
| **`dark:`** | **262** (14/15 archivos) | 5 | 1 | 1 | 0 |
| `rounded-3xl` (24px) | **65** | 1 | 0 | 0 | 0 |
| `rounded-2xl` (16px) | **115** | 1 | 0 | 2 | 0 |
| `shadow-2xl` | **11** | 0 | 0 | 0 | 0 |
| `text-[Npx]` arbitrario | **115** | 0 | 0 | 4 | 0 |
| `style={{` inline | 21 | 1.545 | 1.996 | 749 | 517 |
| hex literal a mano | 20 | 392 | 393 | 220 | 499 |
| `var(--token)` | 608 | 1.342 | 1.685 | 707 | 325 |

**Lectura:** la tienda NO es la que ignora los componentes (usa 8 del kit). Es la única que **inventó
un lenguaje de color y de geometría propio**. El resto de la app usa *casi cero* paleta cruda:
3 + 1 + 3 + 0 = **7 usos en total** contra **726** en la tienda.

---

## 3. Las cinco divergencias, con evidencia

### 3.1 El acento de la tienda es VIOLETA, no el azul del sistema
La tienda usa `text-primary` (54×) y `bg-primary` (38×). Esas clases no vienen del sistema: las
genera **flyonui**, y su `primary` es `--color-primary: oklch(57.59% 0.247 287.24)` → **violeta**
(matiz 287). Verificado en el CSS compilado con el pipeline del propio proyecto:

```
.text-primary { color: var(--color-primary); }
--color-primary: oklch(57.59% 0.247 287.24)   ← violeta flyonui
--primario: #007AFF                            ← azul del sistema (no se usa aquí)
--md-primary: #0764E2                          ← azul Material (no se usa aquí)
```

Ninguna otra superficie usa `bg-primary` (0 en client, dashboard, repartidor, ingeniero).
**Efecto visible:** todo botón/precio/estado "principal" de la tienda sale violeta mientras el resto
de la app es azul Apple. Es el "no pega" más grande, y no es cuestión de gusto: es un color ajeno.

### 3.2 El modo oscuro de la tienda depende del sistema operativo, no del toggle de la app
`tailwind.config.ts` declara `darkMode: "class"`, pero **Tailwind 4 no lo lee**: haría falta un
`@config` en el CSS y no está. Tampoco hay `@custom-variant dark`, ni `@theme`. Medido compilando
`globals.css` con `@tailwindcss/postcss` (misma versión del proyecto):

```
@media (prefers-color-scheme: dark)   → 49 bloques generados
:is(.dark   (variante por clase)      → 0
```

La app cambia de tema por **clase** (`.dark` / `html.dark`, `next-themes`), así que:

- SO en claro + app en oscuro → los 262 `dark:` de la tienda **no se activan**:
  quedan bordes `slate-200/70` y fondos `emerald-500/10` claros sobre superficies oscuras.
- SO en oscuro + app en claro → al revés.

Es la **única** superficie de la app con este patrón (262 usos vs 7 en todas las demás juntas).
**Es un bug de verdad**, no una preferencia.

### 3.3 Geometría inventada
El sistema declara card = **14px** (`--lf-card-radius`) y la card del cliente mide **16px**.
La tienda usa `rounded-3xl` = **24px** (65 veces), `rounded-2xl` (115), `shadow-2xl` (11),
`shadow-xs` (112). El resto de la app: **0** `rounded-3xl` y **0** `shadow-2xl` en las cuatro
superficies. Es decir: el "rediseño moderno" de los últimos 10 commits introdujo una escala que
**no existe en el sistema**.

### 3.4 Paleta cruda y tipografía a mano
726 clases de paleta (`bg-emerald-500/10 text-emerald-600`, `border-slate-200/70`, `bg-red-500`…)
+ 115 tamaños `text-[10px]` / `text-[11px]` escritos a mano (0 en todo el resto).
Resultado: hay más de un "verde OK", más de un gris de borde y más de un rojo de error dentro del
mismo portal.

### 3.5 Las cards de producto sí son feas — y son las "CO / PA / AG"
`src/components/tienda/TiendaPOS.tsx:773`:

```tsx
{p.imagenUrl || p.portadaUrl ? (
  <img … />
) : (
  <div className="… font-syne">{p.nombre.slice(0, 2).toUpperCase()}</div>
)}
```

Cuando el producto no tiene foto, la card muestra **las dos primeras letras del nombre** como si
fuera un avatar. De ahí salen "CO", "PA", "AG". No hay imagen de respaldo: se inventó un avatar de
texto. En Inventario el fallback es un icono `Package` (mejor, pero distinto entre módulos).

---

## 4. La referencia buena, en valores exactos

La card de producto del cliente (`src/components/client/ClientTienda.tsx`, ~línea 1176) **no es un
componente del kit**: es un `div` con estilos inline. Sus valores son el "diseño bonito" que hay que
replicar:

```
border-radius : 16
border        : 1px solid var(--border)
background    : var(--surface)
box-shadow    : 0 2px 8px rgba(0,0,0,0.03)     ← casi imperceptible
títulos       : Syne 700
precios       : JetBrains Mono
grises        : var(--text) / var(--text-muted)
layout        : fila, gap 14, padding 14
```

**Ojo:** lo replicable son **los valores**, no el archivo. El cliente tiene 1.545 estilos inline y
392 hex a mano; copiarlo tal cual sería importar la deuda, no el diseño.

---

## 5. Lo que el prompt pedía vs. lo que ya existe

1. "Borra las cards feas (CO/PA/AG) y usa la card del cliente" → **válido** (§3.5). La card objetivo
   se replica con tokens, no copiando el archivo.
2. "Borra los globos de Publicado / VENTA POSP y usa `app-badge`" → el `Badge` del kit **ya se usa**
   (11 imports). El problema no es el componente: son sus clases con paleta cruda y `dark:` (§3.4).
   "VENTA POSP" no existe en el repo.
3. "Borra las cajas rosadas de Subir Banner / Logotipo y usa el uploader del admin" → **ya se usa el
   componente global**: `ImageUploader` (2 imports en `TiendaConfiguracion.tsx`). Es el único
   componente del kit que la tienda usa y el cliente no.
4. "Todo debe ser `app-button` / `app-table` / `app-input`" → **ya lo son** (Button 14, Table 3,
   Input 10, Textarea 2, Card 14 imports). Lo que sobra son las clases, no los componentes.
5. "Layout full-bleed `w-full h-[100dvh]` + header `sticky top-0`" → el chrome del portal
   (`TiendaNavbar` + header) es de **otro agente**; no se toca sin acordarlo.

---

## 6. Plan de corrección propuesto (barridos, no reescrituras)

**Barrido 1 — bugs (sin discusión de gusto)**
- `text-primary` / `bg-primary` / `border-primary` / `shadow-primary` → `var(--primario)` o los
  tokens del sistema. 92 usos.
- `dark:` → tokens que ya cambian solos con la clase `.dark`. 262 usos en 14 archivos.
- Paleta cruda → `--exito` / `--peligro` / `--warning` / `--border` / `--text-muted`. 726 usos.

**Barrido 2 — geometría**
- `rounded-3xl` (24px) y `rounded-2xl` (16px) → radio del sistema (`--lf-card-radius` 14px para
  tarjetas, `--lf-pill-radius` para píldoras). 180 usos.
- `shadow-2xl` / `shadow-xs` / `shadow-md` → `--lf-shadow-card` / `--md-elevation-*`. 167 usos.

**Barrido 3 — estructura**
- POS: card de producto con imagen real, fallback único (`Package`), jerarquía nombre/precio/stock.
- Inventario: tabla con acciones y estado de stock.
- Después: KDS, Kardex, Estadísticas, Reportes, Configuración.

---

## 7. Cómo se verifica (no "se ve bien", sino medido)

1. Compilar CSS y exigir **0** bloques `@media (prefers-color-scheme: dark)` para clases de la app.
2. Contar por superficie: paleta cruda, `rounded-3xl`, `text-[Npx]`, `dark:` → la tienda debe quedar
   en el mismo orden de magnitud que dashboard/repartidor.
3. Auditoría de UI con `scripts/auditoria-responsive.mjs` (desbordes, recortes, objetivos < 44 px,
   colores computados) — receta del handoff.
4. Prueba de modo oscuro: `auditoria-paso-modo-oscuro.js` con el toggle de la app, no del SO.
