import { db } from '@/lib/db';
import type { SessionUser } from '@/lib/auth/session';

/**
 * #7 / #10 — Acceso a una tienda por rol.
 *
 * Antes solo el dueño (`Tienda.propietarioId`) podía operar el portal. Ahora también
 * entran los usuarios invitados de `TiendaUsuario`, cada uno con su rol y permisos, y
 * **solo ven la tienda a la que pertenecen**.
 */

export interface AccesoTienda {
  tiendaId: string;
  nombre: string;
  rol: string;
  permisos: string[];
  esPropietario: boolean;
}

/** Permisos por defecto de cada rol (si el miembro no trae permisos propios). */
export const PERMISOS_POR_ROL: Record<string, string[]> = {
  dueno: ['precios', 'inventario', 'reportes', 'equipo', 'pauta', 'cupones', 'ventas'],
  encargado: ['precios', 'inventario', 'reportes', 'cupones', 'ventas'],
  cajero: ['ventas'],
  inventario: ['inventario', 'reportes'],
};

export const ROLES_TIENDA = ['dueno', 'encargado', 'cajero', 'inventario'];

function leerPermisos(crudo: string | null | undefined): string[] {
  if (!crudo) return [];
  try {
    const parsed = JSON.parse(crudo);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

/** Devuelve la tienda a la que pertenece el usuario (como dueño o como miembro). */
export async function resolverAccesoTienda(user: SessionUser): Promise<AccesoTienda | null> {
  const propia = await db.tienda.findFirst({
    where: { propietarioId: user.id },
    select: { id: true, nombre: true },
  });
  if (propia) {
    return {
      tiendaId: propia.id,
      nombre: propia.nombre,
      rol: 'dueno',
      permisos: PERMISOS_POR_ROL.dueno,
      esPropietario: true,
    };
  }

  const miembro = await db.tiendaUsuario.findFirst({
    where: { userId: user.id, activo: true },
    include: { tienda: { select: { id: true, nombre: true } } },
  });
  if (!miembro) return null;

  const propios = leerPermisos(miembro.permisos);
  return {
    tiendaId: miembro.tienda.id,
    nombre: miembro.tienda.nombre,
    rol: miembro.rol,
    permisos: propios.length > 0 ? propios : PERMISOS_POR_ROL[miembro.rol] ?? [],
    esPropietario: false,
  };
}

export function tienePermiso(acceso: AccesoTienda, permiso: string): boolean {
  return acceso.esPropietario || acceso.permisos.includes(permiso);
}

/**
 * Tienda completa del usuario: primero como dueño, y si no como miembro invitado.
 * Sustituye al viejo `db.tienda.findFirst({ where: { propietarioId: user.id } })`
 * en las rutas del portal, devolviendo la fila entera de `Tienda`.
 */
export async function buscarTiendaCompleta(user: SessionUser) {
  const propia = await db.tienda.findFirst({ where: { propietarioId: user.id } });
  if (propia) return propia;

  const miembro = await db.tiendaUsuario.findFirst({
    where: { userId: user.id, activo: true },
    include: { tienda: true },
  });
  return miembro?.tienda ?? null;
}

/** Códigos para cuando el acceso existe pero el rol no alcanza. */
export const SIN_PERMISO = { ok: false, error: 'Tu rol no tiene permiso para esta acción' };
