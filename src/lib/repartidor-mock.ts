/* ═══════════════════════════════════════════════════════
   LOGIFAST — Mock data + in-memory state for repartidor APIs
   Mirrors the shape of /src/lib/repartidor-store.ts so the
   frontend store and the API stay in sync.
   Mock repartidor ID: "rep001"
   ═══════════════════════════════════════════════════════ */

import type {
  RepartidorProfile,
  MotoAsignada,
  OrdenActiva,
  ServicioHistorial,
  CalificacionRepartidor,
  NotificacionRepartidor,
  ChatMensaje,
  ProductoChecklist,
  RepartidorEstado,
  StatsRepartidor,
} from './repartidor-store';

export const REPARTIDOR_ID = 'rep001';

/* ─── Perfil ─── */
export const MOCK_PERFIL: RepartidorProfile = {
  id: REPARTIDOR_ID,
  nombre: 'Carlos Martínez',
  email: 'repartidor@logifast.com',
  telefono: '+505 8765-4321',
  initials: 'CM',
  color: '#FF5722',
  motoId: 'moto03',
  zonaPreferida: 'Centro',
  calificacion: 4.8,
  totalEntregas: 287,
  totalKm: 4521.3,
  totalGanancias: 48750,
  tiempoPromedio: 22,
  sonidoActivo: true,
  vibracionActiva: true,
  ubicacionActiva: true,
  saldo: 450,
  contratoAceptado: true,
  recargas: [],
};

/* ─── Moto asignada ─── */
export const MOCK_MOTO: MotoAsignada = {
  id: 'moto03',
  nombre: 'Moto-03',
  modelo: 'Honda Wave 110',
  placa: 'M-4521',
  kmAcumulados: 12450,
  estado: 'DISPONIBLE',
  ultimoMantenimiento: '2025-05-20',
  tipoUltimoMantenimiento: 'Cambio de aceite',
  proximoMantenimientoKm: 13500,
  alertaMantenimiento: false,
};

/* ─── Orden activa ─── */
export const MOCK_ORDEN_ACTIVA: OrdenActiva | null = null;

/* ─── Productos checklist (para órdenes de compra / pickup) ─── */
export const MOCK_PRODUCTOS_CHECKLIST: Record<string, ProductoChecklist[]> = {};

/* ─── Historial de servicios (hoy) ─── */
export const MOCK_SERVICIOS_HOY: ServicioHistorial[] = [];

/* ─── Detalle enriquecido de un servicio por ID ─── */
export const MOCK_SERVICIOS_DETALLE: Record<
  string,
  ServicioHistorial & {
    fecha: string;
    metodoPago: 'efectivo' | 'transferencia';
    monto: number;
    clienteTelefono: string;
    calificacionComentario?: string | null;
  }
> = {
  'LF-2840': {
    ...MOCK_SERVICIOS_HOY[0],
    fecha: '2026-06-10',
    metodoPago: 'efectivo',
    monto: 120,
    clienteTelefono: '+505 8765-1010',
    calificacionComentario: 'Muy rápido y amable',
  },
  'LF-2841': {
    ...MOCK_SERVICIOS_HOY[1],
    fecha: '2026-06-10',
    metodoPago: 'transferencia',
    monto: 225,
    clienteTelefono: '+505 8765-2020',
    calificacionComentario: null,
  },
  'LF-2842': {
    ...MOCK_SERVICIOS_HOY[2],
    fecha: '2026-06-10',
    metodoPago: 'efectivo',
    monto: 180,
    clienteTelefono: '+505 8765-3030',
    calificacionComentario: 'Todo bien',
  },
  'LF-2845': {
    ...MOCK_SERVICIOS_HOY[3],
    fecha: '2026-06-10',
    metodoPago: 'transferencia',
    monto: 135,
    clienteTelefono: '+505 8765-4040',
    calificacionComentario: 'Excelente servicio',
  },
  'LF-2838': {
    ...MOCK_SERVICIOS_HOY[4],
    fecha: '2026-06-10',
    metodoPago: 'efectivo',
    monto: 110,
    clienteTelefono: '+505 8765-5050',
  },
  'LF-2847': {
    id: 'svc-2847',
    ordenId: 'LF-2847',
    tipo: 'envio',
    cliente: 'María López',
    origen: 'Col. Los Robles, Managua',
    destino: 'Barrio Monseñor Lezcano',
    hora: '14:25',
    kmRecorridos: 3.2,
    ganancia: 45,
    tiempoTotal: 12,
    estado: 'entregado',
    calificacion: 5,
    fecha: '2026-06-10',
    metodoPago: 'efectivo',
    monto: 120,
    clienteTelefono: '+505 8888-1234',
    calificacionComentario: 'Cuidadoso con el paquete',
  },
};

