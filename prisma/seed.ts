import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando reseteo y sembrado inicial de base de datos...');

  const defaultPassword = await bcrypt.hash('123456', 10);

  // 1. Crear Usuarios Demo
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@logifast.com' },
    update: {},
    create: {
      name: 'Admin LogiFast',
      email: 'admin@logifast.com',
      password: defaultPassword,
      role: 'admin',
      telefono: '8888-0000',
    },
  });

  const userCliente = await prisma.user.upsert({
    where: { email: 'cliente@logifast.com' },
    update: {},
    create: {
      name: 'Carlos Mendoza',
      email: 'cliente@logifast.com',
      password: defaultPassword,
      role: 'cliente',
      telefono: '8888-1111',
    },
  });

  const userRepartidor = await prisma.user.upsert({
    where: { email: 'repartidor@logifast.com' },
    update: {},
    create: {
      name: 'Juan Perez',
      email: 'repartidor@logifast.com',
      password: defaultPassword,
      role: 'repartidor',
      telefono: '8888-2222',
      color: '#10B981',
    },
  });

  const userIngeniero = await prisma.user.upsert({
    where: { email: 'ingeniero@logifast.com' },
    update: {},
    create: {
      name: 'Roberto Martinez',
      email: 'ingeniero@logifast.com',
      password: defaultPassword,
      role: 'ingeniero',
      telefono: '8888-3333',
    },
  });

  // 2. Crear Repartidor Profile
  await prisma.repartidorProfile.upsert({
    where: { userId: userRepartidor.id },
    update: {},
    create: {
      userId: userRepartidor.id,
      nombre: userRepartidor.name,
      email: userRepartidor.email,
      telefono: userRepartidor.telefono,
      vehiculoTipo: 'moto',
      conectado: true,
      enServicio: false,
      lat: 12.1365,
      lng: -86.2514,
    },
  });

  // 3. Crear Tienda Demo (limpia sin URLs antiguas pesadas)
  const tiendaDemo = await prisma.tienda.create({
    data: {
      nombre: 'Sabor Nica Restaurant',
      descripcion: 'Comida tradicional nicaragüense y desayunos',
      categoria: 'comida',
      direccion: 'Rotonda El Güegüense 2c abajo, Managua',
      lat: 12.1350,
      lng: -86.2500,
      telefono: '2222-5555',
      whatsapp: '8888-5555',
      email: 'contacto@sabornica.com',
      horario: '8:00 AM - 9:00 PM',
      estado: 'activo',
      costoEnvio: 25,
      pedidoMinimo: 50,
      logoIniciales: 'SN',
      logoColor: '#0066FF',
    },
  });

  // 4. Crear Productos de Tienda
  await prisma.producto.createMany({
    data: [
      {
        tiendaId: tiendaDemo.id,
        nombre: 'Gallo Pinto con Queso y Tortilla',
        descripcion: 'Desayuno típico con platano frito y crema',
        precio: 120,
        categoriaNombre: 'Desayunos',
        disponible: true,
        stock: 50,
      },
      {
        tiendaId: tiendaDemo.id,
        nombre: 'Nacatamal Tradicional',
        descripcion: 'Nacatamal de cerdo con pan o tortilla',
        precio: 150,
        categoriaNombre: 'Especialidades',
        disponible: true,
        stock: 30,
      },
      {
        tiendaId: tiendaDemo.id,
        nombre: 'Carne Asada Típica',
        descripcion: 'Plato con carne asada, gallo pinto, tajadas y ensalada',
        precio: 220,
        categoriaNombre: 'Almuerzos',
        disponible: true,
        stock: 40,
      },
    ],
  });

  // 5. Crear Motos e Inventario de Ingeniero
  await prisma.moto.createMany({
    data: [
      { id: 'moto01', nombre: 'Moto-01', modelo: 'Honda Wave 110', placa: 'M 4521', anio: 2024, kmAcumulados: 12500, estado: 'DISPONIBLE' },
      { id: 'moto02', nombre: 'Moto-02', modelo: 'Yamaha YBR 125', placa: 'M 5100', anio: 2025, kmAcumulados: 8900, estado: 'DISPONIBLE' },
      { id: 'moto03', nombre: 'Moto-03', modelo: 'Honda Wave 110', placa: 'M 4525', anio: 2023, kmAcumulados: 22100, estado: 'EN_MANTENIMIENTO' },
    ],
  });

  await prisma.repuesto.createMany({
    data: [
      { id: 'rep001', nombre: 'Aceite 10W-40 1L', categoria: 'ACEITE', sku: 'ACE-1040', precioUnitario: 250, stock: 15, stockMinimo: 8, unidad: 'litro', compatibleCon: JSON.stringify(['Honda Wave 110', 'Yamaha YBR 125']) },
      { id: 'rep002', nombre: 'Filtro de aceite Honda', categoria: 'ACEITE', sku: 'FIL-ACE', precioUnitario: 200, stock: 6, stockMinimo: 5, unidad: 'pza', compatibleCon: JSON.stringify(['Honda Wave 110']) },
      { id: 'rep003', nombre: 'Pastillas de freno delanteras', categoria: 'FRENO', sku: 'FRE-PAS', precioUnitario: 350, stock: 4, stockMinimo: 5, unidad: 'juego', compatibleCon: JSON.stringify(['Honda Wave 110']) },
    ],
  });

  console.log('Sembrado inicial completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
