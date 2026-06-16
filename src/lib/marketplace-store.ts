import { create } from 'zustand';

/* ═══════════════════════════════════════════════
   MARKETPLACE TYPES
   ═══════════════════════════════════════════════ */

export type TiendaCategoria = 'comida' | 'tienda' | 'farmacia' | 'regalos' | 'supermercado' | 'tecnologia' | 'deportes';

export interface Tienda {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: TiendaCategoria;
  logoColor: string;
  logoIniciales: string;
  portadaColor: string;
  direccion: string;
  lat: number;
  lng: number;
  telefono: string;
  email: string;
  calificacion: number;
  totalPedidos: number;
  tiempoEstimado: string;
  costoEnvio: number;
  pedidoMinimo: number;
  horario: Record<string, { abre: string; cierra: string }>;
  zonaCobertura: string[];
  verificado: boolean;
  popular: boolean;
  estado: 'activo' | 'inactivo' | 'cerrado';
  badges: string[]; // "Nuevo", "Popular", "Promo"
}

export interface Producto {
  id: string;
  tiendaId: string;
  categoriaNombre: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precioOriginal?: number;
  imagenColor: string;
  disponible: boolean;
  esNuevo: boolean;
  esPopular: boolean;
  stock: number | null;
}

export interface CartItem {
  id: string;
  productoId: string;
  tiendaId: string;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  imagenColor: string;
  notas: string;
}

export interface OrdenCompra {
  id: string;
  clienteId: string;
  tiendaId: string;
  tiendaNombre: string;
  tiendaLogo: string;
  tiendaColor: string;
  estado: 'recibido' | 'preparando' | 'listo' | 'en_camino' | 'entregado';
  direccionEntrega: string;
  metodoPago: 'efectivo' | 'transferencia';
  items: { nombreProducto: string; cantidad: number; precioUnitario: number }[];
  subtotal: number;
  costoEnvio: number;
  descuento: number;
  total: number;
  codigoUsado?: string;
  repartidorNombre: string;
  repartidorInitials: string;
  fecha: string;
  hora: string;
  calificacion?: number;
}

export interface FavoritoTienda {
  tiendaId: string;
}

export interface FavoritoProducto {
  productoId: string;
}

export interface ResenaTienda {
  id: string;
  tiendaId: string;
  clienteNombre: string;
  estrellas: number;
  comentario: string;
  fecha: string;
}

export interface CategoriaInfo {
  key: TiendaCategoria;
  icon: string;
  label: string;
}

/* ═══════════════════════════════════════════════
   CATEGORIES
   ═══════════════════════════════════════════════ */

export const CATEGORIAS: CategoriaInfo[] = [
  { key: 'comida', icon: 'utensils', label: 'Comida rápida' },
  { key: 'tienda', icon: 'store', label: 'Tiendas' },
  { key: 'farmacia', icon: 'pill', label: 'Farmacias' },
  { key: 'regalos', icon: 'gift', label: 'Regalos / Flores' },
  { key: 'supermercado', icon: 'shopping-cart', label: 'Supermercado' },
  { key: 'tecnologia', icon: 'smartphone', label: 'Tecnología' },
  { key: 'deportes', icon: 'dumbbell', label: 'Deportes' },
];

/* ═══════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════ */

