import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/config
 * Retrieves schedules, feriados, feature flags, and coverage zones.
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [horarios, feriados, featureFlags, zonas] = await Promise.all([
      db.configuracionHorario.findMany({ orderBy: { dia: 'asc' } }),
      db.feriado.findMany({ orderBy: { fecha: 'asc' } }),
      db.featureFlag.findMany({ orderBy: { nombre: 'asc' } }),
      db.zonaCobertura.findMany({ orderBy: { nombre: 'asc' } }),
    ]);

    return NextResponse.json({ horarios, feriados, featureFlags, zonas });
  } catch (error) {
    console.error('[ADMIN_CONFIG_GET]', error);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

/**
 * POST /api/admin/config
 * Creates or updates feature flags / feriados / horarios / zonas.
 */
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'ingeniero')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { type, payload } = body;

    if (type === 'featureFlag') {
      const { id, nombre, descripcion, habilitado } = payload;
      let flag;
      if (id) {
        flag = await db.featureFlag.update({
          where: { id },
          data: { habilitado: Boolean(habilitado) },
        });
      } else {
        flag = await db.featureFlag.create({
          data: {
            nombre: String(nombre),
            descripcion: String(descripcion || ''),
            habilitado: Boolean(habilitado),
          },
        });
      }
      return NextResponse.json({ flag });
    }

    if (type === 'feriado') {
      const { nombre, fecha, recargo } = payload;
      const feriado = await db.feriado.create({
        data: {
          nombre: String(nombre),
          fecha: new Date(fecha),
          recargo: Number(recargo) || 0,
        },
      });
      return NextResponse.json({ feriado });
    }

    if (type === 'zona') {
      const { nombre, descripcion, lat, lng, radio, activa } = payload;
      const zona = await db.zonaCobertura.create({
        data: {
          nombre: String(nombre),
          descripcion: descripcion ? String(descripcion) : null,
          lat: Number(lat) || 0,
          lng: Number(lng) || 0,
          radio: Number(radio) || 5,
          activa: activa !== undefined ? Boolean(activa) : true,
        },
      });
      return NextResponse.json({ zona });
    }

    if (type === 'horario') {
      const { id, dia, horaInicio, horaFin, activo, recargoNocturno } = payload;
      let horario;
      if (id) {
        horario = await db.configuracionHorario.update({
          where: { id },
          data: {
            horaInicio,
            horaFin,
            activo: Boolean(activo),
            recargoNocturno: Number(recargoNocturno) || 0,
          },
        });
      } else {
        horario = await db.configuracionHorario.create({
          data: {
            dia: Number(dia) || 1,
            horaInicio: String(horaInicio || '08:00'),
            horaFin: String(horaFin || '20:00'),
            activo: Boolean(activo ?? true),
            recargoNocturno: Number(recargoNocturno) || 0,
          },
        });
      }
      return NextResponse.json({ horario });
    }

    if (type === 'tarifa') {
      const { tarifaBase, tarifaKm, tarifaMin, recargoNocturno } = payload;
      // Update or log in audit log
      await db.auditLog.create({
        data: {
          userId: sessionUser.id,
          accion: 'ACTUALIZAR_TARIFAS',
          recurso: 'config_tarifas',
          detalles: `Base: C$${tarifaBase} | Km: C$${tarifaKm} | Min: C$${tarifaMin} | Nocturno: C$${recargoNocturno || 0}`,
        },
      }).catch(() => null);

      return NextResponse.json({
        ok: true,
        tarifas: {
          tarifaBase: Number(tarifaBase) || 0,
          tarifaKm: Number(tarifaKm) || 15,
          tarifaMin: Number(tarifaMin) || 40,
          recargoNocturno: Number(recargoNocturno) || 20,
        },
      });
    }

    return NextResponse.json({ ok: true, message: 'Configuración procesada' });
  } catch (error) {
    console.error('[ADMIN_CONFIG_POST]', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
