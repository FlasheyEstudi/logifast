import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/clientes
 * Returns all client accounts with order stats, addresses, and payment methods.
 */
export async function GET() {
  try {
    await requireRole('admin');
    const clientes = await db.user.findMany({
      where: { role: 'cliente' },
      orderBy: { createdAt: 'desc' },
      include: {
        ordenes: {
          select: {
            id: true,
            monto: true,
            estado: true,
            destino: true,
            createdAt: true,
          },
        },
        ordenesCompra: {
          select: {
            id: true,
            total: true,
            estado: true,
            direccionEntrega: true,
            createdAt: true,
          },
        },
        direcciones: { select: { id: true } },
        favoritosTiendas: { select: { id: true } },
        favoritosProductos: { select: { id: true } },
      },
    });

    const clientesFormatted = clientes.map((c) => {
      const allOrders = [
        ...c.ordenes.map((o) => ({
          monto: Number(o.monto || 0),
          fecha: o.createdAt,
          destino: o.destino || '',
        })),
        ...c.ordenesCompra.map((o) => ({
          monto: Number(o.total || 0),
          fecha: o.createdAt,
          destino: o.direccionEntrega || '',
        })),
      ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      const totalEnvios = allOrders.length;
      const montoTotal = allOrders.reduce((sum, o) => sum + (o.monto || 0), 0);
      const ultimoEnvio = allOrders[0]
        ? new Date(allOrders[0].fecha).toISOString().split('T')[0]
        : null;
      const zonaFrecuente =
        c.municipio ||
        c.departamento ||
        (allOrders[0]?.destino ? allOrders[0].destino.split(',')[0].trim() : 'Managua');

      return {
        id: c.id,
        nombre: c.name || 'Cliente',
        email: c.email || '',
        telefono: c.telefono || '',
        cedula: c.cedula || '',
        departamento: c.departamento || '',
        municipio: c.municipio || '',
        direccion: c.direccion || '',
        lat: c.lat || 0,
        lng: c.lng || 0,
        fotoUrl: c.fotoUrl || null,
        color: c.color || '#FF5722',
        initials: c.initials || (c.name ? c.name.substring(0, 2).toUpperCase() : 'CL'),
        totalEnvios,
        montoTotal,
        ultimoEnvio,
        zonaFrecuente,
        direccionesCount: c.direcciones.length,
        favoritosCount: c.favoritosTiendas.length + c.favoritosProductos.length,
        createdAt: c.createdAt,
      };
    });

    return NextResponse.json({ clientes: clientesFormatted });
  } catch (error) {
    console.error('[ADMIN_CLIENTES_GET]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al obtener clientes' },
      { status }
    );
  }
}

/**
 * PATCH /api/admin/clientes
 * Updates client details.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin');

    const body = await req.json();
    const { id, name, email, telefono } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        email: email ? String(email) : undefined,
        telefono: telefono ? String(telefono) : undefined,
      },
    });

    return NextResponse.json({ cliente: updated });
  } catch (error) {
    console.error('[ADMIN_CLIENTES_PATCH]', error);
    const status = (error as Error & { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: status === 401 ? 'No autenticado' : status === 403 ? 'No autorizado' : 'Error al actualizar cliente' },
      { status }
    );
  }
}
