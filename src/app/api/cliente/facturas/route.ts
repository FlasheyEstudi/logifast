import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/facturas — facturas del cliente logueado.
 *
 * Antes esta ruta leía SOLO `SolicitudEnvio`, una tabla que ningún flujo actual
 * llena: el cliente veía "Mis Facturas" siempre vacío aunque tuviera envíos y
 * compras entregadas. Ahora se unifican las tres fuentes reales:
 *
 *  - Envíos de paquete  → `OrdenServicio` (con `codigoPin`, es la factura del servicio)
 *  - Compras/retiros    → `VentaPOS` emitida al cerrar la orden (`facturacion.ts`)
 *  - Solicitudes viejas → `SolicitudEnvio` (se mantiene por compatibilidad)
 *
 * El formato de salida no cambia para no romper el componente que ya lo consume.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  try {
    const [solicitudes, envios, ventas, compras] = await Promise.all([
      db.solicitudEnvio.findMany({
        where: { clienteId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      db.ordenServicio.findMany({
        where: { clienteId: user.id, estado: 'entregado' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, createdAt: true, origen: true, destino: true, monto: true, metodoPago: true, estado: true },
      }),
      // Compras cerradas del marketplace (las que ya generaron su VentaPOS).
      db.ventaPOS.findMany({
        where: { clienteId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { tienda: { select: { nombre: true } } },
      }),
      db.ordenCompra.findMany({
        where: { clienteId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          createdAt: true,
          direccionEntrega: true,
          total: true,
          metodoPago: true,
          estado: true,
          tienda: { select: { nombre: true } },
        },
      }),
    ]);

    const lista: {
      id: string;
      createdAt: Date;
      origen: string;
      destino: string;
      monto: number;
      metodoPago: string;
      estado: string;
      facturaUrlPdf: string;
      tipo: string;
      numeroComprobante: string | null;
    }[] = [];

    for (const s of solicitudes) {
      lista.push({
        id: s.id,
        createdAt: s.createdAt,
        origen: s.origen,
        destino: s.destino,
        monto: s.monto,
        metodoPago: s.metodoPago,
        estado: s.estado,
        facturaUrlPdf: `/api/cliente/facturas/${s.id}/pdf`,
        tipo: 'envio',
        numeroComprobante: null,
      });
    }

    // Envíos entregados: su comprobante es la propia orden de servicio.
    const yaListados = new Set(solicitudes.map((s) => s.id));
    for (const e of envios) {
      if (yaListados.has(e.id)) continue;
      lista.push({
        id: e.id,
        createdAt: e.createdAt,
        origen: e.origen,
        destino: e.destino,
        monto: e.monto,
        metodoPago: e.metodoPago,
        estado: e.estado,
        facturaUrlPdf: `/api/cliente/facturas/${e.id}/pdf`,
        tipo: 'envio',
        numeroComprobante: null,
      });
    }

    for (const v of ventas) {
      lista.push({
        id: v.id,
        createdAt: v.createdAt,
        origen: v.tienda?.nombre ?? 'Tienda',
        destino: v.clienteNombre ?? 'Cliente',
        monto: v.total,
        metodoPago: v.metodoPago,
        estado: 'emitida',
        facturaUrlPdf: v.facturaUrlPdf || `/api/tienda/facturas/${v.id}/pdf`,
        tipo: 'compra',
        numeroComprobante: v.numeroComprobante,
      });
    }

    // Compras entregadas sin VentaPOS (histórico anterior a esta corrección): se
    // listan igual para que el cliente no pierda su historial, con un PDF propio.
    const idsFacturados = new Set(
      ventas
        .map((v) => /Orden (\w+)/.exec(v.notas ?? '')?.[1])
        .filter((x): x is string => !!x)
    );
    for (const c of compras) {
      if (c.estado !== 'entregado' || idsFacturados.has(c.id)) continue;
      lista.push({
        id: c.id,
        createdAt: c.createdAt,
        origen: c.tienda?.nombre ?? 'Tienda',
        destino: c.direccionEntrega,
        monto: c.total,
        metodoPago: c.metodoPago,
        estado: c.estado,
        facturaUrlPdf: `/api/cliente/facturas/compra/${c.id}/pdf`,
        tipo: 'compra',
        numeroComprobante: null,
      });
    }

    lista.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      ok: true,
      facturas: lista.map((f) => ({
        id: f.id,
        createdAt: f.createdAt,
        origen: f.origen,
        destino: f.destino,
        monto: f.monto,
        metodoPago: f.metodoPago,
        estado: f.estado,
        facturaUrlPdf: f.facturaUrlPdf,
        tipo: f.tipo,
        numeroComprobante: f.numeroComprobante,
      })),
    });
  } catch (e) {
    console.error('[CLIENTE_FACTURAS]', e);
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
  }
}
