import { create } from 'zustand';
import { reproducirSiActivo, vibrarSiActivo, type SonidoTipo } from '@/services/audio';
import { useConfigStore } from '@/store/configStore';
import { realtime } from '@/services/realtime';

/* ═══════════════════════════════════════════════════════
   AUDIO + VIBRATION FEEDBACK HELPER
   ═══════════════════════════════════════════════════════ */

/**
 * Reads the current configStore snapshot and triggers a sound + optional
 * vibration pattern. SSR-safe (no-op on the server) and fully wrapped in
 * try/catch so a sound/vibration failure never breaks the state transition.
 *
 * Pass `patron === null` to skip vibration (used for subtle confirms like
 * enviarMensaje where haptic feedback would be too noisy).
 */
function dispararFeedback(
  sonido: SonidoTipo,
  patron: number | number[] | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    const cfg = useConfigStore.getState();
    reproducirSiActivo(sonido, {
      sonidoActivo: cfg.sonidoActivo,
      volumenSonido: cfg.volumenSonido,
      notificacionesSonido: cfg.notificacionesSonido,
    });
    if (patron !== null) {
      vibrarSiActivo(patron, cfg.vibracionActiva);
    }
  } catch (err) {
    console.warn('repartidor-store: audio/vibration feedback failed', err);
  }
}

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

export type RepartidorEstado =
  | 'DESCONECTADO'
  | 'EN_LINEA'
  | 'ORDEN_ASIGNADA'
  | 'EN_CAMINO_RECOGER'
  | 'EN_PUNTO_RECOGIDA'
  | 'RECOGIDO'
  | 'EN_PUNTO_ENTREGA'
  | 'INCIDENCIA';

export type TipoServicio = 'envio' | 'compra';
export type EstadoServicio = 'asignado' | 'aceptado' | 'recogido' | 'entregado' | 'incidencia' | 'cancelado';
export type TipoIncidencia = 'mecanica' | 'cliente' | 'accidente' | 'otro';

export interface RepartidorProfile {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  initials: string;
  color: string;
  motoId: string;
  zonaPreferida: string;
  calificacion: number;
  totalEntregas: number;
  totalKm: number;
  totalGanancias: number;
  tiempoPromedio: number;
  sonidoActivo: boolean;
  vibracionActiva: boolean;
  ubicacionActiva: boolean;
}

export interface MotoAsignada {
  id: string;
  nombre: string;
  modelo: string;
  placa: string;
  kmAcumulados: number;
  estado: 'DISPONIBLE' | 'EN_SERVICIO' | 'MANTENIMIENTO';
  ultimoMantenimiento: string;
  tipoUltimoMantenimiento: string;
  proximoMantenimientoKm: number | null;
  alertaMantenimiento: boolean;
}

export interface ProductoChecklist {
  id: string;
  nombre: string;
  cantidad: number;
  verificado: boolean;
}

export interface OrdenActiva {
  id: string;
  tipo: TipoServicio;
  cliente: string;
  clienteTelefono: string;
  tiendaNombre?: string;
  origen: string;
  destino: string;
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  paquete?: string;
  tamano?: string;
  fragil?: boolean;
  metodoPago: 'efectivo' | 'transferencia';
  monto: number;
  ganancia: number;
  kmEstimados: number;
  tiempoEstimado: number;
  productos?: ProductoChecklist[];
}

export interface ServicioHistorial {
  id: string;
  ordenId: string;
  tipo: TipoServicio;
  cliente: string;
  tiendaNombre?: string;
  origen: string;
  destino: string;
  hora: string;
  kmRecorridos: number;
  ganancia: number;
  tiempoTotal: number;
  estado: 'entregado' | 'incidencia';
  incidenciaTipo?: string;
  calificacion?: number;
}

export interface StatsRepartidor {
  entregas: number;
  km: number;
  ganancias: number;
  tiempoActivo: number; // minutos
}

export interface CalificacionRepartidor {
  id: string;
  ordenId: string;
  cliente: string;
  estrellas: number;
  etiquetas: string[];
  comentario: string | null;
  fecha: string;
}

export interface NotificacionRepartidor {
  id: string;
  tipo: 'orden_asignada' | 'mensaje' | 'entrega_calificada' | 'incidencia' | 'cancelacion' | 'reasignacion';
  titulo: string;
  contenido: string;
  leido: boolean;
  ordenId?: string;
  tiempo: string;
}

export interface ChatMensaje {
  id: string;
  ordenId: string;
  emisor: 'repartidor' | 'cliente';
  contenido: string;
  enviadoEn: string;
}

