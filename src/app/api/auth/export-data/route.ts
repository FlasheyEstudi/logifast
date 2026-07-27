import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';
import { fail, ok } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/export-data
 * Exporta todos los datos del usuario (GDPR compliance).
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail('No autorizado', 401);

    // Cargar todos los datos del usuario
    const [userData, ordenes, ordenesCompra, direcciones, metodosPago, notifsPush, actividad] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true, email: true, name: true, role: true, telefono: true,
          initials: true, color: true, fotoUrl: true, bio: true,
          emailVerified: true, createdAt: true, updatedAt: true,
        },
      }),
      db.ordenServicio.findMany({ where: { clienteId: user.id } }),
      db.ordenCompra.findMany({
        where: { clienteId: user.id },
        include: { items: true },
      }),
      db.direccionCliente.findMany({ where: { clienteId: user.id } }),
      db.metodoPago.findMany({ where: { clienteId: user.id } }),
      db.notificacionPush.findMany({ where: { userId: user.id } }),
      db.actividadUsuario.findMany({ where: { userId: user.id } }),
    ]);

    let repartidorProfile: Awaited<ReturnType<typeof db.repartidorProfile.findUnique>> = null;
    if (user.role === 'repartidor') {
      repartidorProfile = await db.repartidorProfile.findUnique({
        where: { userId: user.id },
      });
    }

    let tienda: Awaited<ReturnType<typeof db.tienda.findFirst>> = null;
    if (user.role === 'cliente') {
      tienda = await db.tienda.findFirst({
        where: { propietarioId: user.id },
        include: { productos: true },
      });
    }

    const exportData: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      user: userData,
      repartidorProfile,
      tienda: tienda ? {
        ...tienda,
        horario: (() => { try { return JSON.parse((tienda as { horario: string }).horario); } catch { return null; } })(),
        zonaCobertura: (() => { try { return JSON.parse((tienda as { zonaCobertura: string }).zonaCobertura); } catch { return null; } })(),
      } : null,
      ordenes,
      ordenesCompra,
      direcciones,
      metodosPago: metodosPago.map(m => ({ ...m, ultimos4: m.ultimos4 })),
      notificacionesPush: notifsPush,
      actividad,
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="logifast-data-${user.email}.json"`,
      },
    });
  } catch (error) {
    console.error('[EXPORT_DATA]', error);
    return fail('Error al exportar datos', 500);
  }
}
