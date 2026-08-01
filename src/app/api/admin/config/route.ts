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

    return NextResponse.json({ error: 'Tipo de configuración no soportado' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN_CONFIG_POST]', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