export const MOCK_TIENDAS: Tienda[] = [
  {
    id: 't1', nombre: 'Pizza Express', descripcion: 'La mejor pizza de Managua, hecha al momento con ingredientes frescos', categoria: 'comida',
    logoColor: '#FF5722', logoIniciales: 'PE', portadaColor: '#BF360C',
    direccion: 'Centro Comercial Managua, Local 12', lat: 12.1150, lng: -86.2362,
    telefono: '+505 2222-1111', email: 'pedidos@pizzaexpress.com',
    calificacion: 4.7, totalPedidos: 287, tiempoEstimado: '20-30 min',
    costoEnvio: 20, pedidoMinimo: 80,
    horario: { lun: { abre: '10:00', cierra: '22:00' }, mar: { abre: '10:00', cierra: '22:00' }, mie: { abre: '10:00', cierra: '22:00' }, jue: { abre: '10:00', cierra: '22:00' }, vie: { abre: '10:00', cierra: '23:00' }, sab: { abre: '11:00', cierra: '23:00' }, dom: { abre: '12:00', cierra: '21:00' } },
    zonaCobertura: ['Centro', 'Villa Fontana', 'Los Robles', 'Altamira'],
    verificado: true, popular: true, estado: 'activo', badges: ['Popular'],
  },
  {
    id: 't2', nombre: 'Farmacia San Pablo', descripcion: 'Medicamentos y productos de salud a domicilio', categoria: 'farmacia',
    logoColor: '#4CAF50', logoIniciales: 'FS', portadaColor: '#1B5E20',
    direccion: 'Villa Fontana, Managua', lat: 12.0850, lng: -86.2070,
    telefono: '+505 2222-2222', email: 'ventas@farmaciasanpablo.com',
    calificacion: 4.8, totalPedidos: 156, tiempoEstimado: '15-25 min',
    costoEnvio: 15, pedidoMinimo: 30,
    horario: { lun: { abre: '07:00', cierra: '21:00' }, mar: { abre: '07:00', cierra: '21:00' }, mie: { abre: '07:00', cierra: '21:00' }, jue: { abre: '07:00', cierra: '21:00' }, vie: { abre: '07:00', cierra: '21:00' }, sab: { abre: '08:00', cierra: '20:00' }, dom: { abre: '08:00', cierra: '18:00' } },
    zonaCobertura: ['Villa Fontana', 'Los Robles', 'Centro', 'Bello Horizonte'],
    verificado: true, popular: false, estado: 'activo', badges: [],
  },
  {
    id: 't3', nombre: 'Mini Market Don Carlos', descripcion: 'Todo lo que necesitas, a la puerta de tu casa', categoria: 'tienda',
    logoColor: '#FF9800', logoIniciales: 'MD', portadaColor: '#E65100',
    direccion: 'Col. Los Robles, Managua', lat: 12.1245, lng: -86.2520,
    telefono: '+505 2222-3333', email: 'pedidos@minimarketdoncarlos.com',
    calificacion: 4.5, totalPedidos: 412, tiempoEstimado: '20-35 min',
    costoEnvio: 25, pedidoMinimo: 50,
    horario: { lun: { abre: '06:00', cierra: '21:00' }, mar: { abre: '06:00', cierra: '21:00' }, mie: { abre: '06:00', cierra: '21:00' }, jue: { abre: '06:00', cierra: '21:00' }, vie: { abre: '06:00', cierra: '22:00' }, sab: { abre: '06:00', cierra: '22:00' }, dom: { abre: '07:00', cierra: '20:00' } },
    zonaCobertura: ['Los Robles', 'Centro', 'Altamira', 'Schick'],
    verificado: false, popular: true, estado: 'activo', badges: ['Popular'],
  },
  {
    id: 't4', nombre: 'TechZone Managua', descripcion: 'Accesorios y gadgets de tecnología con entrega rápida', categoria: 'tecnologia',
    logoColor: '#2196F3', logoIniciales: 'TZ', portadaColor: '#0D47A1',
    direccion: 'Galerías Santo Domingo', lat: 12.0900, lng: -86.2180,
    telefono: '+505 2222-4444', email: 'info@techzone.com',
    calificacion: 4.6, totalPedidos: 89, tiempoEstimado: '30-45 min',
    costoEnvio: 30, pedidoMinimo: 200,
    horario: { lun: { abre: '09:00', cierra: '19:00' }, mar: { abre: '09:00', cierra: '19:00' }, mie: { abre: '09:00', cierra: '19:00' }, jue: { abre: '09:00', cierra: '19:00' }, vie: { abre: '09:00', cierra: '19:00' }, sab: { abre: '09:00', cierra: '17:00' }, dom: { abre: '', cierra: '' } },
    zonaCobertura: ['Centro', 'Santo Domingo', 'Villa Fontana'],
    verificado: true, popular: false, estado: 'activo', badges: ['Nuevo'],
  },
  {
    id: 't5', nombre: 'Floristería Rosas', descripcion: 'Arreglos florales y regalos para toda ocasión', categoria: 'regalos',
    logoColor: '#E91E63', logoIniciales: 'FR', portadaColor: '#880E4F',
    direccion: 'Bello Horizonte, Managua', lat: 12.1300, lng: -86.2800,
    telefono: '+505 2222-5555', email: 'pedidos@rosas.com',
    calificacion: 4.9, totalPedidos: 67, tiempoEstimado: '25-40 min',
    costoEnvio: 35, pedidoMinimo: 150,
    horario: { lun: { abre: '08:00', cierra: '18:00' }, mar: { abre: '08:00', cierra: '18:00' }, mie: { abre: '08:00', cierra: '18:00' }, jue: { abre: '08:00', cierra: '18:00' }, vie: { abre: '08:00', cierra: '20:00' }, sab: { abre: '08:00', cierra: '20:00' }, dom: { abre: '09:00', cierra: '14:00' } },
    zonaCobertura: ['Bello Horizonte', 'Centro', 'Los Robles'],
    verificado: true, popular: true, estado: 'activo', badges: ['Popular'],
  },
  {
    id: 't6', nombre: 'Super Abarrotes', descripcion: 'Tu supermercado a domicilio, precios justos siempre', categoria: 'supermercado',
    logoColor: '#9C27B0', logoIniciales: 'SA', portadaColor: '#4A148C',
    direccion: 'Monseñor Lezcano, Managua', lat: 12.0980, lng: -86.2310,
    telefono: '+505 2222-6666', email: 'ventas@superabarrotes.com',
    calificacion: 4.4, totalPedidos: 523, tiempoEstimado: '25-35 min',
    costoEnvio: 20, pedidoMinimo: 100,
    horario: { lun: { abre: '06:00', cierra: '21:00' }, mar: { abre: '06:00', cierra: '21:00' }, mie: { abre: '06:00', cierra: '21:00' }, jue: { abre: '06:00', cierra: '21:00' }, vie: { abre: '06:00', cierra: '22:00' }, sab: { abre: '06:00', cierra: '22:00' }, dom: { abre: '07:00', cierra: '20:00' } },
    zonaCobertura: ['Lezcano', 'Centro', 'Schick', 'Centroamérica'],
    verificado: false, popular: true, estado: 'activo', badges: ['Popular'],
  },
];