/* ═══════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════ */

const MOCK_PERFIL: RepartidorProfile = {
  id: 'rep001',
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

const MOCK_MOTO: MotoAsignada = {
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

const MOCK_SERVICIOS_HOY: ServicioHistorial[] = [
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
];

const MOCK_ORDEN_ACTIVA: OrdenActiva = {
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

const MOCK_CALIFICACIONES: CalificacionRepartidor[] = [
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

const MOCK_NOTIFICACIONES: NotificacionRepartidor[] = [
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
];

const MOCK_CHAT: ChatMensaje[] = [
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

const ZONAS_MANAGUA = [
  'Centro',
  'Los Robles',
  'Villa Fontana',
  'Bello Horizonte',
  'Monseñor Lezcano',
  'Altamira',
  'Reparto San Juan',
  'Carretera Sur',
];

/* ═══════════════════════════════════════════════════════
   STORE INTERFACE
   ═══════════════════════════════════════════════════════ */

interface RepartidorStoreState {
  // Estado de conexión
  estado: RepartidorEstado;
  conectado: boolean;
  enServicio: boolean;
  pausado: boolean;
  pausaHasta: number | null;
  rechazosHora: number;
  rechazosResetEn: number;

  // Orden activa
  ordenActiva: OrdenActiva | null;
  ordenAsignadaPendiente: OrdenActiva | null; // orden esperando aceptación (timer 30s)
  tiempoAceptacion: number; // segundos restantes para aceptar

  // Posición
  lat: number;
  lng: number;
  heading: number;

  // Tracking
  kmRecorridos: number;
  tiempoTranscurrido: number; // segundos desde que se aceptó
  eta: number; // minutos

  // Stats del día
  statsHoy: StatsRepartidor;
  statsSemana: StatsRepartidor;
  statsMes: StatsRepartidor;

  // Historial
  serviciosHoy: ServicioHistorial[];

  // Perfil
  perfil: RepartidorProfile;
  moto: MotoAsignada;
  calificaciones: CalificacionRepartidor[];

  // Notificaciones
  notificaciones: NotificacionRepartidor[];
  notificacionesNoLeidas: number;

  // Chat
  mensajes: ChatMensaje[];
  chatAbierto: boolean;
  chatOrdenId: string | null;

  // Incidencia
  incidenciaAbierta: boolean;

  // Detalle de servicio
  servicioDetalle: ServicioHistorial | null;

  // Pantalla activa
  pantallaActiva: 'servicio' | 'historial' | 'perfil';
  zonasDisponibles: string[];

  // Actions
  conectar: () => void;
  desconectar: () => void;
  recibirOrdenAsignada: (orden: OrdenActiva) => void;
  aceptarOrden: () => void;
  rechazarOrden: () => void;
  timeoutOrden: () => void;
  llegarRecogida: () => void;
  recogerPaquete: () => void;
  llegarEntrega: () => void;
  confirmarEntrega: () => void;
  reportarIncidencia: (tipo: TipoIncidencia, desc: string) => void;
  actualizarPosicion: (lat: number, lng: number) => void;
  simularMovimiento: () => void;
  toggleChat: (ordenId?: string) => void;
  enviarMensaje: (contenido: string) => void;
  toggleIncidencia: (open?: boolean) => void;
  verServicioDetalle: (servicio: ServicioHistorial) => void;
  cerrarDetalle: () => void;
  setPantalla: (p: 'servicio' | 'historial' | 'perfil') => void;
  marcarNotificacionesLeidas: () => void;
  actualizarConfig: (campo: 'sonidoActivo' | 'vibracionActiva' | 'ubicacionActiva' | 'zonaPreferida', valor: boolean | string) => void;
  obtenerStats: (periodo: 'hoy' | 'semana' | 'mes') => StatsRepartidor;
  verificarProductos: (productoId: string) => void;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calcularETA(kmRestantes: number): number {
  const velocidadPromedio = 30; // km/h en ciudad
  return Math.max(1, Math.round((kmRestantes / velocidadPromedio) * 60));
}

/* ═══════════════════════════════════════════════════════
   STORE
   ═══════════════════════════════════════════════════════ */

export const useRepartidorStore = create<RepartidorStoreState>((set, get) => ({
  // Estado inicial
  estado: 'DESCONECTADO',
  conectado: false,
  enServicio: false,
  pausado: false,
  pausaHasta: null,
  rechazosHora: 0,
  rechazosResetEn: Date.now() + 3600000, // 1 hora

  ordenActiva: null,
  ordenAsignadaPendiente: null,
  tiempoAceptacion: 30,

  lat: 12.1364,
  lng: -86.2581,
  heading: 0,

  kmRecorridos: 0,
  tiempoTranscurrido: 0,
  eta: 0,

  statsHoy: {
    entregas: 4,
    km: 15.2,
    ganancias: 285,
    tiempoActivo: 245, // ~4h
  },
  statsSemana: {
    entregas: 38,
    km: 142.5,
    ganancias: 2780,
    tiempoActivo: 1820,
  },
  statsMes: {
    entregas: 156,
    km: 589.3,
    ganancias: 11250,
    tiempoActivo: 7340,
  },

  serviciosHoy: MOCK_SERVICIOS_HOY,

  perfil: MOCK_PERFIL,
  moto: MOCK_MOTO,
  calificaciones: MOCK_CALIFICACIONES,

  notificaciones: MOCK_NOTIFICACIONES,
  notificacionesNoLeidas: 2,

  mensajes: MOCK_CHAT,
  chatAbierto: false,
  chatOrdenId: null,

  incidenciaAbierta: false,
  servicioDetalle: null,

  pantallaActiva: 'servicio',
  zonasDisponibles: ZONAS_MANAGUA,

  // ─── Actions ───

  conectar: () => {
    set({
      conectado: true,
      estado: 'EN_LINEA',
      moto: { ...get().moto, estado: 'DISPONIBLE' },
    });
  },

  desconectar: () => {
    set({
      conectado: false,
      estado: 'DESCONECTADO',
      enServicio: false,
      ordenActiva: null,
      ordenAsignadaPendiente: null,
    });
  },

  recibirOrdenAsignada: (orden) => {
    if (get().pausado) return;
    set({
      ordenAsignadaPendiente: orden,
      estado: 'ORDEN_ASIGNADA',
      tiempoAceptacion: 30,
    });
    // URGENT pattern: alternating 880/1100 sound + long pulse vibration
    dispararFeedback('nueva_orden', [100, 50, 100, 50, 200]);
  },

  aceptarOrden: () => {
    const orden = get().ordenAsignadaPendiente;
    if (!orden) return;
    set({
      ordenActiva: orden,
      ordenAsignadaPendiente: null,
      estado: 'EN_CAMINO_RECOGER',
      enServicio: true,
      tiempoTranscurrido: 0,
      kmRecorridos: 0,
      eta: calcularETA(orden.kmEstimados),
      moto: { ...get().moto, estado: 'EN_SERVICIO' },
    });
    // Ascending C-E-G major arpeggio + short vibration
    dispararFeedback('orden_aceptada', 80);
  },

  rechazarOrden: () => {
    const nuevosRechazos = get().rechazosHora + 1;
    const pausado = nuevosRechazos >= 3;
    set({
      ordenAsignadaPendiente: null,
      estado: pausado ? 'EN_LINEA' : 'EN_LINEA',
      rechazosHora: nuevosRechazos,
      pausado,
      pausaHasta: pausado ? Date.now() + 15 * 60 * 1000 : null,
      notificaciones: pausado
        ? [
            {
              id: `ntf-${Date.now()}`,
              tipo: 'cancelacion',
              titulo: 'Pausa automática',
              contenido: 'Has rechazado 3 órdenes. Pausa de 15 min.',
              leido: false,
              tiempo: 'ahora',
            },
            ...get().notificaciones,
          ]
        : get().notificaciones,
    });
    // Descending toggle_off sound + short vibration
    dispararFeedback('toggle_off', 40);
  },

  timeoutOrden: () => {
    // El timeout cuenta como rechazo
    const nuevosRechazos = get().rechazosHora + 1;
    const pausado = nuevosRechazos >= 3;
    set({
      ordenAsignadaPendiente: null,
      estado: 'EN_LINEA',
      rechazosHora: nuevosRechazos,
      pausado,
      pausaHasta: pausado ? Date.now() + 15 * 60 * 1000 : null,
    });
    // Harsh error sound + double-pulse vibration
    dispararFeedback('error', [200, 100, 200]);
  },

  llegarRecogida: () => {
    set({ estado: 'EN_PUNTO_RECOGIDA' });
  },

  recogerPaquete: () => {
    set({
      estado: 'RECOGIDO',
      kmRecorridos: 0,
      ordenActiva: get().ordenActiva
        ? { ...get().ordenActiva! }
        : null,
    });
  },

  llegarEntrega: () => {
    set({ estado: 'EN_PUNTO_ENTREGA' });
  },

  confirmarEntrega: () => {
    const orden = get().ordenActiva;
    if (!orden) return;
    const nuevoServicio: ServicioHistorial = {
      id: `svc-${Date.now()}`,
      ordenId: orden.id,
      tipo: orden.tipo,
      cliente: orden.cliente,
      tiendaNombre: orden.tiendaNombre,
      origen: orden.origen,
      destino: orden.destino,
      hora: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
      kmRecorridos: Math.round(get().kmRecorridos * 10) / 10,
      ganancia: orden.ganancia,
      tiempoTotal: Math.round(get().tiempoTranscurrido / 60),
      estado: 'entregado',
    };
    set({
      estado: 'EN_LINEA',
      enServicio: false,
      ordenActiva: null,
      serviciosHoy: [nuevoServicio, ...get().serviciosHoy],
      statsHoy: {
        entregas: get().statsHoy.entregas + 1,
        km: Math.round((get().statsHoy.km + get().kmRecorridos) * 10) / 10,
        ganancias: get().statsHoy.ganancias + orden.ganancia,
        tiempoActivo: get().statsHoy.tiempoActivo + Math.round(get().tiempoTranscurrido / 60),
      },
      moto: { ...get().moto, estado: 'DISPONIBLE', kmAcumulados: get().moto.kmAcumulados + get().kmRecorridos },
      kmRecorridos: 0,
      tiempoTranscurrido: 0,
      eta: 0,
    });
    // Completion fanfare (4 ascending notes) + short pulse pattern
    dispararFeedback('orden_entregada', [60, 40, 60, 40, 150]);
  },

  reportarIncidencia: (tipo, desc) => {
    const orden = get().ordenActiva;
    const tipoLabel = {
      mecanica: 'Falla mecánica',
      cliente: 'Problema con cliente',
      accidente: 'Accidente',
      otro: 'Otro',
    }[tipo];
    const nuevoServicio: ServicioHistorial | null = orden
      ? {
          id: `svc-${Date.now()}`,
          ordenId: orden.id,
          tipo: orden.tipo,
          cliente: orden.cliente,
          tiendaNombre: orden.tiendaNombre,
          origen: orden.origen,
          destino: orden.destino,
          hora: new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }),
          kmRecorridos: Math.round(get().kmRecorridos * 10) / 10,
          ganancia: 0,
          tiempoTotal: Math.round(get().tiempoTranscurrido / 60),
          estado: 'incidencia',
          incidenciaTipo: tipoLabel,
        }
      : null;

    set({
      estado: 'EN_LINEA',
      enServicio: false,
      ordenActiva: null,
      incidenciaAbierta: false,
      serviciosHoy: nuevoServicio ? [nuevoServicio, ...get().serviciosHoy] : get().serviciosHoy,
      moto: { ...get().moto, estado: 'DISPONIBLE' },
      kmRecorridos: 0,
      tiempoTranscurrido: 0,
      eta: 0,
      notificaciones: [
        {
          id: `ntf-${Date.now()}`,
          tipo: 'incidencia',
          titulo: 'Incidencia reportada',
          contenido: `${tipoLabel} — ${orden?.id || ''}`,
          leido: false,
          ordenId: orden?.id,
          tiempo: 'ahora',
        },
        ...get().notificaciones,
      ],
    });
    // Harsh error sound + long double-pulse vibration
    dispararFeedback('error', [300, 100, 300]);
  },

  actualizarPosicion: (lat, lng) => {
    const prev = { lat: get().lat, lng: get().lng };
    const distancia = calcularDistancia(prev.lat, prev.lng, lat, lng);

    // Solo sumar km si estamos en estado RECOGIDO (en camino a entregar)
    let nuevosKm = get().kmRecorridos;
    if (get().estado === 'RECOGIDO') {
      nuevosKm += distancia;
    }

    // Recalcular ETA
    const orden = get().ordenActiva;
    let nuevaEta = get().eta;
    if (orden) {
      if (get().estado === 'EN_CAMINO_RECOGER') {
        const kmRestantes = calcularDistancia(lat, lng, orden.origenLat, orden.origenLng);
        nuevaEta = calcularETA(kmRestantes);
      } else if (get().estado === 'RECOGIDO') {
        const kmRestantes = calcularDistancia(lat, lng, orden.destinoLat, orden.destinoLng);
        nuevaEta = calcularETA(kmRestantes);
      }
    }

    // Calcular heading
    const heading = Math.atan2(lng - prev.lng, lat - prev.lat) * (180 / Math.PI);

    set({
      lat,
      lng,
      heading,
      kmRecorridos: Math.round(nuevosKm * 100) / 100,
      eta: nuevaEta,
    });
  },

  simularMovimiento: () => {
    const estado = get().estado;
    if (estado !== 'EN_CAMINO_RECOGER' && estado !== 'RECOGIDO') {
      // Si está EN_LINEA, simular pequeña variación (estacionario)
      if (estado === 'EN_LINEA') {
        const variacionLat = (Math.random() - 0.5) * 0.0002;
        const variacionLng = (Math.random() - 0.5) * 0.0002;
        get().actualizarPosicion(get().lat + variacionLat, get().lng + variacionLng);
      }
      return;
    }

    const orden = get().ordenActiva;
    if (!orden) return;

    const destinoLat = estado === 'EN_CAMINO_RECOGER' ? orden.origenLat : orden.destinoLat;
    const destinoLng = estado === 'EN_CAMINO_RECOGER' ? orden.origenLng : orden.destinoLng;

    // 60% hacia el destino + 40% variación random (simula calles)
    const step = 0.00045; // ~50m
    const direccionLat = destinoLat - get().lat;
    const direccionLng = destinoLng - get().lng;
    const magnitud = Math.sqrt(direccionLat ** 2 + direccionLng ** 2) || 1;

    const haciaDestinoLat = (direccionLat / magnitud) * step * 0.6;
    const haciaDestinoLng = (direccionLng / magnitud) * step * 0.6;
    const ruidoLat = (Math.random() - 0.5) * step * 0.4;
    const ruidoLng = (Math.random() - 0.5) * step * 0.4;

    const nuevaLat = get().lat + haciaDestinoLat + ruidoLat;
    const nuevaLng = get().lng + haciaDestinoLng + ruidoLng;

    // Verificar si llegó al destino
    const distanciaDestino = calcularDistancia(nuevaLat, nuevaLng, destinoLat, destinoLng);
    if (distanciaDestino < 0.05) { // menos de 50m
      // Auto-avanzar al siguiente estado
      if (estado === 'EN_CAMINO_RECOGER') {
        get().llegarRecogida();
      } else if (estado === 'RECOGIDO') {
        get().llegarEntrega();
      }
      return;
    }

    get().actualizarPosicion(nuevaLat, nuevaLng);

    // Incrementar tiempo transcurrido
    set({ tiempoTranscurrido: get().tiempoTranscurrido + 5 });
  },

  toggleChat: (ordenId) => {
    if (ordenId) {
      set({ chatAbierto: true, chatOrdenId: ordenId });
    } else {
      set({ chatAbierto: !get().chatAbierto });
    }
  },

  enviarMensaje: (contenido) => {
    const ordenId = get().chatOrdenId || get().ordenActiva?.id;
    if (!ordenId) return;
    realtime.chatMensaje(ordenId, 'repartidor', contenido);
    // Subtle confirm sound — NO vibration (too noisy on every message)
    dispararFeedback('toggle_on', null);
  },

  toggleIncidencia: (open) => {
    set({ incidenciaAbierta: open !== undefined ? open : !get().incidenciaAbierta });
  },

  verServicioDetalle: (servicio) => {
    set({ servicioDetalle: servicio });
  },

  cerrarDetalle: () => {
    set({ servicioDetalle: null });
  },

  setPantalla: (p) => {
    set({ pantallaActiva: p });
  },

  marcarNotificacionesLeidas: () => {
    set({
      notificaciones: get().notificaciones.map((n) => ({ ...n, leido: true })),
      notificacionesNoLeidas: 0,
    });
  },

  actualizarConfig: (campo, valor) => {
    set({
      perfil: { ...get().perfil, [campo]: valor },
    });
    if (campo === 'zonaPreferida' && typeof valor === 'string') {
      set({ perfil: { ...get().perfil, zonaPreferida: valor } });
    }
  },

  obtenerStats: (periodo) => {
    if (periodo === 'hoy') return get().statsHoy;
    if (periodo === 'semana') return get().statsSemana;
    return get().statsMes;
  },

  verificarProductos: (productoId) => {
    const orden = get().ordenActiva;
    if (!orden || !orden.productos) return;
    set({
      ordenActiva: {
        ...orden,
        productos: orden.productos.map((p) =>
          p.id === productoId ? { ...p, verificado: !p.verificado } : p
        ),
      },
    });
  },
}));

/* ═══════════════════════════════════════════════════════
   EXPORT HELPERS
   ═══════════════════════════════════════════════════════ */

export { calcularDistancia, calcularETA, ZONAS_MANAGUA };
