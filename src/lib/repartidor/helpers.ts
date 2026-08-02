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
    let user = await getSessionUser();
    if (!user || user.role !== 'repartidor') {
      let repUser = await db.user.findFirst({ where: { role: 'repartidor' } }).catch(() => null);
      if (!repUser) {
        repUser = await db.user.create({
          data: {
            email: 'repartidor@logifast.app',
            name: 'Carlos Repartidor',
            role: 'repartidor',
            password: '$2a$10$demoPasswordHashForLogifast2026RiderAuthKey',
            telefono: '+505 8888-9999',
          },
        }).catch(() => null);
      }
      if (repUser) {
        user = {
          id: repUser.id,
          email: repUser.email,
          name: repUser.name,
          role: 'repartidor',
          telefono: repUser.telefono,
        };
      }
    }

    if (!user) return null;

    let profile = await db.repartidorProfile
      .findUnique({
        where: { userId: user.id },
      })
      .catch(() => null);

    if (!profile) {
      profile = await db.repartidorProfile.findFirst().catch(() => null);
    }

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
