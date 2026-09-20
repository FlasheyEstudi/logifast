/**
 * CLIENTE FCM (HTTP v1) — sin SDK ni dependencia nueva.
 *
 * Se eligió HTTP v1 contra la API REST de Firebase en vez de `firebase-admin`
 * porque:
 *  - el proyecto NO tiene esa dependencia y la regla es no añadir librerías porque sí;
 *  - HTTP v1 expone exactamente lo que necesitamos (`messages:send`) con `fetch`.
 *
 * La credencial se lee de `FCM_SERVICE_ACCOUNT_JSON` (el JSON completo de la cuenta
 * de servicio). Si no está, `pushConfigurado()` devuelve false y el sistema avisa
 * con honestidad en vez de fingir que envió algo.
 */
import { createSign } from 'node:crypto';

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
}

export interface MensajePush {
  title: string;
  body: string;
  data?: Record<string, string>;
  canal?: string;
}

let cacheToken: { valor: string; expira: number } | null = null;

/** ¿Hay credencial de FCM disponible en el entorno? */
export function pushConfigurado(): boolean {
  const crudo = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!crudo) return false;
  try {
    const acc = JSON.parse(crudo) as ServiceAccount;
    return !!(acc.client_email && acc.private_key && acc.project_id);
  } catch {
    return false;
  }
}

function leerCuenta(): ServiceAccount | null {
  const crudo = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!crudo) return null;
  try {
    const acc = JSON.parse(crudo) as ServiceAccount;
    if (!acc.client_email || !acc.private_key || !acc.project_id) return null;
    // En variables de entorno los saltos de línea suelen venir escapados.
    acc.private_key = acc.private_key.replace(/\\n/g, '\n');
    return acc;
  } catch {
    return null;
  }
}

/** Token OAuth2 de la cuenta de servicio (JWT firmado → access_token). */
async function accessToken(): Promise<string | null> {
  if (cacheToken && cacheToken.expira > Date.now() + 60_000) return cacheToken.valor;

  const acc = leerCuenta();
  if (!acc) return null;

  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: acc.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: acc.token_uri || 'https://oauth2.googleapis.com/token',
    iat: ahora,
    exp: ahora + 3600,
  };

  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const sinFirma = `${b64(cabecera)}.${b64(payload)}`;

  try {
    const firma = createSign('RSA-SHA256').update(sinFirma).sign(acc.private_key).toString('base64url');
    const jwt = `${sinFirma}.${firma}`;

    const res = await fetch(payload.aud, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    if (!res.ok) {
      console.warn('[FCM] no se pudo obtener el token de servicio:', res.status);
      return null;
    }
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    cacheToken = {
      valor: data.access_token,
      expira: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return cacheToken.valor;
  } catch (err) {
    console.warn('[FCM] firma del JWT falló:', err);
    return null;
  }
}

/**
 * Envía el mismo mensaje a varios tokens. Los tokens inválidos se marcan inactivos
 * en la base para no reintentar contra un aparato que ya no existe.
 */
export async function enviarEventoPush(
  tokens: string[],
  mensaje: MensajePush
): Promise<{ enviados: number; fallidos: number; motivo?: string }> {
  const acc = leerCuenta();
  if (!acc) return { enviados: 0, fallidos: tokens.length, motivo: 'sin credencial FCM' };

  const token = await accessToken();
  if (!token) return { enviados: 0, fallidos: tokens.length, motivo: 'sin token de servicio' };

  const endpoint = `https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`;
  let enviados = 0;
  let fallidos = 0;
  const invalidos: string[] = [];

  for (const destino of tokens) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: destino,
            notification: { title: mensaje.title, body: mensaje.body },
            data: mensaje.data || {},
            android: {
              priority: 'HIGH',
              notification: {
                channel_id: mensaje.canal || 'logifast_urgente',
                icon: 'ic_stat_logifast',
                color: '#007AFF',
                sound: 'default',
              },
            },
          },
        }),
      });

      if (res.ok) {
        enviados++;
      } else {
        fallidos++;
        const err = await res.text().catch(() => '');
        // 404/400 con UNREGISTERED o INVALID_ARGUMENT = el aparato ya no existe.
        if (err.includes('UNREGISTERED') || err.includes('INVALID_ARGUMENT') || res.status === 404) {
          invalidos.push(destino);
        }
      }
    } catch {
      fallidos++;
    }
  }

  if (invalidos.length) {
    // Limpieza perezosa: se apagan los tokens muertos sin borrarlos (historial).
    const { db } = await import('@/lib/db');
    await db.deviceToken
      .updateMany({ where: { token: { in: invalidos } }, data: { activo: false } })
      .catch(() => null);
  }

  return { enviados, fallidos };
}
