import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

const TIPO_LABEL: Record<string, string> = {
  mecanica: 'Falla mecánica',
  cliente: 'Problema con cliente',
  accidente: 'Accidente',
  otro: 'Otro',
};

/**
 * PATCH /api/repartidor/ordenes/[id]/incidencia
 * Body: { tipo: 'mecanica' | 'cliente' | 'accidente' | 'otro', desc?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repData = await getRepartidorProfile();
    if (!repData || !repData.profile) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = repData;

    const body = await req.json();
    const tipoRaw = String(body.tipo ?? 'otro');
    const tipoLabel = TIPO_LABEL[tipoRaw] ?? 'Otro';
    const desc = String(body.desc ?? '');

    const orden = await db.ordenServicio.findUnique({ where: { id } });
    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }
    if (orden.repartidorId !== profile.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 });
    }

    await db.ordenServicio.update({
      where: { id },
      data: {
        estado: 'incidencia',
        incidenciaTipo: tipoLabel,
        incidenciaDesc: desc,
      },
    });

    await db.repartidorProfile.update({
      where: { id: profile.id },
      data: { enServicio: false },
    });

    await db.notificacionRepartidor.create({
      data: {
        repartidorId: profile.id,
        tipo: 'incidencia',
        titulo: 'Incidencia reportada',
        contenido: `${tipoLabel} — ${id}`,
        leido: false,
        ordenId: id,
      },
    });

    // Si la incidencia es falla mecánica o accidente, generar reporte automático al módulo de Ingeniero / Mantenimiento
    if (tipoRaw === 'mecanica' || tipoRaw === 'accidente') {
      try {
        let moto: any = null;
        if (profile.motoId) {
          moto = await db.moto.findUnique({ where: { id: profile.motoId } });
        }
        if (!moto) {
          moto = await db.moto.findFirst({ where: { asignadaA: profile.id } }) || await db.moto.findFirst();
        }

        if (moto) {
          // Cambiar estado de la moto a EN_MANTENIMIENTO
          await db.moto.update({
            where: { id: moto.id },
            data: { estado: 'EN_MANTENIMIENTO' },
          });

          // Crear Alerta de Mantenimiento para Ingeniero
          await db.alertaMantenimiento.create({
            data: {
              motoId: moto.id,
              tipo: 'EMERGENCIA',
              descripcion: `Alerta: ${tipoLabel} reportada por repartidor ${profile.nombre}. Orden: ${id}. Detalle: ${desc || 'Sin detalle'}`,
              activa: true,
              resuelta: false,
            },
          });

          // Crear Registro de Mantenimiento Correctivo/Emergencia
          await db.mantenimiento.create({
            data: {
              motoId: moto.id,
              tipo: tipoRaw === 'accidente' ? 'EMERGENCIA' : 'CORRECTIVO',
              categoria: 'GENERAL',
              descripcion: `[INCIDENCIA EN RUTA] ${tipoLabel} - Repartidor ${profile.nombre} (Orden ${id})`,
              observaciones: desc || 'Reportado automáticamente desde la app de repartidor por incidencia en ruta',
              kmAlMomento: moto.kmAcumulados,
              costoManoObra: 0,
              costoRepuestos: 0,
              costoTotal: 0,
              estado: 'PROGRAMADO',
              prioridad: 'URGENTE',
            },
          });
        }
      } catch (errMantenimiento) {
        console.error('[INCIDENCIA_MANTENIMIENTO_AUTO_CREATE]', errMantenimiento);
      }
    }

    return NextResponse.json({
      ok: true,
      estado: 'incidencia',
      ordenId: id,
      tipo: tipoLabel,
    });
  } catch (error) {
    console.error('[REPARTIDOR_ORDEN_INCIDENCIA]', error);
    return NextResponse.json(
      { error: 'Error al reportar incidencia' },
      { status: 500 }
    );
  }
}