/* ─── Stats ─── */
export const MOCK_STATS: Record<'hoy' | 'semana' | 'mes', StatsRepartidor> = {
  hoy: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
  semana: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
  mes: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
};

export const MOCK_STATS_TRENDS: Record<
  'hoy' | 'semana' | 'mes',
  { entregas: number; km: number; ganancias: number; tiempoActivo: number }
> = {
  hoy: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
  semana: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
  mes: { entregas: 0, km: 0, ganancias: 0, tiempoActivo: 0 },
};

/* ─── Calificaciones ─── */
export const MOCK_CALIFICACIONES: CalificacionRepartidor[] = [];

/* ─── Notificaciones ─── */
export const MOCK_NOTIFICACIONES: NotificacionRepartidor[] = [];

/* ─── Chat ─── */
export const MOCK_CHAT: ChatMensaje[] = [];

/* ═══════════════════════════════════════════════════════
   IN-MEMORY RUNTIME STATE
   (For stateful mock mutations: conexion, rechazos,
    estado de orden activa, última posición, etc.)
   ═══════════════════════════════════════════════════════ */

interface RepartidorRuntimeState {
  conectado: boolean;
  estado: RepartidorEstado;
  enServicio: boolean;
  pausado: boolean;
  pausaHasta: number | null;
  rechazosHora: number;
  rechazosResetEn: number;
  ordenActiva: OrdenActiva | null;
  ordenActivaEstado: 'asignado' | 'aceptado' | 'recogido' | 'entregado' | 'incidencia' | 'cancelado';
  kmRecorridos: number;
  ultimaPosicion: { lat: number; lng: number; timestamp: number };
  notificaciones: NotificacionRepartidor[];
  chat: ChatMensaje[];
  serviciosHoy: ServicioHistorial[];
  perfil: RepartidorProfile;
  moto: MotoAsignada;
}

const now = Date.now();

export const runtimeState: RepartidorRuntimeState = {
  conectado: false,
  estado: 'DESCONECTADO',
  enServicio: false,
  pausado: false,
  pausaHasta: null,
  rechazosHora: 0,
  rechazosResetEn: now + 3600_000,
  ordenActiva: null,
  ordenActivaEstado: 'asignado',
  kmRecorridos: 0,
  ultimaPosicion: { lat: 12.1364, lng: -86.2581, timestamp: now },
  notificaciones: [...MOCK_NOTIFICACIONES],
  chat: [...MOCK_CHAT],
  serviciosHoy: [...MOCK_SERVICIOS_HOY],
  perfil: { ...MOCK_PERFIL },
  moto: { ...MOCK_MOTO },
};

/* Helper: devolver el "estado" calculado según conexión */
export function calcularEstado(): RepartidorEstado {
  if (!runtimeState.conectado) return 'DESCONECTADO';
  if (runtimeState.ordenActiva) {
    switch (runtimeState.ordenActivaEstado) {
      case 'asignado':
        return 'ORDEN_ASIGNADA';
      case 'aceptado':
        return 'EN_CAMINO_RECOGER';
      case 'recogido':
        return 'RECOGIDO';
      case 'incidencia':
        return 'INCIDENCIA';
      default:
        return 'EN_LINEA';
    }
  }
  return 'EN_LINEA';
}
