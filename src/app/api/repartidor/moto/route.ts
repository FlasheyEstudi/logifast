import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import type { MotoAsignada } from '@/lib/repartidor-store';

export const dynamic = 'force-dynamic';

type MotoDb = Awaited<ReturnType<typeof db.moto.findFirst>>;

/**
 * GET /api/repartidor/moto
 * Devuelve los datos de la moto asignada al repartidor autenticado.
 */
export async function GET() {
  try {
    const repData = await getRepartidorProfile();
    if (!repData || !repData.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = repData;

    let moto: MotoDb = null;
    if (profile.motoId) {
      moto = await db.moto.findUnique({ where: { id: profile.motoId } });
    }

    // Si no tiene moto asignada, intentar buscar una disponible y asignarla
    if (!moto) {
      moto = await db.moto.findFirst({
        where: {
          OR: [
            { asignadaA: profile.id },
            { asignadaA: null, estado: 'DISPONIBLE' },
          ],
        },
      });

      if (moto) {
        await db.moto.update({
          where: { id: moto.id },
          data: { asignadaA: profile.id, estado: 'DISPONIBLE' },
        });
        await db.repartidorProfile.update({
          where: { id: profile.id },
          data: { motoId: moto.id },
        });
      }
    }

    if (!moto) {
      // Fallback si no hay motos en la BD
      const fallback: MotoAsignada = {
        id: 'moto-default',
        nombre: 'Moto-Default',
        modelo: 'Honda Wave 110',
        placa: 'M-0000',
        kmAcumulados: 0,
        estado: 'DISPONIBLE',
        ultimoMantenimiento: '-',
        tipoUltimoMantenimiento: '—',
        proximoMantenimientoKm: null,
        alertaMantenimiento: false,
      };
      return NextResponse.json(fallback);
    }

    const result: MotoAsignada = {
      id: moto.id,
      nombre: moto.nombre,
      modelo: moto.modelo,
      placa: moto.placa ?? '—',
      kmAcumulados: moto.kmAcumulados,
      estado: (moto.estado as 'DISPONIBLE' | 'EN_SERVICIO' | 'MANTENIMIENTO') ?? 'DISPONIBLE',
      ultimoMantenimiento: '-',
      tipoUltimoMantenimiento: '—',
      proximoMantenimientoKm: null,
      alertaMantenimiento: false,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[REPARTIDOR_MOTO_GET]', error);
    return NextResponse.json({
      id: 'moto-default',
      nombre: 'Moto-Default',
      modelo: 'Honda Wave 110',
      placa: 'M-0000',
      kmAcumulados: 0,
      estado: 'DISPONIBLE',
      ultimoMantenimiento: '-',
      tipoUltimoMantenimiento: '—',
      proximoMantenimientoKm: null,
      alertaMantenimiento: false,
    });
  }
}
