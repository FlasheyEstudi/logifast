# Diseño del portal de tienda — CONTRATO

Leer junto con `DESIGN_SYSTEM_AUDIT.md`. Esto no es una guía de estilo: es un contrato.
**Si algo no está en esta lista, no existe.** No se inventan colores, componentes, iconos ni tamaños.

El barrido de tokens **ya está hecho** (`cde759b`): los 15 módulos no tienen ni una clase de paleta
cruda. Este contrato es para la **estructura interna**: jerarquía, densidad, estados y acciones.
No reintroducir nada de lo que dice "prohibido".

---

## 1. Color — siempre tokens

- Superficies: `bg-[var(--surface)]`, `bg-[var(--bg)]`, `bg-[var(--bg-alt)]`, `bg-[var(--surface-elevated)]`
- Texto: `text-[var(--text)]`, `text-[var(--text-secondary)]`, `text-[var(--text-muted)]`
- Marca: `text-[var(--primario)]`, `bg-[var(--primario)]`, `border-[var(--primario)]`
- Estados: `--exito` (bien) · `--warning` (atención) · `--peligro` (error) · `--info` (informativo)
- Tinte decorativo alterno (no hay más): `--md-tertiary`
- Bordes: `border-[var(--border)]` · Foco: `focus-visible:ring-2 focus-visible:ring-[var(--primario)]`

**Prohibido:** `bg-emerald-*`, `text-slate-*`, `bg-white`, `text-black`, cualquier `#RRGGBB`,
y **toda variante `dark:`** (los tokens ya cambian solos con `[data-theme="dark"]`).
Para atenuar, usar `--text-muted`; **nunca** `opacity-*` sobre texto.

## 2. Geometría

- Tarjetas y paneles: `rounded-[var(--lf-card-radius)]` (14px)
- Campos y controles chicos: `rounded-[var(--lf-input-radius)]` (10px)
- Botones: `rounded-full` (cápsula) o `rounded-[var(--lf-button-radius)]` (14px)
- Modales y hojas: `rounded-[var(--lf-sheet-radius)]` (20px)
- Píldoras y avatares: `rounded-full`

**Prohibido:** `rounded-3xl`, `rounded-2xl`, `rounded-md`, `rounded-lg` en contenedores.
`rounded-xl` (12px) solo para elementos internos chicos (miniaturas, chips).

## 3. Sombras

- Reposo: `shadow-[var(--lf-shadow-card)]`
- Elevado / hover / flotante: `shadow-[var(--lf-shadow-float)]`
- Modal: `shadow-[var(--lf-shadow-sheet)]`

**Prohibido:** `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-xs`.

## 4. Tipografía — 5 pasos, no más

- Micro-etiqueta: `text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]`
- Cuerpo chico: `text-xs`
- Cuerpo: `text-sm`
- Título de sección / de tarjeta: `text-base font-semibold`
- Cifra destacada: `text-lg` o `text-xl font-bold`; el total de una venta: `text-2xl font-black`

Números y códigos: `font-mono`. Títulos de marca: `font-syne` (ya existe en `globals.css`).
**Prohibido:** `text-[9px]`, `text-[10px]`, `text-[13.5px]` y cualquier tamaño inventado.

## 5. Espaciado y controles

- Tarjeta: `p-4` en móvil, `p-5` en escritorio (`sm:p-5`)
- Separación entre tarjetas: `gap-3` / `gap-3.5` / `gap-4`
- Controles táctiles: altura mínima `h-11` (44px) en móvil; `h-10` aceptable en escritorio
- Una sola columna en móvil; rejillas con `sm:` / `md:` / `xl:` — nunca una rejilla fija que recorte

## 6. Componentes permitidos (solo los que ya existen en `src/components/ui/`)

`Card` + `CardContent` / `CardHeader` / `CardTitle`, `Badge`, `Button`, `Input`, `Textarea`,
`Table` (+ subcomponentes), `Tabs`, `Dialog`, `Select`, `Label`, `Progress`, `Separator`,
`ImageUploader`, `Skeleton` / `Skeletons`, `EmptyState`, `ErrorState`, `SettingRow`.

Iconos: **solo** los que ya importa el archivo desde `lucide-react`.

**Prohibido:** crear componentes, añadir dependencias, SVG a mano, emojis como iconos.

## 7. Jerarquía — lo que hay que arreglar en cada módulo

1. **Encabezado del módulo**: título + una sola acción primaria.
2. **Una acción primaria visible por pantalla.** El resto: `variant="outline"` o `variant="ghost"`.
3. **Cifras**: la más importante manda (tamaño, peso y color). Las secundarias no compiten con ella.
   Un KPI = etiqueta micro + cifra + (opcional) delta. Nada más.
4. **Estados**: siempre `Badge` del sistema. Nunca texto de color suelto sin contexto.
5. **Vacíos**: `EmptyState` o el patrón `Package`/icono + texto muted. Nunca un hueco en blanco.
6. **Tablas**: `Table` del kit. Encabezado micro-etiqueta; filas con `border-b border-[var(--border)]`;
   hover `hover:bg-[var(--bg-alt)]`; acciones a la derecha y con `size="sm"`.
7. **Barra de totales / resumen**: separada del cuerpo con `border-t border-[var(--border)]`,
   `bg-[var(--bg-alt)]`, y el total a la derecha y más grande que sus componentes.

## 8. Prohibido explícitamente

- Añadir dependencias nuevas.
- Crear componentes nuevos.
- **Tocar la lógica**: `fetch`, handlers, estado, nombres de props, tipos.
- Cambiar textos visibles (salvo que estén rotos o mal escritos).
- Tocar `globals.css`.
- Reintroducir clases de paleta cruda o variantes `dark:`.

## 9. Verificación obligatoria al terminar

1. `npx tsc --noEmit` → sin errores.
2. `grep -cE '(bg|text|border|ring|shadow)-(slate|gray|zinc|neutral|stone|emerald|green|red|rose|amber|yellow|blue|sky|indigo|purple|violet|cyan|teal|orange)-[0-9]' <archivo>` → **0**
3. `grep -c 'dark:' <archivo>` → **0**
4. Reportar: qué cambió en la jerarquía de cada módulo, en 3-5 líneas.
