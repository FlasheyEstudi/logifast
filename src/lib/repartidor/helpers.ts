/**
 * Helper para obtener el RepartidorProfile del repartidor autenticado.
 * SIN fallbacks inseguros: si no hay sesión válida de repartidor, retorna null.
 */

import { db } from '@/lib/db';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export interface RepartidorProfileResult {
  user: SessionUser;
  profile: NonNullable<Awaited<ReturnType<typeof db.repartidorProfile.findUnique>>>;
}

export async function getRepartidorProfile(): Promise<RepartidorProfileResult | null> {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'repartidor') return null;

    let profile = await db.repartidorProfile
      .findUnique({
        where: { userId: user.id },
      })
      .catch(() => null);

    if (!profile) {
      profile = await db.repartidorProfile
        .create({
          data: {
            userId: user.id,
            nombre: user.name,
            email: user.email,
            telefono: user.telefono ?? null,
            saldo: 100,
            conectado: true,
            contratoAceptado: true,
          },
        })
        .catch(() => null);
    }

    if (!profile) return null;
    return { user, profile };
  } catch (error) {
    console.error('[GET_REPARTIDOR_PROFILE_ERROR]', error);
    return null;
  }
}

export type { SessionUser };
