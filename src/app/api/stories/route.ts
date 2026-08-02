import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  tipo: z.enum(['promo', 'noticia', 'nuevo_producto']).optional(),
  titulo: z.string().min(1, 'titulo requerido').max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  imagenUrl: z.string().max(500).optional().nullable(),
  colorFondo: z.string().max(20).optional(),
  link: z.string().max(500).optional().nullable(),
  tiendaId: z.string().optional().nullable(),
  segmento: z.string().max(50).optional(),
  duracionHoras: z
    .union([z.number(), z.string()])
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 168),
      'duracionHoras debe ser un entero entre 1 y 168'
    ),
});

/**
 * GET /api/stories
 * Lista stories activas (no expiradas).
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    const now = new Date();

    const stories = await db.story.findMany({
      where: {
        activo: true,
        expiraEn: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Si hay usuario, marcar cuáles ya vio
    let vistas = new Set<string>();
    if (user) {
      const v = await db.storyVista.findMany({
        where: { clienteId: user.id, storyId: { in: stories.map((s) => s.id) } },
      });
      vistas = new Set(v.map((x) => x.storyId));
    }

    const result = stories.map((s) => ({
      id: s.id,
      tipo: s.tipo,
      titulo: s.titulo,
      descripcion: s.descripcion ?? '',
      imagenUrl: s.imagenUrl ?? '',
      colorFondo: s.colorFondo,
      link: s.link ?? '',
      tiendaId: s.tiendaId ?? '',
      vistas: s.vistas,
      vista: vistas.has(s.id),
      createdAt: s.createdAt,
      expiraEn: s.expiraEn,
    }));

    return NextResponse.json({ stories: result });
  } catch (error) {
    console.error('[STORIES_GET]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * POST /api/stories
 * Crea un nuevo story (admin).
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }
    const { tipo, titulo, descripcion, imagenUrl, colorFondo, link, tiendaId, segmento, duracionHoras = 24 } = body;

    if (!titulo) return NextResponse.json({ error: 'titulo requerido' }, { status: 400 });

    const expiraEn = new Date(Date.now() + Number(duracionHoras) * 3600_000);

    const story = await db.story.create({
      data: {
        tipo: tipo || 'promo',
        titulo,
        descripcion: descripcion ?? null,
        imagenUrl: imagenUrl ?? null,
        colorFondo: colorFondo || '#FF5722',
        link: link ?? null,
        tiendaId: tiendaId ?? null,
        segmento: segmento || 'todos',
        activo: true,
        expiraEn,
      },
    });

    return NextResponse.json({ ok: true, story });
  } catch (error) {
    console.error('[STORIES_POST]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

/**
 * PATCH /api/stories
 * Body: { id } → marca como vista por el cliente actual.
 */
export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await req.json();
    const id = String(body.id);
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

    // Verificar existencia de la story
    const story = await db.story.findUnique({ where: { id } });
    if (!story) return NextResponse.json({ error: 'Story no encontrada' }, { status: 404 });

    // Solo marcar vista + incrementar si NO existía previamente
    const existingVista = await db.storyVista.findUnique({
      where: { storyId_clienteId: { storyId: id, clienteId: user.id } },
    });

    if (!existingVista) {
      await db.$transaction([
        db.storyVista.create({ data: { storyId: id, clienteId: user.id } }),
        db.story.update({
          where: { id },
          data: { vistas: { increment: 1 } },
        }),
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[STORIES_PATCH]', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
