import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';
import { seedIngeniero } from '@/lib/seedIngeniero';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  motoId: z.string().min(1, 'motoId requerido'),
  tipo: z.enum(['PREVENTIVO', 'CORRECTIVO', 'EMERGENCIA']).optional(),
  categoria: z.string().optional(),
  descripcion: z.string().min(1, 'descripcion requerida'),
  observaciones: z.string().max(1000).optional().nullable(),
  kmAlMomento: z.union([z.number().min(0), z.string()]).optional(),
  costoManoObra: z.union([z.number().min(0), z.string()]).optional(),
  costoRepuestos: z.union([z.number().min(0), z.string()]).optional(),
  prioridad: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  programadoPara: z.string().min(1).optional().nullable(),
  repuestosUsados: z.array(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    await seedIngeniero();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const motoId = searchParams.get('motoId');

    const where: any = {};
    if (estado) where.estado = estado;
    if (motoId) where.motoId = motoId;

    const mantenimientos = await prisma.mantenimiento.findMany({
      where,
      include: {
        moto: { select: { id: true, nombre: true, modelo: true, placa: true } },
        repuestosUsados: {
          include: { repuesto: { select: { id: true, nombre: true, precioUnitario: true, sku: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = mantenimientos.map((m) => ({
      ...m,
      motoNombre: m.moto?.nombre || 'Moto',
      motoModelo: m.moto?.modelo || '',
      motoPlaca: m.moto?.placa || '',
      repuestosUsados: m.repuestosUsados.map((ru) => ({
        id: ru.id,
        repuestoId: ru.repuestoId,
        nombre: ru.repuesto?.nombre || 'Repuesto',
        cantidad: ru.cantidad,
        precioUnitario: ru.precioUnitario,
        subtotal: ru.subtotal,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTOS_GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ingeniero', 'admin');
    const data = await req.json();
    const parsed = postSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const tipo = data.tipo || 'PREVENTIVO';
    const categoria = data.categoria || 'GENERAL';
    const costoManoObra = parseFloat(data.costoManoObra) || 0;
    let costoRepuestos = parseFloat(data.costoRepuestos) || 0;

    const moto = await prisma.moto.findUnique({ where: { id: data.motoId } });
    const kmAlMomento = parseFloat(data.kmAlMomento) || (moto?.kmAcumulados ?? 0);

    const mantenimiento = await prisma.mantenimiento.create({
      data: {
        motoId: data.motoId,
        tipo,
        categoria,
        descripcion: data.descripcion,
        observaciones: data.observaciones,
        kmAlMomento,
        costoManoObra,
        costoRepuestos,
        costoTotal: costoManoObra + costoRepuestos,
        estado: tipo === 'EMERGENCIA' ? 'EN_PROCESO' : 'PROGRAMADO',
        prioridad: data.prioridad || (tipo === 'EMERGENCIA' ? 'URGENTE' : 'NORMAL'),
        programadoPara: data.programadoPara ? new Date(data.programadoPara) : new Date(),
        iniciadoEn: tipo === 'EMERGENCIA' ? new Date() : null,
      },
      include: {
        moto: { select: { id: true, nombre: true, modelo: true, placa: true } },
      },
    });

    // Si es emergencia o en proceso, poner moto en mantenimiento
    if (tipo === 'EMERGENCIA') {
      await prisma.moto.update({
        where: { id: data.motoId },
        data: { estado: 'EN_MANTENIMIENTO' }
      }).catch(() => null);
    }

    // Si tiene repuestos usados, registrarlos
    if (Array.isArray(data.repuestosUsados) && data.repuestosUsados.length > 0) {
      for (const ru of data.repuestosUsados) {
        if (ru.repuestoId) {
          const rep = await prisma.repuesto.findUnique({ where: { id: ru.repuestoId } });
          const cant = Math.max(1, Number(ru.cantidad) || 1);
          const pu = rep?.precioUnitario || Number(ru.precioUnitario) || 0;
          await prisma.repuestoUsado.create({
            data: {
              mantenimientoId: mantenimiento.id,
              repuestoId: ru.repuestoId,
              cantidad: cant,
              precioUnitario: pu,
              subtotal: pu * cant,
            }
          }).catch(() => null);
          await prisma.repuesto.update({
            where: { id: ru.repuestoId },
            data: { stock: { decrement: cant } }
          }).catch(() => null);
        }
      }
    }

    return NextResponse.json(mantenimiento, { status: 201 });
  } catch (error) {
    return handleError(error, 'INGENIERO_MANTENIMIENTOS_POST');
  }
}
