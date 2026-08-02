import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRepartidorProfile } from '@/lib/repartidor/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/repartidor/recargas
 * Returns driver balance reload history.
 */
export async function GET() {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const recargas = await db.recargaSaldo.findMany({
      where: { repartidorId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ recargas, saldo: profile.saldo });
  } catch (error) {
    console.error('[REPARTIDOR_RECARGAS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener recargas' }, { status: 500 });
  }
}

/**
 * POST /api/repartidor/recargas
 * Requests a new balance reload for driver.
 * - metodo='codigo': valida código promocional y acredita de inmediato.
 * - Otros métodos: quedan 'pendientes' hasta aprobación admin (P0-16).
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { profile } = rp;

    const body = await req.json();
    const montoRaw = Number(body.monto);
    const metodo = String(body.metodo || 'transferencia');
    const referencia = body.referencia ? String(body.referencia) : null;
    const codigo = body.codigo ? String(body.codigo) : null;

    const metodosValidos = ['codigo', 'transferencia', 'efectivo', 'tarjeta'];
    if (!metodosValidos.includes(metodo)) {
      return NextResponse.json({ error: 'Método no válido' }, { status: 400 });
    }

    // Caso 1: código promocional — validación automática
    if (metodo === 'codigo') {
      if (!codigo) {
        return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
      }
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
      if (codigoPromo.tipoDescuento !== 'monto') {
        return NextResponse.json({ error: 'El código no es de tipo recarga' }, { status: 400 });
      }

      const yaUsado = await db.recargaSaldo.findFirst({
        where: { repartidorId: profile.id, codigo, estado: 'completada' },
      });
      if (yaUsado) {
        return NextResponse.json({ error: 'Ya usaste este código' }, { status: 400 });
      }

      const montoFinal = codigoPromo.valor;
      const [recarga] = await db.$transaction([
        db.recargaSaldo.create({
          data: {
            repartidorId: profile.id,
            monto: montoFinal,
            metodo: 'codigo',
            codigo,
            estado: 'completada',
            referencia: codigoPromo.id,
          },
        }),
        db.repartidorProfile.update({
          where: { id: profile.id },
          data: { saldo: { increment: montoFinal } },
        }),
        db.codigoPromocional.update({
          where: { id: codigoPromo.id },
          data: { usosActuales: { increment: 1 } },
        }),
      ]);

      return NextResponse.json({
        recarga,
        nuevoSaldo: profile.saldo + montoFinal,
        estado: 'completada',
      });
    }

    // Caso 2: transferencia/efectivo/tarjeta — pendiente hasta aprobación admin
    if (!Number.isFinite(montoRaw) || montoRaw <= 0) {
      return NextResponse.json({ error: 'Monto debe ser mayor a 0' }, { status: 400 });
    }
    if (montoRaw > 10000) {
      return NextResponse.json({ error: 'Monto excede el máximo permitido (C$10,000)' }, { status: 400 });
    }

    const recarga = await db.recargaSaldo.create({
      data: {
        repartidorId: profile.id,
        monto: montoRaw,
        metodo,
        referencia,
        estado: 'pendiente',
      },
    });

    return NextResponse.json({
      recarga,
      nuevoSaldo: profile.saldo,
      estado: 'pendiente',
      mensaje: 'Tu recarga está pendiente de aprobación.',
    });
  } catch (error) {
    console.error('[REPARTIDOR_RECARGAS_POST]', error);
    return NextResponse.json({ error: 'Error al solicitar recarga' }, { status: 500 });
  }
}
