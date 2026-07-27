/**
 * Helper para obtener el RepartidorProfile del repartidor autenticado.
 * Si no existe el perfil, lo crea on-the-fly.
 */

import { db } from '@/lib/db';
import { getSessionUser, type SessionUser } from '@/lib/auth/session';

export async function getRepartidorProfile() {
  const user = await getSessionUser();
  if (!user || user.role !== 'repartidor') return { user: null, profile: null };

  let profile = await db.repartidorProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) {
    profile = await db.repartidorProfile.create({
      data: {
        userId: user.id,
        nombre: user.name,
        email: user.email,
        telefono: user.telefono ?? null,
        saldo: 0,
        contratoAceptado: false,
      },
    });
  }
  return { user, profile };
}

export type { SessionUser };
