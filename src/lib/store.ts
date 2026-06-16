import { create } from 'zustand';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

export type OrderStatus = 'pendiente' | 'encamino' | 'recogido' | 'entregado' | 'incidencia' | 'programada';
export type MotoStatus = 'available' | 'in-service' | 'maintenance';
export type RiderStatus = 'available' | 'in-service' | 'offline';
export type PaymentMethod = 'efectivo' | 'transferencia';
export type PaymentStatus = 'pendiente' | 'pagado' | 'reembolsado';

export interface Order {
  id: string;
  cliente: string;
  clienteTelefono: string;
  origen: string;
  destino: string;
  origenLat: number;
  origenLng: number;
  destinoLat: number;
  destinoLng: number;
  repartidor: string | null;
  repartidorInitials: string;
  descripcion: string;
  monto: number;
  estado: OrderStatus;
  metodoPago: PaymentMethod;
  estadoPago: PaymentStatus;
  fecha: string;
  hora: string;
  calificacion?: number;
  timeline: { step: string; hora: string; completado: boolean }[];
}

export interface Moto {
  id: string;
  nombre: string;
  modelo: string;
  anio: number;
  placa: string;
  status: MotoStatus;
  lat: number;
  lng: number;
  km: number;
  repartidorAsignado: string | null;
  ultimoMantenimiento: string;
  proximoMantenimiento: string;
  costoTotalMantenimiento: number;
}

export interface Rider {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  initials: string;
  color: string;
  status: RiderStatus;
  motoId: string | null;
  entregasHoy: number;
  kmHoy: number;
  entregasTotal: number;
  kmTotal: number;
  calificacion: number;
  conectado: boolean;
}

export interface Alert {
  id: string;
  tipo: 'mantenimiento' | 'bateria' | 'incidencia' | 'retraso';
  titulo: string;
  msg: string;
  motoId: string;
  tiempo: string;
  severidad: 'alta' | 'media' | 'baja';
}

export interface Zone {
  id: string;
  nombre: string;
  tarifa: number;
  activa: boolean;
}

export interface MaintenanceRule {
  id: string;
  tipo: string;
  umbralKm: number;
  descripcion: string;
}

export interface CompanyData {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface SystemUser {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export interface DailyRevenue {
  dia: string;
  monto: number;
}

export interface MonthlyRevenue {
  mes: string;
  monto: number;
}

export interface ZoneOrder {
  zona: string;
  cantidad: number;
}

export interface RiderPerformance {
  nombre: string;
  entregas: number;
}

/* ─── New Types ─── */

export interface Incident {
  id: string;
  orderId: string;
  tipo: 'falla_mecanica' | 'problema_cliente' | 'accidente' | 'retraso' | 'paquete_danado';
  titulo: string;
  descripcion: string;
  repartidor: string;
  motoId: string;
  gravedad: 'alta' | 'media' | 'baja';
  estado: 'activa' | 'resuelta';
  lat: number;
  lng: number;
  timestamp: string;
  resolucion?: string;
  tiempoResolucion?: string;
}

export interface Client {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  totalEnvios: number;
  montoTotal: number;
  ultimoEnvio: string;
  zonaFrecuente: string;
}

export interface ActivityEvent {
  id: string;
  tipo: 'orden' | 'flota' | 'repartidor' | 'incidencia' | 'config' | 'finanzas';
  titulo: string;
  detalle: string;
  timestamp: string;
  leido: boolean;
}

export interface PaymentConciliation {
  id: string;
  repartidor: string;
  monto: number;
  fecha: string;
  estado: 'pendiente' | 'conciliado';
}

export interface ZonePolygon {
  id: string;
  nombre: string;
  color: string;
  coords: [number, number][];
}

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  timestamp: number;
}

/* ─── Marketing Types ─── */

export interface Campana {
  id: string;
  titulo: string;
  tipo: 'push' | 'email' | 'sms';
  segmento: string;
  contenido: { titulo?: string; cuerpo: string; boton?: string };
  estado: 'borrador' | 'programada' | 'enviada' | 'fallida';
  programadaPara?: string;
  enviadaEn?: string;
  destinatarios: number;
  abiertos: number;
  clicks: number;
  creadoPor: string;
  createdAt: string;
}

export interface CodigoPromocional {
  id: string;
  codigo: string;
  tipoDescuento: 'porcentaje' | 'monto';
  valor: number;
  aplicableA: string;
  montoMinimo?: number;
  maxUsos: number;
  usosActuales: number;
  segmento: string;
  vigenciaInicio: string;
  vigenciaFin: string;
  estado: 'activo' | 'agotado' | 'expirado' | 'pausado';
  creadoPor: string;
  createdAt: string;
}

export interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  tipo: 'promo_grande' | 'tarjeta_compacta' | 'slider' | 'notificacion';
  colorFondo: string;
  gradiente?: { from: string; to: string; direction: string };
  colorTexto: string;
  imagenUrl?: string;
  botonTexto?: string;
  botonAccion?: string;
  botonLink?: string;
  icono?: string;
  segmento: string;
  mostrarEn: string;
  posicion: number;
  estado: 'activo' | 'inactivo' | 'programado';
  impresiones: number;
  clicks: number;
  programadoDesde?: string;
  programadoHasta?: string;
  creadoPor: string;
  createdAt: string;
}

export interface FeedItem {
  id: string;
  tipo: 'anuncio' | 'promocion' | 'novedad' | 'encuesta' | 'recordatorio';
  titulo: string;
  descripcion: string;
  icono?: string;
  botonTexto?: string;
  botonLink?: string;
  codigoPromo?: string;
  segmento: string;
  posicion: number;
  estado: 'activo' | 'inactivo';
  impresiones: number;
  clicks: number;
  creadoPor: string;
  createdAt: string;
}

export interface PlantillaMensaje {
  id: string;
  nombre: string;
  categoria: 'orden' | 'incidencia' | 'promocion' | 'general';
  contenido: string;
  variables: string[];
  esDefault: boolean;
  createdAt: string;
}

export interface MensajeDirecto {
  id: string;
  emisorId: string;
  emisorNombre: string;
  receptorId: string;
  receptorNombre: string;
  contenido: string;
  leido: boolean;
  enviadoEn: string;
}

export interface Conversacion {
  id: string;
  participanteId: string;
  participanteNombre: string;
  participanteRol: 'cliente' | 'repartidor';
  ultimoMensaje: string;
  ultimoTimestamp: string;
  noLeidos: number;
  mensajes: MensajeDirecto[];
}

export interface NotificacionAutomatica {
  id: string;
  evento: string;
  etiqueta: string;
  activa: boolean;
  canal: 'push' | 'email' | 'sms' | 'todos';
  plantilla: string;
  destinatario: 'cliente' | 'repartidor' | 'admin' | 'ingeniero';
}

/* ─── Config Types ─── */

export interface ConfiguracionHorario {
  id: string;
  dia: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  recargoNocturno: number;
}

export interface Feriado {
  id: string;
  fecha: string;
  nombre: string;
  recargo: number;
}

export interface Integracion {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  estado: 'conectado' | 'no_configurado';
}

/* ─── SuperAdmin Types ─── */

export interface AuditLogEntry {
  id: string;
  userId: string;
  usuario: string;
  accion: string;
  recurso: string;
  recursoId?: string;
  detalles?: string;
  ip?: string;
  dispositivo?: string;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  nombre: string;
  descripcion: string;
  habilitado: boolean;
}

export interface MarketingKPI {
  clientesActivosMes: number;
  tendenciaActivos: number;
  tasaRetencion: number;
  frecuenciaPromedio: number;
  valorPromedioEnvio: number;
  costoAdquisicion: number;
}

/* ─── Client Experience Types ─── */

export interface ClientNotificacion {
  id: string;
  tipo: 'orden_confirmada' | 'repartidor_asignado' | 'repartidor_camino' | 'paquete_recogido' | 'entrega_exitosa' | 'incidencia' | 'codigo_nuevo' | 'te_extranamos';
  titulo: string;
  descripcion: string;
  leida: boolean;
  relacionadoId?: string;
  timestamp: string;
}

export interface DireccionGuardada {
  id: string;
  etiqueta: string;
  direccion: string;
  lat: number;
  lng: number;
}

export interface SolicitudEnvio {
  origen: string;
  origenLat: number;
  origenLng: number;
  destino: string;
  destinoLat: number;
  destinoLng: number;
  descripcion: string;
  tamano: 'pequeno' | 'mediano' | 'grande';
  fragil: boolean;
  instrucciones: string;
  metodoPago: 'efectivo' | 'transferencia';
  montoPago?: number;
  codigoPromo?: string;
  descuento?: number;
  terminosAceptados: boolean;
}

export type ClientModuleKey = 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil' | 'ayuda' | 'puntos';

export interface DireccionSugerencia {
  id: string;
  direccion: string;
  barrio: string;
  lat: number;
  lng: number;
}

/* ─── V2 Types: Tracking, Chat, Ratings, Loyalty, Referrals ─── */

export interface TrackingStep {
  id: string;
  label: string;
  timestamp: string; // '—' if pending
  status: 'completed' | 'current' | 'pending';
}

export const TRACKING_STEPS_TEMPLATE: TrackingStep[] = [
  { id: 's1', label: 'Orden creada', timestamp: '—', status: 'pending' },
  { id: 's2', label: 'Repartidor asignado', timestamp: '—', status: 'pending' },
  { id: 's3', label: 'Repartidor en camino a recoger', timestamp: '—', status: 'pending' },
  { id: 's4', label: 'Repartidor en punto de recogida', timestamp: '—', status: 'pending' },
  { id: 's5', label: 'Paquete recogido', timestamp: '—', status: 'pending' },
  { id: 's6', label: 'En camino a destino', timestamp: '—', status: 'pending' },
  { id: 's7', label: 'Repartidor en punto de entrega', timestamp: '—', status: 'pending' },
  { id: 's8', label: 'Entrega confirmada', timestamp: '—', status: 'pending' },
];

export interface RepartidorInfo {
  id: string;
  nombre: string;
  initials: string;
  color: string;
  calificacion: number;
  totalEntregas: number;
  moto: string;
  telefono: string;
  lat: number;
  lng: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'cliente' | 'repartidor' | 'sistema';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  orderId: string;
  repartidor: RepartidorInfo;
  messages: ChatMessage[];
  active: boolean;
  closedAt?: string;
}

export interface Calificacion {
  id: string;
  orderId: string;
  repartidorId: string;
  repartidorNombre: string;
  estrellas: number;
  etiquetas: string[];
  comentario: string;
  favorito: boolean;
  fecha: string;
  editable: boolean; // within 24h
}

export type NivelFidelizacion = 'bronce' | 'plata' | 'oro' | 'platino';

export interface PuntosHistorial {
  id: string;
  fecha: string;
  accion: string;
  puntos: number; // positive = earned, negative = spent
}

export interface DatosFidelizacion {
  puntos: number;
  nivel: NivelFidelizacion;
  historial: PuntosHistorial[];
}

export interface Referido {
  id: string;
  nombre: string;
  fechaRegistro: string;
  primerEnvio: boolean;
}

export interface DatosReferidos {
  codigo: string;
  link: string;
  referidos: Referido[];
  puntosGanados: number;
}

export interface DireccionGuardadaV2 {
  id: string;
  etiqueta: 'casa' | 'trabajo' | 'novia' | 'mama' | 'otro';
  etiquetaCustom?: string;
  direccion: string;
  lat: number;
  lng: number;
  instrucciones: string;
  horarioPreferido: string;
}

/* ═══════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════ */

