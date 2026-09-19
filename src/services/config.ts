export interface TarifasGlobales {
  tarifaBase: number;
  costoEnvioKm: number;
  tarifaMin: number;
  recargoNocturno: number;
}

const DEFAULTS: TarifasGlobales = {
  tarifaBase: 40,
  costoEnvioKm: 15,
  tarifaMin: 40,
  recargoNocturno: 20,
};

const TTL_MS = 30_000; // refetch máximo cada 30s (cambio del admin se propaga sin recargar)
let cache: { data: TarifasGlobales; en: number } | null = null;

/**
 * Fuente única global de tarifas: GET /api/config (AppConfig fila id=1).
 * Fallback: valores legados en localStorage, y por último los defaults históricos.
 */
export async function getTarifasGlobales(): Promise<TarifasGlobales> {
  const ahora = Date.now();
  if (cache && ahora - cache.en < TTL_MS) return cache.data;

  try {
    const r = await fetch('/api/config', { cache: 'no-store' });
    const d = await r.json();
    if (d?.ok && d?.config) {
      const data: TarifasGlobales = {
        tarifaBase: Number(d.config.tarifaBase) || DEFAULTS.tarifaBase,
        costoEnvioKm: Number(d.config.costoEnvioKm) || DEFAULTS.costoEnvioKm,
        tarifaMin: Number(d.config.tarifaMin) || DEFAULTS.tarifaMin,
        recargoNocturno: Number(d.config.recargoNocturno) || DEFAULTS.recargoNocturno,
      };
      cache = { data, en: ahora };
      return data;
    }
  } catch {
    /* red caída: seguir con fallbacks */
  }

  if (typeof window !== 'undefined') {
    try {
      const saved =
        localStorage.getItem('logifast_tarifas') || localStorage.getItem('logifast-config-tarifas');
      if (saved) {
        const p = JSON.parse(saved);
        return {
          tarifaBase: Number(p.tarifaBase) || DEFAULTS.tarifaBase,
          costoEnvioKm: Number(p.tarifaKm) || DEFAULTS.costoEnvioKm,
          tarifaMin: Number(p.tarifaMin) || DEFAULTS.tarifaMin,
          recargoNocturno: Number(p.recargoNocturno) || DEFAULTS.recargoNocturno,
        };
      }
    } catch {
      /* ignorar */
    }
  }

  return DEFAULTS;
}
