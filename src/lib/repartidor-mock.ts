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
export const MOCK_ORDEN_ACTIVA: OrdenActiva = {
  id: 'LF-2847',
  tipo: 'envio',
  cliente: 'María López',
  clienteTelefono: '+505 8888-1234',
  origen: 'Col. Los Robles, Managua',
  destino: 'Barrio Monseñor Lezcano',
  origenLat: 12.1289,
  origenLng: -86.2451,
  destinoLat: 12.1421,
  destinoLng: -86.2287,
  paquete: 'Documentos importantes',
  tamano: 'Pequeño',
  fragil: false,
  metodoPago: 'efectivo',
  monto: 120,
  ganancia: 45,
  kmEstimados: 3.2,
  tiempoEstimado: 12,
};

/* ─── Productos checklist (para órdenes de compra / pickup) ─── */
export const MOCK_PRODUCTOS_CHECKLIST: Record<string, ProductoChecklist[]> = {
  'LF-C002': [
    { id: 'p-c002-1', nombre: 'Acetaminofén x12', cantidad: 1, verificado: false },
    { id: 'p-c002-2', nombre: 'Vitamina C x30', cantidad: 1, verificado: false },
  ],
  'LF-C003': [
    { id: 'p-c003-1', nombre: 'Leche 1L', cantidad: 2, verificado: false },
    { id: 'p-c003-2', nombre: 'Arroz 1kg', cantidad: 1, verificado: false },
    { id: 'p-c003-3', nombre: 'Aceite 1L', cantidad: 1, verificado: false },
  ],
};

/* ─── Historial de servicios (hoy) ─── */
export const MOCK_SERVICIOS_HOY: ServicioHistorial[] = [
  {
    id: 'svc-2840',
    ordenId: 'LF-2840',
    tipo: 'envio',
    cliente: 'Pedro Ruiz',
    origen: 'Col. Los Robles',
    destino: 'Centro',
    hora: '08:15',
    kmRecorridos: 3.1,
    ganancia: 85,
    tiempoTotal: 18,
    estado: 'entregado',
    calificacion: 5,
  },
  {
    id: 'svc-2841',
    ordenId: 'LF-2841',
    tipo: 'compra',
    cliente: 'Laura Fernández',
    tiendaNombre: 'Pizza Express',
    origen: 'Pizza Express',
    destino: 'Villa Fontana',
    hora: '09:30',
    kmRecorridos: 4.2,
    ganancia: 45,
    tiempoTotal: 25,
    estado: 'entregado',
    calificacion: 5,
  },
  {
    id: 'svc-2842',
    ordenId: 'LF-2842',
    tipo: 'envio',
    cliente: 'Roberto Sáenz',
    origen: 'Bello Horizonte',
    destino: 'Monseñor Lezcano',
    hora: '11:00',
    kmRecorridos: 5.8,
    ganancia: 120,
    tiempoTotal: 32,
    estado: 'entregado',
    calificacion: 4,
  },
  {
    id: 'svc-2845',
    ordenId: 'LF-2845',
    tipo: 'compra',
    cliente: 'Sofía Vega',
    tiendaNombre: 'Farmacia San Pablo',
    origen: 'Farmacia San Pablo',
    destino: 'Los Robles',
    hora: '13:15',
    kmRecorridos: 2.1,
    ganancia: 35,
    tiempoTotal: 15,
    estado: 'entregado',
    calificacion: 5,
  },
  {
    id: 'svc-2838',
    ordenId: 'LF-2838',
    tipo: 'envio',
    cliente: 'Lucía Ramos',
    origen: 'Reparto San Juan',
    destino: 'Carretera Sur',
    hora: '18:40',
    kmRecorridos: 6.4,
    ganancia: 0,
    tiempoTotal: 28,
    estado: 'incidencia',
    incidenciaTipo: 'Falla mecánica',
  },
];

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
  hoy: { entregas: 4, km: 15.2, ganancias: 285, tiempoActivo: 245 },
  semana: { entregas: 38, km: 142.5, ganancias: 2780, tiempoActivo: 1820 },
  mes: { entregas: 156, km: 589.3, ganancias: 11250, tiempoActivo: 7340 },
};

