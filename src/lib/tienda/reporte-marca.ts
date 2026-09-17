import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Marca de la tienda para los reportes (XLSX y PDF).
 *
 * Si la tienda subió un logo (`imagenUrl`) se usa ese; si no, LogiFast **genera** uno
 * con el color de marca y las iniciales que ya usa el portal (`logoColor`,
 * `logoIniciales`). En ambos casos sale un PNG cuadrado listo para incrustar.
 */

export interface MarcaTienda {
  nombre: string;
  iniciales: string;
  color: string;
  colorTexto: string;
  ruc: string;
  direccion: string;
  telefono: string;
  /** PNG de 256×256 listo para incrustar en los reportes. */
  logoPng: Buffer;
  logoEsGenerado: boolean;
}

const TAM_LOGO = 256;

function normalizarColor(hex?: string | null): string {
  const v = (hex || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : '#FF5722';
}

/** Mezcla el color con blanco: fondos suaves y bordes del reporte. */
export function aclararColor(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mezclar = (c: number) => Math.round(c + (255 - c) * factor);
  const r = mezclar((n >> 16) & 255);
  const g = mezclar((n >> 8) & 255);
  const b = mezclar(n & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** Iniciales razonables si la tienda no las tiene definidas. */
function inicialesDe(nombre: string, declaradas?: string | null): string {
  const limpias = (declaradas || '').trim();
  if (limpias) return limpias.slice(0, 3).toUpperCase();
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

/** Logo generado por LogiFast: cuadro redondeado con el color y las iniciales de la tienda. */
async function generarLogo(iniciales: string, color: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TAM_LOGO}" height="${TAM_LOGO}" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${aclararColor(color, 0.22)}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="58" ry="58" fill="url(#g)"/>
  <text x="128" y="128" font-family="DejaVu Sans, Verdana, Helvetica, sans-serif" font-size="104"
        font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">${iniciales}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Lee el logo subido: archivo local (`/uploads/...`) o URL remota. Devuelve null si no se puede. */
async function leerLogoSubido(imagenUrl: string): Promise<Buffer | null> {
  try {
    let crudo: Buffer;
    if (/^https?:\/\//i.test(imagenUrl)) {
      const res = await fetch(imagenUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      crudo = Buffer.from(await res.arrayBuffer());
    } else if (imagenUrl.startsWith('/')) {
      // Ruta pública servida por la app (fallback local de subidas).
      const ruta = path.join(process.cwd(), 'public', imagenUrl.replace(/^\//, ''));
      crudo = await fs.readFile(ruta);
    } else {
      return null;
    }
    // Normaliza a PNG cuadrado con fondo transparente: los reportes siempre reciben lo mismo.
    return await sharp(crudo)
      .resize(TAM_LOGO, TAM_LOGO, { fit: 'cover' })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

export async function obtenerMarcaTienda(tienda: {
  nombre: string;
  logoColor?: string | null;
  logoIniciales?: string | null;
  imagenUrl?: string | null;
  ruc?: string | null;
  direccion?: string | null;
  telefono?: string | null;
}): Promise<MarcaTienda> {
  const color = normalizarColor(tienda.logoColor);
  const iniciales = inicialesDe(tienda.nombre, tienda.logoIniciales);

  const subido = tienda.imagenUrl ? await leerLogoSubido(tienda.imagenUrl) : null;

  return {
    nombre: tienda.nombre,
    iniciales,
    color,
    colorTexto: '#FFFFFF',
    ruc: tienda.ruc || 'N/A',
    direccion: tienda.direccion || '',
    telefono: tienda.telefono || '',
    logoPng: subido ?? (await generarLogo(iniciales, color)),
    logoEsGenerado: !subido,
  };
}