const MANAGUA_ORDERS: Order[] = [
  {
    id: 'LF-2847', cliente: 'María López', clienteTelefono: '+505 8888-1234',
    origen: 'Metrocentro, Managua', destino: 'Col. Los Robles, Managua',
    origenLat: 12.1150, origenLng: -86.2362, destinoLat: 12.1245, destinoLng: -86.2520,
    repartidor: 'Carlos Mendoza', repartidorInitials: 'CM',
    descripcion: 'Sobre documentos importantes', monto: 120, estado: 'encamino',
    metodoPago: 'transferencia', estadoPago: 'pagado', fecha: '2026-06-10', hora: '14:30',
    calificacion: undefined,
    timeline: [
      { step: 'Orden creada', hora: '14:30', completado: true },
      { step: 'En camino', hora: '14:35', completado: true },
      { step: 'Recogida', hora: '—', completado: false },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2846', cliente: 'Pedro Ruiz', clienteTelefono: '+505 8888-5678',
    origen: 'Universidad Centroamericana', destino: 'Barrio Monseñor Lezcano',
    origenLat: 12.1029, origenLng: -86.2545, destinoLat: 12.0980, destinoLng: -86.2310,
    repartidor: 'Ana Torres', repartidorInitials: 'AT',
    descripcion: 'Paquete mediano, fragil', monto: 85, estado: 'entregado',
    metodoPago: 'efectivo', estadoPago: 'pagado', fecha: '2026-06-10', hora: '10:15',
    calificacion: 5,
    timeline: [
      { step: 'Orden creada', hora: '10:15', completado: true },
      { step: 'En camino', hora: '10:20', completado: true },
      { step: 'Recogida', hora: '10:32', completado: true },
      { step: 'Entregada', hora: '10:58', completado: true },
    ],
  },
  {
    id: 'LF-2845', cliente: 'Sofía Chamorro', clienteTelefono: '+505 8888-9012',
    origen: 'Galerías Santo Domingo', destino: 'Villa Fontana, Managua',
    origenLat: 12.0900, origenLng: -86.2180, destinoLat: 12.0850, destinoLng: -86.2070,
    repartidor: null, repartidorInitials: '',
    descripcion: 'Compras de tienda', monto: 200, estado: 'pendiente',
    metodoPago: 'transferencia', estadoPago: 'pendiente', fecha: '2026-06-10', hora: '15:00',
    timeline: [
      { step: 'Orden creada', hora: '15:00', completado: true },
      { step: 'En camino', hora: '—', completado: false },
      { step: 'Recogida', hora: '—', completado: false },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2844', cliente: 'Diego Soto', clienteTelefono: '+505 8888-3456',
    origen: 'Plaza Inter', destino: 'Bello Horizonte',
    origenLat: 12.1180, origenLng: -86.2650, destinoLat: 12.1300, destinoLng: -86.2800,
    repartidor: 'Luis Ramos', repartidorInitials: 'LR',
    descripcion: 'Documentos legales', monto: 150, estado: 'recogido',
    metodoPago: 'efectivo', estadoPago: 'pagado', fecha: '2026-06-10', hora: '13:45',
    timeline: [
      { step: 'Orden creada', hora: '13:45', completado: true },
      { step: 'En camino', hora: '13:50', completado: true },
      { step: 'Recogida', hora: '14:05', completado: true },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2843', cliente: 'Laura Vega', clienteTelefono: '+505 8888-7890',
    origen: 'Mercado Oriental', destino: 'Centro Histórico, Managua',
    origenLat: 12.1320, origenLng: -86.2220, destinoLat: 12.1360, destinoLng: -86.2520,
    repartidor: 'Carlos Mendoza', repartidorInitials: 'CM',
    descripcion: 'Productos varios', monto: 95, estado: 'entregado',
    metodoPago: 'efectivo', estadoPago: 'pagado', fecha: '2026-06-09', hora: '16:20',
    calificacion: 4,
    timeline: [
      { step: 'Orden creada', hora: '16:20', completado: true },
      { step: 'En camino', hora: '16:25', completado: true },
      { step: 'Recogida', hora: '16:40', completado: true },
      { step: 'Entregada', hora: '17:05', completado: true },
    ],
  },
  {
    id: 'LF-2842', cliente: 'Roberto Martínez', clienteTelefono: '+505 8888-2345',
    origen: 'Reparto Schick', destino: 'Col. Centroamérica',
    origenLat: 12.1080, origenLng: -86.2400, destinoLat: 12.1150, destinoLng: -86.2600,
    repartidor: 'Ana Torres', repartidorInitials: 'AT',
    descripcion: 'Equipo electrónico', monto: 175, estado: 'incidencia',
    metodoPago: 'transferencia', estadoPago: 'reembolsado', fecha: '2026-06-09', hora: '11:00',
    timeline: [
      { step: 'Orden creada', hora: '11:00', completado: true },
      { step: 'En camino', hora: '11:05', completado: true },
      { step: 'Recogida', hora: '11:20', completado: true },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2841', cliente: 'Carmen Ríos', clienteTelefono: '+505 8888-6789',
    origen: 'Hospital Metropolitano', destino: 'Altamira, Managua',
    origenLat: 12.1050, origenLng: -86.2450, destinoLat: 12.1200, destinoLng: -86.2700,
    repartidor: 'Jorge Pérez', repartidorInitials: 'JP',
    descripcion: 'Medicamentos', monto: 110, estado: 'entregado',
    metodoPago: 'efectivo', estadoPago: 'pagado', fecha: '2026-06-09', hora: '09:30',
    calificacion: 5,
    timeline: [
      { step: 'Orden creada', hora: '09:30', completado: true },
      { step: 'En camino', hora: '09:35', completado: true },
      { step: 'Recogida', hora: '09:48', completado: true },
      { step: 'Entregada', hora: '10:10', completado: true },
    ],
  },
  {
    id: 'LF-2840', cliente: 'Andrés Cruz', clienteTelefono: '+505 8888-0123',
    origen: 'Carretera a Masaya', destino: 'Santo Domingo, Managua',
    origenLat: 12.0950, origenLng: -86.2100, destinoLat: 12.0880, destinoLng: -86.1950,
    repartidor: 'Luis Ramos', repartidorInitials: 'LR',
    descripcion: 'Caja grande, 15kg', monto: 230, estado: 'encamino',
    metodoPago: 'transferencia', estadoPago: 'pagado', fecha: '2026-06-09', hora: '15:45',
    timeline: [
      { step: 'Orden creada', hora: '15:45', completado: true },
      { step: 'En camino', hora: '15:52', completado: true },
      { step: 'Recogida', hora: '—', completado: false },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2839', cliente: 'Isabel Torres', clienteTelefono: '+505 8888-4567',
    origen: 'Las Colinas', destino: 'Col. Los Robles',
    origenLat: 12.1250, origenLng: -86.2480, destinoLat: 12.1245, destinoLng: -86.2520,
    repartidor: null, repartidorInitials: '',
    descripcion: 'Invitaciones impresión', monto: 65, estado: 'pendiente',
    metodoPago: 'efectivo', estadoPago: 'pendiente', fecha: '2026-06-08', hora: '12:00',
    timeline: [
      { step: 'Orden creada', hora: '12:00', completado: true },
      { step: 'En camino', hora: '—', completado: false },
      { step: 'Recogida', hora: '—', completado: false },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2838', cliente: 'Felipe Reyes', clienteTelefono: '+505 8888-8901',
    origen: 'Carretera Sur', destino: 'Reparto Schick',
    origenLat: 12.0800, origenLng: -86.2300, destinoLat: 12.1080, destinoLng: -86.2400,
    repartidor: 'Jorge Pérez', repartidorInitials: 'JP',
    descripcion: 'Repuestos automotriz', monto: 180, estado: 'entregado',
    metodoPago: 'transferencia', estadoPago: 'pagado', fecha: '2026-06-08', hora: '08:20',
    calificacion: 4,
    timeline: [
      { step: 'Orden creada', hora: '08:20', completado: true },
      { step: 'En camino', hora: '08:28', completado: true },
      { step: 'Recogida', hora: '08:42', completado: true },
      { step: 'Entregada', hora: '09:15', completado: true },
    ],
  },
  {
    id: 'LF-2837', cliente: 'Gabriela Navarro', clienteTelefono: '+505 8888-2468',
    origen: 'Col. Los Robles', destino: 'Villa Fontana',
    origenLat: 12.1245, origenLng: -86.2520, destinoLat: 12.0850, destinoLng: -86.2070,
    repartidor: 'Carlos Mendoza', repartidorInitials: 'CM',
    descripcion: 'Ropa de boutique', monto: 145, estado: 'entregado',
    metodoPago: 'efectivo', estadoPago: 'pagado', fecha: '2026-06-08', hora: '17:00',
    calificacion: 5,
    timeline: [
      { step: 'Orden creada', hora: '17:00', completado: true },
      { step: 'En camino', hora: '17:08', completado: true },
      { step: 'Recogida', hora: '17:22', completado: true },
      { step: 'Entregada', hora: '17:50', completado: true },
    ],
  },
  {
    id: 'LF-2836', cliente: 'Miguel Ángel', clienteTelefono: '+505 8888-1357',
    origen: 'Villa Fontana', destino: 'Bello Horizonte',
    origenLat: 12.0850, origenLng: -86.2070, destinoLat: 12.1300, destinoLng: -86.2800,
    repartidor: 'Ana Torres', repartidorInitials: 'AT',
    descripcion: 'Comida restaurante', monto: 90, estado: 'encamino',
    metodoPago: 'efectivo', estadoPago: 'pendiente', fecha: '2026-06-07', hora: '19:30',
    timeline: [
      { step: 'Orden creada', hora: '19:30', completado: true },
      { step: 'En camino', hora: '19:35', completado: true },
      { step: 'Recogida', hora: '—', completado: false },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2835', cliente: 'Patricia Herrera', clienteTelefono: '+505 8888-9753',
    origen: 'Bello Horizonte', destino: 'Centro Histórico',
    origenLat: 12.1300, origenLng: -86.2800, destinoLat: 12.1360, destinoLng: -86.2520,
    repartidor: null, repartidorInitials: '',
    descripcion: 'Artículos de oficina', monto: 160, estado: 'pendiente',
    metodoPago: 'transferencia', estadoPago: 'pendiente', fecha: '2026-06-07', hora: '10:00',
    timeline: [
      { step: 'Orden creada', hora: '10:00', completado: true },
      { step: 'En camino', hora: '—', completado: false },
      { step: 'Recogida', hora: '—', completado: false },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
  {
    id: 'LF-2834', cliente: 'Raúl Castillo', clienteTelefono: '+505 8888-8642',
    origen: 'Monseñor Lezcano', destino: 'Reparto Schick',
    origenLat: 12.0980, origenLng: -86.2310, destinoLat: 12.1080, destinoLng: -86.2400,
    repartidor: 'Rosa Díaz', repartidorInitials: 'RD',
    descripcion: 'Libros y material escolar', monto: 75, estado: 'entregado',
    metodoPago: 'efectivo', estadoPago: 'pagado', fecha: '2026-06-07', hora: '14:15',
    calificacion: 3,
    timeline: [
      { step: 'Orden creada', hora: '14:15', completado: true },
      { step: 'En camino', hora: '14:22', completado: true },
      { step: 'Recogida', hora: '14:35', completado: true },
      { step: 'Entregada', hora: '14:58', completado: true },
    ],
  },
  {
    id: 'LF-2833', cliente: 'Daniela Mendoza', clienteTelefono: '+505 8888-7531',
    origen: 'Galerías Santo Domingo', destino: 'Monseñor Lezcano',
    origenLat: 12.0900, origenLng: -86.2180, destinoLat: 12.0980, destinoLng: -86.2310,
    repartidor: 'Miguel Sevilla', repartidorInitials: 'MS',
    descripcion: 'Regalo de cumpleaños', monto: 195, estado: 'recogido',
    metodoPago: 'transferencia', estadoPago: 'pagado', fecha: '2026-06-06', hora: '11:30',
    timeline: [
      { step: 'Orden creada', hora: '11:30', completado: true },
      { step: 'En camino', hora: '11:38', completado: true },
      { step: 'Recogida', hora: '11:52', completado: true },
      { step: 'Entregada', hora: '—', completado: false },
    ],
  },
];

const MOCK_MOTOS: Moto[] = [
  { id: 'Moto-01', nombre: 'Moto-01', modelo: 'Honda Wave 110', anio: 2022, placa: 'M-1234', status: 'available', lat: 12.1140, lng: -86.2350, km: 3200, repartidorAsignado: 'Luis Ramos', ultimoMantenimiento: '2026-05-15', proximoMantenimiento: '2026-07-15', costoTotalMantenimiento: 4500 },
  { id: 'Moto-02', nombre: 'Moto-02', modelo: 'Yamaha NMAX 155', anio: 2023, placa: 'M-2345', status: 'in-service', lat: 12.1250, lng: -86.2500, km: 2800, repartidorAsignado: 'Rosa Díaz', ultimoMantenimiento: '2026-05-20', proximoMantenimiento: '2026-07-20', costoTotalMantenimiento: 6200 },
  { id: 'Moto-03', nombre: 'Moto-03', modelo: 'Honda Wave 110', anio: 2021, placa: 'M-3456', status: 'in-service', lat: 12.1050, lng: -86.2400, km: 3100, repartidorAsignado: 'Carlos Mendoza', ultimoMantenimiento: '2026-04-10', proximoMantenimiento: '2026-06-10', costoTotalMantenimiento: 3800 },
  { id: 'Moto-04', nombre: 'Moto-04', modelo: 'Suzuki Address 155', anio: 2023, placa: 'M-4567', status: 'available', lat: 12.1300, lng: -86.2600, km: 2600, repartidorAsignado: 'María García', ultimoMantenimiento: '2026-05-28', proximoMantenimiento: '2026-07-28', costoTotalMantenimiento: 5100 },
  { id: 'Moto-05', nombre: 'Moto-05', modelo: 'Honda Wave 125', anio: 2020, placa: 'M-5678', status: 'maintenance', lat: 12.0950, lng: -86.2300, km: 3500, repartidorAsignado: null, ultimoMantenimiento: '2026-06-01', proximoMantenimiento: '2026-06-15', costoTotalMantenimiento: 7200 },
  { id: 'Moto-06', nombre: 'Moto-06', modelo: 'Yamaha FZ-S V3', anio: 2022, placa: 'M-6789', status: 'in-service', lat: 12.1100, lng: -86.2200, km: 4200, repartidorAsignado: 'Elena Vargas', ultimoMantenimiento: '2026-05-10', proximoMantenimiento: '2026-07-10', costoTotalMantenimiento: 5600 },
  { id: 'Moto-07', nombre: 'Moto-07', modelo: 'Honda Wave 110', anio: 2023, placa: 'M-7890', status: 'available', lat: 12.1200, lng: -86.2700, km: 1800, repartidorAsignado: 'Jorge Pérez', ultimoMantenimiento: '2026-06-05', proximoMantenimiento: '2026-08-05', costoTotalMantenimiento: 2200 },
  { id: 'Moto-08', nombre: 'Moto-08', modelo: 'Suzuki Burgman 125', anio: 2022, placa: 'M-8901', status: 'available', lat: 12.1000, lng: -86.2550, km: 2100, repartidorAsignado: 'Miguel Sevilla', ultimoMantenimiento: '2026-05-22', proximoMantenimiento: '2026-07-22', costoTotalMantenimiento: 3400 },
  { id: 'Moto-09', nombre: 'Moto-09', modelo: 'Honda PCX 160', anio: 2024, placa: 'M-9012', status: 'in-service', lat: 12.0900, lng: -86.2150, km: 1200, repartidorAsignado: 'Ana Torres', ultimoMantenimiento: '2026-06-01', proximoMantenimiento: '2026-08-01', costoTotalMantenimiento: 1800 },
  { id: 'Moto-10', nombre: 'Moto-10', modelo: 'Yamaha NMAX 155', anio: 2021, placa: 'M-0123', status: 'maintenance', lat: 12.1150, lng: -86.2450, km: 8500, repartidorAsignado: null, ultimoMantenimiento: '2026-06-08', proximoMantenimiento: '2026-06-20', costoTotalMantenimiento: 9500 },
  { id: 'Moto-11', nombre: 'Moto-11', modelo: 'Honda Wave 125', anio: 2023, placa: 'M-1122', status: 'available', lat: 12.1350, lng: -86.2350, km: 1500, repartidorAsignado: null, ultimoMantenimiento: '2026-05-30', proximoMantenimiento: '2026-07-30', costoTotalMantenimiento: 2000 },
  { id: 'Moto-12', nombre: 'Moto-12', modelo: 'Suzuki Address 110', anio: 2022, placa: 'M-2233', status: 'available', lat: 12.1080, lng: -86.2100, km: 2800, repartidorAsignado: null, ultimoMantenimiento: '2026-05-18', proximoMantenimiento: '2026-07-18', costoTotalMantenimiento: 4200 },
];

const MOCK_RIDERS: Rider[] = [
  { id: 'R-01', nombre: 'Carlos Mendoza', email: 'carlos@logifast.com', telefono: '+505 8888-1001', initials: 'CM', color: '#002A5C', status: 'in-service', motoId: 'Moto-03', entregasHoy: 5, kmHoy: 28, entregasTotal: 342, kmTotal: 12400, calificacion: 4.8, conectado: true },
  { id: 'R-02', nombre: 'Ana Torres', email: 'ana@logifast.com', telefono: '+505 8888-1002', initials: 'AT', color: '#FF6600', status: 'in-service', motoId: 'Moto-09', entregasHoy: 4, kmHoy: 22, entregasTotal: 298, kmTotal: 10800, calificacion: 4.9, conectado: true },
  { id: 'R-03', nombre: 'Luis Ramos', email: 'luis@logifast.com', telefono: '+505 8888-1003', initials: 'LR', color: '#002A5C', status: 'available', motoId: 'Moto-01', entregasHoy: 3, kmHoy: 15, entregasTotal: 267, kmTotal: 9600, calificacion: 4.5, conectado: true },
  { id: 'R-04', nombre: 'María García', email: 'maria@logifast.com', telefono: '+505 8888-1004', initials: 'MG', color: '#FF6600', status: 'available', motoId: 'Moto-04', entregasHoy: 2, kmHoy: 10, entregasTotal: 215, kmTotal: 8200, calificacion: 4.7, conectado: true },
  { id: 'R-05', nombre: 'Jorge Pérez', email: 'jorge@logifast.com', telefono: '+505 8888-1005', initials: 'JP', color: '#002A5C', status: 'available', motoId: 'Moto-07', entregasHoy: 3, kmHoy: 18, entregasTotal: 189, kmTotal: 7400, calificacion: 4.3, conectado: true },
  { id: 'R-06', nombre: 'Rosa Díaz', email: 'rosa@logifast.com', telefono: '+505 8888-1006', initials: 'RD', color: '#FF6600', status: 'in-service', motoId: 'Moto-02', entregasHoy: 4, kmHoy: 25, entregasTotal: 312, kmTotal: 11200, calificacion: 4.6, conectado: true },
  { id: 'R-07', nombre: 'Miguel Sevilla', email: 'miguel@logifast.com', telefono: '+505 8888-1007', initials: 'MS', color: '#002A5C', status: 'available', motoId: 'Moto-08', entregasHoy: 1, kmHoy: 8, entregasTotal: 156, kmTotal: 6800, calificacion: 4.4, conectado: true },
  { id: 'R-08', nombre: 'Elena Vargas', email: 'elena@logifast.com', telefono: '+505 8888-1008', initials: 'EV', color: '#FF6600', status: 'in-service', motoId: 'Moto-06', entregasHoy: 3, kmHoy: 20, entregasTotal: 203, kmTotal: 7900, calificacion: 4.2, conectado: true },
];

const MOCK_ALERTS: Alert[] = [
  { id: 'A-01', tipo: 'mantenimiento', titulo: 'Mantenimiento vencido', msg: 'Kilometraje excedido en 500km', motoId: 'Moto-05', tiempo: 'Hace 2h', severidad: 'alta' },
  { id: 'A-02', tipo: 'bateria', titulo: 'Batería baja', msg: 'Nivel de batería al 12%', motoId: 'Moto-10', tiempo: 'Hace 45min', severidad: 'media' },
  { id: 'A-03', tipo: 'incidencia', titulo: 'Incidencia reportada', msg: 'Accidente menor, sin heridos', motoId: 'Moto-06', tiempo: 'Hace 30min', severidad: 'alta' },
  { id: 'A-04', tipo: 'retraso', titulo: 'Entrega retrasada', msg: '15 min sobre ETA estimada', motoId: 'Moto-03', tiempo: 'Hace 10min', severidad: 'baja' },
  { id: 'A-05', tipo: 'mantenimiento', titulo: 'Próximo mantenimiento', msg: 'Programar servicio para 15 Jun', motoId: 'Moto-09', tiempo: 'Hace 1h', severidad: 'media' },
];

const DAILY_REVENUE: DailyRevenue[] = [
  { dia: 'Lun', monto: 5200 }, { dia: 'Mar', monto: 7800 },
  { dia: 'Mié', monto: 6100 }, { dia: 'Jue', monto: 9200 },
  { dia: 'Vie', monto: 8450 }, { dia: 'Sáb', monto: 7100 },
  { dia: 'Dom', monto: 4400 },
];

const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { mes: 'Ene', monto: 12000 }, { mes: 'Feb', monto: 14500 },
  { mes: 'Mar', monto: 13200 }, { mes: 'Abr', monto: 16800 },
  { mes: 'May', monto: 15400 }, { mes: 'Jun', monto: 18200 },
  { mes: 'Jul', monto: 17500 }, { mes: 'Ago', monto: 19800 },
  { mes: 'Sep', monto: 21000 }, { mes: 'Oct', monto: 19500 },
  { mes: 'Nov', monto: 22000 }, { mes: 'Dic', monto: 24500 },
];

const ZONE_ORDERS: ZoneOrder[] = [
  { zona: 'Centro', cantidad: 45 },
  { zona: 'Villa Fontana', cantidad: 32 },
  { zona: 'Los Robles', cantidad: 28 },
  { zona: 'Bello Horizonte', cantidad: 21 },
  { zona: 'Monseñor Lezcano', cantidad: 15 },
  { zona: 'Reparto Schick', cantidad: 12 },
];

const RIDER_PERFORMANCE: RiderPerformance[] = [
  { nombre: 'Carlos M.', entregas: 28 },
  { nombre: 'Ana T.', entregas: 24 },
  { nombre: 'Luis R.', entregas: 21 },
  { nombre: 'María G.', entregas: 19 },
  { nombre: 'Jorge P.', entregas: 16 },
  { nombre: 'Rosa D.', entregas: 14 },
  { nombre: 'Miguel S.', entregas: 12 },
  { nombre: 'Elena V.', entregas: 10 },
];

const ORDER_STATUS_DISTRIBUTION = [
  { name: 'Pendiente', value: 2, color: '#FBBF24' },
  { name: 'En camino', value: 3, color: '#FF6600' },
  { name: 'Recogido', value: 2, color: '#3B82F6' },
  { name: 'Entregado', value: 6, color: '#16A34A' },
  { name: 'Incidencia', value: 2, color: '#DC2626' },
];

const MOCK_ZONES: Zone[] = [
  { id: 'Z-01', nombre: 'Centro Managua', tarifa: 50, activa: true },
  { id: 'Z-02', nombre: 'Villa Fontana', tarifa: 65, activa: true },
  { id: 'Z-03', nombre: 'Los Robles', tarifa: 60, activa: true },
  { id: 'Z-04', nombre: 'Bello Horizonte', tarifa: 75, activa: true },
  { id: 'Z-05', nombre: 'Monseñor Lezcano', tarifa: 55, activa: true },
  { id: 'Z-06', nombre: 'Reparto Schick', tarifa: 60, activa: false },
];

const MOCK_MAINTENANCE_RULES: MaintenanceRule[] = [
  { id: 'MR-01', tipo: 'Cambio de aceite', umbralKm: 2000, descripcion: 'Cambiar aceite del motor y filtro' },
  { id: 'MR-02', tipo: 'Revisión de frenos', umbralKm: 5000, descripcion: 'Inspeccionar pastillas y disco de freno' },
  { id: 'MR-03', tipo: 'Cambio de llantas', umbralKm: 8000, descripcion: 'Revisar y cambiar llantas si es necesario' },
  { id: 'MR-04', tipo: 'Afinación mayor', umbralKm: 10000, descripcion: 'Afinación completa del motor' },
  { id: 'MR-05', tipo: 'Revisión eléctrica', umbralKm: 6000, descripcion: 'Revisar sistema eléctrico y batería' },
  { id: 'MR-06', tipo: 'Cambio de cadena', umbralKm: 12000, descripcion: 'Reemplazar cadena y piñón' },
];

const COMPANY_DATA: CompanyData = {
  nombre: 'LOGIFAST S.A.',
  direccion: 'Centro Comercial Managua, Local 204',
  telefono: '+505 2266-0000',
  email: 'info@logifast.com',
};

const MOCK_USERS: SystemUser[] = [
  { id: 'U-01', nombre: 'Admin Demo', email: 'admin@logifast.com', rol: 'Administrador', activo: true },
  { id: 'U-02', nombre: 'Carlos Mendoza', email: 'carlos@logifast.com', rol: 'Repartidor', activo: true },
  { id: 'U-03', nombre: 'Ana Torres', email: 'ana@logifast.com', rol: 'Repartidor', activo: true },
  { id: 'U-04', nombre: 'Luis Ramos', email: 'luis@logifast.com', rol: 'Repartidor', activo: true },
  { id: 'U-05', nombre: 'María García', email: 'maria@logifast.com', rol: 'Repartidor', activo: true },
  { id: 'U-06', nombre: 'Roberto Ing.', email: 'ingeniero@logifast.com', rol: 'Ingeniero', activo: true },
  { id: 'U-07', nombre: 'María López', email: 'maria.lopez@gmail.com', rol: 'Cliente', activo: true },
  { id: 'U-08', nombre: 'Pedro Ruiz', email: 'pedro.ruiz@gmail.com', rol: 'Cliente', activo: true },
  { id: 'U-09', nombre: 'Jorge Pérez', email: 'jorge@logifast.com', rol: 'Repartidor', activo: false },
];

/* ─── New Mock Data ─── */

const MOCK_INCIDENTS: Incident[] = [
  { id: 'INC-01', orderId: 'LF-2842', tipo: 'falla_mecanica', titulo: 'Falla mecánica en ruta', descripcion: 'Moto se detuvo en carretera Sur', repartidor: 'Ana Torres', motoId: 'Moto-02', gravedad: 'alta', estado: 'activa', lat: 12.0950, lng: -86.2300, timestamp: '2026-06-10T14:30:00' },
  { id: 'INC-02', orderId: 'LF-2842', tipo: 'problema_cliente', titulo: 'Cliente no responde', descripcion: 'No se puede confirmar dirección de entrega', repartidor: 'Ana Torres', motoId: 'Moto-02', gravedad: 'media', estado: 'activa', lat: 12.1000, lng: -86.2400, timestamp: '2026-06-10T13:15:00' },
  { id: 'INC-03', orderId: 'LF-2840', tipo: 'retraso', titulo: 'Entrega retrasada', descripcion: 'Tráfico pesado en Carretera a Masaya', repartidor: 'Luis Ramos', motoId: 'Moto-01', gravedad: 'baja', estado: 'activa', lat: 12.0900, lng: -86.2100, timestamp: '2026-06-10T16:20:00' },
  { id: 'INC-04', orderId: 'LF-2836', tipo: 'paquete_danado', titulo: 'Paquete con daño', descripcion: 'Comida derramada durante transporte', repartidor: 'Ana Torres', motoId: 'Moto-09', gravedad: 'media', estado: 'resuelta', lat: 12.1100, lng: -86.2400, timestamp: '2026-06-09T19:45:00', resolucion: 'Reembolso parcial al cliente', tiempoResolucion: '35 min' },
  { id: 'INC-05', orderId: 'LF-2834', tipo: 'accidente', titulo: 'Accidente menor', descripcion: 'Colisión leve en intersección', repartidor: 'Rosa Díaz', motoId: 'Moto-02', gravedad: 'alta', estado: 'resuelta', lat: 12.1050, lng: -86.2350, timestamp: '2026-06-07T14:30:00', resolucion: 'Repartidor atendido, moto en taller', tiempoResolucion: '2h 15min' },
  { id: 'INC-06', orderId: 'LF-2847', tipo: 'retraso', titulo: 'Retraso por lluvia', descripcion: 'Lluvia fuerte impide avance', repartidor: 'Carlos Mendoza', motoId: 'Moto-03', gravedad: 'baja', estado: 'activa', lat: 12.1150, lng: -86.2450, timestamp: '2026-06-10T15:00:00' },
];

const MOCK_CLIENTS: Client[] = [
  { id: 'CL-01', nombre: 'María López', email: 'maria.lopez@gmail.com', telefono: '+505 8888-1234', direccion: 'Col. Los Robles, Managua', totalEnvios: 24, montoTotal: 3450, ultimoEnvio: '2026-06-10', zonaFrecuente: 'Los Robles' },
  { id: 'CL-02', nombre: 'Pedro Ruiz', email: 'pedro.ruiz@gmail.com', telefono: '+505 8888-5678', direccion: 'Barrio Monseñor Lezcano', totalEnvios: 18, montoTotal: 2100, ultimoEnvio: '2026-06-10', zonaFrecuente: 'Monseñor Lezcano' },
  { id: 'CL-03', nombre: 'Sofía Chamorro', email: 'sofia.chamorro@gmail.com', telefono: '+505 8888-9012', direccion: 'Villa Fontana, Managua', totalEnvios: 12, montoTotal: 1800, ultimoEnvio: '2026-06-10', zonaFrecuente: 'Villa Fontana' },
  { id: 'CL-04', nombre: 'Diego Soto', email: 'diego.soto@gmail.com', telefono: '+505 8888-3456', direccion: 'Bello Horizonte', totalEnvios: 8, montoTotal: 1200, ultimoEnvio: '2026-06-10', zonaFrecuente: 'Bello Horizonte' },
  { id: 'CL-05', nombre: 'Laura Vega', email: 'laura.vega@gmail.com', telefono: '+505 8888-7890', direccion: 'Centro Histórico, Managua', totalEnvios: 32, montoTotal: 4800, ultimoEnvio: '2026-06-09', zonaFrecuente: 'Centro' },
  { id: 'CL-06', nombre: 'Roberto Martínez', email: 'roberto.martinez@gmail.com', telefono: '+505 8888-2345', direccion: 'Col. Centroamérica', totalEnvios: 15, montoTotal: 2625, ultimoEnvio: '2026-06-09', zonaFrecuente: 'Centro' },
  { id: 'CL-07', nombre: 'Carmen Ríos', email: 'carmen.rios@gmail.com', telefono: '+505 8888-6789', direccion: 'Altamira, Managua', totalEnvios: 4, montoTotal: 440, ultimoEnvio: '2026-06-09', zonaFrecuente: 'Los Robles' },
  { id: 'CL-08', nombre: 'Andrés Cruz', email: 'andres.cruz@gmail.com', telefono: '+505 8888-0123', direccion: 'Santo Domingo, Managua', totalEnvios: 22, montoTotal: 5060, ultimoEnvio: '2026-06-09', zonaFrecuente: 'Villa Fontana' },
  { id: 'CL-09', nombre: 'Felipe Reyes', email: 'felipe.reyes@gmail.com', telefono: '+505 8888-8901', direccion: 'Carretera Sur', totalEnvios: 3, montoTotal: 540, ultimoEnvio: '2026-06-08', zonaFrecuente: 'Centro' },
  { id: 'CL-10', nombre: 'Gabriela Navarro', email: 'gabriela.navarro@gmail.com', telefono: '+505 8888-2468', direccion: 'Col. Los Robles', totalEnvios: 7, montoTotal: 1015, ultimoEnvio: '2026-06-08', zonaFrecuente: 'Los Robles' },
];

const MOCK_ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: 'E-01', tipo: 'orden', titulo: 'Orden LF-2847 creada', detalle: 'Envío a Col. Los Robles · C$ 120 · Asignada a Carlos M.', timestamp: '2026-06-10T14:30:00', leido: false },
  { id: 'E-02', tipo: 'repartidor', titulo: 'Carlos M. en camino', detalle: 'Recogiendo paquete en Metrocentro', timestamp: '2026-06-10T14:35:00', leido: false },
  { id: 'E-03', tipo: 'incidencia', titulo: 'Falla mecánica reportada', detalle: 'Moto-02 detenida en Carretera Sur · Ana Torres', timestamp: '2026-06-10T14:30:00', leido: false },
  { id: 'E-04', tipo: 'orden', titulo: 'Orden LF-2846 entregada', detalle: 'Barrio Monseñor Lezcano · Ana Torres · C$ 85', timestamp: '2026-06-10T10:58:00', leido: true },
  { id: 'E-05', tipo: 'flota', titulo: 'Moto-05 en mantenimiento', detalle: 'Kilometraje excedido, enviada a taller', timestamp: '2026-06-10T09:00:00', leido: true },
  { id: 'E-06', tipo: 'orden', titulo: 'Orden LF-2845 creada', detalle: 'Envío a Villa Fontana · C$ 200 · Sin asignar', timestamp: '2026-06-10T15:00:00', leido: false },
  { id: 'E-07', tipo: 'finanzas', titulo: 'Pago recibido', detalle: 'C$ 175 transferencia · Roberto Martínez', timestamp: '2026-06-10T11:00:00', leido: true },
  { id: 'E-08', tipo: 'repartidor', titulo: 'Jorge Pérez conectado', detalle: 'Disponible con Moto-07', timestamp: '2026-06-10T08:30:00', leido: true },
  { id: 'E-09', tipo: 'incidencia', titulo: 'Cliente no responde', detalle: 'Orden LF-2842 · Ana Torres intentó contacto 3 veces', timestamp: '2026-06-10T13:15:00', leido: false },
  { id: 'E-10', tipo: 'config', titulo: 'Tarifa actualizada', detalle: 'Zona Bello Horizonte: C$ 65 → C$ 75', timestamp: '2026-06-09T16:00:00', leido: true },
  { id: 'E-11', tipo: 'orden', titulo: 'Orden LF-2844 recogida', detalle: 'Plaza Inter → Bello Horizonte · Luis Ramos', timestamp: '2026-06-10T14:05:00', leido: false },
  { id: 'E-12', tipo: 'flota', titulo: 'Moto-10 batería baja', detalle: 'Nivel al 12%, requiere carga inmediata', timestamp: '2026-06-10T12:30:00', leido: true },
  { id: 'E-13', tipo: 'repartidor', titulo: 'Rosa Díaz completó 4 entregas', detalle: 'Hoy: 25 km recorridos · C$ 620 cobrados', timestamp: '2026-06-10T17:00:00', leido: true },
  { id: 'E-14', tipo: 'finanzas', titulo: 'Conciliación pendiente', detalle: 'C$ 340 en efectivo por cobrar · Carlos M.', timestamp: '2026-06-10T18:00:00', leido: false },
  { id: 'E-15', tipo: 'incidencia', titulo: 'Retraso por lluvia', detalle: 'Orden LF-2847 · Carlos M. reporta lluvia fuerte', timestamp: '2026-06-10T15:00:00', leido: false },
];

const MOCK_PAYMENT_CONCILIATIONS: PaymentConciliation[] = [
  { id: 'PC-01', repartidor: 'Carlos Mendoza', monto: 340, fecha: '2026-06-10', estado: 'pendiente' },
  { id: 'PC-02', repartidor: 'Ana Torres', monto: 195, fecha: '2026-06-10', estado: 'pendiente' },
  { id: 'PC-03', repartidor: 'Luis Ramos', monto: 280, fecha: '2026-06-09', estado: 'conciliado' },
  { id: 'PC-04', repartidor: 'Rosa Díaz', monto: 620, fecha: '2026-06-10', estado: 'pendiente' },
  { id: 'PC-05', repartidor: 'Jorge Pérez', monto: 150, fecha: '2026-06-09', estado: 'conciliado' },
];

const MOCK_ZONE_POLYGONS: ZonePolygon[] = [
  { id: 'ZP-01', nombre: 'Centro', color: '#002A5C', coords: [[12.140, -86.260], [12.140, -86.244], [12.132, -86.244], [12.132, -86.260], [12.136, -86.262]] },
  { id: 'ZP-02', nombre: 'Villa Fontana', color: '#FF6600', coords: [[12.090, -86.215], [12.090, -86.199], [12.080, -86.199], [12.080, -86.215], [12.085, -86.217]] },
  { id: 'ZP-03', nombre: 'Los Robles', color: '#16A34A', coords: [[12.128, -86.258], [12.128, -86.246], [12.120, -86.246], [12.120, -86.258], [12.124, -86.260]] },
  { id: 'ZP-04', nombre: 'Bello Horizonte', color: '#8B5CF6', coords: [[12.135, -86.286], [12.135, -86.274], [12.125, -86.274], [12.125, -86.286], [12.130, -86.288]] },
  { id: 'ZP-05', nombre: 'Monseñor Lezcano', color: '#3B82F6', coords: [[12.103, -86.237], [12.103, -86.225], [12.093, -86.225], [12.093, -86.237], [12.098, -86.239]] },
  { id: 'ZP-06', nombre: 'Reparto Schick', color: '#F59E0B', coords: [[12.113, -86.245], [12.113, -86.235], [12.103, -86.235], [12.103, -86.245], [12.108, -86.247]] },
];

/* ─── Marketing Mock Data ─── */

const MOCK_CAMPANAS: Campana[] = [
  {
    id: 'CAMP-01', titulo: 'Promo verano', tipo: 'push', segmento: 'Todos los clientes',
    contenido: { titulo: '¡Promo Verano!', cuerpo: '20% de descuento en tu próximo envío. Usa el código VERANO20', boton: 'Usar ahora' },
    estado: 'enviada', enviadaEn: '2026-06-08T10:00:00', destinatarios: 120, abiertos: 85, clicks: 32,
    creadoPor: 'admin', createdAt: '2026-06-07T15:00:00',
  },
  {
    id: 'CAMP-02', titulo: 'Reactivación clientes inactivos', tipo: 'email', segmento: 'Clientes inactivos',
    contenido: { titulo: 'Te extrañamos', cuerpo: 'Hace tiempo que no haces un envío. Tenemos una sorpresa para ti.', boton: 'Ver oferta' },
    estado: 'programada', programadaPara: '2026-06-15T09:00:00', destinatarios: 45, abiertos: 0, clicks: 0,
    creadoPor: 'admin', createdAt: '2026-06-10T14:00:00',
  },
  {
    id: 'CAMP-03', titulo: 'Descuento fin de semana', tipo: 'sms', segmento: 'Clientes frecuentes',
    contenido: { cuerpo: 'LOGIFAST: 15% OFF este fin de semana. Código: FINDE15' },
    estado: 'borrador', destinatarios: 0, abiertos: 0, clicks: 0,
    creadoPor: 'admin', createdAt: '2026-06-10T16:00:00',
  },
];

const MOCK_CODIGOS: CodigoPromocional[] = [
  { id: 'COD-01', codigo: 'LOGI20', tipoDescuento: 'porcentaje', valor: 20, aplicableA: 'Todos los envíos', maxUsos: 100, usosActuales: 45, segmento: 'todos', vigenciaInicio: '2026-06-01', vigenciaFin: '2026-07-31', estado: 'activo', creadoPor: 'admin', createdAt: '2026-06-01' },
  { id: 'COD-02', codigo: 'ENVIO50', tipoDescuento: 'monto', valor: 50, aplicableA: 'Primer envío', maxUsos: 50, usosActuales: 12, segmento: 'Clientes nuevos', vigenciaInicio: '2026-05-01', vigenciaFin: '2026-08-31', estado: 'activo', creadoPor: 'admin', createdAt: '2026-05-01' },
  { id: 'COD-03', codigo: 'RAPIDO15', tipoDescuento: 'porcentaje', valor: 15, aplicableA: 'Envíos > C$100', montoMinimo: 100, maxUsos: 200, usosActuales: 0, segmento: 'todos', vigenciaInicio: '2026-06-10', vigenciaFin: '2026-06-30', estado: 'activo', creadoPor: 'admin', createdAt: '2026-06-10' },
  { id: 'COD-04', codigo: 'BIENVENIDO', tipoDescuento: 'porcentaje', valor: 25, aplicableA: 'Primer envío', maxUsos: 0, usosActuales: 89, segmento: 'Clientes nuevos', vigenciaInicio: '2026-01-01', vigenciaFin: '2026-12-31', estado: 'activo', creadoPor: 'admin', createdAt: '2026-01-01' },
];

const MOCK_BANNERS: Banner[] = [
  { id: 'BAN-01', titulo: '20% en tu próximo envío', subtitulo: 'Usa el código LOGI20', tipo: 'promo_grande', colorFondo: '#FF5722', colorTexto: '#FFFFFF', botonTexto: 'Usar ahora', botonAccion: 'Ir a solicitar envío', segmento: 'todos', mostrarEn: 'app', posicion: 1, estado: 'activo', impresiones: 1540, clicks: 230, creadoPor: 'admin', createdAt: '2026-06-05' },
  { id: 'BAN-02', titulo: 'Envíos los domingos', subtitulo: 'Ahora también los domingos', tipo: 'tarjeta_compacta', colorFondo: '#1B1B2F', colorTexto: '#FFFFFF', icono: 'calendar', segmento: 'todos', mostrarEn: 'app', posicion: 2, estado: 'activo', impresiones: 980, clicks: 67, creadoPor: 'admin', createdAt: '2026-06-08' },
  { id: 'BAN-03', titulo: 'Nuevo: seguimiento mejorado', tipo: 'notificacion', colorFondo: '#2979FF', colorTexto: '#FFFFFF', icono: 'map', segmento: 'todos', mostrarEn: 'ambos', posicion: 3, estado: 'activo', impresiones: 2100, clicks: 145, creadoPor: 'admin', createdAt: '2026-06-01' },
  { id: 'BAN-04', titulo: 'Refiere a un amigo y gana', subtitulo: 'Ambos obtienen C$50 de descuento', tipo: 'slider', colorFondo: '#1B1B2F', colorTexto: '#FFFFFF', gradiente: { from: '#1B1B2F', to: '#FF5722', direction: 'to right' }, botonTexto: 'Invitar', botonAccion: 'Abrir link externo', segmento: 'Clientes frecuentes', mostrarEn: 'app', posicion: 4, estado: 'inactivo', impresiones: 0, clicks: 0, creadoPor: 'admin', createdAt: '2026-06-09' },
];

const MOCK_FEED_ITEMS: FeedItem[] = [
  { id: 'FI-01', tipo: 'anuncio', titulo: 'Horario extendido los viernes', descripcion: 'Ahora atendemos hasta las 9pm los viernes', icono: 'clock', segmento: 'todos', posicion: 1, estado: 'activo', impresiones: 890, clicks: 34, creadoPor: 'admin', createdAt: '2026-06-08' },
  { id: 'FI-02', tipo: 'promocion', titulo: 'Usa LOGI20 y ahorra', descripcion: '20% de descuento en tu próximo envío', icono: 'tag', botonTexto: 'Copiar código', codigoPromo: 'LOGI20', segmento: 'todos', posicion: 2, estado: 'activo', impresiones: 1200, clicks: 89, creadoPor: 'admin', createdAt: '2026-06-06' },
  { id: 'FI-03', tipo: 'novedad', titulo: 'Ahora puedes pagar con transferencia', descripcion: 'Nuevo método de pago disponible', icono: 'credit-card', segmento: 'todos', posicion: 3, estado: 'activo', impresiones: 760, clicks: 45, creadoPor: 'admin', createdAt: '2026-06-04' },
  { id: 'FI-04', tipo: 'recordatorio', titulo: 'Hace 15 días no envías, ¡te extrañamos!', descripcion: 'Tenemos una sorpresa para ti', icono: 'heart', botonTexto: 'Ver oferta', segmento: 'Clientes inactivos', posicion: 4, estado: 'activo', impresiones: 340, clicks: 23, creadoPor: 'admin', createdAt: '2026-06-10' },
  { id: 'FI-05', tipo: 'anuncio', titulo: 'Cobertura ampliada a Masaya', descripcion: 'Ahora también llegamos a Masaya y sus alrededores', icono: 'map-pin', segmento: 'todos', posicion: 5, estado: 'activo', impresiones: 560, clicks: 18, creadoPor: 'admin', createdAt: '2026-06-09' },
];

const MOCK_PLANTILLAS: PlantillaMensaje[] = [
  { id: 'TPL-01', nombre: 'Confirmación de orden', categoria: 'orden', contenido: 'Hola {{nombre}}, tu orden #{{orden_id}} ha sido confirmada. Tu repartidor {{repartidor}} está en camino.', variables: ['nombre', 'orden_id', 'repartidor'], esDefault: true, createdAt: '2026-01-01' },
  { id: 'TPL-02', nombre: 'Orden entregada', categoria: 'orden', contenido: 'Tu orden #{{orden_id}} fue entregada exitosamente. ¡Gracias por usar LOGIFAST!', variables: ['orden_id'], esDefault: true, createdAt: '2026-01-01' },
  { id: 'TPL-03', nombre: 'Recordatorio', categoria: 'promocion', contenido: 'Hola {{nombre}}, hace {{dias}} días que no haces un envío. ¡Tenemos una promo para ti!', variables: ['nombre', 'dias'], esDefault: true, createdAt: '2026-01-01' },
  { id: 'TPL-04', nombre: 'Incidencia', categoria: 'incidencia', contenido: 'Lamentamos informarte que tu orden #{{orden_id}} presenta una incidencia. Estamos trabajando en resolverlo.', variables: ['orden_id'], esDefault: true, createdAt: '2026-01-01' },
  { id: 'TPL-05', nombre: 'Código promocional', categoria: 'promocion', contenido: '¡{{nombre}}, usa el código {{codigo}} y obtiene {{descuento}} en tu próximo envío!', variables: ['nombre', 'codigo', 'descuento'], esDefault: true, createdAt: '2026-01-01' },
];

const MOCK_CONVERSACIONES: Conversacion[] = [
  {
    id: 'CONV-01', participanteId: 'CLI-01', participanteNombre: 'María López', participanteRol: 'cliente',
    ultimoMensaje: '¿A qué hora llegará mi envío?', ultimoTimestamp: '2026-06-10T15:30:00', noLeidos: 1,
    mensajes: [
      { id: 'MSG-01', emisorId: 'CLI-01', emisorNombre: 'María López', receptorId: 'admin', receptorNombre: 'Admin', contenido: 'Hola, hice un envío esta mañana', leido: true, enviadoEn: '2026-06-10T10:00:00' },
      { id: 'MSG-02', emisorId: 'admin', emisorNombre: 'Admin', receptorId: 'CLI-01', receptorNombre: 'María López', contenido: 'Hola María, tu orden LF-2847 está en camino', leido: true, enviadoEn: '2026-06-10T10:05:00' },
      { id: 'MSG-03', emisorId: 'CLI-01', emisorNombre: 'María López', receptorId: 'admin', receptorNombre: 'Admin', contenido: 'Perfecto, gracias', leido: true, enviadoEn: '2026-06-10T10:10:00' },
      { id: 'MSG-04', emisorId: 'admin', emisorNombre: 'Admin', receptorId: 'CLI-01', receptorNombre: 'María López', contenido: 'Tu repartidor es Carlos Mendoza, llegará en aprox 20 min', leido: true, enviadoEn: '2026-06-10T14:30:00' },
      { id: 'MSG-05', emisorId: 'CLI-01', emisorNombre: 'María López', receptorId: 'admin', receptorNombre: 'Admin', contenido: '¿A qué hora llegará mi envío?', leido: false, enviadoEn: '2026-06-10T15:30:00' },
    ],
  },
  {
    id: 'CONV-02', participanteId: 'RID-01', participanteNombre: 'Carlos M.', participanteRol: 'repartidor',
    ultimoMensaje: 'Ya recogí el paquete, en camino', ultimoTimestamp: '2026-06-10T14:35:00', noLeidos: 0,
    mensajes: [
      { id: 'MSG-06', emisorId: 'admin', emisorNombre: 'Admin', receptorId: 'RID-01', receptorNombre: 'Carlos M.', contenido: 'Carlos, te asigné la orden LF-2847', leido: true, enviadoEn: '2026-06-10T14:30:00' },
      { id: 'MSG-07', emisorId: 'RID-01', emisorNombre: 'Carlos M.', receptorId: 'admin', receptorNombre: 'Admin', contenido: 'Recibido, voy para allá', leido: true, enviadoEn: '2026-06-10T14:32:00' },
      { id: 'MSG-08', emisorId: 'RID-01', emisorNombre: 'Carlos M.', receptorId: 'admin', receptorNombre: 'Admin', contenido: 'Ya recogí el paquete, en camino', leido: true, enviadoEn: '2026-06-10T14:35:00' },
    ],
  },
  {
    id: 'CONV-03', participanteId: 'CLI-04', participanteNombre: 'Pedro Ruiz', participanteRol: 'cliente',
    ultimoMensaje: 'Necesito cambiar la dirección de entrega', ultimoTimestamp: '2026-06-10T11:00:00', noLeidos: 1,
    mensajes: [
      { id: 'MSG-09', emisorId: 'CLI-04', emisorNombre: 'Pedro Ruiz', receptorId: 'admin', receptorNombre: 'Admin', contenido: 'Necesito cambiar la dirección de entrega', leido: false, enviadoEn: '2026-06-10T11:00:00' },
      { id: 'MSG-10', emisorId: 'admin', emisorNombre: 'Admin', receptorId: 'CLI-04', receptorNombre: 'Pedro Ruiz', contenido: 'Claro, ¿cuál es la nueva dirección?', leido: true, enviadoEn: '2026-06-10T11:05:00' },
    ],
  },
];

const MOCK_NOTIFICACIONES_AUTO: NotificacionAutomatica[] = [
  { id: 'NA-01', evento: 'orden_creada', etiqueta: 'Orden confirmada', activa: true, canal: 'push', plantilla: 'Hola {{nombre}}, tu orden #{{orden_id}} ha sido confirmada.', destinatario: 'cliente' },
  { id: 'NA-02', evento: 'repartidor_asignado', etiqueta: 'Repartidor asignado', activa: true, canal: 'push', plantilla: '{{repartidor}} fue asignado a tu orden #{{orden_id}}.', destinatario: 'cliente' },
  { id: 'NA-03', evento: 'orden_encamino', etiqueta: 'Repartidor en camino', activa: true, canal: 'todos', plantilla: 'Tu repartidor está en camino. Llegará en ~15 min.', destinatario: 'cliente' },
  { id: 'NA-04', evento: 'orden_entregada', etiqueta: 'Orden entregada', activa: true, canal: 'push', plantilla: 'Tu orden #{{orden_id}} fue entregada. ¡Gracias!', destinatario: 'cliente' },
  { id: 'NA-05', evento: 'nueva_asignacion', etiqueta: 'Nueva asignación', activa: true, canal: 'push', plantilla: 'Nueva orden asignada: #{{orden_id}}. Origen: {{origen}}', destinatario: 'repartidor' },
  { id: 'NA-06', evento: 'alerta_mantenimiento', etiqueta: 'Alerta de mantenimiento', activa: true, canal: 'email', plantilla: 'La moto {{moto_id}} requiere mantenimiento: {{detalle}}', destinatario: 'ingeniero' },
  { id: 'NA-07', evento: 'incidencia_reportada', etiqueta: 'Incidencia reportada', activa: true, canal: 'todos', plantilla: 'Incidencia en orden #{{orden_id}}: {{detalle}}', destinatario: 'admin' },
  { id: 'NA-08', evento: 'pago_recibido', etiqueta: 'Pago recibido', activa: true, canal: 'push', plantilla: 'Pago de C${{monto}} recibido por orden #{{orden_id}}.', destinatario: 'cliente' },
];

/* ─── Config Mock Data ─── */

const MOCK_HORARIOS: ConfiguracionHorario[] = [
  { id: 'H-01', dia: 1, horaInicio: '07:00', horaFin: '20:00', activo: true, recargoNocturno: 0 },
  { id: 'H-02', dia: 2, horaInicio: '07:00', horaFin: '20:00', activo: true, recargoNocturno: 0 },
  { id: 'H-03', dia: 3, horaInicio: '07:00', horaFin: '20:00', activo: true, recargoNocturno: 0 },
  { id: 'H-04', dia: 4, horaInicio: '07:00', horaFin: '20:00', activo: true, recargoNocturno: 0 },
  { id: 'H-05', dia: 5, horaInicio: '07:00', horaFin: '21:00', activo: true, recargoNocturno: 0 },
  { id: 'H-06', dia: 6, horaInicio: '08:00', horaFin: '18:00', activo: true, recargoNocturno: 0 },
  { id: 'H-07', dia: 0, horaInicio: '09:00', horaFin: '14:00', activo: false, recargoNocturno: 0 },
];

const MOCK_FERIADOS: Feriado[] = [
  { id: 'FER-01', fecha: '2026-07-19', nombre: 'Día de la Revolución', recargo: 50 },
  { id: 'FER-02', fecha: '2026-09-14', nombre: 'Batalla de San Jacinto', recargo: 30 },
  { id: 'FER-03', fecha: '2026-09-15', nombre: 'Independencia de Centroamérica', recargo: 30 },
  { id: 'FER-04', fecha: '2026-12-25', nombre: 'Navidad', recargo: 50 },
  { id: 'FER-05', fecha: '2026-01-01', nombre: 'Año Nuevo', recargo: 50 },
];

const MOCK_INTEGRACIONES: Integracion[] = [
  { id: 'INT-01', nombre: 'WhatsApp Business API', descripcion: 'Notificaciones por WhatsApp', icono: 'message-circle', estado: 'conectado' },
  { id: 'INT-02', nombre: 'Pasarela de pago', descripcion: 'Pagos con tarjeta y transferencia', icono: 'credit-card', estado: 'conectado' },
  { id: 'INT-03', nombre: 'Google Maps API', descripcion: 'Geocodificación y rutas', icono: 'map', estado: 'conectado' },
  { id: 'INT-04', nombre: 'Twilio', descripcion: 'SMS masivos', icono: 'smartphone', estado: 'no_configurado' },
  { id: 'INT-05', nombre: 'SendGrid', descripcion: 'Emails masivos', icono: 'mail', estado: 'no_configurado' },
];

/* ─── SuperAdmin Mock Data ─── */

const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'AL-01', userId: 'admin', usuario: 'Super Admin', accion: 'crear', recurso: 'campaña', recursoId: 'CAMP-01', detalles: 'Campaña "Promo verano" creada', ip: '192.168.1.100', dispositivo: 'Chrome/Mac', createdAt: '2026-06-10T15:00:00' },
  { id: 'AL-02', userId: 'admin', usuario: 'Super Admin', accion: 'enviar', recurso: 'campaña', recursoId: 'CAMP-01', detalles: 'Campaña enviada a 120 clientes', ip: '192.168.1.100', dispositivo: 'Chrome/Mac', createdAt: '2026-06-10T15:30:00' },
  { id: 'AL-03', userId: 'admin', usuario: 'Super Admin', accion: 'editar', recurso: 'código_promo', recursoId: 'COD-01', detalles: 'Código LOGI20 actualizado', ip: '192.168.1.100', dispositivo: 'Chrome/Mac', createdAt: '2026-06-10T12:00:00' },
  { id: 'AL-04', userId: 'U-02', usuario: 'Despachador', accion: 'despachar', recurso: 'orden', recursoId: 'LF-2847', detalles: 'Orden asignada a Carlos M.', ip: '192.168.1.101', dispositivo: 'Chrome/Win', createdAt: '2026-06-10T14:30:00' },
  { id: 'AL-05', userId: 'admin', usuario: 'Super Admin', accion: 'crear', recurso: 'banner', recursoId: 'BAN-01', detalles: 'Banner "20% en tu próximo envío" creado', ip: '192.168.1.100', dispositivo: 'Chrome/Mac', createdAt: '2026-06-05T10:00:00' },
  { id: 'AL-06', userId: 'U-03', usuario: 'Ana Torres', accion: 'entregar', recurso: 'orden', recursoId: 'LF-2846', detalles: 'Orden entregada exitosamente', ip: '10.0.0.5', dispositivo: 'Android/App', createdAt: '2026-06-10T10:58:00' },
  { id: 'AL-07', userId: 'admin', usuario: 'Super Admin', accion: 'pausar', recurso: 'código_promo', recursoId: 'COD-03', detalles: 'Código RAPIDO15 pausado', ip: '192.168.1.100', dispositivo: 'Chrome/Mac', createdAt: '2026-06-10T16:00:00' },
  { id: 'AL-08', userId: 'admin', usuario: 'Super Admin', accion: 'editar', recurso: 'horario', detalles: 'Horario viernes extendido a 21:00', ip: '192.168.1.100', dispositivo: 'Chrome/Mac', createdAt: '2026-06-08T09:00:00' },
];

const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'FF-01', nombre: 'Habilitar chat', descripcion: 'Chat en tiempo real entre admin, clientes y repartidores', habilitado: true },
  { id: 'FF-02', nombre: 'Habilitar campañas', descripcion: 'Campañas de notificación masiva', habilitado: true },
  { id: 'FF-03', nombre: 'Habilitar códigos promo', descripcion: 'Sistema de códigos promocionales', habilitado: true },
  { id: 'FF-04', nombre: 'Habilitar banners', descripcion: 'Banners promocionales en la app del cliente', habilitado: true },
  { id: 'FF-05', nombre: 'Habilitar feed', descripcion: 'Feed de contenido dinámico', habilitado: false },
  { id: 'FF-06', nombre: 'Modo mantenimiento', descripcion: 'Bloquea el acceso para todos excepto super admin', habilitado: false },
];

const MOCK_MARKETING_KPI: MarketingKPI = {
  clientesActivosMes: 87,
  tendenciaActivos: 12,
  tasaRetencion: 68,
  frecuenciaPromedio: 3.2,
  valorPromedioEnvio: 145,
  costoAdquisicion: 35,
};

/* ─── Client Experience Mock Data ─── */

const MOCK_CLIENT_NOTIFICACIONES: ClientNotificacion[] = [
  { id: 'CN-01', tipo: 'repartidor_camino', titulo: '¡Tu envío LF-2847 está en camino!', descripcion: 'El repartidor se dirige al punto de recogida', leida: false, relacionadoId: 'LF-2847', timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: 'CN-02', tipo: 'paquete_recogido', titulo: 'Repartidor Carlos M. ha recogido tu paquete', descripcion: 'Tu paquete está en camino al destino', leida: false, relacionadoId: 'LF-2847', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'CN-03', tipo: 'entrega_exitosa', titulo: 'Orden LF-2830 entregada exitosamente', descripcion: 'El paquete fue entregado en Barrio Monseñor Lezcano', leida: true, relacionadoId: 'LF-2830', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'CN-04', tipo: 'codigo_nuevo', titulo: 'Nuevo código disponible: LOGI20', descripcion: 'Usa LOGI20 y obtén 20% de descuento en tu próximo envío', leida: true, timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'CN-05', tipo: 'incidencia', titulo: 'Tu envío LF-2789 presenta una incidencia', descripcion: 'Estamos trabajando para resolverlo. Te mantendremos informado.', leida: true, relacionadoId: 'LF-2789', timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
];

const MOCK_DIRECCIONES_GUARDADAS: DireccionGuardada[] = [
  { id: 'DG-01', etiqueta: 'Casa', direccion: 'Col. Los Robles, Managua', lat: 12.1245, lng: -86.2520 },
  { id: 'DG-02', etiqueta: 'Trabajo', direccion: 'Centro Comercial Metrocentro, Managua', lat: 12.1150, lng: -86.2362 },
  { id: 'DG-03', etiqueta: 'Mamá', direccion: 'Barrio Monseñor Lezcano, Managua', lat: 12.0980, lng: -86.2310 },
];

const MOCK_DIRECCIONES_SUGERENCIAS: DireccionSugerencia[] = [
  { id: 'DS-01', direccion: 'Metrocentro, Managua', barrio: 'Centro', lat: 12.1150, lng: -86.2362 },
  { id: 'DS-02', direccion: 'Galerías Santo Domingo', barrio: 'Santo Domingo', lat: 12.0900, lng: -86.2180 },
  { id: 'DS-03', direccion: 'Universidad Centroamericana', barrio: 'Los Robles', lat: 12.1029, lng: -86.2545 },
  { id: 'DS-04', direccion: 'Hospital Metropolitano', barrio: 'Altamira', lat: 12.1050, lng: -86.2450 },
  { id: 'DS-05', direccion: 'Mercado Oriental', barrio: 'Centro', lat: 12.1320, lng: -86.2220 },
  { id: 'DS-06', direccion: 'Plaza Inter', barrio: 'Centro', lat: 12.1180, lng: -86.2650 },
  { id: 'DS-07', direccion: 'Col. Los Robles, Managua', barrio: 'Los Robles', lat: 12.1245, lng: -86.2520 },
  { id: 'DS-08', direccion: 'Barrio Monseñor Lezcano', barrio: 'Lezcano', lat: 12.0980, lng: -86.2310 },
  { id: 'DS-09', direccion: 'Villa Fontana, Managua', barrio: 'Villa Fontana', lat: 12.0850, lng: -86.2070 },
  { id: 'DS-10', direccion: 'Bello Horizonte', barrio: 'Bello Horizonte', lat: 12.1300, lng: -86.2800 },
  { id: 'DS-11', direccion: 'Reparto Schick', barrio: 'Schick', lat: 12.1080, lng: -86.2400 },
  { id: 'DS-12', direccion: 'Carretera a Masaya', barrio: 'Masaya', lat: 12.0950, lng: -86.2100 },
  { id: 'DS-13', direccion: 'Centro Histórico, Managua', barrio: 'Centro', lat: 12.1360, lng: -86.2520 },
  { id: 'DS-14', direccion: 'Col. Centroamérica', barrio: 'Centroamérica', lat: 12.1150, lng: -86.2600 },
  { id: 'DS-15', direccion: 'Las Colinas', barrio: 'Las Colinas', lat: 12.1250, lng: -86.2480 },
];

/* ─── V2 Mock Data ─── */

const MOCK_REPARTIDORES_INFO: Record<string, RepartidorInfo> = {
  'CM': { id: 'r1', nombre: 'Carlos Mendoza', initials: 'CM', color: '#4CAF50', calificacion: 4.8, totalEntregas: 287, moto: 'Honda Wave 125', telefono: '+505 8888-1111', lat: 12.1120, lng: -86.2400 },
  'AT': { id: 'r2', nombre: 'Ana Torres', initials: 'AT', color: '#E91E63', calificacion: 4.9, totalEntregas: 312, moto: 'Yamaha NMAX', telefono: '+505 8888-2222', lat: 12.1080, lng: -86.2480 },
  'LR': { id: 'r3', nombre: 'Luis Ramos', initials: 'LR', color: '#2196F3', calificacion: 4.6, totalEntregas: 195, moto: 'Suzuki AX4', telefono: '+505 8888-3333', lat: 12.1200, lng: -86.2600 },
  'JP': { id: 'r4', nombre: 'Jorge Pérez', initials: 'JP', color: '#FF9800', calificacion: 4.7, totalEntregas: 256, moto: 'Honda PCX', telefono: '+505 8888-4444', lat: 12.0950, lng: -86.2300 },
  'RD': { id: 'r5', nombre: 'Rosa Díaz', initials: 'RD', color: '#9C27B0', calificacion: 4.5, totalEntregas: 143, moto: 'TVS Ntorq', telefono: '+505 8888-5555', lat: 12.1100, lng: -86.2350 },
  'MS': { id: 'r6', nombre: 'Miguel Sevilla', initials: 'MS', color: '#00BCD4', calificacion: 4.4, totalEntregas: 98, moto: 'Honda Click', telefono: '+505 8888-6666', lat: 12.1300, lng: -86.2700 },
};

const MOCK_CHAT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'chat-2847',
    orderId: 'LF-2847',
    repartidor: MOCK_REPARTIDORES_INFO['CM'],
    active: true,
    messages: [
      { id: 'm1', senderId: 'sistema', senderName: 'Sistema', senderType: 'sistema', content: 'Orden asignada a Carlos M.', timestamp: '14:21', read: true },
      { id: 'm2', senderId: 'r1', senderName: 'Carlos M.', senderType: 'repartidor', content: 'Hola! Ya voy en camino a recoger tu paquete', timestamp: '14:22', read: true },
      { id: 'm3', senderId: 'cliente', senderName: 'María', senderType: 'cliente', content: 'Genial, te espero en la entrada principal de Metrocentro', timestamp: '14:23', read: true },
      { id: 'm4', senderId: 'sistema', senderName: 'Sistema', senderType: 'sistema', content: 'Carlos M. está en camino a recoger', timestamp: '14:25', read: true },
    ],
  },
];

const MOCK_CALIFICACIONES: Calificacion[] = [
  { id: 'cal-1', orderId: 'LF-2846', repartidorId: 'r2', repartidorNombre: 'Ana Torres', estrellas: 5, etiquetas: ['Rápido', 'Cuidadoso'], comentario: 'Excelente servicio, llegó antes de lo esperado', favorito: true, fecha: '2026-06-10', editable: false },
  { id: 'cal-2', orderId: 'LF-2841', repartidorId: 'r4', repartidorNombre: 'Jorge Pérez', estrellas: 5, etiquetas: ['Amable', 'Excelente servicio'], comentario: '', favorito: false, fecha: '2026-06-09', editable: false },
  { id: 'cal-3', orderId: 'LF-2838', repartidorId: 'r3', repartidorNombre: 'Luis Ramos', estrellas: 4, etiquetas: ['Rápido'], comentario: 'Bien pero tardó un poco', favorito: false, fecha: '2026-06-08', editable: false },
];

const MOCK_FIDELIZACION: DatosFidelizacion = {
  puntos: 245,
  nivel: 'plata',
  historial: [
    { id: 'fh1', fecha: '2026-06-10', accion: 'Envío completado LF-2846', puntos: 10 },
    { id: 'fh2', fecha: '2026-06-10', accion: 'Calificación 5 estrellas', puntos: 5 },
    { id: 'fh3', fecha: '2026-06-10', accion: 'Gasto C$200 (5 pts/C$100)', puntos: 10 },
    { id: 'fh4', fecha: '2026-06-09', accion: 'Envío completado LF-2841', puntos: 10 },
    { id: 'fh5', fecha: '2026-06-09', accion: 'Calificación 5 estrellas', puntos: 5 },
    { id: 'fh6', fecha: '2026-06-09', accion: 'Gasto C$110 (5 pts/C$100)', puntos: 5 },
    { id: 'fh7', fecha: '2026-06-08', accion: 'Envío completado LF-2838', puntos: 10 },
    { id: 'fh8', fecha: '2026-06-08', accion: 'Gasto C$175 (5 pts/C$100)', puntos: 5 },
    { id: 'fh9', fecha: '2026-06-08', accion: 'Primer envío bonus', puntos: 20 },
    { id: 'fh10', fecha: '2026-06-07', accion: 'Referido: Pedro R. se registró', puntos: 50 },
    { id: 'fh11', fecha: '2026-06-07', accion: 'Canje: C$50 descuento', puntos: -200 },
    { id: 'fh12', fecha: '2026-06-05', accion: 'Envío completado LF-2830', puntos: 10 },
  ],
};

const MOCK_REFERIDOS: DatosReferidos = {
  codigo: 'MARIA-LF',
  link: 'logifast.com/r/MARIA-LF',
  referidos: [
    { id: 'ref1', nombre: 'Pedro R.', fechaRegistro: '2026-06-07', primerEnvio: true },
    { id: 'ref2', nombre: 'Sofía C.', fechaRegistro: '2026-06-09', primerEnvio: false },
  ],
  puntosGanados: 50,
};

/* ═══════════════════════════════════════════════
   ZUSTAND STORE
   ═══════════════════════════════════════════════ */

export type ModuleKey = 'overview' | 'pedidos' | 'flota' | 'repartidores' | 'reportes' | 'config' | 'despacho' | 'finanzas' | 'clientes' | 'incidencias' | 'marketing' | 'comunicaciones' | 'superadmin';

interface AppState {
  /* Data */
  orders: Order[];
  motos: Moto[];
  riders: Rider[];
  alerts: Alert[];
  zones: Zone[];
  maintenanceRules: MaintenanceRule[];
  companyData: CompanyData;
  users: SystemUser[];
  dailyRevenue: DailyRevenue[];
  monthlyRevenue: MonthlyRevenue[];
  zoneOrders: ZoneOrder[];
  riderPerformance: RiderPerformance[];
  orderStatusDistribution: { name: string; value: number; color: string }[];

  /* New Data */
  incidents: Incident[];
  clients: Client[];
  activityEvents: ActivityEvent[];
  paymentConciliations: PaymentConciliation[];
  zonePolygons: ZonePolygon[];

  /* Marketing Data */
  campanas: Campana[];
  codigos: CodigoPromocional[];
  banners: Banner[];
  feedItems: FeedItem[];
  marketingKPI: MarketingKPI;

  /* Communications Data */
  conversaciones: Conversacion[];
  plantillas: PlantillaMensaje[];
  notificacionesAuto: NotificacionAutomatica[];

  /* Config Data */
  horarios: ConfiguracionHorario[];
  feriados: Feriado[];
  integraciones: Integracion[];

  /* SuperAdmin Data */
  auditLog: AuditLogEntry[];
  featureFlags: FeatureFlag[];

  /* Client Data */
  clientNotificaciones: ClientNotificacion[];
  direccionesGuardadas: DireccionGuardada[];
  direccionesSugerencias: DireccionSugerencia[];
  clientActiveModule: ClientModuleKey;
  clientModuleFade: boolean;
  solicitudEnvio: SolicitudEnvio;
  envioConfirmado: boolean;
  envioConfirmadoId: string;
  clientSearchQuery: string;
  clientEnvioTab: 'activos' | 'historial';
  clientEnvioFilter: string;
  clientNotifOpen: boolean;

  /* V2 Client Data */
  trackingOrderId: string | null;
  trackingSteps: TrackingStep[];
  trackingETA: number; // minutes
  chatConversations: ChatConversation[];
  chatOpen: boolean;
  chatOrderId: string | null;
  calificaciones: Calificacion[];
  ratingModalOpen: boolean;
  ratingOrderId: string | null;
  fidelizacion: DatosFidelizacion;
  referidos: DatosReferidos;
  scheduleMode: 'ahora' | 'programar';
  scheduleDate: string | null;
  scheduleTime: string | null;

  /* UI State */
  activeModule: ModuleKey;
  moduleFade: boolean;

  /* Pedidos */
  filterStatus: OrderStatus | 'todos';
  searchQuery: string;
  currentPage: number;
  dateFilter: string;

  /* Modals */
  createOrderOpen: boolean;
  detailOrder: Order | null;
  reassignOrder: Order | null;
  addMotoOpen: boolean;
  editMoto: Moto | null;
  addRiderOpen: boolean;
  editRider: Rider | null;
  riderDetail: Rider | null;

  /* Flota */
  flotaFilter: MotoStatus | 'all';
  expandedMoto: string | null;

  /* Toasts */
  toasts: ToastItem[];

  /* New UI State */
  commandPaletteOpen: boolean;
  notificationsOpen: boolean;
  simulationRunning: boolean;
  lastSimulationUpdate: number;

  /* Actions */
  setActiveModule: (mod: ModuleKey) => void;
  setFilterStatus: (status: OrderStatus | 'todos') => void;
  setSearchQuery: (q: string) => void;
  setCurrentPage: (p: number) => void;
  setDateFilter: (f: string) => void;
  setCreateOrderOpen: (open: boolean) => void;
  setDetailOrder: (order: Order | null) => void;
  setReassignOrder: (order: Order | null) => void;
  setAddMotoOpen: (open: boolean) => void;
  setEditMoto: (moto: Moto | null) => void;
  setAddRiderOpen: (open: boolean) => void;
  setEditRider: (rider: Rider | null) => void;
  setRiderDetail: (rider: Rider | null) => void;
  setFlotaFilter: (filter: MotoStatus | 'all') => void;
  setExpandedMoto: (id: string | null) => void;

  reassignRider: (orderId: string, riderName: string, riderInitials: string) => void;
  addOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => void;
  addMoto: (moto: Moto) => void;
  updateMoto: (moto: Moto) => void;
  addRider: (rider: Rider) => void;
  updateRider: (rider: Rider) => void;
  toggleRiderConnection: (riderId: string) => void;
  updateMotoPositions: () => void;

  /* New Actions */
  setCommandPaletteOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  addIncident: (incident: Incident) => void;
  resolveIncident: (id: string, resolucion: string) => void;
  addActivityEvent: (event: Omit<ActivityEvent, 'id'>) => void;
  markEventsAsRead: () => void;
  conciliatePayment: (id: string) => void;
  simulateNewOrder: () => void;
  simulateDelivery: () => void;
  simulateStatusChange: () => void;
  dispatchOrder: (orderId: string, riderId: string) => void;
  toggleSimulation: () => void;

  /* Toast Actions */
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;

  /* Marketing Actions */
  addCampana: (campana: Campana) => void;
  updateCampana: (id: string, updates: Partial<Campana>) => void;
  deleteCampana: (id: string) => void;
  addCodigo: (codigo: CodigoPromocional) => void;
  updateCodigo: (id: string, updates: Partial<CodigoPromocional>) => void;
  deleteCodigo: (id: string) => void;
  addBanner: (banner: Banner) => void;
  updateBanner: (id: string, updates: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  addFeedItem: (item: FeedItem) => void;
  updateFeedItem: (id: string, updates: Partial<FeedItem>) => void;
  deleteFeedItem: (id: string) => void;

  /* Communications Actions */
  addMensaje: (convId: string, mensaje: MensajeDirecto) => void;
  markConversacionLeida: (convId: string) => void;
  addPlantilla: (plantilla: PlantillaMensaje) => void;
  updatePlantilla: (id: string, updates: Partial<PlantillaMensaje>) => void;
  deletePlantilla: (id: string) => void;
  toggleNotificacionAuto: (id: string) => void;

  /* Config Actions */
  updateHorario: (id: string, updates: Partial<ConfiguracionHorario>) => void;
  addFeriado: (feriado: Feriado) => void;
  deleteFeriado: (id: string) => void;

  /* SuperAdmin Actions */
  toggleFeatureFlag: (id: string) => void;
  addAuditEntry: (entry: Omit<AuditLogEntry, 'id'>) => void;

  /* Client Actions */
  setClientActiveModule: (mod: ClientModuleKey) => void;
  setSolicitudEnvio: (data: Partial<SolicitudEnvio>) => void;
  resetSolicitudEnvio: () => void;
  confirmarEnvio: (orderId: string) => void;
  setClientSearchQuery: (q: string) => void;
  setClientEnvioTab: (tab: 'activos' | 'historial') => void;
  setClientEnvioFilter: (filter: string) => void;
  setClientNotifOpen: (open: boolean) => void;
  markClientNotifRead: (id: string) => void;
  markAllClientNotifRead: () => void;
  addDireccionGuardada: (dir: DireccionGuardada) => void;
  removeDireccionGuardada: (id: string) => void;
  validateCodigoPromo: (codigo: string) => { valid: boolean; descuento: number; tipo: string };

  /* V2 Client Actions */
  setTrackingOrder: (orderId: string | null) => void;
  advanceTrackingStep: () => void;
  updateTrackingETA: () => void;
  setChatOpen: (open: boolean) => void;
  setChatOrderId: (orderId: string | null) => void;
  sendChatMessage: (orderId: string, content: string, senderType: 'cliente' | 'repartidor' | 'sistema') => void;
  addSystemChatMessage: (orderId: string, content: string) => void;
  setRatingModalOpen: (open: boolean) => void;
  setRatingOrderId: (orderId: string | null) => void;
  submitCalificacion: (cal: Omit<Calificacion, 'id'>) => void;
  addFidelizacionPuntos: (accion: string, puntos: number) => void;
  canjearPuntos: (puntos: number) => boolean;
  setScheduleMode: (mode: 'ahora' | 'programar') => void;
  setScheduleDate: (date: string | null) => void;
  setScheduleTime: (time: string | null) => void;
}

let _eventCounter = 100;
let _orderCounter = 2860;

export const useStore = create<AppState>((set, get) => ({
  /* Data */
  orders: MANAGUA_ORDERS,
  motos: MOCK_MOTOS,
  riders: MOCK_RIDERS,
  alerts: MOCK_ALERTS,
  zones: MOCK_ZONES,
  maintenanceRules: MOCK_MAINTENANCE_RULES,
  companyData: COMPANY_DATA,
  users: MOCK_USERS,
  dailyRevenue: DAILY_REVENUE,
  monthlyRevenue: MONTHLY_REVENUE,
  zoneOrders: ZONE_ORDERS,
  riderPerformance: RIDER_PERFORMANCE,
  orderStatusDistribution: ORDER_STATUS_DISTRIBUTION,

  /* New Data */
  incidents: MOCK_INCIDENTS,
  clients: MOCK_CLIENTS,
  activityEvents: MOCK_ACTIVITY_EVENTS,
  paymentConciliations: MOCK_PAYMENT_CONCILIATIONS,
  zonePolygons: MOCK_ZONE_POLYGONS,

  /* Marketing Data */
  campanas: MOCK_CAMPANAS,
  codigos: MOCK_CODIGOS,
  banners: MOCK_BANNERS,
  feedItems: MOCK_FEED_ITEMS,
  marketingKPI: MOCK_MARKETING_KPI,

  /* Communications Data */
  conversaciones: MOCK_CONVERSACIONES,
  plantillas: MOCK_PLANTILLAS,
  notificacionesAuto: MOCK_NOTIFICACIONES_AUTO,

  /* Config Data */
  horarios: MOCK_HORARIOS,
  feriados: MOCK_FERIADOS,
  integraciones: MOCK_INTEGRACIONES,

  /* SuperAdmin Data */
  auditLog: MOCK_AUDIT_LOG,
  featureFlags: MOCK_FEATURE_FLAGS,

  /* Client Data */
  clientNotificaciones: MOCK_CLIENT_NOTIFICACIONES,
  direccionesGuardadas: MOCK_DIRECCIONES_GUARDADAS,
  direccionesSugerencias: MOCK_DIRECCIONES_SUGERENCIAS,
  clientActiveModule: 'inicio' as ClientModuleKey,
  clientModuleFade: false,
  solicitudEnvio: {
    origen: '', origenLat: 0, origenLng: 0,
    destino: '', destinoLat: 0, destinoLng: 0,
    descripcion: '', tamano: 'pequeno', fragil: false,
    instrucciones: '', metodoPago: 'efectivo',
    terminosAceptados: false,
  },
  envioConfirmado: false,
  envioConfirmadoId: '',
  clientSearchQuery: '',
  clientEnvioTab: 'activos' as const,
  clientEnvioFilter: 'todos',
  clientNotifOpen: false,

  /* V2 Client Data */
  trackingOrderId: null,
  trackingSteps: [...TRACKING_STEPS_TEMPLATE],
  trackingETA: 12,
  chatConversations: MOCK_CHAT_CONVERSATIONS,
  chatOpen: false,
  chatOrderId: null,
  calificaciones: MOCK_CALIFICACIONES,
  ratingModalOpen: false,
  ratingOrderId: null,
  fidelizacion: MOCK_FIDELIZACION,
  referidos: MOCK_REFERIDOS,
  scheduleMode: 'ahora' as const,
  scheduleDate: null,
  scheduleTime: null,

  /* UI State */
  activeModule: 'overview',
  moduleFade: false,

  /* Pedidos */
  filterStatus: 'todos',
  searchQuery: '',
  currentPage: 1,
  dateFilter: 'hoy',

  /* Modals */
  createOrderOpen: false,
  detailOrder: null,
  reassignOrder: null,
  addMotoOpen: false,
  editMoto: null,
  addRiderOpen: false,
  editRider: null,
  riderDetail: null,

  /* Flota */
  flotaFilter: 'all',
  expandedMoto: null,

  /* Toasts */
  toasts: [],

  /* New UI State */
  commandPaletteOpen: false,
  notificationsOpen: false,
  simulationRunning: true,
  lastSimulationUpdate: Date.now(),

  /* Actions */
  setActiveModule: (mod) => {
    const current = get().activeModule;
    if (mod === current) return;
    set({ moduleFade: true });
    setTimeout(() => set({ activeModule: mod, moduleFade: false, currentPage: 1 }), 200);
  },

  setFilterStatus: (status) => set({ filterStatus: status, currentPage: 1 }),
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
  setCurrentPage: (p) => set({ currentPage: p }),
  setDateFilter: (f) => set({ dateFilter: f }),
  setCreateOrderOpen: (open) => set({ createOrderOpen: open }),
  setDetailOrder: (order) => set({ detailOrder: order }),
  setReassignOrder: (order) => set({ reassignOrder: order }),
  setAddMotoOpen: (open) => set({ addMotoOpen: open }),
  setEditMoto: (moto) => set({ editMoto: moto }),
  setAddRiderOpen: (open) => set({ addRiderOpen: open }),
  setEditRider: (rider) => set({ editRider: rider }),
  setRiderDetail: (rider) => set({ riderDetail: rider }),
  setFlotaFilter: (filter) => set({ flotaFilter: filter }),
  setExpandedMoto: (id) => set({ expandedMoto: id }),

  reassignRider: (orderId, riderName, riderInitials) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, repartidor: riderName, repartidorInitials: riderInitials } : o
      ),
    })),

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

  cancelOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, estado: 'incidencia' as OrderStatus } : o
      ),
    })),

  addMoto: (moto) => set((state) => ({ motos: [...state.motos, moto] })),

  updateMoto: (moto) =>
    set((state) => ({
      motos: state.motos.map((m) => (m.id === moto.id ? moto : m)),
    })),

  addRider: (rider) => set((state) => ({ riders: [...state.riders, rider] })),

  updateRider: (rider) =>
    set((state) => ({
      riders: state.riders.map((r) => (r.id === rider.id ? rider : r)),
    })),

  toggleRiderConnection: (riderId) =>
    set((state) => ({
      riders: state.riders.map((r) =>
        r.id === riderId
          ? { ...r, conectado: !r.conectado, status: !r.conectado ? 'available' as RiderStatus : 'offline' as RiderStatus }
          : r
      ),
    })),

  updateMotoPositions: () =>
    set((state) => ({
      motos: state.motos.map((m) => {
        if (m.status === 'in-service') {
          return {
            ...m,
            lat: m.lat + (Math.random() - 0.5) * 0.002,
            lng: m.lng + (Math.random() - 0.5) * 0.002,
          };
        }
        return m;
      }),
    })),

  /* New Actions */
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  addIncident: (incident) => set((state) => ({
    incidents: [incident, ...state.incidents],
  })),

  resolveIncident: (id, resolucion) => set((state) => ({
    incidents: state.incidents.map((inc) =>
      inc.id === id ? { ...inc, estado: 'resuelta' as const, resolucion, tiempoResolucion: '15min' } : inc
    ),
  })),

  addActivityEvent: (event) => {
    _eventCounter++;
    const newEvent: ActivityEvent = {
      ...event,
      id: `E-${_eventCounter}`,
    };
    set((state) => ({ activityEvents: [newEvent, ...state.activityEvents] }));
  },

  markEventsAsRead: () => set((state) => ({
    activityEvents: state.activityEvents.map((e) => ({ ...e, leido: true })),
  })),

  conciliatePayment: (id) => set((state) => ({
    paymentConciliations: state.paymentConciliations.map((p) =>
      p.id === id ? { ...p, estado: 'conciliado' as const } : p
    ),
  })),

  simulateNewOrder: () => {
    const state = get();
    _orderCounter++;
    const clients = state.clients;
    const client = clients[Math.floor(Math.random() * clients.length)];
    const zones = ['Centro', 'Villa Fontana', 'Los Robles', 'Bello Horizonte', 'Monseñor Lezcano', 'Reparto Schick'];
    const origins = ['Metrocentro', 'Galerías Santo Domingo', 'Mercado Oriental', 'Plaza Inter', 'Hospital Metropolitano'];
    const newOrder: Order = {
      id: `LF-${_orderCounter}`,
      cliente: client.nombre,
      clienteTelefono: client.telefono,
      origen: origins[Math.floor(Math.random() * origins.length)],
      destino: `${zones[Math.floor(Math.random() * zones.length)]}, Managua`,
      origenLat: 12.11 + (Math.random() - 0.5) * 0.04,
      origenLng: -86.24 + (Math.random() - 0.5) * 0.04,
      destinoLat: 12.11 + (Math.random() - 0.5) * 0.04,
      destinoLng: -86.24 + (Math.random() - 0.5) * 0.04,
      repartidor: null, repartidorInitials: '',
      descripcion: 'Envío simulado',
      monto: Math.floor(50 + Math.random() * 200),
      estado: 'pendiente',
      metodoPago: Math.random() > 0.5 ? 'efectivo' : 'transferencia',
      estadoPago: 'pendiente',
      fecha: '2026-06-10',
      hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      timeline: [
        { step: 'Orden creada', hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), completado: true },
        { step: 'En camino', hora: '—', completado: false },
        { step: 'Recogida', hora: '—', completado: false },
        { step: 'Entregada', hora: '—', completado: false },
      ],
    };
    set((state) => ({
      orders: [newOrder, ...state.orders],
      lastSimulationUpdate: Date.now(),
    }));
    get().addActivityEvent({
      tipo: 'orden',
      titulo: 'Nueva orden simulada',
      detalle: `${newOrder.id} - ${newOrder.cliente}`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
  },

  simulateDelivery: () => {
    const state = get();
    const activeOrders = state.orders.filter((o) => o.estado === 'encamino' || o.estado === 'recogido');
    if (activeOrders.length === 0) return;
    const order = activeOrders[Math.floor(Math.random() * activeOrders.length)];
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              estado: 'entregado' as OrderStatus,
              calificacion: Math.floor(3 + Math.random() * 3),
              timeline: o.timeline.map((t) => ({ ...t, completado: true, hora: t.hora === '—' ? new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : t.hora })),
            }
          : o
      ),
      lastSimulationUpdate: Date.now(),
    }));
    // Set rider back to available
    if (order.repartidor) {
      set((state) => ({
        riders: state.riders.map((r) =>
          r.nombre === order.repartidor ? { ...r, status: 'available' as RiderStatus, entregasHoy: r.entregasHoy + 1, entregasTotal: r.entregasTotal + 1 } : r
        ),
      }));
    }
    get().addActivityEvent({
      tipo: 'orden',
      titulo: 'Orden entregada',
      detalle: `${order.id} entregada`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
  },

  simulateStatusChange: () => {
    const state = get();
    const statusFlow: Record<string, OrderStatus> = {
      pendiente: 'encamino',
      encamino: 'recogido',
      recogido: 'entregado',
    };
    const changeable = state.orders.filter((o) => o.estado in statusFlow);
    if (changeable.length === 0) return;
    const order = changeable[Math.floor(Math.random() * changeable.length)];
    const newStatus = statusFlow[order.estado];
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === order.id
          ? {
              ...o,
              estado: newStatus,
              timeline: o.timeline.map((t, i) => {
                const stepMap = ['Orden creada', 'En camino', 'Recogida', 'Entregada'];
                if (stepMap[i] === 'En camino' && newStatus === 'encamino') return { ...t, completado: true, hora: now };
                if (stepMap[i] === 'Recogida' && newStatus === 'recogido') return { ...t, completado: true, hora: now };
                if (stepMap[i] === 'Entregada' && newStatus === 'entregado') return { ...t, completado: true, hora: now };
                return t;
              }),
            }
          : o
      ),
      lastSimulationUpdate: Date.now(),
    }));
    const statusLabels: Record<string, string> = { encamino: 'En camino', recogido: 'Recogido', entregado: 'Entregado' };
    get().addActivityEvent({
      tipo: 'orden',
      titulo: `Orden ${statusLabels[newStatus]}`,
      detalle: `${order.id} → ${statusLabels[newStatus]}`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
  },

  dispatchOrder: (orderId, riderId) => {
    const state = get();
    const rider = state.riders.find((r) => r.id === riderId);
    if (!rider) return;
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              estado: 'encamino' as OrderStatus,
              repartidor: rider.nombre,
              repartidorInitials: rider.initials,
              timeline: o.timeline.map((t) => {
                if (t.step === 'En camino') return { ...t, completado: true, hora: now };
                return t;
              }),
            }
          : o
      ),
      riders: state.riders.map((r) =>
        r.id === riderId ? { ...r, status: 'in-service' as RiderStatus } : r
      ),
    }));
    get().addActivityEvent({
      tipo: 'orden',
      titulo: 'Orden despachada',
      detalle: `${orderId} asignada a ${rider.nombre}`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
  },

  toggleSimulation: () => set((state) => ({ simulationRunning: !state.simulationRunning })),

  /* Toast Actions */
  addToast: (message, variant = 'info') => {
    const id = `T-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: ToastItem = { id, message, variant, timestamp: Date.now() };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  /* Marketing Actions */
  addCampana: (campana) => set((state) => ({ campanas: [campana, ...state.campanas] })),
  updateCampana: (id, updates) => set((state) => ({
    campanas: state.campanas.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  deleteCampana: (id) => set((state) => ({ campanas: state.campanas.filter((c) => c.id !== id) })),
  addCodigo: (codigo) => set((state) => ({ codigos: [codigo, ...state.codigos] })),
  updateCodigo: (id, updates) => set((state) => ({
    codigos: state.codigos.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  deleteCodigo: (id) => set((state) => ({ codigos: state.codigos.filter((c) => c.id !== id) })),
  addBanner: (banner) => set((state) => ({ banners: [...state.banners, banner] })),
  updateBanner: (id, updates) => set((state) => ({
    banners: state.banners.map((b) => b.id === id ? { ...b, ...updates } : b),
  })),
  deleteBanner: (id) => set((state) => ({ banners: state.banners.filter((b) => b.id !== id) })),
  addFeedItem: (item) => set((state) => ({ feedItems: [item, ...state.feedItems] })),
  updateFeedItem: (id, updates) => set((state) => ({
    feedItems: state.feedItems.map((f) => f.id === id ? { ...f, ...updates } : f),
  })),
  deleteFeedItem: (id) => set((state) => ({ feedItems: state.feedItems.filter((f) => f.id !== id) })),

  /* Communications Actions */
  addMensaje: (convId, mensaje) => set((state) => ({
    conversaciones: state.conversaciones.map((c) =>
      c.id === convId
        ? { ...c, mensajes: [...c.mensajes, mensaje], ultimoMensaje: mensaje.contenido, ultimoTimestamp: mensaje.enviadoEn, noLeidos: mensaje.emisorId !== 'admin' ? c.noLeidos + 1 : 0 }
        : c
    ),
  })),
  markConversacionLeida: (convId) => set((state) => ({
    conversaciones: state.conversaciones.map((c) =>
      c.id === convId ? { ...c, noLeidos: 0, mensajes: c.mensajes.map((m) => ({ ...m, leido: true })) } : c
    ),
  })),
  addPlantilla: (plantilla) => set((state) => ({ plantillas: [plantilla, ...state.plantillas] })),
  updatePlantilla: (id, updates) => set((state) => ({
    plantillas: state.plantillas.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
  deletePlantilla: (id) => set((state) => ({ plantillas: state.plantillas.filter((p) => p.id !== id) })),
  toggleNotificacionAuto: (id) => set((state) => ({
    notificacionesAuto: state.notificacionesAuto.map((n) =>
      n.id === id ? { ...n, activa: !n.activa } : n
    ),
  })),

  /* Config Actions */
  updateHorario: (id, updates) => set((state) => ({
    horarios: state.horarios.map((h) => h.id === id ? { ...h, ...updates } : h),
  })),
  addFeriado: (feriado) => set((state) => ({ feriados: [...state.feriados, feriado] })),
  deleteFeriado: (id) => set((state) => ({ feriados: state.feriados.filter((f) => f.id !== id) })),

  /* SuperAdmin Actions */
  toggleFeatureFlag: (id) => set((state) => ({
    featureFlags: state.featureFlags.map((f) =>
      f.id === id ? { ...f, habilitado: !f.habilitado } : f
    ),
  })),
  addAuditEntry: (entry) => {
    const id = `AL-${Date.now()}`;
    set((state) => ({ auditLog: [{ ...entry, id }, ...state.auditLog] }));
  },

  /* Client Actions */
  setClientActiveModule: (mod) => {
    const current = get().clientActiveModule;
    if (mod === current) return;
    set({ clientModuleFade: true });
    setTimeout(() => set({ clientActiveModule: mod, clientModuleFade: false }), 200);
  },
  setSolicitudEnvio: (data) => set((state) => ({
    solicitudEnvio: { ...state.solicitudEnvio, ...data },
  })),
  resetSolicitudEnvio: () => set({
    solicitudEnvio: {
      origen: '', origenLat: 0, origenLng: 0,
      destino: '', destinoLat: 0, destinoLng: 0,
      descripcion: '', tamano: 'pequeno', fragil: false,
      instrucciones: '', metodoPago: 'efectivo',
      terminosAceptados: false,
    },
    envioConfirmado: false,
    envioConfirmadoId: '',
  }),
  confirmarEnvio: (orderId) => set({ envioConfirmado: true, envioConfirmadoId: orderId }),
  setClientSearchQuery: (q) => set({ clientSearchQuery: q }),
  setClientEnvioTab: (tab) => set({ clientEnvioTab: tab }),
  setClientEnvioFilter: (filter) => set({ clientEnvioFilter: filter }),
  setClientNotifOpen: (open) => set({ clientNotifOpen: open }),
  markClientNotifRead: (id) => set((state) => ({
    clientNotificaciones: state.clientNotificaciones.map((n) =>
      n.id === id ? { ...n, leida: true } : n
    ),
  })),
  markAllClientNotifRead: () => set((state) => ({
    clientNotificaciones: state.clientNotificaciones.map((n) => ({ ...n, leida: true })),
  })),
  addDireccionGuardada: (dir) => set((state) => ({
    direccionesGuardadas: [...state.direccionesGuardadas, dir],
  })),
  removeDireccionGuardada: (id) => set((state) => ({
    direccionesGuardadas: state.direccionesGuardadas.filter((d) => d.id !== id),
  })),
  validateCodigoPromo: (codigo) => {
    const found = get().codigos.find((c) => c.codigo.toUpperCase() === codigo.toUpperCase() && c.estado === 'activo');
    if (!found) return { valid: false, descuento: 0, tipo: '' };
    const descuento = found.tipoDescuento === 'porcentaje' ? found.valor : found.valor;
    return { valid: true, descuento, tipo: found.tipoDescuento };
  },

  /* V2 Client Actions */
  setTrackingOrder: (orderId) => {
    if (!orderId) {
      set({ trackingOrderId: null, trackingSteps: [...TRACKING_STEPS_TEMPLATE], trackingETA: 12 });
      return;
    }
    const order = get().orders.find((o) => o.id === orderId);
    if (!order) return;
    // Build tracking steps based on order status
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const steps = TRACKING_STEPS_TEMPLATE.map((s, i) => ({ ...s }));
    // Determine which steps are completed based on order estado
    const statusIndex: Record<string, number> = {
      pendiente: 0, encamino: 3, recogido: 5, entregado: 7, incidencia: 3, programada: 0,
    };
    const completedUpTo = statusIndex[order.estado] ?? 0;
    for (let i = 0; i < steps.length; i++) {
      if (i < completedUpTo) {
        steps[i].status = 'completed';
        steps[i].timestamp = fmt(new Date(now.getTime() - (completedUpTo - i) * 180000));
      } else if (i === completedUpTo) {
        steps[i].status = 'current';
        steps[i].timestamp = fmt(now);
      } else {
        steps[i].status = 'pending';
      }
    }
    // For programada, show first step completed
    if (order.estado === 'programada') {
      steps[0].status = 'completed';
      steps[0].timestamp = order.hora;
    }
    // For entregado, mark all completed
    if (order.estado === 'entregado') {
      steps.forEach((s, i) => { s.status = 'completed'; s.timestamp = fmt(new Date(now.getTime() - (7 - i) * 180000)); });
    }
    const eta = order.estado === 'entregado' ? 0 : order.estado === 'programada' ? -1 : Math.max(3, Math.floor(12 - completedUpTo * 1.5));
    set({ trackingOrderId: orderId, trackingSteps: steps, trackingETA: eta });
  },

  advanceTrackingStep: () => {
    const steps = [...get().trackingSteps];
    const now = new Date();
    const fmt = () => now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const currentIdx = steps.findIndex((s) => s.status === 'current');
    if (currentIdx >= 0) {
      steps[currentIdx] = { ...steps[currentIdx], status: 'completed', timestamp: fmt() };
      if (currentIdx + 1 < steps.length) {
        steps[currentIdx + 1] = { ...steps[currentIdx + 1], status: 'current', timestamp: fmt() };
      }
    } else {
      const pendingIdx = steps.findIndex((s) => s.status === 'pending');
      if (pendingIdx >= 0) {
        steps[pendingIdx] = { ...steps[pendingIdx], status: 'current', timestamp: fmt() };
      }
    }
    set((state) => ({ trackingSteps: steps, trackingETA: Math.max(0, state.trackingETA - 2) }));
  },

  updateTrackingETA: () => set((state) => ({
    trackingETA: Math.max(0, state.trackingETA - 1),
  })),

  setChatOpen: (open) => set({ chatOpen: open }),
  setChatOrderId: (orderId) => set({ chatOrderId: orderId }),

  sendChatMessage: (orderId, content, senderType) => {
    const id = `msg-${Date.now()}`;
    const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const senderName = senderType === 'cliente' ? 'María' : senderType === 'sistema' ? 'Sistema' : 'Repartidor';
    const msg: ChatMessage = { id, senderId: senderType === 'cliente' ? 'cliente' : 'r1', senderName, senderType, content, timestamp: now, read: senderType !== 'cliente' };
    set((state) => ({
      chatConversations: state.chatConversations.map((c) =>
        c.orderId === orderId ? { ...c, messages: [...c.messages, msg] } : c
      ),
    }));
  },

  addSystemChatMessage: (orderId, content) => {
    get().sendChatMessage(orderId, content, 'sistema');
  },

  setRatingModalOpen: (open) => set({ ratingModalOpen: open }),
  setRatingOrderId: (orderId) => set({ ratingOrderId: orderId }),

  submitCalificacion: (cal) => {
    const id = `cal-${Date.now()}`;
    set((state) => ({
      calificaciones: [{ ...cal, id }, ...state.calificaciones],
      ratingModalOpen: false,
      ratingOrderId: null,
    }));
  },

  addFidelizacionPuntos: (accion, puntos) => set((state) => {
    const newPuntos = state.fidelizacion.puntos + puntos;
    let nivel: NivelFidelizacion = 'bronce';
    if (newPuntos >= 600) nivel = 'platino';
    else if (newPuntos >= 300) nivel = 'oro';
    else if (newPuntos >= 100) nivel = 'plata';
    const entry: PuntosHistorial = { id: `fh-${Date.now()}`, fecha: new Date().toISOString().split('T')[0], accion, puntos };
    return {
      fidelizacion: { ...state.fidelizacion, puntos: newPuntos, nivel, historial: [entry, ...state.fidelizacion.historial] },
    };
  }),

  canjearPuntos: (puntos) => {
    const state = get();
    if (state.fidelizacion.puntos < puntos) return false;
    const entry: PuntosHistorial = { id: `fh-${Date.now()}`, fecha: new Date().toISOString().split('T')[0], accion: `Canje: ${puntos} puntos`, puntos: -puntos };
    let nivel: NivelFidelizacion = 'bronce';
    const newPuntos = state.fidelizacion.puntos - puntos;
    if (newPuntos >= 600) nivel = 'platino';
    else if (newPuntos >= 300) nivel = 'oro';
    else if (newPuntos >= 100) nivel = 'plata';
    set({ fidelizacion: { ...state.fidelizacion, puntos: newPuntos, nivel, historial: [entry, ...state.fidelizacion.historial] } });
    return true;
  },

  setScheduleMode: (mode) => set({ scheduleMode: mode }),
  setScheduleDate: (date) => set({ scheduleDate: date }),
  setScheduleTime: (time) => set({ scheduleTime: time }),
}));
