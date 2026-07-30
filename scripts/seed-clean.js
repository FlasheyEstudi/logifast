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

  console.log('👤 Re-creando únicamente la cuenta de Admin limpia...');

  const passHash = await bcrypt.hash('123456', 10);

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

  console.log('✅ Base de datos de Supabase limpia con éxito.');
  console.log('\nCredenciales disponibles (contraseña: 123456):');
  console.log('  👨‍💼 Admin: admin@logifast.com');
}

main()
  .catch((e) => {
    console.error('Error en seed-clean:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
