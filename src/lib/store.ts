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

/* ═══════════════════════════════════════════════
   ZUSTAND STORE
   ═══════════════════════════════════════════════ */

export type ModuleKey = 'overview' | 'pedidos' | 'flota' | 'repartidores' | 'reportes' | 'config';

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
}

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
          ? { ...r, conectado: !r.conectado, status: !r.conectado ? 'available' : 'offline' }
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
}));
