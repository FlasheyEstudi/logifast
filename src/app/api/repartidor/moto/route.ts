import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reportarProblemaSchema = z.object({
  categoria: z.string().min(1, 'La categoría es requerida'),
  tipo: z.enum(['PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA']).optional(),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  descripcion: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  kmAlMomento: z.union([z.number().min(0), z.string()]).optional(),
  observaciones: z.string().optional().nullable(),
});

/**
 * GET /api/repartidor/moto
 * Devuelve los datos de la moto asignada al repartidor autenticado,
 * incluyendo su historial de mantenimientos y alertas activas.
 */
export async function GET() {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    let moto: any = null;
    if (profile.motoId) {
      moto = await db.moto.findUnique({
        where: { id: profile.motoId },
        include: {
          mantenimientos: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              repuestosUsados: {
                include: { repuesto: { select: { nombre: true } } },
              },
            },
          },
          alertas: {
            where: { activa: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
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
        include: {
          mantenimientos: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              repuestosUsados: {
                include: { repuesto: { select: { nombre: true } } },
              },
            },
          },
          alertas: {
            where: { activa: true },
            orderBy: { createdAt: 'desc' },
          },
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
      // Si no existe ninguna moto en el sistema, crear una por defecto para este repartidor
      const nuevaMoto = await db.moto.create({
        data: {
          nombre: `Moto-${profile.nombre.split(' ')[0]}`,
          modelo: profile.vehiculoModelo || 'Honda Wave 110',
          placa: profile.vehiculoPlaca || `M-${Math.floor(Math.random() * 90000) + 10000}`,
          anio: profile.vehiculoAnio || 2024,
          color: profile.vehiculoColor || 'Rojo',
          estado: 'DISPONIBLE',
          asignadaA: profile.id,
          kmAcumulados: 12500,
        },
      });

      await db.repartidorProfile.update({
        where: { id: profile.id },
        data: { motoId: nuevaMoto.id },
      });

      return NextResponse.json({
        id: nuevaMoto.id,
        nombre: nuevaMoto.nombre,
        modelo: nuevaMoto.modelo,
        placa: nuevaMoto.placa ?? '—',
        kmAcumulados: nuevaMoto.kmAcumulados,
        estado: nuevaMoto.estado,
        ultimoMantenimiento: null,
        tipoUltimoMantenimiento: 'Sin mantenimientos previos',
        proximoMantenimientoKm: 15000,
        alertaMantenimiento: false,
        alertas: [],
        mantenimientos: [],
      });
    }

    const ultimoMant = moto.mantenimientos?.[0];
    const alertasActivas = moto.alertas || [];
    const kmActual = moto.kmAcumulados || 0;
    const proximoKm = Math.ceil((kmActual + 1) / 3000) * 3000;

    const result = {
      id: moto.id,
      nombre: moto.nombre,
      modelo: moto.modelo,
      placa: moto.placa ?? '—',
      kmAcumulados: moto.kmAcumulados,
      estado: moto.estado,
      ultimoMantenimiento: ultimoMant ? ultimoMant.createdAt.toISOString() : null,
      tipoUltimoMantenimiento: ultimoMant
        ? `${ultimoMant.tipo} (${ultimoMant.categoria}): ${ultimoMant.descripcion}`
        : 'Sin registros',
      proximoMantenimientoKm: proximoKm,
      alertaMantenimiento: alertasActivas.length > 0 || moto.estado === 'EN_MANTENIMIENTO',
      alertas: alertasActivas.map((a) => ({
        id: a.id,
        tipo: a.tipo,
        descripcion: a.descripcion,
        activa: a.activa,
        createdAt: a.createdAt.toISOString(),
      })),
      mantenimientos: moto.mantenimientos.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        categoria: m.categoria,
        descripcion: m.descripcion,
        observaciones: m.observaciones,
        kmAlMomento: m.kmAlMomento,
        costoTotal: m.costoTotal,
        estado: m.estado,
        prioridad: m.prioridad,
        programadoPara: m.programadoPara ? m.programadoPara.toISOString() : null,
        createdAt: m.createdAt.toISOString(),
      })),
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
      ultimoMantenimiento: null,
      tipoUltimoMantenimiento: '—',
      proximoMantenimientoKm: 3000,
      alertaMantenimiento: false,
      alertas: [],
      mantenimientos: [],
    });
  }
}

