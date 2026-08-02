import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  etiqueta: z.string().min(1).max(50).optional(),
  direccion: z.string().min(1, 'direccion requerida').max(500),
  lat: z.number().optional(),
  lng: z.number().optional(),
  referencia: z.string().max(300).nullable().optional(),
  predeterminada: z.boolean().optional(),
});

const patchSchema = z.object({
  id: z.string().min(1, 'id requerido'),
  etiqueta: z.string().min(1).max(50).optional(),
  direccion: z.string().min(1).max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  referencia: z.string().max(300).nullable().optional(),
  predeterminada: z.boolean().optional(),
});

/**
 * GET /api/direcciones
 * Lista las direcciones guardadas del cliente autenticado.
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const direcciones = await db.direccionCliente.findMany({
      where: { clienteId: user.id },
      orderBy: [{ predeterminada: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ direcciones });
  } catch (error) {
    console.error('[DIRECCIONES_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/direcciones
 * Body: { etiqueta, direccion, lat, lng, referencia?, predeterminada? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const etiqueta = String(body.etiqueta || 'Casa');
    const direccion = String(body.direccion || '');
    const lat = Number(body.lat) || 0;
    const lng = Number(body.lng) || 0;
    const referencia = body.referencia ? String(body.referencia) : null;
    const predeterminada = Boolean(body.predeterminada);

    if (!direccion) {
      return NextResponse.json({ error: 'direccion requerida' }, { status: 400 });
    }

    if (predeterminada) {
      await db.direccionCliente.updateMany({
        where: { clienteId: user.id },
        data: { predeterminada: false },
      });
    }

    const dir = await db.direccionCliente.create({
      data: {
        clienteId: user.id,
        etiqueta,
        direccion,
        lat,
        lng,
        referencia,
        predeterminada,
      },
    });

    return NextResponse.json({ ok: true, direccion: dir });
  } catch (error) {
    console.error('[DIRECCIONES_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/direcciones
 * Body: { id, ...campos }
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const id = String(body.id);
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const existing = await db.direccionCliente.findUnique({ where: { id } });
    if (!existing || existing.clienteId !== user.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    if (body.predeterminada) {
      await db.direccionCliente.updateMany({
        where: { clienteId: user.id },
        data: { predeterminada: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (body.etiqueta) data.etiqueta = String(body.etiqueta);
    if (body.direccion) data.direccion = String(body.direccion);
    if (typeof body.lat === 'number') data.lat = body.lat;
    if (typeof body.lng === 'number') data.lng = body.lng;
    if (body.referencia !== undefined) data.referencia = body.referencia;
    if (typeof body.predeterminada === 'boolean') data.predeterminada = body.predeterminada;

    const updated = await db.direccionCliente.update({ where: { id }, data });
    return NextResponse.json({ ok: true, direccion: updated });
  } catch (error) {
    console.error('[DIRECCIONES_PATCH]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/direcciones?id=
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    const existing = await db.direccionCliente.findUnique({ where: { id } });
    if (!existing || existing.clienteId !== user.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    await db.direccionCliente.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[DIRECCIONES_DELETE]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
