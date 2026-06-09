import { create } from 'zustand';

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

export type OrderStatus = 'pendiente' | 'encamino' | 'recogido' | 'entregado' | 'incidencia';
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

/* ═══════════════════════════════════════════════
   ZUSTAND STORE
   ═══════════════════════════════════════════════ */

export type ModuleKey = 'overview' | 'pedidos' | 'flota' | 'repartidores' | 'reportes' | 'config' | 'despacho' | 'finanzas' | 'clientes' | 'incidencias';

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
}));