/**
 * POST /api/repartidor/moto
 * Permite al repartidor reportar un problema mecánico o falla en su moto.
 * Crea automáticamente un Mantenimiento y una Alerta para el rol de Mantenimiento / Ingeniero.
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { user, profile } = rp;

    const body = await req.json();
    const parsed = reportarProblemaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { categoria, descripcion, prioridad = 'ALTA', tipo = 'CORRECTIVO', observaciones, kmAlMomento } = parsed.data;

    // Obtener la moto asignada
    let moto = profile.motoId
      ? await db.moto.findUnique({ where: { id: profile.motoId } })
      : null;

    if (!moto) {
      moto = await db.moto.findFirst({
        where: {
          OR: [
            { asignadaA: profile.id },
            { asignadaA: null, estado: 'DISPONIBLE' },
          ],
        },
      });

      if (!moto) {
        // Crear una moto para el repartidor si no existía ninguna
        moto = await db.moto.create({
          data: {
            nombre: `Moto-${profile.nombre.split(' ')[0]}`,
            modelo: profile.vehiculoModelo || 'Honda Wave 110',
            placa: profile.vehiculoPlaca || `M-${Math.floor(Math.random() * 90000) + 10000}`,
            anio: 2024,
            color: 'Rojo',
            estado: 'DISPONIBLE',
            asignadaA: profile.id,
            kmAcumulados: 12500,
          },
        });
      }

      await db.repartidorProfile.update({
        where: { id: profile.id },
        data: { motoId: moto.id },
      });
    }

    const km = kmAlMomento ? Number(kmAlMomento) : (moto.kmAcumulados ?? 0);
    const esUrgente = prioridad === 'URGENTE' || tipo === 'EMERGENCIA';

    // 1. Crear el registro en Mantenimiento vinculado con la Moto
    const mantenimiento = await db.mantenimiento.create({
      data: {
        motoId: moto.id,
        tipo: esUrgente ? 'EMERGENCIA' : tipo,
        categoria: categoria.toUpperCase(),
        descripcion: descripcion.trim(),
        observaciones: `Reporte de Repartidor: ${profile.nombre} (Tel: ${profile.telefono || user.telefono || 'N/A'}). ${observaciones ? `Notas: ${observaciones.trim()}` : ''}`.trim(),
        kmAlMomento: km,
        costoManoObra: 0,
        costoRepuestos: 0,
        costoTotal: 0,
        estado: esUrgente ? 'EN_PROCESO' : 'PROGRAMADO',
        prioridad: prioridad,
        programadoPara: new Date(),
        iniciadoEn: esUrgente ? new Date() : null,
      },
      include: {
        moto: { select: { id: true, nombre: true, modelo: true, placa: true } },
      },
    });

    // 2. Crear una Alerta de Mantenimiento visible para el rol Ingeniero / Mantenimiento
    const alerta = await db.alertaMantenimiento.create({
      data: {
        motoId: moto.id,
        tipo: esUrgente ? 'EMERGENCIA' : 'CORRECTIVO',
        descripcion: `[Reporte Repartidor] ${profile.nombre}: ${categoria} - ${descripcion.trim()}`,
        kmTrigger: km,
        fechaTrigger: new Date(),
        activa: true,
      },
    });

    // 3. Si es urgente o emergencia, cambiar estado de la moto a EN_MANTENIMIENTO
    if (esUrgente) {
      await db.moto.update({
        where: { id: moto.id },
        data: { estado: 'EN_MANTENIMIENTO' },
      });
    }

    // 4. Crear notificación interna para el repartidor
    await db.notificacionRepartidor.create({
      data: {
        repartidorId: profile.id,
        tipo: 'incidencia',
        titulo: 'Problema de moto enviado a Mantenimiento',
        contenido: `Se ha registrado tu reporte de ${categoria} (${prioridad}) para la ${moto.nombre}. El equipo de taller lo revisará a la brevedad.`,
        leido: false,
      },
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      message: 'Problema reportado exitosamente al equipo de Mantenimiento',
      mantenimiento: {
        id: mantenimiento.id,
        tipo: mantenimiento.tipo,
        categoria: mantenimiento.categoria,
        descripcion: mantenimiento.descripcion,
        estado: mantenimiento.estado,
        prioridad: mantenimiento.prioridad,
        createdAt: mantenimiento.createdAt.toISOString(),
      },
      alerta: {
        id: alerta.id,
        descripcion: alerta.descripcion,
        tipo: alerta.tipo,
      },
      motoActualizada: {
        id: moto.id,
        nombre: moto.nombre,
        estado: esUrgente ? 'EN_MANTENIMIENTO' : moto.estado,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[REPARTIDOR_MOTO_POST]', error);
    return NextResponse.json(
      { error: 'Error al reportar el problema mecánico con la moto' },
      { status: 500 }
    );
  }
}
