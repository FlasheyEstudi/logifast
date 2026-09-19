import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  tarifaBase: 40,
  costoEnvioKm: 15,
  tarifaMin: 40,
  recargoNocturno: 20,
};

/**
 * GET /api/config — configuración global (fuente única de tarifas).
 * Cualquier rol con sesión puede leerla; el admin la actualiza vía POST /api/admin/config (type=tarifa).
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  try {
    const cfg = await db.appConfig.findUnique({ where: { id: 1 } });
    return NextResponse.json({
      ok: true,
      config: {
        tarifaBase: cfg?.tarifaBase ?? DEFAULTS.tarifaBase,
        costoEnvioKm: cfg?.costoEnvioKm ?? DEFAULTS.costoEnvioKm,
        tarifaMin: cfg?.tarifaMin ?? DEFAULTS.tarifaMin,
        recargoNocturno: cfg?.recargoNocturno ?? DEFAULTS.recargoNocturno,
      },
    });
  } catch (e) {
    console.error('[CONFIG_GET]', e);
    return NextResponse.json({ ok: true, config: DEFAULTS });
  }
}