export const MOCK_PRODUCTOS: Producto[] = [
  // Pizza Express
  { id: 'p1', tiendaId: 't1', categoriaNombre: 'Pizzas', nombre: 'Pizza Margarita', descripcion: 'Salsa de tomate, mozzarella y albahaca fresca', precio: 180, imagenColor: '#FF8A65', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p2', tiendaId: 't1', categoriaNombre: 'Pizzas', nombre: 'Pizza Pepperoni', descripcion: 'Clásica pizza con pepperoni y queso derretido', precio: 220, imagenColor: '#EF5350', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p3', tiendaId: 't1', categoriaNombre: 'Pizzas', nombre: 'Pizza Hawaiana', descripcion: 'Jamón, piña y mozzarella', precio: 200, imagenColor: '#FFD54F', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p4', tiendaId: 't1', categoriaNombre: 'Complementos', nombre: 'Alitas BBQ (6 pzas)', descripcion: 'Alitas marinadas en salsa BBQ con dip ranch', precio: 150, imagenColor: '#8D6E63', disponible: true, esNuevo: true, esPopular: false, stock: null },
  { id: 'p5', tiendaId: 't1', categoriaNombre: 'Bebidas', nombre: 'Refresco 2L', descripcion: 'Coca-Cola, Pepsi o Sprite', precio: 45, imagenColor: '#424242', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p6', tiendaId: 't1', categoriaNombre: 'Postres', nombre: 'Postre Tres Leches', descripcion: 'Porción individual de tres leches', precio: 80, imagenColor: '#FFE0B2', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p7', tiendaId: 't1', categoriaNombre: 'Combos', nombre: 'Combo Pizza + Alitas + Refresco', descripcion: 'Pizza Margarita + Alitas BBQ + Refresco 2L', precio: 320, precioOriginal: 375, imagenColor: '#FF7043', disponible: true, esNuevo: false, esPopular: true, stock: null },

  // Farmacia San Pablo
  { id: 'p8', tiendaId: 't2', categoriaNombre: 'Medicamentos', nombre: 'Acetaminofén x12', descripcion: 'Tabletas 500mg', precio: 35, imagenColor: '#A5D6A7', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p9', tiendaId: 't2', categoriaNombre: 'Medicamentos', nombre: 'Ibuprofeno x10', descripcion: 'Tabletas 400mg', precio: 42, imagenColor: '#81C784', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p10', tiendaId: 't2', categoriaNombre: 'Vitaminas', nombre: 'Vitamina C x30', descripcion: 'Tabletas efervescentes 1000mg', precio: 85, imagenColor: '#FFF176', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p11', tiendaId: 't2', categoriaNombre: 'Cuidado personal', nombre: 'Protector Solar SPF50', descripcion: 'Frasco 120ml', precio: 190, imagenColor: '#FFE082', disponible: true, esNuevo: true, esPopular: false, stock: null },
  { id: 'p12', tiendaId: 't2', categoriaNombre: 'Cuidado personal', nombre: 'Mascarillas x50', descripcion: 'Mascarillas KN95 desechables', precio: 120, imagenColor: '#B0BEC5', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p13', tiendaId: 't2', categoriaNombre: 'Cuidado personal', nombre: 'Alcohol Gel 500ml', descripcion: 'Gel antibacterial 70%', precio: 65, imagenColor: '#80CBC4', disponible: true, esNuevo: false, esPopular: false, stock: null },

  // Mini Market Don Carlos
  { id: 'p14', tiendaId: 't3', categoriaNombre: 'Lácteos', nombre: 'Leche 1L', descripcion: 'Leche entera pasteurizada', precio: 38, imagenColor: '#F5F5F5', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p15', tiendaId: 't3', categoriaNombre: 'Panadería', nombre: 'Pan Bimbo', descripcion: 'Pan de caja blanco', precio: 52, imagenColor: '#FFE0B2', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p16', tiendaId: 't3', categoriaNombre: 'Granos', nombre: 'Arroz 1kg', descripcion: 'Arroz de primera calidad', precio: 45, imagenColor: '#FFF9C4', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p17', tiendaId: 't3', categoriaNombre: 'Aceites', nombre: 'Aceite 1L', descripcion: 'Aceite vegetal comestible', precio: 68, imagenColor: '#FFF176', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p18', tiendaId: 't3', categoriaNombre: 'Limpieza', nombre: 'Jabón en barra', descripcion: 'Jabón de lavar 400g', precio: 28, imagenColor: '#B3E5FC', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p19', tiendaId: 't3', categoriaNombre: 'Bebidas', nombre: 'Agua botella x6', descripcion: 'Agua purificada 500ml x6', precio: 55, imagenColor: '#B3E5FC', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p20', tiendaId: 't3', categoriaNombre: 'Snacks', nombre: 'Papas fritas', descripcion: 'Bolsa grande 170g', precio: 35, imagenColor: '#FFD54F', disponible: true, esNuevo: false, esPopular: false, stock: null },

  // TechZone
  { id: 'p21', tiendaId: 't4', categoriaNombre: 'Audio', nombre: 'Audífonos Bluetooth', descripcion: 'Audífonos inalámbricos con micrófono', precio: 450, imagenColor: '#37474F', disponible: true, esNuevo: true, esPopular: true, stock: 15 },
  { id: 'p22', tiendaId: 't4', categoriaNombre: 'Cables', nombre: 'Cable USB-C 2m', descripcion: 'Cable de carga rápida USB-C', precio: 120, imagenColor: '#263238', disponible: true, esNuevo: false, esPopular: true, stock: 50 },
  { id: 'p23', tiendaId: 't4', categoriaNombre: 'Cargadores', nombre: 'Cargador 20W', descripcion: 'Cargador rápido USB-C PD 20W', precio: 350, imagenColor: '#455A64', disponible: true, esNuevo: false, esPopular: false, stock: 20 },
  { id: 'p24', tiendaId: 't4', categoriaNombre: 'Fundas', nombre: 'Funda iPhone 15', descripcion: 'Funda silicona premium', precio: 200, imagenColor: '#78909C', disponible: true, esNuevo: true, esPopular: false, stock: 30 },

  // Floristería Rosas
  { id: 'p25', tiendaId: 't5', categoriaNombre: 'Ramos', nombre: 'Ramo de Rosas Rojas', descripcion: '12 rosas rojas con follaje', precio: 450, imagenColor: '#C62828', disponible: true, esNuevo: false, esPopular: true, stock: 5 },
  { id: 'p26', tiendaId: 't5', categoriaNombre: 'Ramos', nombre: 'Ramo Mixto Tropical', descripcion: 'Flores tropicales coloridas', precio: 380, imagenColor: '#FF6F00', disponible: true, esNuevo: true, esPopular: false, stock: null },
  { id: 'p27', tiendaId: 't5', categoriaNombre: 'Arreglos', nombre: 'Arreglo con Globo', descripcion: 'Arreglo floral con globo de felicitación', precio: 520, imagenColor: '#E040FB', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p28', tiendaId: 't5', categoriaNombre: 'Cajas', nombre: 'Caja de Rosas', descripcion: 'Caja elegante con 8 rosas', precio: 350, imagenColor: '#AD1457', disponible: true, esNuevo: false, esPopular: false, stock: null },

  // Super Abarrotes
  { id: 'p29', tiendaId: 't6', categoriaNombre: 'Granos', nombre: 'Frijoles 1kg', descripcion: 'Frijoles rojos de primera', precio: 55, imagenColor: '#795548', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p30', tiendaId: 't6', categoriaNombre: 'Granos', nombre: 'Azúcar 1kg', descripcion: 'Azúcar refinada', precio: 42, imagenColor: '#FAFAFA', disponible: true, esNuevo: false, esPopular: false, stock: null },
  { id: 'p31', tiendaId: 't6', categoriaNombre: 'Lácteos', nombre: 'Huevos x12', descripcion: 'Huevos de gallina frescos', precio: 65, imagenColor: '#FFF8E1', disponible: true, esNuevo: false, esPopular: true, stock: null },
  { id: 'p32', tiendaId: 't6', categoriaNombre: 'Carnes', nombre: 'Pechuga pollo 1kg', descripcion: 'Pechuga de pollo fresca', precio: 120, imagenColor: '#FFCCBC', disponible: true, esNuevo: false, esPopular: false, stock: null },
];

export const MOCK_ORDENES_COMPRA: OrdenCompra[] = [
  {
    id: 'LF-C001', clienteId: 'cliente-1', tiendaId: 't1', tiendaNombre: 'Pizza Express', tiendaLogo: 'PE', tiendaColor: '#FF5722',
    estado: 'entregado', direccionEntrega: 'Col. Los Robles, Managua', metodoPago: 'efectivo',
    items: [{ nombreProducto: 'Pizza Margarita', cantidad: 1, precioUnitario: 180 }, { nombreProducto: 'Refresco 2L', cantidad: 1, precioUnitario: 45 }],
    subtotal: 225, costoEnvio: 20, descuento: 0, total: 245,
    repartidorNombre: 'Carlos Mendoza', repartidorInitials: 'CM', fecha: '2026-06-09', hora: '19:30', calificacion: 5,
  },
  {
    id: 'LF-C002', clienteId: 'cliente-1', tiendaId: 't2', tiendaNombre: 'Farmacia San Pablo', tiendaLogo: 'FS', tiendaColor: '#4CAF50',
    estado: 'en_camino', direccionEntrega: 'Col. Los Robles, Managua', metodoPago: 'transferencia',
    items: [{ nombreProducto: 'Acetaminofén x12', cantidad: 1, precioUnitario: 35 }, { nombreProducto: 'Vitamina C x30', cantidad: 1, precioUnitario: 85 }],
    subtotal: 120, costoEnvio: 15, descuento: 0, total: 135,
    repartidorNombre: 'Ana Torres', repartidorInitials: 'AT', fecha: '2026-06-10', hora: '14:45',
  },
  {
    id: 'LF-C003', clienteId: 'cliente-1', tiendaId: 't3', tiendaNombre: 'Mini Market Don Carlos', tiendaLogo: 'MD', tiendaColor: '#FF9800',
    estado: 'entregado', direccionEntrega: 'Col. Los Robles, Managua', metodoPago: 'efectivo',
    items: [{ nombreProducto: 'Leche 1L', cantidad: 2, precioUnitario: 38 }, { nombreProducto: 'Arroz 1kg', cantidad: 1, precioUnitario: 45 }, { nombreProducto: 'Aceite 1L', cantidad: 1, precioUnitario: 68 }],
    subtotal: 189, costoEnvio: 25, descuento: 36, total: 178, codigoUsado: 'LOGI20',
    repartidorNombre: 'Luis Ramos', repartidorInitials: 'LR', fecha: '2026-06-07', hora: '10:15', calificacion: 4,
  },
];

export const MOCK_RESENAS: ResenaTienda[] = [
  { id: 'r1', tiendaId: 't1', clienteNombre: 'María L.', estrellas: 5, comentario: 'La mejor pizza de Managua, siempre llega caliente!', fecha: '2026-06-08' },
  { id: 'r2', tiendaId: 't1', clienteNombre: 'Pedro R.', estrellas: 4, comentario: 'Muy rica pero tardaron un poco más de lo esperado', fecha: '2026-06-07' },
  { id: 'r3', tiendaId: 't1', clienteNombre: 'Sofía C.', estrellas: 5, comentario: 'Mi pizza favorita, nunca me ha fallado', fecha: '2026-06-05' },
  { id: 'r4', tiendaId: 't2', clienteNombre: 'María L.', estrellas: 5, comentario: 'Llegó súper rápido, muy profesional', fecha: '2026-06-09' },
  { id: 'r5', tiendaId: 't2', clienteNombre: 'Andrés C.', estrellas: 4, comentario: 'Buen servicio y precios justos', fecha: '2026-06-06' },
  { id: 'r6', tiendaId: 't3', clienteNombre: 'María L.', estrellas: 4, comentario: 'Todo fresco y buen precio', fecha: '2026-06-07' },
  { id: 'r7', tiendaId: 't5', clienteNombre: 'Carla M.', estrellas: 5, comentario: 'Las rosas más hermosas, perfecto para el aniversario', fecha: '2026-06-04' },
  { id: 'r8', tiendaId: 't5', clienteNombre: 'Diego S.', estrellas: 5, comentario: 'Llegaron justo a tiempo, excelentes arreglos', fecha: '2026-06-03' },
  { id: 'r9', tiendaId: 't6', clienteNombre: 'Roberto M.', estrellas: 4, comentario: 'Buen surtido y precios competitivos', fecha: '2026-06-05' },
  { id: 'r10', tiendaId: 't6', clienteNombre: 'María L.', estrellas: 5, comentario: 'Todo siempre fresco, mi super de confianza', fecha: '2026-06-02' },
];

/* ═══════════════════════════════════════════════
   ZUSTAND CART STORE
   ═══════════════════════════════════════════════ */

interface MarketplaceState {
  /* Data */
  tiendas: Tienda[];
  productos: Producto[];
  ordenesCompra: OrdenCompra[];
  resenas: ResenaTienda[];
  favoritosTiendas: FavoritoTienda[];
  favoritosProductos: FavoritoProducto[];

  /* Cart */
  cartItems: CartItem[];
  cartCodigoPromo: string;
  cartDescuento: number;
  cartDireccionEntrega: string;
  cartInstrucciones: string;
  cartMetodoPago: 'efectivo' | 'transferencia';
  cartScheduleMode: 'ahora' | 'programar';
  cartScheduleDate: string | null;
  cartScheduleTime: string | null;

  /* UI State */
  explorarCategoria: TiendaCategoria | 'todos';
  explorarFiltros: string[];
  explorarSearch: string;
  tiendaSeleccionada: string | null;
  productoDetalleId: string | null;
  carritoOpen: boolean;
  compraConfirmada: boolean;
  compraConfirmadaId: string;

  /* Actions */
  setExplorarCategoria: (cat: TiendaCategoria | 'todos') => void;
  toggleExplorarFiltro: (filtro: string) => void;
  setExplorarSearch: (q: string) => void;
  setTiendaSeleccionada: (id: string | null) => void;
  setProductoDetalleId: (id: string | null) => void;
  setCarritoOpen: (open: boolean) => void;

  /* Cart Actions */
  addToCart: (producto: Producto, tienda: Tienda) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  setCartCodigoPromo: (code: string) => void;
  setCartDescuento: (desc: number) => void;
  setCartDireccionEntrega: (dir: string) => void;
  setCartInstrucciones: (instr: string) => void;
  setCartMetodoPago: (met: 'efectivo' | 'transferencia') => void;
  setCartScheduleMode: (mode: 'ahora' | 'programar') => void;
  setCartScheduleDate: (date: string | null) => void;
  setCartScheduleTime: (time: string | null) => void;
  confirmarCompra: () => void;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getCartTiendas: () => string[];
  getCartItemsByTienda: (tiendaId: string) => CartItem[];

  /* Favorites */
  toggleFavoritoTienda: (tiendaId: string) => void;
  toggleFavoritoProducto: (productoId: string) => void;
  isFavoritoTienda: (tiendaId: string) => boolean;
  isFavoritoProducto: (productoId: string) => boolean;
}

let _cartIdCounter = 100;

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  /* Data */
  tiendas: MOCK_TIENDAS,
  productos: MOCK_PRODUCTOS,
  ordenesCompra: MOCK_ORDENES_COMPRA,
  resenas: MOCK_RESENAS,
  favoritosTiendas: [{ tiendaId: 't1' }, { tiendaId: 't2' }],
  favoritosProductos: [{ productoId: 'p1' }, { productoId: 'p8' }],

  /* Cart */
  cartItems: [],
  cartCodigoPromo: '',
  cartDescuento: 0,
  cartDireccionEntrega: 'Col. Los Robles, Managua',
  cartInstrucciones: '',
  cartMetodoPago: 'efectivo',
  cartScheduleMode: 'ahora',
  cartScheduleDate: null,
  cartScheduleTime: null,

  /* UI State */
  explorarCategoria: 'todos',
  explorarFiltros: [],
  explorarSearch: '',
  tiendaSeleccionada: null,
  productoDetalleId: null,
  carritoOpen: false,
  compraConfirmada: false,
  compraConfirmadaId: '',

  /* Actions */
  setExplorarCategoria: (cat) => set({ explorarCategoria: cat }),
  toggleExplorarFiltro: (filtro) => set((state) => ({
    explorarFiltros: state.explorarFiltros.includes(filtro)
      ? state.explorarFiltros.filter((f) => f !== filtro)
      : [...state.explorarFiltros, filtro],
  })),
  setExplorarSearch: (q) => set({ explorarSearch: q }),
  setTiendaSeleccionada: (id) => set({ tiendaSeleccionada: id }),
  setProductoDetalleId: (id) => set({ productoDetalleId: id }),
  setCarritoOpen: (open) => set({ carritoOpen: open }),

  /* Cart Actions */
  addToCart: (producto, tienda) => set((state) => {
    const existing = state.cartItems.find((i) => i.productoId === producto.id);
    if (existing) {
      return {
        cartItems: state.cartItems.map((i) =>
          i.id === existing.id ? { ...i, cantidad: i.cantidad + 1 } : i
        ),
      };
    }
    _cartIdCounter++;
    const newItem: CartItem = {
      id: `ci-${_cartIdCounter}`,
      productoId: producto.id,
      tiendaId: producto.tiendaId,
      nombreProducto: producto.nombre,
      precioUnitario: producto.precio,
      cantidad: 1,
      imagenColor: producto.imagenColor,
      notas: '',
    };
    return { cartItems: [...state.cartItems, newItem] };
  }),

  removeFromCart: (itemId) => set((state) => ({
    cartItems: state.cartItems.filter((i) => i.id !== itemId),
  })),

  updateCartItemQty: (itemId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(itemId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((i) =>
        i.id === itemId ? { ...i, cantidad: qty } : i
      ),
    }));
  },

  clearCart: () => set({ cartItems: [], cartCodigoPromo: '', cartDescuento: 0 }),

  setCartCodigoPromo: (code) => set({ cartCodigoPromo: code }),
  setCartDescuento: (desc) => set({ cartDescuento: desc }),
  setCartDireccionEntrega: (dir) => set({ cartDireccionEntrega: dir }),
  setCartInstrucciones: (instr) => set({ cartInstrucciones: instr }),
  setCartMetodoPago: (met) => set({ cartMetodoPago: met }),
  setCartScheduleMode: (mode) => set({ cartScheduleMode: mode }),
  setCartScheduleDate: (date) => set({ cartScheduleDate: date }),
  setCartScheduleTime: (time) => set({ cartScheduleTime: time }),

  confirmarCompra: () => {
    try {
      const state = get();
      const subtotal = state.getCartSubtotal() ?? 0;
      const tiendas = state.getCartTiendas() ?? [];
      const firstTienda = state.tiendas.find((t) => t.id === tiendas[0]);
      const costoEnvio = firstTienda?.costoEnvio ?? 20;
      const total = subtotal + costoEnvio - (state.cartDescuento ?? 0);
      const orderId = `LF-C${Date.now().toString().slice(-4)}`;
      const newOrder: OrdenCompra = {
        id: orderId,
        clienteId: 'cliente-1',
        tiendaId: tiendas[0] || 'tienda-1',
        tiendaNombre: firstTienda?.nombre ?? 'Tienda',
        tiendaLogo: firstTienda?.logoIniciales ?? 'T',
        tiendaColor: firstTienda?.logoColor ?? '#FF5722',
        estado: 'recibido',
        direccionEntrega: state.cartDireccionEntrega || 'Col. Los Robles, Managua',
        metodoPago: state.cartMetodoPago || 'efectivo',
        items: (state.cartItems || []).map((i) => ({
          nombreProducto: i?.nombreProducto ?? 'Producto',
          cantidad: i?.cantidad ?? 1,
          precioUnitario: i?.precioUnitario ?? 0,
        })),
        subtotal,
        costoEnvio,
        descuento: state.cartDescuento ?? 0,
        total,
        codigoUsado: state.cartCodigoPromo || undefined,
        repartidorNombre: 'Carlos Mendoza',
        repartidorInitials: 'CM',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      };
      set((s) => ({
        ordenesCompra: [newOrder, ...(s.ordenesCompra || [])],
        cartItems: [],
        cartCodigoPromo: '',
        cartDescuento: 0,
        compraConfirmada: true,
        compraConfirmadaId: orderId,
      }));
    } catch (err) {
      console.error("Error inside confirmarCompra:", err);
      alert("Error al procesar el pago: " + (err as Error).message);
    }
  },

  getCartSubtotal: () => {
    return get().cartItems.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);
  },

  getCartTotal: () => {
    const state = get();
    const subtotal = state.getCartSubtotal();
    const tiendas = state.getCartTiendas();
    const firstTienda = state.tiendas.find((t) => t.id === tiendas[0]);
    const costoEnvio = firstTienda?.costoEnvio ?? 20;
    return subtotal + costoEnvio - state.cartDescuento;
  },

  getCartItemCount: () => get().cartItems.reduce((sum, i) => sum + i.cantidad, 0),

  getCartTiendas: () => [...new Set(get().cartItems.map((i) => i.tiendaId))],

  getCartItemsByTienda: (tiendaId) => get().cartItems.filter((i) => i.tiendaId === tiendaId),

  /* Favorites */
  toggleFavoritoTienda: (tiendaId) => set((state) => ({
    favoritosTiendas: state.favoritosTiendas.some((f) => f.tiendaId === tiendaId)
      ? state.favoritosTiendas.filter((f) => f.tiendaId !== tiendaId)
      : [...state.favoritosTiendas, { tiendaId }],
  })),

  toggleFavoritoProducto: (productoId) => set((state) => ({
    favoritosProductos: state.favoritosProductos.some((f) => f.productoId === productoId)
      ? state.favoritosProductos.filter((f) => f.productoId !== productoId)
      : [...state.favoritosProductos, { productoId }],
  })),

  isFavoritoTienda: (tiendaId) => get().favoritosTiendas.some((f) => f.tiendaId === tiendaId),
  isFavoritoProducto: (productoId) => get().favoritosProductos.some((f) => f.productoId === productoId),
}));
