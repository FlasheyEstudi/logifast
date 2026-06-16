import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runtimeState, REPARTIDOR_ID } from '@/lib/repartidor-mock';

export const dynamic = 'force-dynamic';

type ConfigCampo = 'sonidoActivo' | 'vibracionActiva' | 'ubicacionActiva' | 'zonaPreferida';

/**
 * GET /api/repartidor/perfil
 * Devuelve el perfil del repartidor.
 */
export async function GET() {
  try {
    return NextResponse.json(runtimeState.perfil);
  } catch (error) {
    console.error('[REPARTIDOR_PERFIL_GET]', error);
    return NextResponse.json(
      { error: 'Error al obtener el perfil' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/repartidor/perfil
 * Body: { sonidoActivo?, vibracionActiva?, ubicacionActiva?, zonaPreferida? }
 * Actualiza la configuración del repartidor.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = body as Partial<
      Record<ConfigCampo, boolean | string>
    >;

    const camposValidos: ConfigCampo[] = [
      'sonidoActivo',
      'vibracionActiva',
      'ubicacionActiva',
      'zonaPreferida',
    ];

    const camposAplicados: ConfigCampo[] = [];
    for (const campo of camposValidos) {
      if (campo in updates) {
        const valor = updates[campo];
        if (campo === 'zonaPreferida') {
          if (typeof valor === 'string') {
            runtimeState.perfil.zonaPreferida = valor;
            camposAplicados.push(campo);
          }
        } else {
          if (typeof valor === 'boolean') {
            (runtimeState.perfil as Record<ConfigCampo, boolean | string>)[campo] = valor;
            camposAplicados.push(campo);
          }
        }
      }
    }

    if (camposAplicados.length === 0) {
      return NextResponse.json(
        {
          error:
            'No se enviaron campos válidos. Válidos: sonidoActivo, vibracionActiva, ubicacionActiva, zonaPreferida',
        },
        { status: 400 }
      );
    }

    // Best-effort persistencia
    try {
      await db.repartidorProfile.update({
        where: { id: REPARTIDOR_ID },
        data: {
          sonidoActivo: runtimeState.perfil.sonidoActivo,
          vibracionActiva: runtimeState.perfil.vibracionActiva,
          ubicacionActiva: runtimeState.perfil.ubicacionActiva,
          zonaPreferida: runtimeState.perfil.zonaPreferida,
        },
      });
    } catch (dbError) {
      console.warn('[REPARTIDOR_PERFIL_PATCH] DB skip:', dbError);
    }

    return NextResponse.json({
      ok: true,
      perfil: runtimeState.perfil,
      actualizados: camposAplicados,
    });
  } catch (error) {
    console.error('[REPARTIDOR_PERFIL_PATCH]', error);
    return NextResponse.json(
      { error: 'Error al actualizar el perfil' },
      { status: 500 }
    );
  }
}
