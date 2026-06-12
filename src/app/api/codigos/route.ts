import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const tipoDescuento = searchParams.get('tipoDescuento');
    const aplicableA = searchParams.get('aplicableA');

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (tipoDescuento) where.tipoDescuento = tipoDescuento;
    if (aplicableA) where.aplicableA = aplicableA;

    const data = await db.codigoPromocional.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[CODIGOS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener códigos promocionales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      codigo,
      tipoDescuento,
      valor,
      aplicableA,
      montoMinimo,
      maxUsos,
      segmento,
      vigenciaInicio,
      vigenciaFin,
      estado,
      creadoPor,
    } = body;

    if (!codigo || !tipoDescuento || valor === undefined || !aplicableA || !vigenciaInicio || !vigenciaFin || !creadoPor) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: codigo, tipoDescuento, valor, aplicableA, vigenciaInicio, vigenciaFin, creadoPor' },
        { status: 400 }
      );
    }

    const codigoPromo = await db.codigoPromocional.create({
      data: {
        codigo,
        tipoDescuento,
        valor,
        aplicableA,
        montoMinimo: montoMinimo ?? null,
        maxUsos: maxUsos ?? 0,
        segmento: segmento || 'todos',
        vigenciaInicio: new Date(vigenciaInicio),
        vigenciaFin: new Date(vigenciaFin),
        estado: estado || 'activo',
        creadoPor,
      },
    });

    return NextResponse.json({ data: codigoPromo }, { status: 201 });
  } catch (error) {
    console.error('[CODIGOS_POST]', error);
    return NextResponse.json({ error: 'Error al crear código promocional' }, { status: 500 });
  }
}
