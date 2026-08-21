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
    const rp = await getRepartidorProfile();
    if (!rp) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { profile } = rp;

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
 * Body: { monto, metodo, codigo?, referencia? }
 * - metodo='codigo': se valida contra CodigoPromocional y se acredita de inmediato (estado: 'completada').
 * - Otros métodos (transferencia, efectivo): quedan 'pendientes' hasta aprobación admin (P0-16).
 */
export async function POST(req: NextRequest) {
  try {
    const rp = await getRepartidorProfile();
    if (!rp) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { profile } = rp;

    const body = await req.json();
    const montoRaw = Number(body.monto);
    const metodo = String(body.metodo || 'codigo');
    const codigo = body.codigo ? String(body.codigo) : null;
    const referencia = body.referencia ? String(body.referencia) : null;

    // Validación de monto para métodos que no sean código
    if (metodo !== 'codigo') {
      if (!Number.isFinite(montoRaw) || montoRaw <= 0) {
        return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
      }
      if (montoRaw > 10000) {
        return NextResponse.json({ error: 'Monto excede el máximo permitido (C$10,000)' }, { status: 400 });
      }
    }

    // Validación de método
    const metodosValidos = ['codigo', 'transferencia', 'efectivo', 'tarjeta'];
    if (!metodosValidos.includes(metodo)) {
      return NextResponse.json({ error: 'Método no válido' }, { status: 400 });
    }

    // Caso 1: recarga vía código promocional — validación automática
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
      const montoFinal = codigoPromo.valor;

      // Transacción atómica: validar uso previo + incrementar usos + crear recarga + incrementar saldo (VULN-07)
      let recarga;
      let nuevoSaldoCalculado = profile.saldo;

      try {
        const result = await db.$transaction(async (tx) => {
          // 1. Validar si ya fue usado dentro de la transacción
          const yaUsadoTx = await tx.recargaSaldo.findFirst({
            where: { repartidorId: profile.id, codigo, estado: 'completada' },
          });
          if (yaUsadoTx) {
            throw new Error('CODIGO_YA_USADO');
          }

          // 2. Validar límite de usos
          const promoActual = await tx.codigoPromocional.findUnique({
            where: { id: codigoPromo.id },
          });
          if (!promoActual || (promoActual.maxUsos > 0 && promoActual.usosActuales >= promoActual.maxUsos)) {
            throw new Error('CODIGO_AGOTADO');
          }

          // 3. Crear recarga
          const r = await tx.recargaSaldo.create({
            data: {
              repartidorId: profile.id,
              monto: montoFinal,
              metodo: 'codigo',
              codigo,
              estado: 'completada',
              referencia: codigoPromo.id,
            },
          });

          // 4. Acreditar saldo
          const profUpdated = await tx.repartidorProfile.update({
            where: { id: profile.id },
            data: { saldo: { increment: montoFinal } },
          });

          // 5. Incrementar usos
          await tx.codigoPromocional.update({
            where: { id: codigoPromo.id },
            data: { usosActuales: { increment: 1 } },
          });

          return { recarga: r, nuevoSaldo: profUpdated.saldo };
        });

        recarga = result.recarga;
        nuevoSaldoCalculado = result.nuevoSaldo;
      } catch (err: any) {
        if (err?.message === 'CODIGO_YA_USADO') {
          return NextResponse.json({ error: 'Ya usaste este código' }, { status: 400 });
        }
        if (err?.message === 'CODIGO_AGOTADO') {
          return NextResponse.json({ error: 'Código agotado' }, { status: 400 });
        }
        throw err;
      }

      return NextResponse.json({
        ok: true,
        nuevoSaldo: nuevoSaldoCalculado,
        recarga,
        estado: 'completada',
      });
    }

    // Caso 2: recarga por transferencia/efectivo/tarjeta — queda pendiente
    // El saldo NO se incrementa hasta que un admin apruebe la recarga.
    const recarga = await db.recargaSaldo.create({
      data: {
        repartidorId: profile.id,
        monto: montoRaw,
        metodo,
        codigo: null,
        estado: 'pendiente',
        referencia,
      },
    });

    return NextResponse.json({
      ok: true,
      nuevoSaldo: profile.saldo, // sin cambio hasta aprobación
      recarga,
      estado: 'pendiente',
      mensaje: 'Tu recarga está pendiente de aprobación. El saldo se acreditará cuando un administrador la valide.',
    });
  } catch (error) {
    console.error('[RECARGAS_POST]', error);
    return NextResponse.json({ error: 'Error al procesar la recarga' }, { status: 500 });
  }
}
