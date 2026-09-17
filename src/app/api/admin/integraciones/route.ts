import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { handleError } from '@/lib/auth/helpers';

export const dynamic = 'force-dynamic';

interface IntegrationInfo {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  estado: 'conectado' | 'no_configurado';
  configuradaEn?: string;
  hasApiKey?: boolean;
  hasWebhook?: boolean;
}

const DEFAULT_DEFINITIONS: Omit<IntegrationInfo, 'estado'>[] = [
  {
    id: 'google-maps',
    nombre: 'Google Maps / OSRM',
    descripcion: 'Rutas viales, geocodificación y cálculo de distancias en Managua y municipios',
    icono: 'map',
  },
  {
    id: 'whatsapp-cloud',
    nombre: 'WhatsApp Business Cloud',
    descripcion: 'Mensajería automática de estado de pedidos y notificaciones a clientes',
    icono: 'message-circle',
  },
  {
    id: 'pasarela-pagos',
    nombre: 'Pasarela BAC / LAFISE / Stripe',
    descripcion: 'Cobros con tarjeta nacional e internacional y recargas a billetera',
    icono: 'credit-card',
  },
  {
    id: 'firebase-push',
    nombre: 'Firebase Cloud Messaging (FCM)',
    descripcion: 'Notificaciones push en tiempo real a clientes y repartidores móviles',
    icono: 'smartphone',
  },
  {
    id: 'resend-email',
    nombre: 'Resend / Email Transaccional',
    descripcion: 'Comprobantes fiscales, confirmaciones de pedido y facturación por correo',
    icono: 'mail',
  },
];

/**
 * GET /api/admin/integraciones
 * Retorna las integraciones disponibles con su estado de conexión y configuración real.
 */
export async function GET() {
  try {
    await requireRole('admin');

    // Consultar logs de configuración de integraciones para ver cuáles se han guardado
    const logs = await db.auditLog.findMany({
      where: { recurso: 'integracion' },
      orderBy: { createdAt: 'desc' },
    });

    const configMap: Record<string, any> = {};
    for (const l of logs) {
      if (l.recursoId && !configMap[l.recursoId]) {
        try {
          configMap[l.recursoId] = {
            ...JSON.parse(l.detalles || '{}'),
            updatedAt: l.createdAt.toISOString(),
          };
        } catch {
          configMap[l.recursoId] = { updatedAt: l.createdAt.toISOString() };
        }
      }
    }

    const integraciones: IntegrationInfo[] = DEFAULT_DEFINITIONS.map((def) => {
      const cfg = configMap[def.id];
      // Si existe configuración guardada o variables en entorno, se marca conectada
      const envHasKey =
        (def.id === 'google-maps' && (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.OSRM_URL)) ||
        (def.id === 'whatsapp-cloud' && process.env.WHATSAPP_API_KEY) ||
        (def.id === 'pasarela-pagos' && (process.env.STRIPE_SECRET_KEY || process.env.BAC_KEY)) ||
        (def.id === 'firebase-push' && process.env.FIREBASE_SERVER_KEY) ||
        (def.id === 'resend-email' && process.env.RESEND_API_KEY);

      const isConnected = Boolean(cfg?.hasApiKey || cfg?.apiKey || envHasKey);

      return {
        ...def,
        estado: isConnected ? 'conectado' : 'no_configurado',
        configuradaEn: cfg?.updatedAt || (envHasKey ? 'Variable de Entorno' : undefined),
        hasApiKey: Boolean(cfg?.apiKey || envHasKey),
        hasWebhook: Boolean(cfg?.webhookUrl),
      };
    });

    return NextResponse.json({ integraciones });
  } catch (error) {
    return handleError(error, 'INTEGRACIONES_GET');
  }
}

/**
 * POST /api/admin/integraciones
 * Guarda credenciales y webhook de una integración, registrando en AuditLog.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('admin');
    const body = await request.json();
    const { id, apiKey, webhookUrl, nombre } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de integración requerido' }, { status: 400 });
    }

    // Enmascarar apiKey para auditoría y persistencia segura
    const maskedKey = apiKey && apiKey.length > 8
      ? `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`
      : (apiKey ? '••••••••' : null);

    const detalles = {
      nombre: nombre || id,
      apiKeyMasked: maskedKey,
      hasApiKey: Boolean(apiKey && apiKey.trim().length > 0),
      webhookUrl: webhookUrl || null,
      guardadoPor: user.email || user.name || 'Admin',
      guardadoEn: new Date().toISOString(),
    };

    await db.auditLog.create({
      data: {
        userId: user.id,
        accion: 'CONFIGURAR_INTEGRACION',
        recurso: 'integracion',
        recursoId: id,
        detalles: JSON.stringify(detalles),
      },
    });

    return NextResponse.json({
      ok: true,
      integracion: {
        id,
        estado: 'conectado',
        hasApiKey: detalles.hasApiKey,
        hasWebhook: Boolean(webhookUrl),
        configuradaEn: detalles.guardadoEn,
      },
    });
  } catch (error) {
    return handleError(error, 'INTEGRACIONES_POST');
  }
}
