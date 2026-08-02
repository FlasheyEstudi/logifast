import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recargas
 * Historial de recargas de saldo del repartidor.
 */
export async function GET() {
  try {
    const repData = await getRepartidorProfile();
    if (!repData || !repData.profile) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { profile } = repData;

    const recargas = await db.recargaSaldo.findMany({
      where: { repartidorId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      saldo: profile.saldo,
      recargas,
    });
  } catch (error) {
    console.error('[RECARGAS_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/recargas
 * Body: { monto, metodo, codigo? }
 * Aplica una recarga de saldo al repartidor.
 */
export async function POST(req: NextRequest) {
  try {
    const repData = await getRepartidorProfile();
    if (!repData || !repData.profile) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { profile } = repData;

    const body = await req.json();
    const monto = Number(body.monto);
    const metodo = String(body.metodo || 'codigo');
    const codigo = body.codigo ? String(body.codigo) : null;

    // Si es código, no requerir monto (se determina del código)
    if (metodo !== 'codigo' && (!monto || monto <= 0)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
    if (metodo === 'codigo' && !codigo) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    // Si es código promocional, validarlo
    if (metodo === 'codigo' && codigo) {
      const codigoPromo = await db.codigoPromocional.findUnique({ where: { codigo } });
      if (!codigoPromo) {
        return NextResponse.json({ error: 'Código no válido' }, { status: 400 });
      }
      if (codigoPromo.estado !== 'activo') {
        return NextResponse.json({ error: 'Código no activo' }, { status: 400 });
      }
      if (codigoPromo.maxUsos > 0 && codigoPromo.usosActuales >= codigoPromo.maxUsos) {
        return NextResponse.json({ error: 'Código agotado' }, { status: 400 });
      }
      const now = new Date();
      if (now < codigoPromo.vigenciaInicio || now > codigoPromo.vigenciaFin) {
        return NextResponse.json({ error: 'Código expirado' }, { status: 400 });
      }
      // Usar el valor del código como monto si es tipo monto
      const montoFinal = codigoPromo.tipoDescuento === 'monto' ? codigoPromo.valor : monto;

      await db.codigoPromocional.update({
        where: { id: codigoPromo.id },
        data: { usosActuales: { increment: 1 } },
      });

      const recarga = await db.recargaSaldo.create({
        data: {
          repartidorId: profile.id,
          monto: montoFinal,
          metodo: 'codigo',
          codigo,
          estado: 'completada',
          referencia: codigoPromo.id,
        },
      });

      await db.repartidorProfile.update({
        where: { id: profile.id },
        data: { saldo: { increment: montoFinal } },
      });

      return NextResponse.json({
        ok: true,
        nuevoSaldo: profile.saldo + montoFinal,
        recarga,
      });
    }

    // Recarga normal (transferencia/efectivo) — requiere aprobación admin
    const recarga = await db.recargaSaldo.create({
      data: {
        repartidorId: profile.id,
        monto,
        metodo,
        codigo,
        estado: 'pendiente',
      },
    });

    return NextResponse.json({
      ok: true,
      mensaje: 'Recarga solicitada correctamente. Pendiente de aprobación por un administrador.',
      nuevoSaldo: profile.saldo,
      recarga,
    });
  } catch (error) {
    console.error('[RECARGAS_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
