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
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { user, profile } = rp;

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
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
}

/**
 * PATCH /api/repartidor/perfil
 * Body: { sonidoActivo?, vibracionActiva?, ubicacionActiva?, zonaPreferida?, contratoAceptado? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { user: _u, profile } = rp;

    const body = await req.json();
    const {
      nombre,
      telefono,
      cedula,
      municipio,
      zonaPreferida,
      sonidoActivo,
      vibracionActiva,
      ubicacionActiva,
      contratoAceptado,
    } = body;

    const profileData: Record<string, unknown> = {};
    const userData: Record<string, unknown> = {};
    const camposAplicados: string[] = [];

    if (typeof nombre === 'string' && nombre.trim()) {
      profileData.nombre = nombre.trim();
      userData.name = nombre.trim();
      camposAplicados.push('nombre');
    }
    if (typeof telefono === 'string') {
      profileData.telefono = telefono.trim();
      userData.telefono = telefono.trim();
      camposAplicados.push('telefono');
    }
    if (typeof cedula === 'string') {
      profileData.cedulaRepartidor = cedula.trim();
      userData.cedula = cedula.trim();
      camposAplicados.push('cedula');
    }
    if (typeof municipio === 'string') {
      userData.municipio = municipio.trim();
      camposAplicados.push('municipio');
    }
    if (typeof zonaPreferida === 'string') {
      profileData.zonaPreferida = zonaPreferida.trim();
      camposAplicados.push('zonaPreferida');
    }
    if (typeof sonidoActivo === 'boolean') {
      profileData.sonidoActivo = sonidoActivo;
      camposAplicados.push('sonidoActivo');
    }
    if (typeof vibracionActiva === 'boolean') {
      profileData.vibracionActiva = vibracionActiva;
      camposAplicados.push('vibracionActiva');
    }
    if (typeof ubicacionActiva === 'boolean') {
      profileData.ubicacionActiva = ubicacionActiva;
      camposAplicados.push('ubicacionActiva');
    }
    if (typeof contratoAceptado === 'boolean') {
      profileData.contratoAceptado = contratoAceptado;
      camposAplicados.push('contratoAceptado');
    }

    if (camposAplicados.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron campos válidos para actualizar' },
        { status: 400 }
      );
    }

    if (Object.keys(profileData).length > 0) {
      await db.repartidorProfile.update({
        where: { id: profile.id },
        data: profileData,
      });
    }

    if (Object.keys(userData).length > 0) {
      await db.user.update({
        where: { id: profile.userId },
        data: userData,
      });
    }

    const updatedProfile = await db.repartidorProfile.findUnique({
      where: { id: profile.id },
      include: { user: true },
    });

    return NextResponse.json({
      ok: true,
      perfil: updatedProfile,
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
