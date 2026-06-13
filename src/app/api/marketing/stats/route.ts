import { NextResponse } from 'next/server';

// Mock marketing analytics data matching the MarketingKPI interface
export async function GET() {
  try {
    const stats = {
      clientesActivosMes: 87,
      tendenciaActivos: 12,
      tasaRetencion: 68,
      frecuenciaPromedio: 3.2,
      valorPromedioEnvio: 145,
      costoAdquisicion: 35,

      adquisicionData: [
        { semana: 'Sem 1', nuevos: 5 },
        { semana: 'Sem 2', nuevos: 8 },
        { semana: 'Sem 3', nuevos: 6 },
        { semana: 'Sem 4', nuevos: 12 },
        { semana: 'Sem 5', nuevos: 9 },
        { semana: 'Sem 6', nuevos: 14 },
        { semana: 'Sem 7', nuevos: 7 },
        { semana: 'Sem 8', nuevos: 11 },
        { semana: 'Sem 9', nuevos: 15 },
        { semana: 'Sem 10', nuevos: 10 },
        { semana: 'Sem 11', nuevos: 13 },
        { semana: 'Sem 12', nuevos: 18 },
      ],

      retencionData: [
        { mes: 'Jul', retencion: 62 },
        { mes: 'Ago', retencion: 65 },
        { mes: 'Sep', retencion: 68 },
        { mes: 'Oct', retencion: 71 },
        { mes: 'Nov', retencion: 66 },
        { mes: 'Dic', retencion: 68 },
      ],

      frecuenciaData: [
        { rango: '1 envío', clientes: 34 },
        { rango: '2-3 envíos', clientes: 28 },
        { rango: '4-5 envíos', clientes: 18 },
        { rango: '6+ envíos', clientes: 7 },
      ],

      revenueSegmento: [
        { segmento: 'VIP', revenue: 12500 },
        { segmento: 'Frecuentes', revenue: 8900 },
        { segmento: 'Nuevos', revenue: 3200 },
        { segmento: 'Inactivos', revenue: 800 },
      ],

      campanaEfectividad: [
        { nombre: 'Bienvenida Nuevo Cliente', abiertos: 78, clicks: 42, enviados: 120 },
        { nombre: 'Promo Fin de Semana', abiertos: 65, clicks: 38, enviados: 250 },
        { nombre: 'Reactivación Inactivos', abiertos: 45, clicks: 18, enviados: 80 },
        { nombre: 'VIP Exclusive', abiertos: 82, clicks: 56, enviados: 45 },
      ],

      codigosUso: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dia = date.toISOString().split('T')[0];
        return { dia, usos: Math.floor(Math.random() * 15) + 2 };
      }),
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('[MARKETING_STATS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas de marketing' }, { status: 500 });
  }
}
