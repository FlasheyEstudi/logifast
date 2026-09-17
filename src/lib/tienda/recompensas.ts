import type { PrismaClient } from '@prisma/client';

/**
 * #4 — Recompensa por 5 compras en el mes.
 *
 * El contador es por mes calendario y **cada mes estrena su propio código**
 * (`RECOMPENSA-AAAA-MM`), así que el mes siguiente no arrastra el conteo del
 * anterior. Es idempotente: la restricción única [clienteId, codigoPromo] impide
 * entregar la misma recompensa dos veces.
 */

const TITULO = 'Recompensa por 5 compras';
const DESCUENTO_PORCENTAJE = 10;
const COMPRAS_POR_RECOMPENSA = 5;

export function codigoRecompensaDelMes(fecha = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `RECOMPENSA-${fecha.getFullYear()}-${mes}`;
}

export interface RecompensaOtorgada {
  codigo: string;
  titulo: string;
  descripcion: string;
  valor: number;
  tipoDescuento: string;
  vigenciaFin: string;
  comprasDelMes: number;
}

/**
 * Otorga (una sola vez) la recompensa del mes al cliente.
 * Devuelve null si ya la tenía — en ese caso no se vuelve a otorgar.
 */
export async function otorgarRecompensaMensual(
  db: PrismaClient,
  clienteId: string,
  comprasDelMes: number,
  fecha = new Date()
): Promise<RecompensaOtorgada | null> {
  if (comprasDelMes < COMPRAS_POR_RECOMPENSA || comprasDelMes % COMPRAS_POR_RECOMPENSA !== 0) {
    return null;
  }

  const codigo = codigoRecompensaDelMes(fecha);
  const yaLaTiene = await db.cuponCliente.findUnique({
    where: { clienteId_codigoPromo: { clienteId, codigoPromo: codigo } },
  });
  if (yaLaTiene) return null;

  // El cupón que respalda la recompensa: porcentaje sobre el subtotal, sin mínimo y
  // usable en cualquier tienda (los cupones de tienda son otra cosa, #6).
  const vigenciaInicio = new Date(fecha);
  const vigenciaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 2, 0, 23, 59, 59);

  await db.codigoPromocional.upsert({
    where: { codigo },
    update: { estado: 'activo' },
    create: {
      codigo,
      tipoDescuento: 'porcentaje',
      valor: DESCUENTO_PORCENTAJE,
      aplicableA: 'ambos',
      tipoServicio: 'ambos',
      maxUsos: 0,
      usosActuales: 0,
      segmento: 'todos',
      vigenciaInicio,
      vigenciaFin,
      estado: 'activo',
      creadoPor: 'sistema-recompensas',
    },
  });

  const descripcion = `${DESCUENTO_PORCENTAJE}% de descuento por tus ${comprasDelMes} compras de este mes`;

  await db.cuponCliente.create({
    data: {
      clienteId,
      codigoPromo: codigo,
      titulo: TITULO,
      descripcion,
      tipoDescuento: 'porcentaje',
      valor: DESCUENTO_PORCENTAJE,
      estado: 'disponible',
    },
  });

  return {
    codigo,
    titulo: TITULO,
    descripcion,
    valor: DESCUENTO_PORCENTAJE,
    tipoDescuento: 'porcentaje',
    vigenciaFin: vigenciaFin.toISOString(),
    comprasDelMes,
  };
}

export const RECOMPENSA_CONFIG = { COMPRAS_POR_RECOMPENSA, DESCUENTO_PORCENTAJE, TITULO };
