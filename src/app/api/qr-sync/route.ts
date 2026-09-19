import { NextRequest, NextResponse } from 'next/server';
import type { JwtPayload } from 'jsonwebtoken';
import { getSessionUser, signShortToken, verifyToken } from '@/lib/auth/session';

/**
 * Vinculación QR del POS (estilo WhatsApp Web):
 * - GET  ?action=token            → la PC pide un token temporal y lo muestra como QR.
 * - GET  ?action=status&token=…  → la PC consulta si el celular ya escaneó.
 * - POST { token }                → el celular valida el QR y queda vinculado como extensión.
 *
 * El vínculo exige que AMBAS sesiones (PC y móvil) sean del MISMO usuario (misma cuenta).
 * Estado en memoria: suficiente para el flujo dev; para producción mover a una tabla.
 */

interface Vinculo {
  userId: string;
  estado: 'pendiente' | 'vinculado';
  creadoEn: number;
}

const vinculos = new Map<string, Vinculo>();
const TTL_TOKEN_SEG = 120; // caducidad del QR
const TTL_VINCULO_SEG = 10 * 60; // limpieza del registro en memoria

export const dynamic = 'force-dynamic';

function limpiarViejos() {
  const ahora = Date.now();
  for (const [k, v] of vinculos) {
    if (ahora - v.creadoEn > TTL_VINCULO_SEG * 1000) vinculos.delete(k);
  }
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  const action = req.nextUrl.searchParams.get('action') ?? 'token';

  if (action === 'token') {
    const token = signShortToken(
      { tipo: 'qr-sync', sub: user.id, email: user.email, role: user.role },
      TTL_TOKEN_SEG
    );
    limpiarViejos();
    vinculos.set(token, { userId: user.id, estado: 'pendiente', creadoEn: Date.now() });
    return NextResponse.json({ token, expiraEnSegundos: TTL_TOKEN_SEG });
  }

  if (action === 'status') {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    const v = vinculos.get(token);
    return NextResponse.json({ estado: v?.estado ?? 'expirado' });
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token : '';

  if (!token) return NextResponse.json({ error: 'Falta el código QR' }, { status: 400 });

  const claims = verifyToken(token);
  const tipo = (claims as JwtPayload & { tipo?: string } | null)?.tipo;
  if (!claims || tipo !== 'qr-sync') {
    return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 400 });
  }
  if (claims.sub !== user.id) {
    return NextResponse.json(
      { error: 'La sesión del celular no corresponde a la misma cuenta de la PC' },
      { status: 403 }
    );
  }

  limpiarViejos();
  vinculos.set(token, { userId: user.id, estado: 'vinculado', creadoEn: Date.now() });
  return NextResponse.json({ ok: true, vinculado: true, cuenta: user.email });
}
