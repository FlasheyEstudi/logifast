/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * LOGIFAST — Seed completo
 * Crea: 4 usuarios demo (cliente, repartidor, admin, ingeniero),
 * 6 tiendas con productos, motos, repuestos, feriados, horarios,
 * feature flags y órdenes de prueba.
 *
 * Uso:
 *   node scripts/seed.js
 *   o
 *   npx tsx scripts/seed.ts
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

function computeInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function computeColor(seed) {
  const palette = ['#FF5722', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#FF9800', '#00BCD4', '#3F51B5'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

async function main() {
  console.log('🌱 LOGIFAST seed starting...');

  // Limpiar tablas (orden importa por las FK)
  console.log('🧹 Cleaning existing data...');
  try {
    await db.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "ChatRepartidor", "CalificacionRepartidor", "NotificacionRepartidor", "PosicionRepartidor",
        "OrdenServicio", "ItemOrdenCompra", "OrdenCompra", "ResenaTienda", "FavoritoProducto",
        "FavoritoTienda", "Producto", "Tienda", "RepuestoUsado", "Mantenimiento", "Repuesto",
        "AlertaMantenimiento", "Moto", "RepartidorProfile", "User", "Campana", "CodigoPromocional",
        "UsoCodigo", "Banner", "FeedItem", "PlantillaMensaje", "MensajeDirecto", "NotificacionAutomatica",
        "ConfiguracionHorario", "Feriado", "AuditLog", "FeatureFlag", "MediaAsset", "TiendaFollow",
        "ProductoLike", "Comentario", "DireccionCliente", "MetodoPago", "RecargaSaldo", "Story"
      CASCADE;
    `);
  } catch (err) {
    console.log('Truncate fallback to individual deletes:', err.message);
  }
  await db.storyVista.deleteMany();
  await db.direccionBusqueda.deleteMany();
  await db.actividadUsuario.deleteMany();
  await db.valoracionProducto.deleteMany();
  await db.solicitudEnvio.deleteMany();
  await db.zonaCobertura.deleteMany();
  await db.notificacionPush.deleteMany();
  await db.carritoItem.deleteMany();
  await db.passwordReset.deleteMany();
  await db.loginAudit.deleteMany();

  // ─── USERS ───
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  const cliente = await db.user.create({
    data: {
      email: 'cliente@logifast.com',
      name: 'María López',
      password: passwordHash,
      role: 'cliente',
      telefono: '+505 8888-1234',
      initials: 'ML',
      color: '#FF5722',
    },
  });

  const repartidorUser = await db.user.create({
    data: {
      email: 'repartidor@logifast.com',
      name: 'Carlos Martínez',
      password: passwordHash,
      role: 'repartidor',
      telefono: '+505 8765-4321',
      initials: 'CM',
      color: '#4CAF50',
    },
  });

  const admin = await db.user.create({
    data: {
      email: 'admin@logifast.com',
      name: 'Administrador',
      password: passwordHash,
      role: 'admin',
      telefono: '+505 2222-0000',
      initials: 'AD',
      color: '#2196F3',
    },
  });

  const ingeniero = await db.user.create({
    data: {
      email: 'ingeniero@logifast.com',
      name: 'Ingeniero Demo',
      password: passwordHash,
      role: 'ingeniero',
      telefono: '+505 7777-1111',
      initials: 'IN',
      color: '#9C27B0',
    },
  });

  // ─── MOTOS ───
  console.log('🏍️ Creating motos...');
  const motos = [];
  const motoData = [
    { nombre: 'Moto-01', modelo: 'Honda Wave 110', placa: 'M-4521', anio: 2023, color: 'Rojo', kmAcumulados: 12450 },
    { nombre: 'Moto-02', modelo: 'Yamaha YBR 125', placa: 'M-4522', anio: 2022, color: 'Azul', kmAcumulados: 8200 },
    { nombre: 'Moto-03', modelo: 'Suzuki AX 100', placa: 'M-4523', anio: 2024, color: 'Negro', kmAcumulados: 3200 },
    { nombre: 'Moto-04', modelo: 'Honda CG 150', placa: 'M-4524', anio: 2023, color: 'Gris', kmAcumulados: 9800 },
  ];
  for (const m of motoData) {
    motos.push(await db.moto.create({ data: { ...m, estado: 'DISPONIBLE' } }));
  }

  // ─── REPARTIDOR PROFILE ───
  console.log('🚴 Creating repartidor profile...');
  const repartidorProfile = await db.repartidorProfile.create({
    data: {
      userId: repartidorUser.id,
      nombre: repartidorUser.name,
      email: repartidorUser.email,
      telefono: repartidorUser.telefono,
      motoId: motos[0].id,
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
      conectado: false,
      enServicio: false,
      zonaPreferida: 'Centro',
    },
  });

  // Asignar moto-01 al repartidor
  await db.moto.update({
    where: { id: motos[0].id },
    data: { asignadaA: repartidorProfile.id },
  });

  // ─── TIENDAS ───
  console.log('🏪 Creating tiendas...');
  const tiendasData = [
    {
      nombre: 'Pizza Express',
      descripcion: 'La mejor pizza de Managua, hecha al momento con ingredientes frescos',
      categoria: 'comida',
      logoColor: '#FF5722', logoIniciales: 'PE', portadaColor: '#BF360C',
      direccion: 'Centro Comercial Managua, Local 12', lat: 12.1150, lng: -86.2362,
      telefono: '+505 2222-1111', email: 'pedidos@pizzaexpress.com',
      calificacion: 4.7, totalPedidos: 287, tiempoEstimado: '20-30 min',
      costoEnvio: 20, pedidoMinimo: 80,
      zonaCobertura: ['Centro', 'Villa Fontana', 'Los Robles', 'Altamira'],
      verificado: true, popular: true,
      productos: [
        { categoriaNombre: 'Pizzas', nombre: 'Pizza Margarita', descripcion: 'Salsa de tomate, mozzarella y albahaca fresca', precio: 180, imagenColor: '#FF8A65', esPopular: true },
        { categoriaNombre: 'Pizzas', nombre: 'Pizza Pepperoni', descripcion: 'Clásica pizza con pepperoni y queso derretido', precio: 220, imagenColor: '#EF5350', esPopular: true },
        { categoriaNombre: 'Pizzas', nombre: 'Pizza Hawaiana', descripcion: 'Jamón, piña y mozzarella', precio: 200, imagenColor: '#FFD54F' },
        { categoriaNombre: 'Complementos', nombre: 'Alitas BBQ (6 pzas)', descripcion: 'Alitas marinadas en salsa BBQ con dip ranch', precio: 150, imagenColor: '#8D6E63', esNuevo: true },
        { categoriaNombre: 'Bebidas', nombre: 'Refresco 2L', descripcion: 'Coca-Cola, Pepsi o Sprite', precio: 45, imagenColor: '#424242' },
        { categoriaNombre: 'Combos', nombre: 'Combo Pizza + Alitas + Refresco', descripcion: 'Pizza Margarita + Alitas BBQ + Refresco 2L', precio: 320, precioOriginal: 375, imagenColor: '#FF7043', esPopular: true },
      ],
    },
    {
      nombre: 'Farmacia San Pablo',
      descripcion: 'Medicamentos y productos de salud a domicilio',
      categoria: 'farmacia',
      logoColor: '#4CAF50', logoIniciales: 'FS', portadaColor: '#1B5E20',
      direccion: 'Villa Fontana, Managua', lat: 12.0850, lng: -86.2070,
      telefono: '+505 2222-2222', email: 'ventas@farmaciasanpablo.com',
      calificacion: 4.8, totalPedidos: 156, tiempoEstimado: '15-25 min',
      costoEnvio: 15, pedidoMinimo: 30,
      zonaCobertura: ['Villa Fontana', 'Los Robles', 'Centro', 'Bello Horizonte'],
      verificado: true,
      productos: [
        { categoriaNombre: 'Medicamentos', nombre: 'Acetaminofén x12', descripcion: 'Tabletas 500mg', precio: 35, imagenColor: '#A5D6A7', esPopular: true },
        { categoriaNombre: 'Medicamentos', nombre: 'Ibuprofeno x10', descripcion: 'Tabletas 400mg', precio: 42, imagenColor: '#81C784' },
        { categoriaNombre: 'Vitaminas', nombre: 'Vitamina C x30', descripcion: 'Tabletas efervescentes 1000mg', precio: 85, imagenColor: '#FFF176', esPopular: true },
        { categoriaNombre: 'Cuidado personal', nombre: 'Protector Solar SPF50', descripcion: 'Frasco 120ml', precio: 190, imagenColor: '#FFE082', esNuevo: true },
        { categoriaNombre: 'Cuidado personal', nombre: 'Mascarillas x50', descripcion: 'Mascarillas KN95 desechables', precio: 120, imagenColor: '#B0BEC5' },
        { categoriaNombre: 'Cuidado personal', nombre: 'Alcohol Gel 500ml', descripcion: 'Gel antibacterial 70%', precio: 65, imagenColor: '#80CBC4' },
      ],
    },
    {
      nombre: 'Mini Market Don Carlos',
      descripcion: 'Todo lo que necesitas, a la puerta de tu casa',
      categoria: 'tienda',
      logoColor: '#FF9800', logoIniciales: 'MD', portadaColor: '#E65100',
      direccion: 'Col. Los Robles, Managua', lat: 12.1245, lng: -86.2520,
      telefono: '+505 2222-3333', email: 'pedidos@minimarketdoncarlos.com',
      calificacion: 4.5, totalPedidos: 412, tiempoEstimado: '20-35 min',
      costoEnvio: 25, pedidoMinimo: 50,
      zonaCobertura: ['Los Robles', 'Centro', 'Altamira', 'Schick'],
      popular: true,
      productos: [
        { categoriaNombre: 'Lácteos', nombre: 'Leche 1L', descripcion: 'Leche entera pasteurizada', precio: 38, imagenColor: '#F5F5F5' },
        { categoriaNombre: 'Panadería', nombre: 'Pan Bimbo', descripcion: 'Pan de caja blanco', precio: 52, imagenColor: '#FFE0B2' },
        { categoriaNombre: 'Granos', nombre: 'Arroz 1kg', descripcion: 'Arroz de primera calidad', precio: 45, imagenColor: '#FFF9C4', esPopular: true },
        { categoriaNombre: 'Aceites', nombre: 'Aceite 1L', descripcion: 'Aceite vegetal comestible', precio: 68, imagenColor: '#FFF176' },
        { categoriaNombre: 'Limpieza', nombre: 'Jabón en barra', descripcion: 'Jabón de lavar 400g', precio: 28, imagenColor: '#B3E5FC' },
        { categoriaNombre: 'Snacks', nombre: 'Papas fritas', descripcion: 'Bolsa grande 170g', precio: 35, imagenColor: '#FFD54F' },
      ],
    },
    {
      nombre: 'TechZone Managua',
      descripcion: 'Accesorios y gadgets de tecnología con entrega rápida',
      categoria: 'tecnologia',
      logoColor: '#2196F3', logoIniciales: 'TZ', portadaColor: '#0D47A1',
      direccion: 'Galerías Santo Domingo', lat: 12.0900, lng: -86.2180,
      telefono: '+505 2222-4444', email: 'info@techzone.com',
      calificacion: 4.6, totalPedidos: 89, tiempoEstimado: '30-45 min',
      costoEnvio: 30, pedidoMinimo: 200,
      zonaCobertura: ['Centro', 'Santo Domingo', 'Villa Fontana'],
      verificado: true,
      productos: [
        { categoriaNombre: 'Audio', nombre: 'Audífonos Bluetooth', descripcion: 'Audífonos inalámbricos con micrófono', precio: 450, imagenColor: '#37474F', esNuevo: true, esPopular: true, stock: 15 },
        { categoriaNombre: 'Cables', nombre: 'Cable USB-C 2m', descripcion: 'Cable de carga rápida USB-C', precio: 120, imagenColor: '#263238', esPopular: true, stock: 50 },
        { categoriaNombre: 'Cargadores', nombre: 'Cargador 20W', descripcion: 'Cargador rápido USB-C PD 20W', precio: 350, imagenColor: '#455A64', stock: 20 },
        { categoriaNombre: 'Fundas', nombre: 'Funda iPhone 15', descripcion: 'Funda silicona premium', precio: 200, imagenColor: '#78909C', esNuevo: true, stock: 30 },
      ],
    },
    {
      nombre: 'Floristería Rosas',
      descripcion: 'Arreglos florales y regalos para toda ocasión',
      categoria: 'regalos',
      logoColor: '#E91E63', logoIniciales: 'FR', portadaColor: '#880E4F',
      direccion: 'Bello Horizonte, Managua', lat: 12.1300, lng: -86.2800,
      telefono: '+505 2222-5555', email: 'pedidos@rosas.com',
      calificacion: 4.9, totalPedidos: 67, tiempoEstimado: '25-40 min',
      costoEnvio: 35, pedidoMinimo: 150,
      zonaCobertura: ['Bello Horizonte', 'Centro', 'Los Robles'],
      verificado: true, popular: true,
      productos: [
        { categoriaNombre: 'Ramos', nombre: 'Ramo de Rosas Rojas', descripcion: '12 rosas rojas con follaje', precio: 450, imagenColor: '#C62828', esPopular: true, stock: 5 },
        { categoriaNombre: 'Ramos', nombre: 'Ramo Mixto Tropical', descripcion: 'Flores tropicales coloridas', precio: 380, imagenColor: '#FF6F00', esNuevo: true },
        { categoriaNombre: 'Arreglos', nombre: 'Arreglo con Globo', descripcion: 'Arreglo floral con globo de felicitación', precio: 520, imagenColor: '#E040FB', esPopular: true },
        { categoriaNombre: 'Cajas', nombre: 'Caja de Rosas', descripcion: 'Caja elegante con 8 rosas', precio: 350, imagenColor: '#AD1457' },
      ],
    },
    {
      nombre: 'Super Abarrotes',
      descripcion: 'Tu supermercado a domicilio, precios justos siempre',
      categoria: 'supermercado',
      logoColor: '#9C27B0', logoIniciales: 'SA', portadaColor: '#4A148C',
      direccion: 'Monseñor Lezcano, Managua', lat: 12.0980, lng: -86.2310,
      telefono: '+505 2222-6666', email: 'ventas@superabarrotes.com',
      calificacion: 4.4, totalPedidos: 523, tiempoEstimado: '25-35 min',
      costoEnvio: 20, pedidoMinimo: 100,
      zonaCobertura: ['Lezcano', 'Centro', 'Schick', 'Centroamérica'],
      popular: true,
      productos: [
        { categoriaNombre: 'Granos', nombre: 'Frijoles 1kg', descripcion: 'Frijoles rojos de primera', precio: 55, imagenColor: '#795548', esPopular: true },
        { categoriaNombre: 'Granos', nombre: 'Azúcar 1kg', descripcion: 'Azúcar refinada', precio: 42, imagenColor: '#FAFAFA' },
        { categoriaNombre: 'Lácteos', nombre: 'Huevos x12', descripcion: 'Huevos de gallina frescos', precio: 65, imagenColor: '#FFF8E1', esPopular: true },
        { categoriaNombre: 'Carnes', nombre: 'Pechuga pollo 1kg', descripcion: 'Pechuga de pollo fresca', precio: 120, imagenColor: '#FFCCBC' },
      ],
    },
  ];

  for (const td of tiendasData) {
    const { productos, zonaCobertura, ...tiendaFields } = td;
    const tienda = await db.tienda.create({
      data: {
        ...tiendaFields,
        estado: 'activo',
        horario: JSON.stringify({
          lun: { abre: '10:00', cierra: '22:00' },
          mar: { abre: '10:00', cierra: '22:00' },
          mie: { abre: '10:00', cierra: '22:00' },
          jue: { abre: '10:00', cierra: '22:00' },
          vie: { abre: '10:00', cierra: '23:00' },
          sab: { abre: '11:00', cierra: '23:00' },
          dom: { abre: '12:00', cierra: '21:00' },
        }),
        zonaCobertura: JSON.stringify(zonaCobertura),
      },
    });
    for (const p of productos) {
      await db.producto.create({
        data: {
          tiendaId: tienda.id,
          ...p,
          disponible: true,
          esNuevo: p.esNuevo || false,
          esPopular: p.esPopular || false,
          stock: p.stock ?? null,
        },
      });
    }
  }

  // ─── ORDEN DE COMPRA DE EJEMPLO ───
  console.log('📦 Creating sample ordenes...');
  const primeraTienda = await db.tienda.findFirst({ where: { nombre: 'Pizza Express' } });
  if (primeraTienda) {
    const producto = await db.producto.findFirst({ where: { tiendaId: primeraTienda.id } });
    if (producto) {
      await db.ordenCompra.create({
        data: {
          clienteId: cliente.id,
          tiendaId: primeraTienda.id,
          estado: 'entregado',
          direccionEntrega: 'Col. Los Robles, Managua',
          metodoPago: 'efectivo',
          subtotal: 225,
          costoEnvio: 20,
          descuento: 0,
          total: 245,
          items: {
            create: [
              { productoId: producto.id, nombreProducto: 'Pizza Margarita', cantidad: 1, precioUnitario: 180 },
            ],
          },
        },
      });
    }
  }

  // ─── ORDEN DE SERVICIO ACTIVA ───
  console.log('🚀 Creating active orden servicio...');
  await db.ordenServicio.create({
    data: {
      clienteId: cliente.id,
      repartidorId: repartidorProfile.id,
      tipo: 'envio',
      estado: 'asignado',
      origen: 'Col. Los Robles, Managua',
      destino: 'Barrio Monseñor Lezcano',
      origenLat: 12.1289, origenLng: -86.2451,
      destinoLat: 12.1421, destinoLng: -86.2287,
      paquete: 'Documentos importantes',
      tamano: 'Pequeño',
      fragil: false,
      metodoPago: 'efectivo',
      monto: 120,
      ganancia: 45,
      kmEstimados: 3.2,
      tiempoEstimado: 12,
      clienteNombre: cliente.name,
      clienteTelefono: cliente.telefono,
    },
  });

  // ─── NOTIFICACIONES REPARTIDOR ───
  console.log('🔔 Creating notificaciones...');
  await db.notificacionRepartidor.create({
    data: {
      repartidorId: repartidorProfile.id,
      tipo: 'orden_asignada',
      titulo: 'Nueva orden asignada',
      contenido: 'LF-001 — Envío de paquete',
      leido: false,
    },
  });

  // ─── REPUESTOS ───
  console.log('🔧 Creating repuestos...');
  const repuestosData = [
    { nombre: 'Filtro de aceite Honda Wave', categoria: 'ACEITE', sku: 'FA-HW-001', precioUnitario: 120, stock: 10, stockMinimo: 5, unidad: 'pza', compatibleCon: ['Honda Wave 110'] },
    { nombre: 'Aceite Mobil 1L', categoria: 'ACEITE', sku: 'AC-MB-1L', precioUnitario: 180, stock: 15, stockMinimo: 5, unidad: 'litro', compatibleCon: ['Honda Wave 110', 'Yamaha YBR 125', 'Suzuki AX 100'] },
    { nombre: 'Pastillas de freno delanteras', categoria: 'FRENO', sku: 'PF-DEL-001', precioUnitario: 250, stock: 8, stockMinimo: 4, unidad: 'juego', compatibleCon: ['Honda Wave 110', 'Honda CG 150'] },
    { nombre: 'Llanta trasera 2.75-18', categoria: 'LLANTA', sku: 'LL-TR-27518', precioUnitario: 850, stock: 6, stockMinimo: 3, unidad: 'pza', compatibleCon: ['Honda Wave 110', 'Yamaha YBR 125'] },
    { nombre: 'Cadena de transmisión 428H', categoria: 'CADENA', sku: 'CD-428H', precioUnitario: 420, stock: 4, stockMinimo: 2, unidad: 'pza', compatibleCon: ['Honda Wave 110', 'Suzuki AX 100'] },
    { nombre: 'Bujía NGK CR8HSA', categoria: 'ELECTRICO', sku: 'BJ-NGK-CR8', precioUnitario: 65, stock: 20, stockMinimo: 10, unidad: 'pza', compatibleCon: ['Honda Wave 110', 'Honda CG 150'] },
  ];
  for (const r of repuestosData) {
    await db.repuesto.create({
      data: {
        ...r,
        compatibleCon: JSON.stringify(r.compatibleCon),
      },
    });
  }

  // ─── MANTENIMIENTOS ───
  console.log('📅 Creating mantenimientos...');
  await db.mantenimiento.create({
    data: {
      motoId: motos[0].id,
      tipo: 'PREVENTIVO',
      categoria: 'CAMBIO_ACEITE',
      descripcion: 'Cambio de aceite y filtro',
      kmAlMomento: 12000,
      costoManoObra: 100,
      costoRepuestos: 300,
      costoTotal: 400,
      estado: 'COMPLETADO',
      prioridad: 'NORMAL',
      iniciadoEn: new Date(Date.now() - 30 * 86400_000),
      completadoEn: new Date(Date.now() - 30 * 86400_000 + 86400_000),
      tecnicoId: ingeniero.id,
    },
  });

  await db.mantenimiento.create({
    data: {
      motoId: motos[1].id,
      tipo: 'PREVENTIVO',
      categoria: 'FRENO',
      descripcion: 'Cambio de pastillas de freno',
      kmAlMomento: 8000,
      costoManoObra: 80,
      costoRepuestos: 250,
      costoTotal: 330,
      estado: 'PROGRAMADO',
      prioridad: 'NORMAL',
      programadoPara: new Date(Date.now() + 7 * 86400_000),
      tecnicoId: ingeniero.id,
    },
  });

  // ─── ALERTAS ───
  await db.alertaMantenimiento.create({
    data: {
      motoId: motos[2].id,
      tipo: 'KM',
      descripcion: 'Mantenimiento preventivo a los 5000 km',
      kmTrigger: 5000,
      activa: true,
    },
  });

  // ─── HORARIOS ───
  console.log('⏰ Creating horarios...');
  for (let dia = 0; dia < 7; dia++) {
    await db.configuracionHorario.create({
      data: {
        dia,
        horaInicio: '07:00',
        horaFin: '22:00',
        activo: true,
        recargoNocturno: dia === 5 || dia === 6 ? 10 : 0,
      },
    });
  }

  // ─── FERIADOS ───
  console.log('🎉 Creating feriados...');
  const year = new Date().getFullYear();
  const feriados = [
    { fecha: `${year}-01-01`, nombre: 'Año Nuevo', recargo: 30 },
    { fecha: `${year}-05-01`, nombre: 'Día del Trabajo', recargo: 20 },
    { fecha: `${year}-07-19`, nombre: 'Día de la Revolución', recargo: 20 },
    { fecha: `${year}-09-14`, nombre: 'Batalla de San Jacinto', recargo: 15 },
    { fecha: `${year}-09-15`, nombre: 'Independencia', recargo: 20 },
    { fecha: `${year}-12-25`, nombre: 'Navidad', recargo: 30 },
  ];
  for (const f of feriados) {
    await db.feriado.create({ data: { ...f, fecha: new Date(f.fecha) } });
  }

  // ─── FEATURE FLAGS ───
  console.log('🚩 Creating feature flags...');
  await db.featureFlag.createMany({
    data: [
      { nombre: 'marketplace', descripcion: 'Marketplace de tiendas', habilitado: true },
      { nombre: 'marketing_campaigns', descripcion: 'Campañas de marketing', habilitado: true },
      { nombre: 'ingeniero_module', descripcion: 'Módulo de ingeniería y flota', habilitado: true },
      { nombre: 'pago_online', descripcion: 'Pago online con tarjeta', habilitado: false },
      { nombre: 'chat_realtime', descripcion: 'Chat en tiempo real', habilitado: true },
    ],
  });

  // ─── CÓDIGOS PROMOCIONALES ───
  console.log('🎟️ Creating códigos promocionales...');
  await db.codigoPromocional.create({
    data: {
      codigo: 'LOGI20',
      tipoDescuento: 'porcentaje',
      valor: 20,
      aplicableA: 'todos',
      maxUsos: 100,
      usosActuales: 12,
      segmento: 'todos',
      vigenciaInicio: new Date(Date.now() - 30 * 86400_000),
      vigenciaFin: new Date(Date.now() + 60 * 86400_000),
      estado: 'activo',
      creadoPor: admin.id,
    },
  });
  await db.codigoPromocional.create({
    data: {
      codigo: 'BIENVENIDA',
      tipoDescuento: 'monto',
      valor: 50,
      aplicableA: 'primer_envio',
      maxUsos: 0,
      usosActuales: 0,
      segmento: 'nuevos',
      vigenciaInicio: new Date(),
      vigenciaFin: new Date(Date.now() + 365 * 86400_000),
      estado: 'activo',
      creadoPor: admin.id,
    },
  });

  // ─── BANNERS ───
  console.log('🖼️ Creating banners...');
  await db.banner.create({
    data: {
      titulo: '¡20% OFF en tu primer envío!',
      subtitulo: 'Usa el código LOGI20',
      tipo: 'promo_grande',
      colorFondo: '#FF5722',
      colorTexto: '#FFFFFF',
      botonTexto: 'Solicitar envío',
      botonAccion: 'navigate',
      botonLink: '/solicitar',
      segmento: 'todos',
      mostrarEn: 'app',
      posicion: 0,
      estado: 'activo',
      creadoPor: admin.id,
    },
  });

  // ─── PLANTILLAS DE MENSAJE ───
  console.log('📝 Creating plantillas...');
  await db.plantillaMensaje.createMany({
    data: [
      { nombre: 'Orden Creada', categoria: 'orden', contenido: 'Tu orden {{ordenId}} ha sido creada. Repartidor en camino.', variables: '["ordenId"]', esDefault: true },
      { nombre: 'Orden Entregada', categoria: 'orden', contenido: 'Tu orden {{ordenId}} ha sido entregada. ¡Califica al repartidor!', variables: '["ordenId"]' },
      { nombre: 'Promo Bienvenida', categoria: 'promocion', contenido: '¡Bienvenido a Logifast! Usa {{codigo}} para 20% off.', variables: '["codigo"]' },
    ],
  });

  // ─── NOTIFICACIONES AUTOMÁTICAS ───
  console.log('🤖 Creating notificaciones automáticas...');
  await db.notificacionAutomatica.createMany({
    data: [
      { evento: 'orden_creada', etiqueta: 'Orden Creada', canal: 'push', plantilla: 'Tu orden ha sido creada', destinatario: 'cliente' },
      { evento: 'orden_aceptada', etiqueta: 'Orden Aceptada', canal: 'push', plantilla: 'El repartidor va en camino', destinatario: 'cliente' },
      { evento: 'orden_entregada', etiqueta: 'Orden Entregada', canal: 'push', plantilla: 'Tu orden fue entregada', destinatario: 'cliente' },
      { evento: 'orden_asignada', etiqueta: 'Nueva Orden', canal: 'push', plantilla: 'Nueva orden asignada', destinatario: 'repartidor' },
      { evento: 'orden_calificada', etiqueta: 'Calificación Recibida', canal: 'push', plantilla: 'El cliente calificó tu servicio', destinatario: 'repartidor' },
    ],
  });

  // ─── ZONAS DE COBERTURA ───
  console.log('📍 Creating zonas de cobertura...');
  const zonas = [
    { nombre: 'Centro', descripcion: 'Casco urbano de Managua', lat: 12.1364, lng: -86.2581, radio: 5 },
    { nombre: 'Los Robles', descripcion: 'Colonia residencial', lat: 12.1245, lng: -86.2520, radio: 3 },
    { nombre: 'Villa Fontana', descripcion: 'Zona este', lat: 12.0850, lng: -86.2070, radio: 3 },
    { nombre: 'Bello Horizonte', descripcion: 'Zona norte', lat: 12.1300, lng: -86.2800, radio: 3 },
    { nombre: 'Monseñor Lezcano', descripcion: 'Zona oeste', lat: 12.0980, lng: -86.2310, radio: 3 },
    { nombre: 'Altamira', descripcion: 'Colonia Altamira', lat: 12.1150, lng: -86.2400, radio: 2 },
  ];
  for (const z of zonas) {
    await db.zonaCobertura.create({ data: z });
  }

  // ─── DIRECCIONES DEL CLIENTE ───
  console.log('🏠 Creating direcciones del cliente...');
  await db.direccionCliente.create({
    data: {
      clienteId: cliente.id,
      etiqueta: 'Casa',
      direccion: 'Col. Los Robles, Managua',
      lat: 12.1245,
      lng: -86.2520,
      referencia: 'Portón negro, casa esquinera',
      predeterminada: true,
    },
  });
  await db.direccionCliente.create({
    data: {
      clienteId: cliente.id,
      etiqueta: 'Trabajo',
      direccion: 'Centro Comercial Managua, Local 24',
      lat: 12.1150,
      lng: -86.2362,
      referencia: 'Oficina 24, segundo piso',
    },
  });

  // ─── MÉTODOS DE PAGO DEL CLIENTE ───
  console.log('💳 Creating métodos de pago...');
  await db.metodoPago.create({
    data: {
      clienteId: cliente.id,
      tipo: 'tarjeta',
      titular: 'Maria Lopez',
      ultimos4: '4242',
      marca: 'Visa',
      vencimiento: '12/26',
      predeterminado: true,
    },
  });
  await db.metodoPago.create({
    data: {
      clienteId: cliente.id,
      tipo: 'efectivo',
      titular: null,
    },
  });

  // ─── STORIES ───
  console.log('📸 Creating stories...');
  await db.story.create({
    data: {
      tipo: 'promo',
      titulo: '¡20% OFF!',
      descripcion: 'Usa el código LOGI20 en tu primer envío',
      colorFondo: '#FF5722',
      link: '/solicitar',
      activo: true,
      expiraEn: new Date(Date.now() + 24 * 3600_000),
    },
  });
  await db.story.create({
    data: {
      tipo: 'novedad',
      titulo: 'Pizza Express',
      descripcion: 'Nueva tienda disponible — ¡Pide ahora!',
      colorFondo: '#BF360C',
      tiendaId: (await db.tienda.findFirst({ where: { nombre: 'Pizza Express' } }))?.id,
      activo: true,
      expiraEn: new Date(Date.now() + 48 * 3600_000),
    },
  });
  await db.story.create({
    data: {
      tipo: 'promo',
      titulo: 'Fin de semana',
      descripcion: 'Envío gratis en pedidos mayores a C$ 200',
      colorFondo: '#4CAF50',
      activo: true,
      expiraEn: new Date(Date.now() + 12 * 3600_000),
    },
  });

  // ─── RECARGAS DE SALDO DEL REPARTIDOR ───
  console.log('💰 Creating recargas...');
  await db.recargaSaldo.create({
    data: {
      repartidorId: repartidorProfile.id,
      monto: 150,
      metodo: 'codigo',
      codigo: 'LF-INICIO-150',
      estado: 'completada',
      referencia: 'seed',
    },
  });
  await db.recargaSaldo.create({
    data: {
      repartidorId: repartidorProfile.id,
      monto: 300,
      metodo: 'transferencia',
      estado: 'completada',
      referencia: 'TRX-001',
    },
  });

  // ─── FOLLOWS DEL CLIENTE ───
  console.log('👥 Creating follows...');
  const tiendaPizza = await db.tienda.findFirst({ where: { nombre: 'Pizza Express' } });
  const tiendaFarmacia = await db.tienda.findFirst({ where: { nombre: 'Farmacia San Pablo' } });
  if (tiendaPizza) await db.tiendaFollow.create({ data: { clienteId: cliente.id, tiendaId: tiendaPizza.id } });
  if (tiendaFarmacia) await db.tiendaFollow.create({ data: { clienteId: cliente.id, tiendaId: tiendaFarmacia.id } });

  // ─── COMENTARIOS EN UN PRODUCTO ───
  console.log('💬 Creating comentarios...');
  const pizzaMargarita = await db.producto.findFirst({ where: { nombre: 'Pizza Margarita' } });
  if (pizzaMargarita) {
    await db.comentario.create({
      data: {
        entidad: 'producto',
        entidadId: pizzaMargarita.id,
        autorId: cliente.id,
        autorNombre: cliente.name,
        autorInitials: 'ML',
        autorColor: '#FF5722',
        contenido: 'La mejor pizza de Managua, siempre llega caliente!',
      },
    });
  }

  // ─── NOTIFICACIONES PUSH ───
  console.log('🔔 Creating notificaciones push...');
  await db.notificacionPush.create({
    data: {
      userId: cliente.id,
      titulo: '¡Bienvenido a Logifast!',
      contenido: 'Tu primera orden tiene 20% de descuento con el código LOGI20',
      tipo: 'promo',
      leida: false,
    },
  });
  await db.notificacionPush.create({
    data: {
      userId: repartidorUser.id,
      titulo: 'Nueva orden asignada',
      contenido: 'LF-001 — Envío de paquete',
      tipo: 'orden',
      leida: false,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('Demo credentials (all with password "123456"):');
  console.log('  👤 Cliente:    cliente@logifast.com');
  console.log('  🚴 Repartidor: repartidor@logifast.com');
  console.log('  👨‍💼 Admin:      admin@logifast.com');
  console.log('  🔧 Ingeniero:  ingeniero@logifast.com');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
