import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/favoritos/tiendas
 * Devuelve las tiendas favoritas del cliente autenticado.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const favoritos = await db.favoritoTienda.findMany({
      where: { clienteId: user.id },
      include: { tienda: true },
      orderBy: { createdAt: 'desc' },
    });

    const result = favoritos.map((f) => {
      const t = f.tienda;
      let horario: Record<string, { abre: string; cierra: string }> = {};
      try { horario = JSON.parse(t.horario); } catch {}
      let zonaCobertura: string[] = [];
      try { zonaCobertura = JSON.parse(t.zonaCobertura); } catch {}
      return {
        tiendaId: t.id,
        tienda: {
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
          badges: t.popular ? ['Popular'] : [],
        },
      };
    });

    return NextResponse.json({
      total: result.length,
      favoritos: result,
      clienteId: user.id,
    });
  } catch (error) {
    console.error('Error fetching favoritos de tiendas:', error);
    return NextResponse.json(
      { error: 'Error al obtener los favoritos de tiendas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favoritos/tiendas
 * Body: { tiendaId, action?: 'add' | 'remove' }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { tiendaId, action } = body;

    if (!tiendaId) {
      return NextResponse.json(
        { error: 'tiendaId es obligatorio' },
        { status: 400 }
      );
    }

    const tienda = await db.tienda.findUnique({ where: { id: tiendaId } });
    if (!tienda) {
      return NextResponse.json(
        { error: 'Tienda no encontrada' },
        { status: 404 }
      );
    }

    const existing = await db.favoritoTienda.findFirst({
      where: { clienteId: user.id, tiendaId },
    });

    if (action === 'remove' || (action !== 'add' && existing)) {
      if (existing) {
        await db.favoritoTienda.delete({ where: { id: existing.id } });
      }
      return NextResponse.json({
        message: 'Tienda removida de favoritos',
        tiendaId,
        esFavorito: false,
      });
    } else {
      if (!existing) {
        await db.favoritoTienda.create({
          data: { clienteId: user.id, tiendaId },
        });
      }
      return NextResponse.json({
        message: 'Tienda agregada a favoritos',
        tiendaId,
        esFavorito: true,
      });
    }
  } catch (error) {
    console.error('Error actualizando favorito de tienda:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el favorito de tienda' },
      { status: 500 }
    );
  }
}
