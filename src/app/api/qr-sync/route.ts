import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { JwtPayload } from 'jsonwebtoken';
import { getSessionUser, signShortToken, verifyToken } from '@/lib/auth/session';
import { db } from '@/lib/db';

/**
 * Vinculación QR del POS (estilo WhatsApp Web) con estado PERSISTENTE en la tabla
 * `QrSyncSession` (multi-instancia, sobrevive reinicios):
 * - GET  ?action=token            → la PC pide un token temporal y lo muestra como QR.
 * - GET  ?action=status&token=…  → la PC consulta si el celular ya escaneó.
 * - POST { token }                → el celular valida el QR y queda vinculado como extensión.
 *
 * El vínculo exige que AMBAS sesiones (PC y móvil) sean del MISMO usuario (misma cuenta).
 * Solo se guarda el hash sha256 del token; nunca el JWT crudo.
 */

const TTL_TOKEN_SEG = 120; // caducidad del QR
const RETENCION_LIMPIEZA_SEG = 10 * 60; // filas retenidas tras expirar antes de limpiarse

export const dynamic = 'force-dynamic';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

async function limpiarViejos() {
  const umbral = new Date(Date.now() - RETENCION_LIMPIEZA_SEG * 1000);
  await db.qrSyncSession.deleteMany({
    where: { expiraEn: { lt: umbral } },
  });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  const action = req.nextUrl.searchParams.get('action') ?? 'token';

  try {
    if (action === 'token') {
      const token = signShortToken(
        { tipo: 'qr-sync', sub: user.id, email: user.email, role: user.role },
        TTL_TOKEN_SEG
      );
      await limpiarViejos();
      await db.qrSyncSession.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          estado: 'pendiente',
          expiraEn: new Date(Date.now() + TTL_TOKEN_SEG * 1000),
        },
      });
      return NextResponse.json({ token, expiraEnSegundos: TTL_TOKEN_SEG });
    }

    if (action === 'status') {
      const token = req.nextUrl.searchParams.get('token') ?? '';
      const fila = await db.qrSyncSession.findUnique({ where: { tokenHash: sha256(token) } });
      if (!fila) return NextResponse.json({ estado: 'expirado' });
      if (fila.estado === 'pendiente' && fila.expiraEn.getTime() < Date.now()) {
        return NextResponse.json({ estado: 'expirado' });
      }
      return NextResponse.json({ estado: fila.estado });
    }

    if (action === 'pin-activo') {
      const fila = await db.qrSyncSession.findFirst({
        where: { userId: user.id, estado: 'vinculado' },
        orderBy: { creadoEn: 'desc' },
      });
      return NextResponse.json({
        vinculado: !!fila,
        pinActivo: fila?.pinActivo ?? null,
      });
    }
  } catch (e) {
    console.error('[QR_SYNC]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // La caja (PC/tablet) registra el PIN de su sala abierta para que el celular vinculado se una solo.
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
  if (pin && /^\d{6}$/.test(pin)) {
    const fila = await db.qrSyncSession.findFirst({
      where: { userId: user.id, estado: 'vinculado' },
      orderBy: { creadoEn: 'desc' },
    });
    if (fila) {
      await db.qrSyncSession.update({ where: { id: fila.id }, data: { pinActivo: pin } });
    }
    return NextResponse.json({ ok: true, pinRegistrado: true });
  }

  const token = typeof body?.token === 'string' ? body.token : '';

  if (!token) return NextResponse.json({ error: 'Falta el código QR' }, { status: 400 });

  const claims = verifyToken(token);
  const tipo = (claims as JwtPayload & { tipo?: string } | null)?.tipo;
  if (!claims || tipo !== 'qr-sync') {
    return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 });
  }

  try {
    const fila = await db.qrSyncSession.findUnique({ where: { tokenHash: sha256(token) } });
    if (!fila || (fila.estado === 'pendiente' && fila.expiraEn.getTime() < Date.now())) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 });
    }
    if (fila.userId !== user.id) {
      return NextResponse.json(
        { error: 'La sesión del celular no corresponde a la misma cuenta de la PC' },
        { status: 403 }
      );
    }
    if (fila.estado === 'pendiente') {
      await db.qrSyncSession.update({
        where: { id: fila.id },
        data: { estado: 'vinculado' },
      });
    }
    return NextResponse.json({ ok: true, vinculado: true, cuenta: user.email });
  } catch (e) {
    console.error('[QR_SYNC]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
