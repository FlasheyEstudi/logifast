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
  tipo?: 'envio' | 'compra';
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
  codigoPin?: string;
  paqueteFotoUrl?: string;
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
  lat?: number;
  lng?: number;
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

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

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
  paqueteFotoUrl?: string;
  metodoPago: 'efectivo' | 'transferencia';
  montoPago?: number;
  codigoPromo?: string;
  descuento?: number;
  terminosAceptados: boolean;
}

export type ClientModuleKey = 'inicio' | 'solicitar' | 'envios' | 'explorar' | 'pedidos' | 'perfil' | 'ayuda' | 'puntos' | 'tienda';

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
   INITIAL DATA CONSTANTS (CLEAN / PRODUCTION-READY)
   ═══════════════════════════════════════════════ */

const MANAGUA_ORDERS: Order[] = [];
const MOCK_MOTOS: Moto[] = [];
const MOCK_RIDERS: Rider[] = [];
const MOCK_ALERTS: Alert[] = [];
const DAILY_REVENUE: DailyRevenue[] = [];
const MONTHLY_REVENUE: MonthlyRevenue[] = [];
const ZONE_ORDERS: ZoneOrder[] = [];
const RIDER_PERFORMANCE: RiderPerformance[] = [];
const ORDER_STATUS_DISTRIBUTION: { name: string; value: number; color: string }[] = [];
const MOCK_ZONES: Zone[] = [];
const MOCK_MAINTENANCE_RULES: MaintenanceRule[] = [];
const COMPANY_DATA: CompanyData = {
  nombre: 'LOGIFAST S.A.',
  direccion: '',
  telefono: '',
  email: '',
};
const MOCK_USERS: SystemUser[] = [];
const MOCK_INCIDENTS: Incident[] = [];
const MOCK_CLIENTS: Client[] = [];
const MOCK_ACTIVITY_EVENTS: ActivityEvent[] = [];
const MOCK_PAYMENT_CONCILIATIONS: PaymentConciliation[] = [];
const MOCK_ZONE_POLYGONS: ZonePolygon[] = [];
const MOCK_CAMPANAS: Campana[] = [];
const MOCK_CODIGOS: CodigoPromocional[] = [];
const MOCK_BANNERS: Banner[] = [];
const MOCK_FEED_ITEMS: FeedItem[] = [];
const MOCK_PLANTILLAS: PlantillaMensaje[] = [];
const MOCK_CONVERSACIONES: Conversacion[] = [];
const MOCK_NOTIFICACIONES_AUTO: NotificacionAutomatica[] = [];
const MOCK_HORARIOS: ConfiguracionHorario[] = [];
const MOCK_FERIADOS: Feriado[] = [];
const MOCK_INTEGRACIONES: Integracion[] = [];
const MOCK_AUDIT_LOG: AuditLogEntry[] = [];
const MOCK_FEATURE_FLAGS: FeatureFlag[] = [];
const MOCK_MARKETING_KPI: MarketingKPI = {
  clientesActivosMes: 0,
  tendenciaActivos: 0,
  tasaRetencion: 0,
  frecuenciaPromedio: 0,
  valorPromedioEnvio: 0,
  costoAdquisicion: 0,
};
const MOCK_CLIENT_NOTIFICACIONES: ClientNotificacion[] = [];
const MOCK_DIRECCIONES_GUARDADAS: DireccionGuardada[] = [];
const MOCK_DIRECCIONES_SUGERENCIAS: DireccionSugerencia[] = [];
const MOCK_REPARTIDORES_INFO: Record<string, RepartidorInfo> = {};
const MOCK_CHAT_CONVERSATIONS: ChatConversation[] = [];
const MOCK_CALIFICACIONES: Calificacion[] = [];
const MOCK_FIDELIZACION: DatosFidelizacion = {
  puntos: 0,
  nivel: 'bronce',
  historial: [],
};
const MOCK_REFERIDOS: DatosReferidos = {
  codigo: '',
  link: '',
  referidos: [],
  puntosGanados: 0,
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
  // P0: simulationRunning y lastSimulationUpdate eliminados — no hay simulación.

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
  fetchOrders: () => Promise<void>;
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
  // P0: simulateNewOrder, simulateDelivery, simulateStatusChange, toggleSimulation eliminados.
  dispatchOrder: (orderId: string, riderId: string) => void;

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
  fetchBanners: () => Promise<void>;
  addFeedItem: (item: FeedItem) => void;
  updateFeedItem: (id: string, updates: Partial<FeedItem>) => void;
  deleteFeedItem: (id: string) => void;
  fetchFeed: () => Promise<void>;
  fetchCodigos: () => Promise<void>;

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
let _orderCounter = 0; // P0: ya no se usa para simulación, se mantiene por compatibilidad.

export const useStore = create<AppState>((set, get) => ({
  /* Data */
  orders: [],
  motos: [],
  riders: [],
  alerts: [],
  zones: MOCK_ZONES,
  maintenanceRules: MOCK_MAINTENANCE_RULES,
  companyData: COMPANY_DATA,
  users: [],
  dailyRevenue: [],
  monthlyRevenue: [],
  zoneOrders: [],
  riderPerformance: [],
  orderStatusDistribution: [],

  /* New Data */
  incidents: [],
  clients: [],
  activityEvents: [],
  paymentConciliations: [],
  zonePolygons: MOCK_ZONE_POLYGONS,

  /* Marketing Data */
  campanas: [],
  codigos: [],
  banners: [],
  feedItems: [],
  marketingKPI: MOCK_MARKETING_KPI,

  /* Communications Data */
  conversaciones: [],
  plantillas: [],
  notificacionesAuto: [],

  /* Config Data */
  horarios: [],
  feriados: [],
  integraciones: MOCK_INTEGRACIONES,

  /* SuperAdmin Data */
  auditLog: [],
  featureFlags: [],

  /* Client Data */
  clientNotificaciones: [],
  direccionesGuardadas: [],
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
  // P0: simulationRunning eliminado — no hay simulación.

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

  reassignRider: (orderId, riderName, riderInitials) => {
    // 1. Actualizar estado en memoria
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, repartidor: riderName, repartidorInitials: riderInitials, estado: 'encamino' as OrderStatus } : o
      ),
    }));

    // 2. Persistir en la base de datos vía API
    fetch(`/api/ordenes/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repartidorId: riderName, estado: 'asignado' }),
    }).catch((err) => console.error('[reassignRider API error]', err));
  },

  addOrder: (order) => set((state) => {
    const pin = order.codigoPin || String(Math.floor(1000 + Math.random() * 9000));
    return { orders: [{ ...order, codigoPin: pin }, ...state.orders] };
  }),

  // P1: fetchOrders carga las órdenes reales del cliente desde la BD.
  // Se llama al montar ClientShell para que sobrevivan F5.
  fetchOrders: async () => {
    try {
      const res = await fetch('/api/ordenes');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ordenes && Array.isArray(data.ordenes)) {
        const mapped = data.ordenes.map((o: any) => ({
          id: o.id,
          tipo: o.tipo || 'envio',
          cliente: o.clienteNombre || o.cliente?.name || 'Cliente',
          clienteTelefono: o.clienteTelefono || o.cliente?.telefono || '',
          origen: o.origen || '',
          destino: o.destino || '',
          origenLat: o.origenLat || 0,
          origenLng: o.origenLng || 0,
          destinoLat: o.destinoLat || 0,
          destinoLng: o.destinoLng || 0,
          repartidor: o.repartidor?.user?.name || o.repartidorNombre || (o.repartidorId ? 'Repartidor LogiFast' : null),
          repartidorInitials: o.repartidor?.user?.name ? o.repartidor.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'RP',
          descripcion: o.paquete || 'Envío',
          monto: o.monto || 0,
          estado: o.estado || 'pendiente',
          metodoPago: o.metodoPago || 'efectivo',
          estadoPago: 'pendiente',
          codigoPin: o.codigoPin || String(Math.floor(1000 + Math.random() * 9000)),
          fecha: new Date(o.createdAt || Date.now()).toISOString().split('T')[0],
          hora: new Date(o.createdAt || Date.now()).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
          timeline: [
            { step: 'Orden creada', hora: new Date(o.createdAt || Date.now()).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), completado: true },
          ],
        }));
        set({ orders: mapped });
      }
    } catch (err) {
      console.error('[fetchOrders error]', err);
    }
  },

  cancelOrder: (orderId) => {
    // 1. Actualizar estado en memoria
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, estado: 'incidencia' as OrderStatus } : o
      ),
    }));

    // 2. Persistir en la base de datos vía API
    fetch(`/api/ordenes/${orderId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('[cancelOrder API error]', err));
  },

  addMoto: (moto) => {
    set((state) => ({ motos: [...state.motos, moto] }));
    fetch('/api/ingeniero/motos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moto),
    }).catch((err) => console.error('[addMoto API error]', err));
  },

  updateMoto: (moto) => {
    set((state) => ({
      motos: state.motos.map((m) => (m.id === moto.id ? moto : m)),
    }));
    fetch('/api/ingeniero/motos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moto),
    }).catch((err) => console.error('[updateMoto API error]', err));
  },

  addRider: (rider) => {
    set((state) => ({ riders: [...state.riders, rider] }));
    fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: rider.nombre,
        email: rider.email,
        telefono: rider.telefono,
        role: 'repartidor',
      }),
    }).catch((err) => console.error('[addRider API error]', err));
  },

  updateRider: (rider) => {
    set((state) => ({
      riders: state.riders.map((r) => (r.id === rider.id ? rider : r)),
    }));
    fetch('/api/repartidor/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: rider.id,
        nombre: rider.nombre,
        telefono: rider.telefono,
        motoId: rider.motoId,
      }),
    }).catch((err) => console.error('[updateRider API error]', err));
  },

  toggleRiderConnection: (riderId) => {
    let newConectado = false;
    set((state) => ({
      riders: state.riders.map((r) => {
        if (r.id === riderId) {
          newConectado = !r.conectado;
          return { ...r, conectado: newConectado, status: newConectado ? ('available' as RiderStatus) : ('offline' as RiderStatus) };
        }
        return r;
      }),
    }));
    fetch('/api/repartidor/conexion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conectado: newConectado }),
    }).catch((err) => console.error('[toggleRiderConnection API error]', err));
  },

  updateMotoPositions: async () => {
    try {
      const res = await fetch('/api/admin/repartidores');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.profiles || !Array.isArray(data.profiles)) return;

      set((state) => {
        const updatedMotos = [...state.motos];
        const updatedRiders = [...state.riders];

        for (const p of data.profiles) {
          const pLat = Number(p.user?.lat ?? p.lat);
          const pLng = Number(p.user?.lng ?? p.lng);
          if (!Number.isFinite(pLat) || !Number.isFinite(pLng) || (pLat === 0 && pLng === 0)) continue;

          // Actualizar posición GPS en motos
          const motoIdx = updatedMotos.findIndex((m) => m.repartidorAsignado === (p.user?.name || p.nombre) || m.id === p.id || m.id === p.motoId);
          if (motoIdx >= 0) {
            updatedMotos[motoIdx] = {
              ...updatedMotos[motoIdx],
              lat: pLat,
              lng: pLng,
              status: p.enServicio ? 'in-service' : p.conectado ? 'available' : 'maintenance',
            };
          } else {
            updatedMotos.push({
              id: p.id,
              nombre: `Moto - ${p.user?.name || p.nombre}`,
              modelo: p.vehiculoModelo || 'Honda Wave 110',
              anio: p.vehiculoAnio || 2024,
              placa: p.vehiculoPlaca || 'M-123456',
              status: p.enServicio ? 'in-service' : p.conectado ? 'available' : 'maintenance',
              lat: pLat,
              lng: pLng,
              km: p.totalKm || 120,
              repartidorAsignado: p.user?.name || p.nombre,
              ultimoMantenimiento: '2026-08-01',
              proximoMantenimiento: '2026-09-01',
              costoTotalMantenimiento: 0,
            });
          }

          // Actualizar posición GPS en riders
          const riderIdx = updatedRiders.findIndex((r) => r.id === p.id || r.nombre === (p.user?.name || p.nombre));
          if (riderIdx >= 0) {
            updatedRiders[riderIdx] = {
              ...updatedRiders[riderIdx],
              lat: pLat,
              lng: pLng,
              conectado: p.conectado,
              status: p.enServicio ? 'in-service' : p.conectado ? 'available' : 'offline',
            };
          } else {
            updatedRiders.push({
              id: p.id,
              nombre: p.user?.name || p.nombre,
              email: p.user?.email || p.email || '',
              telefono: p.user?.telefono || p.telefono || '',
              initials: p.user?.initials || (p.nombre || 'RP').slice(0, 2).toUpperCase(),
              color: p.user?.color || '#0066FF',
              status: p.enServicio ? 'in-service' : p.conectado ? 'available' : 'offline',
              motoId: p.motoId || null,
              entregasHoy: p.entregasHoy || 0,
              kmHoy: p.kmHoy || 0,
              entregasTotal: p.totalEntregas || 0,
              kmTotal: p.totalKm || 0,
              calificacion: p.calificacion || 5.0,
              conectado: p.conectado,
              lat: pLat,
              lng: pLng,
            });
          }
        }

        return { motos: updatedMotos, riders: updatedRiders };
      });
    } catch {
      // Ignorar errores de red temporales durante polling
    }
  },

  /* New Actions */
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  addIncident: (incident) => set((state) => ({
    incidents: [incident, ...state.incidents],
  })),

  resolveIncident: (id, resolucion) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, estado: 'resuelta' as const, resolucion, tiempoResolucion: '15min' } : inc
      ),
    }));
    fetch(`/api/ordenes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'encamino', incidenciaDesc: resolucion }),
    }).catch((err) => console.error('[resolveIncident API error]', err));
  },

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

  // P0: simulateNewOrder, simulateDelivery, simulateStatusChange ELIMINADAS.
  // El sistema ahora funciona 100% con datos reales. Las órdenes solo se crean
  // cuando un cliente real pulsa "Confirmar envío" en ClientSolicitar/ClientCarrito.

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
    fetch(`/api/ordenes/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repartidorId: rider.id, estado: 'asignado' }),
    }).catch((err) => console.error('[dispatchOrder API error]', err));
  },

  // P0: toggleSimulation eliminado — no hay simulación.

  /* Toast Actions — delega a sileo (notify) */
  addToast: (message, variant = 'info') => {
    // Import dinámico para no romper SSR
    if (typeof window !== 'undefined') {
      import('@/lib/notify').then(({ notify }) => {
        if (variant === 'success') notify.success(message);
        else if (variant === 'error') notify.error(message);
        else if (variant === 'warning') notify.warning(message);
        else notify.info(message);
      }).catch(() => null);
    }
    // Mantener en estado para compatibilidad (no se renderiza, solo para no romper código que lo lee)
    const id = `T-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toast: ToastItem = { id, message, variant, timestamp: Date.now() };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 100);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  /* Marketing Actions */
  addCampana: (campana) => {
    set((state) => ({ campanas: [campana, ...state.campanas] }));
    fetch('/api/campanas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: campana.titulo,
        tipo: campana.tipo,
        segmento: campana.segmento,
        contenido: JSON.stringify(campana.contenido),
        estado: campana.estado,
        creadoPor: 'admin',
      }),
    }).catch((err) => console.error('[addCampana API error]', err));
  },
  updateCampana: (id, updates) => set((state) => ({
    campanas: state.campanas.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  deleteCampana: (id) => set((state) => ({ campanas: state.campanas.filter((c) => c.id !== id) })),

  addCodigo: (codigo) => {
    set((state) => ({ codigos: [codigo, ...state.codigos] }));
    fetch('/api/codigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: codigo.codigo,
        tipoDescuento: codigo.tipoDescuento,
        valor: codigo.valor,
        aplicableA: codigo.aplicableA,
        montoMinimo: codigo.montoMinimo,
        maxUsos: codigo.maxUsos,
        segmento: codigo.segmento,
        vigenciaInicio: codigo.vigenciaInicio || new Date().toISOString(),
        vigenciaFin: codigo.vigenciaFin || new Date(Date.now() + 30 * 86400000).toISOString(),
        estado: codigo.estado,
        creadoPor: 'admin',
      }),
    }).catch((err) => console.error('[addCodigo API error]', err));
  },
  updateCodigo: (id, updates) => set((state) => ({
    codigos: state.codigos.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  deleteCodigo: (id) => set((state) => ({ codigos: state.codigos.filter((c) => c.id !== id) })),

  addBanner: (banner) => {
    set((state) => ({ banners: [...state.banners, banner] }));
    fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: banner.titulo,
        subtitulo: banner.subtitulo,
        tipo: banner.tipo,
        colorFondo: banner.colorFondo,
        gradiente: typeof banner.gradiente === 'object' ? JSON.stringify(banner.gradiente) : banner.gradiente,
        colorTexto: banner.colorTexto,
        imagenUrl: banner.imagenUrl,
        botonTexto: banner.botonTexto,
        botonAccion: banner.botonAccion,
        botonLink: banner.botonLink,
        icono: banner.icono,
        segmento: banner.segmento,
        mostrarEn: banner.mostrarEn,
        posicion: banner.posicion,
        estado: banner.estado,
        creadoPor: 'admin',
      }),
    }).catch((err) => console.error('[addBanner API error]', err));
  },
  updateBanner: (id, updates) => set((state) => ({
    banners: state.banners.map((b) => b.id === id ? { ...b, ...updates } : b),
  })),
  deleteBanner: (id) => set((state) => ({ banners: state.banners.filter((b) => b.id !== id) })),
  fetchBanners: async () => {
    try {
      const res = await fetch('/api/banners?estado=activo');
      if (!res.ok) return;
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        set({ banners: json.data });
      }
    } catch (err) {
      console.error('[fetchBanners error]', err);
    }
  },
  addFeedItem: (item) => set((state) => ({ feedItems: [item, ...state.feedItems] })),
  updateFeedItem: (id, updates) => set((state) => ({
    feedItems: state.feedItems.map((f) => f.id === id ? { ...f, ...updates } : f),
  })),
  deleteFeedItem: (id) => set((state) => ({ feedItems: state.feedItems.filter((f) => f.id !== id) })),
  fetchFeed: async () => {
    try {
      const res = await fetch('/api/feed?estado=activo');
      if (!res.ok) return;
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        set({ feedItems: json.data });
      }
    } catch (err) {
      console.error('[fetchFeed error]', err);
    }
  },
  fetchCodigos: async () => {
    try {
      const res = await fetch('/api/codigos');
      if (!res.ok) return;
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        set({ codigos: json.data });
      }
    } catch (err) {
      console.error('[fetchCodigos error]', err);
    }
  },

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
