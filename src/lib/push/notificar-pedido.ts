/**
 * ENVÍO DE PUSH REAL — la pieza que faltaba en el backend.
 *
 * El proyecto ya tenía `NotificacionPush` (bandeja interna del cliente) y
 * `emitirEventoRealtime` (Socket.IO). Ninguno de los dos despierta un teléfono con
 * la app cerrada. Aquí se añade el tercer canal: FCM.
 *
 * CÓMO FUNCIONA
 *  1. El dispositivo guarda su token en `DeviceToken` (ver `/api/device-token`).
 *  2. Cuando cambia el estado de un pedido, `enviarPushPedido` busca los tokens del
 *     cliente y llama a FCM con la clave del servidor.
 *  3. El push lleva `ordenId`, `estado` y `vista` en `data`, que es lo que la app usa
 *     para abrir el tracking exacto al tocarlo.
 *
 * LO QUE FALTA CONFIGURAR (no se inventa):
 *  - `FCM_SERVICE_ACCOUNT_JSON`: la credencial de servicio de Firebase (servidor).
 *  - `google-services.json` dentro de cada proyecto Android (cliente).
 *  Sin esas dos cosas, la función registra el aviso y NO envía nada: el resto del
 *  sistema (socket en primer plano + bandeja interna) sigue funcionando igual.
 */
import { db } from '@/lib/db';
import { enviarEventoPush, pushConfigurado } from './fcm';

export interface EventoPedido {
  userId: string;
  ordenId: string;
  estado: string;
  titulo: string;
  cuerpo: string;
  /** A dónde debe llevar el toque. */
  vista?: 'tracking' | 'chat' | 'servicio' | 'pedidos';
  canal?: 'logifast_urgente' | 'logifast_estado' | 'logifast_pedidos';
  tipoAlerta?: 'orden' | 'exito' | 'mensaje' | 'alerta';
}

/**
 * Deduplicación en el BACKEND: el servidor es la fuente de verdad.
 *
 * Un reintento del cliente, una reconexión del socket o dos llamadas seguidas al
 * mismo cambio de estado NO deben producir varios avisos del mismo hecho. Se guarda
 * una marca en `NotificacionPush` (tipo `push_estado`) y se reutiliza si el mismo
 * pedido ya pasó por ese estado hace poco.
 */
const VENTANA_DEDUPE_MS = 15 * 60 * 1000;

async function yaEnviado(ordenId: string, estado: string, userId: string): Promise<boolean> {
  const desde = new Date(Date.now() - VENTANA_DEDUPE_MS);
  const previo = await db.notificacionPush
    .findFirst({
      where: {
        userId,
        tipo: 'push_estado',
        entidadId: ordenId,
        contenido: { contains: `[${estado}]` },
        createdAt: { gte: desde },
      },
      select: { id: true },
    })
    .catch(() => null);
  return !!previo;
}

async function marcarEnviado(ordenId: string, estado: string, userId: string, titulo: string, cuerpo: string): Promise<void> {
  await db.notificacionPush
    .create({
      data: {
        userId,
        titulo,
        contenido: `[${estado}] ${cuerpo}`.slice(0, 400),
        tipo: 'push_estado',
        entidadId: ordenId,
        leida: false,
      },
    })
    .catch(() => null);
}

/**
 * Notifica un cambio de estado de pedido.
 * Devuelve cuántos dispositivos quedaron alcanzables (0 si no hay push configurado).
 */
export async function enviarPushPedido(evento: EventoPedido): Promise<{ enviados: number; motivo?: string }> {
  try {
    if (await yaEnviado(evento.ordenId, evento.estado, evento.userId)) {
      return { enviados: 0, motivo: 'ya notificado' };
    }

    const tokens = await db.deviceToken
      .findMany({
        where: { userId: evento.userId, activo: true },
        select: { token: true },
        take: 5,
      })
      .catch(() => [] as { token: string }[]);

    // La bandeja interna SIEMPRE se llena: es la que ve el cliente al abrir la app.
    await marcarEnviado(evento.ordenId, evento.estado, evento.userId, evento.titulo, evento.cuerpo);

    if (tokens.length === 0) {
      return { enviados: 0, motivo: 'sin dispositivos registrados' };
    }

    if (!pushConfigurado()) {
      // Se deja constancia honesta: el aviso quedó en la bandeja, pero el teléfono
      // cerrado no lo verá hasta que se configure Firebase.
      return { enviados: 0, motivo: 'FCM no configurado' };
    }

    const resultado = await enviarEventoPush(
      tokens.map((t) => t.token),
      {
        title: evento.titulo,
        body: evento.cuerpo,
        data: {
          ordenId: evento.ordenId,
          estado: evento.estado,
          vista: evento.vista || 'tracking',
          tipo: 'orden',
        },
        canal: evento.canal || 'logifast_urgente',
      }
    );

    return { enviados: resultado.enviados, motivo: resultado.motivo };
  } catch (error) {
    console.error('[PUSH_PEDIDO]', error);
    return { enviados: 0, motivo: 'error interno' };
  }
}

/** Tabla de textos por estado: una sola fuente para socket, bandeja y push. */
export const MENSAJE_ESTADO: Record<string, { titulo: string; cuerpo: string; alerta: EventoPedido['tipoAlerta'] }> = {
  recibido: { titulo: 'Pedido confirmado', cuerpo: 'Tu pedido llegó a la tienda.', alerta: 'orden' },
  preparando: { titulo: 'Tu pedido está en preparación', cuerpo: 'La tienda ya está preparando tu pedido.', alerta: 'orden' },
  listo: { titulo: 'Tu pedido está listo', cuerpo: 'La tienda terminó de preparar tu pedido.', alerta: 'orden' },
  en_camino: { titulo: 'Tu pedido va en camino', cuerpo: 'El repartidor va hacia tu dirección.', alerta: 'orden' },
  aceptado: { titulo: 'Repartidor asignado', cuerpo: 'Un repartidor tomó tu pedido.', alerta: 'orden' },
  recogido: { titulo: 'Tu pedido fue recogido', cuerpo: 'El repartidor ya salió con tu pedido.', alerta: 'orden' },
  entregado: { titulo: 'Pedido entregado', cuerpo: 'Tu pedido fue entregado. ¡Buen provecho!', alerta: 'exito' },
  cancelado: { titulo: 'Pedido cancelado', cuerpo: 'Tu pedido fue cancelado.', alerta: 'alerta' },
  incidencia: { titulo: 'Incidencia con tu pedido', cuerpo: 'Reportaron un contratiempo. Soporte está en eso.', alerta: 'alerta' },
};
