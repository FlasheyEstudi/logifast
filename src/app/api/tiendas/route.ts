import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tiendas
 * Lista todas las tiendas activas con filtros.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get('categoria');
    const zona = searchParams.get('zona');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular');
    const verificado = searchParams.get('verificado');

    const where: Record<string, unknown> = { estado: 'activo' };

    if (categoria && categoria !== 'todos') where.categoria = categoria;
    if (popular === 'true') where.popular = true;
    if (verificado === 'true') where.verificado = true;

    if (zona) {
      where.zonaCobertura = { contains: zona };
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search } },
        { descripcion: { contains: search } },
      ];
    }

    const tiendasRaw = await db.tienda.findMany({
      where,
      orderBy: [{ popular: 'desc' }, { calificacion: 'desc' }],
    });

    const tiendas = tiendasRaw.map((t) => {
      let horario: Record<string, { abre: string; cierra: string }> = {};
      try {
        horario = JSON.parse(t.horario);
      } catch {}
      let zonaCobertura: string[] = [];
      try {
        zonaCobertura = JSON.parse(t.zonaCobertura);
      } catch {}

      const badges: string[] = [];
      if (t.popular) badges.push('Popular');
      if (t.verificado) badges.push('Verificado');

      return {
        id: t.id,
        nombre: t.nombre,
        descripcion: t.descripcion ?? '',
        categoria: t.categoria,
        logoColor: t.logoColor,
        logoIniciales: t.logoIniciales,
        portadaColor: t.portadaColor,
        direccion: t.direccion,
        lat: t.lat,
        lng: t.lng,
        telefono: t.telefono ?? '',
        email: t.email ?? '',
        calificacion: t.calificacion,
        totalPedidos: t.totalPedidos,
        tiempoEstimado: t.tiempoEstimado,
        costoEnvio: t.costoEnvio,
        pedidoMinimo: t.pedidoMinimo,
        horario,
        zonaCobertura,
        verificado: t.verificado,
        popular: t.popular,
        estado: t.estado,
        badges,
      };
    });

    return NextResponse.json(tiendas);
  } catch (error) {
    console.error('Error fetching tiendas:', error);
    return NextResponse.json([]);
  }
}

/**
 * POST /api/tiendas
 * Crea una nueva tienda (admin).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireSession();
    const body = await req.json();
    const {
      nombre,
      descripcion,
      categoria,
      logoColor = '#FF5722',
      logoIniciales,
      portadaColor = '#1B1B2F',
      direccion,
      lat,
      lng,
      telefono,
      email,
      tiempoEstimado = '20-30 min',
      costoEnvio = 20,
      pedidoMinimo = 50,
      horario = {},
      zonaCobertura = [],
    } = body;

    if (!nombre || !direccion || !categoria) {
      return NextResponse.json(
        { error: 'Nombre, direccion y categoria son obligatorios' },
        { status: 400 }
      );
    }

    const tienda = await db.tienda.create({
      data: {
        duenoId: user.id,
        nombre,
        descripcion: descripcion ?? null,
        categoria,
        logoColor,
        logoIniciales: logoIniciales ?? nombre.slice(0, 2).toUpperCase(),
        portadaColor,
        direccion,
        lat: Number(lat) || 0,
        lng: Number(lng) || 0,
        telefono: telefono ?? null,
        email: email ?? null,
        tiempoEstimado,
        costoEnvio: Number(costoEnvio) || 0,
        pedidoMinimo: Number(pedidoMinimo) || 0,
        horario: JSON.stringify(horario),
        zonaCobertura: JSON.stringify(zonaCobertura),
        verificado: false,
        popular: false,
        estado: 'activo',
      },
    });

    return NextResponse.json({ tienda });
  } catch (error) {
    return handleError(error, 'TIENDAS_POST');
  }
}
