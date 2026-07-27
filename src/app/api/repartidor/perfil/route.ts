import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { RepartidorProfile } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

type ConfigCampo = 'sonidoActivo' | 'vibracionActiva' | 'ubicacionActiva' | 'zonaPreferida';

/**
 * GET /api/repartidor/perfil
 * Devuelve el perfil del repartidor autenticado.
 */
export async function GET() {
  try {
    const { user, profile } = await getRepartidorProfile();
    if (!user || !profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result: RepartidorProfile = {
      id: profile.id,
      nombre: profile.nombre,
      email: profile.email,
      telefono: profile.telefono ?? '',
      initials: (user.initials || profile.nombre.slice(0, 2)).toUpperCase(),
      color: user.color || '#FF5722',
      motoId: profile.motoId ?? '',
      zonaPreferida: profile.zonaPreferida ?? 'Centro',
      calificacion: profile.calificacion,
      totalEntregas: profile.totalEntregas,
      totalKm: profile.totalKm,
      totalGanancias: profile.totalGanancias,
      tiempoPromedio: profile.tiempoPromedio,
      sonidoActivo: profile.sonidoActivo,
      vibracionActiva: profile.vibracionActiva,
      ubicacionActiva: profile.ubicacionActiva,
      saldo: profile.saldo,
      contratoAceptado: profile.contratoAceptado,
      recargas: [],
    };

    return NextResponse.json(result);
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
 * Body: { sonidoActivo?, vibracionActiva?, ubicacionActiva?, zonaPreferida?, contratoAceptado? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, profile } = await getRepartidorProfile();
    if (!user || !profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const updates = body as Partial<Record<ConfigCampo | 'contratoAceptado' | 'zonaPreferida', boolean | string>>;

    const data: Record<string, unknown> = {};
    const camposAplicados: string[] = [];

    if (typeof updates.sonidoActivo === 'boolean') {
      data.sonidoActivo = updates.sonidoActivo;
      camposAplicados.push('sonidoActivo');
    }
    if (typeof updates.vibracionActiva === 'boolean') {
      data.vibracionActiva = updates.vibracionActiva;
      camposAplicados.push('vibracionActiva');
    }
    if (typeof updates.ubicacionActiva === 'boolean') {
      data.ubicacionActiva = updates.ubicacionActiva;
      camposAplicados.push('ubicacionActiva');
    }
    if (typeof updates.zonaPreferida === 'string') {
      data.zonaPreferida = updates.zonaPreferida;
      camposAplicados.push('zonaPreferida');
    }
    if (typeof updates.contratoAceptado === 'boolean') {
      data.contratoAceptado = updates.contratoAceptado;
      camposAplicados.push('contratoAceptado');
    }

    if (camposAplicados.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron campos válidos' },
        { status: 400 }
      );
    }

    const updated = await db.repartidorProfile.update({
      where: { id: profile.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      perfil: {
        id: updated.id,
        nombre: updated.nombre,
        sonidoActivo: updated.sonidoActivo,
        vibracionActiva: updated.vibracionActiva,
        ubicacionActiva: updated.ubicacionActiva,
        zonaPreferida: updated.zonaPreferida,
        contratoAceptado: updated.contratoAceptado,
        saldo: updated.saldo,
      },
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
