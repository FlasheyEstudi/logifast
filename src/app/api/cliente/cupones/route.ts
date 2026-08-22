import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cliente/cupones
 * Obtiene todos los cupones guardados/reclamados en la billetera del cliente autenticado.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const cupones = await db.cuponCliente.findMany({
      where: { clienteId: user.id },
      orderBy: { reclamadoEn: 'desc' },
    });

    return NextResponse.json({ ok: true, cupones });
  } catch (error) {
    console.error('[CUPONES_GET_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener cupones de billetera' }, { status: 500 });
  }
}

/**
 * POST /api/cliente/cupones
 * Reclama un código promocional o promoción y lo almacena en la billetera del cliente.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const codigoPromo = String(body.codigoPromo || '').trim().toUpperCase();

    if (!codigoPromo) {
      return NextResponse.json({ error: 'Código promocional requerido' }, { status: 400 });
    }

    // Verificar si ya fue reclamado por este cliente
    const existing = await db.cuponCliente.findUnique({
      where: {
        clienteId_codigoPromo: {
          clienteId: user.id,
          codigoPromo,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: 'Este cupón ya está guardado en tu billetera',
        cupon: existing,
        yaReclamado: true,
      });
    }

    // Buscar detalles en la tabla maestra de CodigoPromocional si existe
    const promoMaster = await db.codigoPromocional.findUnique({
      where: { codigo: codigoPromo },
    });

    const titulo = body.titulo || (promoMaster ? `Descuento ${promoMaster.codigo}` : `Cupón ${codigoPromo}`);
    const descripcion = body.descripcion || (promoMaster ? `Ahorra con tu cupón ${promoMaster.codigo}` : 'Promoción exclusiva LogiFast');
    const tipoDescuento = promoMaster ? promoMaster.tipoDescuento : (body.tipoDescuento || 'fijo');
    const valor = promoMaster ? promoMaster.valor : (Number(body.valor) || 50);
    const montoMinimo = promoMaster?.montoMinimo ?? (body.montoMinimo ? Number(body.montoMinimo) : null);

    const cupon = await db.cuponCliente.create({
      data: {
        clienteId: user.id,
        codigoPromo,
        titulo,
        descripcion,
        tipoDescuento,
        valor,
        montoMinimo,
        estado: 'disponible',
      },
    });

    // Incrementar clicks en FeedItem o Banner si coincide
    try {
      await db.feedItem.updateMany({
        where: { codigoPromo },
        data: { clicks: { increment: 1 } },
      });
    } catch {
      // no-op
    }

    return NextResponse.json({
      ok: true,
      message: '¡Cupón guardado con éxito en tu billetera!',
      cupon,
      yaReclamado: false,
    });
  } catch (error) {
    console.error('[CUPONES_POST_ERROR]', error);
    return NextResponse.json({ error: 'Error al reclamar el cupón' }, { status: 500 });
  }
}

/**
 * PATCH /api/cliente/cupones
 * Marca un cupón como usado al finalizar una compra o servicio.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const codigoPromo = String(body.codigoPromo || '').trim().toUpperCase();
    const ordenId = body.ordenId ? String(body.ordenId) : null;

    if (!codigoPromo) {
      return NextResponse.json({ error: 'Código promocional requerido' }, { status: 400 });
    }

    const updated = await db.cuponCliente.updateMany({
      where: {
        clienteId: user.id,
        codigoPromo,
        estado: 'disponible',
      },
      data: {
        estado: 'usado',
        usadoEn: new Date(),
        ordenId,
      },
    });

    return NextResponse.json({ ok: true, count: updated.count });
  } catch (error) {
    console.error('[CUPONES_PATCH_ERROR]', error);
    return NextResponse.json({ error: 'Error al actualizar cupón' }, { status: 500 });
  }
}
