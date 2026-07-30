/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * LOGIFAST — Limpieza de datos en Supabase
 * Conserva únicamente los 4 usuarios demo con sus contraseñas encriptadas,
 * eliminando todas las órdenes, productos, tiendas, notificaciones y registros de prueba.
 *
 * Uso:
 *   node scripts/seed-clean.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos de Supabase en LOGIFAST...');

  // 1. Limpieza total de tablas
  try {
    await db.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "ChatRepartidor", "CalificacionRepartidor", "NotificacionRepartidor", "PosicionRepartidor",
        "OrdenServicio", "ItemOrdenCompra", "OrdenCompra", "ResenaTienda", "FavoritoProducto",
        "FavoritoTienda", "Producto", "Tienda", "RepuestoUsado", "Mantenimiento", "Repuesto",
        "AlertaMantenimiento", "Moto", "RepartidorProfile", "User", "Campana", "CodigoPromocional",
        "UsoCodigo", "Banner", "FeedItem", "PlantillaMensaje", "MensajeDirecto", "NotificacionAutomatica",
        "ConfiguracionHorario", "Feriado", "AuditLog", "FeatureFlag", "MediaAsset", "TiendaFollow",
        "ProductoLike", "Comentario", "DireccionCliente", "MetodoPago", "RecargaSaldo", "Story",
        "StoryVista", "DireccionBusqueda", "ActividadUsuario", "ValoracionProducto", "NotificacionPush",
        "SolicitudEnvio", "ZonaCobertura", "CarritoItem"
      CASCADE;
    `);
  } catch (err) {
    console.log('Aviso al limpiar tablas:', err.message);
  }

  console.log('👤 Re-creando únicamente los 4 usuarios demo limpios...');

  const passHash = await bcrypt.hash('123456', 10);

  // Cliente Demo
  const cliente = await db.user.create({
    data: {
      email: 'cliente@logifast.com',
      name: 'María López',
      password: passHash,
      role: 'cliente',
      telefono: '+505 8888-1234',
      initials: 'ML',
      color: '#FF5722',
      emailVerified: true,
    },
  });

  // Repartidor Demo
  const repartidorUser = await db.user.create({
    data: {
      email: 'repartidor@logifast.com',
      name: 'Carlos Martínez',
      password: passHash,
      role: 'repartidor',
      telefono: '+505 8765-4321',
      initials: 'CM',
      color: '#4CAF50',
      emailVerified: true,
    },
  });

  const repProfile = await db.repartidorProfile.create({
    data: {
      userId: repartidorUser.id,
      nombre: repartidorUser.name,
      email: repartidorUser.email,
      telefono: repartidorUser.telefono,
      conectado: true,
      enServicio: false,
      contratoAceptado: true,
      saldo: 500,
    },
  });

  // Moto Demo básica para repartidor
  const moto = await db.moto.create({
    data: {
      nombre: 'Moto-01',
      modelo: 'Honda Wave 110',
      placa: 'M-4521',
      anio: 2024,
      color: '#FF5722',
      estado: 'DISPONIBLE',
      asignadaA: repProfile.id,
    },
  });

  await db.repartidorProfile.update({
    where: { id: repProfile.id },
    data: { motoId: moto.id },
  });

  // Admin Demo
  await db.user.create({
    data: {
      email: 'admin@logifast.com',
      name: 'Administrador LOGIFAST',
      password: passHash,
      role: 'admin',
      telefono: '+505 8999-0000',
      initials: 'AD',
      color: '#2196F3',
      emailVerified: true,
    },
  });

  // Ingeniero Demo
  await db.user.create({
    data: {
      email: 'ingeniero@logifast.com',
      name: 'Ingeniero Demo',
      password: passHash,
      role: 'ingeniero',
      telefono: '+505 8111-2222',
      initials: 'ID',
      color: '#9C27B0',
      emailVerified: true,
    },
  });

  console.log('✅ Base de datos de Supabase limpia con éxito.');
  console.log('\nCredenciales demo disponibles (contraseña: 123456):');
  console.log('  👤 Cliente:    cliente@logifast.com');
  console.log('  🚴 Repartidor: repartidor@logifast.com');
  console.log('  👨‍💼 Admin:      admin@logifast.com');
  console.log('  🔧 Ingeniero:  ingeniero@logifast.com');
}

main()
  .catch((e) => {
    console.error('Error en seed-clean:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
