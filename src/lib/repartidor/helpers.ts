/**
 * Helper para obtener el RepartidorProfile del repartidor autenticado.
 */

import { db } from '@/lib/db';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export interface RepartidorData {
  user: SessionUser;
  profile: any;
}

export async function getRepartidorProfile(): Promise<RepartidorData | null> {
  const user = await getSessionUser();
  if (!user || user.role !== 'repartidor') return null;

  let profile = await db.repartidorProfile.findUnique({
    where: { userId: user.id },
  }).catch(() => null);

  if (!profile) {
    profile = await db.repartidorProfile.create({
      data: {
        userId: user.id,
        nombre: user.name,
        email: user.email,
        telefono: user.telefono ?? null,
        saldo: 100,
        conectado: true,
        contratoAceptado: true,
      },
    }).catch(() => null);
  }

  if (!profile) return null;
  return { user, profile };
}

export type { SessionUser };