export const MOCK_STATS_TRENDS: Record<
  'hoy' | 'semana' | 'mes',
  { entregas: number; km: number; ganancias: number; tiempoActivo: number }
> = {
  hoy: { entregas: 12, km: 8, ganancias: 15, tiempoActivo: 5 },
  semana: { entregas: 6, km: 4, ganancias: 9, tiempoActivo: -2 },
  mes: { entregas: 18, km: 14, ganancias: 22, tiempoActivo: 10 },
};

/* ─── Calificaciones ─── */
export const MOCK_CALIFICACIONES: CalificacionRepartidor[] = [
  {
    id: 'cal-1',
    ordenId: 'LF-2840',
    cliente: 'Pedro Ruiz',
    estrellas: 5,
    etiquetas: ['Rápido', 'Amable'],
    comentario: 'Muy rápido y amable',
    fecha: 'hace 1 hora',
  },
  {
    id: 'cal-2',
    ordenId: 'LF-2835',
    cliente: 'Ana Rivera',
    estrellas: 4,
    etiquetas: ['Buena ubicación'],
    comentario: null,
    fecha: 'hace 3 horas',
  },
  {
    id: 'cal-3',
    ordenId: 'LF-2830',
    cliente: 'María López',
    estrellas: 5,
    etiquetas: ['Cuidadoso'],
    comentario: 'Cuidadoso con el paquete',
    fecha: 'ayer',
  },
  {
    id: 'cal-4',
    ordenId: 'LF-2820',
    cliente: 'Laura Mendoza',
    estrellas: 3,
    etiquetas: ['Tardó mucho'],
    comentario: 'Se tardó 10 min más',
    fecha: 'ayer',
  },
  {
    id: 'cal-5',
    ordenId: 'LF-2815',
    cliente: 'Carlos Altamirano',
    estrellas: 5,
    etiquetas: ['Excelente servicio'],
    comentario: null,
    fecha: 'hace 2 días',
  },
];

/* ─── Notificaciones ─── */
export const MOCK_NOTIFICACIONES: NotificacionRepartidor[] = [
  {
    id: 'ntf-1',
    tipo: 'orden_asignada',
    titulo: 'Nueva orden asignada',
    contenido: 'LF-2847 — Envío de paquete',
    leido: false,
    ordenId: 'LF-2847',
    tiempo: 'hace 20 min',
  },
  {
    id: 'ntf-2',
    tipo: 'mensaje',
    titulo: 'Mensaje de María López',
    contenido: 'Ok, estoy en la puerta',
    leido: false,
    ordenId: 'LF-2847',
    tiempo: 'hace 15 min',
  },
  {
    id: 'ntf-3',
    tipo: 'entrega_calificada',
    titulo: 'Tu entrega LF-2845 fue calificada',
    contenido: '5 estrellas — Farmacia San Pablo',
    leido: true,
    ordenId: 'LF-2845',
    tiempo: 'hace 1 hora',
  },
  {
    id: 'ntf-4',
    tipo: 'incidencia',
    titulo: 'Incidencia registrada',
    contenido: 'LF-2838 — Falla mecánica',
    leido: true,
    ordenId: 'LF-2838',
    tiempo: 'ayer',
  },
];

/* ─── Chat ─── */
export const MOCK_CHAT: ChatMensaje[] = [
  {
    id: 'msg-1',
    ordenId: 'LF-2847',
    emisor: 'cliente',
    contenido: 'Hola, ¿ya vas en camino?',
    enviadoEn: '14:25',
  },
  {
    id: 'msg-2',
    ordenId: 'LF-2847',
    emisor: 'repartidor',
    contenido: 'Sí, ya recogí el paquete. Llego en unos 10 min.',
    enviadoEn: '14:26',
  },
  {
    id: 'msg-3',
    ordenId: 'LF-2847',
    emisor: 'cliente',
    contenido: 'Ok, estoy en la puerta',
    enviadoEn: '14:30',
  },
];

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
